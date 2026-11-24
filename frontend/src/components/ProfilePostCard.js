import React from 'react';
import { Link } from 'react-router-dom';
import Icon, { IconButton } from './Icon';

export default function ProfilePostCard({
  post,
  dateLabel,
  dateValue,
  showUnlike,
  onUnlike,
}) {
  return (
    <article className="profile-post-card">
      <div className="profile-post-card-header">
        <Link to={`/profile/${post.user_id}`}>
          {post.user_avatar ? (
            <img src={post.user_avatar} alt="" className="post-avatar" />
          ) : (
            <div className="post-avatar-placeholder">{post.username?.[0]?.toUpperCase()}</div>
          )}
        </Link>
        <div className="profile-post-card-meta">
          <Link to={`/profile/${post.user_id}`} className="profile-post-card-author">
            {post.username}
          </Link>
          <span className="profile-post-card-date">
            {dateLabel ? `${dateLabel}: ` : ''}{dateValue ? new Date(dateValue).toLocaleString() : new Date(post.created_at).toLocaleString()}
          </span>
        </div>
      </div>
      <p className="profile-post-card-body">{post.body}</p>
      <div className="profile-post-card-actions">
        <span className="profile-post-stat" title="Лайки">
          <Icon name="heart" size={12} />
          <span>{post.likes_count ?? 0}</span>
        </span>
        <span className="profile-post-stat" title="Комментарии">
          <Icon name="comment" size={14} />
          {post.comments_count ?? 0}
        </span>
        <span className="profile-post-stat" title="Просмотры">
          <Icon name="eye" size={14} />
          {post.views_count ?? 0}
        </span>
        {showUnlike && onUnlike ? (
          <IconButton name="heart" className="is-active ui-btn-icon--compact" label="Снять лайк" onClick={onUnlike} />
        ) : null}
        <Link to={`/posts/${post.id}`} className="ui-btn-icon ui-btn-icon--compact" title="Открыть пост">
          <Icon name="external" size={14} />
        </Link>
      </div>
    </article>
  );
}
