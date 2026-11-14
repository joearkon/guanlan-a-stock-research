import {createPortal} from 'react-dom';
import {LoaderCircle} from 'lucide-react';
import './loading.css';
export default function PageLoading({label='正在打开页面',variant='route'}:{label?:string;variant?:'route'|'panel'|'overlay'}){
 const content=<div className={'page-loading page-loading--'+variant} role="status" aria-label={label} aria-live="polite" aria-busy="true"><div className="page-loading-content"><LoaderCircle className="page-loading-spinner" size={24} aria-hidden="true"/><span>{label}</span></div></div>;
 return variant==='overlay'?createPortal(content,document.body):content;
}
