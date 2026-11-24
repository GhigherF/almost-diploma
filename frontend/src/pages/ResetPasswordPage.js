import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

const API = '/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ token: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setForm(prev => ({ ...prev, token: tokenFromUrl }));
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirm) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/reset-password`, {
        token: form.token.trim(),
        password: form.password,
      });
      setSuccess(data.message || 'Пароль изменён');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h2>Новый пароль</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
        Вставьте токен из письма и задайте новый пароль.
      </p>
      {error && <p className="auth-error">{error}</p>}
      {success && <p style={{ color: 'var(--success, #22c55e)', fontSize: 14, marginBottom: 12 }}>{success}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="text"
          placeholder="Токен из письма"
          required
          value={form.token}
          onChange={e => setForm({ ...form, token: e.target.value })}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Новый пароль"
          required
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          className="auth-input"
        />
        <input
          type="password"
          placeholder="Подтвердите пароль"
          required
          value={form.confirm}
          onChange={e => setForm({ ...form, confirm: e.target.value })}
          className="auth-input"
        />
        <button type="submit" disabled={loading || !!success} className="auth-btn">
          {loading ? 'Сохранение...' : 'Сменить пароль'}
        </button>
      </form>
      <p className="auth-link">
        <Link to="/login">← Вернуться ко входу</Link>
        {' · '}
        <Link to="/forgot-password">Запросить токен снова</Link>
      </p>
    </div>
  );
}
