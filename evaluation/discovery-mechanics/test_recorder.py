"""Focused pre-dispatch recorder integration test; uses only the calibration run."""
import json,subprocess,unittest,tempfile,os
from pathlib import Path
ROOT=Path(__file__).resolve().parent
BASE=Path('/tmp/serene-discovery-mechanics')
class RecorderTests(unittest.TestCase):
 def test_command_and_candidate_trajectory(self):
  tmp=tempfile.TemporaryDirectory();self.addCleanup(tmp.cleanup);base=Path(tmp.name)
  (base/'config.json').write_text(json.dumps({'runs':{'cal':{'root':str(base)}}}))
  log=base/'logs/cal.jsonl'
  env={**os.environ,'DISCOVERY_MECHANICS_STATE_DIR':str(base)}
  def call(op,*args):
   p=subprocess.run(['python',str(ROOT/'recorder.py'),'cal',op,*args],capture_output=True,text=True,env=env)
   self.assertEqual(p.returncode,0,p.stderr);return json.loads(p.stdout),p.stdout
  r,out=call('exec','--','python','-c',"print(\"literal ' 日本語\")")
  self.assertEqual(r['stdout'],"literal ' 日本語\n");self.assertEqual(r['exit_code'],0)
  initial=[{'file':'notes.txt','line':1,'function':'alpha','status':'tentative'},{'file':'absent','line':1,'function':'none','status':'tentative'}]
  call('snapshot',json.dumps(initial))
  final=[{**initial[0],'status':'confirmed'}];r,_=call('snapshot',json.dumps(final))
  self.assertEqual((r['removed'],r['updated']),(1,1))
  r,_=call('exec','--','bash','-lc','printf alpha | wc -c');self.assertEqual(r['stdout'].strip(),'5')
  r,_=call('exec','--','python','-c','import sys; print("err",file=sys.stderr);sys.exit(3)');self.assertEqual(r['exit_code'],3);self.assertEqual(r['stderr'],'err\n')
  r,_=call('finish');self.assertTrue(r['finished'])
  es=[json.loads(l) for l in log.read_text().splitlines()];self.assertEqual(es[0]['delivered_bytes'],len(out.encode()));self.assertEqual(es[-1]['final_candidates'],final)
  if not (ROOT/'recorder-calibration.jsonl').exists():
   (ROOT/'recorder-calibration.jsonl').write_text(log.read_text())
if __name__=='__main__':unittest.main()
