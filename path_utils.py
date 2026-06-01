from __future__ import annotations

import re
import tempfile
from pathlib import Path


def kmz_stem(kmz_path: str, fallback: str = "kmz") -> str:
    stem = Path(kmz_path).stem.strip() if kmz_path else ""
    stem = stem or fallback
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._-")
    return stem or fallback


def make_session_temp_dir(prefix: str = "hpdb_session_") -> str:
    base_dir = Path(tempfile.gettempdir()) / "web_tools_hpdb"
    base_dir.mkdir(parents=True, exist_ok=True)
    return tempfile.mkdtemp(prefix=prefix, dir=str(base_dir))
