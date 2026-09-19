import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes, workerCategories, broaderEligibility } from '../../contexts/SchemesContext';
import { ArrowLeft, Edit3, Upload, ArchiveRestore, Trash2, ExternalLink, FileText } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import '../styles/GovernmentSchemes.css';

export default function AdminSchemeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useLanguage();
  const { getSchemeById, publishScheme, unpublishScheme, archiveScheme, hardDeleteScheme } = useSchemes();

  const scheme = getSchemeById(id);

  if (!scheme) {
    return (
      <div className="admin-page animate-fade-in" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p className="text-secondary">Scheme not found.</p>
        <Button variant="secondary" onClick={() => navigate('/admin/schemes')} style={{ marginTop: 'var(--space-4)' }}>
          {t('back')}
        </Button>
      </div>
    );
  }

  const getCategoryLabels = (ids) => ids?.map(id => workerCategories.find(c => c.id === id)?.label || id).join(', ') || '—';
  const getCriteriaLabels = (ids) => ids?.map(id => broaderEligibility.find(c => c.id === id)?.label || id).join(', ') || '—';

  const handlePublishToggle = () => {
    if (scheme.status === 'published') unpublishScheme(scheme.id);
    else publishScheme(scheme.id);
  };

  const handleArchive = () => {
    if (confirm(t('confirmArchive'))) archiveScheme(scheme.id);
  };

  const handleDelete = () => {
    if (confirm(t('confirmDelete'))) {
      hardDeleteScheme(scheme.id);
      navigate('/admin/schemes');
    }
  };

  return (
    <div className="admin-page animate-fade-in">
      {/* Header */}
      <div className="admin-page__header">
        <div className="admin-page__header-left">
          <button className="admin-page__back" onClick={() => navigate('/admin/schemes')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="admin-page__title">{scheme.schemeName || 'Untitled Scheme'}</h1>
            <div className="flex items-center gap-2" style={{ marginTop: 'var(--space-1)' }}>
              <StatusBadge status={scheme.isArchived ? 'archived' : scheme.status} />
              {scheme.schemeType && <span className="text-sm text-secondary">• {scheme.schemeType}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="scheme-detail__actions" style={{ marginBottom: 'var(--space-5)' }}>
        <Button variant="secondary" size="sm" icon={Edit3} onClick={() => navigate(`/admin/schemes/${id}/edit`)}>
          Edit
        </Button>
        <Button
          variant={scheme.status === 'published' ? 'secondary' : 'primary'}
          size="sm"
          icon={Upload}
          onClick={handlePublishToggle}
        >
          {scheme.status === 'published' ? t('unpublishScheme') : t('publishScheme')}
        </Button>
        {!scheme.isArchived && (
          <Button variant="secondary" size="sm" icon={ArchiveRestore} onClick={handleArchive}>
            {t('archiveScheme')}
          </Button>
        )}
        <Button variant="secondary" size="sm" icon={Trash2} onClick={handleDelete} className="text-error">
          {t('deleteScheme')}
        </Button>
      </div>

      <div className="scheme-detail">
        {/* Cover Image */}
        {scheme.coverImage && (
          <div className="scheme-detail__cover">
            <img src={scheme.coverImage} alt={scheme.schemeName} />
          </div>
        )}

        {/* Overview */}
        <Card>
          <div className="scheme-detail__section">
            <h3 className="scheme-detail__section-title">{t('overview')}</h3>
            <div className="review-row"><span className="review-label">{t('schemeName')}</span><span className="review-value">{scheme.schemeName || '—'}</span></div>
            <div className="review-row"><span className="review-label">{t('department')}</span><span className="review-value">{scheme.department || '—'}</span></div>
            <div className="review-row"><span className="review-label">{t('schemeType')}</span><span className="review-value">{scheme.schemeType || '—'}</span></div>
            <div className="review-row"><span className="review-label">{t('startDate')}</span><span className="review-value">{scheme.startDate || '—'}</span></div>
            <div className="review-row"><span className="review-label">{t('endDate')}</span><span className="review-value">{scheme.endDate || 'Open-ended'}</span></div>
            {scheme.officialUrl && (
              <div className="review-row">
                <span className="review-label">{t('officialUrl')}</span>
                <a href={scheme.officialUrl} target="_blank" rel="noopener noreferrer" className="review-value" style={{ color: 'var(--color-info)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Visit <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </Card>

        {/* Description */}
        {scheme.fullDescription && (
          <Card>
            <div className="scheme-detail__section">
              <h3 className="scheme-detail__section-title">{t('fullDescription')}</h3>
              <div className="scheme-detail__section-content">{scheme.fullDescription}</div>
            </div>
          </Card>
        )}

        {/* Eligibility */}
        <Card>
          <div className="scheme-detail__section">
            <h3 className="scheme-detail__section-title">{t('eligibility')}</h3>
            <div className="review-row"><span className="review-label">{t('targetWorkers')}</span><span className="review-value">{getCategoryLabels(scheme.targetCategories)}</span></div>
            <div className="review-row"><span className="review-label">{t('broaderCriteria')}</span><span className="review-value">{getCriteriaLabels(scheme.eligibilityCriteria)}</span></div>
            {(scheme.ageMin || scheme.ageMax) && (
              <div className="review-row"><span className="review-label">{t('ageRange')}</span><span className="review-value">{scheme.ageMin || '—'} to {scheme.ageMax || '—'} years</span></div>
            )}
            {scheme.incomeCategory && (
              <div className="review-row"><span className="review-label">{t('incomeCategory')}</span><span className="review-value">{scheme.incomeCategory}</span></div>
            )}
            {scheme.otherEligibility && (
              <div className="review-row"><span className="review-label">{t('otherEligibility')}</span><span className="review-value">{scheme.otherEligibility}</span></div>
            )}
            {scheme.eligibilityDescription && (
              <div style={{ marginTop: 'var(--space-3)' }}>
                <span className="text-xs text-secondary font-semibold" style={{ textTransform: 'uppercase', letterSpacing: 'var(--letter-spacing-wide)' }}>{t('eligibilityDescription')}</span>
                <div className="scheme-detail__section-content" style={{ marginTop: 'var(--space-2)' }}>{scheme.eligibilityDescription}</div>
              </div>
            )}
          </div>
        </Card>

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
                      <div className="detail-list__item-title">{doc.name || 'Unnamed Document'}</div>
                      {doc.description && <div className="detail-list__item-desc">{doc.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

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
                      <div className="detail-list__item-title">{ben.title || 'Unnamed Benefit'}</div>
                      {ben.description && <div className="detail-list__item-desc">{ben.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Application Information */}
        <Card>
          <div className="scheme-detail__section">
            <h3 className="scheme-detail__section-title">{t('howToApply')}</h3>
            {scheme.applicationProcess && (
              <div className="review-row"><span className="review-label">{t('applicationProcess')}</span><span className="review-value">{scheme.applicationProcess}</span></div>
            )}
            {scheme.applicationInstructions && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span className="text-sm font-medium">{t('applicationInstructions')}</span>
                <div className="scheme-detail__section-content" style={{ marginTop: 'var(--space-1)' }}>{scheme.applicationInstructions}</div>
              </div>
            )}
            {scheme.applicationLink && (
              <div className="review-row"><span className="review-label">{t('applicationLink')}</span>
                <a href={scheme.applicationLink} target="_blank" rel="noopener noreferrer" className="review-value" style={{ color: 'var(--color-info)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  {scheme.applicationLink} <ExternalLink size={12} />
                </a>
              </div>
            )}
            {scheme.contactInfo && (
              <div className="review-row"><span className="review-label">{t('contactInfo')}</span><span className="review-value">{scheme.contactInfo}</span></div>
            )}
            {scheme.importantNotes && (
              <div className="review-row"><span className="review-label">{t('importantNotes')}</span><span className="review-value">{scheme.importantNotes}</span></div>
            )}
          </div>
        </Card>

        {/* Disclaimer */}
        <div className="scheme-disclaimer">
          {t('schemeDisclaimer')}
        </div>
      </div>
    </div>
  );
}
