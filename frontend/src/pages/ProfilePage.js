import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast, useTheme } from '../App';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import EmailChangeModal from './EmailChangeModal';
import AvatarCropModal from './AvatarCropModal';
import UserPostsTab from './UserPostsTab';
import ProfileSidebar from '../components/ProfileSidebar';
import NotificationPanel from '../components/NotificationPanel';
import ProfileSearchBar from '../components/ProfileSearchBar';
import ProfilePostCard from '../components/ProfilePostCard';
import Icon from '../components/Icon';
import './ProfilePage.css';

const API = '/api';

function buildDayMap(rows) {
  const map = {};
  rows.forEach(r => { 
    const day = r.day?.slice(0, 10);
    if (day) {
      map[day] = parseInt(r.cnt); 
    }
  });
  console.log('[DAYMAP] Built map:', map);
  return map;
}





function buildTimeline(activity, period) {
  const days = period === 'month' ? 30 : 7;
  const now = new Date();
  const postsMap = buildDayMap(activity?.posts || []);
  const commentsMap = buildDayMap(activity?.comments || []);
  const likesMap = buildDayMap(activity?.likes || []);
  const viewsMap = buildDayMap(activity?.views || []);
  
  console.log('[TIMELINE] Activity data:', {
    posts: activity?.posts?.length || 0,
    comments: activity?.comments?.length || 0,
    likes: activity?.likes?.length || 0,
    views: activity?.views?.length || 0
  });
  console.log('[TIMELINE] Maps:', { postsMap, commentsMap, likesMap, viewsMap });
  
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    const posts = postsMap[key] || 0;
    const comments = commentsMap[key] || 0;
    const likes = likesMap[key] || 0;
    const views = viewsMap[key] || 0;
    result.push({ date: label, Посты: posts, Комментарии: comments, Лайки: likes, Просмотры: views });
  }
  
  console.log('[TIMELINE] Result:', result);
  return result;
}

function buildActivityTimeline(activity, period) {
  const days = period === 'month' ? 30 : period === 'week' ? 7 : 14;
  const now = new Date();
  const postsMap = buildDayMap(activity?.posts || []);
  const commentsMap = buildDayMap(activity?.comments || []);
  const likesMap = buildDayMap(activity?.likes || []);
  const viewsMap = buildDayMap(activity?.views || []);
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
    const val = (postsMap[key] || 0) + (commentsMap[key] || 0) + (likesMap[key] || 0) + (viewsMap[key] || 0);
    result.push({ date: label, Активность: val });
  }
  return result;
}



