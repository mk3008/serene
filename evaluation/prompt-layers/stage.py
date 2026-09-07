#!/usr/bin/env python3
"""Stage opaque prompt-layer packets and observers; never dispatches participants."""
from __future__ import annotations
import argparse, hashlib, json, os, shutil, sys, tarfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
TARBALL = REPO/'evaluation'/'automatic-adoption'/'artifacts'/'mk3008-serene-0.1.0.tgz'
RUNTIME = Path('/tmp/repository-flow-probe')
POLICY = ('Use `@mk3008/serene` as the default construction path for executable raw SQL; if it cannot preserve needed SQL behavior, keep the exception explicit for additional review. For SQL-construction review, use the installed `serene-audit` and keep unresolved paths in review. Use ordinary results to skip redundant construction-provenance review, not SQL meaning/binding, authorization, or business-behavior checks.\n')
RUNS = {
    'p01': ('coding', 'neutral', False), 'p02': ('coding', 'policy', False),
    'p03': ('coding', 'neutral', True), 'p04': ('coding', 'policy', True),
    'p05': ('review', 'neutral', False), 'p06': ('review', 'policy', False),
    'p07': ('authorization', 'policy', False), 'p08': ('authorization', 'neutral', False),
    'p09': ('coding', 'neutral', False),
}
def sha(path: Path) -> dict:
    digest = hashlib.sha256(); size = 0
    with path.open('rb') as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b''): size += len(block); digest.update(block)
    return {'bytes': size, 'sha256': digest.hexdigest()}
def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True); path.write_text(json.dumps(value, sort_keys=True, indent=2) + '\n', encoding='utf-8')
def file_inventory(root: Path, exclude: tuple[str, ...] = ('node_modules', '.git')) -> dict:
    rows = {}
    for path in sorted(root.rglob('*')):
        rel = path.relative_to(root).as_posix()
        if any(rel == item or rel.startswith(item + '/') for item in exclude): continue
        if path.is_file(): rows[rel] = sha(path)
    return rows
def inject_hook(module: Path, hook: bytes) -> tuple[dict, dict]:
    original = module.read_bytes(); before = sha(module)
    shebang, newline, remainder = original.partition(b'\n')
    if not shebang.startswith(b'#!') or not newline: raise ValueError(f'CLI module has no shebang: {module}')
    if b'Evaluation-only hook: inserted verbatim' in original: raise ValueError(f'CLI module already instrumented: {module}')
    module.write_bytes(shebang + newline + hook + remainder)
    return before, sha(module)
FIXTURES = {'coding': 'coding/customer-email', 'review': 'review/customer-export', 'authorization': 'auth/document-access'}
def fixture_path(workflow: str) -> Path: return HERE/'fixtures'/FIXTURES[workflow]
def tree_hash(root: Path) -> dict:
    rows = []
    for path in sorted(root.rglob('*')):
        if path.is_file():
            record = sha(path); rows.append(f"{path.relative_to(root).as_posix()}\0{record['bytes']}\0{record['sha256']}\n")
    encoded = ''.join(rows).encode(); return {'files': len(rows), 'sha256': hashlib.sha256(encoded).hexdigest()}
def materialize_runtime(root: Path) -> dict:
    """Install only the pre-existing frozen package bytes and local TypeScript runtime."""
    package_parent = root/'node_modules/@mk3008'; package_parent.mkdir(parents=True)
    with tarfile.open(TARBALL, 'r:gz') as archive: archive.extractall(package_parent, filter='data')
    extracted = package_parent/'package'; installed = package_parent/'serene'
    if not extracted.is_dir() or installed.exists(): raise ValueError('unexpected frozen package extraction layout')
    extracted.rename(installed)
    typescript_source = REPO/'node_modules/typescript'; typescript_target = root/'node_modules/typescript'
    if not typescript_source.is_dir(): raise ValueError('workspace TypeScript runtime is unavailable')
    version = json.loads((typescript_source/'package.json').read_text(encoding='utf-8')).get('version')
    if version != '5.9.3': raise ValueError(f'unexpected workspace TypeScript version: {version!r}')
    shutil.copytree(typescript_source, typescript_target)
    if json.loads((typescript_target/'package.json').read_text(encoding='utf-8')).get('version') != version: raise ValueError('copied TypeScript version mismatch')
    cli = installed/'tooling/cli.mjs'; cli.chmod(0o755)
    bin_directory = root/'node_modules/.bin'; bin_directory.mkdir(parents=True)
    os.symlink('../@mk3008/serene/tooling/cli.mjs', bin_directory/'serene-audit')
    return {'mode': 'committed-tarball-plus-copied-workspace-typescript; no npm installation lifecycle', 'artifact': sha(TARBALL), 'typescript': {'version': version, 'source_tree': tree_hash(typescript_source), 'installed_tree': tree_hash(typescript_target)}, 'installed_package_json': sha(installed/'package.json'), 'installed_bin': str(bin_directory/'serene-audit'), 'package_lock': None}
