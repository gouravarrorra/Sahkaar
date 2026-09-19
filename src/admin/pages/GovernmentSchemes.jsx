import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes } from '../../contexts/SchemesContext';
import { Plus, Eye, Edit3, Upload, ArchiveRestore, Trash2, FileText } from 'lucide-react';
import AdminTopbar from '../components/AdminTopbar';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import '../styles/GovernmentSchemes.css';

export default function GovernmentSchemes() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getAllSchemes, getSchemeStats, publishScheme, unpublishScheme, archiveScheme, hardDeleteScheme } = useSchemes();
  const admin = getUser();
  const [tab, setTab] = useState('all');

  const stats = getSchemeStats(admin?.communityId);
  const allSchemes = getAllSchemes(admin?.communityId);

  const filteredSchemes = (() => {
    switch (tab) {
      case 'published': return allSchemes.filter(s => s.status === 'published' && !s.isArchived);
      case 'draft': return allSchemes.filter(s => s.status === 'draft' && !s.isArchived);
      case 'archived': return allSchemes.filter(s => s.isArchived);
      default: return allSchemes.filter(s => !s.isArchived);
    }
  })();

  const handlePublishToggle = (e, scheme) => {
    e.stopPropagation();
    if (scheme.status === 'published') unpublishScheme(scheme.id);
    else publishScheme(scheme.id);
  };

  const handleArchive = (e, id) => {
    e.stopPropagation();
    if (confirm(t('confirmArchive'))) archiveScheme(id);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (confirm(t('confirmDelete'))) hardDeleteScheme(id);
  };

  return (
    <>
      <AdminTopbar title={t('governmentSchemes')} />
      <div className="admin-content__body animate-fade-in">
        {/* Header */}
        <div className="admin-page-header">
          <div className="admin-page-header__info">
            <h1>{t('governmentSchemes')}</h1>
            <p>{t('governmentPrograms')}</p>
          </div>
          <div className="admin-page-header__actions">
            <Button variant="secondary" onClick={() => navigate('/admin/applications')} icon={FileText}>
              {t('applications')}
            </Button>
            <Button onClick={() => navigate('/admin/schemes/new')} icon={Plus}>
              {t('addNewScheme')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <Card className="admin-stat-card"><span className="admin-stat-card__value">{stats.total}</span><span className="admin-stat-card__label">{t('totalSchemes')}</span></Card>
          <Card className="admin-stat-card"><span className="admin-stat-card__value text-success">{stats.published}</span><span className="admin-stat-card__label">{t('publishedSchemes')}</span></Card>
          <Card className="admin-stat-card"><span className="admin-stat-card__value text-warning">{stats.draft}</span><span className="admin-stat-card__label">{t('draftSchemes')}</span></Card>
          <Card className="admin-stat-card"><span className="admin-stat-card__value">{stats.expired}</span><span className="admin-stat-card__label">{t('expiredSchemes')}</span></Card>
          <Card className="admin-stat-card"><span className="admin-stat-card__value">{stats.totalApplications}</span><span className="admin-stat-card__label">{t('totalApplications')}</span></Card>
          <Card className="admin-stat-card"><span className="admin-stat-card__value text-warning">{stats.pendingApplications}</span><span className="admin-stat-card__label">{t('pendingApplications')}</span></Card>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          {['all', 'published', 'draft', 'archived'].map(t2 => (
            <button key={t2} className={`admin-tab ${tab === t2 ? 'admin-tab--active' : ''}`} onClick={() => setTab(t2)}>
              {t2 === 'all' ? t('allSchemes') : t2.charAt(0).toUpperCase() + t2.slice(1)}
            </button>
          ))}
        </div>

        {/* Scheme List */}
        {filteredSchemes.length === 0 ? (
          <EmptyState
            title={tab === 'all' ? 'No schemes yet' : `No ${tab} schemes`}
            description={tab === 'all' ? 'Create your first government scheme to get started.' : `No schemes are currently ${tab}.`}
            action={tab === 'all' ? <Button onClick={() => navigate('/admin/schemes/new')} icon={Plus}>{t('addNewScheme')}</Button> : null}
          />
        ) : (
          <div className="scheme-list">
            {filteredSchemes.map(scheme => (
              <button key={scheme.id} className="scheme-list-item stagger-item" onClick={() => navigate(`/admin/schemes/${scheme.id}`)}>
                <div className="scheme-list-item__cover">
                  {scheme.coverImage ? <img src={scheme.coverImage} alt="" /> : <FileText size={24} />}
                </div>
                <div className="scheme-list-item__info">
                  <div className="scheme-list-item__name">{scheme.schemeName || 'Untitled Scheme'}</div>
                  <div className="scheme-list-item__dept">{scheme.department || 'No department'}</div>
                  <div className="scheme-list-item__meta">
                    <StatusBadge status={scheme.isArchived ? 'archived' : scheme.status} size="sm" />
                    <span className="scheme-list-item__date">
                      {new Date(scheme.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="scheme-list-item__actions">
                  <button className="scheme-action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/admin/schemes/${scheme.id}`); }} title="View"><Eye size={16} /></button>
                  <button className="scheme-action-btn" onClick={(e) => { e.stopPropagation(); navigate(`/admin/schemes/${scheme.id}/edit`); }} title="Edit"><Edit3 size={16} /></button>
                  <button className={`scheme-action-btn ${scheme.status === 'published' ? 'scheme-action-btn--danger' : 'scheme-action-btn--success'}`} onClick={(e) => handlePublishToggle(e, scheme)} title={scheme.status === 'published' ? 'Unpublish' : 'Publish'}><Upload size={16} /></button>
                  {!scheme.isArchived && <button className="scheme-action-btn" onClick={(e) => handleArchive(e, scheme.id)} title="Archive"><ArchiveRestore size={16} /></button>}
                  <button className="scheme-action-btn scheme-action-btn--danger" onClick={(e) => handleDelete(e, scheme.id)} title="Delete"><Trash2 size={16} /></button>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
