import {Link,Navigate,useSearchParams} from 'react-router-dom';
import {Widget} from './components';
import {pending} from '../../web/v2/v2-routes.mjs';
export default function Pending(){const [params]=useSearchParams(),key=params.get('section')||'research',section=pending[key]||pending.research;if(key==='research')return <Navigate to="/industry" replace/>;return <Widget title={section.label}><p className="stock-prose">此栏目尚未开放完整业务功能。迁移保留原有状态，不展示演示研究结果或虚构数据。</p><p className="provenance">可先从全市场观测、雷达事件或个股档案查看已有资料及来源。</p><div className="home-shortcuts"><Link className="outline-button" to="/market-observation">全市场观测</Link><Link className="outline-button" to="/radar-observation">雷达观测</Link><Link className="outline-button" to="/stock">个股档案</Link></div></Widget>;}
