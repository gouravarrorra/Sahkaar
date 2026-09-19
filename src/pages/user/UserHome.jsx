import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { serviceCategories } from '../../data/mockData';
import { MessageSquare, Zap, Wrench, Hammer, Paintbrush, Home as HomeIcon, HeartHandshake, Car, Sprout, SprayCan, Settings as SettingsIcon } from 'lucide-react';
import './UserHome.css';

const iconMap = { Zap, Wrench, Hammer, Paintbrush, Home: HomeIcon, HeartHandshake, Car, Sprout, SprayCan, Settings: SettingsIcon };

export default function UserHome() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t, greeting } = useLanguage();
  const user = getUser();

  const handleServiceSelect = (serviceId) => {
    navigate(`/user/request/new?service=${serviceId}`);
  };

  return (
    <div className="page animate-fade-in">
      <div className="user-home__header">
        <div>
          <h1 className="user-home__greeting">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="user-home__subtext text-secondary">{t('whatService')}</p>
        </div>
      </div>

      <button className="ai-entry" onClick={() => navigate('/user/request/ai')}>
        <MessageSquare size={20} strokeWidth={1.8} />
        <div className="ai-entry__content">
          <span className="ai-entry__title">{t('askSahkaar')}</span>
          <span className="ai-entry__desc text-secondary">{t('tellUsWhatHappened')}</span>
        </div>
      </button>

      <div className="section">
        <div className="services-grid">
          {serviceCategories.map((service, i) => {
            const Icon = iconMap[service.icon];
            return (
              <button
                key={service.id}
                className="service-tile stagger-item"
                onClick={() => handleServiceSelect(service.id)}
                aria-label={t(service.label)}
              >
                <div className="service-tile__icon">
                  {Icon && <Icon size={24} strokeWidth={1.5} />}
                </div>
                <span className="service-tile__label">{t(service.label)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
