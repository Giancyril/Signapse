# Dataset Card — WLASL100

**Source**: WLASL (Word-Level American Sign Language) dataset  
**Paper**: Li et al., 2020 — https://arxiv.org/abs/1910.11006  
**Repository**: https://github.com/dxli94/WLASL  

## Subset Used
WLASL100: the 100 most frequent ASL glosses.  
Videos are sourced from the web (YouTube, ASL-specific sites).

## Splits
| Split | Videos (approx.) |
|-------|-----------------|
| Train | ~1,400 |
| Val   | ~200   |
| Test  | ~100   |

## License
For research use only — see WLASL repository for terms.
See https://github.com/dxli94/WLASL/blob/master/LICENSE

## Download
Run python ml/scripts/download_wlasl.py --out ml/data/raw to fetch the JSON index.
Video download will be implemented in Phase 1.
