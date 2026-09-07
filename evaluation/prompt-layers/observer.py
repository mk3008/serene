#!/usr/bin/env python3
"""Session-held external Linux inotify observer; it never dispatches an actor."""
from __future__ import annotations
import argparse, ctypes, json, os, select, signal, struct, sys, time
from pathlib import Path

LIBC = ctypes.CDLL(None, use_errno=True)
IN_NONBLOCK, IN_CLOEXEC = 0x800, 0x80000
MASKS = {0x20: 'OPEN', 0x1: 'ACCESS', 0x10: 'CLOSE_NOWRITE', 0x400: 'DELETE_SELF', 0x800: 'MOVE_SELF', 0x8000: 'IGNORED', 0x2000: 'UNMOUNT', 0x4000: 'Q_OVERFLOW'}
WATCH_MASK = sum(MASKS)
def now_ns() -> int: return time.time_ns()
def sha256(path: Path) -> str:
    import hashlib
    value = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''): value.update(block)
    return value.hexdigest()
def write_json(path: Path, value: object) -> None: path.write_text(json.dumps(value, sort_keys=True, indent=2) + '\n', encoding='utf-8')
def append(path: Path, value: object) -> None:
    with path.open('ab', buffering=0) as output:
        output.write((json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()); os.fsync(output.fileno())
def names(mask: int) -> list[str]: return [name for bit, name in MASKS.items() if mask & bit] or ['OTHER']
def session(args: argparse.Namespace) -> int:
    evidence, watch_list, stop = Path(args.evidence).resolve(), Path(args.watch_list).resolve(), Path(args.stop_file).resolve()
    if evidence.exists(): raise SystemExit(f'observer evidence already exists: {evidence}')
    evidence.mkdir(parents=True)
    paths = json.loads(watch_list.read_text(encoding='utf-8'))['paths']
    if not paths: raise SystemExit('watch list is empty')
    fd = LIBC.inotify_init1(IN_NONBLOCK | IN_CLOEXEC)
    if fd < 0: raise SystemExit(f'inotify_init1 failed: {os.strerror(ctypes.get_errno())}')
    by_wd: dict[int, str] = {}; event_count = invalidations = overflows = 0
    try:
        for raw in paths:
            target = Path(raw).resolve(strict=True); wd = LIBC.inotify_add_watch(fd, os.fsencode(target), WATCH_MASK)
            if wd < 0: raise SystemExit(f'inotify_add_watch {target}: {os.strerror(ctypes.get_errno())}')
            by_wd[wd] = str(target)
        ready = {'event': 'observer_ready', 'recorded_at_ns': now_ns(), 'pid': os.getpid(), 'watch_count': len(by_wd), 'watch_list_sha256': sha256(watch_list), 'stop_file': str(stop)}
        write_json(evidence/'observer-start.json', ready); append(evidence/'inotify-events.jsonl', ready)
        print(json.dumps(ready), flush=True)
        while not stop.exists():
            readable, _, _ = select.select([fd], [], [], 0.2)
            if not readable: continue
            data = os.read(fd, 65536); offset = 0
            while offset + 16 <= len(data):
                wd, mask, cookie, length = struct.unpack_from('iIII', data, offset); offset += 16
                name = data[offset:offset + length].rstrip(b'\0').decode('utf-8', 'replace'); offset += length
                observed = names(mask); event_count += 1
                if 'Q_OVERFLOW' in observed: overflows += 1
                if any(item in observed for item in ('DELETE_SELF', 'MOVE_SELF', 'IGNORED', 'UNMOUNT')): invalidations += 1
                append(evidence/'inotify-events.jsonl', {'event': 'inotify', 'recorded_at_ns': now_ns(), 'path': by_wd.get(wd), 'names': observed, 'mask': mask, 'cookie': cookie, 'name': name})
    finally:
        os.close(fd)
        write_json(evidence/'observer-final.json', {'stopped_at_ns': now_ns(), 'pid': os.getpid(), 'watch_count': len(by_wd), 'event_count': event_count, 'invalidation_count': invalidations, 'overflow_count': overflows, 'stopped_by_shared_sentinel': stop.exists()})
    return 0
def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest='operation', required=True)
    command = sub.add_parser('session'); command.add_argument('--evidence', required=True); command.add_argument('--watch-list', required=True); command.add_argument('--stop-file', required=True)
    args = parser.parse_args(); return session(args)
if __name__ == '__main__': raise SystemExit(main())
