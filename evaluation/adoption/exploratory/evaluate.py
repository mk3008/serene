"""Post-submit deterministic checks. Does not call a model or edit its source."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys

here = pathlib.Path(__file__).resolve().parent
manifest = json.loads(pathlib.Path(sys.argv[1]).read_text())
run_ids = sys.argv[2:] or [r['run_id'] for r in manifest['runs']]
results = here / 'results'
results.mkdir(exist_ok=True)
for run in manifest['runs']:
    if run['run_id'] not in run_ids:
        continue
    dest = results / run['run_id']
    if dest.exists():
        raise SystemExit(f'Refusing to overwrite {dest}')
    dest.mkdir()
    packet = pathlib.Path(run['packet'])
    protected_changes=[]
    for f in run['initial_files'] + manifest['dependency_files']:
        path=packet/f['path']
        if f['path'].startswith('src/'):
            continue
        if not path.is_file() or hashlib.sha256(path.read_bytes()).hexdigest()!=f['sha256']:
            protected_changes.append(f['path'])
    env = dict(os.environ, PILOT_TARGET=str(packet))
    def invoke(name,args):
        try:
            r=subprocess.run(args,cwd=packet,env=env,text=True,capture_output=True,timeout=60)
            item={'command':args,'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'timeout':False}
        except subprocess.TimeoutExpired as e:
            item={'command':args,'exit':None,'stdout':str(e.stdout or ''),'stderr':str(e.stderr or ''),'timeout':True}
        (dest/(name+'.json')).write_text(json.dumps(item,indent=2)+'\n')
        return item
    public=invoke('public',['node','--test','--test-reporter=tap','public.test.mjs'])
    hidden=invoke('hidden',['node','--test','--test-reporter=tap',str(here/'tasks'/run['task']/'evaluator/hidden.test.mjs')])
    check=invoke('check',['npm','run','check'])
    audit_args=['node','node_modules/@mk3008/serene/tooling/cli.mjs','--sink=prepare']
    normal=invoke('audit',audit_args+['src'])
    strict=invoke('strict',audit_args+['--strict','src'])
    try:
        findings=json.loads(normal['stdout'])['findings']
    except (ValueError,KeyError):
        findings=None
    source_files=[]
    for f in sorted((packet/'src').rglob('*')):
        if f.is_file():
            rel=f.relative_to(packet)
            to=dest/rel
            to.parent.mkdir(parents=True,exist_ok=True)
            shutil.copy2(f,to)
            initial=next((x['sha256'] for x in run['initial_files'] if x['path']==str(rel)),None)
            digest=hashlib.sha256(f.read_bytes()).hexdigest()
            source_files.append({'path':str(rel),'sha256':digest,'changed':digest!=initial})
    for f in packet.glob('participant*'):
        if f.is_file():
            shutil.copy2(f,dest/f.name)
    summary={'run_id':run['run_id'],'task':run['task'],'arm':run['arm'],
             'public_exit':public['exit'],'hidden_exit':hidden['exit'],'check_exit':check['exit'],
             'audit_exit':normal['exit'],'strict_exit':strict['exit'],
             'protected_changes':protected_changes,'source_files':source_files,'findings':findings,
             'model_token_usage':None}
    (dest/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['findings','source_files']}))
