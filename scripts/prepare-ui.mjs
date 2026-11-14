import {mkdir,copyFile,readdir}from'node:fs/promises';
const base=new URL('../frontend/',import.meta.url),target=new URL('public/ocr/tesseract-7.0.0-v1/',base);
await mkdir(target,{recursive:true});
await copyFile(new URL('node_modules/tesseract.js/dist/worker.min.js',base),new URL('worker.min.js',target));
for(const name of await readdir(new URL('node_modules/tesseract.js-core/',base)))if(/-lstm\.wasm\.js$/.test(name))await copyFile(new URL('node_modules/tesseract.js-core/'+name,base),new URL(name,target));
for(const lang of['chi_sim','eng'])await copyFile(new URL(`node_modules/@tesseract.js-data/${lang}/4.0.0_best_int/${lang}.traineddata.gz`,base),new URL(lang+'.traineddata.gz',target));
await copyFile(new URL('node_modules/tesseract.js/LICENSE.md',base),new URL('TESSERACT-LICENSE.md',target));await copyFile(new URL('node_modules/tesseract.js-core/LICENSE',base),new URL('CORE-LICENSE',target));
console.log('Local OCR assets prepared.');
