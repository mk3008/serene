#!/usr/bin/env python3
"""Stage opaque instruction-mediated packets; this program never dispatches actors."""
from __future__ import annotations
import argparse, hashlib, json, shutil, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
RUNTIME = Path('/tmp/repository-agent-study')
BUNDLE = """Use `@mk3008/serene` as the default construction path for executable raw SQL; if it cannot preserve needed SQL behavior, keep the exception explicit for additional review. For SQL-construction review, use the installed `serene-audit` and keep unresolved paths in review. Use ordinary results to skip redundant construction-provenance review, not SQL meaning/binding, authorization, or business-behavior checks.\n"""
RUNS = {
 'r01': ('calibration', 'calibration-contact-lookup', 'instruction'), 'r02': ('calibration', 'calibration-contact-lookup', 'presence'),
 'r03': ('calibration', 'calibration-construction-review', 'presence'), 'r04': ('calibration', 'calibration-construction-review', 'instruction'),
 'r05': ('calibration', 'calibration-authorization-followup', 'instruction'), 'r06': ('calibration', 'calibration-authorization-followup', 'presence'),
 'r07': ('scored', 'product-sku-lookup', 'presence'), 'r08': ('scored', 'product-sku-lookup', 'instruction'),
 'r09': ('scored', 'billing-construction-review', 'instruction'), 'r10': ('scored', 'billing-construction-review', 'presence'),
 'r11': ('scored', 'invoice-authorization-followup', 'presence'), 'r12': ('scored', 'invoice-authorization-followup', 'instruction'),
}

def sha(path: Path) -> tuple[int, str]:
 h=hashlib.sha256(); n=0
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''): n+=len(b); h.update(b)
 return n,h.hexdigest()
def tree(path: Path, exclude=()) -> dict:
 exclude=set(exclude); rows=[]
 for child in sorted(path.rglob('*')):
  rel=child.relative_to(path).as_posix()
  if any(rel == x or rel.startswith(x + '/') for x in exclude): continue
  if child.is_symlink(): rows.append((rel,'l',str(child.readlink()),0))
  elif child.is_file():
   size,digest=sha(child); rows.append((rel,'f',digest,size))
  elif child.is_dir(): rows.append((rel,'d','',0))
 canonical=''.join(f'{r[0]}\0{r[1]}\0{r[2]}\0{r[3]}\n' for r in rows).encode()
 return {'tree_sha256':hashlib.sha256(canonical).hexdigest(),'entries':len(rows),'bytes':sum(r[3] for r in rows)}
def files(path: Path, exclude=()) -> dict:
 result={}
 for child in sorted(path.rglob('*')):
  rel=child.relative_to(path).as_posix()
  if child.is_file() and not any(rel == x or rel.startswith(x + '/') for x in exclude):
   size,digest=sha(child); result[rel]={'bytes':size,'sha256':digest}
 return result
def write_json(path: Path, value: object) -> None:
 path.parent.mkdir(parents=True,exist_ok=True); path.write_text(json.dumps(value,indent=2,sort_keys=True)+'\n')
def copy_packet(source: Path, destination: Path) -> None:
 shutil.copytree(source,destination,ignore=shutil.ignore_patterns('node_modules','.git'))
def gate(path: Path) -> bool:
 try:
  value=json.loads(path.read_text())
  return value.get('status') == 'pass'
 except Exception: return False

