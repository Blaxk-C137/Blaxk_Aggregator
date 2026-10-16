import type { ImportProgress } from './importRules';
export function runJob<T>(message:unknown,onProgress?:(p:ImportProgress)=>void){
 const worker=new Worker(new URL('../workers/aggregator.worker.ts',import.meta.url),{type:'module'});
 let rejectJob:(reason:Error)=>void;
 const promise=new Promise<T>((resolve,reject)=>{
  rejectJob=reject;
  worker.onmessage=e=>{if(e.data.progress){onProgress?.(e.data.progress);return}worker.terminate();if(e.data.error)reject(new Error(e.data.error));else resolve(e.data.result)};
  worker.onerror=e=>{worker.terminate();reject(new Error(e.message||'Background processing failed'))};
  worker.postMessage(message);
 });
 return {promise,cancel:()=>{worker.terminate();rejectJob(new Error('Cancelled'))}};
}
