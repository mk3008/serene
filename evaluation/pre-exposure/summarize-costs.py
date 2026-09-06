"""Supplement the frozen controller metric; do not redefine its primary endpoint."""
from pathlib import Path
import json
P=Path(__file__).resolve().parent
scores=json.loads((P/'scores.json').read_text());out=[]
for s in scores:
 run=s['run'];events=[json.loads(x) for x in (P/'results'/f'{run}.jsonl').read_text().splitlines()]
 prompt=len((P/'prompts'/f'{run}.txt').read_bytes())
 # Only a same-request transformation calculation, NOT a hypothetical AI baseline run.
 unfiltered=0
 for e in events:
  response=e['response']
  if e['op'] in ['read','search'] and response['ok']:
   response={'ok':True,'result':{'rows':e['primitive_rows']}}
  unfiltered+=len((json.dumps(response)+'\n').encode())
 out.append({'run':run,'controller_response_bytes_primary':s['total_response_bytes'],
  'prompt_file_text_bytes':prompt,'controller_plus_prompt_file_text_bytes':s['total_response_bytes']+prompt,
  'request_json_bytes':s['total_request_bytes'],'source_text_bytes':s['total_source_text_bytes'],
  'response_bytes_through_diagnosis':s['response_bytes_through_first_preliminary_diagnosis'],
  'response_plus_prompt_bytes_through_diagnosis':s['response_bytes_through_first_preliminary_diagnosis']+prompt,
  'controller_calls':s['total_calls'],'read_calls':sum(e['op']=='read' for e in events),
  'search_calls':sum(e['op']=='search' for e in events),
  'controller_execution_elapsed_seconds':sum(e['ended']-e['started'] for e in events),
  'filter_internal_input_bytes':s['filter_internal']['input_bytes'],'filter_internal_output_bytes':s['filter_internal']['output_bytes'],
  'same_requests_unfiltered_reserialization_bytes':unfiltered,
  'same_requests_filter_wire_reduction_bytes':unfiltered-s['total_response_bytes']})
result={'note':'Prompt file text is loaded once by each reviewer, so this supplemental sum includes its source text as delivered content. Native tool-envelope bytes, system/delegation instructions, reasoning, final answers and model tokens are not measured. Primary controller endpoint remains unchanged. Internal subprocess bytes are not AI-visible. Same-request unfiltered reserialization measures a deterministic transformation only, not alternative agent behavior.', 'runs':out}
(P/'cost-details.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
