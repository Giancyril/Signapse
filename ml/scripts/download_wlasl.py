"""
download_wlasl.py
Downloads the WLASL100 JSON index and prepares the data directory.

Phase 1 will fill in the actual video download / yt-dlp logic.
The WLASL dataset: https://github.com/dxli94/WLASL

Usage:
  python ml/scripts/download_wlasl.py --out ml/data/raw
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

WLASL_JSON_URL = (
    "https://raw.githubusercontent.com/dxli94/WLASL/master/start_kit/WLASL_v0.3.json"
)


def main(out_dir: str) -> None:
    import requests

    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)

    print(f"Downloading WLASL JSON index to {out / 'WLASL_v0.3.json'} ...")
    r = requests.get(WLASL_JSON_URL, timeout=30)
    r.raise_for_status()
    data = r.json()

    # Keep only the first 100 glosses (WLASL100 subset)
    data_100 = data[:100]
    out_path = out / "WLASL100.json"
    out_path.write_text(json.dumps(data_100, indent=2))
    print(f"Saved {len(data_100)} glosses to {out_path}")
    print("Phase 1: add yt-dlp download logic here.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="ml/data/raw")
    args = parser.parse_args()
    main(args.out)
