import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Icon from './Icon';
import './NotificationPanel.css';

function NotificationPanel() {
  const [notifs, setNotifs] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);
  const location = useLocation();

  // Закрываем панель при смене маршрута
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        const trigger = document.querySelector('.notif-panel-trigger');
        if (trigger && !trigger.contains(e.target)) {
          setIsOpen(false);
        }
      }
    };
    
    const handleMouseLeave = (e) => {
      // Закрываем панель если курсор ушёл за пределы экрана
      if (e.clientY <= 0 || e.clientX <= 0 || 
          e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications');
      setNotifs(data);
      setUnread(data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (unread > 0) {
      axios.post('/api/notifications/read').catch(() => {});
      setUnread(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const removeNotification = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifs(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to remove notification', err);
    }
  };

  return (
    <>
      <div
        className={`notif-panel-trigger ${unread > 0 ? 'has-unread' : ''} ${isOpen ? 'panel-open' : ''}`}
        onMouseEnter={handleOpen}
        onMouseLeave={(e) => {
          // Проверяем, не ушёл ли курсор на панель
          const panel = panelRef.current;
          if (panel && !panel.contains(e.relatedTarget)) {
            // Небольшая задержка перед закрытием
            setTimeout(() => {
              if (!panel.matches(':hover')) {
                handleClose();
              }
            }, 100);
          }
        }}
      >
        <Icon name="bell" size={20} className="notif-panel-bell-icon" />
        {unread > 0 && <span className="notif-panel-badge">{unread}</span>}
      </div>

      <div
        ref={panelRef}
        className={`notif-panel ${isOpen ? 'open' : ''}`}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
      >
        <div className="notif-panel-header">
          <span className="notif-panel-title">УВЕДОМЛЕНИЯ</span>
        </div>
        <div className="notif-panel-content">
          <div className="notif-panel-items-wrapper">
            {notifs.length === 0 ? (
              <p className="notif-panel-empty">Нет уведомлений</p>
            ) : (
              notifs.map(n => (
                <div key={n.id} className={`notif-panel-item ${n.is_read ? '' : 'unread'}`}>
                  <p className="notif-panel-msg">{n.message}</p>
                  <span className="notif-panel-time">{new Date(n.created_at).toLocaleString()}</span>
                  <button type="button" className="notif-panel-del ui-btn-icon ui-btn-icon--plain" onClick={() => removeNotification(n.id)} aria-label="Удалить">
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default NotificationPanel;
