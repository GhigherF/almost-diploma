import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './auth.css';

const API = '/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { email });
      setSuccess(data.message || 'Письмо отправлено. Проверьте почту.');
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <h2>Забыли пароль?</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>
        Введите email — мы отправим письмо со ссылкой и токеном для сброса пароля.
      </p>
      {error && <p className="auth-error">{error}</p>}
      {success && <p style={{ color: 'var(--success, #22c55e)', fontSize: 14, marginBottom: 12 }}>{success}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="auth-input"
        />
        <button type="submit" disabled={loading} className="auth-btn">
          {loading ? 'Отправка...' : 'Отправить письмо'}
        </button>
      </form>
      <p className="auth-link">
        <Link to="/login">← Вернуться ко входу</Link>
      </p>
      {success && (
        <p className="auth-link" style={{ marginTop: 8 }}>
          <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>Ввести токен вручную →</Link>
        </p>
      )}
    </div>
  );
}
