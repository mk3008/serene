import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2];const functions={};const sites=[];
for(const file of fs.readdirSync(root).filter(f=>/\.[cm]?js$/.test(f))){
 const sf=ts.createSourceFile(file,fs.readFileSync(path.join(root,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
 functions[file]={};
 for(const node of sf.statements){
  if(!ts.isFunctionDeclaration(node)||!node.name)continue;
  const name=node.name.text,start=sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,end=sf.getLineAndCharacterOfPosition(node.getEnd()-1).line+1;
  functions[file][name]={path:file,function:name,start,end};
  function visit(n){
   if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&['query','execute','prepare'].includes(n.expression.name.text)){
    const loc=sf.getLineAndCharacterOfPosition(n.getStart(sf));sites.push({id:`${file}:${name}`,path:file,function:name,line:loc.line+1,column:loc.character+1,start,end,dependency_spans:[]});
   }ts.forEachChild(n,visit);
  }visit(node);
 }
}
console.log(JSON.stringify({functions,sites}));
