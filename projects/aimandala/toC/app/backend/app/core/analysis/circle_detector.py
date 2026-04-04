"""Minimal circle detection shell for the AI-Mandala To C V2 flow."""

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Optional


@dataclass(frozen=True)
class CircleDetectionResult:
    """Normalized three-circle detection result."""

    inner_radius: float
    middle_radius: float
    confidence: float
    method: str
    geometry_suggestion: Optional[Dict[str, float]] = None
    debug_info: Optional[Dict[str, object]] = None

    def to_dict(self) -> Dict[str, object]:
        return {
            "inner_radius": self.inner_radius,
            "middle_radius": self.middle_radius,
            "confidence": self.confidence,
            "method": self.method,
            "geometry_suggestion": self.geometry_suggestion,
            "debug_info": self.debug_info,
        }


class CircleDetector:
    """Migration-safe detector shell with a stable result contract."""

    DEFAULT_INNER = 0.33
    DEFAULT_MIDDLE = 0.66
    DEFAULT_CONFIDENCE = 0.2

    def __init__(self, detector_backend: Optional[object] = None) -> None:
        self.detector_backend = detector_backend

    def build_default_result(
        self,
        *,
        reason: str = "fallback_default",
        image_path: Optional[str] = None,
    ) -> CircleDetectionResult:
        """Return the V2-compatible default geometry suggestion."""

        return CircleDetectionResult(
            inner_radius=self.DEFAULT_INNER,
            middle_radius=self.DEFAULT_MIDDLE,
            confidence=self.DEFAULT_CONFIDENCE,
            method="default",
            geometry_suggestion=self._build_circle_geometry(
                self.DEFAULT_INNER,
                self.DEFAULT_MIDDLE,
            ),
            debug_info={
                "reason": reason,
                "image_path": image_path,
                "backend": type(self.detector_backend).__name__
                if self.detector_backend is not None
                else None,
            },
        )

    async def detect_circles(
        self,
        image_path: str,
        use_ai: bool = True,
        use_opencv: bool = True,
        confidence_threshold: float = 0.3,
    ) -> CircleDetectionResult:
        """Detect three-circle boundaries or safely fall back to defaults."""

        path = Path(image_path)
        if not path.exists():
            return self.build_default_result(
                reason="image_not_found",
                image_path=image_path,
            )

        if self.detector_backend is None:
            return self.build_default_result(
                reason="backend_not_configured",
                image_path=image_path,
            )

        raw_result = await self.detector_backend.detect_circles(
            image_path=image_path,
            use_ai=use_ai,
            use_opencv=use_opencv,
            confidence_threshold=confidence_threshold,
        )
        normalized = self._normalize_result(raw_result)

        if normalized.confidence < confidence_threshold:
            return CircleDetectionResult(
                inner_radius=normalized.inner_radius,
                middle_radius=normalized.middle_radius,
                confidence=normalized.confidence,
                method=normalized.method,
                geometry_suggestion=normalized.geometry_suggestion,
                debug_info={
                    **(normalized.debug_info or {}),
                    "fallback_used": False,
                    "below_threshold": True,
                    "confidence_threshold": confidence_threshold,
                },
            )

        return normalized

    def _normalize_result(self, raw_result: object) -> CircleDetectionResult:
        """Normalize backend output into the stable To C result contract."""

        if isinstance(raw_result, CircleDetectionResult):
            result = raw_result
        elif isinstance(raw_result, dict):
            inner = self._clamp_ratio(
                raw_result.get("inner_radius", raw_result.get("inner", self.DEFAULT_INNER))
            )
            middle = self._normalize_middle(
                inner,
                self._clamp_ratio(
                    raw_result.get(
                        "middle_radius",
                        raw_result.get("middle", self.DEFAULT_MIDDLE),
                    )
                ),
            )
            result = CircleDetectionResult(
                inner_radius=inner,
                middle_radius=middle,
                confidence=self._clamp_confidence(
                    raw_result.get("confidence", self.DEFAULT_CONFIDENCE)
                ),
                method=str(raw_result.get("method", "custom")),
                geometry_suggestion=raw_result.get("geometry_suggestion")
                or self._build_circle_geometry(inner, middle),
                debug_info=raw_result.get("debug_info"),
            )
        else:
            raise TypeError("Unsupported circle detection result type")

        inner = self._clamp_ratio(result.inner_radius)
        middle = self._normalize_middle(inner, self._clamp_ratio(result.middle_radius))
        geometry = result.geometry_suggestion or self._build_circle_geometry(inner, middle)

        return CircleDetectionResult(
            inner_radius=inner,
            middle_radius=middle,
            confidence=self._clamp_confidence(result.confidence),
            method=result.method,
            geometry_suggestion=geometry,
            debug_info=result.debug_info,
        )

    def _build_circle_geometry(self, inner: float, middle: float) -> Dict[str, float]:
        return {
            "shape_type": "circle",
            "cx": 0.5,
            "cy": 0.5,
            "rx": 0.5,
            "ry": 0.5,
            "rotation": 0.0,
            "inner_t": round(inner, 2),
            "middle_t": round(middle, 2),
        }

    def _clamp_ratio(self, value: float) -> float:
        return max(0.1, min(float(value), 0.9))

    def _clamp_confidence(self, value: float) -> float:
        return max(0.0, min(float(value), 1.0))

    def _normalize_middle(self, inner: float, middle: float) -> float:
        normalized_middle = max(float(middle), inner + 0.05)
        return min(normalized_middle, 0.9)
