import React from 'react';
import Icon from './Icon';

function ProfileSidebar({ activeTab, onTabChange, isOwn }) {
  const tabs = [
    { id: 'stats', label: 'Статистика', icon: 'chart' },
    { id: 'posts', label: 'Посты', icon: 'post' },
    { id: 'followers', label: 'Подписчики', icon: 'users' },
    { id: 'following', label: 'Подписки', icon: 'user' },
    { id: 'comments', label: 'Комментарии', icon: 'comment' },
    ...(isOwn ? [
      { id: 'liked-posts', label: 'Лайкнутые посты', icon: 'heart' },
      { id: 'views', label: 'Просмотренные', icon: 'eye' },
      { id: 'edit', label: 'Настройки', icon: 'settings' },
    ] : []),
  ];

  return (
    <div className="profile-sidebar">
      <div className="profile-sidebar-header">
        <span className="profile-sidebar-title">МЕНЮ</span>
      </div>
      <nav className="profile-sidebar-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`profile-sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span className="profile-sidebar-label">{tab.label}</span>
            <span className="profile-sidebar-icon-wrap">
              <Icon name={tab.icon} size={18} />
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default ProfileSidebar;
