import unittest
from pathlib import Path
from convert import convert
class PairingTests(unittest.TestCase):
    def test_all_modules_follow_gold_blind_conversion(self):
        root=Path(__file__).resolve().parent/'fixtures';count=0
        for raw in root.glob('*/raw/*.mjs'):
            self.assertEqual(convert(raw.read_text()),(raw.parent.parent/'serene'/raw.name).read_text());count+=1
        self.assertEqual(count,40)
