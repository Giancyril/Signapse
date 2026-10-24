"""
landmarks.py
Extracts MediaPipe holistic landmarks from a video and returns a normalised
feature vector per frame.

Feature layout (per frame, 1-D float32):
  - Left hand:   21 landmarks x (x, y, z, vis)  = 84 values
  - Right hand:  21 landmarks x (x, y, z, vis)  = 84 values
  - Pose subset: shoulders, elbows, wrists, nose = 7 x (x, y, z, vis) = 28 values
  Total per frame: 196 values

Normalisation:
  - Translated so that the midpoint of the two shoulder landmarks is the origin.
  - Scaled by the Euclidean distance between the two shoulder landmarks.
  - Velocity (frame-diff) is appended, giving 392 values per frame.
"""
from __future__ import annotations

import cv2
import mediapipe as mp
import numpy as np

# Pose landmark indices we keep (MediaPipe Pose topology)
_POSE_SUBSET = [
    0,   # nose
    11,  # left shoulder
    12,  # right shoulder
    13,  # left elbow
    14,  # right elbow
    15,  # left wrist
    16,  # right wrist
]

RAW_DIM = 196   # features per frame (no velocity)
FEAT_DIM = 392  # features per frame (with velocity)


def extract_sequence(video_path: str, max_frames: int = 64) -> np.ndarray:
    """Return an (T, FEAT_DIM) float32 array for *video_path*.

    Frames are sampled uniformly when the video is longer than *max_frames*.
    """
    raise NotImplementedError("Phase 1: implement landmark extraction")
