# Data Pipeline — Phase 1

Three steps to go from WLASL JSON to ready-to-train splits.

## Step 1 — Download videos

```bash
cd <repo root>
python -m ml.scripts.download_wlasl --out ml/data/raw --workers 4
```

This fetches `WLASL100.json` and then downloads each video via `yt-dlp`.
Videos are saved to `ml/data/raw/videos/{split}/{idx}_{gloss}/{video_id}.mp4`.
Dead links are logged to `ml/data/raw/skipped.txt`.

> **Note**: Many WLASL links are from YouTube and may be unavailable.
> Expect 40–70 % download success depending on region and date.

---

## Step 2 — Extract landmarks

```bash
python -m ml.scripts.extract_landmarks \
  --raw-dir ml/data/raw/videos \
  --out-dir ml/data/processed \
  --max-frames 64 \
  --workers 4
```

Runs MediaPipe Holistic on every `.mp4` and saves a `(T, 392)` float32
array as a compressed `.npz` file mirroring the raw directory structure.

---

## Step 3 — Build split manifests

```bash
python -m ml.scripts.make_splits
```

Reads `WLASL100.json` split labels and produces:

```
ml/data/splits/
  train.csv       npz_path, label, gloss
  val.csv
  test.csv
  label_map.json  { gloss: index }  (alphabetically sorted)
```

---

## Step 4 — Generate web labels (optional)

```bash
python -m ml.scripts.generate_labels_ts
```

Auto-generates `web/src/lib/labels.ts` from `label_map.json`.

---

## Feature dimensions

| Component | Landmarks | Values/frame |
|-----------|-----------|--------------|
| Left hand | 21 × (x,y,z,vis) | 84 |
| Right hand | 21 × (x,y,z,vis) | 84 |
| Pose subset | 7 × (x,y,z,vis) | 28 |
| **Raw total** | | **196** |
| + Velocity | frame diff | 196 |
| **FEAT_DIM** | | **392** |

Normalisation: shoulder midpoint → origin, scale = shoulder width.