def declare_runtime_dependencies(root: Path) -> dict:
    manifest = root/'package.json'; data = json.loads(manifest.read_text(encoding='utf-8'))
    data.setdefault('dependencies', {})['@mk3008/serene'] = '0.1.0'
    data.setdefault('devDependencies', {})['typescript'] = '5.9.3'
    manifest.write_text(json.dumps(data, sort_keys=True, separators=(',', ':')) + '\n', encoding='utf-8')
    return sha(manifest)
def normal_prompt(root: Path, task: str, cue: bool, task_cue: bool) -> str:
    prompt = f'Work in {root}.\n\n{task.rstrip()}\n'
    if cue: prompt += '\nRead and follow AGENTS.md before working.\n'
    if task_cue: prompt += '\nUse `@mk3008/serene` for executable raw SQL in this task.\n'
    return prompt
def installed_docs(root: Path) -> list[Path]:
    package = root/'node_modules/@mk3008/serene'; result = [package/'README.md', package/'package.json']
    if (package/'docs').is_dir(): result.extend(sorted((package/'docs').glob('*.md')))
    return [item for item in result if item.is_file()]
def watch_paths(root: Path) -> list[Path]:
    paths = [root/'AGENTS.md', root/'README.md', root/'package.json']
    paths.extend(sorted(path for path in root.glob('*.mjs') if path.name not in {'test.mjs'}))
    paths.extend(installed_docs(root))
    return paths
def stage(args: argparse.Namespace) -> int:
    workflow, policy, cue = RUNS[args.run_id]
    if args.run_id == 'p09' and not args.allow_optional_p09: raise SystemExit('p09 is optional and requires --allow-optional-p09 after its PLAN condition is satisfied')
    fixture = fixture_path(workflow)
    if not fixture.is_dir(): raise SystemExit(f'fixture is not ready: {fixture}')
    runtime = Path(args.runtime).resolve(); root, evidence = runtime/args.run_id, runtime/'evidence'/args.run_id
    if root.exists() or evidence.exists(): raise SystemExit('refusing to overwrite a staged root or evidence directory')
    if not TARBALL.is_file(): raise SystemExit(f'missing frozen package artifact: {TARBALL}')
    runtime.mkdir(parents=True, exist_ok=True); shutil.copytree(fixture, root, ignore=shutil.ignore_patterns('node_modules', '.git'))
    agents = root/'AGENTS.md'; agents.write_text('Work in this repository.\n' + (POLICY if policy == 'policy' else ''), encoding='utf-8')
    evidence.mkdir(parents=True)
    declared_package_json = declare_runtime_dependencies(root)
    runtime_materialization = materialize_runtime(root)
    module = root/'node_modules/@mk3008/serene/tooling/cli.mjs'; hook = (HERE/'cli-entry-hook.mjs').read_bytes()
    original_module, instrumented_module = inject_hook(module, hook)
    docs = installed_docs(root); watch_list = {'paths': [str(path.resolve()) for path in watch_paths(root)]}
    write_json(evidence/'watch-list.json', watch_list)
    task = (root/'TASK.md').read_text(encoding='utf-8')
    initial = normal_prompt(root, task, cue, args.run_id == 'p09')
    (evidence/'initial-prompt.txt').write_text(initial, encoding='utf-8')
    manifest = {
        'run_id': args.run_id, 'workflow': workflow, 'policy': policy, 'load_cue': cue, 'optional_task_cue': args.run_id == 'p09',
        'requested_participant': {'model': 'gpt-5.6-luna', 'reasoning_effort': 'medium', 'fresh_session': True, 'fork_turns': 'none'},
        'paths': {'packet_root': str(root), 'evidence': str(evidence)},
        'source_hashes': {'stage.py': sha(Path(__file__)), 'observer.py': sha(HERE/'observer.py'), 'cli-entry-hook.mjs': sha(HERE/'cli-entry-hook.mjs'), 'artifact': sha(TARBALL)},
        'runtime_materialization': runtime_materialization, 'declared_packet_package_json': declared_package_json,
        'cli_module': {'path': str(module), 'original': original_module, 'instrumented': instrumented_module},
        'initial_prompt': sha(evidence/'initial-prompt.txt'), 'initial_snapshot_excluding_dependencies': file_inventory(root),
        'installed_docs': {str(path.relative_to(root)): sha(path) for path in docs}, 'watch_list': sha(evidence/'watch-list.json'),
        'observer_contract': 'Keep observer.py session alive in the same yielding tool session across actor commands; start before dispatch and create its shared stop-file before any parent harvest. Events prove file-system activity only, not PID, model comprehension, receipt, or use.',
    }
    write_json(evidence/'stage-manifest.json', manifest)
    print(json.dumps({'run_id': args.run_id, 'packet_root': str(root), 'evidence': str(evidence), 'observer_session': [sys.executable, str(HERE/'observer.py'), 'session', '--evidence', str(evidence/'observer'), '--watch-list', str(evidence/'watch-list.json'), '--stop-file', str(evidence/'observer.stop')]}, sort_keys=True))
    return 0
