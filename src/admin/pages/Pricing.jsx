import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePricing, proposalReasons } from '../../contexts/PricingContext';
import {
  ArrowLeft, BarChart3, FileText, AlertTriangle, Users,
  MessageSquare, History, Settings, Shield, CheckCircle2, XCircle, Clock, Eye
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import '../styles/Pricing.css';

const TABS = [
  { id: 'bands', icon: BarChart3, label: 'Price Bands' },
  { id: 'proposals', icon: FileText, label: 'Proposals' },
  { id: 'exceptions', icon: AlertTriangle, label: 'Exceptions' },
  { id: 'committee', icon: Users, label: 'Committee' },
  { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
  { id: 'audit', icon: History, label: 'Audit Trail' },
  { id: 'algorithm', icon: Settings, label: 'Algorithm' },
];

export default function AdminPricing() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const pricing = usePricing();
  const [activeTab, setActiveTab] = useState('bands');

  const stats = pricing.pricingStats;
  const cartelAlerts = pricing.getCartelAlerts().filter(a => a.status === 'flagged');

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate('/admin/schemes')} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('pricingGovernance') || 'Pricing Governance'}</h1>
      </div>

      {/* Stats */}
      <div className="pricing-stats">
        <Card className="pricing-stat">
          <span className="pricing-stat__value">{stats.activeProposals}</span>
          <span className="pricing-stat__label">{t('activeProposals') || 'Proposals'}</span>
        </Card>
        <Card className="pricing-stat">
          <span className="pricing-stat__value">{stats.pendingExceptions}</span>
          <span className="pricing-stat__label">{t('pendingExceptions') || 'Exceptions'}</span>
        </Card>
        <Card className="pricing-stat">
          <span className="pricing-stat__value">{stats.totalAudit}</span>
          <span className="pricing-stat__label">{t('auditRecords') || 'Audit'}</span>
        </Card>
      </div>

      {/* Cartel Alert Banner */}
      {cartelAlerts.length > 0 && (
        <div className="emergency-banner">
          <div className="emergency-banner__title">
            <Shield size={14} style={{ display: 'inline', marginRight: 4 }} />
            {cartelAlerts.length} Pricing Concentration Alert{cartelAlerts.length > 1 ? 's' : ''}
          </div>
          <p style={{ fontSize: '0.78rem' }}>Potential coordinated pricing patterns detected. Review in Audit tab.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="pricing-tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`pricing-tab ${activeTab === tab.id ? 'pricing-tab--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'proposals' && stats.activeProposals > 0 && (
              <span className="pricing-tab__badge">{stats.activeProposals}</span>
            )}
            {tab.id === 'exceptions' && stats.pendingExceptions > 0 && (
              <span className="pricing-tab__badge">{stats.pendingExceptions}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'bands' && <PriceBandsTab pricing={pricing} t={t} />}
      {activeTab === 'proposals' && <ProposalsTab pricing={pricing} t={t} />}
      {activeTab === 'exceptions' && <ExceptionsTab pricing={pricing} t={t} />}
      {activeTab === 'committee' && <CommitteeTab pricing={pricing} t={t} />}
      {activeTab === 'feedback' && <FeedbackTab pricing={pricing} t={t} />}
      {activeTab === 'audit' && <AuditTab pricing={pricing} t={t} />}
      {activeTab === 'algorithm' && <AlgorithmTab pricing={pricing} t={t} />}

      <div className="governance-disclaimer">
        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
        {t('workersParticipateInPricing') || 'Workers participate in pricing.'} {t('adminImplementsGovernedDecisions') || 'Admin implements governed decisions.'}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: PRICE BANDS
   ═══════════════════════════════════════════ */

function PriceBandsTab({ pricing, t }) {
  const bands = pricing.getAllPriceBands();

  return (
    <Card>
      <table className="price-band-table">
        <thead>
          <tr>
            <th>{t('service') || 'Service'}</th>
            <th style={{ textAlign: 'right' }}>{t('minimum') || 'Min'}</th>
            <th style={{ textAlign: 'right' }}>{t('reference') || 'Ref'}</th>
            <th style={{ textAlign: 'right' }}>{t('maximum') || 'Max'}</th>
            <th>{t('status') || 'Status'}</th>
          </tr>
        </thead>
        <tbody>
          {bands.map(band => (
            <tr key={band.serviceId}>
              <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                {t(band.serviceId) || band.serviceId.replace(/_/g, ' ')}
              </td>
              <td className="currency">₹{band.minimum}</td>
              <td className="currency" style={{ fontWeight: 700 }}>₹{band.reference}</td>
              <td className="currency">₹{band.maximum}</td>
              <td><StatusBadge status={band.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-2)' }}>
        Next review: {bands[0]?.nextReviewDate || 'N/A'} • Review cycle: 3 months
      </p>
    </Card>
  );
}

/* ═══════════════════════════════════════════
   TAB: PROPOSALS
   ═══════════════════════════════════════════ */

function ProposalsTab({ pricing, t }) {
  const proposals = pricing.getAllProposals();

  if (proposals.length === 0) {
    return <EmptyState title={t('noProposals') || 'No Proposals'} description="No worker price proposals submitted yet." />;
  }

  const getReasonLabel = (id) => proposalReasons.find(r => r.id === id)?.label || id;

  const handleApprove = (id) => pricing.updateProposalStatus(id, 'approved', 'A001');
  const handleReject = (id) => pricing.updateProposalStatus(id, 'rejected', 'A001');

  return (
    <div>
      {proposals.map(p => (
        <Card key={p.id} className={`proposal-card proposal-card--${p.withinRange?.replace('_range', '')}`}>
          <div className="proposal-card__header">
            <div>
              <span className="proposal-card__service">{t(p.serviceId) || p.serviceId}</span>
              <div className="proposal-card__meta">
                <span>Worker: {p.workerId}</span>
                <span>{new Date(p.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
            <span className="proposal-card__price currency">₹{p.proposedPrice}</span>
          </div>

          <div style={{ marginBottom: 'var(--space-2)' }}>
            <span className={`range-indicator range-indicator--${p.withinRange?.replace('_range', '')}`}>
              {p.withinRange === 'within_range' && <CheckCircle2 size={14} />}
              {p.withinRange === 'above_range' && <AlertTriangle size={14} />}
              {p.withinRange === 'below_range' && <Clock size={14} />}
              {p.withinRange?.replace('_', ' ').replace('range', 'Range') || 'Unknown'} (Ref: ₹{p.currentReference})
            </span>
          </div>

          <p className="text-sm" style={{ marginBottom: 'var(--space-1)' }}>
            <strong>Reason:</strong> {getReasonLabel(p.reasonId)}
          </p>
          {p.explanation && <p className="text-xs text-secondary">{p.explanation}</p>}

          {p.status === 'submitted' && (
            <div className="proposal-card__actions">
              <Button size="sm" onClick={() => handleApprove(p.id)}>Approve</Button>
              <Button size="sm" variant="ghost" onClick={() => handleReject(p.id)}>Reject</Button>
            </div>
          )}

          {p.status !== 'submitted' && <StatusBadge status={p.status} />}
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: EXCEPTIONS
   ═══════════════════════════════════════════ */

function ExceptionsTab({ pricing, t }) {
  const exceptions = pricing.getAllExceptions();

  if (exceptions.length === 0) {
    return <EmptyState title="No Exceptions" description="No out-of-range pricing exceptions yet." />;
  }

  const handleReview = (id, decision) => {
    pricing.reviewException(id, 'PRICING_PANEL', 'Reviewed by pricing panel', decision);
  };

  return (
    <div>
      <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
        Four-Eyes Principle: Exceptions require independent review + admin approval. No single actor controls both.
      </p>
      {exceptions.map(exc => (
        <Card key={exc.id} className="proposal-card proposal-card--above" style={{ marginBottom: 'var(--space-3)' }}>
          <div className="proposal-card__header">
            <span className="proposal-card__service">{exc.serviceId}</span>
            <span className="proposal-card__price currency">₹{exc.proposedPrice}</span>
          </div>
          <p className="text-sm">Fair Range: {exc.currentRange}</p>
          <p className="text-sm">Difference: <strong>+₹{exc.difference}</strong></p>
          <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-1)' }}>
            Requested by: {exc.requestedBy} • {new Date(exc.timestamp).toLocaleDateString()}
          </p>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <StatusBadge status={exc.status} />
          </div>

          {exc.status === 'pending_review' && (
            <div className="proposal-card__actions">
              <Button size="sm" onClick={() => handleReview(exc.id, 'approved')}>Approve (Reviewer)</Button>
              <Button size="sm" variant="ghost" onClick={() => handleReview(exc.id, 'rejected')}>Reject</Button>
            </div>
          )}

          {exc.status === 'approved' && !exc.fourEyesApprover && (
            <div className="proposal-card__actions">
              <Button size="sm" variant="secondary" onClick={() => pricing.fourEyesApproveException(exc.id, 'A002')}>
                Four-Eyes Confirm
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: COMMITTEE
   ═══════════════════════════════════════════ */

function CommitteeTab({ pricing, t }) {
  const committee = pricing.getCommittee();
  const [newMember, setNewMember] = useState('');

  const handleAdd = () => {
    if (newMember.trim()) {
      pricing.addCommitteeMember(newMember.trim(), 'A001');
      setNewMember('');
    }
  };

  return (
    <div>
      <Card>
        <h3 className="text-md font-semibold" style={{ marginBottom: 'var(--space-3)' }}>
          Worker Pricing Committee ({committee.members.length}/{committee.maxMembers})
        </h3>
        <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-3)' }}>
          Committee provides formal worker representation. Rotates every {committee.rotationDays} days.
          Committee cannot unilaterally set the final price.
        </p>

        {committee.members.length === 0 ? (
          <p className="text-sm text-secondary">No committee members appointed yet.</p>
        ) : (
          <div className="committee-members">
            {committee.members.map(m => (
              <div key={m} className="committee-member">
                <span>{m}</span>
                <button className="committee-member__remove" onClick={() => pricing.removeCommitteeMember(m, 'A001')}>×</button>
              </div>
            ))}
          </div>
        )}

        {committee.members.length < committee.maxMembers && (
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
            <input
              type="text"
              value={newMember}
              onChange={e => setNewMember(e.target.value)}
              placeholder="Worker ID (e.g. W10245)"
              style={{
                flex: 1, padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontFamily: 'inherit'
              }}
            />
            <Button size="sm" onClick={handleAdd}>Add</Button>
          </div>
        )}
      </Card>

      {/* Committee Decisions */}
      {committee.decisions.length > 0 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h3 className="section__title">Decisions</h3>
          {committee.decisions.map(d => (
            <Card key={d.id} style={{ marginBottom: 'var(--space-2)' }}>
              <p className="text-sm font-semibold">{d.decision}</p>
              <p className="text-xs text-secondary">{d.justification}</p>
              <p className="text-xs text-secondary">{new Date(d.timestamp).toLocaleString()}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: CONSUMER FEEDBACK
   ═══════════════════════════════════════════ */

function FeedbackTab({ pricing, t }) {
  const stats = pricing.getConsumerFeedbackStats();

  return (
    <div>
      <div className="feedback-stats">
        <Card className="feedback-stat">
          <span className="feedback-stat__value">{stats.count}</span>
          <span className="feedback-stat__label">Total Responses</span>
        </Card>
        <Card className="feedback-stat">
          <span className="feedback-stat__value">{stats.avgSatisfaction}/5</span>
          <span className="feedback-stat__label">Avg Satisfaction</span>
        </Card>
        <Card className="feedback-stat">
          <span className="feedback-stat__value">{stats.affordablePercent}%</span>
          <span className="feedback-stat__label">Found Affordable</span>
        </Card>
        <Card className="feedback-stat">
          <span className="feedback-stat__value">{stats.complaintCount}</span>
          <span className="feedback-stat__label">Price Complaints</span>
        </Card>
      </div>

      <Card>
        <p className="text-sm text-secondary">
          Consumer feedback is an <strong>input into pricing review</strong>, not a mechanism
          that allows customers to force worker compensation below a fair level.
        </p>
        <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-2)' }}>
          Goal: Worker Fair Compensation + Consumer Affordability + Objective Cost Data
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: AUDIT TRAIL
   ═══════════════════════════════════════════ */

function AuditTab({ pricing, t }) {
  const trail = pricing.getAuditTrail(null, 30);
  const cartelAlerts = pricing.getCartelAlerts();
  const adminLog = pricing.getAdminActionLog(null, 20);

  return (
    <div>
      {/* Cartel Alerts */}
      {cartelAlerts.filter(a => a.status === 'flagged').length > 0 && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h3 className="section__title" style={{ color: 'var(--color-error)' }}>
            <AlertTriangle size={14} style={{ display: 'inline', marginRight: 4 }} />
            Concentration Alerts
          </h3>
          {cartelAlerts.filter(a => a.status === 'flagged').map(alert => (
            <div key={alert.id} className={`cartel-alert cartel-alert--${alert.severity}`}>
              <div className="cartel-alert__header">
                <span className="cartel-alert__type">{alert.type.replace(/_/g, ' ')}</span>
                <StatusBadge status={alert.severity} />
              </div>
              <p className="text-xs">{alert.description}</p>
              <p className="text-xs text-secondary">{new Date(alert.detectedAt).toLocaleString()}</p>
              <Button size="sm" variant="ghost" onClick={() => pricing.dismissCartelAlert(alert.id, 'A001')}
                style={{ marginTop: 'var(--space-2)' }}>
                Dismiss After Review
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Audit Trail */}
      <h3 className="section__title">Immutable Pricing Audit Trail</h3>
      {trail.length === 0 ? (
        <EmptyState title="No Records" description="No pricing actions recorded yet." />
      ) : (
        <Card>
          {trail.map(record => (
            <div key={record.id} className="audit-row">
              <div className="audit-row__action">
                <History size={13} />
                {record.action.replace(/_/g, ' ')}
              </div>
              <div className="audit-row__values">
                {record.previousValue && <span className="audit-row__old">{record.previousValue}</span>}
                {record.newValue && <span className="audit-row__new">{record.newValue}</span>}
              </div>
              <div className="audit-row__detail">
                {record.actor} ({record.actorRole}) • {record.reason} • {new Date(record.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Admin Action Log */}
      {adminLog.length > 0 && (
        <div style={{ marginTop: 'var(--space-6)' }}>
          <h3 className="section__title">Admin Action Log</h3>
          <Card>
            {adminLog.map(log => (
              <div key={log.id} className="audit-row">
                <div className="audit-row__action">
                  <Eye size={13} />
                  {log.action}
                </div>
                <div className="audit-row__detail">
                  Admin {log.adminId} • {log.category} • {new Date(log.timestamp).toLocaleString()}
                </div>
                {(log.previousValue || log.newValue) && (
                  <div className="audit-row__values">
                    {log.previousValue && <span className="audit-row__old">{log.previousValue}</span>}
                    {log.newValue && <span className="audit-row__new">{log.newValue}</span>}
                  </div>
                )}
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TAB: ALGORITHM
   ═══════════════════════════════════════════ */

function AlgorithmTab({ pricing, t }) {
  const current = pricing.getCurrentAlgorithm();
  const history = pricing.getAlgorithmHistory();

  return (
    <div>
      <Card>
        <h3 className="text-md font-semibold" style={{ marginBottom: 'var(--space-3)' }}>
          Fair Price Calculation — Current Version
        </h3>
        <div className="algo-version">
          <span className="algo-version__tag">v{current.version}</span>
          <span>Effective: {current.effectiveDate}</span>
        </div>

        <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-4)' }}>
          {current.changeSummary}
        </p>

        <h4 className="text-sm font-semibold" style={{ marginBottom: 'var(--space-2)' }}>Weight Distribution</h4>
        {Object.entries(current.parameters).map(([key, val]) => {
          if (key === 'rangeTolerance') return (
            <div key={key} className="review-row" style={{ fontSize: '0.82rem' }}>
              <span className="review-label">Range Tolerance</span>
              <span className="review-value">±{Math.round(val * 100)}%</span>
            </div>
          );
          return (
            <div key={key} className="review-row" style={{ fontSize: '0.82rem' }}>
              <span className="review-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
              <span className="review-value">{Math.round(val * 100)}%</span>
            </div>
          );
        })}
      </Card>

      <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-3)' }}>
        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
        Admin cannot secretly change algorithm weights. Every modification creates a versioned audit record.
      </p>

      {/* Version History */}
      {history.length > 1 && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <h3 className="section__title">Version History</h3>
          {history.slice().reverse().map((v, i) => (
            <div key={i} className="algo-version" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <span className="algo-version__tag">v{v.version}</span>
                <span className="text-xs text-secondary">{v.effectiveDate}</span>
              </div>
              <p className="text-xs">{v.changeSummary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
