"""Archive reviewer answers without rewriting them; report packet mutations."""
from pathlib import Path
import hashlib, json, shutil, sys
HERE = Path(__file__).resolve().parent
runs = json.loads((HERE / 'freeze.json').read_text())['runs']
selected = set(sys.argv[1:])
for run in runs:
    if selected and run['run'] not in selected:
        continue
    packet = Path(run['packet'])
    dest = HERE / 'results' / run['run']
    dest.mkdir(parents=True, exist_ok=True)
    changed = [f['path'] for f in run['files'] if not (packet / f['path']).exists() or hashlib.sha256((packet / f['path']).read_bytes()).hexdigest() != f['sha256']]
    answer = packet / 'answer.json'
    status = {'run': run['run'], 'protected_changes': changed, 'parse_error': None, 'model_token_usage': None}
    if answer.exists():
        shutil.copyfile(answer, dest / 'answer.json')
        try:
            data = json.loads(answer.read_text())
            assert isinstance(data['findings'], list) and isinstance(data['inspected_sites'], list)
        except Exception as e:
            status['parse_error'] = str(e)
    else:
        status['parse_error'] = 'missing answer'
    (dest / 'collection.json').write_text(json.dumps(status, indent=2) + '\n')
    print(json.dumps(status))
