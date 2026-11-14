import type {OcrWord} from './holding-screenshot';
export function holdingOcrContrast(source:Uint8ClampedArray){
 // Normalize faint grey headers and coloured figures on a separate OCR canvas.
 // The user-visible image and privacy masks remain unchanged.
 let light=0,dark=0;for(let i=0;i<source.length;i+=4){const v=(source[i]+source[i+1]+source[i+2])/3;if(v>190)light++;else if(v<80)dark++;}
 const output=new Uint8ClampedArray(source.length),lightBackground=light>=dark;
 for(let i=0;i<source.length;i+=4){const alpha=source[i+3]/255,v=(source[i]+source[i+1]+source[i+2])/3*alpha+255*(1-alpha),pixel=lightBackground?(v<220?0:255):(v>75?0:255);output[i]=output[i+1]=output[i+2]=pixel;output[i+3]=255;}return output;
}
export async function loadHoldingImage(file:File){
 if(!['image/png','image/jpeg'].includes(file.type)||!file.size||file.size>5*1024*1024)throw Error('请选择5MB以内的PNG或JPEG持仓截图');
 const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer);let width=0,height=0;
 if(bytes.length>24&&bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71){width=view.getUint32(16);height=view.getUint32(20);}
 else if(bytes[0]===255&&bytes[1]===216){for(let i=2;i+8<bytes.length;){if(bytes[i]!==255)break;const marker=bytes[i+1],length=view.getUint16(i+2);if(length<2||i+length+2>bytes.length)break;if([192,193,194].includes(marker)){height=view.getUint16(i+5);width=view.getUint16(i+7);break;}i+=length+2;}}
 if(width<100||height<60||width>6000||height>6000||width*height>6000000)throw Error('图片尺寸不适合识别，请先裁剪到持仓表格（最多600万像素）');
 const bitmap=await createImageBitmap(file),scale=Math.min(2,1500/bitmap.width,Math.sqrt(2400000/(bitmap.width*bitmap.height))),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 const ctx=canvas.getContext('2d');if(!ctx){bitmap.close();throw Error('当前浏览器不支持本地图片处理，可使用表格导入');}ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();return canvas;
}
let running=false;
export async function prepareHoldingOcrAssets(signal:AbortSignal,onProgress:(value:number,label:string)=>void){
 if(signal.aborted)throw new DOMException('已取消','AbortError');
 const root=new URL(import.meta.env.BASE_URL+'ocr/tesseract-7.0.0-v1/',window.location.origin).href;
 const paths={workerPath:root+'worker.min.js',corePath:root+'tesseract-core-lstm.wasm.js',langPath:root.replace(/\/$/,'')};
 const controller=new AbortController(),abort=()=>controller.abort(signal.reason),timer=setTimeout(()=>controller.abort(Error('识别资源下载超时，可稍后手动重试或使用表格导入')),45000);signal.addEventListener('abort',abort,{once:true});
 const resources:[string,number][]=[['worker.min.js',500000],['tesseract-core-lstm.wasm.js',5000000],['chi_sim.traineddata.gz',3000000]];let completed=0;
 try{
  await Promise.all(resources.map(async([name,max])=>{
   const response=await fetch(root+name,{cache:'force-cache',credentials:'same-origin',signal:controller.signal});
   const type=response.headers.get('content-type')||'';
   if(!response.ok||!(name.endsWith('.gz')?/^(application\/(gzip|x-gzip|octet-stream))/.test(type):/^(text|application)\/javascript/.test(type))||Number(response.headers.get('content-length'))>max)throw Error('本地识别资源读取失败，未自动重试；可使用表格导入');
   const reader=response.body?.getReader();if(!reader)throw Error('识别资源未完整返回');let size=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw Error('识别资源大小异常，已停止读取');}}}finally{reader.releaseLock();}
   if(!size)throw Error('识别资源为空');completed++;onProgress(completed/(resources.length*2),'准备本地识别组件 '+completed+'/'+resources.length);
  }));
  return paths;
 }catch(e){controller.abort();if(signal.aborted)throw new DOMException('已取消','AbortError');throw controller.signal.reason instanceof Error&&controller.signal.reason.message.includes('下载超时')?controller.signal.reason:e;}
 finally{clearTimeout(timer);signal.removeEventListener('abort',abort);}
}
export async function recognizeHoldingImage(image:HTMLCanvasElement,signal:AbortSignal,onProgress:(value:number,label:string)=>void):Promise<OcrWord[]>{
 if(running)throw Error('已有一个本地识别正在执行，请先完成或取消');if(signal.aborted)throw new DOMException('已取消','AbortError');running=true;
 let worker:any,closed=false,timer:ReturnType<typeof setTimeout>|undefined,abort:()=>void=()=>{};
 const stop=new Promise<never>((_,reject)=>{abort=()=>reject(new DOMException('已取消识别','AbortError'));signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>reject(Error('本地识别超时，未自动重试；可裁剪后手动再试或使用表格导入')),90000);});
 const work=(async()=>{
  const [{createWorker},paths]=await Promise.all([import('tesseract.js'),prepareHoldingOcrAssets(signal,onProgress)]);
  if(closed||signal.aborted)throw new DOMException('已取消','AbortError');
  worker=await createWorker(['chi_sim'],1,{...paths,workerBlobURL:false,cachePath:'guanlan-ocr-7',cacheMethod:'write',errorHandler:()=>{},logger:m=>{if(!closed)onProgress(m.status==='recognizing text'?m.progress:0,m.status==='recognizing text'?'正在本地识别持仓表格':'正在加载本地识别组件');}});
  if(closed){await worker.terminate();throw new DOMException('已取消','AbortError');}
  await worker.setParameters({tessedit_pageseg_mode:'11',preserve_interword_spaces:'1'});
  const prepared=document.createElement('canvas');prepared.width=image.width;prepared.height=image.height;const ctx=prepared.getContext('2d')!;ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,prepared.width,prepared.height);pixels.data.set(holdingOcrContrast(pixels.data));ctx.putImageData(pixels,0,0);
  try{const {data}=await worker.recognize(prepared,{}, {blocks:true,text:false});return (data.blocks||[]).flatMap(b=>b.paragraphs.flatMap(p=>p.lines.flatMap(l=>l.words))).map(w=>({text:w.text,confidence:w.confidence,bbox:w.bbox}));}
  finally{prepared.width=0;prepared.height=0;}
 })();
 try{return await Promise.race([work,stop]);}finally{closed=true;clearTimeout(timer);signal.removeEventListener('abort',abort);if(worker)await worker.terminate().catch(()=>{});work.catch(()=>{});running=false;}
}
