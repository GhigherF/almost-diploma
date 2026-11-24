import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import './auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setFailedAttempts(n => n + 1);
      setError(err.response?.data?.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  const showForgotPromo = failedAttempts >= 1;

  return (
    <div className="auth-wrap">
      <h2>Вход</h2>

      {showForgotPromo && (
        <div className="auth-forgot-banner" role="alert">
          <Icon name="lock" size={18} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 8 }} />
          Неверный пароль?{' '}
          <Link to="/forgot-password">Восстановить пароль по email</Link>
          {' '}— на почту придёт ссылка и токен.
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email" placeholder="Email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="auth-input"
        />
        <input
          type="password" placeholder="Пароль" required
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
      <p className="auth-link" style={{ marginTop: 8 }}>
        <Link to="/forgot-password">Забыли пароль?</Link>
      </p>
      <p className="auth-link">
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}