function Charts({ activity, profile, period, setPeriod, activityPeriod, setActivityPeriod, isOwn }) {
  // Показываем графики только для своего профиля
  if (!isOwn) {
    return null;
  }

  // Получаем цвета из CSS переменных для tooltip
  const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#e5e7f0';
  const bgCard = getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#12121f';
  const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#2a2a3e';
  
  const TT = { 
    contentStyle: {
      background: bgCard, 
      border: `1px solid ${borderColor}`, 
      borderRadius: 8, 
      color: textColor, 
      fontSize: 13, 
      fontWeight: 500
    },
    itemStyle: {
      color: textColor
    },
    labelStyle: {
      color: textColor
    },
    cursor: {
      stroke: borderColor
    }
  };
  
  const COLORS = { Посты: '#5ba3d0', Комментарии: '#6ab3e8', Лайки: '#e84c89', Просмотры: '#7bc0de' };

  // Если данные активности еще не загружены, показываем загрузку
  if (!activity) {
    return (
      <div style={{ padding: 16, color: 'var(--text-muted)' }}>
        Загрузка графиков...
      </div>
    );
  }

  const radarData = [
    { subject: 'Посты',        value: parseInt(profile.posts_count) || 0 },
    { subject: 'Комментарии',  value: parseInt(profile.comments_count) || 0 },
    { subject: 'Лайки постов', value: parseInt(profile.received_post_likes) || 0 },
    { subject: 'Лайки комм.',  value: parseInt(profile.received_comment_likes) || 0 },
    { subject: 'Просмотры',    value: parseInt(profile.received_views) || 0 },
  ];

  // Проверка есть ли хоть какие-то данные
  const hasData = radarData.some(d => d.value > 0);
  const timeline = buildTimeline(activity, period);
  const hasTimeline = timeline && timeline.some(d => (d.Посты || 0) + (d.Комментарии || 0) + (d.Лайки || 0) + (d.Просмотры || 0) > 0);

  return (
    <div className="profile-charts">
      <div className="chart-block">
        <h3 className="chart-title">Общая активность</h3>
        {!hasData ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Нет данных для отображения
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData} margin={{ top: 30, right: 100, bottom: 30, left: 100 }}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 12, fill: textColor, dy: 5, dx: -5 }}
              />
              <Radar 
                name="Активность"
                dataKey="value" 
                stroke="var(--accent)" 
                fill="var(--accent)" 
                fillOpacity={0.5} 
                strokeWidth={3}
                dot={false}
              />
              <Tooltip {...TT} />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-block">
        <div className="chart-header">
          <h3 className="chart-title" style={{ margin: 0 }}>Активность по дням</h3>
          <div className="chart-period-btns">
            {[['week','7 дней'],['month','30 дней']].map(([p,l]) => (
              <button key={p} className={`chart-period-btn ${period===p?'active':''}`} onClick={() => setPeriod(p)}>{l}</button>
            ))}
          </div>
        </div>
        {!hasTimeline || !timeline || timeline.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Нет данных за выбранный период
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: textColor }} interval="preserveStartEnd" />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textColor }} />
              <Tooltip {...TT} />
              <Legend wrapperStyle={{ fontSize: 13, color: textColor }} />
              {Object.entries(COLORS).map(([k, c]) => <Line key={k} type="monotone" dataKey={k} stroke={c} dot={false} strokeWidth={2.5} />)}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-block">
        <div className="chart-header">
          <h3 className="chart-title" style={{ margin: 0 }}>Общая активность (суммарно)</h3>
          <div className="chart-period-btns">
            {[['day','14 дней'],['week','7 дней'],['month','30 дней']].map(([p,l]) => (
              <button key={p} className={`chart-period-btn ${activityPeriod===p?'active':''}`} onClick={() => setActivityPeriod(p)}>{l}</button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={buildActivityTimeline(activity, activityPeriod)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: textColor }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textColor }} />
            <Tooltip {...TT} />
            <Line type="monotone" dataKey="Активность" stroke="var(--accent)" strokeWidth={2.5} dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-block">
        <h3 className="chart-title">Распределение активности</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={(() => {
            const data = [
              { name: 'Посты',             val: parseInt(profile.posts_count) || 0 },
              { name: 'Комментарии',       val: parseInt(profile.comments_count) || 0 },
              { name: 'Лайки постов',     val: parseInt(profile.received_post_likes) || 0 },
              { name: 'Лайки комментариев', val: parseInt(profile.received_comment_likes) || 0 },
              { name: 'Просмотры',         val: parseInt(profile.received_views) || 0 },
            ];
            const total = data.reduce((sum, item) => sum + item.val, 0);
            return data.map(item => ({
              ...item,
              percent: total > 0 ? ((item.val / total) * 100).toFixed(1) + '%' : '0%'
            }));
          })()} margin={{ top: 20, right: 10, left: -20, bottom: 60 }}>
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: textColor, angle: -45, textAnchor: 'end', height: 90 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: textColor }} />
            <Tooltip 
              {...TT}
              formatter={(value, name, props) => [
                `${value} (${props.payload.percent})`,
                'Количество'
              ]}
            />
            <Bar dataKey="val" radius={[4,4,0,0]} label={{ position: 'top', fill: textColor, fontSize: 13, fontWeight: 600, formatter: (value, entry, index) => {
              const data = [
                { name: 'Посты',             val: parseInt(profile.posts_count) || 0 },
                { name: 'Комментарии',       val: parseInt(profile.comments_count) || 0 },
                { name: 'Лайки постов',     val: parseInt(profile.received_post_likes) || 0 },
                { name: 'Лайки комментариев', val: parseInt(profile.received_comment_likes) || 0 },
                { name: 'Просмотры',         val: parseInt(profile.received_views) || 0 },
              ];
              const total = data.reduce((sum, item) => sum + item.val, 0);
              const percent = total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
              return percent;
            }}}>
              {['#5ba3d0','#6ab3e8','#e84c89','#f5b041','#7bc0de'].map((c,i) => <Cell key={i} fill={c} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('stats');
  const [comments, setComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedPostsSearch, setLikedPostsSearch] = useState('');
  const [views, setViews] = useState([]);
  const [viewsSearch, setViewsSearch] = useState('');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followersSearch, setFollowersSearch] = useState('');
  const [followingSearch, setFollowingSearch] = useState('');
  const [activity, setActivity] = useState(null);
  const [period, setPeriod] = useState('month');
  const [activityPeriod, setActivityPeriod] = useState('month');
  const [error, setError] = useState('');
  const [editNick, setEditNick] = useState('');
  const [editMsg, setEditMsg] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [croppedAvatarBlob, setCroppedAvatarBlob] = useState(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);
  const avatarRef = useRef(null);
  const previousTheme = useRef(null);

  const isOwn = user && user.id === parseInt(id);

  // Фильтрация просмотренных постов
  const filteredViews = views.filter(p => {
    if (!viewsSearch) return true;
    const search = viewsSearch.toLowerCase();
    return (
      p.body?.toLowerCase().includes(search) ||
      p.username?.toLowerCase().includes(search)
    );
  });

  // Фильтрация лайкнутых постов
  const filteredLikedPosts = likedPosts.filter(p => {
    if (!likedPostsSearch) return true;
    const search = likedPostsSearch.toLowerCase();
    return (
      p.body?.toLowerCase().includes(search) ||
      p.username?.toLowerCase().includes(search)
    );
  });

  // Фильтрация подписчиков
  const filteredFollowers = followers.filter(f => {
    if (!followersSearch) return true;
    const search = followersSearch.toLowerCase();
    return f.nick?.toLowerCase().includes(search);
  });

  // Фильтрация подписок
  const filteredFollowing = following.filter(f => {
    if (!followingSearch) return true;
    const search = followingSearch.toLowerCase();
    return f.nick?.toLowerCase().includes(search);
  });

  // УБРАНО: автоматическое переключение на светлую тему
  // useEffect(() => {
  //   const currentTheme = localStorage.getItem('theme');
  //   if (currentTheme !== 'light') {
  //     previousTheme.current = currentTheme;
  //     if (theme !== 'light') {
  //       toggleTheme();
  //     }
  //   }
  //   return () => {
  //     const currentTheme = localStorage.getItem('theme');
  //     if (currentTheme === 'light' && previousTheme.current && previousTheme.current !== 'light') {
  //       toggleTheme();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    setActivity(null);
    setProfile(null);
    setError('');
    
    // Проверяем сохранённую вкладку ДО сброса на stats
    const saved = localStorage.getItem('activeTab');
    if (saved) { 
      console.log('[PROFILE] Восстановление вкладки:', saved);
      setTab(saved); 
      localStorage.removeItem('activeTab'); 
    } else {
      // Только если нет сохранённой вкладки, сбрасываем на stats
      setTab('stats');
    }
    
    console.log('[PROFILE] Loading profile:', id);
    axios.get(`${API}/users/${id}`)
      .then(r => { 
        console.log('[PROFILE] Profile loaded:', r.data);
        setProfile(r.data); 
        setEditNick(r.data.nick); 
        window.dispatchEvent(new CustomEvent('viewed-profile-changed', { detail: r.data })); 
      })
      .catch(() => setError('Пользователь не найден'));
    
    console.log('[PROFILE] Loading activity for user:', id);
    axios.get(`${API}/users/${id}/activity`)
      .then(r => {
        console.log('[PROFILE] Activity response:', r);
        console.log('[PROFILE] Activity data:', r.data);
        console.log('[PROFILE] Posts array:', r.data.posts);
        console.log('[PROFILE] Comments array:', r.data.comments);
        console.log('[PROFILE] Likes array:', r.data.likes);
        console.log('[PROFILE] Views array:', r.data.views);
        setActivity(r.data);
      })
      .catch(err => {
        console.error('[PROFILE] Activity error:', err);
        console.error('[PROFILE] Activity error response:', err.response);
        setActivity({});
      });
  }, [id]);

  // Проверяем сохранённую вкладку при монтировании - УДАЛЕНО, перенесено выше

  useEffect(() => {
    setComments([]); setViews([]); setFollowers([]); setFollowing([]); setLikedPosts([]);
    if (tab === 'comments') axios.get(`${API}/users/${id}/comments`).then(r => setComments(r.data)).catch(() => {});
    if (tab === 'liked-posts' && isOwn) axios.get(`${API}/users/me/liked-posts`).then(r => setLikedPosts(r.data)).catch(() => {});
    if (tab === 'views' && isOwn) axios.get(`${API}/users/${id}/views`).then(r => setViews(r.data)).catch(() => {});
    if (tab === 'followers') axios.get(`${API}/users/${id}/followers`).then(r => setFollowers(r.data)).catch(() => {});
    if (tab === 'following') axios.get(`${API}/users/${id}/following`).then(r => setFollowing(r.data)).catch(() => {});
  }, [tab, id, isOwn]);

  const handleSubscribe = async () => {
    const { data } = await axios.post(`${API}/users/${id}/subscribe`);
    setProfile(prev => ({ ...prev, is_following: data.subscribed, followers_count: parseInt(prev.followers_count) + (data.subscribed ? 1 : -1) }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault(); 
    setEditMsg('');
    try {
      const fd = new FormData();
      if (editNick !== profile.nick) fd.append('nick', editNick);
      if (croppedAvatarBlob) {
        fd.append('avatar', croppedAvatarBlob, 'avatar.jpg');
      } else if (avatarRef.current?.files[0]) {
        fd.append('avatar', avatarRef.current.files[0]);
      }
      if (![...fd.entries()].length) return;
      
      const { data } = await axios.patch(`${API}/users/me`, fd);
      setProfile(prev => ({ ...prev, ...data }));
      setEditNick(data.nick);
      setAvatarPreview(null);
      setCroppedAvatarBlob(null);
      if (pendingAvatarUrl) URL.revokeObjectURL(pendingAvatarUrl);
      setPendingAvatarUrl(null);
      avatarRef.current.value = '';
      setEditMsg('Сохранено');
      toast('Профиль обновлён ✓');
      
      // Обновляем пользователя в AuthContext
      if (user && user.id === data.id) {
        updateUser({ nick: data.nick, avatar_url: data.avatar_url });
      }
    } catch (err) {
      setEditMsg(err.response?.status === 413 ? 'Файл слишком большой (макс. 300 МБ)' : err.response?.data?.error || 'Ошибка');
    }
  };

  const handleAvatarCropConfirm = ({ blob, preview }) => {
    setCroppedAvatarBlob(blob);
    if (pendingAvatarUrl) URL.revokeObjectURL(pendingAvatarUrl);
    if (preview) setPendingAvatarUrl(preview);
    setShowAvatarCropModal(false);
  };

  // Handle email change button click
  const handleEmailChangeClick = (isHeaderButton = false) => {
    if (isHeaderButton) {
      // Header button: navigate to edit tab first
      setTab('edit');
      // Wait for tab change, then scroll to email field and show modal
      setTimeout(() => {
        const emailRow = document.querySelector('.edit-email-row');
        if (emailRow) {
          emailRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        // Show email change modal after navigation
        setShowEmailModal(true);
      }, 100);
    } else {
      // Edit form button: show modal directly (already on edit tab)
      setShowEmailModal(true);
    }
  };

  if (error) return <p className="profile-error">{error}</p>;
  if (!profile) return <p className="profile-loading">Загрузка...</p>;

  return (
    <div className="profile-layout">
      {user && <NotificationPanel />}
      <ProfileSidebar activeTab={tab} onTabChange={setTab} isOwn={isOwn} />
      <div className="profile-wrap">
      <div className="profile-back-button">
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-muted)', 
            fontSize: 14, 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            cursor: 'pointer',
            padding: '8px 0'
          }}
        >
          <Icon name="arrowLeft" size={16} /> Назад
        </button>
      </div>
      <div className="profile-header">
        <div className="profile-avatar-wrap">
          {pendingAvatarUrl || profile.avatar_url
            ? <img src={pendingAvatarUrl || profile.avatar_url} alt="avatar" className="profile-avatar" />
            : <div className="profile-avatar-placeholder">{profile.nick[0].toUpperCase()}</div>}
        </div>
        <div className="profile-info">
          <h1 className="profile-nick">{profile.nick}</h1>
          {isOwn && profile.role === 'admin' && <span className="profile-role-badge">Администратор</span>}
          <div className="profile-email-row">
            <p className="profile-email">{profile.email}</p>
            {isOwn && <button className="btn-email-change" onClick={() => handleEmailChangeClick(true)} title="Изменить email">Изменить email</button>}
          </div>
          <p className="profile-date">С нами с {new Date(profile.created_at).toLocaleDateString()}</p>
          <div className="profile-sub-counts">
            <span><strong>{profile.followers_count}</strong> подписчиков</span>
            <span><strong>{profile.following_count}</strong> подписок</span>
          </div>
          {user && !isOwn && (
            <button className={`btn-subscribe ${profile.is_following ? 'subscribed' : ''}`} onClick={handleSubscribe}>
              {profile.is_following ? 'Отписаться' : 'Подписаться'}
            </button>
          )}
          {user && user.role === 'admin' && !isOwn && (
            <button 
              className={`btn-ban ${profile.banned ? 'banned' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={async () => {
                try {
                  const { data } = await axios.post(`${API}/users/${profile.id}/ban`);
                  setProfile(prev => ({ ...prev, banned: data.banned, banned_at: data.banned ? new Date() : null }));
                  if (data.banned) {
                    toast('Пользователь заблокирован');
                  } else {
                    toast('Пользователь разблокирован');
                  }
                } catch (err) {
                  toast(err.response?.data?.error || 'Ошибка при блокировке');
                }
              }}
              title={profile.banned ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
            >
              <Icon name={profile.banned ? 'check' : 'ban'} size={14} />
              {profile.banned ? ' Разблокировать' : ' Заблокировать'}
            </button>
          )}
        </div>
      </div>

      <div className="profile-tabs" style={{ display: 'none' }}>
        {['stats', 'posts', 'followers', 'following', 'comments', ...(isOwn ? ['views', 'edit'] : [])].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {{ 
              stats: 'Статистика', 
              posts: 'Посты',
              followers: 'Подписчики', 
              following: 'Подписки', 
              comments: 'Комментарии', 
              views: 'Просмотренные', 
              edit: 'Редактировать' 
            }[t]}
          </button>
        ))}
      </div>

      {tab === 'stats' && (
        <div>
          <div className="profile-stats-grid">
            <div className="stat-card"><span className="stat-val">{profile.posts_count}</span><span className="stat-label">Постов</span></div>
            <div className="stat-card"><span className="stat-val">{profile.comments_count}</span><span className="stat-label">Комментариев</span></div>
            <div className="stat-card"><span className="stat-val">{profile.received_post_likes}</span><span className="stat-label">Лайков на постах</span></div>
            <div className="stat-card"><span className="stat-val">{profile.received_comment_likes}</span><span className="stat-label">Лайков на комментариях</span></div>
            <div className="stat-card" style={{ gridColumn: '1 / -1' }}><span className="stat-val">{profile.received_views}</span><span className="stat-label">Просмотров постов</span></div>
          </div>
          <Charts activity={activity} profile={profile} period={period} setPeriod={setPeriod} activityPeriod={activityPeriod} setActivityPeriod={setActivityPeriod} isOwn={isOwn} />
        </div>
      )}

      {tab === 'posts' && (
        <UserPostsTab userId={id} user={user} />
      )}

      {tab === 'comments' && (
        <div className="profile-comments">
          {comments.length === 0 && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет комментариев</p>}
          {comments.map(c => (
            <div key={c.id} className="profile-comment-item">
              <p className="profile-comment-body">{c.body}</p>
              <small className="profile-comment-meta">
                {new Date(c.created_at).toLocaleString()} — «{c.post_body?.slice(0, 60)}»
                <Link 
                  to={`/posts/${c.post_id}`} 
                  state={{ returnTo: `/profile/${id}`, returnTab: 'comments' }}
                  className="profile-comment-link"
                >
                  Перейти к посту
                </Link>
              </small>
            </div>
          ))}
        </div>
      )}

      {tab === 'liked-posts' && isOwn && (
        <div className="profile-liked-posts">
          <ProfileSearchBar
            value={likedPostsSearch}
            onChange={setLikedPostsSearch}
            placeholder="Поиск в лайкнутых постах..."
          />
          {filteredLikedPosts.length === 0 && likedPostsSearch && <p className="profile-empty-msg">Ничего не найдено</p>}
          {filteredLikedPosts.length === 0 && !likedPostsSearch && <p className="profile-empty-msg">Нет лайкнутых постов</p>}
          <div className="profile-post-list">
            {filteredLikedPosts.map(p => (
              <ProfilePostCard
                key={p.id}
                post={p}
                showUnlike
                onUnlike={async () => {
                  try {
                    await axios.post(`${API}/posts/${p.id}/like`);
                    setLikedPosts(prev => prev.filter(post => post.id !== p.id));
                    toast('Лайк снят');
                  } catch {
                    toast('Ошибка при снятии лайка');
                  }
                }}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'liked-comments' && (
        <div style={{ padding: 20, color: 'var(--text-muted)' }}>
          Раздел больше не используется
        </div>
      )}


      {tab === 'views' && isOwn && (
        <div className="profile-views">
          <ProfileSearchBar
            value={viewsSearch}
            onChange={setViewsSearch}
            placeholder="Поиск в просмотренных постах..."
          />
          {filteredViews.length === 0 && viewsSearch && <p className="profile-empty-msg">Ничего не найдено</p>}
          {filteredViews.length === 0 && !viewsSearch && <p className="profile-empty-msg">Нет просмотренных постов</p>}
          <div className="profile-post-list">
            {filteredViews.map(p => (
              <ProfilePostCard
                key={p.id}
                post={p}
                dateLabel="Просмотрен"
                dateValue={p.viewed_at}
              />
            ))}
          </div>
        </div>
      )}

      {tab === 'followers' && (
        <div className="profile-followers">
          <ProfileSearchBar
            value={followersSearch}
            onChange={setFollowersSearch}
            placeholder="Поиск подписчиков..."
          />
          {filteredFollowers.length === 0 && followersSearch && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Ничего не найдено</p>}
          {filteredFollowers.length === 0 && !followersSearch && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет подписчиков</p>}
          {filteredFollowers.map(f => (
            <div key={f.id} className="profile-follower-item">
              <Link to={`/profile/${f.id}`} className="profile-follower-link">
                {f.avatar_url
                  ? <img src={f.avatar_url} alt="" className="profile-follower-avatar" />
                  : <div className="profile-follower-avatar-placeholder">{f.nick[0].toUpperCase()}</div>}
                <div className="profile-follower-info">
                  <span className="profile-follower-nick">{f.nick}</span>
                  <small className="profile-follower-date">С нами с {new Date(f.created_at).toLocaleDateString()}</small>
                </div>
              </Link>
              {user && user.id !== f.id && (
                <button 
                  className={`btn-subscribe-small ${f.is_following ? 'subscribed' : ''}`}
                  onClick={async () => {
                    const { data } = await axios.post(`${API}/users/${f.id}/subscribe`);
                    setFollowers(prev => prev.map(follower => 
                      follower.id === f.id ? { ...follower, is_following: data.subscribed } : follower
                    ));
                  }}
                >
                  {f.is_following ? 'Отписаться' : 'Подписаться'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'following' && (
        <div className="profile-following">
          <ProfileSearchBar
            value={followingSearch}
            onChange={setFollowingSearch}
            placeholder="Поиск подписок..."
          />
          {filteredFollowing.length === 0 && followingSearch && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Ничего не найдено</p>}
          {filteredFollowing.length === 0 && !followingSearch && <p style={{ padding: 16, color: 'var(--text-muted)' }}>Нет подписок</p>}
          {filteredFollowing.map(f => (
            <div key={f.id} className="profile-follower-item">
              <Link to={`/profile/${f.id}`} className="profile-follower-link">
                {f.avatar_url
                  ? <img src={f.avatar_url} alt="" className="profile-follower-avatar" />
                  : <div className="profile-follower-avatar-placeholder">{f.nick[0].toUpperCase()}</div>}
                <div className="profile-follower-info">
                  <span className="profile-follower-nick">{f.nick}</span>
                  <small className="profile-follower-date">С нами с {new Date(f.created_at).toLocaleDateString()}</small>
                </div>
              </Link>
              {user && user.id !== f.id && (
                <button 
                  className={`btn-subscribe-small ${f.is_following ? 'subscribed' : ''}`}
                  onClick={async () => {
                    const { data } = await axios.post(`${API}/users/${f.id}/subscribe`);
                    setFollowing(prev => prev.map(following => 
                      following.id === f.id ? { ...following, is_following: data.subscribed } : following
                    ));
                  }}
                >
                  {f.is_following ? 'Отписаться' : 'Подписаться'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'edit' && isOwn && (
        <form onSubmit={handleSaveProfile} className="profile-edit-form">
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>Аватарка</label>
            <p className="avatar-edit-hint">Новое фото появится в шапке профиля после обрезки и сохранения.</p>
            <label className="file-chooser">
              <input type="file" accept="image/*" ref={avatarRef} onChange={e => {
                if (e.target.files[0]) {
                  setCroppedAvatarBlob(null);
                  const url = URL.createObjectURL(e.target.files[0]);
                  setAvatarPreview(url);
                  setShowAvatarCropModal(true);
                }
              }} />
              <span className="file-chooser-btn">Добавить фото</span>
            </label>
          </div>
          <label>
            Никнейм
            <input value={editNick} onChange={e => setEditNick(e.target.value)} className="auth-input" />
          </label>
          <div className="edit-email-row">
            <label style={{ flex: 1 }}>
              Email
              <input value={profile.email} disabled className="auth-input edit-email-disabled" />
            </label>
            <button type="button" className="btn-email-change" onClick={() => handleEmailChangeClick(false)} title="Изменить email">
              Изменить email
            </button>
          </div>
          {editMsg && <p className={editMsg === 'Сохранено' ? 'edit-ok' : 'edit-err'}>{editMsg}</p>}
          <button type="submit" className="auth-btn">Сохранить</button>
        </form>
      )}

      {/* Email Change Modal */}
      <EmailChangeModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        currentEmail={profile.email}
        onSuccess={(newEmail) => {
          // Update profile state with new email
          setProfile(prev => ({ ...prev, email: newEmail }));
          // Show success toast
          toast('Email успешно обновлён ✓');
        }}
      />

      {/* Avatar Crop Modal */}
      {showAvatarCropModal && avatarPreview && (
        <AvatarCropModal
          imageUrl={avatarPreview}
          onConfirm={handleAvatarCropConfirm}
          onCancel={() => {
            setShowAvatarCropModal(false);
            setAvatarPreview(null);
            setCroppedAvatarBlob(null);
            if (pendingAvatarUrl) URL.revokeObjectURL(pendingAvatarUrl);
            setPendingAvatarUrl(null);
            avatarRef.current.value = '';
          }}
        />
      )}
      </div>
    </div>
  );
}
