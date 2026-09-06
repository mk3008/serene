import json,tempfile,unittest
from pathlib import Path
from logger import Session
class LoggerTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup)
        self.base=Path(self.tmp.name);self.root=self.base/'packet';self.root.mkdir()
        (self.root/'a.mjs').write_text('export function one() {}\nexport function two() {}\n')
        self.now=0
        self.b={'unique_deep_sites_B':1,'elapsed_seconds':10,'returned_utf8_bytes':4096,'tool_requests':10}
    def make(self):return Session(self.root,self.b,self.base/'events.jsonl',clock=lambda:self.now)
    def test_read_and_search_charged_before_deep(self):
        s=self.make();self.assertTrue(s.handle({'op':'read','path':'a.mjs'})['ok']);self.assertTrue(s.handle({'op':'search','text':'function'})['ok']);self.assertGreater(s.bytes,0);self.assertEqual(len(s.deep),0)
    def test_unique_cap_repeated_work_and_finding_snapshot(self):
        s=self.make();one={'op':'begin','path':'a.mjs','function':'one'}
        self.assertTrue(s.handle(one)['ok']);self.assertTrue(s.handle(one)['ok']);self.assertFalse(s.handle({'op':'begin','path':'a.mjs','function':'two'})['ok'])
        self.assertTrue(s.handle({'op':'finding','path':'a.mjs','function':'one','mechanism':'input enters syntax','impact':'changes SQL'})['ok'])
        rows=[json.loads(x) for x in s.log.read_text().splitlines()];self.assertEqual(rows[-1]['unique_deep_sites'],1);self.assertEqual(rows[-1]['request_number'],4)
    def test_time_cap(self):
        s=self.make();self.now=10;self.assertFalse(s.handle({'op':'read','path':'a.mjs'})['ok'])
    def test_byte_cap_no_leak(self):
        self.b['returned_utf8_bytes']=1;s=self.make();r=s.handle({'op':'read','path':'a.mjs'});self.assertFalse(r['ok']);self.assertNotIn('result',r);self.assertEqual(s.bytes,0)
    def test_request_cap_and_finish(self):
        self.b['tool_requests']=1;s=self.make();self.assertTrue(s.handle({'op':'finish'})['ok']);self.assertFalse(s.handle({'op':'read','path':'a.mjs'})['ok'])
    def test_traversal_and_symlink(self):
        outside=self.base/'outside';outside.write_text('not a packet file');(self.root/'link.mjs').symlink_to(outside)
        s=self.make()
        for name in ['../outside','link.mjs']:self.assertFalse(s.handle({'op':'read','path':name})['ok'])
    def test_evidence_never_overwritten(self):
        self.make()
        with self.assertRaises(ValueError):self.make()
    def test_control_has_no_audit(self):
        self.assertFalse(self.make().handle({'op':'audit'})['ok'])
if __name__=='__main__':unittest.main()
