import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';

export default function AdminTopbar({ title }) {
  const navigate = useNavigate();
  const { getUser, logout } = useAuth();
  const admin = getUser();

  return (
    <div className="admin-topbar-v2">
      <h2 className="admin-topbar-v2__title">{title}</h2>
      <div className="admin-topbar-v2__actions">
        <button className="action-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <div className="admin-topbar-v2__user">
          <span>{admin?.name}</span>
          <span className="text-tertiary">•</span>
          <span className="text-xs">{admin?.communityName}</span>
          <button
            className="admin-topbar-v2__logout"
            onClick={() => { logout(); navigate('/', { replace: true }); }}
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
