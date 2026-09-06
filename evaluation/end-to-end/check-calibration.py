from pathlib import Path
import json
P=Path(__file__).resolve().parent
r,s=json.loads((P/'calibration-scores.json').read_text())
checks={
 'raw_discovery_complete':r['discovery_recall']==1 and r['discovery_precision']==1,
 'serene_discovery_complete':s['discovery_recall']==1 and s['discovery_precision']==1,
 'raw_self_screening':r['ordinary_self_screened_any_stage']==2,
 'serene_actual_skip':s['ordinary_actually_skipped']==2 and s['ordinary_seen_after_handoff']==0,
 'serene_actionable_unmatched_followed':len(s['actionable_unmatched_read_after_handoff'])==2,
 'no_candidate_loss':s['candidate_loss']==0 and s['payload_preserved'],
 'dispositions_complete':r['dispositions_complete'] and s['dispositions_complete'],
 'finished':r['finished'] and s['finished'],
 'diagnosis_coordinates':r['coordinate_matched_danger_diagnoses']==1 and s['coordinate_matched_danger_diagnoses']==1,
 'no_tool_errors':not r['errors'] and not s['errors']
}
result={'behavioral_checks':checks,'passed':all(checks.values()),'mechanism_adjudication':'Parent must inspect both finding mechanisms before approving scored freeze.'}
(P/'calibration-gate.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2))
