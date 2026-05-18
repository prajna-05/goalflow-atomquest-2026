import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';

const ac=(a)=>a.includes('approved')?'var(--gr)':a.includes('rework')||a.includes('rejected')?'var(--rd)':a.includes('submitted')?'var(--am)':a.includes('unlocked')?'var(--ac2)':'var(--t2)';

export default function AuditLog() {
  const [logs,setLogs]   = useState([]);
  const [filter,setFilter] = useState('');
  const [load,setLoad]   = useState(true);

  useEffect(()=>{ api.get('/admin/audit').then(r=>setLogs(r.data)).catch(()=>{}).finally(()=>setLoad(false)); },[]);

  const filtered = filter ? logs.filter(l=>l.action.includes(filter)||l.performed_by_name?.toLowerCase().includes(filter.toLowerCase())) : logs;

  if(load) return <Layout><div className="loading-screen"><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className="ph"><h2>Audit Log</h2><p>Complete history of all changes — every action recorded in SQLite</p></div>
      <div style={{marginBottom:20}}>
        <input className="fi" style={{maxWidth:320}} placeholder="Filter by action or user..." value={filter} onChange={e=>setFilter(e.target.value)}/>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Timestamp</th><th>Action</th><th>By</th><th>Entity</th><th>Details</th></tr></thead>
            <tbody>
              {filtered.length===0
                ?<tr><td colSpan={5} style={{textAlign:'center',color:'var(--t2)',padding:40}}>No logs found</td></tr>
                :filtered.map(log=>(
                  <tr key={log.id}>
                    <td style={{fontFamily:'var(--mn)',fontSize:'.7rem',color:'var(--t2)',whiteSpace:'nowrap'}}>{new Date(log.performed_at).toLocaleString()}</td>
                    <td><span className="badge" style={{background:`${ac(log.action)}22`,color:ac(log.action),fontFamily:'var(--mn)',fontSize:'.68rem'}}>{log.action.replace(/_/g,' ')}</span></td>
                    <td style={{fontWeight:500}}>{log.performed_by_name}</td>
                    <td style={{fontFamily:'var(--mn)',fontSize:'.7rem',color:'var(--t2)'}}>{log.entity_type}</td>
                    <td style={{fontSize:'.81rem',color:'var(--t2)'}}>{log.details}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
