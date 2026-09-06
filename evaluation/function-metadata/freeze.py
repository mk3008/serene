"""Build the post-probe freeze manifest; never overwrite an existing freeze."""
from __future__ import annotations

from pathlib import Path
import hashlib
import json
import subprocess
import sys

P = Path(__file__).resolve().parent
REPO = P.parent.parent
FREEZE = P / 'freeze.json'

class IntegrityError(RuntimeError):
    pass

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def repo_path(path: Path) -> str:
    return path.resolve().relative_to(REPO).as_posix()

def add(files: dict[str, str], path: Path) -> None:
    if not path.is_file():
        raise IntegrityError(f'missing required file: {path}')
    files[repo_path(path)] = sha256(path)

def add_tree(files: dict[str, str], root: Path) -> None:
    if not root.is_dir():
        raise IntegrityError(f'missing required directory: {root}')
    for path in sorted(root.rglob('*')):
        if path.is_file() and '__pycache__' not in path.parts:
            add(files, path)

def fixture_root(run: dict) -> Path:
    return REPO / 'evaluation' / 'end-to-end' / 'tasks' / run['task'] / run['arm']

def fixture_files(run: dict) -> dict[str, str]:
    source = fixture_root(run)
    result = {path.relative_to(source).as_posix(): sha256(path)
              for path in sorted(source.rglob('*')) if path.is_file()}
    readme = source.parent / 'README.md'
    if not readme.is_file():
        raise IntegrityError(f'missing fixture README: {readme}')
    result['README.md'] = sha256(readme)
    return result

def git(root: Path, *args: str) -> str:
    return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()

def staged_snapshot(run: str, config: dict) -> dict:
    root = Path(config['root']).resolve()
    if not root.is_dir():
        raise IntegrityError(f'{run}: staged root does not exist: {root}')
    revision = git(root, 'rev-parse', 'HEAD')
    if revision != config['revision']:
        raise IntegrityError(f'{run}: staged HEAD differs from run-config revision')
    if git(root, 'status', '--porcelain'):
        raise IntegrityError(f'{run}: staged root is dirty')
    actual = {path.relative_to(root).as_posix(): sha256(path)
              for path in sorted(root.rglob('*')) if path.is_file() and '.git' not in path.parts}
    expected = fixture_files(config)
    if actual != expected:
        raise IntegrityError(f'{run}: staged source is not byte-identical to its fixture')
    return {'revision': revision, 'fixture': repo_path(fixture_root(config)), 'files': actual}

def manifest() -> dict:
    config_path = P / 'run-config.json'
    config = json.loads(config_path.read_text())
    files: dict[str, str] = {}
    # All executable successor inputs, including generated prompts and checks.
    for name in ['README.md', 'filter.mjs', 'controller.py', 'metadata.py', 'prepare.py', 'prompt.txt',
                 'run-config.json', 'score.py', 'report-cost.py', 'summarize-costs.py', 'freeze.py', 'verify-integrity.py']:
        add(files, P / name)
    for path in sorted(P.glob('prompts/*.txt')):
        add(files, path)
    for path in sorted(P.glob('test-*.py')) + sorted(P.glob('test-*.mjs')):
        add(files, path)
    add_tree(files, P / 'adversarial')
    protocol = P / 'PROTOCOL.md'
    if protocol.exists():
        add(files, protocol)

    # Production audit/runtime imported by the successor filter.
    for path in [REPO / 'package.json', REPO / 'package-lock.json',
                 REPO / 'tooling' / 'audit.mjs', REPO / 'tooling' / 'audit.d.mts']:
        add(files, path)
    add_tree(files, REPO / 'dist')

    # Frozen scorer and raw comparison evidence reused by this successor.
    for path in [REPO / 'evaluation' / 'pre-exposure' / 'score.py',
                 REPO / 'evaluation' / 'pre-exposure' / 'scores.json',
                 REPO / 'evaluation' / 'pre-exposure' / 'probe-scores.json']:
        add(files, path)
    for name, relative in config.get('raw_references', {}).items():
        path = (P / relative).resolve()
        if not path.is_relative_to(REPO):
            raise IntegrityError(f'{name}: raw reference escapes repository')
        add(files, path)
    # Cost comparisons read these frozen prompt/log pairs directly: Raw tr/sr and
    # the historical Serene ts/ss treatment, never a rerun of either arm.
    for name in ['tr', 'sr', 'ts', 'ss']:
        add(files, REPO / 'evaluation' / 'pre-exposure' / 'prompts' / f'{name}.txt')
        add(files, REPO / 'evaluation' / 'pre-exposure' / 'results' / f'{name}.jsonl')

    # Gold and fixtures are immutable inputs even though staged copies live in /tmp.
    for run in config['runs'].values():
        add_tree(files, fixture_root(run))
        add(files, fixture_root(run).parent / 'README.md')
        add(files, REPO / 'evaluation' / 'end-to-end' / 'gold' / f"{run['task']}.json")

    return {
        'schema': 1,
        'files': dict(sorted(files.items())),
        'staged_runs': {name: staged_snapshot(name, run) for name, run in sorted(config['runs'].items())},
    }

def verify(frozen: dict) -> None:
    if frozen.get('schema') != 1:
        raise IntegrityError('unsupported freeze schema')
    current = manifest()
    if frozen.get('files') != current['files']:
        raise IntegrityError('hashed dependency mismatch')
    if frozen.get('staged_runs') != current['staged_runs']:
        raise IntegrityError('staged run snapshot mismatch')

def main(argv: list[str]) -> None:
    if argv not in ([], ['--write']):
        raise SystemExit('usage: freeze.py [--write]')
    if argv == ['--write']:
        if FREEZE.exists():
            raise SystemExit('refusing to overwrite existing freeze.json')
        FREEZE.write_text(json.dumps(manifest(), indent=2) + '\n')
        print(FREEZE)
        return
    if not FREEZE.exists():
        raise SystemExit('freeze.json absent; create it only after parent probe adjudication with freeze.py --write')
    verify(json.loads(FREEZE.read_text()))
    print('Function-metadata freeze verified')

if __name__ == '__main__':
    main(sys.argv[1:])