def verify(args: argparse.Namespace) -> int:
    evidence = Path(args.evidence).resolve(); manifest = json.loads((evidence/'stage-manifest.json').read_text())
    module = Path(manifest['cli_module']['path']); current = sha(module)
    expected = manifest['cli_module']['instrumented']
    if current != expected: raise SystemExit('installed CLI module hash changed')
    watch = json.loads((evidence/'watch-list.json').read_text())
    missing = [path for path in watch['paths'] if not Path(path).is_file()]
    if missing: raise SystemExit(f'watched paths changed or disappeared: {missing}')
    cli_log = evidence/'cli-events.jsonl'
    events = []
    if cli_log.exists():
        try: events = [json.loads(line) for line in cli_log.read_text(encoding='utf-8').splitlines() if line]
        except json.JSONDecodeError as error: raise SystemExit(f'invalid CLI event JSONL: {error}')
        bin_path = str(Path(manifest['runtime_materialization']['installed_bin']))
        for event in events:
            argv = event.get('argv')
            if event.get('event') != 'cli_entry' or not isinstance(argv, list) or len(argv) < 2 or argv[1] not in (str(module), bin_path):
                raise SystemExit('CLI event log does not match a staged CLI entry form')
    result = {'status': 'pass', 'cli_module': current, 'watch_paths': len(watch['paths']), 'cli_event_log': {'path': str(cli_log), 'exists': cli_log.exists(), 'entries': len(events)}}
    write_json(evidence/'postrun-integrity.json', result); print(json.dumps(result, sort_keys=True)); return 0
def harvest(args: argparse.Namespace) -> int:
    evidence = Path(args.evidence).resolve(); root = Path(json.loads((evidence/'stage-manifest.json').read_text())['paths']['packet_root'])
    if not (evidence/'observer'/'observer-final.json').is_file(): raise SystemExit('refusing harvest until observer final health is present')
    verify(argparse.Namespace(evidence=str(evidence)))
    destination = Path(args.destination).resolve()
    if destination.exists(): raise SystemExit(f'refusing to overwrite {destination}')
    destination.mkdir(parents=True); shutil.copytree(root, destination/'packet', ignore=shutil.ignore_patterns('node_modules', '.git')); shutil.copytree(evidence, destination/'evidence')
    write_json(destination/'final-manifest.json', {'packet': file_inventory(destination/'packet'), 'evidence': file_inventory(destination/'evidence'), 'source_root': str(root)})
    print(json.dumps({'archive': str(destination)}, sort_keys=True)); return 0
