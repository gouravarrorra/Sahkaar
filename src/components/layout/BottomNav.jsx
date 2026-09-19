import { NavLink } from 'react-router-dom';
import { Home, CalendarDays, MessageSquare, User, Wrench, Briefcase, IndianRupee } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import './BottomNav.css';

const userNavItems = [
  { to: '/user/home', icon: Home, labelKey: 'home' },
  { to: '/user/bookings', icon: CalendarDays, labelKey: 'bookings' },
  { to: '/user/request/ai', icon: MessageSquare, labelKey: 'ai' },
  { to: '/user/profile', icon: User, labelKey: 'profile' },
];

const workerNavItems = [
  { to: '/worker/home', icon: Home, labelKey: 'home' },
  { to: '/worker/requests', icon: Wrench, labelKey: 'requests' },
  { to: '/worker/jobs', icon: Briefcase, labelKey: 'jobs' },
  { to: '/worker/earnings', icon: IndianRupee, labelKey: 'earnings' },
  { to: '/worker/profile', icon: User, labelKey: 'profile' },
];

export default function BottomNav({ role }) {
  const { t } = useLanguage();
  const items = role === 'worker' ? workerNavItems : userNavItems;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          aria-label={t(item.labelKey)}
        >
          <item.icon size={22} strokeWidth={1.8} />
          <span className="bottom-nav__label">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}
