import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePricing, proposalReasons } from '../../contexts/PricingContext';
import { serviceCategories } from '../../data/mockData';
import {
  ArrowLeft, TrendingUp, CheckCircle2, AlertTriangle, Clock, Shield, History
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import '../../admin/styles/Pricing.css';

export default function WorkerPriceProposal() {
  const navigate = useNavigate();
  const { getUser } = useAuth();
  const { t } = useLanguage();
  const { getPriceBand, submitProposal, getMyProposals } = usePricing();
  const worker = getUser();
  const workerId = worker?.id || 'W10245';

  const [selectedService, setSelectedService] = useState('');
  const [proposedPrice, setProposedPrice] = useState('');
  const [reasonId, setReasonId] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const band = selectedService ? getPriceBand(selectedService) : null;
  const myProposals = getMyProposals(workerId);

  const priceNum = parseInt(proposedPrice) || 0;
  const rangeStatus = band
    ? priceNum >= band.minimum && priceNum <= band.maximum
      ? 'within_range'
      : priceNum > band.maximum
        ? 'above_range'
        : 'below_range'
    : null;

  const handleSubmit = () => {
    if (!selectedService || !priceNum || !reasonId) return;
    submitProposal(workerId, selectedService, priceNum, reasonId, explanation);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="page page--no-nav page--center animate-scale-in">
        <CheckCircle2 size={48} className="text-success" />
        <h2 className="text-xl font-semibold" style={{ marginTop: 'var(--space-4)' }}>
          {t('proposalSubmitted') || 'Proposal Submitted'}
        </h2>
        <p className="text-secondary text-sm" style={{ marginTop: 'var(--space-2)', textAlign: 'center', maxWidth: 280 }}>
          Your proposal will be reviewed by the Pricing Review Panel. You will be notified of the outcome.
        </p>
        {rangeStatus === 'above_range' && (
          <p className="text-xs" style={{ marginTop: 'var(--space-3)', color: 'var(--color-warning)', textAlign: 'center', maxWidth: 280 }}>
            Your proposal is above the fair range. An exception request has been created for independent review.
          </p>
        )}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button variant="secondary" onClick={() => { setSubmitted(false); setSelectedService(''); setProposedPrice(''); setReasonId(''); setExplanation(''); }}>
            New Proposal
          </Button>
          <Button onClick={() => navigate('/worker/home')}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('pricingParticipation') || 'Pricing Participation'}</h1>
      </div>

      {/* Governance Notice */}
      <Card style={{ marginBottom: 'var(--space-4)', background: 'var(--bg-secondary)' }}>
        <p className="text-xs text-secondary">
          <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
          {t('workersParticipateInPricing') || 'Workers participate in pricing.'}
          {' '}Your proposal will be reviewed alongside objective cost data and consumer feedback.
          No individual worker can unilaterally determine the final service price.
        </p>
      </Card>

      {/* Toggle */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <Button variant={!showHistory ? 'primary' : 'ghost'} size="sm" onClick={() => setShowHistory(false)} fullWidth>
          <TrendingUp size={14} style={{ marginRight: 4 }} /> New Proposal
        </Button>
        <Button variant={showHistory ? 'primary' : 'ghost'} size="sm" onClick={() => setShowHistory(true)} fullWidth>
          <History size={14} style={{ marginRight: 4 }} /> My History
        </Button>
      </div>

      {showHistory ? (
        /* ─── Proposal History ─── */
        <div>
          {myProposals.length === 0 ? (
            <EmptyState title="No Proposals" description="You haven't submitted any pricing proposals yet." />
          ) : (
            myProposals.slice().reverse().map(p => (
              <Card key={p.id} className={`proposal-card proposal-card--${p.withinRange?.replace('_range', '')}`}>
                <div className="proposal-card__header">
                  <span className="proposal-card__service" style={{ textTransform: 'capitalize' }}>{p.serviceId.replace(/_/g, ' ')}</span>
                  <span className="proposal-card__price currency">₹{p.proposedPrice}</span>
                </div>
                <div className="proposal-card__meta">
                  <span>Ref: ₹{p.currentReference}</span>
                  <StatusBadge status={p.status} />
                  <span>{new Date(p.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-2)' }}>
                  {proposalReasons.find(r => r.id === p.reasonId)?.label || p.reasonId}
                </p>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* ─── New Proposal Form ─── */
        <div className="price-proposal-form">
          {/* Service Selection */}
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              {t('selectService') || 'Select Service'}
            </label>
            <select
              className="reason-select"
              value={selectedService}
              onChange={e => { setSelectedService(e.target.value); setProposedPrice(''); }}
            >
              <option value="">Choose a service...</option>
              {serviceCategories
                .filter(s => worker?.skills?.includes(s.id) || true)
                .map(s => (
                  <option key={s.id} value={s.id}>{s.id.replace(/_/g, ' ')}</option>
                ))
              }
            </select>
          </div>

          {/* Current Price Display */}
          {band && (
            <Card className="price-proposal-current">
              <span className="price-proposal-current__label">{t('currentApprovedPrice') || 'Current SAHKAAR Approved Price'}</span>
              <span className="price-proposal-current__value currency">₹{band.reference}</span>
              <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-2)' }}>
                Fair Range: ₹{band.minimum} — ₹{band.maximum}
              </p>
            </Card>
          )}

          {/* Proposed Price */}
          <TextField
            label={t('proposedPrice') || 'Proposed Price (₹)'}
            value={proposedPrice}
            onChange={setProposedPrice}
            type="number"
            placeholder="e.g. 320"
            name="proposed-price"
          />

          {/* Live Range Indicator */}
          {band && priceNum > 0 && (
            <div className={`range-indicator range-indicator--${rangeStatus?.replace('_range', '')}`}>
              {rangeStatus === 'within_range' && <><CheckCircle2 size={14} /> Within Fair Range</>}
              {rangeStatus === 'above_range' && <><AlertTriangle size={14} /> Above Fair Range — Exception Required</>}
              {rangeStatus === 'below_range' && <><Clock size={14} /> Below Fair Range</>}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-sm font-medium" style={{ display: 'block', marginBottom: 'var(--space-2)' }}>
              {t('reasonForChange') || 'Reason for Price Change'}
            </label>
            <select className="reason-select" value={reasonId} onChange={e => setReasonId(e.target.value)}>
              <option value="">Select reason...</option>
              {proposalReasons.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Explanation */}
          <TextField
            label={t('supportingExplanation') || 'Supporting Explanation / Evidence'}
            value={explanation}
            onChange={setExplanation}
            multiline
            rows={3}
            placeholder="Describe why this price change is justified..."
            name="explanation"
          />

          {/* Submit */}
          <Button
            fullWidth
            size="lg"
            onClick={handleSubmit}
            disabled={!selectedService || !priceNum || !reasonId}
          >
            {t('submitProposal') || 'Submit Proposal'}
          </Button>
        </div>
      )}

      <div className="governance-disclaimer">
        <Shield size={12} style={{ display: 'inline', marginRight: 4 }} />
        {t('workersParticipateInPricing') || 'Workers participate in pricing.'}
        {' '}Final price is determined through governed review.
      </div>
    </div>
  );
}
