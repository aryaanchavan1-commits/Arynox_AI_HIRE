from __future__ import annotations
import base64
import logging
from datetime import datetime, timezone

import cv2
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from proctoring.face_analyzer import FaceAnalyzer
from proctoring.screen_analyzer import ScreenAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/proctoring", tags=["proctoring"])

_face = FaceAnalyzer()
_screen = ScreenAnalyzer()

_proctoring_results: dict[str, dict] = {}
_MAX_ALERTS_PER_SESSION = 500   # cap stored alerts per interview
_MAX_SESSIONS = 200             # cap concurrent tracked interviews


def _decode_image(raw: bytes):
    arr = np.frombuffer(raw, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


def _record_result(interview_id: str, key: str, result: dict) -> None:
    """Store the latest analysis per interview with bounded memory usage."""
    # Evict oldest sessions if we're tracking too many
    if len(_proctoring_results) >= _MAX_SESSIONS and interview_id not in _proctoring_results:
        oldest = next(iter(_proctoring_results))
        _proctoring_results.pop(oldest, None)
    session = _proctoring_results.setdefault(interview_id, {})
    session[key] = result
    alerts = session.setdefault("alerts", [])
    alerts.extend(result.get("alerts", []))
    # Keep the most recent alerts only
    if len(alerts) > _MAX_ALERTS_PER_SESSION:
        del alerts[:-_MAX_ALERTS_PER_SESSION]


class FrameRequest(BaseModel):
    frame: str = Field(..., description="Base64-encoded JPEG frame")
    interview_id: str = Field(...)


class ScreenRequest(BaseModel):
    screenshot: str = Field(..., description="Base64-encoded JPEG screenshot")
    interview_id: str = Field(...)


@router.post("/analyze-frame")
async def analyze_frame(req: FrameRequest):
    try:
        frame_data = base64.b64decode(req.frame)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 frame data")

    frame = _decode_image(frame_data)
    if frame is None:
        raise HTTPException(status_code=400, detail="Could not decode frame image")

    face_bboxes = _face.detect_faces(frame)
    face_count = len(face_bboxes)
    multiple_faces = face_count > 1
    gaze = _face.estimate_gaze(frame)
    expression = _face.analyze_expression(frame)

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "face_count": face_count,
        "multiple_faces": multiple_faces,
        "gaze": gaze,
        "expression": expression,
        "face_present": face_count > 0,
        "alerts": [],
    }

    if multiple_faces:
        result["alerts"].append("multiple_faces_detected")
    if not face_bboxes:
        result["alerts"].append("no_face_detected")
    if gaze == "looking_away":
        result["alerts"].append("gaze_away_from_screen")
    if gaze == "eyes_closed":
        result["alerts"].append("eyes_closed")
    if expression.get("fatigue", 0) > 0.7:
        result["alerts"].append("high_fatigue")

    _record_result(req.interview_id, "last_frame", result)

    return result


@router.post("/analyze-screen")
async def analyze_screen(req: ScreenRequest):
    try:
        screen_data = base64.b64decode(req.screenshot)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 screenshot data")

    screen_img = _decode_image(screen_data)
    if screen_img is None:
        raise HTTPException(status_code=400, detail="Could not decode screenshot image")

    text_density = _screen.detect_text_density(screen_img)
    browser_tabs = _screen.detect_browser_tabs(screen_img)
    content = _screen.analyze_content(screen_img)

    result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "text_density": text_density,
        "browser_tabs": browser_tabs,
        "content_analysis": content,
        "alerts": [],
    }

    if content.get("suspicious_content"):
        result["alerts"].append("suspicious_screen_content")
    if text_density > 0.5:
        result["alerts"].append("high_text_density")
    if browser_tabs.get("tab_count", 1) > 3:
        result["alerts"].append("multiple_browser_tabs")

    _record_result(req.interview_id, "last_screen", result)

    return result


@router.get("/status")
async def proctoring_status():
    return {
        "status": "active",
        "capabilities": {
            "face_detection": True,
            "eye_detection": True,
            "gaze_estimation": True,
            "expression_analysis": True,
            "multiple_face_detection": True,
            "text_density_analysis": True,
            "browser_tab_detection": True,
            "content_analysis": True,
        },
        "engine": "opencv-yunet-dnn",
        "active_sessions": len(_proctoring_results),
    }


@router.get("/results/{interview_id}")
async def get_results(interview_id: str):
    results = _proctoring_results.get(interview_id)
    if not results:
        raise HTTPException(status_code=404, detail="No proctoring results for this interview")
    return results
