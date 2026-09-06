"""Build instruction-isolated packets; evaluator/gold never enters them."""
from pathlib import Path
import hashlib, json, random, re, shutil, subprocess

HERE = Path(__file__).resolve().parent
TARGET = Path('/tmp/serene-review-pilot1')
PACKAGE = Path('/tmp/serene-exploratory-run1/r01/node_modules/@mk3008/serene')
assert not TARGET.exists(), 'Never replace already materialized packets'
TARGET.mkdir()
order = [(task, arm) for task in ['birch', 'cedar', 'maple'] for arm in 'ABCD']
random.Random(20260908).shuffle(order)
manifest = []
for i, (task, arm) in enumerate(order, 1):
    run = f'v{i:02d}'
    packet = TARGET / run
    packet.mkdir()
    source = HERE / 'tasks' / task
    variant = 'raw' if arm == 'A' else 'serene'
    shutil.copyfile(source / variant / 'source.mjs', packet / 'source.mjs')
    shutil.copyfile(source / 'public/CONTRACT.md', packet / 'CONTRACT.md')
    if arm != 'A':
        shutil.copyfile(HERE / 'SUPPORT.md', packet / 'SUPPORT.md')
    audit = None
    if arm == 'C':
        candidates = [{'file': 'source.mjs', 'line': n, 'source': line}
                      for n, line in enumerate((packet / 'source.mjs').read_text().splitlines(), 1)
                      if re.search(r'\b(query|execute|prepare)\s*\(', line)]
        (packet / 'inventory.json').write_text(json.dumps(candidates, indent=2) + '\n')
    if arm == 'D':
        result = subprocess.run(['node', str(PACKAGE / 'tooling/cli.mjs'), '--sink=query', 'source.mjs'], cwd=packet, capture_output=True, text=True)
        assert result.returncode in (0, 1), result.stderr
        json.loads(result.stdout)
        (packet / 'inventory.json').write_text(result.stdout)
        audit = {'command': ['node', 'frozen-package/tooling/cli.mjs', '--sink=query', 'source.mjs'], 'exit': result.returncode, 'stderr': result.stderr}
    prompt = (HERE / 'participant-prompt.txt').read_text().replace('{packet}', str(packet))
    files = [{'path': str(p.relative_to(packet)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(packet.iterdir())]
    manifest.append({'run': run, 'task': task, 'arm': arm, 'variant': variant, 'packet': str(packet), 'files': files, 'prompt': prompt, 'requested_model': 'gpt-5.6-luna', 'requested_effort': 'medium', 'fork_turns': 'none', 'audit_generation': audit})
(HERE / 'freeze.json').write_text(json.dumps({'seed': 20260908, 'runs': manifest}, indent=2) + '\n')
# Preserve every supplied byte in git, including treatment inventories.
shutil.copytree(TARGET, HERE / 'packets')
hashes = [{'path': str(p.relative_to(HERE)), 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(HERE.rglob('*')) if p.is_file() and p.name != 'source-hashes.json']
(HERE / 'source-hashes.json').write_text(json.dumps(hashes, indent=2) + '\n')
print(json.dumps([{'run': r['run'], 'task': r['task'], 'arm': r['arm']} for r in manifest]))