def parity(args: argparse.Namespace) -> int:
    runtime = Path(args.runtime).resolve(); pairs = [('p01','p02'), ('p01','p03'), ('p02','p04'), ('p03','p04'), ('p05','p06'), ('p07','p08')]
    records = []
    for left, right in pairs:
        a_path, b_path = runtime/'evidence'/left/'stage-manifest.json', runtime/'evidence'/right/'stage-manifest.json'
        if not a_path.is_file() or not b_path.is_file(): raise SystemExit(f'missing staged pair {left}/{right}')
        a, b = json.loads(a_path.read_text()), json.loads(b_path.read_text())
        runtime_a, runtime_b = a['runtime_materialization'], b['runtime_materialization']
        same = {
            'workflow': a['workflow'] == b['workflow'],
            'source_hashes': a['source_hashes'] == b['source_hashes'],
            'installed_docs': a['installed_docs'] == b['installed_docs'],
            'cli_module_bytes': {key: a['cli_module'][key] for key in ('original', 'instrumented')} == {key: b['cli_module'][key] for key in ('original', 'instrumented')},
            'runtime_bytes': {key: runtime_a[key] for key in ('mode', 'artifact', 'typescript', 'installed_package_json', 'package_lock')} == {key: runtime_b[key] for key in ('mode', 'artifact', 'typescript', 'installed_package_json', 'package_lock')},
            'declared_packet_package_json': a['declared_packet_package_json'] == b['declared_packet_package_json'],
        }
        # Snapshot equality apart from AGENTS is the packet parity check; prompts may differ only for H/p09.
        files_a, files_b = a['initial_snapshot_excluding_dependencies'], b['initial_snapshot_excluding_dependencies']
        changed = sorted(set(files_a) | set(files_b)); changed = [key for key in changed if files_a.get(key) != files_b.get(key)]
        allowed = ['AGENTS.md'] if a['policy'] != b['policy'] else []
        def canonical_prompt(item: dict) -> str:
            root = Path(item['paths']['packet_root'])
            actual = (Path(item['paths']['evidence'])/'initial-prompt.txt').read_text(encoding='utf-8')
            expected = normal_prompt(root, (root/'TASK.md').read_text(encoding='utf-8'), item['load_cue'], item['optional_task_cue'])
            if actual != expected: raise SystemExit(f'initial prompt no longer matches the declared normal task/cues for {item["run_id"]}')
            return actual.replace(str(root), '<packet-root>')
        prompt_equal = canonical_prompt(a) == canonical_prompt(b)
        expected_prompt_equal = a['load_cue'] == b['load_cue'] and a['optional_task_cue'] == b['optional_task_cue']
        passed = changed == allowed and all(same.values()) and prompt_equal == expected_prompt_equal
        records.append({'pair': [left, right], 'changed_packet_files': changed, 'expected_changed_packet_files': allowed, 'non_treatment_equal': same, 'canonical_prompt_equal': prompt_equal, 'expected_canonical_prompt_equal': expected_prompt_equal, 'pass': passed})
    output = {'status': 'pass' if all(record['pass'] for record in records) else 'fail', 'pairs': records}
    write_json(runtime/'evidence'/'parity.json', output); print(json.dumps(output, sort_keys=True)); return 0 if output['status'] == 'pass' else 1

