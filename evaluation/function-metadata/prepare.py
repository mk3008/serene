from pathlib import Path
import json, shutil, subprocess

P = Path(__file__).resolve().parent
state = Path('/tmp/serene-function-metadata')
state.mkdir(exist_ok=True)
config_path = P / 'run-config.json'
config = json.loads(config_path.read_text()) if config_path.exists() else {
    'runs': {}, 'raw_references': {'tr': '../pre-exposure/results/tr.jsonl', 'sr': '../pre-exposure/results/sr.jsonl'}}

def stage(name, task):
    root = state / 'repos' / name
    if name in config['runs']:
        if not root.is_dir():
            raise ValueError(f'{name} is configured but its staged root is absent')
        return
    if root.exists():
        raise ValueError(f'do not overwrite staged run {name}')
    shutil.copytree(P.parent / 'end-to-end' / 'tasks' / task / 'serene', root)
    shutil.copyfile(P.parent / 'end-to-end' / 'tasks' / task / 'README.md', root / 'README.md')
    def git(*args): return subprocess.check_output(['git', '-C', str(root), *args], text=True).strip()
    git('init', '-q'); git('add', '.')
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Immutable function metadata fixture')
    config['runs'][name] = {'root': str(root), 'revision': git('rev-parse', 'HEAD'),
                            'task': task, 'arm': 'serene', 'gold_path_mapping': 'strip variant/ prefix'}

# Existing probe remains evidence; probe2 is the only new stage created by this repair.
stage('probe2', 'ticketing')
arm = ('Serene arm: search/read responses are filtered before delivery. Structured ordinary markers provide positive '
       'Serene provenance for their exact execution locations; use resolution:"skip-ordinary" for them. Other source rows remain for review. '
       'A marker with no sites is not an execution candidate, and marker count does not establish coverage.')
for name in config['runs']:
    (P / 'prompts' / f'{name}.txt').write_text((P / 'prompt.txt').read_text().replace('{run}', name).replace('{arm_instruction}', arm))
config_path.write_text(json.dumps(config, indent=2) + '\n')
(state / 'config.json').write_text(json.dumps(config, indent=2) + '\n')
