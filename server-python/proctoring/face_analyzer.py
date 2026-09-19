"""Face analyzer using OpenCV DNN face detector."""
from __future__ import annotations
import cv2
import numpy as np
import os
from typing import List, Tuple, Optional, Dict

# Try to use FaceDetectorYN (DNN-based) - available in OpenCV 5.x
_face_detector = None
_dir = os.path.dirname(__file__)
_model_candidates = [
    os.path.join(_dir, "face_detection_yunet_2026may.onnx"),
    os.path.join(_dir, "face_detection_yunet_2023mar.onnx"),
]
_model_path = None


def _get_detector():
    global _face_detector
    if _face_detector is None:
        for p in _model_candidates:
            if os.path.exists(p):
                _model_path = p
                break
        if _model_path:
            try:
                _face_detector = cv2.FaceDetectorYN_create(_model_path, "", (320, 320))
            except Exception:
                _face_detector = False
        else:
            _face_detector = False
    return _face_detector


class FaceAnalyzer:
    def __init__(self):
        self._detector = _get_detector()

    def detect_faces(self, frame: np.ndarray) -> List[dict]:
        """Detect faces and return bounding boxes with keypoints."""
        if self._detector is False or frame is None:
            return []
        try:
            h, w = frame.shape[:2]
            self._detector.setInputSize((w, h))
            success, faces = self._detector.detect(frame)
            if not success or faces is None:
                return []
            results = []
            for face in faces:
                x, y, fw, fh = int(face[0]), int(face[1]), int(face[2]), int(face[3])
                results.append({
                    "bbox": [x, y, fw, fh],
                    "confidence": float(face[4]) if len(face) > 4 else 0.9,
                    "left_eye": (int(face[5]), int(face[6])) if len(face) > 6 else None,
                    "right_eye": (int(face[7]), int(face[8])) if len(face) > 8 else None,
                    "nose": (int(face[9]), int(face[10])) if len(face) > 10 else None,
                    "left_mouth": (int(face[11]), int(face[12])) if len(face) > 12 else None,
                    "right_mouth": (int(face[13]), int(face[14])) if len(face) > 14 else None,
                })
            return results
        except Exception:
            return []

    def check_face_present(self, frame: np.ndarray) -> bool:
        return len(self.detect_faces(frame)) > 0

    def count_faces(self, frame: np.ndarray) -> int:
        return len(self.detect_faces(frame))

    def detect_multiple_faces(self, frame: np.ndarray) -> bool:
        return self.count_faces(frame) > 1

    def estimate_gaze(self, frame: np.ndarray, face_bbox: Optional[Tuple] = None) -> str:
        """Estimate if looking at screen, looking away, or eyes closed."""
        faces = self.detect_faces(frame)
        if not faces:
            return "no_face"

        face = faces[0]
        left_eye = face.get("left_eye")
        right_eye = face.get("right_eye")

        if not left_eye or not right_eye:
            return "looking_at_screen"

        x, y, w, h = face["bbox"]
        eye_center_y = (left_eye[1] + right_eye[1]) / 2
        face_center_y = y + h / 2

        # Simple heuristic: if eyes are in upper half of face, looking at screen
        relative_y = (eye_center_y - y) / h if h > 0 else 0.5

        if relative_y < 0.3:
            return "looking_away"

        # Check if eyes are roughly level (looking straight)
        eye_dx = abs(left_eye[0] - right_eye[0])
        eye_dy = abs(left_eye[1] - right_eye[1])

        if eye_dy > eye_dx * 0.3:
            return "looking_away"

        return "looking_at_screen"

    def analyze_expression(self, frame: np.ndarray, face_bbox: Optional[Tuple] = None) -> dict:
        """Analyze face for attention, fatigue, engagement."""
        faces = self.detect_faces(frame)
        if not faces:
            return {"attention": 0.0, "fatigue": 0.0, "engagement": 0.0}

        face = faces[0]
        left_eye = face.get("left_eye")
        right_eye = face.get("right_eye")

        attention = 0.7
        fatigue = 0.2
        engagement = 0.6

        if left_eye and right_eye:
            eye_distance = abs(left_eye[1] - right_eye[1])
            x, y, w, h = face["bbox"]
            if h > 0:
                relative_eye_dist = eye_distance / h
                if relative_eye_dist < 0.02:
                    fatigue = 0.7
                    attention = 0.3
                else:
                    attention = 0.8
                    fatigue = 0.1

        face_center_x = face["bbox"][0] + face["bbox"][2] / 2
        frame_center_x = frame.shape[1] / 2
        offset = abs(face_center_x - frame_center_x) / frame.shape[1]
        engagement = max(0.3, 0.8 - offset)

        return {
            "attention": round(attention, 2),
            "fatigue": round(fatigue, 2),
            "engagement": round(engagement, 2),
        }
