import {useState} from 'react';
export default function RelayArtwork({src}:{src?:string}){
 const [failed,setFailed]=useState('');
 return src&&failed!==src?<img src={src} width="48" height="48" loading="lazy" alt="" onError={()=>setFailed(src)}/>:<span className="relay-art-fallback" aria-hidden="true">◇</span>;
}
