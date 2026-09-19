import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes, workerCategories } from '../../contexts/SchemesContext';
import { ArrowLeft, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import './WorkerSchemes.css';

export default function WorkerSchemes() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getPublishedSchemes, checkEligibility, getApplication } = useSchemes();
  const worker = getUser();
  const [filter, setFilter] = useState('all');

  const publishedSchemes = getPublishedSchemes(worker?.communityId || 'C001');

  const filteredSchemes = filter === 'all'
    ? publishedSchemes
    : publishedSchemes.filter(s => s.targetCategories?.includes(filter) || s.eligibilityCriteria?.includes('all_workers'));

  const eligibilityIcon = (status) => {
    switch (status) {
      case 'eligible': return <CheckCircle2 size={14} />;
      case 'not_eligible': return <AlertCircle size={14} />;
      default: return <Info size={14} />;
    }
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('governmentSchemes')}</h1>
      </div>

      {/* Category Filter */}
      <div className="worker-schemes__filter">
        <button
          className={`filter-chip ${filter === 'all' ? 'filter-chip--active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Schemes
        </button>
        {workerCategories
          .filter(cat => worker?.skills?.includes(cat.id))
          .map(cat => (
            <button
              key={cat.id}
              className={`filter-chip ${filter === cat.id ? 'filter-chip--active' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))
        }
      </div>

      {/* Scheme List */}
      <div className="worker-schemes">
        {filteredSchemes.length === 0 ? (
          <EmptyState
            title={t('noSchemesAvailable')}
            description="Government schemes published by your cooperative admin will appear here."
          />
        ) : (
          filteredSchemes.map((scheme, index) => {
            const eligibility = checkEligibility(scheme, worker);
            const application = getApplication(scheme.id, worker?.id);
            const categories = scheme.targetCategories
              ?.map(id => workerCategories.find(c => c.id === id)?.label)
              .filter(Boolean)
              .slice(0, 3);

            return (
              <Card
                key={scheme.id}
                className="scheme-card stagger-item"
                padding={false}
                onClick={() => navigate(`/worker/schemes/${scheme.id}`)}
              >
                {/* Cover */}
                <div className="scheme-card__cover">
                  {scheme.coverImage ? (
                    <img src={scheme.coverImage} alt="" />
                  ) : (
                    <FileText size={32} />
                  )}
                  {scheme.department && (
                    <div className="scheme-card__cover-overlay">
                      <span className="scheme-card__dept">{scheme.department}</span>
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="scheme-card__body">
                  <h3 className="scheme-card__name">{scheme.schemeName}</h3>
                  <p className="scheme-card__desc">{scheme.shortDescription}</p>

                  <div className="scheme-card__meta">
                    {/* Eligibility indicator */}
                    <div className={`eligibility-indicator eligibility-indicator--${eligibility.status}`}>
                      {eligibilityIcon(eligibility.status)}
                      <span>{eligibility.label}</span>
                    </div>

                    {/* Application status */}
                    {application && (
                      <StatusBadge status={application.applicationStatus} size="sm" />
                    )}
                  </div>

                  {/* Category chips */}
                  {categories?.length > 0 && (
                    <div className="scheme-card__meta" style={{ marginTop: 'var(--space-2)' }}>
                      {categories.map(cat => (
                        <span key={cat} className="scheme-card__category">{cat}</span>
                      ))}
                      {scheme.targetCategories?.length > 3 && (
                        <span className="scheme-card__category">+{scheme.targetCategories.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Disclaimer */}
      {filteredSchemes.length > 0 && (
        <div className="scheme-disclaimer" style={{ marginTop: 'var(--space-4)' }}>
          {t('schemeDisclaimer')}
        </div>
      )}
    </div>
  );
}
