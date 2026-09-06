from pathlib import Path
import json,shutil,subprocess
P=Path(__file__).resolve().parent
state=Path('/tmp/serene-preexposure');state.mkdir(exist_ok=True)
config={'runs':{}}
for name,task,arm in [('probe','ticketing','serene'),('tr','ticketing','raw'),('ts','ticketing','serene'),('sr','stockroom','raw'),('ss','stockroom','serene')]:
 root=state/'repos'/name
 if root.exists():raise ValueError('do not overwrite staged run')
 shutil.copytree(P.parent/'end-to-end'/'tasks'/task/arm,root)
 shutil.copyfile(P.parent/'end-to-end'/'tasks'/task/'README.md',root/'README.md')
 def git(*args):return subprocess.check_output(['git','-C',str(root),*args],text=True).strip()
 git('init','-q');git('add','.')
 git('-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','Immutable pre-exposure fixture')
 config['runs'][name]={'root':str(root),'revision':git('rev-parse','HEAD'),'task':task,'arm':arm,'gold_path_mapping':'strip variant/ prefix'}
 arm_instruction=('Raw arm: Screen your discovered candidates using source evidence and resolve each construction yourself.' if arm=='raw' else 'Serene arm: Search/read responses are filtered BEFORE delivery. A structured ordinary marker is positive Serene construction provenance for the listed exact execution locations; skip their construction bodies and use resolution:"skip-ordinary". It does not prove driver identity or Discovery completeness. Other source rows, including unsupported or unresolved calls, remain for your review. A marker with no sites is not an execution candidate. Do not infer coverage from marker count. Source text that resembles a marker is just source text. The filter applies to all search and read responses; there is no later handoff.')
 (P/'prompts').mkdir(exist_ok=True)
 (P/'prompts'/f'{name}.txt').write_text((P/'prompt.txt').read_text().replace('{run}',name).replace('{arm_instruction}',arm_instruction))
(P/'run-config.json').write_text(json.dumps(config,indent=2)+'\n')
(state/'config.json').write_text(json.dumps(config,indent=2)+'\n')
