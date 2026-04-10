import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="page-section auth-wrapper">
      <form className="card auth-form" onSubmit={handleSubmit}>
        <h1>Login</h1>
        {error && <p className="error-text">{error}</p>}
        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        <button className="button" type="submit">
          Login
        </button>
        <p className="muted-text">
          New user? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </section>
  );
}

export default LoginPage;
