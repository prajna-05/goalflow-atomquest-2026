import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem('gf_token');
    const u = localStorage.getItem('gf_user');
    if (t && u) setUser(JSON.parse(u));
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('gf_token', data.token);
    localStorage.setItem('gf_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };
  const logout = () => { localStorage.clear(); setUser(null); };
  return <Ctx.Provider value={{ user, login, logout, loading }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
