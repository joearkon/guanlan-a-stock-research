// CSS tokens are authoritative; fallbacks keep non-browser rendering usable.
// These transitions belong to UI chrome, never market values or charts.
const css=(name:string)=>typeof document==='undefined'?'':getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const seconds=(name:string,fallback:number)=>{const value=css(name),match=value.match(/^(\d+(?:\.\d+)?|\.\d+)(ms|s)$/);if(!match)return fallback;return Number(match[1])/(match[2]==='ms'?1000:1);};
export const uiMotion={
 get fast(){return seconds('--motion-fast',.1);},
 get normal(){return seconds('--motion-ui',.15);},
 get panel(){return seconds('--motion-panel',.2);},
 get ease():[number,number,number,number]{const values=css('--motion-ease').match(/^cubic-bezier\(([^)]+)\)$/)?.[1].split(',').map(Number);return values?.length===4&&values.every(Number.isFinite)?values as [number,number,number,number]:[.16,1,.3,1];}
};
