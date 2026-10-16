import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareImport } from '../src/utils/importRules';
import { processFiles, generateOutput } from '../src/utils/fileProcessing';
import type { AppOptions } from '../src/types';
const options:AppOptions={includeLineNumbers:true,includeMetadata:true,includeSubfolders:true,groupBy:'folder',separator:'=',excludePatterns:['node_modules','.git'],fileExtensions:[],maxFileSize:100};
function file(path:string,text='hello'){const f=new File([text],path.split('/').pop()!);Object.defineProperty(f,'webkitRelativePath',{value:path});return f}
const paths=(files:File[])=>files.map(f=>f.webkitRelativePath);
test('root patterns, anchored rules, directory pruning, negation, glob and comments',async()=>{
 const items=[file('repo/.gitignore','# comment\n*.log\n!important.log\n/cache/\n**/generated.*\n'),file('repo/debug.log'),file('repo/important.log'),file('repo/cache/a.ts'),file('repo/src/cache/a.ts'),file('repo/src/generated.ts'),file('repo/src/App.tsx')];
 assert.deepEqual(paths((await prepareImport(items,options)).files),['repo/.gitignore','repo/important.log','repo/src/cache/a.ts','repo/src/App.tsx']);
});
test('nested gitignore overrides file rules but not ignored ancestor directories',async()=>{
 const items=[file('repo/.gitignore','*.log\nblocked/\n'),file('repo/src/.gitignore','!debug.log\n/private.ts\n'),file('repo/src/debug.log'),file('repo/other/debug.log'),file('repo/src/private.ts'),file('repo/src/deep/private.ts'),file('repo/blocked/.gitignore','!keep.ts'),file('repo/blocked/keep.ts')];
 const got=paths((await prepareImport(items,options)).files);assert(got.includes('repo/src/debug.log'));assert(got.includes('repo/src/deep/private.ts'));assert(!got.includes('repo/blocked/keep.ts'));assert(!got.includes('repo/src/private.ts'));assert(!got.includes('repo/other/debug.log'));
});
test('manual exclusions use patterns, not substring matching',async()=>{const got=paths((await prepareImport([file('repo/.git/config'),file('repo/.github/workflows/test.yml'),file('repo/node_modules/a.ts')],options)).files);assert.deepEqual(got,['repo/.github/workflows/test.yml']);});
test('subfolder option, extension filtering and size limit',async()=>{const got=await prepareImport([file('repo/root.ts'),file('repo/src/deep.ts'),file('repo/readme.md'),file('repo/big.ts','x'.repeat(2000))],{...options,includeSubfolders:false,fileExtensions:['ts'],maxFileSize:.001});assert.deepEqual(paths(got.files),['repo/root.ts']);});
test('large text is preserved and lines counted without truncating export',async()=>{const content='const n = 1;\n'.repeat(100000);const result=await processFiles([file('repo/big.ts',content)],options);assert.equal(result[0].content,content);assert.equal(result[0].lines,100001);const html=generateOutput(result,options,'html');assert(html.includes('100001'));assert(html.includes('const n = 1;'));});
test('binary data skipped even with an unknown extension',async()=>{assert.equal((await processFiles([file('repo/asset.dat','hello\0world')],options)).length,0)});
test('HTML escaping runs without a DOM',async()=>{const files=await processFiles([file('repo/a.ts','<script>alert("x")</script>')],options);assert(generateOutput(files,options,'html').includes('&lt;script&gt;'));});
