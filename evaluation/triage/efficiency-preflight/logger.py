"""One controller-owned process; stdin JSON requests, stdout JSON responses.
Not a filesystem sandbox. Put evidence outside participant directories.
"""
from pathlib import Path
import argparse, json, subprocess, time

class Session:
    def __init__(self, root, budget, log, audit=None, clock=time.monotonic):
        self.root=Path(root).resolve(); self.budget=budget; self.log=Path(log)
        self.audit=audit; self.clock=clock; self.start=clock()
        self.requests=0; self.bytes=0; self.deep=set(); self.closed=False
        if self.log.exists(): raise ValueError('Never overwrite prior evidence')
        self.log.parent.mkdir(parents=True,exist_ok=True)
        self.log.touch(exist_ok=False)
    def path(self, value):
        if not isinstance(value,str): raise ValueError('path must be a string')
        p=(self.root/value).resolve()
        if not p.is_relative_to(self.root) or not p.is_file(): raise ValueError('outside packet or missing file')
        return p
    def handle(self, request):
        self.requests+=1; started=self.clock(); event={'request':request,'request_number':self.requests}
        try:
            if self.closed: raise ValueError('session closed')
            if started-self.start>=self.budget['elapsed_seconds']: raise ValueError('time cap')
            if self.requests>self.budget['tool_requests']: raise ValueError('request cap')
            if not isinstance(request,dict): raise ValueError('object required')
            op=request.get('op'); payload={}
            if op=='read':
                p=self.path(request['path']); lines=p.read_text().splitlines()
                start=request.get('start',1); end=request.get('end',len(lines))
                if type(start)!=int or type(end)!=int or start<1 or end<start: raise ValueError('invalid range')
                payload={'path':request['path'],'text':'\n'.join(f'{i+1}: {s}' for i,s in enumerate(lines) if start<=i+1<=end)}
            elif op=='search':
                needle=request['text']
                if not isinstance(needle,str) or not needle: raise ValueError('nonempty literal search required')
                matches=[]
                for p in sorted(self.root.rglob('*')):
                    if p.suffix not in ['.mjs','.md'] or p.is_symlink(): continue
                    p=self.path(str(p.relative_to(self.root)))
                    for i,line in enumerate(p.read_text().splitlines(),1):
                        if needle in line:matches.append({'path':str(p.relative_to(self.root)),'line':i,'text':line})
                payload={'matches':matches}
            elif op=='begin':
                # Participant references source function, not evaluator gold ID.
                p=self.path(request['path']); function=request['function']
                if not isinstance(function,str) or not function or f'function {function}(' not in p.read_text():raise ValueError('unknown function')
                site=f'{p.relative_to(self.root)}::{function}'
                if site not in self.deep and len(self.deep)>=self.budget['unique_deep_sites_B']:raise ValueError('deep-site cap')
                self.deep.add(site);payload={'site':site}
            elif op=='finding':
                self.path(request['path'])
                if not all(isinstance(request.get(k),str) and request[k] for k in ['function','mechanism','impact']):raise ValueError('finding evidence required')
                payload={'recorded':True,'correctness':'pending independent adjudication'}
            elif op=='audit':
                if self.audit is None:raise ValueError('audit unavailable in this treatment')
                remain=self.budget['elapsed_seconds']-(self.clock()-self.start)
                run=subprocess.run(['node',str(self.audit),'.'],cwd=self.root,capture_output=True,text=True,timeout=max(.001,remain))
                if run.returncode not in (0,1):raise ValueError('audit input/runtime error: '+run.stderr)
                payload={'exit':run.returncode,'inventory':json.loads(run.stdout),'stderr':run.stderr}
            elif op=='finish':
                self.closed=True;payload={'finished':True}
            else:raise ValueError('unknown operation')
            size=len(json.dumps(payload,ensure_ascii=False).encode('utf-8'))
            if self.clock()-self.start>=self.budget['elapsed_seconds']:raise ValueError('time cap during operation')
            if self.bytes+size>self.budget['returned_utf8_bytes']:raise ValueError('byte cap; content withheld')
            self.bytes+=size;response={'ok':True,'result':payload}
        except Exception as e:
            response={'ok':False,'error':str(e)}
        event.update({'response':response,'elapsed_seconds':self.clock()-self.start,'tool_seconds':self.clock()-started,'returned_payload_bytes_total':self.bytes,'unique_deep_sites':len(self.deep),'declared_deep_sites':sorted(self.deep)})
        with self.log.open('a') as out:out.write(json.dumps(event,ensure_ascii=False)+'\n')
        return response

def main():
    import sys
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--budget',required=True);parser.add_argument('--log',required=True);parser.add_argument('--audit')
    args=parser.parse_args();s=Session(args.root,json.loads(Path(args.budget).read_text()),args.log,args.audit)
    for line in sys.stdin:
        try:request=json.loads(line)
        except Exception:request={'op':'invalid-json'}
        print(json.dumps(s.handle(request),ensure_ascii=False),flush=True)
if __name__=='__main__':main()
