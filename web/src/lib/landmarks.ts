/**
 * landmarks.ts
 * Browser-side MediaPipe landmark normalisation & feature engineering.
 * Must exactly match ml/src/features/landmarks.py.
 *
 * Feature layout per frame:
 *   - Left hand:  21 landmarks x (x, y, z, vis) = 84 values
 *   - Right hand: 21 landmarks x (x, y, z, vis) = 84 values
 *   - Pose subset: 7 landmarks x (x, y, z, vis) = 28 values
 *   Total raw: 196 values
 *
 * Normalisation:
 *   - Translation: shoulder midpoint is origin (0, 0, 0)
 *   - Scale: Euclidean distance between left & right shoulders
 *
 * Velocity:
 *   - First-order difference: normalised[t] - normalised[t - 1]
 *   - Total feature dimension: 196 + 196 = 392 values per frame
 */

export const POSE_SUBSET = [
  0,  // nose
  11, // left shoulder
  12, // right shoulder
  13, // left elbow
  14, // right elbow
  15, // left wrist
  16, // right wrist
] as const;

export const N_HAND = 21;
export const N_POSE = POSE_SUBSET.length; // 7
export const DIMS = 4; // x, y, z, visibility

export const HAND_DIM = N_HAND * DIMS; // 84
export const POSE_DIM = N_POSE * DIMS; // 28
export const RAW_DIM = 2 * HAND_DIM + POSE_DIM; // 196
export const FEAT_DIM = 2 * RAW_DIM; // 392

export const L_SHOULDER_SUBSET_IDX = 1; // index of 11 in POSE_SUBSET
export const R_SHOULDER_SUBSET_IDX = 2; // index of 12 in POSE_SUBSET

export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

/**
 * Packs detected landmarks into a 196-element Float32Array raw vector.
 */
export function packRawFrame(
  leftHand: LandmarkPoint[] | null | undefined,
  rightHand: LandmarkPoint[] | null | undefined,
  poseLandmarks: LandmarkPoint[] | null | undefined
): Float32Array {
  const raw = new Float32Array(RAW_DIM);

  // 1. Left hand (offset 0 .. 84)
  if (leftHand && leftHand.length >= N_HAND) {
    for (let i = 0; i < N_HAND; i++) {
      const lm = leftHand[i];
      const base = i * DIMS;
      raw[base] = lm.x;
      raw[base + 1] = lm.y;
      raw[base + 2] = lm.z ?? 0;
      raw[base + 3] = lm.visibility ?? 1.0;
    }
  }

  // 2. Right hand (offset 84 .. 168)
  const rightOffset = HAND_DIM;
  if (rightHand && rightHand.length >= N_HAND) {
    for (let i = 0; i < N_HAND; i++) {
      const lm = rightHand[i];
      const base = rightOffset + i * DIMS;
      raw[base] = lm.x;
      raw[base + 1] = lm.y;
      raw[base + 2] = lm.z ?? 0;
      raw[base + 3] = lm.visibility ?? 1.0;
    }
  }

  // 3. Pose subset (offset 168 .. 196)
  const poseOffset = 2 * HAND_DIM;
  if (poseLandmarks && poseLandmarks.length > 16) {
    for (let j = 0; j < N_POSE; j++) {
      const idx = POSE_SUBSET[j];
      const lm = poseLandmarks[idx];
      const base = poseOffset + j * DIMS;
      if (lm) {
        raw[base] = lm.x;
        raw[base + 1] = lm.y;
        raw[base + 2] = lm.z ?? 0;
        raw[base + 3] = lm.visibility ?? 1.0;
      }
    }
  }

  return raw;
}

/**
 * Normalises a 196-element raw landmark vector using shoulder midpoint & shoulder distance.
 */
export function normaliseFrame(raw: Float32Array): Float32Array {
  const out = new Float32Array(raw);

  const poseStart = 2 * HAND_DIM;
  const lStart = poseStart + L_SHOULDER_SUBSET_IDX * DIMS;
  const rStart = poseStart + R_SHOULDER_SUBSET_IDX * DIMS;

  const lx = raw[lStart];
  const ly = raw[lStart + 1];
  const lz = raw[lStart + 2];

  const rx = raw[rStart];
  const ry = raw[rStart + 1];
  const rz = raw[rStart + 2];

  // Midpoint of shoulders
  const mx = (lx + rx) / 2.0;
  const my = (ly + ry) / 2.0;
  const mz = (lz + rz) / 2.0;

  // Shoulder width scale
  const dx = rx - lx;
  const dy = ry - ly;
  const dz = rz - lz;
  let scale = Math.sqrt(dx * dx + dy * dy + dz * dz);

  if (scale < 1e-6) {
    scale = 1.0; // fallback if shoulders not detected
  }

  // Normalise (x, y, z) for every landmark, leaving visibility intact
  for (let start = 0; start < RAW_DIM; start += DIMS) {
    out[start] = (out[start] - mx) / scale;
    out[start + 1] = (out[start + 1] - my) / scale;
    out[start + 2] = (out[start + 2] - mz) / scale;
  }

  return out;
}

/**
 * Builds the (1, T, 392) tensor data from a sequence of raw or normalised frames.
 * Returns a Float32Array of length (T * FEAT_DIM).
 */
export function buildFeatureSequence(
  frames: Float32Array[],
  maxFrames = 64
): { data: Float32Array; numFrames: number } {
  let sampled = frames;
  const n = frames.length;

  if (n > maxFrames) {
    // Subsample uniformly to maxFrames
    sampled = [];
    for (let i = 0; i < maxFrames; i++) {
      const idx = Math.floor((i * (n - 1)) / (maxFrames - 1));
      sampled.push(frames[idx]);
    }
  }

  const T = sampled.length;
  if (T === 0) {
    return { data: new Float32Array(0), numFrames: 0 };
  }

  // Normalise each frame
  const normFrames: Float32Array[] = sampled.map((f) => normaliseFrame(f));

  // Compute velocities and assemble (T, 392)
  const fullSeq = new Float32Array(T * FEAT_DIM);

  for (let t = 0; t < T; t++) {
    const cur = normFrames[t];
    const prev = t > 0 ? normFrames[t - 1] : null;

    const baseOffset = t * FEAT_DIM;

    // Normalised frame (first 196 elements)
    fullSeq.set(cur, baseOffset);

    // Velocity frame (next 196 elements)
    if (prev) {
      for (let i = 0; i < RAW_DIM; i++) {
        fullSeq[baseOffset + RAW_DIM + i] = cur[i] - prev[i];
      }
    } else {
      // First frame velocity = 0
      for (let i = 0; i < RAW_DIM; i++) {
        fullSeq[baseOffset + RAW_DIM + i] = 0;
      }
    }
  }

  return { data: fullSeq, numFrames: T };
}