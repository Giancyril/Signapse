"""
download_wlasl.py
Phase 1 data pipeline — Step 1.

Downloads the WLASL100 JSON index and attempts to fetch each video via yt-dlp.
Videos that cannot be downloaded (dead links, geo-blocked) are skipped and
logged to ml/data/raw/skipped.txt.

Usage:
  python -m ml.scripts.download_wlasl --out ml/data/raw --workers 4

Requirements:
  pip install yt-dlp requests tqdm
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import requests
from tqdm import tqdm

WLASL_JSON_URL = (
    "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# JSON helpers
# ---------------------------------------------------------------------------

def fetch_wlasl_json(out_dir: Path, n_classes: int = 100) -> list[dict]:
    """Download WLASL JSON and slice to the first *n_classes* glosses."""
    json_path = out_dir / f"WLASL{n_classes}.json"
    if json_path.exists():
        log.info("JSON already cached at %s, skipping download.", json_path)
        return json.loads(json_path.read_text())

    log.info("Downloading WLASL JSON index...")
    r = requests.get(WLASL_JSON_URL, timeout=30)
    r.raise_for_status()
    full_data: list[dict] = r.json()
    subset = full_data[:n_classes]
    json_path.write_text(json.dumps(subset, indent=2))
    log.info("Saved %d glosses to %s", len(subset), json_path)
    return subset


def build_label_map(data: list[dict]) -> dict[str, int]:
    """Return {gloss: class_index} sorted alphabetically."""
    glosses = sorted(entry["gloss"] for entry in data)
    return {g: i for i, g in enumerate(glosses)}


# ---------------------------------------------------------------------------
# Video download (yt-dlp)
# ---------------------------------------------------------------------------

def _ytdlp_download(url: str, out_path: Path, timeout: int = 60) -> bool:
    """Run yt-dlp to download *url* to *out_path*. Returns True on success."""
    cmd = [
        "yt-dlp",
        "--quiet",
        "--no-warnings",
        "--format", "mp4/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "--output", str(out_path),
        "--no-playlist",
        url,
    ]
    try:
        result = subprocess.run(cmd, timeout=timeout, capture_output=True)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        log.warning("Timeout downloading %s", url)
        return False
    except FileNotFoundError:
        log.error(
            "yt-dlp not found. Install it with:  pip install yt-dlp"
        )
        sys.exit(1)


def download_instance(
    gloss: str,
    instance: dict,
    video_dir: Path,
    label_idx: int,
) -> tuple[str, bool]:
    """Download one video instance. Returns (video_id, success)."""
    video_id: str = instance["video_id"]
    url: str = instance.get("url", "")
    split: str = instance.get("split", "train")

    out_dir = video_dir / split / f"{label_idx:03d}_{gloss}"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / f"{video_id}.mp4"

    if out_path.exists() and out_path.stat().st_size > 1024:
        return video_id, True  # already downloaded

    if not url:
        return video_id, False

    ok = _ytdlp_download(url, out_path)
    return video_id, ok


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main(out_dir: str, workers: int, n_classes: int, dry_run: bool) -> None:
    raw = Path(out_dir)
    raw.mkdir(parents=True, exist_ok=True)
    video_dir = raw / "videos"
    video_dir.mkdir(exist_ok=True)
    skipped_log = raw / "skipped.txt"

    data = fetch_wlasl_json(raw, n_classes)
    label_map = build_label_map(data)

    # Save label map
    label_map_path = raw / "label_map.json"
    label_map_path.write_text(json.dumps(label_map, indent=2))
    log.info("Label map saved to %s", label_map_path)

    if dry_run:
        log.info("Dry-run mode — skipping video downloads.")
        return

    # Build task list
    tasks: list[tuple[str, dict, Path, int]] = []
    for entry in data:
        gloss = entry["gloss"]
        idx = label_map[gloss]
        for instance in entry.get("instances", []):
            tasks.append((gloss, instance, video_dir, idx))

    log.info("Downloading %d video instances with %d workers...", len(tasks), workers)

    failed: list[str] = []
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {
            pool.submit(download_instance, *t): t for t in tasks
        }
        with tqdm(total=len(tasks), unit="video") as pbar:
            for future in as_completed(futures):
                video_id, ok = future.result()
                if not ok:
                    failed.append(video_id)
                pbar.update(1)

    skipped_log.write_text("\n".join(failed))
    log.info(
        "Done. Downloaded: %d | Skipped/failed: %d",
        len(tasks) - len(failed),
        len(failed),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download WLASL100 videos via yt-dlp"
    )
    parser.add_argument("--out", default="ml/data/raw",
                        help="Output directory (default: ml/data/raw)")
    parser.add_argument("--workers", type=int, default=4,
                        help="Parallel download workers (default: 4)")
    parser.add_argument("--n-classes", type=int, default=100,
                        help="Number of WLASL classes to use (default: 100)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Fetch JSON only, skip video downloads")
    args = parser.parse_args()
    main(args.out, args.workers, args.n_classes, args.dry_run)
