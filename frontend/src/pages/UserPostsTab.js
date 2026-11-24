import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Icon, { IconButton } from '../components/Icon';

const API = '/api';

function PostFiles({ files }) {
  const [modalFile, setModalFile] = useState(null);
  if (!files || !files.length) return null;
  
  const mediaTypes = ['image', 'gif', 'video'];
  return (
    <>
      <div className="files-container">
        {files.map(file => {
          if (mediaTypes.includes(file.file_type)) {
            if (file.file_type === 'video') return (
              <div key={file.id} className="media-thumb">
                <video controls src={file.file_url} className="thumb-media" />
              </div>
            );
            return (
              <div key={file.id} className="media-thumb" onClick={() => setModalFile(file)} title="Открыть на весь экран">
                <img src={file.file_url} alt={file.original_name} className="thumb-media" />
                <div className="thumb-overlay"><Icon name="zoom" size={20} /></div>
              </div>
            );
          }
          if (file.file_type === 'audio') return (
            <div key={file.id} className="doc-file">
              <span className="doc-icon"><Icon name="music" size={18} /></span>
              <span className="doc-name">{file.original_name}</span>
              <audio controls src={file.file_url} style={{ width: '100%' }} />
            </div>
          );
          return (
            <div key={file.id} className="doc-file">
              <a href={file.file_url} download={file.original_name} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                <span className="doc-icon"><Icon name="attach" size={18} /></span>
                <span className="doc-name">{file.original_name}</span>
              </a>
            </div>
          );
        })}
      </div>
      {modalFile && (
        <div onClick={() => setModalFile(null)} className="overlay">
          <div className="modal-content">
            {modalFile.file_type === 'video'
              ? <video controls src={modalFile.file_url} className="modal-media" />
              : <img src={modalFile.file_url} alt={modalFile.original_name} className="modal-media" />}
            <div className="modal-buttons">
              <button type="button" onClick={() => { const a = document.createElement('a'); a.href = modalFile.file_url; a.download = modalFile.original_name; a.click(); }} className="btn-download"><Icon name="download" size={16} /> Скачать</button>
              <button type="button" onClick={() => setModalFile(null)} className="btn-close"><Icon name="close" size={16} /> Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserPostsTab({ userId, user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [editFiles, setEditFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    axios.get(`${API}/users/${userId}/posts`)
      .then(r => setPosts(r.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleDelete = async (id) => {
    await axios.delete(`${API}/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const handleEdit = (post) => {
    setEditingPostId(post.id);
    setEditBody(post.body);
    setEditFiles(post.files || []);
    setFilesToDelete([]);
    setNewFiles([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles(prev => [...prev, ...files]);
  };

  const handleRemoveExistingFile = (fileId) => {
    setFilesToDelete(prev => [...prev, fileId]);
    setEditFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async (postId) => {
    if (!editBody.trim()) return;
    
    try {
      const formData = new FormData();
      formData.append('body', editBody);
      formData.append('filesToDelete', JSON.stringify(filesToDelete));
      
      // Добавляем новые файлы
      newFiles.forEach(file => {
        formData.append('files', file);
      });
      
      const { data } = await axios.patch(`${API}/posts/${postId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setPosts(prev => prev.map(p => p.id === postId ? { 
        ...p, 
        body: data.body, 
        updated_at: data.updated_at,
        files: data.files 
      } : p));
      
      setEditingPostId(null);
      setEditBody('');
      setEditFiles([]);
      setFilesToDelete([]);
      setNewFiles([]);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при редактировании');
    }
  };

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditBody('');
    setEditFiles([]);
    setFilesToDelete([]);
    setNewFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLike = (postId, likesCount) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: likesCount } : p));
  };

  // WebSocket: обновление просмотров и лайков в реальном времени
  const postIds = posts.map(p => p.id).join(',');
  useEffect(() => {
    if (!postIds) return;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const sockets = posts.map(post => {
      const ws = new WebSocket(`${proto}://${window.location.host}/ws?postId=${post.id}`);
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.type === 'view') {
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, views_count: msg.views_count } : p
          ));
        }
        if (msg.type === 'like') {
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, likes_count: msg.likes_count } : p
          ));
        }
        if ((msg.type === 'comment' || msg.type === 'comment_deleted') && msg.comments_count != null) {
          setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, comments_count: msg.comments_count } : p
          ));
        }
      };
      return ws;
    });
    return () => sockets.forEach(ws => { try { ws.close(); } catch (_) {} });
  }, [postIds]);

  // Отслеживание просмотра постов
  useEffect(() => {
    if (!user || posts.length === 0) return;

    const observers = [];
    
    posts.forEach(post => {
      const element = document.querySelector(`[data-post-id="${post.id}"]`);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            axios.post(`${API}/posts/${post.id}/view`).catch(() => {});
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach(obs => obs.disconnect());
    };
  }, [posts, user]);

  if (loading) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Загрузка постов...</p>;
  if (posts.length === 0) return <p style={{ padding: 20, color: 'var(--text-muted)' }}>Нет постов</p>;

  return (
    <div className="user-posts-tab">
      {posts.map(post => (
        <div key={post.id} className="user-post-card" data-post-id={post.id}>
          <div className="post-header">
            <Link to={`/profile/${post.user_id}`} className="post-author-link">
              {post.user_avatar
                ? <img src={post.user_avatar} alt="" className="post-avatar" />
                : <div className="post-avatar-placeholder">{post.username?.[0]?.toUpperCase()}</div>}
              <span className="post-author">{post.username}</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to={`/posts/${post.id}`} className="post-toolbar-btn" title="Открыть пост"><Icon name="external" size={17} /></Link>
              <small className="post-date">
                {new Date(post.created_at).toLocaleString()}
                {post.updated_at && post.updated_at !== post.created_at && (
                  <span style={{ marginLeft: 4, color: 'var(--text-muted)', fontSize: '0.9em' }}>
                    (изм.)
                  </span>
                )}
              </small>
            </div>
          </div>
          
          {editingPostId === post.id ? (
            <div className="post-edit-form">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="post-edit-textarea"
                rows={4}
                autoFocus
              />
              
              {/* Существующие файлы */}
              {editFiles.length > 0 && (
                <div className="edit-files-section">
                  <h4 className="edit-files-title">Прикреплённые файлы:</h4>
                  <div className="edit-files-list">
                    {editFiles.map(file => (
                      <div key={file.id} className="edit-file-item">
                        {file.file_type === 'image' || file.file_type === 'gif' ? (
                          <img src={file.file_url} alt={file.original_name} className="edit-file-preview" />
                        ) : file.file_type === 'video' ? (
                          <video src={file.file_url} className="edit-file-preview" />
                        ) : (
                          <div className="edit-file-doc"><Icon name="attach" size={14} /> {file.original_name}</div>
                        )}
                        <button
                          onClick={() => handleRemoveExistingFile(file.id)}
                          className="btn-remove-file"
                          title="Удалить файл"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Новые файлы */}
              {newFiles.length > 0 && (
                <div className="edit-files-section">
                  <h4 className="edit-files-title">Новые файлы:</h4>
                  <div className="edit-files-list">
                    {newFiles.map((file, index) => (
                      <div key={index} className="edit-file-item">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt={file.name} className="edit-file-preview" />
                        ) : file.type.startsWith('video/') ? (
                          <video src={URL.createObjectURL(file)} className="edit-file-preview" />
                        ) : (
                          <div className="edit-file-doc"><Icon name="attach" size={14} /> {file.name}</div>
                        )}
                        <button
                          onClick={() => handleRemoveNewFile(index)}
                          className="btn-remove-file"
                          title="Удалить файл"
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="post-edit-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-add-files"
                >
                  <Icon name="attach" size={14} /> Добавить файлы
                </button>
                <div style={{ flex: 1 }} />
                <button 
                  onClick={() => handleSaveEdit(post.id)}
                  className="btn-save-edit"
                  disabled={!editBody.trim()}
                >
                  ✓ Сохранить
                </button>
                <button 
                  onClick={handleCancelEdit}
                  className="btn-cancel-edit"
                >
                  <Icon name="close" size={14} /> Отмена
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="post-body">{post.body}</p>
              <PostFiles files={post.files} />
            </>
          )}
          
          <div className="post-actions">
            <span className="post-stat profile-post-stat"><Icon name="heart" size={12} /><span>{post.likes_count}</span></span>
            <span className="post-stat profile-post-stat"><Icon name="comment" size={12} /><span>{post.comments_count}</span></span>
            <span className="post-stat profile-post-stat"><Icon name="eye" size={12} /><span>{post.views_count}</span></span>
            {user && user.id === post.user_id && editingPostId !== post.id && (
              <button 
                className="user-post-edit-btn"
                onClick={() => handleEdit(post)}
                title="Редактировать пост"
              >
                <Icon name="edit" size={16} />
              </button>
            )}
            {user && (user.id === post.user_id || user.role === 'admin') && editingPostId !== post.id && (
              <button 
                className="user-post-delete-btn"
                onClick={() => handleDelete(post.id)}
              >
                <Icon name={user.role === 'admin' && user.id !== post.user_id ? 'ban' : 'trash'} size={16} />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserPostsTab;