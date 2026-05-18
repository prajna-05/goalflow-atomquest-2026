import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const newGoal = () => ({ id: Date.now().toString(), thrust_area:'', title:'', description:'', uom:'numeric', uom_direction:'min', target:'', weightage:10, is_shared:false });
const UOM = [
  { value:'numeric',  label:'Numeric',        dirs:[{v:'min',l:'Higher is better'},{v:'max',l:'Lower is better'}] },
  { value:'percent',  label:'Percentage (%)', dirs:[{v:'min',l:'Higher is better'},{v:'max',l:'Lower is better'}] },
  { value:'timeline', label:'Timeline (Date)',dirs:[{v:'timeline',l:'Complete by date'}] },
  { value:'zero',     label:'Zero-based',     dirs:[{v:'zero',l:'Zero = 100%, else 0%'}] },
];

export default function GoalForm() {
  const nav = useNavigate();
  const [goals,setGoals]         = useState([newGoal()]);
  const [thrustAreas,setTA]      = useState([]);
  const [errors,setErrors]       = useState([]);
  const [saving,setSaving]       = useState(false);

  useEffect(()=>{
    Promise.all([api.get('/goals/my'), api.get('/goals/thrust-areas')])
      .then(([s,t])=>{ setTA(t.data); if(s.data?.goals?.length) setGoals(s.data.goals); })
      .catch(()=>{});
  },[]);

  const totalW = goals.reduce((s,g)=>s+Number(g.weightage||0),0);
  const upd = (id,k,v) => setGoals(p=>p.map(g=>g.id===id?{...g,[k]:v}:g));

  const save = async () => {
    setSaving(true); setErrors([]);
    try {
      await api.post('/goals/', { goals });
      toast.success('Goals saved!');
      nav('/employee');
    } catch(err) {
      const d=err.response?.data?.detail;
      setErrors(typeof d==='object'?d.errors||[JSON.stringify(d)]:[d||'Save failed']);
    } finally { setSaving(false); }
  };

  return (
    <Layout>
      <div className="ph">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div><h2>Goal Sheet · FY 2026</h2><p>Max 8 goals · Total weightage must equal exactly 100%</p></div>
          <div style={{display:'flex',gap:10}}>
            <button className="btn bo" onClick={()=>nav('/employee')}>Cancel</button>
            <button className="btn bp" onClick={save} disabled={saving}>{saving?'Saving...':'Save Goals'}</button>
          </div>
        </div>
      </div>

      {/* Weightage tracker */}
      <div className="card" style={{marginBottom:20,padding:'14px 20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
          <span style={{fontSize:'.85rem',color:'var(--t2)'}}>Total Weightage</span>
          <span style={{fontFamily:'var(--mn)',fontWeight:700,color:totalW===100?'var(--gr)':totalW>100?'var(--rd)':'var(--am)'}}>
            {totalW}% {totalW===100?'✓ Perfect':totalW>100?`over by ${totalW-100}%`:`${100-totalW}% remaining`}
          </span>
        </div>
        <div className="pb" style={{height:8}}>
          <div className="pf" style={{width:`${Math.min(totalW,100)}%`,background:totalW===100?'var(--gr)':totalW>100?'var(--rd)':'var(--ac)'}}/>
        </div>
        <div style={{fontSize:'.72rem',color:'var(--t3)',marginTop:6}}>
          {goals.length}/8 goals · Min 10% per goal · Must total exactly 100%
        </div>
      </div>

      {errors.length>0&&(
        <div className="al ae"><AlertCircle size={15}/><div>{errors.map((e,i)=><div key={i}>{e}</div>)}</div></div>
      )}

      {goals.map((goal,idx)=>(
        <div key={goal.id} className="card" style={{marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
            <span style={{fontFamily:'var(--mn)',fontSize:'.78rem',color:'var(--ac)'}}>
              GOAL {String(idx+1).padStart(2,'0')}{goal.is_shared?' · SHARED':''}
            </span>
            <button className="btn bg2 bsm" onClick={()=>setGoals(p=>p.filter(g=>g.id!==goal.id))} disabled={goal.is_shared||goals.length===1}>
              <Trash2 size={14}/>
            </button>
          </div>

          <div className="g2">
            <div className="fg">
              <label className="fl">Thrust Area *</label>
              <select className="fse" value={goal.thrust_area} onChange={e=>upd(goal.id,'thrust_area',e.target.value)} disabled={goal.is_shared}>
                <option value="">Select thrust area</option>
                {thrustAreas.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Goal Title *</label>
              <input className="fi" value={goal.title} onChange={e=>upd(goal.id,'title',e.target.value)} placeholder="e.g. Achieve Sales Target" disabled={goal.is_shared}/>
            </div>
          </div>

          <div className="fg">
            <label className="fl">Description</label>
            <textarea className="fta" rows={2} value={goal.description} onChange={e=>upd(goal.id,'description',e.target.value)} placeholder="Describe this goal..."/>
          </div>

          <div className="g3">
            <div className="fg">
              <label className="fl">Unit of Measurement</label>
              <select className="fse" value={goal.uom} onChange={e=>{
                const opt=UOM.find(o=>o.value===e.target.value);
                upd(goal.id,'uom',e.target.value);
                upd(goal.id,'uom_direction',opt.dirs[0].v);
              }} disabled={goal.is_shared}>
                {UOM.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Direction</label>
              <select className="fse" value={goal.uom_direction} onChange={e=>upd(goal.id,'uom_direction',e.target.value)} disabled={goal.is_shared}>
                {UOM.find(o=>o.value===goal.uom)?.dirs.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
              </select>
            </div>
            <div className="fg">
              <label className="fl">Target *</label>
              <input className="fi" type={goal.uom==='timeline'?'date':'number'} value={goal.target} onChange={e=>upd(goal.id,'target',e.target.value)} placeholder="Enter target" disabled={goal.is_shared}/>
            </div>
          </div>

          <div className="fg" style={{marginBottom:0}}>
            <label className="fl">Weightage: <span style={{color:'var(--ac)',fontFamily:'var(--mn)'}}>{goal.weightage}%</span></label>
            <input type="range" min="10" max="90" step="5" value={goal.weightage}
              onChange={e=>upd(goal.id,'weightage',Number(e.target.value))}
              style={{width:'100%',accentColor:'var(--ac)'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:'.7rem',color:'var(--t3)'}}>
              <span>10% min</span><span>90% max</span>
            </div>
          </div>
        </div>
      ))}

      {goals.length<8&&(
        <button className="btn bo" onClick={()=>setGoals(p=>[...p,newGoal()])}
          style={{width:'100%',justifyContent:'center',borderStyle:'dashed',marginBottom:20}}>
          <Plus size={16}/>Add Goal ({8-goals.length} remaining)
        </button>
      )}
    </Layout>
  );
}
