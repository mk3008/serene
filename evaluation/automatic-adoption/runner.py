#!/usr/bin/env python3
"""Generic command recorder for instruction-mediated repository studies.

This runner deliberately provides no filesystem sandbox.  It records each command
before starting it and streams child stdout/stderr without rewriting their bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import threading
import time
import signal
import tempfile
import unittest
from typing import BinaryIO


def json_line(handle: BinaryIO, value: object) -> None:
    handle.write((json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8"))
    handle.flush()
    os.fsync(handle.fileno())


def ensure_outside(root: Path, destination: Path) -> None:
    try:
        destination.relative_to(root)
    except ValueError:
        return
    raise ValueError("--log must be outside --root so recorder files are not participant files")


def read_events(log_path: Path) -> list[dict]:
    if not log_path.exists():
        return []
    return [json.loads(line) for line in log_path.read_text(encoding="utf-8").splitlines() if line]


def next_sequence(log_path: Path) -> int:
    sequences = [event.get("sequence", 0) for event in read_events(log_path)]
    return max(sequences, default=0) + 1


def digest(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as source:
        while True:
            block = source.read(1024 * 1024)
            if not block:
                return value.hexdigest()
            value.update(block)


def copy_stream(source: BinaryIO, destination: BinaryIO, capture: BinaryIO, state: dict, key: str) -> None:
    size = 0
    checksum = hashlib.sha256()
    try:
        while True:
            block = source.read(64 * 1024)
            if not block:
                break
            capture.write(block)
            capture.flush()
            destination.write(block)
            destination.flush()
            size += len(block)
            checksum.update(block)
    finally:
        state[key] = {"bytes": size, "sha256": checksum.hexdigest()}


def command(arguments: argparse.Namespace) -> int:
    if arguments.max_commands < 1:
        raise ValueError("--max-commands must be positive")
    if arguments.timeout_seconds <= 0:
        raise ValueError("--timeout-seconds must be positive")
    root = Path(arguments.root).resolve(strict=True)
    log_path = Path(arguments.log).resolve()
    ensure_outside(root, log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    sequence = next_sequence(log_path)
    output_dir = log_path.parent / (log_path.stem + ".outputs")
    output_dir.mkdir(parents=True, exist_ok=True)
    prior_commands = sum(event.get("event") == "command_started" for event in read_events(log_path))
    if prior_commands >= arguments.max_commands:
        rejected = {
            "event": "command_rejected",
            "sequence": sequence,
            "recorded_at_ns": time.time_ns(),
            "cwd": str(root),
            "argv": arguments.argv,
            "reason": "command_cap_exceeded",
            "max_commands": arguments.max_commands,
        }
        with log_path.open("ab", buffering=0) as log_handle:
            json_line(log_handle, rejected)
        return 125
    stdout_path = output_dir / f"{sequence:04d}.stdout"
    stderr_path = output_dir / f"{sequence:04d}.stderr"
    started = {
        "event": "command_started",
        "sequence": sequence,
        "recorded_at_ns": time.time_ns(),
        "cwd": str(root),
        "argv": arguments.argv,
        "max_commands": arguments.max_commands,
        "timeout_seconds": arguments.timeout_seconds,
        "output_cap_bytes": arguments.max_output_bytes,
    }
    # This fsync completes before Popen, the critical ordering guarantee.
    with log_path.open("ab", buffering=0) as log_handle:
        json_line(log_handle, started)

    launch_error = None
    timed_out = False
    streams: dict = {}
    with stdout_path.open("wb") as saved_stdout, stderr_path.open("wb") as saved_stderr:
        try:
            process = subprocess.Popen(
                arguments.argv,
                cwd=root,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True,
            )
        except OSError as error:
            streams = {"stdout": {"bytes": 0, "sha256": hashlib.sha256().hexdigest()}, "stderr": {"bytes": 0, "sha256": hashlib.sha256().hexdigest()}}
            child_exit = None
            launch_error = {"type": type(error).__name__, "message": str(error), "errno": error.errno}
        else:
            assert process.stdout is not None and process.stderr is not None
            stdout_thread = threading.Thread(target=copy_stream, args=(process.stdout, sys.stdout.buffer, saved_stdout, streams, "stdout"))
            stderr_thread = threading.Thread(target=copy_stream, args=(process.stderr, sys.stderr.buffer, saved_stderr, streams, "stderr"))
            stdout_thread.start()
            stderr_thread.start()
            try:
                child_exit = process.wait(timeout=arguments.timeout_seconds)
            except subprocess.TimeoutExpired:
                timed_out = True
                os.killpg(process.pid, signal.SIGTERM)
                try:
                    child_exit = process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    os.killpg(process.pid, signal.SIGKILL)
                    child_exit = process.wait()
            stdout_thread.join()
            stderr_thread.join()

    output_bytes = streams["stdout"]["bytes"] + streams["stderr"]["bytes"]
    cap_exceeded = arguments.max_output_bytes is not None and output_bytes > arguments.max_output_bytes
    completed = {
        "event": "command_finished",
        "sequence": sequence,
        "recorded_at_ns": time.time_ns(),
        "child_exit_code": child_exit,
        "returned_exit_code": 127 if launch_error else (124 if timed_out else child_exit),
        "timed_out": timed_out,
        "timeout_seconds": arguments.timeout_seconds,
        "output_cap_exceeded": cap_exceeded,
        "output_cap_bytes": arguments.max_output_bytes,
        "launch_error": launch_error,
        "stdout": {**streams["stdout"], "path": str(stdout_path)},
        "stderr": {**streams["stderr"], "path": str(stderr_path)},
    }
    with log_path.open("ab", buffering=0) as log_handle:
        json_line(log_handle, completed)
    return completed["returned_exit_code"]


def snapshot_tree(root: Path, excluded_roots: set[str]) -> list[dict]:
    records: list[dict] = []
    for directory, directories, files in os.walk(root, followlinks=False):
        current = Path(directory)
        relative_dir = current.relative_to(root).as_posix()
        directories[:] = sorted(name for name in directories if (name if relative_dir == "." else f"{relative_dir}/{name}") not in excluded_roots)
        for name in directories:
            path = current / name
            relative = path.relative_to(root).as_posix()
            if path.is_symlink():
                records.append({"path": relative, "type": "symlink", "target": os.readlink(path)})
            else:
                records.append({"path": relative, "type": "directory"})
        for name in sorted(files):
            path = current / name
            relative = path.relative_to(root).as_posix()
            if path.is_symlink():
                records.append({"path": relative, "type": "symlink", "target": os.readlink(path)})
            else:
                records.append({"path": relative, "type": "file", "bytes": path.stat().st_size, "sha256": digest(path)})
    return records


def finish(arguments: argparse.Namespace) -> int:
    root = Path(arguments.root).resolve(strict=True)
    log_path = Path(arguments.log).resolve()
    ensure_outside(root, log_path)
    log_path.parent.mkdir(parents=True, exist_ok=True)
    sequence = next_sequence(log_path)
    excluded_roots = set(arguments.exclude)
    snapshot = {"event": "final_snapshot", "sequence": sequence, "recorded_at_ns": time.time_ns(), "root": str(root), "excluded_roots": sorted(excluded_roots), "entries": snapshot_tree(root, excluded_roots)}
    with log_path.open("ab", buffering=0) as log_handle:
        json_line(log_handle, snapshot)
    return 0


def parser() -> argparse.ArgumentParser:
    main = argparse.ArgumentParser(description="Record generic staged-root commands without rewriting output.")
    subcommands = main.add_subparsers(dest="operation", required=True)
    for name in ("command", "finish"):
        child = subcommands.add_parser(name)
        child.add_argument("--root", required=True, help="staged repository root")
        child.add_argument("--log", required=True, help="external JSONL recorder log")
    run = subcommands.choices["command"]
    run.add_argument("--max-commands", type=int, default=30, help="maximum command invocations for this log")
    run.add_argument("--timeout-seconds", type=float, default=120, help="per-command wall-time limit")
    run.add_argument("--max-output-bytes", type=int, default=None, help="record all output; mark a post-hoc output threshold breach without truncation")
    run.add_argument("argv", nargs=argparse.REMAINDER, help="command after --")
    complete = subcommands.choices["finish"]
    complete.add_argument("--exclude", action="append", default=["node_modules"], help="relative directory omitted from the final snapshot")
    return main


def main() -> int:
    arguments = parser().parse_args()
    if arguments.operation == "command":
        if not arguments.argv or arguments.argv[0] != "--" or len(arguments.argv) == 1:
            raise SystemExit("command requires: runner.py command ... -- <program> [args...]")
        arguments.argv = arguments.argv[1:]
        return command(arguments)
    return finish(arguments)


class RecorderSelfTest(unittest.TestCase):
    """Deterministic byte-level checks for the public command/finish interface."""

    def run_runner(self, *arguments: str) -> subprocess.CompletedProcess[bytes]:
        return subprocess.run([sys.executable, str(Path(__file__).resolve()), *arguments], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)

    def test_lossless_output_order_caps_and_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary)
            root = base / "packet"
            root.mkdir()
            (root / "source.txt").write_text("source\n", encoding="utf-8")
            (root / "node_modules").mkdir()
            (root / "node_modules" / "omitted.txt").write_text("omit\n", encoding="utf-8")
            log = base / "evidence" / "events.jsonl"
            probe = (
                "from pathlib import Path; import sys; "
                "assert '\"event\":\"command_started\"' in Path(sys.argv[1]).read_text(); "
                "sys.stdout.buffer.write('π'.encode('utf-8') + b'\\0out'); "
                "sys.stderr.buffer.write('err\\0'.encode('utf-8')); "
                "raise SystemExit(7)"
            )
            first = self.run_runner("command", "--root", str(root), "--log", str(log), "--max-commands", "2", "--max-output-bytes", "1", "--", sys.executable, "-c", probe, str(log))
            self.assertEqual(first.returncode, 7)
            self.assertEqual(first.stdout, "π".encode("utf-8") + b"\0out")
            self.assertEqual(first.stderr, b"err\0")
            second = self.run_runner("command", "--root", str(root), "--log", str(log), "--max-commands", "2", "--", "bash", "-lc", "printf shell > shell-created.txt; printf shell-stderr >&2")
            self.assertEqual(second.returncode, 0)
            self.assertEqual(second.stdout, b"")
            self.assertEqual(second.stderr, b"shell-stderr")
            rejected = self.run_runner("command", "--root", str(root), "--log", str(log), "--max-commands", "2", "--", "bash", "-lc", "printf should-not-run > rejected.txt")
            self.assertEqual(rejected.returncode, 125)
            self.assertFalse((root / "rejected.txt").exists())
            missing_log = base / "evidence" / "missing.jsonl"
            missing = self.run_runner("command", "--root", str(root), "--log", str(missing_log), "--", "not-a-real-program")
            self.assertEqual(missing.returncode, 127)
            missing_events = read_events(missing_log)
            self.assertEqual([event["event"] for event in missing_events], ["command_started", "command_finished"])
            self.assertEqual(missing_events[-1]["launch_error"]["type"], "FileNotFoundError")
            completed = self.run_runner("finish", "--root", str(root), "--log", str(log))
            self.assertEqual(completed.returncode, 0)
            events = read_events(log)
            self.assertEqual([event["event"] for event in events], ["command_started", "command_finished", "command_started", "command_finished", "command_rejected", "final_snapshot"])
            self.assertEqual(Path(events[1]["stdout"]["path"]).read_bytes(), first.stdout)
            self.assertEqual(Path(events[1]["stderr"]["path"]).read_bytes(), first.stderr)
            self.assertTrue(events[1]["output_cap_exceeded"])
            snapshot_paths = {entry["path"] for entry in events[-1]["entries"]}
            self.assertIn("source.txt", snapshot_paths)
            self.assertIn("shell-created.txt", snapshot_paths)
            self.assertNotIn("node_modules/omitted.txt", snapshot_paths)


def self_test() -> int:
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(RecorderSelfTest))
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(self_test() if len(sys.argv) == 2 and sys.argv[1] == "self-test" else main())
