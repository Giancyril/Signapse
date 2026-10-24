"""
landmarks.py
Extracts MediaPipe holistic landmarks from a video and returns a normalised
feature vector per frame.

Feature layout (per frame, 1-D float32):
  - Left hand:   21 landmarks x (x, y, z, vis)  = 84 values
  - Right hand:  21 landmarks x (x, y, z, vis)  = 84 values
  - Pose subset: nose, shoulders, elbows, wrists = 7 x (x, y, z, vis) = 28 values
  Total raw per frame: 196 values

Normalisation (applied to the 196-value raw vector):
  - Translated so that the midpoint of the two shoulder landmarks is the origin.
  - Scaled by the Euclidean distance between the two shoulder landmarks.
    If shoulders are not detected, scale = 1.0 (no normalisation).

Velocity:
  - Frame-to-frame difference of the normalised 196-value vector is appended.
  - First frame velocity = 0.
  - Final FEAT_DIM = 196 + 196 = 392.

Missing landmarks:
  - If a hand is not detected, its 84 values are zeros.
  - If pose is not detected, its 28 values are zeros.
"""
from __future__ import annotations

try:
    import cv2
except ImportError:
    cv2 = None

try:
    import mediapipe as mp
except ImportError:
    mp = None
import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# Pose landmark indices we keep (MediaPipe Pose topology, 33 total)
_POSE_SUBSET = [
    0,   # nose
    11,  # left shoulder
    12,  # right shoulder
    13,  # left elbow
    14,  # right elbow
    15,  # left wrist
    16,  # right wrist
]

N_HAND = 21          # landmarks per hand
N_POSE = len(_POSE_SUBSET)  # = 7
DIMS = 4             # x, y, z, visibility

HAND_DIM = N_HAND * DIMS   # 84
POSE_DIM = N_POSE * DIMS   # 28
RAW_DIM  = 2 * HAND_DIM + POSE_DIM  # 196   (left + right + pose)
FEAT_DIM = 2 * RAW_DIM              # 392   (raw + velocity)

# Shoulder indices *within the subset* for normalisation
_L_SHOULDER_IDX = _POSE_SUBSET.index(11)  # 1
_R_SHOULDER_IDX = _POSE_SUBSET.index(12)  # 2

# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

mp_holistic = mp.solutions.holistic if mp is not None else None  # type: ignore[attr-defined]


def _hand_to_array(hand_landmarks) -> np.ndarray:
    """Convert a MediaPipe NormalizedLandmarkList to a (84,) float32 array."""
    if hand_landmarks is None:
        return np.zeros(HAND_DIM, dtype=np.float32)
    arr = np.array(
        [[lm.x, lm.y, lm.z, lm.visibility] for lm in hand_landmarks.landmark],
        dtype=np.float32,
    ).ravel()
    return arr


def _pose_to_array(pose_landmarks) -> np.ndarray:
    """Extract subset of pose landmarks as a (28,) float32 array."""
    if pose_landmarks is None:
        return np.zeros(POSE_DIM, dtype=np.float32)
    all_lm = pose_landmarks.landmark
    arr = np.array(
        [[all_lm[i].x, all_lm[i].y, all_lm[i].z, all_lm[i].visibility]
         for i in _POSE_SUBSET],
        dtype=np.float32,
    ).ravel()
    return arr


def _normalise(raw: np.ndarray) -> np.ndarray:
    """Translate + scale a (196,) raw vector using shoulder midpoint / width."""
    raw = raw.copy()
    # Pose starts after the two hand arrays: offset = 2 * HAND_DIM = 168
    pose_start = 2 * HAND_DIM
    # Each pose landmark is stored as [x, y, z, vis] (4 values)
    l_start = pose_start + _L_SHOULDER_IDX * DIMS
    r_start = pose_start + _R_SHOULDER_IDX * DIMS

    l_xyz = raw[l_start:l_start + 3]
    r_xyz = raw[r_start:r_start + 3]

    midpoint = (l_xyz + r_xyz) / 2.0
    scale = float(np.linalg.norm(r_xyz - l_xyz))
    if scale < 1e-6:
        scale = 1.0  # fallback — shoulders not detected

    # Translate x, y, z for every landmark (skip visibility = every 4th value)
    for start in range(0, RAW_DIM, DIMS):
        raw[start:start + 3] -= midpoint
        raw[start:start + 3] /= scale

    return raw


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def extract_raw_frames(video_path: str) -> list[np.ndarray]:
    """Return a list of (196,) float32 raw (un-normalised) landmark vectors."""
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise FileNotFoundError(f"Cannot open video: {video_path}")

    frames: list[np.ndarray] = []
    with mp_holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as holistic:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = holistic.process(rgb)

            left  = _hand_to_array(result.left_hand_landmarks)
            right = _hand_to_array(result.right_hand_landmarks)
            pose  = _pose_to_array(result.pose_landmarks)
            frames.append(np.concatenate([left, right, pose]))

    cap.release()
    return frames


def _sample_frames(frames: list[np.ndarray], max_frames: int) -> list[np.ndarray]:
    """Uniformly subsample *frames* to at most *max_frames* entries."""
    n = len(frames)
    if n == 0:
        return frames
    if n <= max_frames:
        return frames
    indices = np.linspace(0, n - 1, max_frames, dtype=int)
    return [frames[i] for i in indices]


def extract_sequence(video_path: str, max_frames: int = 64) -> np.ndarray:
    """Return an (T, FEAT_DIM) float32 array for *video_path*.

    Pipeline:
      1. Extract raw landmarks frame-by-frame (MediaPipe Holistic).
      2. Uniformly subsample to *max_frames* if longer.
      3. Normalise each frame (shoulder midpoint + scale).
      4. Compute per-frame velocity (frame diff; first frame = 0).
      5. Concatenate [normalised | velocity] -> (T, FEAT_DIM).

    Returns an empty (0, FEAT_DIM) array if no frames were read.
    """
    raw_frames = extract_raw_frames(video_path)
    raw_frames = _sample_frames(raw_frames, max_frames)

    if not raw_frames:
        return np.zeros((0, FEAT_DIM), dtype=np.float32)

    normalised = np.stack([_normalise(f) for f in raw_frames])  # (T, 196)

    velocity = np.zeros_like(normalised)
    velocity[1:] = normalised[1:] - normalised[:-1]

    return np.concatenate([normalised, velocity], axis=1).astype(np.float32)
