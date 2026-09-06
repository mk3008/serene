"""Reproduce stage-separated descriptive metrics from immutable event logs."""
from pathlib import Path
import json,collections,sys
P=Path(__file__).resolve().parent
config=json.loads((P/'run-config.json').read_text())['runs']
runs=sys.argv[1:] or ['tr','ts','sr','ss']
rows=[]
for run in runs:
 c=config[run];events=[json.loads(s) for s in (P/'results'/f'{run}.jsonl').read_text().splitlines()]
 gold=[{**g,'file':g['file'].split('/',1)[1]} for g in json.loads((P/'gold'/f"{c['task']}.json").read_text())['records'] if g['variant']==c['arm']]
 key=lambda x:(x.get('file'),x.get('line'),x.get('column'))
 expected={key(g):g for g in gold}
 discovery=next((e for e in events if e['op']=='discover' and e['response']['ok']),None)
 candidates=discovery['request']['candidates'] if discovery else []
 actual={key(x) for x in candidates if isinstance(x,dict)}
 handoffs=[e for e in events if e['op']=='handoff' and e['response']['ok']]
 handoff=handoffs[0] if handoffs else None
 outputs=[json.loads(l) for l in handoff['subprocess']['stdout'].splitlines()] if handoff else []
 finish=next((e for e in events if e['op']=='finish' and e['response']['ok']),None)
 dispositions=finish['request']['dispositions'] if finish else []
 dkeys=collections.Counter(key(d) for d in dispositions if isinstance(d,dict))
 ckeys=collections.Counter(key(d) for d in candidates if isinstance(d,dict))
 ordinary=[g for g in gold if g['classification']=='ordinary']
 def seen(g,es):
  return any(x['file']==g['file'] and g['functionBodyStartLine']<=x['line']<=g['functionBodyEndLine'] for e in es for x in e['source_lines'])
 def full(g,es):
  exposed={(x['file'],x['line']) for e in es for x in e['source_lines']}
  return all((g['file'],i) in exposed for i in range(g['functionBodyStartLine'],g['functionBodyEndLine']+1))
 after=[e for e in events if handoff and e['sequence']>handoff['sequence']]
 actualskip=[g for g in ordinary if any(key(o.get('candidate',{}))==key(g) and o['skip'] for o in outputs)
  and any(key(d)==key(g) and d.get('resolution')=='skip-ordinary' for d in dispositions)
  and not seen(g,after)]
 danger=[g for g in gold if g['expectedVulnerability']]
 findings=[e for e in events if e['op']=='finding' and e['response']['ok']]
 # Coordinate match is preliminary. Mechanism is independently adjudicated after runs.
 matchedfind=[e for e in findings if any(e['request']['file']==g['file'] and e['request']['line']==g['line'] and e['request']['function']==g['function'] for g in danger)]
 first=matchedfind[0] if matchedfind else None
 stages={}
 for stage in ['discovery','handoff','review']:
  es=[e for e in events if ('handoff' if e['op']=='handoff' else e['phase'])==stage]
  stages[stage]={'calls':len(es),'read_calls':sum(e['op']=='read' for e in es),'search_calls':sum(e['op']=='search' for e in es),'response_bytes':sum(e['response_bytes'] for e in es),'request_bytes':sum(e['request_bytes'] for e in es),'source_text_bytes':sum(e['source_text_bytes'] for e in es),'source_line_deliveries':sum(len(e['source_lines']) for e in es),'unique_source_lines':len({(x['file'],x['line']) for e in es for x in e['source_lines']})}
 rows.append({'run':run,'task':c['task'],'arm':c['arm'],'finished':bool(finish),'gold_sites':len(gold),'discovered_records':len(candidates),'discovery_recall':len(actual&set(expected))/len(expected),'discovery_precision':len(actual&set(expected))/len(actual) if actual else None,'discovery_missing':[g for k,g in expected.items() if k not in actual],'discovery_extra':[list(k) for k in actual-set(expected)],'dispositions_complete':dkeys==ckeys,'handoff_calls':len(handoffs),'jsonl_input_records':len(candidates) if handoff else None,'jsonl_output_records':len(outputs) if handoff else None,'candidate_loss':len(candidates)-len(outputs) if handoff else None,'payload_preserved':all(o.get('candidate')==candidates[i] and o.get('ordinal')==i+1 for i,o in enumerate(outputs)) if handoff and len(outputs)==len(candidates) else None,'classifications':dict(collections.Counter(o['classification'] for o in outputs)),'unmatched_reasons':dict(collections.Counter(o['reason'] for o in outputs if o['classification']=='unmatched')),'ordinary_total':len(ordinary),'ordinary_seen_discovery':sum(seen(g,[e for e in events if e['phase']=='discovery']) for g in ordinary),'ordinary_full_body_seen_discovery':sum(full(g,[e for e in events if e['phase']=='discovery']) for g in ordinary),'ordinary_seen_after_handoff':sum(seen(g,after) for g in ordinary),'ordinary_actually_skipped':len(actualskip),'ordinary_self_screened_any_stage':sum(full(g,events) for g in ordinary),'actionable_unmatched_read_after_handoff':[g['function'] for g in gold if g['classification']!='ordinary' and seen(g,after)],'findings':[e['request'] for e in findings],'coordinate_matched_danger_diagnoses':len(matchedfind),'first_diagnosis_sequence':first['sequence'] if first else None,'response_bytes_to_coordinate_matched_diagnosis':sum(e['response_bytes'] for e in events if first and e['sequence']<=first['sequence']) if first else None,'total_response_bytes':sum(e['response_bytes'] for e in events),'total_request_bytes':sum(e['request_bytes'] for e in events),'handoff_jsonl_input_bytes':sum(e['handoff_input_bytes'] for e in events),'handoff_jsonl_output_bytes':sum(e['handoff_output_bytes'] for e in events),'stages':stages,'errors':[{'sequence':e['sequence'],'error':e['response']['error']} for e in events if not e['response']['ok']],'wall_seconds':events[-1]['ended']-events[0]['started']})
out=P/('calibration-scores.json' if runs==['cr','cs'] else 'scores.json')
out.write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows,indent=2))
