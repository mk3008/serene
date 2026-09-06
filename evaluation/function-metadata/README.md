# Function metadata successor evaluation

This successor reuses the pre-exposure response-boundary protocol while exposing authoritative audit function metadata on ordinary execution sites. The metadata is copied from the audit finding at the matching source coordinate; it is never inferred from a declaration name. Unknown metadata is `null` or omitted.

`prepare.py` stages only the Serene probe, ticketing, and stockroom fixtures under `/tmp/serene-function-metadata`. Existing Raw `tr` and `sr` JSONL outputs are referenced in `run-config.json` for later comparison and are not rerun.

Run deterministic checks with:

```sh
node --test evaluation/function-metadata/test-filter.mjs
python evaluation/function-metadata/test-controller.py
```

Stage fresh fixtures with `python evaluation/function-metadata/prepare.py`; do not run participant probes until the parent evaluation gate permits it.
