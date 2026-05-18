import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { computeScore, getScoreColor } from '../utils/scoring';
import toast from 'react-hot-toast';
import { Save, TrendingUp } from 'lucide-react';

const QS = ['Q1','Q2','Q3','Q4'];
const QL = { Q1:'Jul–Sep 2026', Q2:'Oct–Dec 2026', Q3:'Jan–Mar 2027', Q4:'Apr–Jun 2027' };

export default function CheckIn() {
  const { id } = useParams();
  const nav = useNavigate();
  const [sheet,setSheet]   = useState(null);
  const [activeQ,setActiveQ] = useState('Q1');
  const [inputs,setInputs] = useState({});
  const [saving,setSaving] = useState(null);

  useEffect(()=>{
    api.get(`/goals/${id}`).then(r=>{
      setSheet(r.data);
      const init={};
      r.data.goals.forEach(g=>{
        init[g.id]={};
        QS.forEach(q=>{ const ci=g.check_ins?.find(c=>c.quarter===q); init[g.id][q]={actual:ci?.actual??'',status:ci?.status||'not_started'}; });
      });
      setInputs(init);
    }).catch(()=>nav('/employee'));
  },[id,nav]);

  const upd=(gid,q,k,v)=>setInputs(p=>({...p,[gid]:{...p[gid],[q]:{...p[gid]?.[q],[k]:v}}}));

  const save = async(goalId)=>{
    const ci=inputs[goalId]?.[activeQ];
    if(ci?.actual==='') return toast.error('Enter actual value first');
    setSaving(goalId);
    try {
      const r=await api.post(`/goals/${id}/checkin`,{goal_id:goalId,quarter:activeQ,actual:Number(ci.actual),status:ci.status});
      setSheet(r.data); toast.success(`${activeQ} saved!`);
    } catch { toast.error('Save failed'); } finally { setSaving(null); }
  };

  if(!sheet) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className="ph">
        <div style={{display:'flex',justifyContent:'space-between'}}>
          <div><h2>Quarterly Check-in</h2><p>Log actual achievements per goal</p></div>
          <button className="btn bo" onClick={()=>nav('/employee')}>← Back</button>
        </div>
      </div>

      <div className="tabs">
        {QS.map(q=>(
          <button key={q} className={`tab ${activeQ===q?'active':''}`} onClick={()=>setActiveQ(q)}>
            {q} <span style={{fontSize:'.68rem',color:'var(--t2)'}}>{QL[q]}</span>
          </button>
        ))}
      </div>

      {sheet.goals?.map(goal=>{
        const ci=inputs[goal.id]?.[activeQ]||{actual:'',status:'not_started'};
        const score=ci.actual!==''?computeScore(goal,Number(ci.actual)):0;
        const saved=goal.check_ins?.find(c=>c.quarter===activeQ);
        return(
          <div key={goal.id} className="card" style={{marginBottom:14}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div className="gt">{goal.thrust_area}</div>
                <div className="gti">{goal.title}</div>
                <div style={{fontSize:'.77rem',color:'var(--t2)',marginTop:4}}>
                  Target: <strong style={{color:'var(--tx)'}}>{goal.target}</strong> · Weight: <strong style={{color:'var(--tx)'}}>{goal.weightage}%</strong>
                </div>
              </div>
              {saved&&(
                <div style={{textAlign:'right',fontSize:'.77rem',color:'var(--t2)'}}>
                  Saved: <span style={{color:getScoreColor(computeScore(goal,saved.actual)),fontFamily:'var(--mn)',fontWeight:700}}>{computeScore(goal,saved.actual)}%</span>
                </div>
              )}
            </div>

            <div className="g2">
              <div className="fg" style={{marginBottom:0}}>
                <label className="fl">Actual ({activeQ})</label>
                <input className="fi" type={goal.uom==='timeline'?'date':'number'}
                  value={ci.actual} onChange={e=>upd(goal.id,activeQ,'actual',e.target.value)}
                  placeholder={`Target: ${goal.target}`}/>
              </div>
              <div className="fg" style={{marginBottom:0}}>
                <label className="fl">Status</label>
                <select className="fse" value={ci.status} onChange={e=>upd(goal.id,activeQ,'status',e.target.value)}>
                  <option value="not_started">Not Started</option>
                  <option value="on_track">On Track</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {ci.actual!==''&&(
              <div style={{marginTop:10,padding:'8px 12px',background:'var(--s2)',borderRadius:8,display:'flex',alignItems:'center',gap:10}}>
                <TrendingUp size={15} style={{color:getScoreColor(score)}}/>
                <span style={{fontSize:'.82rem',color:'var(--t2)'}}>Preview:</span>
                <span style={{fontFamily:'var(--mn)',fontWeight:700,color:getScoreColor(score)}}>{score}%</span>
                <div className="pb" style={{flex:1}}><div className="pf" style={{width:`${Math.min(score,100)}%`,background:getScoreColor(score)}}/></div>
              </div>
            )}

            <button className="btn bp bsm" style={{marginTop:10}} onClick={()=>save(goal.id)} disabled={saving===goal.id}>
              <Save size={14}/>{saving===goal.id?'Saving...':`Save ${activeQ}`}
            </button>
          </div>
        );
      })}
    </Layout>
  );
}
