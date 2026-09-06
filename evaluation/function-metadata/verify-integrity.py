"""Verify a function-metadata freeze without creating or changing it."""
from __future__ import annotations

import json
from freeze import FREEZE, IntegrityError, verify

if not FREEZE.exists():
    raise SystemExit('freeze.json absent; nothing is frozen to verify')
try:
    verify(json.loads(FREEZE.read_text()))
except (IntegrityError, json.JSONDecodeError) as error:
    raise SystemExit(f'integrity verification failed: {error}')
print('Function-metadata freeze verified')
