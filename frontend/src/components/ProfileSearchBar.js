import React from 'react';
import Icon from './Icon';

export default function ProfileSearchBar({ value, onChange, placeholder }) {
  return (
    <div className="profile-search-bar">
      <Icon name="search" size={18} />
      <input
        type="text"
        className="profile-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value ? (
        <button
          type="button"
          className="profile-search-clear"
          onClick={() => onChange('')}
          aria-label="Очистить"
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </div>
  );
}
