import importlib.util
import unittest
from pathlib import Path

P = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("preexposure_score", P / "score.py")
score = importlib.util.module_from_spec(spec)
spec.loader.exec_module(score)


class CorrespondenceSchemaTests(unittest.TestCase):
    def test_two_file_filter_inputs_are_local_to_each_batch(self):
        primitive = [
            {"file": "a.ts", "line": 1, "text": "a1"},
            {"file": "a.ts", "line": 2, "text": "a2"},
            {"file": "b.ts", "line": 4, "text": "b4"},
            {"file": "b.ts", "line": 5, "text": "b5"},
        ]
        evidence = [
            {"rows": [{"file": "a.ts", "line": 1, "text": "a1"}],
             "masks": [], "correspondence": [{"input": 0, "outputs": [0]}, {"input": 1, "outputs": [0]}]},
            {"rows": [{"file": "b.ts", "ordinary": "marker", "sites": []}],
             "masks": [{"file": "b.ts"}], "correspondence": [{"input": 0, "outputs": [0]}, {"input": 1, "outputs": [0]}]},
        ]
        result = score.validate_ledger(primitive, evidence, "serene")
        self.assertTrue(result["all_inputs_represented"])
        self.assertTrue(result["all_output_indexes_valid"])
        self.assertEqual(result["match_row_loss"], 0)

    def test_marker_site_uses_parent_marker_file(self):
        gold_key = ("operations.ts", 12, 9)
        gold = {gold_key: {"file": "operations.ts", "line": 12, "column": 9, "classification": "ordinary"}}
        event = {"sequence": 3, "primitive_rows": [{"file": "operations.ts", "line": 12, "text": "  db.query(q.text);"}],
                 "filter_evidence": [{"rows": [{"ordinary": "m1", "file": "operations.ts", "sites": [{"line": 12, "column": 9}]}]}]}
        delivered, invalid = score.marker_deliveries([event], gold)
        self.assertEqual(delivered, {gold_key})
        self.assertEqual(invalid, [])


if __name__ == "__main__":
    unittest.main()
