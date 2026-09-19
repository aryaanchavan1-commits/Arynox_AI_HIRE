import cv2
import numpy as np
import logging

logger = logging.getLogger(__name__)


class ScreenAnalyzer:
    def _decode(self, frame):
        if isinstance(frame, str):
            import base64
            data = base64.b64decode(frame)
            arr = np.frombuffer(data, dtype=np.uint8)
            return cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return frame

    def _gray(self, frame):
        if len(frame.shape) == 3:
            return cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        return frame

    def detect_text_density(self, frame) -> float:
        try:
            img = self._decode(frame)
            if img is None:
                return 0.0
            gray = self._gray(img)
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            text_area = sum(cv2.contourArea(c) for c in contours)
            total_area = gray.shape[0] * gray.shape[1]
            density = min(1.0, text_area / max(total_area, 1))
            return round(density, 4)
        except Exception as e:
            logger.error("detect_text_density error: %s", e)
            return 0.0

    def detect_browser_tabs(self, screenshot) -> dict:
        try:
            img = self._decode(screenshot)
            if img is None:
                return {"tab_count": 1, "confidence": 0.0}
            gray = self._gray(img)
            h, w = gray.shape[:2]

            _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            tab_candidates = []
            for c in contours:
                x, y, cw, ch = cv2.boundingRect(c)
                if ch < h * 0.05 and cw > w * 0.05 and y < h * 0.15:
                    tab_candidates.append(cw)

            tab_count = max(1, len(tab_candidates))
            confidence = min(1.0, len(tab_candidates) * 0.15)

            return {"tab_count": tab_count, "confidence": round(confidence, 3)}
        except Exception as e:
            logger.error("detect_browser_tabs error: %s", e)
            return {"tab_count": 1, "confidence": 0.0}

    def analyze_content(self, frame) -> dict:
        try:
            img = self._decode(frame)
            if img is None:
                return {
                    "has_code_editor": False,
                    "has_notes": False,
                    "has_browser": False,
                    "suspicious_content": False,
                }

            gray = self._gray(img)
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV) if len(img.shape) == 3 else None
            h, w = gray.shape[:2]

            has_code_editor = False
            has_notes = False
            has_browser = False

            text_density = self.detect_text_density(img)

            if hsv is not None:
                dark_mask = cv2.inRange(hsv, (0, 0, 0), (180, 255, 60))
                dark_ratio = float(np.count_nonzero(dark_mask)) / max(dark_mask.size, 1)
                if dark_ratio > 0.4:
                    has_code_editor = True

            edge_mask = cv2.Canny(gray, 50, 150)
            contours, _ = cv2.findContours(edge_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if len(contours) > 200:
                has_code_editor = True

            if text_density > 0.3:
                has_notes = True

            if hsv is not None:
                blue_mask = cv2.inRange(hsv, (100, 50, 50), (130, 255, 255))
                blue_ratio = float(np.count_nonzero(blue_mask)) / max(blue_mask.size, 1)
                if blue_ratio > 0.1:
                    has_browser = True

            top_strip = gray[:int(h * 0.1), :]
            strip_dark = float(np.count_nonzero(top_strip < 60)) / max(top_strip.size, 1)
            if strip_dark > 0.5:
                has_browser = True

            suspicious = text_density > 0.5 or (has_notes and has_browser)

            return {
                "has_code_editor": has_code_editor,
                "has_notes": has_notes,
                "has_browser": has_browser,
                "suspicious_content": suspicious,
                "text_density": text_density,
            }
        except Exception as e:
            logger.error("analyze_content error: %s", e)
            return {
                "has_code_editor": False,
                "has_notes": False,
                "has_browser": False,
                "suspicious_content": False,
            }
