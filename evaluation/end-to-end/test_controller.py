import unittest,tempfile,subprocess,json,os
from pathlib import Path
SCRIPT=Path(__file__).with_name('controller.py').resolve()
class RecorderTest(unittest.TestCase):
 def test_source_accounting_and_terminal_preservation(self):
  with tempfile.TemporaryDirectory() as d:
   root=Path(d);repo=root/'repo';repo.mkdir();(repo/'one.ts').write_text('const π = 1;\nrun(π);\n')
   (root/'config.json').write_text(json.dumps({'runs':{'test':{'root':str(repo),'revision':'a'*40,'arm':'raw'}}}))
   env={**os.environ,'SERENE_E2E_STATE':str(root)}
   def call(q):
    request=json.dumps(q);out=subprocess.check_output(['python',str(SCRIPT),'test',request],env=env,text=True)
    event=json.loads((root/'logs/test.jsonl').read_text().splitlines()[-1])
    self.assertEqual(event['response_bytes'],len(out.encode()))
    self.assertEqual(event['request_bytes'],len(request.encode()))
    return json.loads(out),event
   out,e=call({'op':'search','pattern':'run'})
   self.assertEqual(e['source_lines'],[{'file':'one.ts','line':2,'text':'run(π);'}])
   self.assertEqual(e['source_text_bytes'],len('run(π);'.encode()))
   out,e=call({'op':'read','file':'one.ts','start':1,'end':100})
   self.assertTrue(out['ok']);self.assertEqual([x['line'] for x in e['source_lines']],[1,2])
   out,e=call({'op':'read','file':'one.ts','start':3,'end':100})
   self.assertFalse(out['ok']);self.assertEqual(e['source_lines'],[])
   out,e=call({'op':'read','file':'../config.json'})
   self.assertFalse(out['ok']);self.assertEqual(e['source_lines'],[])
   out,e=call({'op':'read','file':'one.ts','extra':True})
   self.assertFalse(out['ok'])
   out,e=call({'op':'discover','candidates':[{'file':'one.ts','line':2,'column':1}]})
   self.assertTrue(out['ok']);self.assertEqual(e['phase'],'discovery')
   out,e=call({'op':'handoff'});self.assertFalse(out['ok']);self.assertEqual(e['phase'],'review')
   out,e=call({'op':'finish','dispositions':[],'limits':['test only']});self.assertTrue(out['ok'])
   out,e=call({'op':'info'});self.assertFalse(out['ok'])
if __name__=='__main__':unittest.main()
