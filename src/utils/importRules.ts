import ignore, { type Ignore } from 'ignore';
import type { AppOptions } from '../types';
export interface ImportProgress { completed:number; total:number; skipped:number; name:string }
export async function prepareImport(files:File[],options:AppOptions){
 const paths=files.map(f=>(f.webkitRelativePath||f.name).replace(/\\/g,'/'));
 const commonRoot=paths.length>0&&paths.every(p=>p.includes('/')&&p.split('/')[0]===paths[0].split('/')[0])?paths[0].split('/')[0]+'/':'';
 const relative=(p:string)=>commonRoot&&p.startsWith(commonRoot)?p.slice(commonRoot.length):p;
 const rules:{base:string; matcher:Ignore}[]=[];
 for(let i=0;i<files.length;i++)if(files[i].name==='.gitignore'&&files[i].size<=1024*1024){
  const path=relative(paths[i]);const base=path.slice(0,-'.gitignore'.length);
  rules.push({base,matcher:ignore().add(await files[i].text())});
 }
 rules.sort((a,b)=>a.base.length-b.base.length);
 const manual=ignore().add(options.excludePatterns);
 let bytes=0;const accepted:File[]=[];
 for(let i=0;i<files.length;i++){
  const f=files[i], path=relative(paths[i]);
  if(!path||manual.ignores(path)||(!options.includeSubfolders&&path.includes('/'))||f.size>options.maxFileSize*1024*1024)continue;
  // Evaluate each ancestor first: Git never traverses an ignored directory.
  let excluded=false;
  const segments=path.split('/');
  const candidates=segments.slice(0,-1).map((_,n)=>segments.slice(0,n+1).join('/')+'/').concat(path);
  for(const candidate of candidates){
   let ignored=false;
   for(const rule of rules)if(candidate.startsWith(rule.base)){
    const local=candidate.slice(rule.base.length);if(!local)continue;
    const verdict=rule.matcher.test(local);
    if(verdict.ignored)ignored=true;else if(verdict.unignored)ignored=false;
   }
   if(ignored){excluded=true;break}
  }
  if(excluded)continue;
  const ext=f.name.split('.').pop()?.toLowerCase()||'';
  if(options.fileExtensions.length&&!options.fileExtensions.includes(ext))continue;
  // Prevent accidentally reading archives, media, executables and repository objects.
  if(/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|mp[34]|mov|zip|gz|tar|exe|dll|so|bin|lock)$/i.test(path))continue;
  if(bytes+f.size>200*1024*1024)continue;
  bytes+=f.size;accepted.push(f);
 }
 return {files:accepted,skipped:files.length-accepted.length};
}
