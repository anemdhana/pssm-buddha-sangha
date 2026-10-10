#!/usr/bin/env python3
"""Deprecated MySQL setup entrypoint — delegates to setup_sangha_mongo.py."""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

print(
    "Note: sangha persistence is MongoDB now. Delegating to setup_sangha_mongo.py …",
    file=sys.stderr,
)
runpy.run_path(str(Path(__file__).with_name("setup_sangha_mongo.py")), run_name="__main__")
