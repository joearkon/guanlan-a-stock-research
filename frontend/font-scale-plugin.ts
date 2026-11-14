// Scale CSS text only. Keep control hit areas, images and line heights intact.
export function scaleFontValue(prop:string,value:string){
 if(value.includes('--user-font-scale'))return value;
 const size='((?:\\d*\\.)?\\d+)px',scale=(n:string)=>`calc(${n}px * var(--user-font-scale, 1))`;
 if(prop==='font-size'||/^--(?:type-(?:title|section|body|meta)|text-(?:xs|sm|base|lg|xl|[2-9]xl))$/.test(prop))return value.replace(new RegExp('^'+size+'$'),(_,n)=>Number(n)>0?scale(n):'0px');
 if(prop==='font')return value.replace(new RegExp('(^|\\s)'+size+'(?=\\s|/)'),(_,space,n)=>space+scale(n));
 return value;
}
export default function fontScalePlugin(){return{postcssPlugin:'guanlan-font-scale',Declaration(decl:{prop:string,value:string}){decl.value=scaleFontValue(decl.prop,decl.value);}};}
