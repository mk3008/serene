"""File-backed mediated action; locks prevent budget reset/races across invocations."""
from pathlib import Path
import fcntl,json,sys
sys.path.insert(0,'/workspace/scratch/6d978950e2be/serene/evaluation/triage/efficiency-study')
from controller import Run
base=Path('/tmp/serene-efficiency-run')
name=sys.argv[1]
if not name.replace('_','').isalnum():raise ValueError('invalid run ID')
config=json.loads((base/'controller.json').read_text())['runs'][name]
state=base/'state'/f'{name}.json';state.parent.mkdir(exist_ok=True)
with (state.parent/f'{name}.lock').open('a') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 r=Run(config,resume=state.exists())
 if state.exists():
  data=json.loads(state.read_text());r.started=data['started'];r.events=data['events'];r.bytes=data['bytes'];r.deep=set(data['deep']);r.exposed={p:set(lines) for p,lines in data['exposed'].items()};r.closed=data['closed']
 response=r.handle(json.loads(sys.argv[2]))
 data={'started':r.started,'events':r.events,'bytes':r.bytes,'deep':sorted(r.deep),'exposed':{p:sorted(lines) for p,lines in r.exposed.items()},'closed':r.closed}
 temp=state.with_suffix('.tmp');temp.write_text(json.dumps(data));temp.replace(state)
 print(json.dumps(response))
