import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { User, Wrench, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import './RoleSelect.css';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="role-page">
      <div className="role-page__top">
        <h1 className="role-page__brand">Sahkaar</h1>
        <p className="role-page__subtitle text-secondary">Cooperative Service Platform</p>
      </div>

      <div className="role-page__options">
        <button className="role-card" onClick={() => navigate('/auth/user/login')}>
          <div className="role-card__icon">
            <User size={28} strokeWidth={1.5} />
          </div>
          <div className="role-card__content">
            <h2 className="role-card__title">{t('continueAsUser')}</h2>
            <p className="role-card__desc text-secondary">Find verified workers for your home services</p>
          </div>
        </button>

        <button className="role-card" onClick={() => navigate('/auth/worker/login')}>
          <div className="role-card__icon">
            <Wrench size={28} strokeWidth={1.5} />
          </div>
          <div className="role-card__content">
            <h2 className="role-card__title">{t('continueAsWorker')}</h2>
            <p className="role-card__desc text-secondary">Join the cooperative and offer your skills</p>
          </div>
        </button>

        <button className="role-card" onClick={() => navigate('/auth/admin/login')}>
          <div className="role-card__icon">
            <Shield size={28} strokeWidth={1.5} />
          </div>
          <div className="role-card__content">
            <h2 className="role-card__title">{t('continueAsAdmin') || 'Continue as Admin'}</h2>
            <p className="role-card__desc text-secondary">Manage cooperative operations and schemes</p>
          </div>
        </button>
      </div>
    </div>
  );
}
