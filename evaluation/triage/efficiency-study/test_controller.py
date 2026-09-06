import tempfile,unittest,json
from pathlib import Path
from controller import Run
class ControllerTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name)/'packet';self.root.mkdir()
  (self.root/'owner.mjs').write_text("import { text } from './helper.mjs';\nexport function one(db) {\n return db.query(text, {});\n}\n")
  (self.root/'helper.mjs').write_text('// context\n// context\n// context\nexport function text() { return `SELECT 1`; }\n')
  self.config={'root':str(self.root),'log':str(Path(self.tmp.name)/'trace.jsonl'),'budget':{'deep_sites':2,'bytes':4096,'requests':12,'seconds':30}}
 def test_reads_infer_dependency_expansion_without_declaration(self):
  r=Run(self.config);r.handle({'op':'read','path':'owner.mjs'});self.assertEqual(len(r.deep),0)
  r.handle({'op':'read','path':'helper.mjs'});self.assertEqual(len(r.deep),1);self.assertGreater(r.bytes,0)
 def test_search_also_infers_expansion(self):
  r=Run(self.config);self.assertTrue(r.handle({'op':'search','pattern':'db\\.query','regex':True})['ok']);self.assertEqual(len(r.deep),0)
  self.assertTrue(r.handle({'op':'search','pattern':'SELECT','regex':False})['ok']);self.assertEqual(len(r.deep),1)
 def test_cap_withholds_helper_and_counts_no_unseen_lines(self):
  self.config['budget']['deep_sites']=0;r=Run(self.config);r.handle({'op':'read','path':'owner.mjs'})
  answer=r.handle({'op':'read','path':'helper.mjs'});self.assertFalse(answer['ok']);self.assertNotIn('helper.mjs',r.exposed);self.assertEqual(r.events[-1]['source_lines_delivered'],[])
 def test_investigate_is_actual_logged_content_not_counter_declaration(self):
  r=Run(self.config);a=r.handle({'op':'investigate','path':'owner.mjs','function':'one'});self.assertTrue(a['ok']);self.assertEqual(len(a['result']['sources']),2);self.assertEqual(len(r.deep),1)
 def test_byte_cap(self):
  self.config['budget']['bytes']=1;r=Run(self.config);self.assertFalse(r.handle({'op':'read','path':'owner.mjs'})['ok']);self.assertEqual(r.bytes,0)
 def test_time_and_closed(self):
  r=Run(self.config);r.handle({'op':'finish'});self.assertFalse(r.handle({'op':'list'})['ok'])
  self.config['log']=str(Path(self.tmp.name)/'other.jsonl');self.config['budget']['seconds']=0;r=Run(self.config);self.assertFalse(r.handle({'op':'list'})['ok'])
 def test_paths_and_unavailable_audit(self):
  r=Run(self.config);self.assertFalse(r.handle({'op':'read','path':'../x'})['ok']);self.assertFalse(r.handle({'op':'audit'})['ok'])
if __name__=='__main__':unittest.main()
