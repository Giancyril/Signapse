"""conftest.py — makes the monorepo root importable for pytest."""
import sys
from pathlib import Path

# Add repo root so `ml.src.*` imports work
sys.path.insert(0, str(Path(__file__).parent.parent))
