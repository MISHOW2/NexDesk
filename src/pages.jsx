import React,{useState} from 'react';
import {Plus,Ticket,BookOpen,Settings,Search,Clock3,Activity,CheckCircle2,ArrowUpRight,ArrowRight,Wifi,Mail,Printer,Cloud,KeyRound,Gauge,Inbox,UserX,Save,LifeBuoy,Monitor,Lock,Shield,ThumbsUp,ThumbsDown,Download,Sparkles} from 'lucide-react';
import {Donut,Trend,exportCsv,done as isDone,slaInfo} from './ui.jsx';

const slug=s=>s.replaceAll(' ','-').toLowerCase();
export const greet=()=>{const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'};
const Badge=({kind,children})=><span className={`badge ${kind}-${slug(children)}`}>{children}</span>;

export function UserDashboard({auth,tickets,go,openTicket}){
  const mine=tickets.filter(t=>t.by===auth.name);
  const n=s=>mine.filter(t=>s.includes(t.status)).length;
  const done=n(['Resolved','Closed']),pct=Math.round(done/Math.max(mine.length,1)*100);
  const stats=[['My tickets',mine.length,Ticket,'mint','Submitted by you'],['Open',n(['Open']),Clock3,'blue','Waiting for an agent'],['In progress',n(['In progress']),Activity,'orange','Being worked on'],['Resolved',done,CheckCircle2,'purple','Successfully handled']];
  const quick=[[Plus,'Create ticket','Report a new issue','New ticket'],[Ticket,'My tickets','Track your requests','All tickets'],[BookOpen,'Knowledge base','Find quick answers','Knowledge base'],[Settings,'Account settings','Profile and alerts','Settings']];
  const services=[[Mail,'Email & calendar','Operational'],[Wifi,'Office Wi-Fi','Operational'],[KeyRound,'VPN access','Degraded'],[Printer,'Printing','Operational'],[Cloud,'Shared drives','Operational']];
  const r=44,c=2*Math.PI*r;
  return <>
    <div className="page-heading"><div><span className="eyebrow green">MY DASHBOARD</span><h1>{greet()}, {auth.name.split(' ')[0]}</h1><p>Track your requests and find help without waiting in a queue.</p></div><button className="btn primary" onClick={()=>go('New ticket')}><Plus size={18}/> Create ticket</button></div>
    <div className="welcome-banner user-hero"><div><span className="banner-tag">IT HELP CENTRE</span><h2>How can we help you today?</h2><p>Search common fixes or raise a ticket and our team will pick it up.</p>
      <button className="hero-search" onClick={()=>go('Knowledge base')}><Search size={17}/> Search the knowledge base <ArrowRight size={15}/></button></div>
      <div className="banner-visual hero-ring"><LifeBuoy size={120} strokeWidth={1}/></div></div>
    <div className="quick-grid">{quick.map(([I,t,d,p])=><button className="quick-card" key={t} onClick={()=>go(p)}><span className="stat-icon blue"><I size={20}/></span><strong>{t}</strong><small>{d}</small><ArrowUpRight size={16}/></button>)}</div>
    <div className="stats">{stats.map(([l,v,I,c,note])=><div className="stat-card" key={l}><div className={'stat-icon '+c}><I size={21}/></div><span>{l}</span><strong>{String(v).padStart(2,'0')}</strong><small>{note}</small></div>)}</div>
    <div className="user-grid">
      <section className="panel"><div className="panel-head"><div><h3>My recent tickets</h3><p>Your latest requests and their status</p></div><button className="text-link" onClick={()=>go('All tickets')}>View all <ArrowUpRight size={15}/></button></div>
        {mine.length===0?<div className="empty"><Inbox size={30}/><br/>You haven’t raised any tickets yet.</div>:<div className="activity-list">{mine.slice(0,5).map(t=><button className="activity-item" key={t.id} onClick={()=>openTicket(t)}><span><strong>{t.title}</strong><small>#{t.id} · {t.category} · {t.created}</small></span><Badge kind="status">{t.status}</Badge><ArrowUpRight size={16}/></button>)}</div>}</section>
      <div className="stack">
        <section className="panel ring-panel"><svg width="110" height="110" viewBox="0 0 110 110"><circle cx="55" cy="55" r={r} className="ring-bg"/><circle cx="55" cy="55" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} transform="rotate(-90 55 55)"/><text x="55" y="61" textAnchor="middle">{pct}%</text></svg><div><h3>Resolution rate</h3><p>{done} of {mine.length} of your tickets are resolved.</p></div></section>
        <section className="panel"><div className="panel-head"><div><h3>Service status</h3><p>Live health of company services</p></div></div><div className="status-list">{services.map(([I,l,s])=><div key={l}><I size={17}/><span>{l}</span><em className={s==='Operational'?'ok':'warn'}>{s}</em></div>)}</div></section>
      </div></div>
  </>;
}

const articles=[
  [Wifi,'Network','Connecting to the office Wi-Fi','Select “NexDesk-Staff”, sign in with your work email and password, then accept the certificate prompt. If it fails, forget the network and try again.'],
  [KeyRound,'Network','Fixing VPN disconnections','Update your VPN client, switch from Wi-Fi to a wired or hotspot connection to test, and restart the client. If drops continue, log a ticket with the time of each drop.'],
  [Lock,'Access request','Resetting your password','Use “Forgot password” on the sign-in page. Passwords must be 12+ characters. If you are locked out, raise an Access request ticket.'],
  [Printer,'Hardware','Clearing a stuck print queue','Cancel all jobs in the printer queue, restart the print spooler service or reboot the computer, then print a single test page.'],
  [Monitor,'Hardware','Laptop won’t power on','Hold the power button for 15 seconds with the charger unplugged, reconnect the charger, and wait 10 minutes. If there is no light, create an Urgent ticket.'],
  [Mail,'Software','Setting up email on your phone','Add a new Exchange account, enter your work email, and approve the device security prompt. Your IT team may need to approve new devices.'],
  [Shield,'Other','Spotting phishing emails','Check the sender address, avoid unexpected attachments, and never share passwords. Forward suspicious messages to the IT team and delete them.'],
  [Cloud,'Access request','Requesting shared drive access','Raise an Access request ticket naming the folder and your manager. Access is usually granted within one working day after approval.']];

export function KnowledgeBase({go}){
  const [q,setQ]=useState(''),[cat,setCat]=useState('All'),[open,setOpen]=useState(articles[0][2]);
  const cats=['All','Network','Hardware','Software','Access request','Other'];
  const list=articles.filter(a=>(cat==='All'||a[1]===cat)&&`${a[2]} ${a[3]}`.toLowerCase().includes(q.toLowerCase()));
  return <>
    <div className="page-heading"><div><span className="eyebrow green">SELF-SERVICE</span><h1>Knowledge base</h1><p>Quick answers to the most common IT questions.</p></div></div>
    <section className="panel ticket-panel"><div className="filters"><div className="search-box"><Search size={18}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search articles..."/></div></div>
      <div className="chips">{cats.map(c=><button key={c} className={c===cat?'on':''} onClick={()=>setCat(c)}>{c}</button>)}</div>
      <div className="kb-list">{list.map(([I,c,t,d])=>{const id=t;return <div className={'kb-item '+(open===id?'open':'')} key={t}><button onClick={()=>setOpen(open===id?null:id)}><span className="stat-icon blue"><I size={18}/></span><span><strong>{t}</strong><small>{c}</small></span><ArrowRight size={16}/></button>{open===id&&<><p>{d}</p><div className="kb-feedback">Was this helpful? <button onClick={e=>e.currentTarget.parentNode.textContent='Thanks for your feedback!'}><ThumbsUp size={13}/> Yes</button><button onClick={e=>e.currentTarget.parentNode.textContent='Thanks — create a ticket if you still need help.'}><ThumbsDown size={13}/> No</button></div></>}</div>})}
        {list.length===0&&<div className="empty">No articles found.</div>}</div></section>
    <div className="kb-cta"><LifeBuoy size={22}/><div><strong>Still stuck?</strong><p>Can’t find your answer? Our team is happy to help.</p></div><button className="btn primary" onClick={()=>go('New ticket')}>Create ticket</button></div>
  </>;
}

export function Reports({tickets,users}){
  const total=tickets.length,done=tickets.filter(t=>['Resolved','Closed'].includes(t.status)).length;
  const act=tickets.filter(t=>['Open','In progress'].includes(t.status));
  const tiles=[['Resolution rate',Math.round(done/Math.max(total,1)*100)+'%',Gauge,'mint'],['Active tickets',act.length,Activity,'blue'],['Urgent & active',act.filter(t=>t.priority==='Urgent').length,Clock3,'orange'],['SLA breached',act.filter(t=>slaInfo(t).breached).length,UserX,'purple']];
  const Bars=({title,items,field})=><section className="panel"><div className="panel-head"><div><h3>{title}</h3></div></div><div className="bars">{items.map((x,i)=>{const k=tickets.filter(t=>t[field]===x).length;return <div className="bar-row" key={x}><span>{x}</span><div className="bar-track"><div className={'bar-fill bar-'+(i%4)} style={{width:`${Math.max(2,k/Math.max(total,1)*100)}%`}}/></div><strong>{k}</strong></div>})}</div></section>;
  const staff=users.filter(u=>u.role!=='User');
  return <>
    <div className="page-heading"><div><span className="eyebrow green">INSIGHTS</span><h1>Reports</h1><p>Performance and workload across the service desk.</p></div><button className="btn ghost" onClick={()=>exportCsv(tickets)}><Download size={16}/> Export CSV</button></div>
    <div className="stats">{tiles.map(([l,v,I,c])=><div className="stat-card" key={l}><div className={'stat-icon '+c}><I size={21}/></div><span>{l}</span><strong>{v}</strong></div>)}</div>
    <div className="dashboard-grid"><Bars title="Tickets by category" items={['Hardware','Software','Network','Access request','Other']} field="category"/><Bars title="Tickets by priority" items={['Low','Medium','High','Urgent']} field="priority"/></div>
    <div className="dashboard-grid" style={{marginTop:20}}><section className="panel"><div className="panel-head"><div><h3>Tickets created</h3><p>Last 7 days</p></div></div><Trend tickets={tickets}/></section><section className="panel"><div className="panel-head"><div><h3>Status split</h3><p>Current distribution</p></div></div><Donut data={[['Open','#3b82f6'],['In progress','#f59e0b'],['Resolved','#10b981'],['Closed','#64748b']].map(([l,c])=>({label:l,color:c,value:tickets.filter(t=>t.status===l).length}))}/></section></div>
    <section className="panel ticket-panel" style={{marginTop:20}}><div className="panel-head" style={{padding:'22px 24px 0'}}><div><h3>Agent workload</h3><p>Assigned and resolved tickets per team member</p></div></div><div className="table-wrap"><table><thead><tr><th>AGENT</th><th>ROLE</th><th>ACTIVE</th><th>RESOLVED</th></tr></thead><tbody>{staff.map(u=><tr key={u.email}><td><strong>{u.name}</strong><small>{u.email}</small></td><td><span className={'badge role-'+u.role.toLowerCase()}>{u.role}</span></td><td>{act.filter(t=>t.assignee===u.name).length}</td><td>{tickets.filter(t=>t.assignee===u.name&&['Resolved','Closed'].includes(t.status)).length}</td></tr>)}</tbody></table></div></section>
  </>;
}

export function SettingsPage({auth,onSave}){
  const [prefs,setPrefs]=useState({updates:true,comments:true,digest:false});
  const tog=k=><button type="button" className={'toggle '+(prefs[k]?'on':'')} onClick={()=>setPrefs(p=>({...p,[k]:!p[k]}))}><i/></button>;
  return <>
    <div className="page-heading"><div><span className="eyebrow green">ACCOUNT</span><h1>Settings</h1><p>Manage your profile and notification preferences.</p></div></div>
    <div className="form-grid">
      <section className="panel form-panel"><h3>Profile</h3><form onSubmit={e=>{e.preventDefault();onSave(Object.fromEntries(new FormData(e.currentTarget)))}}>
        <label>Full name<input name="name" defaultValue={auth.name} required/></label>
        <label>Department<select name="department" defaultValue={auth.department}>{['IT','Finance','Operations','HR','Marketing'].map(d=><option key={d}>{d}</option>)}</select></label>
        <label>Email address<input value={auth.email} disabled readOnly/></label>
        <label>Role<input value={auth.role} disabled readOnly/></label>
        <div className="form-actions"><button className="btn primary" type="submit"><Save size={16}/> Save changes</button></div></form></section>
      <section className="panel"><h3>Notifications</h3>{[['updates','Ticket status updates','When the status of your ticket changes'],['comments','New comments','When someone replies to your ticket'],['digest','Weekly digest','A summary of your activity every Monday']].map(([k,t,d])=><div className="pref" key={k}><div><strong>{t}</strong><p>{d}</p></div>{tog(k)}</div>)}</section>
    </div>
  </>;
}
