import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getStatusBadge, getScoreColor } from '../utils/scoring';
import { Eye, Download } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ManagerDashboard() {
  const nav = useNavigate();
  const [sheets,setSheets] = useState([]);
  const [filter,setFilter] = useState('all');
  const [load,setLoad]     = useState(true);

  useEffect(()=>{
    api.get('/goals/team').then(r=>setSheets(r.data)).catch(()=>{}).finally(()=>setLoad(false));
  },[]);

  const exportXl = async()=>{
    try {
      const r=await api.get('/admin/export',{responseType:'blob'});
      const url=window.URL.createObjectURL(r.data);
      const a=document.createElement('a');a.href=url;a.download='goalflow_report.xlsx';a.click();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  const filtered = filter==='all'?sheets:sheets.filter(s=>s.status===filter);
  const counts   = { total:sheets.length, pending:sheets.filter(s=>s.status==='pending_approval').length,
                     approved:sheets.filter(s=>s.status==='approved').length, draft:sheets.filter(s=>!s.status||s.status==='draft').length };

  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className="ph">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h2>Team Goal Sheets</h2><p>Review and approve team goals · FY 2026</p></div>
          <button className="btn bo" onClick={exportXl}><Download size={16}/>Export Excel</button>
        </div>
      </div>

      <div className="sg">
        {[{v:counts.total,l:'Team Members',c:'var(--ac)'},{v:counts.pending,l:'Pending Approval',c:'var(--am)'},
          {v:counts.approved,l:'Approved',c:'var(--gr)'},{v:counts.draft,l:'Not Submitted',c:'var(--t3)'}].map((s,i)=>(
          <div key={i} className="sc"><div className="ab" style={{background:s.c}}/><div className="val">{s.v}</div><div className="lbl">{s.l}</div></div>
        ))}
      </div>

      <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
        {['all','pending_approval','approved','draft','rework'].map(f=>(
          <button key={f} className={`btn bsm ${filter===f?'bp':'bo'}`} onClick={()=>setFilter(f)}>
            {f==='all'?'All':getStatusBadge(f).label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Employee</th><th>Dept</th><th>Goals</th><th>Status</th><th>Score</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.length===0
                ?<tr><td colSpan={6} style={{textAlign:'center',color:'var(--t2)',padding:40}}>No sheets found</td></tr>
                :filtered.map(s=>{
                  const badge=getStatusBadge(s.status);
                  return(
                    <tr key={s.id}>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div className="avatar" style={{width:28,height:28,fontSize:'.63rem'}}>
                            {s.employee_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <span style={{fontWeight:500}}>{s.employee_name}</span>
                        </div>
                      </td>
                      <td style={{color:'var(--t2)'}}>{s.department}</td>
                      <td style={{fontFamily:'var(--mn)'}}>{s.goals?.length||0}/8</td>
                      <td><span className="badge" style={{background:`${badge.color}22`,color:badge.color}}>{badge.label}</span></td>
                      <td style={{fontFamily:'var(--mn)',fontWeight:700,color:getScoreColor(s.overall_score||0)}}>{s.overall_score||0}%</td>
                      <td><button className="btn bo bsm" onClick={()=>nav(`/manager/review/${s.id}`)}><Eye size={14}/>Review</button></td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
