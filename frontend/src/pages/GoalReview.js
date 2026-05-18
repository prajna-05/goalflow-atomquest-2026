import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { computeScore, getScoreColor, getStatusBadge } from '../utils/scoring';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Lock, MessageSquare } from 'lucide-react';

export default function GoalReview() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sheet,setSheet]         = useState(null);
  const [editGoals,setEditGoals] = useState([]);
  const [rejectMsg,setRejectMsg] = useState('');
  const [showReject,setShowReject] = useState(false);
  const [comment,setComment]     = useState('');
  const [commentQ,setCommentQ]   = useState('Q1');
  const [sub,setSub]             = useState(false);

  useEffect(()=>{
    api.get(`/goals/${id}`).then(r=>{ setSheet(r.data); setEditGoals(r.data.goals); })
      .catch(()=>nav('/manager'));
  },[id,nav]);

  const approve = async()=>{
    setSub(true);
    try {
      await api.post(`/goals/${id}/approve`,{goals:editGoals});
      toast.success('Approved and locked!'); nav('/manager');
    } catch(err){
      const d=err.response?.data?.detail;
      toast.error(typeof d==='object'?d.errors?.join(', '):d||'Failed');
    } finally { setSub(false); }
  };

  const reject = async()=>{
    if(!rejectMsg.trim()) return toast.error('Provide a reason');
    setSub(true);
    try { await api.post(`/goals/${id}/reject`,{comment:rejectMsg}); toast.success('Returned for rework'); nav('/manager'); }
    catch { toast.error('Failed'); } finally { setSub(false); }
  };

  const addComment = async()=>{
    if(!comment.trim()) return toast.error('Enter a comment');
    try {
      const r=await api.post(`/goals/${id}/comment`,{quarter:commentQ,comment});
      toast.success('Comment saved'); setComment(''); setSheet(r.data);
    } catch { toast.error('Failed'); }
  };

  if(!sheet) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;

  const badge=getStatusBadge(sheet.status);
  const isApproved=sheet.status==='approved';
  const totalW=editGoals.reduce((s,g)=>s+Number(g.weightage),0);

  return (
    <Layout>
      <div className="ph">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <h2>Review: {sheet.employee_name}</h2>
            <p>FY 2026 · <span className="badge" style={{background:`${badge.color}22`,color:badge.color}}>{badge.label}</span></p>
          </div>
          <button className="btn bo" onClick={()=>nav('/manager')}>← Back</button>
        </div>
      </div>

      {isApproved&&(
        <div className="al as" style={{marginBottom:20}}><Lock size={15} style={{flexShrink:0}}/>Goals are locked. Add check-in comments below.</div>
      )}

      {!isApproved&&sheet.status==='pending_approval'&&(
        <div style={{display:'flex',gap:10,marginBottom:20,alignItems:'center',flexWrap:'wrap'}}>
          <span style={{fontSize:'.84rem',color:'var(--t2)'}}>
            Total: <span style={{fontFamily:'var(--mn)',color:totalW===100?'var(--gr)':'var(--rd)',fontWeight:700}}>{totalW}%</span>
          </span>
          <div style={{flex:1}}/>
          <button className="btn bo" onClick={()=>setShowReject(!showReject)}><XCircle size={15}/>Return for Rework</button>
          <button className="btn bs" onClick={approve} disabled={sub||totalW!==100}>
            <CheckCircle size={15}/>{sub?'Approving...':'Approve & Lock'}
          </button>
        </div>
      )}

      {showReject&&(
        <div className="card" style={{marginBottom:20,borderColor:'rgba(239,68,68,.3)'}}>
          <div className="ct">Reason for Return</div>
          <textarea className="fta" rows={3} value={rejectMsg} onChange={e=>setRejectMsg(e.target.value)} placeholder="What needs to be changed?"/>
          <div style={{display:'flex',gap:10,marginTop:10}}>
            <button className="btn bd2" onClick={reject} disabled={sub}>Send Back</button>
            <button className="btn bo" onClick={()=>setShowReject(false)}>Cancel</button>
          </div>
        </div>
      )}

      {editGoals.map(goal=>{
        const latest=goal.check_ins?.[goal.check_ins.length-1];
        const score=latest?computeScore(goal,latest.actual):0;
        return(
          <div key={goal.id} className="card" style={{marginBottom:12}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
              <div>
                <div className="gt">{goal.thrust_area}</div>
                <div className="gti">{goal.title}</div>
                {goal.description&&<div style={{fontSize:'.79rem',color:'var(--t2)',marginTop:4}}>{goal.description}</div>}
              </div>
              <span className="wb">{goal.weightage}%</span>
            </div>
            <div style={{display:'flex',gap:16,fontSize:'.79rem',color:'var(--t2)',marginBottom:10}}>
              <span>UoM: <strong style={{color:'var(--tx)'}}>{goal.uom}</strong></span>
              <span>Target: <strong style={{color:'var(--tx)'}}>{goal.target}</strong></span>
              <span>Direction: <strong style={{color:'var(--tx)'}}>{goal.uom_direction}</strong></span>
            </div>

            {!isApproved&&sheet.status==='pending_approval'&&(
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',background:'var(--s2)',borderRadius:8}}>
                <span style={{fontSize:'.79rem',color:'var(--t2)'}}>Adjust weightage:</span>
                <input type="number" min="10" max="90" step="5" value={goal.weightage}
                  onChange={e=>setEditGoals(p=>p.map(g=>g.id===goal.id?{...g,weightage:Number(e.target.value)}:g))}
                  style={{width:70,padding:'4px 8px',background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:6,color:'var(--tx)',fontFamily:'var(--mn)'}}/>%
              </div>
            )}

            {isApproved&&goal.check_ins?.length>0&&(
              <div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}}>
                  {goal.check_ins.map(ci=>(
                    <div key={ci.quarter} style={{padding:'6px 12px',background:'var(--s2)',borderRadius:8,fontSize:'.79rem'}}>
                      <span style={{color:'var(--ac)',fontFamily:'var(--mn)'}}>{ci.quarter}</span>
                      <span style={{margin:'0 6px',color:'var(--t2)'}}>→</span>
                      <span style={{color:getScoreColor(computeScore(goal,ci.actual)),fontWeight:700}}>{ci.actual}</span>
                    </div>
                  ))}
                </div>
                <div className="pb"><div className="pf" style={{width:`${Math.min(score,100)}%`,background:getScoreColor(score)}}/></div>
                <div style={{fontSize:'.74rem',color:getScoreColor(score),fontFamily:'var(--mn)',marginTop:4}}>Score: {score}%</div>
              </div>
            )}
          </div>
        );
      })}

      {isApproved&&(
        <div className="card" style={{marginTop:8}}>
          <div className="ct">Add Check-in Comment</div>
          <div style={{display:'flex',gap:8,marginBottom:12}}>
            {['Q1','Q2','Q3','Q4'].map(q=>(
              <button key={q} className={`btn bsm ${commentQ===q?'bp':'bo'}`} onClick={()=>setCommentQ(q)}>{q}</button>
            ))}
          </div>
          <textarea className="fta" rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder={`${commentQ} notes for ${sheet.employee_name}...`}/>
          <button className="btn bp bsm" style={{marginTop:10}} onClick={addComment}><MessageSquare size={14}/>Save Comment</button>
          {sheet.manager_comments?.length>0&&(
            <div style={{marginTop:16,borderTop:'1px solid var(--bd)',paddingTop:16}}>
              {sheet.manager_comments.map(c=>(
                <div key={c.id} style={{padding:'10px 14px',background:'var(--s2)',borderRadius:8,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:'.73rem',color:'var(--ac)',fontFamily:'var(--mn)'}}>{c.quarter}</span>
                    <span style={{fontSize:'.7rem',color:'var(--t2)'}}>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{fontSize:'.84rem'}}>{c.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
