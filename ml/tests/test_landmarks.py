"""
test_landmarks.py
Unit tests for ml/src/features/landmarks.py (no real video needed).
"""
from __future__ import annotations

import numpy as np
import pytest

from ml.src.features.landmarks import (
    FEAT_DIM,
    RAW_DIM,
    _hand_to_array,
    _normalise,
    _pose_to_array,
    _sample_frames,
    HAND_DIM,
    POSE_DIM,
    _POSE_SUBSET,
)


# ---------------------------------------------------------------------------
# Dimension constants
# ---------------------------------------------------------------------------

def test_constants():
    assert RAW_DIM == 196
    assert FEAT_DIM == 392
    assert HAND_DIM == 84
    assert POSE_DIM == 28


# ---------------------------------------------------------------------------
# _hand_to_array
# ---------------------------------------------------------------------------

def test_hand_to_array_none_returns_zeros():
    arr = _hand_to_array(None)
    assert arr.shape == (HAND_DIM,)
    assert arr.dtype == np.float32
    np.testing.assert_array_equal(arr, 0)


# ---------------------------------------------------------------------------
# _pose_to_array
# ---------------------------------------------------------------------------

def test_pose_to_array_none_returns_zeros():
    arr = _pose_to_array(None)
    assert arr.shape == (POSE_DIM,)
    np.testing.assert_array_equal(arr, 0)


# ---------------------------------------------------------------------------
# _normalise
# ---------------------------------------------------------------------------

def _make_raw_with_shoulders(l_xyz=(0.2, 0.5, 0.0), r_xyz=(0.8, 0.5, 0.0)):
    """Build a (196,) raw vector with specified shoulder positions."""
    raw = np.zeros(RAW_DIM, dtype=np.float32)
    # Shoulders are pose landmarks 11 and 12, at _POSE_SUBSET index 1 and 2
    from ml.src.features.landmarks import HAND_DIM, DIMS, _POSE_SUBSET
    pose_start = 2 * HAND_DIM
    l_idx = _POSE_SUBSET.index(11)
    r_idx = _POSE_SUBSET.index(12)
    raw[pose_start + l_idx * DIMS:pose_start + l_idx * DIMS + 3] = l_xyz
    raw[pose_start + r_idx * DIMS:pose_start + r_idx * DIMS + 3] = r_xyz
    return raw


def test_normalise_shoulder_midpoint_becomes_origin():
    raw = _make_raw_with_shoulders((0.2, 0.5, 0.0), (0.8, 0.5, 0.0))
    normed = _normalise(raw)
    from ml.src.features.landmarks import HAND_DIM, DIMS, _POSE_SUBSET
    pose_start = 2 * HAND_DIM
    l_idx = _POSE_SUBSET.index(11)
    r_idx = _POSE_SUBSET.index(12)
    l_xyz = normed[pose_start + l_idx * DIMS:pose_start + l_idx * DIMS + 3]
    r_xyz = normed[pose_start + r_idx * DIMS:pose_start + r_idx * DIMS + 3]
    midpoint = (l_xyz + r_xyz) / 2
    np.testing.assert_allclose(midpoint, 0.0, atol=1e-5)


def test_normalise_zero_scale_does_not_raise():
    """If shoulder width is zero (both shoulders same point), normalise should not crash."""
    raw = _make_raw_with_shoulders((0.5, 0.5, 0.0), (0.5, 0.5, 0.0))
    normed = _normalise(raw)  # should not raise
    assert normed.shape == (RAW_DIM,)


# ---------------------------------------------------------------------------
# _sample_frames
# ---------------------------------------------------------------------------

def test_sample_frames_shorter_than_max():
    frames = [np.zeros(RAW_DIM, dtype=np.float32) for _ in range(10)]
    result = _sample_frames(frames, max_frames=64)
    assert len(result) == 10  # unchanged


def test_sample_frames_longer_than_max():
    frames = [np.full(RAW_DIM, float(i), dtype=np.float32) for i in range(100)]
    result = _sample_frames(frames, max_frames=32)
    assert len(result) == 32


def test_sample_frames_empty():
    result = _sample_frames([], max_frames=64)
    assert result == []
