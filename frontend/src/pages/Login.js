import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEMOS = [
  { role:'employee', email:'employee@atomberg.com' },
  { role:'manager',  email:'manager@atomberg.com'  },
  { role:'admin',    email:'admin@atomberg.com'    },
];

export default function Login() {
  const [email,setEmail] = useState('');
  const [pw,setPw]       = useState('');
  const [load,setLoad]   = useState(false);
  const { login }        = useAuth();
  const nav              = useNavigate();

  const go = async (e) => {
    e.preventDefault(); setLoad(true);
    try {
      const u = await login(email, pw);
      toast.success(`Welcome, ${u.name.split(' ')[0]}!`);
      nav(u.role==='employee'?'/employee':u.role==='manager'?'/manager':'/admin');
    } catch(err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoad(false); }
  };

  return (
    <div className="ls">
      <div className="lbg"/>
      <div className="lc">
        <div className="ll">GoalFlow</div>
        <p className="ls2">Atomberg Performance Management · SQLite + ML Edition</p>
        <form onSubmit={go}>
          <div className="fg">
            <label className="fl">Email</label>
            <input className="fi" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@atomberg.com" required/>
          </div>
          <div className="fg">
            <label className="fl">Password</label>
            <input className="fi" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" required/>
          </div>
          <button type="submit" className="btn bp" style={{width:'100%',justifyContent:'center'}} disabled={load}>
            {load ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>
        <div className="dc">
          <p>// DEMO — click to fill</p>
          {DEMOS.map(d=>(
            <div key={d.role} className="dr" onClick={()=>{setEmail(d.email);setPw('password123');}}>
              <strong>{d.role}</strong><span style={{color:'var(--t2)'}}>{d.email}</span>
            </div>
          ))}
          <div style={{fontSize:'.7rem',color:'var(--t3)',marginTop:6}}>password: password123</div>
        </div>
      </div>
    </div>
  );
}
