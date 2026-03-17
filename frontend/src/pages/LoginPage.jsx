import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(form);
      navigate('/');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '80px auto', padding: 24 }}>
      <h1>ログイン</h1>
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">メールアドレス</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>
        <div style={{ marginTop: 12 }}>
          <label htmlFor="password">パスワード</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />
        </div>
        <button type="submit" style={{ marginTop: 16 }}>ログイン</button>
      </form>
    </div>
  );
}

export default LoginPage;