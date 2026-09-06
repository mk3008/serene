from pathlib import Path
import hashlib,json,subprocess
P=Path(__file__).resolve().parent
freeze=json.loads((P/'freeze.json').read_text())
changed=[name for name,h in freeze['hashes'].items() if hashlib.sha256((P/name).read_bytes()).hexdigest()!=h]
config=json.loads((P/'run-config.json').read_text())['runs']
roots={}
for run in ['tr','ts','sr','ss']:
 c=config[run];root=Path(c['root'])
 roots[run]={'git_status':subprocess.check_output(['git','-C',str(root),'status','--porcelain'],text=True),'revision_matches':subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()==c['revision'],
 'source_matches':all((root/f.name).read_bytes()==f.read_bytes() for f in (P/'tasks'/c['task']/c['arm']).glob('*.ts')) and (root/'README.md').read_bytes()==(P/'tasks'/c['task']/'README.md').read_bytes()}
outside={name:hashlib.sha256((P.parents[1]/name).read_bytes()).hexdigest()==value for name,value in freeze['repository_dependencies'].items()}
out={'changed_frozen_files':changed,'repository_dependencies_unchanged':outside,'staged_roots':roots}
(P/'integrity.json').write_text(json.dumps(out,indent=2)+'\n')
assert not changed and all(outside.values()) and all(not x['git_status'] and x['revision_matches'] and x['source_matches'] for x in roots.values())
print(json.dumps(out,indent=2))
