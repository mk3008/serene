from pathlib import Path
import json,shutil,subprocess
P=Path(__file__).resolve().parent;state=Path('/tmp/serene-e2e');state.mkdir(exist_ok=True)
arms={'raw':'Raw arm: After discover, screen every candidate yourself using the source evidence. No Serene handoff or audit is available. Deep-review constructions whose safety is not yet established; reuse evidence already read when sufficient.',
'serene':'Serene arm: Immediately after discover, invoke {"op":"handoff"} (no extra fields). It returns the full real JSONL classification for your candidates. Treat skip:true as positive ordinary construction provenance at that exact revision/location: do not reread those bodies after handoff, and mark them skip-ordinary. Investigate every actionable/unmatched candidate with targeted source reads and resolve it; a violation label alone is not a vulnerability. Unknown, stale or unmatchable candidates stay in the review set. Skip applies only to construction, not SQL/business correctness.'}
config={'runs':{}};(P/'prompts').mkdir(exist_ok=True)
for task,prefix in [('calibration','c'),('ticketing','t'),('stockroom','s')]:
 for arm in arms:
  name=prefix+('r' if arm=='raw' else 's');root=state/'repos'/name
  if root.exists():raise ValueError('do not overwrite staged run')
  shutil.copytree(P/'tasks'/task/arm,root)
  shutil.copyfile(P/'tasks'/task/'README.md',root/'README.md')
  def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
  git('init','-q');git('add','.')
  git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Immutable end-to-end fixture')
  config['runs'][name]={'root':str(root),'revision':git('rev-parse','HEAD'),'task':task,'arm':arm,'gold_path_mapping':'strip variant/ prefix'}
  prompt=(P/'prompt.txt').read_text().replace('{run}',name).replace('{arm_instruction}',arms[arm])
  (P/'prompts'/f'{name}.txt').write_text(prompt)
(P/'run-config.json').write_text(json.dumps(config,indent=2)+'\n')
(state/'config.json').write_text(json.dumps(config,indent=2)+'\n')
