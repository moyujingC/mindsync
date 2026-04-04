"""Unit tests for the migrated minimal circle detector shell."""

import os
import sys

import pytest

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
)

from app.core.analysis.circle_detector import CircleDetectionResult, CircleDetector


class FakeBackend:
    async def detect_circles(
        self,
        image_path: str,
        use_ai: bool = True,
        use_opencv: bool = True,
        confidence_threshold: float = 0.3,
    ):
        return {
            "inner": 0.34,
            "middle": 0.68,
            "confidence": 0.81,
            "method": "fake_backend",
            "debug_info": {
                "use_ai": use_ai,
                "use_opencv": use_opencv,
                "threshold": confidence_threshold,
            },
        }


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_detect_circles_falls_back_when_image_is_missing():
    detector = CircleDetector()

    result = await detector.detect_circles("/tmp/aimandala-missing-image.png")

    assert result.method == "default"
    assert result.inner_radius == 0.33
    assert result.middle_radius == 0.66
    assert result.debug_info["reason"] == "image_not_found"


@pytest.mark.anyio
async def test_detect_circles_falls_back_without_backend(tmp_path):
    image_path = tmp_path / "sample.png"
    image_path.write_bytes(b"placeholder")

    detector = CircleDetector()
    result = await detector.detect_circles(str(image_path))

    assert result.method == "default"
    assert result.debug_info["reason"] == "backend_not_configured"


@pytest.mark.anyio
async def test_detect_circles_normalizes_backend_result(tmp_path):
    image_path = tmp_path / "sample.png"
    image_path.write_bytes(b"placeholder")

    detector = CircleDetector(detector_backend=FakeBackend())
    result = await detector.detect_circles(str(image_path), confidence_threshold=0.3)

    assert result.method == "fake_backend"
    assert result.inner_radius == 0.34
    assert result.middle_radius == 0.68
    assert result.confidence == 0.81
    assert result.geometry_suggestion["shape_type"] == "circle"


def test_normalize_result_accepts_dataclass_instance():
    detector = CircleDetector()
    raw = CircleDetectionResult(
        inner_radius=0.3,
        middle_radius=0.6,
        confidence=0.5,
        method="dataclass",
    )

    normalized = detector._normalize_result(raw)

    assert normalized.method == "dataclass"
    assert normalized.geometry_suggestion["inner_t"] == 0.3
    assert normalized.geometry_suggestion["middle_t"] == 0.6
