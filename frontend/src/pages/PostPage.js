import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostsPage from './PostsPage';

const API = '/api';

// Переиспользуем компоненты из PostsPage через отдельный экспорт
// Здесь рендерим один пост через PostCard логику напрямую
export default function PostPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    axios.get(`${API}/posts/${id}`)
      .then(r => setPost(r.data))
      .catch(err => {
        console.error('Failed to load post:', err);
        setError('Пост не найден');
      });
  }, [id]);

  const handleBack = () => {
    console.log('[POST] Возврат назад, location.state:', location.state);
    
    // Проверяем, есть ли информация о возврате в state
    if (location.state?.returnTo) {
      console.log('[POST] Возврат на:', location.state.returnTo);
      if (location.state.returnTab) {
        console.log('[POST] Сохранение вкладки:', location.state.returnTab);
        // Сохраняем вкладку для возврата
        localStorage.setItem('activeTab', location.state.returnTab);
      }
      navigate(location.state.returnTo);
    } else {
      console.log('[POST] Нет state, используем navigate(-1)');
      // Проверяем, откуда пришли
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;
      
      // Если есть history state или referrer с того же сайта
      if (window.history.length > 1 && referrer.startsWith(currentOrigin)) {
        navigate(-1);
      } else {
        // По умолчанию на главную
        navigate('/');
      }
    }
  };

  if (error) return (
    <div style={{ padding: 20 }}>
      <button 
        onClick={handleBack}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'var(--text-muted)', 
          fontSize: 14, 
          cursor: 'pointer',
          marginBottom: 16
        }}
      >
        ← Назад
      </button>
      <p style={{ color: 'red' }}>{error}</p>
    </div>
  );
  
  if (!post) return <div style={{ padding: 20 }}>Загрузка...</div>;

  // Рендерим через PostsPage с одним постом
  return <PostsPage singlePost={post} />;
}
