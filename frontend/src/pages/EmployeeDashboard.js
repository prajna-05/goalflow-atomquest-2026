import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getStatusBadge, getScoreColor, computeScore } from '../utils/scoring';
import { Target, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sheet,setSheet]   = useState(null);
  const [notifs,setNotifs] = useState([]);
  const [recs,setRecs]     = useState([]);
  const [load,setLoad]     = useState(true);

  useEffect(()=>{
    Promise.all([api.get('/goals/my'),api.get('/admin/notifications'),api.get('/admin/ml/recommendations')])
      .then(([s,n,r])=>{ setSheet(s.data); setNotifs(n.data.filter(x=>!x.read).slice(0,2)); setRecs(r.data.slice(0,2)); })
      .catch(()=>{}).finally(()=>setLoad(false));
  },[]);

  const submit = async () => {
    try {
      await api.post(`/goals/${sheet.id}/submit`);
      toast.success('Submitted for approval!');
      const r = await api.get('/goals/my'); setSheet(r.data);
    } catch(err) {
      const d=err.response?.data?.detail;
      toast.error(typeof d==='object'?d.errors?.join(', '):d||'Failed');
    }
  };

  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;
  const badge = sheet ? getStatusBadge(sheet.status) : null;

  return (
    <Layout>
      <div className="ph"><h2>My Dashboard</h2><p>Welcome, {user.name} · {user.department}</p></div>

      {notifs.map(n=>(
        <div key={n.id} className={`al ${n.type?.includes('approved')?'as':n.type?.includes('rejected')?'ae':'ai'}`}>
          <AlertCircle size={15} style={{flexShrink:0}}/>{n.message}
        </div>
      ))}

      {!sheet ? (
        <>
          {recs.length>0 && (
            <div className="card" style={{marginBottom:20}}>
              <div className="ct">🤖 ML Suggested Goals for {user.department}</div>
              {recs.map((r,i)=>(
                <div key={i} style={{padding:'10px 14px',background:'var(--s2)',borderRadius:8,marginBottom:8}}>
                  <div style={{fontSize:'.72rem',color:'var(--ac)',fontFamily:'var(--mn)'}}>{r.thrust_area}</div>
                  <div style={{fontWeight:600}}>{r.title}</div>
                  <div style={{fontSize:'.77rem',color:'var(--t2)'}}>Target: {r.suggested_target} · {r.why}</div>
                </div>
              ))}
            </div>
          )}
          <div className="card" style={{textAlign:'center',padding:'60px 20px'}}>
            <Target size={48} style={{color:'var(--ac)',margin:'0 auto 16px'}}/>
            <h3 style={{marginBottom:8}}>No Goals Yet</h3>
            <p style={{color:'var(--t2)',marginBottom:24,fontSize:'.88rem'}}>Create your 2026 goal sheet. Max 8 goals, total weightage = 100%.</p>
            <button className="btn bp" onClick={()=>nav('/employee/goals')}><Plus size={16}/>Create Goal Sheet</button>
          </div>
        </>
      ) : (
        <>
          <div className="sg">
            {[
              {value:`${sheet.goals?.length||0}/8`,label:'Goals Created',color:'var(--ac)'},
              {value:badge?.label,label:'Status',color:badge?.color},
              {value:`${sheet.overall_score||0}%`,label:'Overall Score',color:getScoreColor(sheet.overall_score||0)},
              {value:`${sheet.goals?.reduce((s,g)=>s+g.weightage,0)||0}%`,label:'Weightage',color:'var(--am)'},
            ].map((s,i)=>(
              <div key={i} className="sc">
                <div className="ab" style={{background:s.color}}/>
                <div className="val" style={{color:s.color,fontSize:'1.3rem'}}>{s.value}</div>
                <div className="lbl">{s.label}</div>
              </div>
            ))}
          </div>

          {sheet.status==='rework'&&sheet.rejection_comment&&(
            <div className="al ae"><AlertCircle size={15} style={{flexShrink:0}}/>
              <div><strong>Manager feedback:</strong> {sheet.rejection_comment}</div>
            </div>
          )}

          <div style={{display:'flex',gap:10,marginBottom:24,flexWrap:'wrap'}}>
            {['draft','rework'].includes(sheet.status)&&<>
              <button className="btn bo" onClick={()=>nav('/employee/goals')}>Edit Goals</button>
              <button className="btn bp" onClick={submit}>Submit for Approval →</button>
            </>}
            {sheet.status==='approved'&&(
              <button className="btn bs" onClick={()=>nav(`/employee/checkin/${sheet.id}`)}>
                <CheckCircle size={16}/>Update Check-in
              </button>
            )}
          </div>

          <div className="card">
            <div className="ct">Goal Progress</div>
            {sheet.goals?.map(goal=>{
              const latest=goal.check_ins?.[goal.check_ins.length-1];
              const score=latest?computeScore(goal,latest.actual):0;
              const sb=getStatusBadge(goal.status||'not_started');
              return(
                <div key={goal.id} className="gc">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                    <div>
                      <div className="gt">{goal.thrust_area}</div>
                      <div className="gti">{goal.title}</div>
                      <div style={{fontSize:'.77rem',color:'var(--t2)',marginTop:4}}>
                        Target: <strong style={{color:'var(--tx)'}}>{goal.target}</strong> · UoM: <strong style={{color:'var(--tx)'}}>{goal.uom}</strong>
                      </div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6}}>
                      <span className="wb">{goal.weightage}%</span>
                      <span className="badge" style={{background:`${sb.color}22`,color:sb.color}}>{sb.label}</span>
                    </div>
                  </div>
                  {sheet.status==='approved'&&(
                    <>
                      <div style={{display:'flex',justifyContent:'space-between',fontSize:'.74rem',color:'var(--t2)',marginBottom:4}}>
                        <span>Score</span>
                        <span style={{color:getScoreColor(score),fontFamily:'var(--mn)',fontWeight:700}}>{score}%</span>
                      </div>
                      <div className="pb"><div className="pf" style={{width:`${Math.min(score,100)}%`,background:getScoreColor(score)}}/></div>
                      <div style={{display:'flex',gap:6,marginTop:8}}>
                        {['Q1','Q2','Q3','Q4'].map(q=>{
                          const ci=goal.check_ins?.find(c=>c.quarter===q);
                          return <span key={q} style={{fontSize:'.69rem',padding:'2px 8px',borderRadius:4,background:ci?'rgba(16,185,129,.1)':'var(--s1)',color:ci?'var(--gr)':'var(--t3)',border:'1px solid var(--bd)'}}>{q}{ci?' ✓':''}</span>;
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </Layout>
  );
}
