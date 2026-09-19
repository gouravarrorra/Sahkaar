import './Avatar.css';
import { User } from 'lucide-react';

export default function Avatar({ src, name, size = 48 }) {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="avatar__img" />
      ) : initials ? (
        <span className="avatar__initials">{initials}</span>
      ) : (
        <User size={size * 0.5} />
      )}
    </div>
  );
}
