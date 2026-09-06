import json
import tempfile
import unittest
from pathlib import Path

from controller import Run


class ControllerTests(unittest.TestCase):
 def make(self, bytes=32768, audit_report=None):
  temporary = tempfile.TemporaryDirectory()
  self.addCleanup(temporary.cleanup)
  root = Path(temporary.name) / "packet"
  root.mkdir()
  (root / "owner.mjs").write_text(
   "import { makeSql } from './helper.mjs';\n"
   "export function first(db) {\n return db.query(makeSql(), {});\n}\n"
   "export function adjacent(db) {\n return db.query('SELECT adjacent', {});\n}\n")
  (root / "helper.mjs").write_text(
   "export function makeSql() {\n return 'SELECT selected';\n}\n"
   "export function unrelated() {\n return 'SELECT unrelated';\n}\n")
  config = {
   "root": str(root), "log": str(Path(temporary.name) / "events.jsonl"),
   "budget": {"bytes": bytes, "requests": 80, "seconds": 600, "deep_sites": 23},
   "functions": {
    "owner.mjs": {"first": {"start": 2, "end": 4}, "adjacent": {"start": 5, "end": 7}},
    "helper.mjs": {"makeSql": {"start": 1, "end": 3}, "unrelated": {"start": 4, "end": 6}},
   },
   "sites": [{"id": "owner:3", "path": "owner.mjs", "function": "first", "line": 3,
              "start": 2, "end": 4,
              "dependency_spans": [{"path": "helper.mjs", "start": 1, "end": 3}]}],
  }
  if audit_report is not None:
   config["audit_report"] = audit_report
  return Run(config)

 def test_targeted_function_does_not_return_adjacent_or_import_body(self):
  run = self.make()
  response = run.handle({"op": "function", "path": "owner.mjs", "line": 3})
  self.assertTrue(response["ok"])
  text = json.dumps(response)
  self.assertIn("first", text)
  self.assertNotIn("adjacent", text)
  self.assertNotIn("helper.mjs", text)
  self.assertNotIn("SELECT selected", text)

 def test_audit_rejects_any_arguments_but_returns_configured_report(self):
  run = self.make(audit_report={"summary": "compact", "reconciliation": {"version": 1}})
  self.assertFalse(run.handle({"op": "audit", "extra": True})["ok"])
  response = run.handle({"op": "audit"})
  self.assertEqual(response, {"ok": True, "result": {"summary": "compact", "reconciliation": {"version": 1}}})

 def test_finish_succeeds_after_a_byte_cap(self):
  run = self.make(bytes=1)
  self.assertFalse(run.handle({"op": "read", "path": "owner.mjs"})["ok"])
  finished = run.handle({"op": "finish"})
  self.assertEqual(finished, {"ok": True, "result": {"finished": True}})
  self.assertFalse(run.handle({"op": "status"})["ok"])

 def test_errors_are_charged_and_withheld_source_is_not_exposed(self):
  run = self.make(bytes=1)
  response = run.handle({"op": "read", "path": "owner.mjs"})
  self.assertFalse(response["ok"])
  self.assertEqual(run.bytes, len((json.dumps(response) + "\n").encode()))
  self.assertEqual(run.exposed, {})
  self.assertEqual(run.events[-1]["source_lines_delivered"], [])
  self.assertNotIn("SELECT", json.dumps(response))


if __name__ == "__main__":
 unittest.main()
