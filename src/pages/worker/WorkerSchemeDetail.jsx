import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes, workerCategories, broaderEligibility, applicationStatuses } from '../../contexts/SchemesContext';
import { ArrowLeft, ExternalLink, FileText, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import './WorkerSchemes.css';

export default function WorkerSchemeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getSchemeById, checkEligibility, getApplication, createApplication } = useSchemes();
  const worker = getUser();

  const scheme = getSchemeById(id);

  if (!scheme || scheme.status !== 'published') {
    return (
      <div className="page page--no-nav page--center animate-fade-in">
        <p className="text-secondary">This scheme is no longer available.</p>
        <Button variant="secondary" onClick={() => navigate(-1)} style={{ marginTop: 'var(--space-4)' }}>
          Go Back
        </Button>
      </div>
    );
  }

  const eligibility = checkEligibility(scheme, worker);
  const application = getApplication(scheme.id, worker?.id);

  const handleApply = () => {
    createApplication(scheme.id, worker?.id, worker?.communityId || 'C001');
  };

  const getCategoryLabels = (ids) => ids?.map(id => workerCategories.find(c => c.id === id)?.label || id) || [];
  const getCriteriaLabels = (ids) => ids?.map(id => broaderEligibility.find(c => c.id === id)?.label || id) || [];

  const currentStatusIndex = application
    ? applicationStatuses.findIndex(s => s.id === application.applicationStatus)
    : -1;

  const eligibilityIcon = (status) => {
    switch (status) {
      case 'eligible': return <CheckCircle2 size={16} />;
      case 'not_eligible': return <AlertCircle size={16} />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="page page--no-nav animate-fade-in" style={{ padding: 0 }}>
      {/* Cover with back button */}
      <div style={{ position: 'relative' }}>
        <button className="scheme-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <div className="worker-scheme-detail__cover">
          {scheme.coverImage ? (
            <img src={scheme.coverImage} alt={scheme.schemeName} />
          ) : (
            <FileText size={48} />
          )}
        </div>
      </div>

      <div style={{ padding: 'var(--space-4)' }}>
        <div className="worker-scheme-detail">
          {/* Header */}
          <div className="worker-scheme-detail__header">
            <h1 className="worker-scheme-detail__title">{scheme.schemeName}</h1>
            <p className="worker-scheme-detail__dept">{scheme.department}</p>
            {scheme.schemeType && <StatusBadge status="info" />}
            <div className={`eligibility-indicator eligibility-indicator--${eligibility.status}`}>
              {eligibilityIcon(eligibility.status)}
              <span>{eligibility.label}</span>
            </div>
          </div>

          {/* Overview */}
          <Card>
            <div className="scheme-detail__section">
              <h3 className="scheme-detail__section-title">{t('overview')}</h3>
              <div className="scheme-detail__section-content">
                {scheme.fullDescription || scheme.shortDescription}
              </div>
              {scheme.startDate && (
                <div className="review-row">
                  <span className="review-label">{t('startDate')}</span>
                  <span className="review-value">{new Date(scheme.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {scheme.endDate && (
                <div className="review-row">
                  <span className="review-label">{t('endDate')}</span>
                  <span className="review-value">{new Date(scheme.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Who Can Apply */}
          <Card>
            <div className="scheme-detail__section">
              <h3 className="scheme-detail__section-title">{t('whoCanApply')}</h3>
              {getCategoryLabels(scheme.targetCategories).length > 0 && (
                <div className="chip-grid">
                  {getCategoryLabels(scheme.targetCategories).map(label => (
                    <span key={label} className="chip">{label}</span>
                  ))}
                </div>
              )}
              {getCriteriaLabels(scheme.eligibilityCriteria).length > 0 && (
                <div className="chip-grid" style={{ marginTop: 'var(--space-2)' }}>
                  {getCriteriaLabels(scheme.eligibilityCriteria).map(label => (
                    <span key={label} className="chip">{label}</span>
                  ))}
                </div>
              )}
              {(scheme.ageMin || scheme.ageMax) && (
                <div className="review-row" style={{ marginTop: 'var(--space-2)' }}>
                  <span className="review-label">{t('ageRange')}</span>
                  <span className="review-value">{scheme.ageMin || '—'} to {scheme.ageMax || '—'} years</span>
                </div>
              )}
              {scheme.incomeCategory && (
                <div className="review-row">
                  <span className="review-label">{t('incomeCategory')}</span>
                  <span className="review-value">{scheme.incomeCategory}</span>
                </div>
              )}
              {scheme.eligibilityDescription && (
                <div className="scheme-detail__section-content" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                  {scheme.eligibilityDescription}
                </div>
              )}
            </div>
          </Card>

          {/* Benefits */}
          {scheme.benefits?.length > 0 && (
            <Card>
              <div className="scheme-detail__section">
                <h3 className="scheme-detail__section-title">{t('schemeBenefits')}</h3>
                <div className="detail-list">
                  {scheme.benefits.map((ben, i) => (
                    <div key={i} className="detail-list__item">
                      <span className="detail-list__item-number">{i + 1}</span>
                      <div className="detail-list__item-content">
                        <div className="detail-list__item-title">{ben.title}</div>
                        {ben.description && <div className="detail-list__item-desc">{ben.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Required Documents */}
          {scheme.requiredDocuments?.length > 0 && (
            <Card>
              <div className="scheme-detail__section">
                <h3 className="scheme-detail__section-title">{t('requiredDocuments')}</h3>
                <div className="detail-list">
                  {scheme.requiredDocuments.map((doc, i) => (
                    <div key={i} className="detail-list__item">
                      <span className="detail-list__item-number">{i + 1}</span>
                      <div className="detail-list__item-content">
                        <div className="detail-list__item-title">{doc.name}</div>
                        {doc.description && <div className="detail-list__item-desc">{doc.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* How to Apply */}
          <Card>
            <div className="scheme-detail__section">
              <h3 className="scheme-detail__section-title">{t('howToApply')}</h3>
              {scheme.applicationProcess && (
                <div className="scheme-detail__section-content">{scheme.applicationProcess}</div>
              )}
              {scheme.applicationInstructions && (
                <div style={{ marginTop: 'var(--space-3)' }}>
                  <span className="text-sm font-medium">{t('applicationInstructions')}</span>
                  <div className="scheme-detail__section-content" style={{ marginTop: 'var(--space-1)', fontSize: 'var(--font-size-sm)' }}>
                    {scheme.applicationInstructions}
                  </div>
                </div>
              )}
              {scheme.contactInfo && (
                <div className="review-row" style={{ marginTop: 'var(--space-2)' }}>
                  <span className="review-label">{t('contactInfo')}</span>
                  <span className="review-value">{scheme.contactInfo}</span>
                </div>
              )}
              {scheme.importantNotes && (
                <div className="scheme-disclaimer" style={{ marginTop: 'var(--space-3)' }}>
                  <strong>{t('importantNotes')}:</strong> {scheme.importantNotes}
                </div>
              )}
            </div>
          </Card>

          {/* Official Link */}
          {scheme.officialUrl && (
            <a
              href={scheme.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="official-link-btn"
            >
              <ExternalLink size={16} />
              {t('visitOfficialWebsite')}
            </a>
          )}

          {/* Application Status */}
          {application ? (
            <Card>
              <div className="scheme-detail__section">
                <h3 className="scheme-detail__section-title">{t('applicationStatus')}</h3>
                <div className="app-timeline">
                  {applicationStatuses.filter(s => s.id !== 'not_applied').map((step, i) => {
                    const stepIndex = i; // index among non-'not_applied' statuses
                    const adjustedCurrent = currentStatusIndex - 1; // since we skip 'not_applied'
                    const isCompleted = stepIndex < adjustedCurrent;
                    const isActive = stepIndex === adjustedCurrent;

                    return (
                      <div key={step.id} className="app-timeline__step">
                        <div className={`app-timeline__dot ${isCompleted ? 'app-timeline__dot--completed' : ''} ${isActive ? 'app-timeline__dot--active' : ''}`} />
                        <div className="app-timeline__line" />
                        <span className={`app-timeline__label ${isActive ? 'app-timeline__label--active' : ''}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {application.adminNotes && (
                  <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2) var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--font-size-sm)' }}>
                    <span className="text-secondary">Admin Note:</span> {application.adminNotes}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Button fullWidth size="lg" onClick={handleApply}>
              {t('applyNow')}
            </Button>
          )}

          {/* Disclaimer */}
          <div className="scheme-disclaimer">
            {t('schemeDisclaimer')}
          </div>
        </div>
      </div>
    </div>
  );
}
