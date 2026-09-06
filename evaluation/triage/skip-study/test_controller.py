import json,tempfile,unittest
from pathlib import Path
from controller import Run
class ControllerTests(unittest.TestCase):
 def make(self,cap=32768):
  t=tempfile.TemporaryDirectory();self.addCleanup(t.cleanup);p=Path(t.name)
  (p/'x.js').write_text("export function first(db){\n return db.query('SELECT 1', {});\n}\nexport function second(db){\n return db.query('SELECT 2', {});\n}\n")
  return Run({'root':str(p),'log':str(p/'events.jsonl'),'budget':{'bytes':cap,'seconds':600,'requests':80,'deep_sites':23}})
 def test_targeted_function_not_whole_file(self):
  r=self.make();out=r.handle({'op':'function','path':'x.js','line':2});self.assertTrue(out['ok']);self.assertNotIn('SELECT 2',json.dumps(out));self.assertEqual(r.bytes,len((json.dumps(out)+'\n').encode()))
 def test_errors_charged(self):
  r=self.make();out=r.handle({'op':'function','path':'missing'});self.assertFalse(out['ok']);self.assertEqual(r.bytes,len((json.dumps(out)+'\n').encode()))
 def test_cap_no_source(self):
  r=self.make(1);out=r.handle({'op':'read','path':'x.js'});self.assertFalse(out['ok']);self.assertEqual(r.exposed,{});self.assertNotIn('SELECT',json.dumps(out))
if __name__=='__main__':unittest.main()
