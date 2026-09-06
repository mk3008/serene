"""Build isolated-by-instruction experiment packets; never invokes a model."""
import hashlib
import json
import pathlib
import random
import shutil
import sys

here = pathlib.Path(__file__).resolve().parent
repo = here.parents[2]
out = pathlib.Path(sys.argv[1]).resolve()
if out.exists():
    raise SystemExit('Output must not already exist; refusing to overwrite a run')
out.mkdir(parents=True)
tasks = sorted(p.name for p in (here / 'tasks').iterdir() if p.is_dir())
assert len(tasks) == 3, tasks
schedule = [(task, arm) for task in tasks for arm in ['D', 'E', 'F']]
random.Random(20260906).shuffle(schedule)
manifest = []
dependency_files = None
for index, (task, arm) in enumerate(schedule, 1):
    run_id = f'r{index:02d}'
    dest = out / run_id
    shutil.copytree(here / 'tasks' / task / 'public', dest)
    (dest / 'AGENTS.md').write_text((here / 'AGENTS-template.md').read_text())
    package = json.loads((dest / 'package.json').read_text())
    audit = 'node node_modules/@mk3008/serene/tooling/cli.mjs --sink=prepare '
    package['scripts']['check'] = 'npm test' + ('' if arm == 'D' else ' && ' + audit + ('--strict ' if arm == 'F' else '') + 'src')
    package.setdefault('dependencies', {})['@mk3008/serene'] = '0.1.0'
    package.setdefault('devDependencies', {})['typescript'] = '5.9.3'
    (dest / 'package.json').write_text(json.dumps(package, indent=2)+'\n')
    pkg = dest / 'node_modules' / '@mk3008' / 'serene'
    pkg.mkdir(parents=True)
    for name in ['package.json', 'README.md', 'LICENSE']:
        shutil.copy2(repo/name, pkg/name)
    for name in ['dist', 'tooling', 'docs']:
        shutil.copytree(repo/name, pkg/name)
    shutil.copytree(repo/'node_modules/typescript', dest/'node_modules/typescript')
    prompt = (here/'participant-prompt.txt').read_text().replace('{packet}', str(dest)).rstrip('\n')
    files = [{'path':str(f.relative_to(dest)), 'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
             for f in sorted(dest.rglob('*')) if f.is_file() and 'node_modules' not in f.relative_to(dest).parts]
    dep = [{'path':str(f.relative_to(dest)), 'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
           for f in sorted((dest/'node_modules').rglob('*')) if f.is_file()]
    if dependency_files is None:
        dependency_files = dep
    else:
        assert dependency_files == dep, 'Dependencies differ across packets'
    manifest.append({'run_id':run_id,'task':task,'arm':arm,'packet':str(dest),'prompt':prompt,
                     'prompt_sha256':hashlib.sha256(prompt.encode()).hexdigest(),'initial_files':files})
(out/'manifest.json').write_text(json.dumps({'seed':20260906,'dependency_files':dependency_files,'runs':manifest},indent=2)+'\n')
print(json.dumps({'output':str(out),'schedule':[(x['run_id'],x['task'],x['arm']) for x in manifest]}))
