"""Command-transparent discovery observation, not a search or SQL analysis engine."""
import argparse,fcntl,json,subprocess,time,os
from pathlib import Path
BASE=Path(os.environ.get('DISCOVERY_MECHANICS_STATE_DIR','/tmp/serene-discovery-mechanics'))
p=argparse.ArgumentParser();p.add_argument('run');p.add_argument('op',choices=['exec','snapshot','note','finish']);p.add_argument('args',nargs=argparse.REMAINDER)
a=p.parse_args();configs=json.loads((BASE/'config.json').read_text())['runs']
if a.run not in configs:raise ValueError('unknown run')
c=configs[a.run];root=Path(c['root']).resolve();log=BASE/'logs'/f'{a.run}.jsonl';log.parent.mkdir(exist_ok=True)
with (log.with_suffix('.lock')).open('a') as lock:
 fcntl.flock(lock,fcntl.LOCK_EX)
 events=[json.loads(l) for l in log.read_text().splitlines()] if log.exists() else []
 seq=len(events)+1;start=time.time();args=a.args[1:] if a.args[:1]==['--'] else a.args
 result={};event={'sequence':seq,'op':a.op,'args':args,'started_unix':start}
 try:
  if any(e['op']=='finish' and e['result'].get('ok') for e in events):raise ValueError('run finished')
  if len(events)>=120 or (events and start-events[0]['started_unix']>900):raise ValueError('operational cap')
  if a.op=='exec':
   if not args:raise ValueError('command required')
   proc=subprocess.run(args,cwd=root,capture_output=True,text=True,timeout=45,env={**os.environ,'NODE_PATH':str(Path(__file__).resolve().parents[2]/'node_modules')})
   # Save unabridged command output and actual delivered prefix separately.
   stdout,stderr=proc.stdout,proc.stderr;limit=120000
   result={'ok':True,'exit_code':proc.returncode,'stdout':stdout[:limit],'stderr':stderr[:limit],'truncated':len(stdout)>limit or len(stderr)>limit}
   event['raw_stdout']=stdout;event['raw_stderr']=stderr
  elif a.op=='snapshot':
   value=json.loads(args[0]);assert isinstance(value,list),'candidate list required'
   for candidate in value:
    assert isinstance(candidate,dict) and all(k in candidate for k in ['file','line','function','status']),'file,line,function,status required'
   previous=next((e['candidates'] for e in reversed(events) if 'candidates' in e),[])
   key=lambda x:(x['file'],x['line'],x['function'])
   old={key(x):x for x in previous};new={key(x):x for x in value}
   event['candidates']=value;event['added']=[v for k,v in new.items() if k not in old];event['removed']=[v for k,v in old.items() if k not in new];event['updated']=[v for k,v in new.items() if k in old and v!=old[k]]
   result={'ok':True,'snapshot_size':len(value),'added':len(event['added']),'removed':len(event['removed']),'updated':len(event['updated'])}
  elif a.op=='note':
   event['note']=' '.join(args);result={'ok':True,'recorded':True}
  elif a.op=='finish':
   event['final_candidates']=next((e['candidates'] for e in reversed(events) if 'candidates' in e),[])
   result={'ok':True,'finished':True,'candidate_count':len(event['final_candidates'])}
 except subprocess.TimeoutExpired as error:
  event['raw_stdout']=error.stdout.decode(errors='replace') if isinstance(error.stdout,bytes) else error.stdout or ''
  event['raw_stderr']=error.stderr.decode(errors='replace') if isinstance(error.stderr,bytes) else error.stderr or ''
  result={'ok':False,'error':'command timeout','stdout':event['raw_stdout'],'stderr':event['raw_stderr']}
 except Exception as error:result={'ok':False,'error':str(error)}
 event['elapsed_seconds']=time.time()-start;event['result']=result
 output=json.dumps({'event':seq,**result});event['delivered_bytes']=len((output+'\n').encode());event['completed_unix']=time.time()
 with log.open('a') as f:f.write(json.dumps(event)+'\n')
 print(output)
