import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { request, setStoredAuth } from '../lib/api';

const initial = { name: '', email: '', password: '' };

function useMode(explicitMode) {
  const location = useLocation();
  return explicitMode || (location.pathname.includes('signup') ? 'signup' : 'login');
}

export default function App({ mode: propMode }) {
  const mode = useMode(propMode);
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const copy = useMemo(
    () => mode === 'signup'
      ? { title: 'Create your account', endpoint: '/api/auth/register', cta: 'Register', footer: 'Already have an account?', link: '/login' }
      : { title: 'Welcome back', endpoint: '/api/auth/login', cta: 'Login', footer: 'Need an account?', link: '/signup' },
    [mode]
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const payload = mode === 'signup' ? form : { email: form.email, password: form.password };
      const data = await request(copy.endpoint, { method: 'POST', body: JSON.stringify(payload) });
      setStoredAuth(data);
      navigate('/');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" style={{ maxWidth: 520, padding: 24 }}>
      <h2 style={{ marginTop: 0 }}>{copy.title}</h2>
      <p className="section-subtitle">This remote is independently deployable and exposed through Module Federation.</p>
      {message && <div className="message error">{message}</div>}
      <form className="form-grid" onSubmit={handleSubmit}>
        {mode === 'signup' && <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} required />}
        <input className="input" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))} required />
        <input className="input" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))} required />
        <button className="btn" disabled={loading}>{loading ? 'Submitting...' : copy.cta}</button>
      </form>
      <p style={{ color: 'var(--muted)' }}>{copy.footer} <Link to={copy.link} style={{ color: '#93c5fd' }}>{mode === 'signup' ? 'Login' : 'Register'}</Link></p>
    </section>
  );
}
