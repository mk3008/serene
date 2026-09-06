"""Uniform conversion: reads Raw source only, never oracle/gold files."""
def convert(raw):
    output=[];fixed=False
    for line in raw.splitlines():
        if line.startswith('export async function '):fixed=False
        if line.startswith('  const statement = `') and '${' not in line:
            fixed=True;line=line.replace('= `','= sql`',1)
        if line=='  return db.query(statement, params);' and fixed:
            output.append('  const query = bind(statement, params);')
            line='  return db.query(query.text, query.params);'
        output.append(line)
    return "import { sql, bind } from '@mk3008/serene';\n\n"+'\n'.join(output)+'\n'
