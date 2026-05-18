import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { Brain, CheckCircle, TrendingDown } from 'lucide-react';

const RC={ low:'var(--gr)', medium:'var(--am)', high:'var(--rd)' };

export default function MLInsights() {
  const [risks,setRisks]     = useState([]);
  const [anomalies,setAnom]  = useState([]);
  const [tab,setTab]         = useState('risk');
  const [load,setLoad]       = useState(true);

  useEffect(()=>{
    Promise.all([api.get('/admin/ml/risk'),api.get('/admin/ml/anomalies')])
      .then(([r,a])=>{ setRisks(r.data); setAnom(a.data); })
      .catch(()=>{}).finally(()=>setLoad(false));
  },[]);

  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className="ph">
        <h2>🤖 ML Insights</h2>
        <p>RandomForest risk prediction · IsolationForest anomaly detection · scikit-learn</p>
      </div>

      <div className="sg" style={{marginBottom:24}}>
        {[
          {v:risks.filter(r=>r.employee_risk==='high').length,  l:'High Risk Employees', c:'var(--rd)'},
          {v:risks.filter(r=>r.employee_risk==='medium').length, l:'Medium Risk',         c:'var(--am)'},
          {v:risks.filter(r=>r.employee_risk==='low').length,   l:'On Track',             c:'var(--gr)'},
          {v:anomalies.length,                                   l:'Anomalies Detected',   c:'var(--ac)'},
        ].map((s,i)=>(
          <div key={i} className="sc"><div className="ab" style={{background:s.c}}/><div className="val" style={{color:s.c}}>{s.v}</div><div className="lbl">{s.l}</div></div>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab ${tab==='risk'?'active':''}`} onClick={()=>setTab('risk')}>🎯 Risk Prediction</button>
        <button className={`tab ${tab==='anomalies'?'active':''}`} onClick={()=>setTab('anomalies')}>🔍 Anomaly Detection</button>
      </div>

      {tab==='risk'&&(
        <div>
          <div className="al ai" style={{marginBottom:16}}>
            <Brain size={15} style={{flexShrink:0}}/>
            RandomForestClassifier · Features: weightage, UoM type, quarter, current score, days since last update
          </div>
          {risks.length===0
            ?<div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--t2)'}}>
               <CheckCircle size={48} style={{opacity:.3,margin:'0 auto 16px',color:'var(--gr)'}}/><h3 style={{color:'var(--tx)',marginBottom:8}}>No approved goal sheets yet</h3><p>Risk analysis runs on approved goals with check-in data</p>
             </div>
            :risks.map(emp=>(
              <div key={emp.employee_id} className="card" style={{marginBottom:14,borderColor:emp.employee_risk==='high'?'rgba(239,68,68,.3)':'var(--bd)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div className="avatar">{emp.employee_name?.split(' ').map(n=>n[0]).join('').slice(0,2)}</div>
                    <div>
                      <div style={{fontWeight:600}}>{emp.employee_name}</div>
                      <div style={{fontSize:'.77rem',color:'var(--t2)'}}>{emp.department} · Overall: {emp.overall_score}%</div>
                    </div>
                  </div>
                  <span style={{fontFamily:'var(--mn)',fontSize:'.8rem',fontWeight:700,padding:'4px 12px',borderRadius:20,background:`${RC[emp.employee_risk]}22`,color:RC[emp.employee_risk]}}>
                    {emp.employee_risk==='high'?'⚠ HIGH RISK':emp.employee_risk==='medium'?'~ MEDIUM':'✓ LOW RISK'}
                  </span>
                </div>
                {emp.goal_risks.map((gr,i)=>(
                  <div key={i} style={{padding:'10px 14px',background:'var(--s2)',borderRadius:8,marginBottom:8}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6}}>
                      <div>
                        <div style={{fontSize:'.7rem',fontFamily:'var(--mn)',color:'var(--ac)'}}>{gr.thrust_area}</div>
                        <div style={{fontWeight:500,fontSize:'.87rem'}}>{gr.goal_title}</div>
                      </div>
                      <div style={{textAlign:'right',flexShrink:0}}>
                        <div style={{fontFamily:'var(--mn)',fontSize:'.84rem',fontWeight:700,color:RC[gr.risk_label]}}>{gr.risk_score}%</div>
                        <div style={{fontSize:'.68rem',color:RC[gr.risk_label]}}>risk score</div>
                      </div>
                    </div>
                    <div style={{width:'100%',height:4,background:'var(--bd)',borderRadius:2,marginBottom:8}}>
                      <div style={{width:`${Math.min(gr.risk_score,100)}%`,height:'100%',background:RC[gr.risk_label],borderRadius:2}}/>
                    </div>
                    {gr.drivers.length>0&&(
                      <div style={{fontSize:'.73rem',color:'var(--t2)'}}>
                        <strong style={{color:'var(--tx)'}}>Drivers: </strong>{gr.drivers.join(' · ')}
                      </div>
                    )}
                    <div style={{fontSize:'.77rem',color:'var(--t2)',marginTop:4,fontStyle:'italic'}}>💡 {gr.recommendation}</div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      )}

      {tab==='anomalies'&&(
        <div>
          <div className="al ai" style={{marginBottom:16}}>
            <Brain size={15} style={{flexShrink:0}}/>
            IsolationForest · Detects employees whose Q1–Q4 score trajectories are outliers vs peer group
          </div>
          {anomalies.length===0
            ?<div className="card" style={{textAlign:'center',padding:'60px 20px',color:'var(--t2)'}}>
               <CheckCircle size={48} style={{opacity:.3,margin:'0 auto 16px',color:'var(--gr)'}}/><h3 style={{color:'var(--tx)',marginBottom:8}}>No Anomalies Detected</h3><p>All performance patterns are within normal range</p>
             </div>
            :anomalies.map((a,i)=>(
              <div key={i} className="card" style={{marginBottom:12,borderColor:'rgba(108,99,255,.3)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div style={{display:'flex',gap:12}}>
                    <TrendingDown size={20} style={{color:'var(--ac)',flexShrink:0,marginTop:2}}/>
                    <div>
                      <div style={{fontWeight:600,marginBottom:4}}>{a.employee_name}</div>
                      <div style={{fontSize:'.81rem',color:'var(--t2)',marginBottom:8}}>{a.reason}</div>
                      <div style={{display:'flex',gap:8}}>
                        {Object.entries(a.scores).map(([q,sc])=>(
                          <div key={q} style={{padding:'4px 10px',background:'var(--s2)',borderRadius:6,fontSize:'.73rem',textAlign:'center'}}>
                            <div style={{fontFamily:'var(--mn)',color:'var(--ac)'}}>{q}</div>
                            <div style={{fontWeight:700,color:sc>0?'var(--tx)':'var(--t3)'}}>{sc}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span style={{fontFamily:'var(--mn)',fontSize:'.84rem',color:'var(--ac)',fontWeight:700}}>avg {a.avg_score}%</span>
                </div>
              </div>
            ))}
        </div>
      )}
    </Layout>
  );
}
