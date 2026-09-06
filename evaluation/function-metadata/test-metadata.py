from metadata import candidate_function_check, supplied_name_check

G = {
    ('operations.ts', 12, 9): {'classification': 'ordinary', 'function': 'listOpenTickets', 'file': 'operations.ts', 'functionBodyStartLine': 5, 'functionBodyEndLine': 13},
    ('operations.ts', 22, 9): {'classification': 'review-required', 'function': 'findTicketById', 'file': 'operations.ts', 'functionBodyStartLine': 15, 'functionBodyEndLine': 23},
}

correct = {'file': 'operations.ts', 'line': 12, 'column': 9, 'function': 'listOpenTickets'}
assert candidate_function_check([correct], G)['exact'] == 1
full_declaration = {**correct, 'function': 'export async function listOpenTickets() {'}
assert candidate_function_check([full_declaration], G)['wrong'][0]['exact'] is False
assert candidate_function_check([{k: v for k, v in correct.items() if k != 'function'}], G)['missing'][0]['actual'] is None
malformed = {'file': 'operations.ts', 'line': '12', 'column': [], 'function': ['listOpenTickets']}
assert candidate_function_check([malformed], G)['checked'] == []
assert supplied_name_check([malformed], G, 'candidate')[0]['invalid_schema_or_coordinate']

finding = {'file': 'operations.ts', 'line': 20, 'function': 'findTicketById'}
check = supplied_name_check([finding], G, 'finding')[0]
assert check['exact'] and check['site'] == ['operations.ts', 20]
assert supplied_name_check([{**finding, 'column': 9}], G, 'finding')[0]['exact'] is False
assert supplied_name_check([{**finding, 'function': 'export function findTicketById() {'}], G, 'finding')[0]['exact'] is False
assert supplied_name_check([{'file': 'operations.ts', 'line': None, 'function': None}], G, 'finding')[0]['invalid_schema_or_coordinate']
assert supplied_name_check([{'file': 'operations.ts', 'line': 20, 'column': 1, 'function': 'findTicketById'}], G, 'disposition')[0]['exact'] is False
print('metadata scorer helper checks passed')

# The real scorer strips the frozen `serene/` variant prefix in both the key and
# the record value before range matching a finding construction line.
import json
from pathlib import Path
records = json.loads((Path(__file__).resolve().parent.parent / 'end-to-end' / 'gold' / 'ticketing.json').read_text())['records']
real_gold = {(g['file'].split('/', 1)[1], g['line'], g['column']): {**g, 'file': g['file'].split('/', 1)[1]}
             for g in records if g['variant'] == 'serene'}
range_check = supplied_name_check([{'file': 'reporting.ts', 'line': 29, 'function': 'searchTicketing'}], real_gold, 'finding')[0]
assert range_check['exact'] and range_check['expected'] == 'searchTicketing'
