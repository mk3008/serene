#!/usr/bin/env python3
"""External Linux inotify observer for prompt-layer packets; never dispatches actors."""
from __future__ import annotations
import argparse, ctypes, json, os, select, signal, struct, subprocess, sys, time
from pathlib import Path

LIBC = ctypes.CDLL(None, use_errno=True)
IN_NONBLOCK, IN_CLOEXEC = 0x800, 0x80000
MASKS = {
    0x00000020: 'OPEN', 0x00000001: 'ACCESS', 0x00000010: 'CLOSE_NOWRITE',
    0x00000400: 'DELETE_SELF', 0x00000800: 'MOVE_SELF', 0x00008000: 'IGNORED',
    0x00002000: 'UNMOUNT', 0x00004000: 'Q_OVERFLOW',
}
WATCH_MASK = 0x00000020 | 0x00000001 | 0x00000010 | 0x00000400 | 0x00000800 | 0x00008000 | 0x00002000 | 0x00004000
STOP = False

def now_ns() -> int: return time.time_ns()
def sha256(path: Path) -> str:
    import hashlib
    h = hashlib.sha256()
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''): h.update(block)
    return h.hexdigest()
def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, sort_keys=True, indent=2) + '\n', encoding='utf-8')
def append(path: Path, value: object) -> None:
    encoded = (json.dumps(value, sort_keys=True, separators=(',', ':')) + '\n').encode()
    with path.open('ab', buffering=0) as handle:
        handle.write(encoded); os.fsync(handle.fileno())
def fail(message: str) -> None: raise SystemExit(message)
def init_fd() -> int:
    fd = LIBC.inotify_init1(IN_NONBLOCK | IN_CLOEXEC)
    if fd < 0: fail(f'inotify_init1 failed: {os.strerror(ctypes.get_errno())}')
    return fd
def add(fd: int, path: Path) -> int:
    wd = LIBC.inotify_add_watch(fd, os.fsencode(path), WATCH_MASK)
    if wd < 0: fail(f'inotify_add_watch {path}: {os.strerror(ctypes.get_errno())}')
    return wd
def event_names(mask: int) -> list[str]: return [name for bit, name in MASKS.items() if mask & bit] or ['OTHER']
def serve(args: argparse.Namespace) -> int:
    global STOP
    evidence = Path(args.evidence).resolve(); watch_list = Path(args.watch_list).resolve()
    paths = json.loads(watch_list.read_text(encoding='utf-8'))['paths']
    if not paths: fail('watch list is empty')
    fd = init_fd(); by_wd: dict[int, str] = {}; event_count = 0; invalidations = 0; overflows = 0
    try:
        for raw in paths:
            target = Path(raw).resolve(strict=True)
            by_wd[add(fd, target)] = str(target)
        pid_path, events_path = evidence/'observer.pid.json', evidence/'inotify-events.jsonl'
        write_json(pid_path, {'pid': os.getpid(), 'started_at_ns': now_ns(), 'watch_list_sha256': sha256(watch_list)})
        health = {'event': 'observer_ready', 'recorded_at_ns': now_ns(), 'pid': os.getpid(), 'watch_count': len(by_wd), 'watch_list_sha256': sha256(watch_list)}
        append(events_path, health)
        print(json.dumps(health), flush=True)
        def stop_handler(_signum, _frame):
            nonlocal_stop[0] = True
        nonlocal_stop = [False]
        signal.signal(signal.SIGTERM, stop_handler); signal.signal(signal.SIGINT, stop_handler)
        while not nonlocal_stop[0]:
            readable, _, _ = select.select([fd], [], [], 0.5)
            if not readable: continue
            data = os.read(fd, 65536); offset = 0
            while offset + 16 <= len(data):
                wd, mask, cookie, length = struct.unpack_from('iIII', data, offset); offset += 16
                name = data[offset:offset + length].rstrip(b'\0').decode('utf-8', 'replace'); offset += length
                names = event_names(mask); event_count += 1
                if 'Q_OVERFLOW' in names: overflows += 1
                if any(item in names for item in ('DELETE_SELF', 'MOVE_SELF', 'IGNORED', 'UNMOUNT')): invalidations += 1
                append(events_path, {'event': 'inotify', 'recorded_at_ns': now_ns(), 'path': by_wd.get(wd), 'names': names, 'mask': mask, 'cookie': cookie, 'name': name})
    finally:
        try: os.close(fd)
        except OSError: pass
        write_json(evidence/'observer-final.json', {'stopped_at_ns': now_ns(), 'pid': os.getpid(), 'watch_count': len(by_wd), 'event_count': event_count, 'invalidation_count': invalidations, 'overflow_count': overflows})
    return 0
def start(args: argparse.Namespace) -> int:
    evidence = Path(args.evidence).resolve(); evidence.mkdir(parents=True, exist_ok=False)
    command = [sys.executable, str(Path(__file__).resolve()), 'serve', '--evidence', str(evidence), '--watch-list', str(Path(args.watch_list).resolve())]
    child = subprocess.Popen(command, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, start_new_session=True)
    assert child.stdout is not None
    ready, _, _ = select.select([child.stdout], [], [], args.ready_timeout)
    if not ready:
        child.terminate(); fail('observer did not become ready before timeout')
    line = child.stdout.readline()
    try: response = json.loads(line)
    except json.JSONDecodeError: child.terminate(); fail(f'observer readiness failed: {line!r}')
    if response.get('event') != 'observer_ready': child.terminate(); fail(f'observer readiness failed: {response!r}')
    write_json(evidence/'observer-start.json', {'command': command, 'ready': response, 'started_by_pid': os.getpid()})
    print(json.dumps({'evidence': str(evidence), 'ready': response}, sort_keys=True))
    return 0
def stop(args: argparse.Namespace) -> int:
    evidence = Path(args.evidence).resolve(); record = json.loads((evidence/'observer.pid.json').read_text())
    pid = record['pid']; os.kill(pid, signal.SIGTERM)
    deadline = time.monotonic() + args.timeout
    while time.monotonic() < deadline:
        if (evidence/'observer-final.json').is_file():
            print(json.dumps(json.loads((evidence/'observer-final.json').read_text()), sort_keys=True)); return 0
        time.sleep(0.05)
    fail('observer did not write final health record')
def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest='operation', required=True)
    for name in ('start', 'serve'):
        child = sub.add_parser(name); child.add_argument('--evidence', required=True); child.add_argument('--watch-list', required=True)
    sub.choices['start'].add_argument('--ready-timeout', type=float, default=5)
    child = sub.add_parser('stop'); child.add_argument('--evidence', required=True); child.add_argument('--timeout', type=float, default=5)
    args = parser.parse_args()
    return start(args) if args.operation == 'start' else (serve(args) if args.operation == 'serve' else stop(args))
if __name__ == '__main__': raise SystemExit(main())
