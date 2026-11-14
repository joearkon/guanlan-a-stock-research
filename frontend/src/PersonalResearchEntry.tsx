import {useState,useEffect} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Bot,Search} from 'lucide-react';
import SecurityAutocomplete from './SecurityAutocomplete';
import type {SecurityAsset} from './security-lookup';
import {AiAction} from './AiAction';
import {Drawer} from './components';
import {sectorByPath,sectorChildPath} from './industry-sectors';
import './personal-research-entry.css';
export default function PersonalResearchEntry(){
 const {pathname}=useLocation(),[open,setOpen]=useState(false);
 useEffect(()=>setOpen(false),[pathname]);
 const scopes:[string,string][]=[['/industry/semiconductors/layers/cleanroom','洁净室与厂务'],['/industry/ai-compute/liquid-cooling','数据中心液冷'],['/industry/batteries/storage','储能电池与系统'],['/industry/consumer/baijiu','白酒'],['/industry/dividend/hydropower','水电'],['/industry/semiconductors','半导体'],['/industry/ai-compute','AI算力'],['/industry/consumer','消费'],['/industry/dividend','红利资产']];
 const sector=sectorByPath(pathname),child=sector?.children.find(c=>pathname===sectorChildPath(sector,c)||pathname.startsWith(sectorChildPath(sector,c)+'/'));
 const name=scopes.find(([path])=>pathname===path||pathname.startsWith(path+'/'))?.[1]||child?.name||sector?.name||'';
 const href=(kind:string)=>'/my-research?'+new URLSearchParams({create:'1',kind,industry:name,...(kind==='industry'?{name}:{})});
 return <div className="personal-research-entry" aria-label="个人价值研究入口"><button type="button" className="personal-research-launch" aria-label="没找到公司？自主研究" aria-haspopup="dialog" title="没找到公司？可搜索名单之外的公司，建立自己的价值研究" onClick={()=>setOpen(true)}><Bot size={18}/><span>自主研究</span></button><Drawer open={open} onOpenChange={setOpen} title="自主价值研究" className="personal-research-drawer"><p className="personal-research-context">{name||'不限产业范围'} · 个人研究</p><h3>没找到公司？从这里开始</h3><p>搜索平台名单之外的公司，先核验业务关系，再建立自己的价值研究；不限市值。</p><CompanySearch key={pathname} industry={name}/><p className="personal-research-cost">搜索不调用AI；确认生成后才消耗额度。报告保存到“我的研究”，不改平台名单。</p><div className="personal-research-entry-actions"><Link className="outline-button" to="/my-research">查看我的研究</Link><Link className="outline-button" to={href('company')}>研究其他公司</Link><Link className="outline-button" to={href('industry')}>新建产业研究</Link></div></Drawer></div>;
}
function CompanySearch({industry}:{industry:string}){
 const navigate=useNavigate(),[input,setInput]=useState(''),[security,setSecurity]=useState<SecurityAsset|null>(null);
 function prepare(){if(!security)return;navigate('/my-research?'+new URLSearchParams({create:'1',kind:'company',code:security.code,name:security.name,industry,focus:`先核验${industry?'与'+industry+'的真实业务关系、':''}赚钱业务、产业位置、壁垒与竞争，再研究利润现金、估值假设与反证。行业或概念归类不是受益证明；没有关联也可独立研究。`}));}
 return <div className="personal-research-company-search"><div className="personal-research-search-field"><Search size={18}/><SecurityAutocomplete label="搜索公司，建立个人研究" hideLabel value={input} onChange={v=>{setInput(v);setSecurity(null);}} onSelect={setSecurity} placeholder="名称 / 代码 / 拼音首字母，不限本页名单" popoverStatus/></div><AiAction disabled={!security} onClick={prepare}>建立公司研究</AiAction>{security&&<span className="personal-research-selection" role="status">已选择 {security.name} · {security.code}，下一步核对范围与深度思考</span>}</div>;
}
