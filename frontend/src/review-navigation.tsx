import {NavLink,Navigate,useLocation} from 'react-router-dom';
export function ReviewNavigation(){return <div className="subnav"><NavLink to="/market-observation">市场观测</NavLink><NavLink to="/screener">条件观测</NavLink><NavLink to="/funding-observation">资金观测</NavLink><NavLink to="/radar-observation">雷达观测</NavLink></div>;}
export function LegacyReview({kind}:{kind:'notes'|'emotion'|'radar'}){
 const l=useLocation(),p=new URLSearchParams(l.search);p.set('section',kind);if(kind==='emotion'&&p.get('tab')==='ai'){p.set('section','overview');p.delete('tab');}
 return <Navigate replace to={'/market-observation?'+p.toString()+(kind==='emotion'&&new URLSearchParams(l.search).get('tab')==='ai'?'#commentary':l.hash)}/>;
}
