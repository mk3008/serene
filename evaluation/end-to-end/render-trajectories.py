"""Derived readable transcript; authoritative payloads stay in JSONL."""
from pathlib import Path
import json
P=Path(__file__).resolve().parent
fence=chr(96)*3
for run in ['tr','ts','sr','ss']:
 es=[json.loads(l) for l in (P/'results'/f'{run}.jsonl').read_text().splitlines()]
 out=[f'# {run} recorded trajectory','',
      'Every mediated request/response is preserved below. Native orchestration envelopes and model reasoning are not exported. See JSONL for raw rg/CLI subprocess streams and exact response byte counts.','']
 for e in es:
  out.extend([f"## {e['sequence']}: {e['phase']} / {e['op']}",'',
              f"Request bytes: {e['request_bytes']}; response bytes: {e['response_bytes']}.",'',
              fence+'json',json.dumps(e['request'],ensure_ascii=False,indent=2),fence,
              fence+'json',json.dumps(e['response'],ensure_ascii=False,indent=2),fence,''])
 (P/'results'/f'{run}-trajectory.md').write_text('\n'.join(out))
