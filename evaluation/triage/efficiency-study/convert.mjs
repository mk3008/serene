// Reads only raw source. No gold/oracle input. Conservative uniform literal rule.
import ts from 'typescript';
import {readFileSync,writeFileSync,readdirSync,mkdirSync,copyFileSync} from 'node:fs';
import path from 'node:path';
const [input,output]=process.argv.slice(2);mkdirSync(output,{recursive:true});const record=[];
for(const name of readdirSync(input)) {
 if(!name.endsWith('.js')){copyFileSync(path.join(input,name),path.join(output,name));continue;}
 const source=readFileSync(path.join(input,name),'utf8');const ast=ts.createSourceFile(name,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);const edits=[];let n=0;
 function walk(node){
  if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&node.expression.name.text==='query'&&node.arguments.length===2&&ts.isStringLiteralLike(node.arguments[0])){
   let statement=node;while(statement.parent&&!ts.isBlock(statement.parent)&&!ts.isSourceFile(statement.parent))statement=statement.parent;
   const allowed=ts.isReturnStatement(statement)||ts.isVariableStatement(statement)||ts.isExpressionStatement(statement);
   if(allowed&&ts.isBlock(statement.parent)){
    const id=`__sereneQuery${++n}`;if(source.includes(id))throw Error('generated identifier collision');
    const literal=node.arguments[0].text.replaceAll('\\','\\\\').replaceAll('`','\\`').replaceAll('${','\\${');
    edits.push({start:statement.getStart(ast),end:statement.getStart(ast),text:`const ${id} = bind(sql\`${literal}\`, ${node.arguments[1].getText(ast)});\n  `});
    edits.push({start:node.getStart(ast),end:node.end,text:`${node.expression.getText(ast)}(${id}.text, ${id}.params)`});
   }
  }ts.forEachChild(node,walk);
 }walk(ast);
 let result=source;for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
 result="import { sql, bind } from '@mk3008/serene';\n\n"+result;writeFileSync(path.join(output,name),result);record.push({file:name,converted_literal_calls:n,rule:'direct two-argument query call with static literal, same block statement; other paths unchanged'});
}
console.log(JSON.stringify(record));
