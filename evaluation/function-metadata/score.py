"""Successor score wrapper: reuse the frozen pre-exposure scorer with local paths."""
from pathlib import Path
import importlib.util,json,sys
from metadata import candidate_function_check, supplied_name_check
P=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('preexposure_score',P.parent/'pre-exposure'/'score.py')
old=importlib.util.module_from_spec(spec);spec.loader.exec_module(old)
old.P=P
old.E2E=P.parent/'end-to-end'
config=json.loads((P/'run-config.json').read_text())['runs']
runs=sys.argv[1:] or ['probe','ts','ss']
rows=[old.score(run,config) for run in runs]
for row in rows:
 events=[json.loads(x) for x in (P/'results'/f"{row['run']}.jsonl").read_text().splitlines() if x.strip()]
 gold_records=json.loads((old.E2E/f"gold/{row['task']}.json").read_text())['records']
 gold={(g['file'].split('/',1)[1],g['line'],g['column']):{**g, 'file':g['file'].split('/',1)[1]} for g in gold_records if g['variant']==row['arm']}
 discovery=next((e for e in events if e.get('op')=='discover' and e.get('response',{}).get('ok')),None)
 candidates=discovery.get('request',{}).get('candidates',[]) if discovery else []
 candidate_check=candidate_function_check(candidates,gold)
 all_candidate_check=supplied_name_check(candidates,gold,'candidate')
 findings=[e.get('request',{}) for e in events if e.get('op')=='finding' and e.get('response',{}).get('ok')]
 finish=next((e for e in events if e.get('op')=='finish' and e.get('response',{}).get('ok')),None)
 dispositions=finish.get('request',{}).get('dispositions',[]) if finish else []
 supplied_findings=supplied_name_check(findings,gold,'finding')
 supplied_dispositions=supplied_name_check(dispositions,gold,'disposition')
 row['function_metadata']={'candidate_annotations':candidate_check,'all_candidate_annotations':all_candidate_check,'finding_annotations':supplied_findings,'disposition_annotations':supplied_dispositions,'candidate_missing_or_wrong':candidate_check['missing']+candidate_check['wrong'],'candidate_exact':candidate_check['exact'],'all_candidate_exact':sum(check['exact'] for check in all_candidate_check)}
rowset={'runs':rows,'raw_references':json.loads((P/'run-config.json').read_text()).get('raw_references',{})}
out=P/('probe-scores.json' if runs == ['probe'] else 'scores.json')
out.write_text(json.dumps(rowset,indent=2)+'\n');print(json.dumps(rowset,indent=2))
