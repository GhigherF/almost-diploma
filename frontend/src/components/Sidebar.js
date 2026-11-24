import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../App';
import Icon from './Icon';

function Sidebar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.history.pushState({}, '', `/?search=${encodeURIComponent(searchQuery)}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
      setShowSearch(false);
    }
  };
  
  return (
    <div style={{
      position: 'fixed',
      left: 0,
      top: 60,
      width: '240px',
      height: 'calc(100vh - 60px)',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 90,
      boxShadow: 'var(--shadow-light)',
    }}>
      {/* Кнопка поиска - всегда видна, клик открывает/закрывает поле поиска */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <button
          onClick={() => setShowSearch(!showSearch)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            background: showSearch ? 'var(--bg-hover)' : 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-muted)',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          <Icon name="search" size={16} />
          <span>Поиск постов</span>
        </button>
      </div>

      {/* Поле поиска - появляется при клике */}
      {showSearch && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Введите текст..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--accent)',
                  borderRadius: 'var(--radius-lg)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={e => e.target.style.opacity = '0.9'}
                onMouseLeave={e => e.target.style.opacity = '1'}
              >
                Найти
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.target.style.borderColor = 'var(--danger)';
                  e.target.style.color = 'var(--danger)';
                }}
                onMouseLeave={e => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.color = 'var(--text-muted)';
                }}
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Меню */}
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              textDecoration: 'none',
              color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: location.pathname === '/' ? '700' : '600',
              background: location.pathname === '/' ? 'var(--bg-hover)' : 'transparent',
              borderLeft: location.pathname === '/' ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'all 0.2s',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/') {
                e.target.style.color = 'var(--accent)';
                e.target.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/') {
                e.target.style.color = 'var(--text-muted)';
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>📰</span>
            <span>Лента</span>
          </Link>
          
          <Link 
            to="/users" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 20px',
              textDecoration: 'none',
              color: location.pathname === '/users' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '15px',
              fontWeight: location.pathname === '/users' ? '700' : '600',
              background: location.pathname === '/users' ? 'var(--bg-hover)' : 'transparent',
              borderLeft: location.pathname === '/users' ? '4px solid var(--accent)' : '4px solid transparent',
              transition: 'all 0.2s',
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
            }}
            onMouseEnter={e => {
              if (location.pathname !== '/users') {
                e.target.style.color = 'var(--accent)';
                e.target.style.background = 'var(--bg-hover)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== '/users') {
                e.target.style.color = 'var(--text-muted)';
                e.target.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: '18px' }}>👥</span>
            <span>Люди</span>
          </Link>
          
          {user && (
            <>
              <div style={{ padding: '16px 20px 8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Мой профиль
              </div>
              
              <Link 
                to={`/profile/${user.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.pathname.startsWith('/profile/') && !location.search ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.pathname.startsWith('/profile/') && !location.search ? '700' : '600',
                  background: location.pathname.startsWith('/profile/') && !location.search ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.pathname.startsWith('/profile/') && !location.search ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!(location.pathname.startsWith('/profile/') && !location.search)) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!(location.pathname.startsWith('/profile/') && !location.search)) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon name="user" size={16} />
                <span>Обзор</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=posts`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=posts') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=posts') ? '700' : '600',
                  background: location.search.includes('tab=posts') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=posts') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=posts')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=posts')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon name="post" size={16} />
                <span>Мои посты</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=followers`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=followers') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=followers') ? '700' : '600',
                  background: location.search.includes('tab=followers') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=followers') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=followers')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=followers')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon name="heart" size={16} />
                <span>Подписчики</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=following`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=following') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=following') ? '700' : '600',
                  background: location.search.includes('tab=following') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=following') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=following')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=following')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon name="eye" size={16} />
                <span>Подписки</span>
              </Link>
              
              <Link 
                to={`/profile/${user.id}?tab=edit`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px 12px 32px',
                  textDecoration: 'none',
                  color: location.search.includes('tab=edit') ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '14px',
                  fontWeight: location.search.includes('tab=edit') ? '700' : '600',
                  background: location.search.includes('tab=edit') ? 'var(--bg-hover)' : 'transparent',
                  borderLeft: location.search.includes('tab=edit') ? '4px solid var(--accent)' : '4px solid transparent',
                  transition: 'all 0.2s',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0'
                }}
                onMouseEnter={e => {
                  if (!location.search.includes('tab=edit')) {
                    e.target.style.color = 'var(--accent)';
                    e.target.style.background = 'var(--bg-hover)';
                  }
                }}
                onMouseLeave={e => {
                  if (!location.search.includes('tab=edit')) {
                    e.target.style.color = 'var(--text-muted)';
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <Icon name="settings" size={16} />
                <span>Настройки</span>
              </Link>
            </>
          )}
        </nav>
      </div>
      
      {/* Тема */}
      <div style={{ padding: '20px', borderTop: '1px solid var(--border)' }}>
        <button 
          onClick={toggleTheme} 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 16px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '15px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--accent)'}
          onMouseLeave={e => e.target.style.borderColor = 'var(--border)'}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          <span>{theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;