def stage(args: argparse.Namespace) -> int:
 phase, fixture_id, treatment = RUNS[args.run_id]
 if args.phase != phase: raise SystemExit(f'{args.run_id} belongs to {phase}, not {args.phase}')
 if phase == 'scored' and not args.calibration_gate: raise SystemExit('scored staging requires --calibration-gate with {"status":"pass"}')
 if phase == 'scored' and not gate(Path(args.calibration_gate)): raise SystemExit('calibration gate is absent or not pass')
 fixture=HERE/'fixtures'/fixture_id
 if not fixture.is_dir(): raise SystemExit(f'missing fixture {fixture}')
 runtime=Path(args.runtime).resolve(); root=runtime/args.run_id; evidence=runtime/'evidence'/args.run_id
 if root.exists() or evidence.exists(): raise SystemExit(f'refusing to overwrite {root} or {evidence}')
 runtime.mkdir(parents=True,exist_ok=True); evidence.mkdir(parents=True)
 runner_target=runtime/'runner.py'; runner_source=HERE/'runner.py'
 if runner_target.exists() and sha(runner_target)[1] != sha(runner_source)[1]: raise SystemExit('runtime runner differs from canonical runner.py')
 if not runner_target.exists(): shutil.copy2(runner_source,runner_target)
 copy_packet(fixture,root)
 agents=root/'AGENTS.md'; base=agents.read_text(encoding='utf-8')
 if treatment == 'instruction': agents.write_text(base.rstrip()+'\n\n'+BUNDLE,encoding='utf-8')
 package_manifest=evidence/'package-install.json'
 install=subprocess.run(['node',str(HERE/'prepare-package.mjs'),'install','--tarball',str(Path(args.tarball).resolve()),'--app',str(root),'--manifest',str(package_manifest)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 (evidence/'package-install.stdout').write_bytes(install.stdout); (evidence/'package-install.stderr').write_bytes(install.stderr)
 if install.returncode: raise SystemExit(f'package installation failed; evidence retained in {evidence}')
 verify_manifest=evidence/'package-verify.json'
 verify=subprocess.run(['node',str(HERE/'prepare-package.mjs'),'verify','--app',str(root),'--manifest',str(verify_manifest)],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=False)
 (evidence/'package-verify.stdout').write_bytes(verify.stdout); (evidence/'package-verify.stderr').write_bytes(verify.stderr)
 if verify.returncode: raise SystemExit(f'package verification failed; evidence retained in {evidence}')
 copy_packet(root,evidence/'initial-packet')
 log=evidence/'events.jsonl'; prompt_template=(HERE/'PROMPT-TEMPLATE.md').read_text(encoding='utf-8')
 instructions=prompt_template.format(packet_root=root,event_log=log)
 instructions_path=evidence/'participant-instructions.md'; instructions_path.write_text(instructions,encoding='utf-8')
 initial=f'Read and follow {instructions_path} before working in {root}.\n'
 initial_path=evidence/'initial-text.txt'; initial_path.write_text(initial,encoding='utf-8')
 package_info=json.loads(package_manifest.read_text()); package_verify=json.loads(verify_manifest.read_text())
 documentation={}
 for doc in [root/'node_modules/@mk3008/serene/README.md', root/'node_modules/@mk3008/serene/docs']:
  if doc.is_file(): documentation[doc.relative_to(root).as_posix()]={'bytes':sha(doc)[0],'sha256':sha(doc)[1]}
  elif doc.is_dir(): documentation[doc.relative_to(root).as_posix()]=tree(doc)
 raw_prompt_hash=sha(instructions_path); canonical=instructions.replace(str(root),'<packet-root>').replace(str(log),'<event-log>')
 manifest={'run_id':args.run_id,'phase':phase,'fixture':fixture_id,'treatment':treatment,'requested_participant':{'model':'gpt-5.6-luna','reasoning_effort':'medium','fresh_session':True,'fork_turns':'none'},'serene_source_revision':'4c5204b40b384ad7304a7f90e145e60d4b7ac2c4','actual_paths':{'runtime':str(runtime),'packet_root':str(root),'evidence':str(evidence),'runner':str(runner_target),'event_log':str(log)},'runner':{'sha256':sha(runner_target)[1]},'caps':{'commands':30,'timeout_seconds':120,'output_threshold_bytes':24000},'initial_text':{'path':str(initial_path),'bytes':sha(initial_path)[0],'sha256':sha(initial_path)[1]},'loaded_prompt':{'path':str(instructions_path),'bytes':raw_prompt_hash[0],'sha256':raw_prompt_hash[1],'canonical_sha256':hashlib.sha256(canonical.encode()).hexdigest()},'task_files':files(root,exclude=('node_modules','vendor')),'app_tree':tree(root,exclude=('node_modules','vendor')),'install_trees':{'node_modules':tree(root/'node_modules'),'vendor':tree(root/'vendor')},'package_install':package_info,'package_verify':package_verify,'documentation':documentation,'expected_sole_difference':'root AGENTS.md instruction bundle'}
 write_json(evidence/'stage-manifest.json',manifest)
 print(json.dumps({'run_id':args.run_id,'packet_root':str(root),'initial_text':str(initial_path),'manifest':str(evidence/'stage-manifest.json')}))
 return 0

def harvest(args: argparse.Namespace) -> int:
 runtime=Path(args.runtime).resolve(); root=runtime/args.run_id; evidence=runtime/'evidence'/args.run_id; archive=Path(args.archive).resolve()/args.run_id
 if not root.is_dir() or not evidence.is_dir() or archive.exists(): raise SystemExit('missing run artifacts or archive already exists')
 source_packet_tree=tree(root,exclude=('node_modules','.git'))
 archive.mkdir(parents=True); copy_packet(root,archive/'packet'); shutil.copytree(evidence,archive/'evidence',ignore=shutil.ignore_patterns('node_modules','.git'))
 archived_packet_tree=tree(archive/'packet')
 if source_packet_tree != archived_packet_tree: raise SystemExit('archived packet tree differs from final staged root')
 manifest={'run_id':args.run_id,'actual_paths':{'packet_root':str(root),'evidence':str(evidence)},'archive_paths':{'packet':str(archive/'packet'),'evidence':str(archive/'evidence')},'final_root_tree_excluding_dependencies':source_packet_tree,'packet_tree':archived_packet_tree,'evidence_tree':tree(archive/'evidence')}
 write_json(archive/'run-manifest.json',manifest); print(json.dumps(manifest))
 return 0

def freeze(args: argparse.Namespace) -> int:
 runtime=Path(args.runtime).resolve(); selected=[run for run, value in RUNS.items() if value[0] == args.phase]
 manifests={run:json.loads((runtime/'evidence'/run/'stage-manifest.json').read_text()) for run in selected}
 pairs=[('r01','r02'),('r03','r04'),('r05','r06')] if args.phase == 'calibration' else [('r07','r08'),('r09','r10'),('r11','r12')]
 parity=[]
 for left,right in pairs:
  if left not in manifests or right not in manifests: continue
  a,b=manifests[left],manifests[right]
  files_a,files_b=a['task_files'],b['task_files']
  changed=sorted(set(files_a)|set(files_b))
  changed=[path for path in changed if files_a.get(path)!=files_b.get(path)]
  same={key:a[key] == b[key] for key in ('install_trees','documentation')}
  same['package_lock_sha256']=a['package_install']['package_lock_sha256']==b['package_install']['package_lock_sha256']
  same['tarball_sha256']=a['package_install']['tarball_sha256']==b['package_install']['tarball_sha256']
  same['canonical_prompt_sha256']=a['loaded_prompt']['canonical_sha256']==b['loaded_prompt']['canonical_sha256']
  parity.append({'pair':[left,right],'changed_app_files':changed,'non_treatment_equal':same,'pass':changed==['AGENTS.md'] and all(same.values())})
 if len(manifests) != len(selected) or not all(item['pass'] for item in parity): raise SystemExit('cannot freeze incomplete or non-matching phase')
 tarballs=[Path(value['package_install']['staged_tarball']) for value in manifests.values()]
 tarball_hashes={sha(path)[1] for path in tarballs}
 if len(tarball_hashes)!=1: raise SystemExit('phase does not use byte-identical tarballs')
 source=tarballs[0]; destination=HERE/'artifacts'/source.name
 destination.parent.mkdir(exist_ok=True)
 if destination.exists() and sha(destination)[1]!=sha(source)[1]: raise SystemExit('repository artifact hash differs from staged tarball')
 if not destination.exists(): shutil.copy2(source,destination)
 requested={json.dumps(value['requested_participant'],sort_keys=True) for value in manifests.values()}
 if len(requested)!=1: raise SystemExit('phase does not have one requested participant configuration')
 fixture_ids=sorted({value['fixture'] for value in manifests.values()})
 source_evidence={
  'prompt_template':{'bytes':sha(HERE/'PROMPT-TEMPLATE.md')[0],'sha256':sha(HERE/'PROMPT-TEMPLATE.md')[1]},
  'runner':{'bytes':sha(HERE/'runner.py')[0],'sha256':sha(HERE/'runner.py')[1]},
  'package_stager':{'bytes':sha(HERE/'prepare-package.mjs')[0],'sha256':sha(HERE/'prepare-package.mjs')[1]},
  'packet_stager':{'bytes':sha(HERE/'stage.py')[0],'sha256':sha(HERE/'stage.py')[1]},
  'fixtures':{fixture:tree(HERE/'fixtures'/fixture) for fixture in fixture_ids},
  'gold':{fixture:tree(HERE/'gold'/fixture) for fixture in fixture_ids},
 }
 if args.phase == 'scored':
  gate_path=Path(args.calibration_gate).resolve() if args.calibration_gate else HERE/'results'/'calibration'/'interface-gate.json'
  if gate_path.is_file(): source_evidence['calibration_gate']={'path':str(gate_path),'bytes':sha(gate_path)[0],'sha256':sha(gate_path)[1]}
 frozen={'phase':args.phase,'runs':selected,'requested_participant':json.loads(next(iter(requested))),'cohort_manifest':'pending agent identifiers after dispatch','shared_tarball':{'path':str(destination),'bytes':sha(destination)[0],'sha256':sha(destination)[1]},'source_evidence':source_evidence,'parity':parity,'stage_manifests':{run:str(runtime/'evidence'/run/'stage-manifest.json') for run in selected}}
 write_json(HERE/'freeze'/f'{args.phase}.json',frozen); print(json.dumps(frozen))
 return 0

def main() -> int:
 p=argparse.ArgumentParser(); sub=p.add_subparsers(dest='operation',required=True)
 s=sub.add_parser('stage'); s.add_argument('--run-id',choices=RUNS,required=True); s.add_argument('--phase',choices=('calibration','scored'),required=True); s.add_argument('--tarball',required=True); s.add_argument('--runtime',default=str(RUNTIME)); s.add_argument('--calibration-gate')
 h=sub.add_parser('harvest'); h.add_argument('--run-id',choices=RUNS,required=True); h.add_argument('--runtime',default=str(RUNTIME)); h.add_argument('--archive',default=str(HERE/'results'))
 f=sub.add_parser('freeze'); f.add_argument('--phase',choices=('calibration','scored'),required=True); f.add_argument('--runtime',default=str(RUNTIME)); f.add_argument('--calibration-gate')
 a=p.parse_args(); return stage(a) if a.operation=='stage' else (harvest(a) if a.operation=='harvest' else freeze(a))
if __name__=='__main__': raise SystemExit(main())
