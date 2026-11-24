import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import PostsPage from './pages/PostsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UsersPage from './pages/UsersPage';
import PostPage from './pages/PostPage';
import SearchPage from './pages/SearchPage';
import NotificationPanel from './components/NotificationPanel';
import Icon from './components/Icon';


// ─── Theme ────────────────────────────────────────────────────────────────────
export const ThemeContext = createContext(null);

export function useTheme() { return useContext(ThemeContext); }

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
export const ToastContext = createContext(null);

export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg) => {
    console.log('[TOAST] Showing:', msg);
    const id = Date.now();
    setToasts(prev => {
      console.log('[TOAST] Current toasts:', prev.length);
      return [...prev, { id, msg }];
    });
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
      console.log('[TOAST] Removed:', id);
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.msg}</span>
            <button 
              className="toast-close"
              onClick={() => removeToast(t.id)}
              title="Закрыть"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const profileMenuRef = useRef(null);
  const hideMenuTimeoutRef = useRef(null);
  
  const hideProfileMenu = () => {
    hideMenuTimeoutRef.current = setTimeout(() => {
      setShowProfileMenu(false);
    }, 150);
  };
  
  const cancelHideMenu = () => {
    if (hideMenuTimeoutRef.current) {
      clearTimeout(hideMenuTimeoutRef.current);
    }
  };
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);
  
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  const handleProfileClick = () => {
    window.location.href = `/profile/${user.id}`;
  };
  
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      borderBottom: '2px solid var(--border)',
      padding: '0 20px', display: 'flex', alignItems: 'center',
      height: 60, gap: 24,
      boxShadow: 'var(--shadow-light)',
    }}>
      <Link to="/" className="nav-logo" style={{ fontWeight: 800, fontSize: 22, color: 'var(--accent)', textDecoration: 'none', letterSpacing: 1 }}>MB</Link>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 600, padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }}
        onMouseEnter={e => e.target.style.color = 'var(--accent)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Лента
      </Link>
      <Link to="/users" style={{ color: 'var(--text-muted)', fontSize: 15, textDecoration: 'none', fontWeight: 600, padding: '8px 12px', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s' }}
        onMouseEnter={e => e.target.style.color = 'var(--accent)'}
        onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}>
        Люди
      </Link>
      
      {/* Кнопка поиска в navbar */}
      <button 
        onClick={() => setShowSearchInput(!showSearchInput)}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: showSearchInput ? 'var(--accent)' : 'var(--text-muted)', 
          fontSize: 18, 
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          transition: 'color 0.2s'
        }}
        onMouseEnter={e => !showSearchInput && (e.target.style.color = 'var(--accent)')}
        onMouseLeave={e => !showSearchInput && (e.target.style.color = 'var(--text-muted)')}
        title="Поиск"
        className="ui-btn-icon ui-btn-icon--plain"
      >
        <Icon name="search" size={18} />
      </button>

      {/* Поле поиска в navbar */}
      <div style={{ 
        display: showSearchInput ? 'flex' : 'none',
        alignItems: 'center',
        gap: '8px',
        position: 'relative',
        marginRight: 'auto'
      }}>
        <input
          type="text"
          placeholder="Поиск постов..."
          className="navbar-search-input"
          autoFocus
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              window.location.href = `/search?q=${encodeURIComponent(e.target.value)}`;
              setShowSearchInput(false);
            }
          }}
          onBlur={() => setTimeout(() => setShowSearchInput(false), 200)}
          style={{
            width: '200px',
            padding: '8px 12px',
            background: 'var(--bg-input)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text)',
            fontSize: '14px',
            outline: 'none'
          }}
        />
      </div>
      <span style={{ flex: 1 }} />
      
      {user ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <NotificationPanel />
          {/* Выпадающее меню профиля */}
          <div 
            ref={profileMenuRef} 
            style={{ position: 'relative' }}
            onMouseEnter={() => {
              cancelHideMenu();
              setShowProfileMenu(true);
            }}
            onMouseLeave={() => hideProfileMenu()}
          >
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 12px', borderRadius: 'var(--radius)', transition: 'background 0.2s', background: showProfileMenu ? 'var(--bg-hover)' : 'transparent' }}
              onMouseEnter={() => {
                cancelHideMenu();
                setShowProfileMenu(true);
              }}
            >
              <div 
                onClick={handleProfileClick}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
              >
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '10px', objectFit: 'cover' }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--accent)', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{user.nick?.[0]?.toUpperCase()}</div>}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.nick}</span>
              </div>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>▼</span>
            </div>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow)',
                minWidth: 200,
                zIndex: 1000,
              }}
              onMouseEnter={() => {
                cancelHideMenu();
                setShowProfileMenu(true);
              }}
              onMouseLeave={() => hideProfileMenu()}>
                <Link 
                  to={`/profile/${user.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    textDecoration: 'none',
                    color: 'var(--text)',
                    borderBottom: '1px solid var(--border)',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon name="user" size={16} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Мой профиль</span>
                </Link>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Icon name="logout" size={16} />
                  <span>Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link 
            to="/login" 
            style={{ 
              padding: '8px 20px', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius)', 
              color: 'var(--text)', 
              fontSize: 14, 
              fontWeight: 600, 
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.target.style.borderColor = 'var(--accent)';
              e.target.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.color = 'var(--text)';
            }}
          >
            Войти
          </Link>
          <Link 
            to="/register" 
            style={{ 
              padding: '8px 20px', 
              background: 'var(--accent)', 
              borderRadius: 'var(--radius)', 
              color: '#fff', 
              fontSize: 14, 
              fontWeight: 700, 
              textDecoration: 'none',
              transition: 'opacity 0.2s',
              border: 'none'
            }}
            onMouseEnter={e => e.target.style.opacity = '0.9'}
            onMouseLeave={e => e.target.style.opacity = '1'}
          >
            Регистрация
          </Link>
        </div>
      )}
    </nav>
  );
}

function AppRoutes() {
  const { loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Загрузка...</div>;

  return (
    <>
      <Navbar />
      <div style={{
        minHeight: 'calc(100vh - 60px)',
        background: 'var(--bg)',
        paddingTop: '60px'
      }}>
        <Routes>
          <Route path="/" element={<PostsPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/posts/:id" element={<PostPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      
      {/* Theme Toggle in Bottom Right Corner */}
      <button 
        className="theme-toggle-corner"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Переключить на светлую тему' : 'Переключить на тёмную тему'}
      >
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={20} />
      </button>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
