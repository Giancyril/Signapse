"""
make_splits.py
Phase 1 data pipeline — Step 3.

Reads the WLASL100 JSON (which already carries per-instance split labels)
and the extracted .npz files to produce three split manifests:

  ml/data/splits/train.csv
  ml/data/splits/val.csv
  ml/data/splits/test.csv

Each CSV row:  npz_path, label_index, gloss

Also exports  ml/data/splits/label_map.json  (gloss -> index, alphabetically sorted).

Usage:
  python -m ml.scripts.make_splits
"""
from __future__ import annotations

import argparse
import csv
import json
import logging
import sys
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


def main(raw_dir: str, processed_dir: str, splits_dir: str) -> None:
    raw = Path(raw_dir)
    processed = Path(processed_dir)
    splits = Path(splits_dir)
    splits.mkdir(parents=True, exist_ok=True)

    json_path = raw / "WLASL100.json"
    if not json_path.exists():
        log.error(
            "WLASL100.json not found at %s. Run download_wlasl.py first.", json_path
        )
        sys.exit(1)

    data: list[dict] = json.loads(json_path.read_text())

    # Build label map (alphabetical ordering)
    glosses = sorted(entry["gloss"] for entry in data)
    label_map: dict[str, int] = {g: i for i, g in enumerate(glosses)}
    (splits / "label_map.json").write_text(json.dumps(label_map, indent=2))
    log.info("Label map: %d classes", len(label_map))

    buckets: dict[str, list[tuple[str, int, str]]] = {
        "train": [], "val": [], "test": []
    }

    missing = 0
    for entry in data:
        gloss: str = entry["gloss"]
        idx: int = label_map[gloss]
        for inst in entry.get("instances", []):
            split: str = inst.get("split", "train")
            video_id: str = inst["video_id"]
            # Try to locate the extracted .npz file (any subdirectory)
            npz_files = list(processed.rglob(f"{video_id}.npz"))
            if not npz_files:
                missing += 1
                continue
            npz_path = npz_files[0]
            if split in buckets:
                buckets[split].append((str(npz_path), idx, gloss))
            else:
                buckets["train"].append((str(npz_path), idx, gloss))

    for split_name, rows in buckets.items():
        out_csv = splits / f"{split_name}.csv"
        with out_csv.open("w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["npz_path", "label", "gloss"])
            writer.writerows(rows)
        log.info("  %s: %d samples -> %s", split_name, len(rows), out_csv)

    if missing:
        log.warning(
            "%d instances have no extracted .npz (videos missing or failed). "
            "Re-run extract_landmarks.py.",
            missing,
        )

    log.info("Splits saved to %s", splits)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build train/val/test split CSVs")
    parser.add_argument("--raw-dir",       default="ml/data/raw")
    parser.add_argument("--processed-dir", default="ml/data/processed")
    parser.add_argument("--splits-dir",    default="ml/data/splits")
    args = parser.parse_args()
    main(args.raw_dir, args.processed_dir, args.splits_dir)
