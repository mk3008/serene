#!/usr/bin/env python3
"""Deterministic local checks for prompt-layer observation; no packet is staged or dispatched."""
from __future__ import annotations
import json, os, subprocess, sys, tarfile, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
TARBALL = REPO/'evaluation'/'automatic-adoption'/'artifacts'/'mk3008-serene-0.1.0.tgz'
sys.path.insert(0, str(HERE)); from stage import inject_hook, sha, watch_paths, write_json  # noqa: E402

def run(command: list[str], cwd: Path) -> subprocess.CompletedProcess[bytes]:
    return subprocess.run(command, cwd=cwd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
def install(app: Path) -> None:
    """Materialize the frozen tarball without requiring an npm registry/cache."""
    with tarfile.open(TARBALL, 'r:gz') as archive:
        archive.extractall(app/'node_modules/@mk3008', filter='data')
    package = app/'node_modules/@mk3008/package'
    package.rename(app/'node_modules/@mk3008/serene')
    typescript = REPO/'node_modules/typescript'
    if not typescript.is_dir(): raise RuntimeError('workspace TypeScript runtime is unavailable')
    os.symlink(typescript, app/'node_modules/typescript', target_is_directory=True)
    bin = app/'node_modules/.bin'; bin.mkdir(parents=True)
    shim = bin/'serene-audit'
    shim.write_text(f'#!/bin/sh\nexec "{sys.executable}" "{app}/node_modules/@mk3008/serene/tooling/cli.mjs" "$@"\n')
    # Use Node, not Python, in the shim; the next line replaces the generated path.
    node = subprocess.run(['node', '-p', 'process.execPath'], stdout=subprocess.PIPE, check=True).stdout.decode().strip()
    shim.write_text(f'#!/bin/sh\nexec "{node}" "{app}/node_modules/@mk3008/serene/tooling/cli.mjs" "$@"\n')
    shim.chmod(0o755)
def app(path: Path) -> None:
    path.mkdir(); (path/'package.json').write_text('{"name":"prompt-layer-preflight","private":true,"type":"module"}\n')
    (path/'ordinary.mjs').write_text("import { bind, sql } from '@mk3008/serene';\nconst q = bind(sql`SELECT :id AS id`, { id: 1 });\ndb.query(q.text, q.params);\n")
    (path/'violation.mjs').write_text("const id = request.id;\ndb.query('SELECT * FROM accounts WHERE id = ' + id);\n")
def invocation(app_root: Path, direct: bool, args: list[str]) -> subprocess.CompletedProcess[bytes]:
    cli = app_root/'node_modules/@mk3008/serene/tooling/cli.mjs'
    node = subprocess.run(['node', '-p', 'process.execPath'], stdout=subprocess.PIPE, check=True).stdout.decode().strip()
    command = [node, str(cli), *args] if direct else [str(app_root/'node_modules/.bin/serene-audit'), *args]
    return run(command, app_root)
def main() -> int:
    if not TARBALL.is_file(): raise SystemExit(f'missing artifact {TARBALL}')
    with tempfile.TemporaryDirectory(prefix='prompt-layers-preflight-') as temporary:
        base = Path(temporary); original, instrumented = base/'original', base/'instrumented'
        app(original); app(instrumented); install(original); install(instrumented)
        module = instrumented/'node_modules/@mk3008/serene/tooling/cli.mjs'; original_hash, instrumented_hash = inject_hook(module, (HERE/'cli-entry-hook.mjs').read_bytes())
        cases = {'help': ['--help'], 'ordinary': ['ordinary.mjs'], 'violation': ['violation.mjs'], 'invalidarg': ['--unknown-option', 'ordinary.mjs']}
        comparisons = []
        for kind, arguments in cases.items():
            for direct in (False, True):
                left, right = invocation(original, direct, arguments), invocation(instrumented, direct, arguments)
                same = (left.returncode, left.stdout, left.stderr) == (right.returncode, right.stdout, right.stderr)
                comparisons.append({'case': kind, 'entry': 'node-cli' if direct else 'bin', 'same_exit_stdout_stderr_bytes': same, 'exit_code': left.returncode, 'stdout_bytes': len(left.stdout), 'stderr_bytes': len(left.stderr)})
                if not same: raise RuntimeError(f'CLI parity failed for {kind} / {"node" if direct else "bin"}')
        cli_events = base/'evidence'/'instrumented'/'cli-events.jsonl'
        entries = [json.loads(line) for line in cli_events.read_text().splitlines()]
        if len(entries) != len(comparisons) or any(item.get('event') != 'cli_entry' for item in entries): raise RuntimeError('instrumented CLI entry events are incomplete')
        observed_root = base/'watch-root'; observed_root.mkdir(); evidence = base/'watch-evidence'; evidence.mkdir()
        for name, content in {'AGENTS.md':'Work here.\n', 'README.md':'Readme.\n', 'package.json':'{}\n', 'app.mjs':'export {};\n'}.items(): (observed_root/name).write_text(content)
        docs = observed_root/'node_modules/@mk3008/serene/docs'; docs.mkdir(parents=True); (observed_root/'node_modules/@mk3008/serene/README.md').write_text('doc\n'); (observed_root/'node_modules/@mk3008/serene/package.json').write_text('{}\n'); (docs/'guide.md').write_text('guide\n')
        watch_list = evidence/'watch-list.json'; write_json(watch_list, {'paths': [str(path) for path in watch_paths(observed_root)]})
        observer_evidence, stop_file = evidence/'observer', evidence/'observer.stop'
        monitor = subprocess.Popen([sys.executable, str(HERE/'observer.py'), 'session', '--evidence', str(observer_evidence), '--watch-list', str(watch_list), '--stop-file', str(stop_file)], cwd=REPO, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        deadline = __import__('time').monotonic() + 5
        while not (observer_evidence/'observer-start.json').is_file() and __import__('time').monotonic() < deadline: __import__('time').sleep(0.02)
        if not (observer_evidence/'observer-start.json').is_file():
            monitor.terminate(); raise RuntimeError('session-held observer did not become ready')
        for watched in json.loads(watch_list.read_text())['paths']: Path(watched).read_bytes()
        stop_file.write_text('stop\n')
        if monitor.wait(timeout=5): raise RuntimeError((monitor.stderr.read() or b'').decode())
        event_rows = [json.loads(line) for line in (observer_evidence/'inotify-events.jsonl').read_text().splitlines()]
        if not any(row.get('event') == 'inotify' and 'OPEN' in row.get('names', []) for row in event_rows): raise RuntimeError('inotify observer did not report OPEN')
        result = {'status': 'pass', 'artifact': sha(TARBALL), 'cli_module_original': original_hash, 'cli_module_instrumented': instrumented_hash, 'parity': comparisons, 'instrumented_successful_entry_events': len(entries), 'observer_events': len(event_rows), 'observer_records_open_access_only': True}
        print(json.dumps(result, indent=2, sort_keys=True))
    return 0
if __name__ == '__main__': raise SystemExit(main())
