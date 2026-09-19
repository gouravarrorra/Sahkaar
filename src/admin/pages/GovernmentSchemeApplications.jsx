import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSchemes, applicationStatuses } from '../../contexts/SchemesContext';
import { mockWorkers } from '../../data/mockData';
import { ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import TextField from '../../components/ui/TextField';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import '../styles/GovernmentSchemes.css';

export default function AdminApplications() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getAllApplications, getSchemeById, updateApplicationStatus } = useSchemes();
  const admin = getUser();

  const apps = getAllApplications(admin?.communityId);
  const [editingApp, setEditingApp] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const startEdit = (app) => {
    setEditingApp(app.id);
    setEditStatus(app.applicationStatus);
    setEditNotes(app.adminNotes || '');
  };

  const saveEdit = (appId) => {
    updateApplicationStatus(appId, editStatus, editNotes);
    setEditingApp(null);
  };

  const cancelEdit = () => {
    setEditingApp(null);
    setEditStatus('');
    setEditNotes('');
  };

  const getWorkerName = (workerId) => {
    return mockWorkers[workerId]?.name || workerId;
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
            <h1 className="admin-page__title">{t('workerApplications')}</h1>
            <p className="admin-page__subtitle">{t('governmentSchemes')} — {t('applications')}</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="scheme-disclaimer" style={{ marginBottom: 'var(--space-4)' }}>
        Application statuses managed here represent SAHKAAR coordination status only. Final government decisions are outside SAHKAAR unless an official integration is implemented.
      </div>

      {/* Applications */}
      {apps.length === 0 ? (
        <EmptyState
          title="No applications yet"
          description="Worker applications for government schemes will appear here."
        />
      ) : (
        <div className="applications-list">
          {apps.map(app => {
            const scheme = getSchemeById(app.schemeId);
            const isEditing = editingApp === app.id;

            return (
              <Card key={app.id} className="application-card">
                <div className="application-card__header">
                  <div>
                    <div className="application-card__worker">{getWorkerName(app.workerId)}</div>
                    <div className="application-card__scheme">{scheme?.schemeName || 'Unknown Scheme'}</div>
                  </div>
                  <StatusBadge status={app.applicationStatus} size="sm" />
                </div>

                <div className="application-card__details">
                  <div className="application-card__row">
                    <span className="application-card__label">{t('workerId')}</span>
                    <span>{app.workerId}</span>
                  </div>
                  <div className="application-card__row">
                    <span className="application-card__label">{t('date')}</span>
                    <span>{new Date(app.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="application-card__row">
                    <span className="application-card__label">Last Updated</span>
                    <span>{new Date(app.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                  {app.adminNotes && !isEditing && (
                    <div className="application-card__row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                      <span className="application-card__label">{t('adminNotes')}</span>
                      <span className="text-sm">{app.adminNotes}</span>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="application-card__actions" style={{ flexDirection: 'column' }}>
                    <div>
                      <label className="form-label">{t('updateStatus')}</label>
                      <select className="status-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                        {applicationStatuses.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                    <TextField
                      label={t('adminNotes')}
                      value={editNotes}
                      onChange={setEditNotes}
                      placeholder="Add coordination notes..."
                      name={`notes-${app.id}`}
                      multiline
                      rows={2}
                    />
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <Button size="sm" onClick={() => saveEdit(app.id)}>Save</Button>
                      <Button size="sm" variant="secondary" onClick={cancelEdit}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="application-card__actions">
                    <Button size="sm" variant="secondary" onClick={() => startEdit(app)}>
                      {t('updateStatus')}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
