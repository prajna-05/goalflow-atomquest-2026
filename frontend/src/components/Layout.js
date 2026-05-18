import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Target, BarChart2, Brain, FileText, LogOut } from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = {
    employee: [
      { to:'/employee',       label:'Dashboard', icon:<LayoutDashboard size={16}/> },
      { to:'/employee/goals', label:'My Goals',  icon:<Target size={16}/> },
    ],
    manager: [
      { to:'/manager',      label:'Team Sheets', icon:<LayoutDashboard size={16}/> },
      { to:'/analytics',    label:'Analytics',   icon:<BarChart2 size={16}/> },
      { to:'/ml-insights',  label:'ML Insights', icon:<Brain size={16}/> },
    ],
    admin: [
      { to:'/admin',        label:'Overview',    icon:<LayoutDashboard size={16}/> },
      { to:'/manager',      label:'Goal Sheets', icon:<Target size={16}/> },
      { to:'/analytics',    label:'Analytics',   icon:<BarChart2 size={16}/> },
      { to:'/ml-insights',  label:'ML Insights', icon:<Brain size={16}/> },
      { to:'/audit',        label:'Audit Log',   icon:<FileText size={16}/> },
    ],
  };
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sb-logo"><h1>GoalFlow</h1><span>Atomberg · 2026</span></div>
        <nav className="sb-nav">
          {(nav[user?.role]||[]).map(item => (
            <NavLink key={item.to} to={item.to} end className={({isActive})=>`nav-item${isActive?' active':''}`}>
              {item.icon}<span className="nl">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sb-user">
          <div className="u-card">
            <div className="avatar">{user?.avatar}</div>
            <div><div className="u-name">{user?.name?.split(' ')[0]}</div><div className="u-role">{user?.role}</div></div>
          </div>
          <button onClick={()=>{logout();navigate('/login');}} className="nav-item" style={{marginTop:8}}>
            <LogOut size={16}/><span className="nl">Logout</span>
          </button>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
