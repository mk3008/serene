#!/usr/bin/env python3
"""Summarize a command-recorder JSONL log without judging adoption or safety.

The output is an observation record.  In particular, a possible Serene CLI
command is only surfaced for human review; this program does not infer that a
command was useful, correct, or even actually executed successfully.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
from typing import Any


def _number(value: Any) -> int | float | None:
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) else None


def _digest(path: Path) -> tuple[int, str] | None:
    try:
        h = hashlib.sha256()
        size = 0
        with path.open("rb") as stream:
            for block in iter(lambda: stream.read(1024 * 1024), b""):
                size += len(block)
                h.update(block)
        return size, h.hexdigest()
    except (OSError, ValueError):
        return None


def read_events(path: Path) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    events: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    with path.open("rb") as stream:
        for line_number, raw in enumerate(stream, 1):
            if not raw.strip():
                continue
            try:
                value = json.loads(raw)
                if not isinstance(value, dict):
                    raise ValueError("event is not an object")
                events.append(value)
            except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
                errors.append({"line": line_number, "error": str(exc)})
    return events, errors


def _artifact_observation(events: list[dict[str, Any]], snapshot_root: Path | None = None) -> dict[str, Any]:
    snapshots = [e for e in events if e.get("event") == "final_snapshot"]
    result: dict[str, Any] = {
        "final_snapshot_present": bool(snapshots),
        "final_snapshot_count": len(snapshots),
    }
    if not snapshots:
        result.update({"artifact_count": None, "artifact_sha256_mismatches": [], "artifact_integrity_verified": False})
        return result
    snapshot = snapshots[-1]
    entries = snapshot.get("entries")
    if not isinstance(entries, list):
        result.update({"artifact_count": None, "artifact_sha256_mismatches": [{"reason": "missing_entries"}], "artifact_integrity_verified": False})
        return result
    result["artifact_count"] = len(entries)
    seen: set[str] = set()
    mismatches: list[dict[str, Any]] = []
    root_value = snapshot.get("root")
    recorded_root = Path(root_value) if isinstance(root_value, str) else None
    root = snapshot_root or recorded_root
    for entry in entries:
        if not isinstance(entry, dict):
            mismatches.append({"reason": "invalid_entry", "entry": entry})
            continue
        rel = entry.get("path")
        if not isinstance(rel, str):
            mismatches.append({"reason": "missing_path", "entry": entry})
            continue
        if rel in seen:
            mismatches.append({"path": rel, "reason": "duplicate_path"})
        seen.add(rel)
        expected_size, expected_sha = entry.get("bytes"), entry.get("sha256")
        if root is not None and entry.get("type") == "file" and isinstance(expected_size, int) and isinstance(expected_sha, str):
            actual = _digest(root / rel)
            if actual is None:
                mismatches.append({"path": rel, "reason": "missing_or_unreadable"})
            elif actual != (expected_size, expected_sha):
                mismatches.append({"path": rel, "reason": "hash_or_size_mismatch", "expected_bytes": expected_size, "actual_bytes": actual[0], "expected_sha256": expected_sha, "actual_sha256": actual[1]})
    result["artifact_sha256_mismatches"] = mismatches
    result["recorded_root"] = str(recorded_root) if recorded_root else None
    result["snapshot_root"] = str(snapshot_root) if snapshot_root else None
    metadata_complete = all(
        isinstance(entry, dict) and (entry.get("type") != "file" or (isinstance(entry.get("bytes"), int) and isinstance(entry.get("sha256"), str)))
        for entry in entries
    )
    result["artifact_integrity_verified"] = bool(root is not None and metadata_complete and not mismatches)
    return result


def _output_observation(finishes: list[dict[str, Any]], artifact_root: Path | None) -> dict[str, Any]:
    """Verify captured stream files, optionally relocated into an archive.

    ``original_path`` is always retained.  With ``--artifact-root`` only the
    recorded basename is used, since archived ``events.outputs`` directories
    intentionally need not preserve the recorder's absolute parent path.
    """
    records: list[dict[str, Any]] = []
    mismatches: list[dict[str, Any]] = []
    for event in finishes:
        for stream in ("stdout", "stderr"):
            metadata = event.get(stream)
            if not isinstance(metadata, dict) or not isinstance(metadata.get("path"), str):
                row = {"sequence": event.get("sequence"), "stream": stream, "original_path": metadata.get("path") if isinstance(metadata, dict) else None, "resolved_path": None, "verified": False, "reason": "missing_stream_metadata"}
                records.append(row)
                mismatches.append(row.copy())
                continue
            original = metadata["path"]
            candidate = (artifact_root / Path(original).name) if artifact_root else Path(original)
            actual = _digest(candidate)
            row: dict[str, Any] = {"sequence": event.get("sequence"), "stream": stream, "original_path": original, "resolved_path": str(candidate), "verified": False}
            if actual is None:
                row["reason"] = "missing_or_unreadable"
                mismatches.append(row.copy())
            elif actual != (metadata.get("bytes"), metadata.get("sha256")):
                row.update({"reason": "hash_or_size_mismatch", "expected_bytes": metadata.get("bytes"), "actual_bytes": actual[0], "expected_sha256": metadata.get("sha256"), "actual_sha256": actual[1]})
                mismatches.append(row.copy())
            else:
                row["verified"] = True
            records.append(row)
    return {"artifact_root": str(artifact_root) if artifact_root else None, "streams": records, "mismatches": mismatches, "integrity_verified": bool(records) and not mismatches and all(r["verified"] for r in records)}


def summarize(events: list[dict[str, Any]], parse_errors: list[dict[str, Any]] | None = None, artifact_root: Path | None = None, snapshot_root: Path | None = None) -> dict[str, Any]:
    starts = [e for e in events if e.get("event") == "command_started"]
    finishes = [e for e in events if e.get("event") == "command_finished"]
    finished_by_seq = {e.get("sequence"): e for e in finishes}
    incomplete = [e.get("sequence") for e in starts if e.get("sequence") not in finished_by_seq]
    failures = [e for e in finishes if (isinstance(e.get("returned_exit_code"), int) and e["returned_exit_code"] != 0) or (isinstance(e.get("child_exit_code"), int) and e["child_exit_code"] != 0)]
    caps = [e for e in finishes if e.get("output_cap_exceeded") is True]
    timed_out = [e for e in finishes if e.get("timed_out") is True or e.get("timeout") is True]
    stdout_bytes = sum(e.get("stdout", {}).get("bytes", 0) for e in finishes if isinstance(e.get("stdout"), dict) and isinstance(e.get("stdout", {}).get("bytes", 0), int))
    stderr_bytes = sum(e.get("stderr", {}).get("bytes", 0) for e in finishes if isinstance(e.get("stderr"), dict) and isinstance(e.get("stderr", {}).get("bytes", 0), int))
    elapsed_values = [e.get("elapsed_seconds") for e in finishes if _number(e.get("elapsed_seconds")) is not None]
    elapsed_values += [e.get("elapsed_time_seconds") for e in finishes if _number(e.get("elapsed_time_seconds")) is not None]
    timestamped = [e for e in events if _number(e.get("recorded_at_ns")) is not None]
    command_wall_values = [
        (finished_by_seq[e.get("sequence")]["recorded_at_ns"] - e["recorded_at_ns"]) / 1_000_000_000
        for e in starts if e.get("sequence") in finished_by_seq and _number(e.get("recorded_at_ns")) is not None and _number(finished_by_seq[e.get("sequence")].get("recorded_at_ns")) is not None
    ]
    commands = [{"sequence": e.get("sequence"), "argv": e.get("argv")} for e in starts]
    possible: list[dict[str, Any]] = []
    for command in commands:
        argv = command.get("argv")
        if isinstance(argv, list) and any(isinstance(a, str) and (Path(a).name in {"serene", "serene-audit"} or "serene-audit" in a) for a in argv):
            possible.append({"sequence": command["sequence"], "rawargv": argv})
    metric_values = {
        "command_started": len(starts), "completed_commands": len(finishes), "failures": len(failures),
        "output_cap_breaches": len(caps), "incomplete_commands": incomplete,
        "stdout_bytes": stdout_bytes, "stderr_bytes": stderr_bytes,
    }
    metric_values.update({"timed_out": len(timed_out), "rejections": sum(1 for e in events if e.get("event") == "command_rejected")})
    out: dict[str, Any] = {
        "observations": {
            **metric_values,
            "commands": commands, "possible_cli_invocations_for_human_review": possible,
            "elapsed_seconds": sum(elapsed_values) if elapsed_values else None,
            "elapsed_values_provided": len(elapsed_values),
            "command_wall_seconds": sum(command_wall_values) if command_wall_values else None,
            "run_wall_seconds": ((max(e["recorded_at_ns"] for e in timestamped) - min(e["recorded_at_ns"] for e in timestamped)) / 1_000_000_000) if timestamped else None,
            "final_snapshot": _artifact_observation(events, snapshot_root),
            "captured_streams": _output_observation(finishes, artifact_root),
        },
        "parse_errors": parse_errors or [],
        "interpretation": "Observations only; no vulnerability, adoption, token, billing, or bypass conclusion is made.",
    }
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Summarize automatic-adoption recorder events")
    parser.add_argument("events", type=Path, help="events.jsonl")
    parser.add_argument("-o", "--output", type=Path, help="write JSON here (default: stdout)")
    parser.add_argument("--artifact-root", type=Path, help="archived events.outputs directory for stream hash verification")
    parser.add_argument("--snapshot-root", type=Path, help="archived root corresponding to final_snapshot entries")
    args = parser.parse_args()
    events, errors = read_events(args.events)
    result = summarize(events, errors, args.artifact_root, args.snapshot_root)
    encoded = json.dumps(result, sort_keys=True, indent=2) + "\n"
    if args.output:
        args.output.write_text(encoded, encoding="utf-8")
    else:
        sys.stdout.write(encoded)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
