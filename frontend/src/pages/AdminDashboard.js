import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { getStatusBadge, getScoreColor } from '../utils/scoring';
import { Download, AlertTriangle, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [completion,setCompletion] = useState(null);
  const [escalations,setEsc]       = useState([]);
  const [tab,setTab]               = useState('overview');
  const [load,setLoad]             = useState(true);

  useEffect(()=>{
    Promise.all([api.get('/admin/completion'),api.get('/admin/escalations')])
      .then(([c,e])=>{ setCompletion(c.data); setEsc(e.data); })
      .catch(()=>{}).finally(()=>setLoad(false));
  },[]);

  const exportXl = async()=>{
    try {
      const r=await api.get('/admin/export',{responseType:'blob'});
      const url=window.URL.createObjectURL(r.data);
      const a=document.createElement('a');a.href=url;a.download='goalflow_report.xlsx';a.click();
      toast.success('Exported!');
    } catch { toast.error('Export failed'); }
  };

  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;
  const s=completion?.summary||{};

  return (
    <Layout>
      <div className="ph">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h2>Admin Overview</h2><p>Organisation-wide performance · FY 2026</p></div>
          <button className="btn bo" onClick={exportXl}><Download size={16}/>Export Report</button>
        </div>
      </div>

      <div className="sg">
        {[{v:s.total||0,l:'Total Employees',c:'var(--ac)'},{v:s.submitted||0,l:'Submitted',c:'var(--am)'},
          {v:s.approved||0,l:'Approved',c:'var(--gr)'},{v:escalations.length,l:'Escalations',c:'var(--rd)'}].map((st,i)=>(
          <div key={i} className="sc"><div className="ab" style={{background:st.c}}/><div className="val">{st.v}</div><div className="lbl">{st.l}</div></div>
        ))}
      </div>

      <div className="tabs">
        {['overview','escalations'].map(t=>(
          <button key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
            {t==='escalations'&&escalations.length>0&&(
              <span style={{marginLeft:6,background:'var(--rd)',color:'#fff',borderRadius:'50%',width:18,height:18,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem'}}>{escalations.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab==='overview'&&(
        <div className="card">
          <div className="tw">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Manager</th><th>Status</th><th>Score</th></tr></thead>
              <tbody>
                {completion?.employees?.map(emp=>{
                  const badge=getStatusBadge(emp.goal_sheet_status);
                  return(
                    <tr key={emp.employee_id}>
                      <td style={{fontWeight:500}}>{emp.employee_name}</td>
                      <td style={{color:'var(--t2)'}}>{emp.department}</td>
                      <td style={{color:'var(--t2)'}}>{emp.manager_name}</td>
                      <td><span className="badge" style={{background:`${badge.color}22`,color:badge.color}}>{badge.label}</span></td>
                      <td style={{fontFamily:'var(--mn)',fontWeight:700,color:getScoreColor(emp.overall_score)}}>{emp.overall_score}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab==='escalations'&&(
        <div>
          {escalations.length===0
            ?<div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--t2)'}}>
               <Shield size={48} style={{opacity:.3,margin:'0 auto 16px'}}/><h3 style={{color:'var(--tx)',marginBottom:8}}>No Escalations</h3><p>All employees are on track</p>
             </div>
            :escalations.map((e,i)=>(
              <div key={i} className="card" style={{marginBottom:12,borderColor:e.severity==='high'?'rgba(239,68,68,.3)':'rgba(245,158,11,.3)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{display:'flex',gap:12}}>
                    <AlertTriangle size={18} style={{color:e.severity==='high'?'var(--rd)':'var(--am)',flexShrink:0,marginTop:2}}/>
                    <div>
                      <div style={{fontWeight:600,marginBottom:4}}>{e.message}</div>
                      <div style={{fontSize:'.79rem',color:'var(--t2)'}}>Manager: {e.manager_name} · Overdue: {e.days_overdue} days</div>
                    </div>
                  </div>
                  <span className="badge" style={{background:e.severity==='high'?'rgba(239,68,68,.1)':'rgba(245,158,11,.1)',color:e.severity==='high'?'var(--rd)':'var(--am)'}}>
                    {e.severity}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}
    </Layout>
  );
}
