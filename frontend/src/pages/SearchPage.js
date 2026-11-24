import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../App';
import { PostCard } from './PostsPage';
import Icon from '../components/Icon';
import './PostsPage.css';

const API = '/api';

export default function SearchPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      setSearchInput(q);
      performSearch(q);
    } else {
      setLoading(false);
    }
  }, [location.search, navigate]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      // Загружаем посты и пользователей параллельно
      const [postsRes, usersRes] = await Promise.all([
        axios.get(`${API}/posts?includeViewed=true`),
        axios.get(`${API}/users`)
      ]);
      
      const allPosts = [...(postsRes.data.followed || []), ...(postsRes.data.others || [])];
      const allUsers = usersRes.data || [];
      
      const lowerQuery = query.toLowerCase();
      
      // Ищем посты
      const filtered = allPosts.filter(post => {
        return (
          post.username?.toLowerCase().includes(lowerQuery) ||
          post.body?.toLowerCase().includes(lowerQuery) ||
          post.files?.some(file => 
            file.original_name?.toLowerCase().includes(lowerQuery)
          )
        );
      });
      
      // Ищем пользователей
      const foundUsers = allUsers.filter(user => 
        user.nick?.toLowerCase().includes(lowerQuery)
      );
      
      setPosts(filtered);
      setAuthors(foundUsers);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalResults = posts.length;

  const handleSearch = () => {
    if (searchInput.trim()) {
      setSearchQuery(searchInput);
      navigate(`/search?q=${encodeURIComponent(searchInput)}`);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      handleSearch();
    }
  };

  const handleDelete = async (id) => {
    await axios.delete(`${API}/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
    toast('Пост удалён');
  };

  const handleLike = (id, likes_count) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes_count } : p));
  };

  return (
    <div className="posts-wrap" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Button */}
      <div style={{ padding: '16px 20px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            fontSize: 16, 
            cursor: 'pointer',
            transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.target.style.color = 'var(--accent)'}
          onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
        >
          ← На главную
        </button>
      </div>

      {/* Search Input with Button */}
      <div style={{ padding: '20px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Поиск постов и авторов..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              color: 'var(--text)',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
            autoFocus
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '14px 32px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius)',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.target.style.opacity = '0.8'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            <Icon name="search" size={16} /> Искать
          </button>
        </div>
      </div>

      {/* Search Results Header */}
      {searchQuery && (
        <div style={{ padding: '20px', background: 'var(--bg-hover)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 12 }}>
            Результаты поиска: "<strong>{searchQuery}</strong>"
          </div>
          <div style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            Найдено: <strong style={{ color: 'var(--accent)' }}>{authors.length}</strong> авторов и <strong style={{ color: 'var(--accent)' }}>{totalResults}</strong> постов
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
          ⏳ Загрузка...
        </div>
      ) : !searchQuery ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
          Введите текст для поиска
        </div>
      ) : (
        <>
          {/* Authors Section */}
          {authors.length > 0 && (
            <>
              <div className="feed-divider" style={{ fontSize: 17, padding: '20px 20px 12px' }}>👥 Авторы ({authors.length})</div>
              {authors.map(author => (
                <Link 
                  key={author.id} 
                  to={`/profile/${author.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {author.avatar_url
                    ? <img src={author.avatar_url} alt="" style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'cover' }} />
                    : <div style={{ width: 50, height: 50, borderRadius: 8, background: 'var(--accent)', color: '#fff', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {author.nick?.[0]?.toUpperCase()}
                      </div>}
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{author.nick}</span>
                </Link>
              ))}
            </>
          )}

          {/* Posts Section */}
          {totalResults > 0 && (
            <>
              <div className="feed-divider" style={{ fontSize: 17, padding: '20px 20px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="post" size={18} /> Посты ({totalResults})
              </div>
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  user={user} 
                  searchQuery={searchQuery}
                  onDelete={handleDelete}
                  onLike={handleLike}
                />
              ))}
            </>
          )}

          {/* No Results */}
          {authors.length === 0 && totalResults === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 16 }}>
              По запросу "<strong>{searchQuery}</strong>" ничего не найдено
            </div>
          )}
        </>
      )}
    </div>
  );
}
