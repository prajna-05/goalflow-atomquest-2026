import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS=['#6c63ff','#ff6584','#10b981','#f59e0b','#3b82f6','#8b5cf6','#ec4899'];
const TT=({active,payload,label})=>!active||!payload?.length?null:(
  <div style={{background:'var(--s1)',border:'1px solid var(--bd)',borderRadius:8,padding:'10px 14px',fontSize:'.81rem'}}>
    <p style={{color:'var(--t2)',marginBottom:4}}>{label}</p>
    {payload.map((p,i)=><p key={i} style={{color:p.color,fontFamily:'var(--mn)'}}>{p.name}: {p.value}</p>)}
  </div>
);

export default function Analytics() {
  const [data,setData]=useState(null);
  const [load,setLoad]=useState(true);
  useEffect(()=>{ api.get('/admin/analytics').then(r=>setData(r.data)).catch(()=>{}).finally(()=>setLoad(false)); },[]);
  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;
  const thrustData=Object.entries(data?.thrust_dist||{}).map(([name,value])=>({name,value}));
  const uomData=Object.entries(data?.uom_dist||{}).map(([name,value])=>({name,value}));
  return (
    <Layout>
      <div className="ph"><h2>Analytics Dashboard</h2><p>Performance insights · FY 2026</p></div>
      <div className="card" style={{marginBottom:20}}>
        <div className="ct">Quarter-on-Quarter Performance Trend</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data?.qoq||[]} margin={{top:5,right:20,bottom:5,left:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/>
            <XAxis dataKey="quarter" tick={{fill:'var(--t2)',fontSize:12}} axisLine={{stroke:'var(--bd)'}}/>
            <YAxis tick={{fill:'var(--t2)',fontSize:12}} axisLine={{stroke:'var(--bd)'}} domain={[0,100]}/>
            <Tooltip content={<TT/>}/>
            <Line type="monotone" dataKey="avg_score" name="Avg Score" stroke="var(--ac)" strokeWidth={2.5} dot={{fill:'var(--ac)',r:5}}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="g2" style={{marginBottom:20}}>
        <div className="card">
          <div className="ct">Department Performance</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.dept_data||[]} margin={{top:5,right:10,bottom:5,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/>
              <XAxis dataKey="department" tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}}/>
              <YAxis tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}} domain={[0,100]}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="avg_score" name="Avg Score" fill="var(--ac)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ct">Thrust Area Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={thrustData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                label={({name,percent})=>`${name.split(' ')[0]} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {thrustData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Pie>
              <Tooltip/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="ct">Manager Approval Rate</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data?.mgr_stats||[]} margin={{top:5,right:10,bottom:5,left:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)"/>
              <XAxis dataKey="manager_name" tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}}/>
              <YAxis tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}} domain={[0,100]}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="approval_rate" name="Approval %" fill="var(--gr)" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="ct">UoM Type Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={uomData} layout="vertical" margin={{top:5,right:30,bottom:5,left:20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--bd)" horizontal={false}/>
              <XAxis type="number" tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}}/>
              <YAxis type="category" dataKey="name" tick={{fill:'var(--t2)',fontSize:11}} axisLine={{stroke:'var(--bd)'}}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="value" name="Count" fill="var(--ac2)" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Layout>
  );
}
