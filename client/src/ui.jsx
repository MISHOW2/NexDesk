import React,{useState,useEffect,useRef,useMemo} from 'react';
import {Search,CornerDownLeft,Wifi,Monitor,AppWindow,KeyRound,CircleHelp} from 'lucide-react';

export const SLA_HOURS={Urgent:4,High:8,Medium:24,Low:72};
export const catIcon={Hardware:Monitor,Software:AppWindow,Network:Wifi,'Access request':KeyRound,Other:CircleHelp};
export const done=t=>['Resolved','Closed'].includes(t.status);

export function slaInfo(t,now=Date.now()){
  if(done(t))return{cls:'done',label:'Met'};
  const due=t.createdAt+SLA_HOURS[t.priority]*36e5,left=due-now,h=Math.abs(left)/36e5;
  const txt=h<1?`${Math.round(h*60)}m`:h<48?`${Math.round(h)}h`:`${Math.round(h/24)}d`;
  return left<0?{cls:'bad',label:`Breached ${txt}`,breached:true}:left<36e5*3?{cls:'warn',label:`Due in ${txt}`}:{cls:'ok',label:`${txt} left`};
}

export function exportCsv(rows){
  const cols=['id','title','category','priority','status','assignee','by','created'];
  const esc=v=>`"${String(v??'').replaceAll('"','""')}"`;
  const csv=[cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`nexdesk-tickets-${new Date().toISOString().slice(0,10)}.csv`;a.click();URL.revokeObjectURL(a.href);
}

export const ago=ts=>{const m=Math.round((Date.now()-ts)/6e4);return m<1?'Just now':m<60?`${m}m ago`:m<1440?`${Math.round(m/60)}h ago`:`${Math.round(m/1440)}d ago`};

export function Donut({data,size=130}){
  const total=Math.max(data.reduce((a,d)=>a+d.value,0),1),r=46,c=2*Math.PI*r;let off=0;
  return <div className="donut-wrap"><svg width={size} height={size} viewBox="0 0 120 120"><circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="14"/>
    {data.map(d=>{const len=d.value/total*c,el=<circle key={d.label} cx="60" cy="60" r={r} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${len} ${c-len}`} strokeDashoffset={-off} transform="rotate(-90 60 60)"/>;off+=len;return el})}
    <text x="60" y="58" textAnchor="middle" style={{fill:'var(--text)',font:'800 20px Manrope'}}>{total===1&&data.every(d=>!d.value)?0:total}</text><text x="60" y="73" textAnchor="middle" style={{fill:'var(--text-4)',font:'600 9px DM Sans'}}>TOTAL</text></svg>
    <div className="donut-leg">{data.map(d=><span key={d.label}><i style={{background:d.color}}/>{d.label}<strong>{d.value}</strong></span>)}</div></div>;
}

export function Trend({tickets,days=7}){
  const pts=useMemo(()=>{const out=[];for(let i=days-1;i>=0;i--){const s=new Date();s.setHours(0,0,0,0);s.setDate(s.getDate()-i);const e=s.getTime()+864e5;
    out.push({d:s.toLocaleDateString('en-GB',{weekday:'short'}),n:tickets.filter(t=>t.createdAt>=s.getTime()&&t.createdAt<e).length})}return out},[tickets,days]);
  const max=Math.max(3,...pts.map(p=>p.n)),W=420,H=150,x=i=>30+i*(W-50)/(days-1),y=n=>H-28-n/max*(H-50);
  const line=pts.map((p,i)=>`${i?'L':'M'}${x(i)},${y(p.n)}`).join(' ');
  return <svg className="trend" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">{[0,.5,1].map(f=><line key={f} className="gl" x1="30" x2={W-20} y1={y(max*f)} y2={y(max*f)}/>)}
    <path className="ar" d={`${line} L${x(days-1)},${H-28} L${x(0)},${H-28}Z`}/><path className="ln" d={line}/>
    {pts.map((p,i)=><g key={i}><circle cx={x(i)} cy={y(p.n)} r="3.5" fill="var(--accent)"/><text x={x(i)} y={H-10} textAnchor="middle">{p.d}</text></g>)}</svg>;
}

export function CommandPalette({open,onClose,items}){
  const [q,setQ]=useState(''),[i,setI]=useState(0),ref=useRef();
  const list=useMemo(()=>items.filter(x=>`${x.label} ${x.hint||''}`.toLowerCase().includes(q.toLowerCase())).slice(0,12),[items,q]);
  useEffect(()=>{if(open){setQ('');setI(0);setTimeout(()=>ref.current?.focus(),20)}},[open]);
  useEffect(()=>setI(0),[q]);
  if(!open)return null;
  const run=x=>{if(x){onClose();x.run()}};
  const key=e=>{if(e.key==='ArrowDown'){e.preventDefault();setI(v=>Math.min(v+1,list.length-1))}else if(e.key==='ArrowUp'){e.preventDefault();setI(v=>Math.max(v-1,0))}else if(e.key==='Enter')run(list[i]);else if(e.key==='Escape')onClose()};
  let last='';
  return <div className="cmd-back" onClick={onClose}><div className="cmd" onClick={e=>e.stopPropagation()}>
    <div className="cmd-in"><Search size={18}/><input ref={ref} value={q} onChange={e=>setQ(e.target.value)} onKeyDown={key} placeholder="Search tickets, pages and actions…"/><span className="kbd">ESC</span></div>
    <div className="cmd-list">{list.length===0&&<div className="empty">No results for “{q}”.</div>}
      {list.map((x,n)=>{const head=x.group!==last?<div className="cmd-grp" key={'g'+x.group}>{x.group.toUpperCase()}</div>:null;last=x.group;
        return <React.Fragment key={x.id}>{head}<button className={'cmd-item '+(n===i?'sel':'')} onMouseEnter={()=>setI(n)} onClick={()=>run(x)}><x.icon size={17}/>{x.label}<small>{x.hint}</small></button></React.Fragment>})}</div>
    <div className="cmd-foot"><span><CornerDownLeft size={11}/> to select</span><span>↑↓ to navigate</span></div></div></div>;
}
