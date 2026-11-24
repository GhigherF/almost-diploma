import React from 'react';

const paths = {
  search: 'M10 4a6 6 0 104.47 10.03l3.77 3.77 1.41-1.41-3.77-3.77A6 6 0 0010 4zm0 2a4 4 0 110 8 4 4 0 010-8z',
  heart: 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z',
  eye: 'M12 5C6.5 5 2.4 8.9 1 12c1.4 3.1 5.5 7 11 7s9.6-3.9 11-7c-1.4-3.1-5.5-7-11-7zm0 2.5c4.1 0 7.5 2.4 8.8 4.5-1.3 2.1-4.7 4.5-8.8 4.5S4.5 14.1 3.2 12c1.3-2.1 4.7-4.5 8.8-4.5zm0 2.2a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6z',
  comment: 'M4 4h16v10H8l-4 4V4z',
  trash: 'M6 7h12v12H6V7zm2-3h8l1 2H7l1-2zm3 4v8h2V8h-2zm-3 0v8h2V8H8z',
  ban: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 3h2v6h-2V7zm0 8h2v2h-2v-2z',
  close: 'M6 6l12 12M18 6L6 18',
  download: 'M12 3v10m0 0l4-4m-4 4l-4-4M5 19h14',
  file: 'M6 4h8l4 4v12H6V4zm8 0v4h4',
  edit: 'M4 16.5V20h3.5L17 10.5l-3.5-3.5L4 16.5zm2.9-.9l8.6-8.6 1.8 1.8-8.6 8.6H6.9v-1.8z',
  settings: 'M12 8a4 4 0 110 8 4 4 0 010-8zm8.5 4a7.2 7.2 0 01-.2 1.5l2 1.5-2 3.5-2.4-1a7.5 7.5 0 01-2.6 1.5l-.4 2.6H9.1l-.4-2.6a7.5 7.5 0 01-2.6-1.5l-2.4 1-2-3.5 2-1.5a7.2 7.2 0 01-.2-1.5 7.2 7.2 0 01.2-1.5l-2-1.5 2-3.5 2.4 1a7.5 7.5 0 012.6-1.5l.4-2.6h3.8l.4 2.6a7.5 7.5 0 012.6 1.5l2.4-1 2 3.5-2 1.5c.1.5.2 1 .2 1.5z',
  chart: 'M4 18V8h3v10H4zm5 0V4h3v14H9zm5 0v-7h3v7h-3z',
  post: 'M6 4h12v2H6V4zm0 5h12v2H6V9zm0 5h8v2H6v-2z',
  users: 'M8 11a3 3 0 100-6 3 3 0 000 6zm8 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 18c0-2.8 2.7-4 5-4s5 1.2 5 4H3zm11 0c0-2.2 1.8-3.2 4-3.5',
  bell: 'M12 3a4 4 0 014 4v2.5c0 .8.3 1.6.8 2.2L18 14H6l1.2-2.3c.5-.6.8-1.4.8-2.2V7a4 4 0 014-4zm-1 15a2 2 0 104 0H11z',
  sun: 'M12 2v2 M12 20v2 M4.22 4.22l1.42 1.42 M18.36 18.36l1.42 1.42 M2 12h2 M20 12h2 M4.22 19.78l1.42-1.42 M18.36 5.64l1.42-1.42',
  moon: 'M18 13.5A7.5 7.5 0 017 5.5 8.5 8.5 0 1018 13.5z',
  arrowLeft: 'M10 6L4 12l6 6M4 12h16',
  external: 'M14 4h6v6M10 14L20 4M16 10h4v10H6V14',
  attach: 'M8 12l6-6a3 3 0 114 4l-7 7a5 5 0 11-7-7l8-8',
  music: 'M10 6v9.5a2.5 2.5 0 11-1-2V7h6V5h-5z',
  zoom: 'M10 4a6 6 0 104.47 10.03l3.77 3.77M21 21l-3.5-3.5',
  check: 'M5 12l4 4L19 6',
  plus: 'M12 5v14M5 12h14',
  logout: 'M10 6v12M6 10l4-4 4 4M14 16h6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8c0-3.3 3.1-5 7-5s7 1.7 7 5H5z',
  lock: 'M7 10V8a5 5 0 0110 0v2h1v10H6V10h1zm2 0h6V8a3 3 0 00-6 0v2z',
  mail: 'M4 6h16v12H4V6zm0 0l8 7 8-7',
  copy: 'M8 4h10v12H8V4zm-6 4h10v12H2V8zm2-4h10v2H4V4z',
};

export default function Icon({ name, size = 18, className = '', strokeWidth = 1.75, style }) {
  const d = paths[name];
  if (!d) return null;
  const filled = name === 'heart';
  const isSun = name === 'sun';
  return (
    <svg
      className={`ui-icon-svg ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 0 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      overflow="visible"
    >
      {isSun && (
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
      )}
      <path d={d} fill={filled ? 'currentColor' : 'none'} stroke={filled ? 'none' : 'currentColor'} />
    </svg>
  );
}

export function IconButton({
  name, label, onClick, className = '', active = false, children, type = 'button', disabled,
}) {
  return (
    <button
      type={type}
      className={`ui-btn-icon ${active ? 'is-active' : ''} ${className}`}
      onClick={onClick}
      title={label}
      aria-label={label || undefined}
      disabled={disabled}
    >
      <Icon name={name} size={16} />
      {children != null ? <span className="ui-btn-icon-text">{children}</span> : null}
    </button>
  );
}
