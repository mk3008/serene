"""Synthetic pre-freeze review materials, not scored participant data."""
from pathlib import Path
import hashlib, json, random
ROOT = Path(__file__).resolve().parent
CONTRACT = '''# Application contract
Review SQL construction/provenance only. db.query(text, params) passes text and
named values unchanged to native SQLite and returns rows. tenantId and recordId
are nonempty strings; limit is an integer 1..100. Context and input are plain data
objects. Their string contents are untrusted. SQL identifiers and ordering syntax
must come from finite source-owned choices. Ordinary application authorization,
result meaning and business validation are outside this construction review.
The modules are independent item-listing operations over tables sharing columns
id, tenant_id, label, created_at. Normal source search/navigation is allowed.
Do not assume any expected count of hazards. Give source evidence for findings.
'''
for task,seed,danger in [('harbor',7181,True),('meadow',7182,False)]:
    rng=random.Random(seed)
    kinds=['fixed']*95+['finite']*4+(['runtime'] if danger else ['finite'])
    rng.shuffle(kinds)
    gold=[]
    for variant in ['raw','serene']:
        target=ROOT/'fixtures'/task/variant
        target.mkdir(parents=True,exist_ok=True)
        (target/'CONTRACT.md').write_text(CONTRACT)
        for module in range(20):
            blocks=[]
            for j in range(5):
                n=module*5+j; kind=kinds[n]
                # This construction specification is shared. Conversion only reads
                # syntax kind (static vs interpolation), never D/N gold labels.
                if kind=='fixed':
                    expression='`SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY created_at DESC LIMIT :limit`'
                elif kind=='finite':
                    expression="`SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY ${column} ${direction} LIMIT :limit`"
                else:
                    expression="`SELECT id, label FROM items WHERE tenant_id = :tenantId AND id >= :recordId ORDER BY ${column} ${direction} LIMIT :limit`"
                # Identical local names and scaffolding for all sites in both arms.
                body=f'''export async function listItems{j}(db, context, input) {{
  const recordId = input.recordId;
  const column = {'input.order' if kind=='runtime' else "input.order === 'label' ? 'label' : 'created_at'"};
  const direction = input.direction === 'asc' ? 'ASC' : 'DESC';
  const statement = {expression};
  const params = {{ tenantId: context.tenantId, recordId, limit: input.limit }};
  return db.query(statement, params);
}}
'''
                if variant=='serene' and '${' not in expression:
                    body=body.replace('const statement = `','const statement = sql`').replace('  return db.query(statement, params);','  const query = bind(statement, params);\n  return db.query(query.text, query.params);')
                blocks.append(body)
                if variant=='raw':
                    gold.append({'site':f'op{module:02d}/listItems{j}','file':f'op{module:02d}.mjs','function':f'listItems{j}','construction':kind,'D':kind=='runtime','N':kind!='fixed','evidence':'untrusted order becomes SQL syntax' if kind=='runtime' else 'trace finite source-owned order and direction' if kind=='finite' else 'fixed SQL plus native named parameters'})
            # Uniform import in S, never a per-hazard decoration.
            prefix="import { sql, bind } from '@mk3008/serene';\n\n" if variant=='serene' else ''
            (target/f'op{module:02d}.mjs').write_text(prefix+'\n'.join(blocks))
    (ROOT/f'{task}-gold.json').write_text(json.dumps({'task':task,'seed':seed,'synthetic_calibration':True,'sites':gold},indent=2)+'\n')
files=[{'path':str(p.relative_to(ROOT)),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted((ROOT/'fixtures').rglob('*')) if p.is_file()]
(ROOT/'fixture-hashes.json').write_text(json.dumps(files,indent=2)+'\n')
