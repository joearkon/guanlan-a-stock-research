// The original local compute/semiconductor boards render Unicode icon strings
// from their data, not an external icon library. Keep that visual vocabulary
// centralized; decorative symbols never replace accessible text labels.
const symbols:Record<string,string>={
 'ai-compute':'🧠',gpu:'🧠',hbm:'💾',optics:'☀️',pcb:'🧩',cooling:'❄️',power:'⚡',idc:'🏢',
 design:'🔬',manufacturing:'🏭',packaging:'📦',materials:'🧪',equipment:'⚙️',discrete:'⚡',
 capacity:'🏗️',lithography:'💡','etch-film':'⚙️',etch:'⚙️',deposition:'🧪',cleaning:'💧',metrology:'🔎',components:'🧩',
 chamber:'⚙️',vacuum:'🌀',gas:'🧪',rf:'⚡',thermal:'🌡️',service:'🛠️',
};
export function IndustryIcon({kind,className=''}:{kind:string;className?:string}){return <span className={'industry-semantic-icon '+className} aria-hidden="true">{symbols[kind]||'🔬'}</span>;}