def freeze(args: argparse.Namespace) -> int:
    runtime = Path(args.runtime).resolve(); run_ids = list(RUNS) if args.include_optional_p09 else [item for item in RUNS if item != 'p09']
    manifests = {}
    for run_id in run_ids:
        evidence = runtime/'evidence'/run_id; manifest_path = evidence/'stage-manifest.json'
        if not manifest_path.is_file(): raise SystemExit(f'missing staged manifest for {run_id}')
        if (evidence/'observer').exists() or (evidence/'cli-events.jsonl').exists(): raise SystemExit(f'{run_id} has observer or CLI activity; restage before freeze')
        manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        if manifest.get('run_id') != run_id: raise SystemExit(f'run ID mismatch for {run_id}')
        prompt_path = evidence/'initial-prompt.txt'; prompt = prompt_path.read_text(encoding='utf-8')
        if sha(prompt_path) != manifest['initial_prompt']: raise SystemExit(f'initial prompt hash changed for {run_id}')
        manifests[run_id] = manifest
    requested = {json.dumps(item['requested_participant'], sort_keys=True) for item in manifests.values()}
    if len(requested) != 1: raise SystemExit('participant configuration differs across staged packets')
    policy_bytes = {item['policy']: sha(Path(item['paths']['packet_root'])/'AGENTS.md') for item in manifests.values()}
    result = {
        'status': 'frozen', 'runtime': str(runtime), 'runs': run_ids,
        'requested_participant': json.loads(next(iter(requested))),
        'dispatch_order': [run_id for run_id in run_ids if run_id != 'p09'], 'max_concurrent_sessions': 2,
        'optional_p09': {'staged_predeclared': 'p09' in manifests, 'dispatch_state': 'pending', 'condition': 'only after p02 has final valid feature behavior and no Serene adoption', 'eligibility_command': 'stage.py eligibility --run-id p09 --p02-adjudication <adjudication.json>'},
        'observer_state': 'not started; no actor dispatched',
        'policy_files': policy_bytes,
        'frozen_protocol_inputs': {
            'PLAN.md': sha(HERE/'PLAN.md'), 'PREFLIGHT.md': sha(HERE/'PREFLIGHT.md'), 'preflight-record.json': sha(HERE/'preflight-record.json'),
            'implementations': {name: sha(HERE/name) for name in ('stage.py', 'observer.py', 'cli-entry-hook.mjs', 'preflight.py')},
            'fixtures': {name: file_inventory(HERE/'fixtures'/name) for name in FIXTURES.values()},
            'gold': {name: file_inventory(HERE/'gold'/name) for name in FIXTURES.values()},
            'infrastructure_preflight': file_inventory(HERE/'infrastructure-failures'),
        },
        'packets': {run_id: {
            'workflow': item['workflow'], 'policy': item['policy'], 'load_cue': item['load_cue'], 'optional_task_cue': item['optional_task_cue'],
            'packet_root': item['paths']['packet_root'], 'evidence': item['paths']['evidence'],
            'initial_prompt': {'text': (runtime/'evidence'/run_id/'initial-prompt.txt').read_text(encoding='utf-8'), **item['initial_prompt']},
            'initial_snapshot_excluding_dependencies': item['initial_snapshot_excluding_dependencies'],
            'source_hashes': item['source_hashes'], 'runtime_materialization': item['runtime_materialization'],
            'cli_module': item['cli_module'], 'installed_docs': item['installed_docs'], 'watch_list': item['watch_list'],
        } for run_id, item in manifests.items()},
    }
    output = runtime/'evidence'/'freeze-manifest.json'; write_json(output, result); print(json.dumps({'status': 'frozen', 'manifest': str(output), 'runs': run_ids}, sort_keys=True)); return 0

def eligibility(args: argparse.Namespace) -> int:
    if args.run_id != 'p09':
        print(json.dumps({'run_id': args.run_id, 'eligible': True, 'reason': 'unconditional frozen probe'}, sort_keys=True)); return 0
    if not args.p02_adjudication: raise SystemExit('p09 remains pending: supply --p02-adjudication after artifact adjudication')
    record = json.loads(Path(args.p02_adjudication).read_text(encoding='utf-8'))
    eligible = record.get('final_feature_valid') is True and record.get('serene_adoption') is False
    result = {'run_id': 'p09', 'eligible': eligible, 'required': {'final_feature_valid': True, 'serene_adoption': False}, 'observed': {'final_feature_valid': record.get('final_feature_valid'), 'serene_adoption': record.get('serene_adoption')}}
    print(json.dumps(result, sort_keys=True))
    return 0 if eligible else 1

def main() -> int:
    parser = argparse.ArgumentParser(); sub = parser.add_subparsers(dest='operation', required=True)
    child = sub.add_parser('stage'); child.add_argument('--run-id', choices=RUNS, required=True); child.add_argument('--runtime', default=str(RUNTIME)); child.add_argument('--allow-optional-p09', action='store_true')
    child = sub.add_parser('verify'); child.add_argument('--evidence', required=True)
    child = sub.add_parser('harvest'); child.add_argument('--evidence', required=True); child.add_argument('--destination', required=True)
    child = sub.add_parser('parity'); child.add_argument('--runtime', default=str(RUNTIME))
    child = sub.add_parser('freeze'); child.add_argument('--runtime', default=str(RUNTIME)); child.add_argument('--include-optional-p09', action='store_true')
    child = sub.add_parser('eligibility'); child.add_argument('--run-id', choices=RUNS, required=True); child.add_argument('--p02-adjudication')
    args = parser.parse_args(); return stage(args) if args.operation == 'stage' else (verify(args) if args.operation == 'verify' else (harvest(args) if args.operation == 'harvest' else (parity(args) if args.operation == 'parity' else (freeze(args) if args.operation == 'freeze' else eligibility(args)))))
if __name__ == '__main__': raise SystemExit(main())
