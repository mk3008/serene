"""Reproduce objective cost summaries; semantic adjudication remains separate."""
import collections
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MAPPING = {'e01': ('task2', 'raw'), 'e02': ('task2', 'serene'),
           'e03': ('task1', 'serene'), 'e04': ('task1', 'raw')}
index = json.loads((ROOT / 'site-index-validation.json').read_text())
adjudication = json.loads((ROOT / 'adjudication.json').read_text())['runs']
rows = []
for run, (task, variant) in MAPPING.items():
    events = [json.loads(x) for x in (ROOT / 'results' / run / 'events.jsonl').read_text().splitlines()]
    # Exactly one submitted construction finding per run. Independent adjudication
    # must confirm it before interpreting these mechanically selected events as hits.
    findings = [e for e in events if e['request']['op'] == 'finding' and e['response']['ok']]
    assert len(findings) == 1
    first = findings[0]
    assert first['sequence'] == adjudication[run]['earliest_correct_finding_sequence']
    assert adjudication[run]['false_finding_count'] == 0
    finish = next(e for e in events if e['request']['op'] == 'finish' and e['response']['ok'])
    sites = next(x['sites'] for x in index if x['task'] == task and x['variant'] == variant)
    by_id = {x['id']: x for x in sites}
    gold = json.loads((ROOT / 'tasks' / task / 'evaluator' / 'gold.json').read_text())
    aliases = {x['caller']: x['direct_execution'] for x in gold['driver_wrapper_follow_through']}
    needed = {aliases.get(x['location'], x['location']).removeprefix('raw/') for x in gold['needs_investigation']}
    def snapshot(at):
        prefix = [e for e in events if e['sequence'] <= at['sequence']]
        expanded = {by_id[s]['path'] + ':' + by_id[s]['function'] for s in at['deep_sites']}
        return {'sequence': at['sequence'], 'context_expanded_sites': at['deep_site_count'],
                'expanded_functions': sorted(expanded), 'N_context_coverage': len(expanded & needed),
                'N_total': len(needed), 'unnecessary_expanded_sites': len(expanded - needed),
                'requests': len(prefix), 'successful_operations': dict(collections.Counter(
                    e['request']['op'] for e in prefix if e['response']['ok'])),
                'failed_requests': [e['sequence'] for e in prefix if not e['response']['ok']],
                'payload_bytes': at['returned_bytes'], 'elapsed_seconds': at['elapsed_seconds']}
    rows.append({'run': run, 'task': task, 'variant': variant, 'first_correct_finding': snapshot(first),
                 'finish': snapshot(finish), 'events_after_finish': len(events) - finish['sequence'],
                 'discovery_at_checkpoints': {
                     str(b): first['deep_site_count'] <= b for b in [1, 3, 5, 10]}})
(ROOT / 'results' / 'summary.json').write_text(json.dumps(rows, indent=2) + '\n')
print(json.dumps(rows, indent=2))
