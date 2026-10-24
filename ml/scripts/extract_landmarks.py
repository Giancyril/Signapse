"""
extract_landmarks.py
Phase 1 data pipeline — Step 2.

Walks ml/data/raw/videos/{split}/{class}/*.mp4 and extracts MediaPipe landmark
sequences, saving each as a compressed NumPy file (.npz) in ml/data/processed/.

Usage:
  python -m ml.scripts.extract_landmarks

Options:
  --raw-dir     Root of raw video tree   (default: ml/data/raw/videos)
  --out-dir     Where to save .npz files (default: ml/data/processed)
  --max-frames  Max frames per clip      (default: 64)
  --workers     Parallel worker threads  (default: 4)
"""
from __future__ import annotations

import argparse
import logging
import sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path

import numpy as np
from tqdm import tqdm

from ml.src.features.landmarks import extract_sequence, FEAT_DIM

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Worker (runs in subprocess)
# ---------------------------------------------------------------------------

def _process_video(
    video_path: str,
    out_path: str,
    max_frames: int,
) -> tuple[str, bool, str]:
    """Extract landmarks for one video. Returns (video_path, ok, error_msg)."""
    try:
        seq = extract_sequence(video_path, max_frames=max_frames)
        if seq.shape[0] == 0:
            return video_path, False, "empty sequence"
        np.savez_compressed(out_path, sequence=seq)
        return video_path, True, ""
    except Exception as exc:  # noqa: BLE001
        return video_path, False, str(exc)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(raw_dir: str, out_dir: str, max_frames: int, workers: int) -> None:
    raw = Path(raw_dir)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    # Collect all video files
    video_paths = sorted(raw.rglob("*.mp4"))
    if not video_paths:
        log.error("No .mp4 files found under %s. Run download_wlasl.py first.", raw)
        sys.exit(1)

    log.info("Found %d videos. Extracting landmarks...", len(video_paths))

    tasks: list[tuple[str, str, int]] = []
    for vp in video_paths:
        # Mirror directory structure under out_dir
        rel = vp.relative_to(raw)
        out_path = (out / rel).with_suffix(".npz")
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if out_path.exists():
            continue  # already extracted
        tasks.append((str(vp), str(out_path), max_frames))

    if not tasks:
        log.info("All videos already extracted. Nothing to do.")
        return

    log.info("Processing %d videos (skipping %d cached)...",
             len(tasks), len(video_paths) - len(tasks))

    failed: list[tuple[str, str]] = []
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_process_video, *t): t for t in tasks}
        with tqdm(total=len(tasks), unit="video") as pbar:
            for future in as_completed(futures):
                vpath, ok, err = future.result()
                if not ok:
                    failed.append((vpath, err))
                pbar.update(1)

    (out / "extraction_errors.txt").write_text(
        "\n".join(f"{p}\t{e}" for p, e in failed)
    )
    log.info(
        "Done. Extracted: %d | Failed: %d",
        len(tasks) - len(failed),
        len(failed),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Extract MediaPipe landmarks from videos")
    parser.add_argument("--raw-dir",    default="ml/data/raw/videos")
    parser.add_argument("--out-dir",    default="ml/data/processed")
    parser.add_argument("--max-frames", type=int, default=64)
    parser.add_argument("--workers",    type=int, default=4)
    args = parser.parse_args()
    main(args.raw_dir, args.out_dir, args.max_frames, args.workers)
