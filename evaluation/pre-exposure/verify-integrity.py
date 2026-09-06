from pathlib import Path
import hashlib,json,subprocess
P=Path(__file__).resolve().parent;repo=P.parent.parent
f=json.loads((P/'freeze.json').read_text())
for file,digest in f['sha256'].items():
 assert hashlib.sha256((repo/file).read_bytes()).hexdigest()==digest,file
c=json.loads((P/'run-config.json').read_text())['runs']
for run,r in c.items():
 root=Path(r['root'])
 assert subprocess.check_output(['git','-C',str(root),'rev-parse','HEAD'],text=True).strip()==r['revision'],run
 assert not subprocess.check_output(['git','-C',str(root),'status','--porcelain'],text=True).strip(),run
 for source in (P.parent/'end-to-end/tasks'/r['task']/r['arm']).rglob('*'):
  if source.is_file():assert source.read_bytes()==(root/source.relative_to(P.parent/'end-to-end/tasks'/r['task']/r['arm'])).read_bytes()
print('Frozen hashes and all staged source snapshots unchanged')
