import { processFiles, generateOutput } from '../utils/fileProcessing';
import type { AppOptions, FileItem, ExportFormat } from '../types';
self.onmessage=async(e:MessageEvent<{task:string;files:File[]|FileItem[];options:AppOptions;format:ExportFormat}>)=>{
 const {task,files,options,format}=e.data;
 try{
  if(task==='import'){
   let last=0;
   const result=await processFiles(files as File[],options,p=>{const now=Date.now();if(now-last>80||p.completed===p.total){self.postMessage({progress:p});last=now}});
   self.postMessage({result});return;
  }
  const items=files as FileItem[];
  if(task==='export'&&format==='pdf'){
   const {default:jsPDF}=await import('jspdf');const pdf=new jsPDF();let y=15;
   pdf.setFont('courier','normal');pdf.setFontSize(8);
   for(const file of items){
    const lines=[file.path,...(options.includeMetadata?[`${file.language} | ${file.lines} lines | ${file.size} bytes`]:[]),...file.content.split('\n').map((l,i)=>options.includeLineNumbers?`${i+1} | ${l}`:l)];
    for(const line of lines)for(const wrapped of pdf.splitTextToSize(line,180)){if(y>280){pdf.addPage();y=15}pdf.text(wrapped,15,y);y+=4}y+=8;
   }
   self.postMessage({result:pdf.output('blob')});return;
  }
  const text=generateOutput(items,options,format==='pdf'?'txt':format);
  if(task==='preview')self.postMessage({result:{text:text.slice(0,120000),truncated:text.length>120000}});
  else if(task==='copy')self.postMessage({result:text});
  else self.postMessage({result:new Blob([text],{type:format==='html'?'text/html;charset=utf-8':format==='json'?'application/json':'text/plain;charset=utf-8'})});
 }catch(err){self.postMessage({error:err instanceof Error?err.message:String(err)})}
};
