import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useBooking } from '../../contexts/BookingContext';
import { usePricing } from '../../contexts/PricingContext';
import { mockWorkers } from '../../data/mockData';
import {
  ArrowLeft, MapPin, CheckCircle2, AlertCircle,
  QrCode, CreditCard, ChevronRight, Shield,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { RatingDisplay, RatingInput } from '../../components/ui/Rating';
import Card from '../../components/ui/Card';
import Timeline from '../../components/ui/Timeline';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import TextField from '../../components/ui/TextField';
import './UserPages.css';

/* ═══════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════ */

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

function getLocationDisplay(loc) {
  if (!loc) return '';
  if (loc.type === 'gps') return loc.display || 'GPS Location';
  return [loc.house, loc.street, loc.city].filter(Boolean).join(', ');
}


/* ═══════════════════════════════════════════
   1. WORKER MATCHING
   ═══════════════════════════════════════════ */

export function WorkerMatching() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeRequest, getEligibleWorkers, selectWorker } = useBooking();
  const [finding, setFinding] = useState(true);
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const service = activeRequest?.service || 'plumber';
      const eligible = getEligibleWorkers(service);
      setWorkers(eligible);
      setFinding(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, [activeRequest, getEligibleWorkers]);

  if (finding) {
    return (
      <div className="page page--center page--no-nav">
        <div className="matching-loader">
          <div className="spinner spinner--lg" />
          <p className="matching-loader__text">{t('findingWorkers')}</p>
          <div className="dot-pulse"><span /><span /><span /></div>
        </div>
      </div>
    );
  }

  const handleSelectWorker = (worker) => {
    if (activeRequest) {
      selectWorker(activeRequest.id, worker.id);
    }
    navigate(`/user/worker/${worker.id}`);
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate('/user/home')} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('availableWorkers')}</h1>
        <span className="request-header__count">{workers.length} found</span>
      </div>

      <div className="workers-accepted-banner">
        <CheckCircle2 size={16} />
        <span>{workers.length} workers accepted your request</span>
      </div>

      <div className="workers-list">
        {workers.map((worker) => (
          <Card key={worker.id} className="worker-card stagger-item" onClick={() => handleSelectWorker(worker)}>
            <div className="worker-card__main">
              <Avatar name={worker.name} size={48} />
              <div className="worker-card__info">
                <h3 className="worker-card__name">{worker.name}</h3>
                {worker.certifications[activeRequest?.service || 'plumber'] && (
                  <span className="worker-card__cert">
                    <Shield size={12} /> {t('certified')} {t(activeRequest?.service || 'plumber')}
                  </span>
                )}
                <div className="worker-card__meta">
                  {worker.rating > 0 ? (
                    <>
                      <RatingDisplay value={worker.rating} size={14} />
                      <span className="text-secondary text-sm">{worker.reviewCount} {t('reviews')}</span>
                    </>
                  ) : (
                    <span className="text-secondary text-sm">{t('noRatingsYet')}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="worker-card__distance">
              <MapPin size={14} />
              <span>{worker.distance} {t('km')}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   2. WORKER PROFILE (User View)
   ═══════════════════════════════════════════ */

export function WorkerProfileView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const { activeRequest, selectWorker } = useBooking();
  const worker = mockWorkers[id] || mockWorkers['W10245'];

  const handleSelect = () => {
    if (activeRequest) {
      selectWorker(activeRequest.id, worker.id);
    }
    navigate('/user/confirm-booking');
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>
      <div className="worker-profile-header">
        <Avatar name={worker.name} size={80} />
        <h1 className="worker-profile__name">{worker.name}</h1>
        {worker.certifications[activeRequest?.service || worker.skills[0]] && (
          <span className="worker-card__cert">
            <Shield size={14} /> CERTIFIED {t(activeRequest?.service || worker.skills[0]).toUpperCase()}
          </span>
        )}
      </div>
      <div className="worker-profile-stats">
        <div className="stat-item">
          <span className="stat-value">{worker.rating > 0 ? worker.rating : '—'}</span>
          <span className="stat-label">{t('rating')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{worker.reviewCount}</span>
          <span className="stat-label">{t('reviews')}</span>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <span className="stat-value">{worker.serviceRadius}</span>
          <span className="stat-label">{t('km')} range</span>
        </div>
      </div>
      <div className="section">
        <h3 className="section__title">{t('skills')}</h3>
        <div className="subtype-list">
          {worker.skills.map((s) => (
            <span key={s} className="subtype-item subtype-item--selected">{t(s)}</span>
          ))}
        </div>
      </div>
      <div className="section">
        <h3 className="section__title">{t('baseLocation')}</h3>
        <p className="text-secondary">{worker.baseLocation}</p>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <Button fullWidth size="lg" onClick={handleSelect}>
          {t('selectWorker')}
        </Button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   3. CONFIRM BOOKING
   ═══════════════════════════════════════════ */

export function ConfirmBooking() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { activeRequest, confirmBooking: doConfirm } = useBooking();
  const { getApprovedPrice, getPriceBand } = usePricing();
  const worker = activeRequest?.workerId ? mockWorkers[activeRequest.workerId] : null;

  const approvedPrice = activeRequest ? getApprovedPrice(activeRequest.service) : 0;
  const band = activeRequest ? getPriceBand(activeRequest.service) : null;

  const handleConfirm = () => {
    if (activeRequest) {
      doConfirm(activeRequest.id, approvedPrice);
      navigate(`/user/bookings/${activeRequest.id}`);
    }
  };

  if (!activeRequest) {
    return (
      <div className="page page--no-nav page--center">
        <EmptyState title="No active request" description="Go back and create a service request." />
      </div>
    );
  }

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('confirmBooking')}</h1>
      </div>
      <Card className="review-card">
        {worker && (
          <div className="review-row">
            <span className="review-label">{t('worker')}</span>
            <span className="review-value">{worker.name}</span>
          </div>
        )}
        <div className="review-row">
          <span className="review-label">{t('service')}</span>
          <span className="review-value">{t(activeRequest.service)}</span>
        </div>
        <div className="review-row">
          <span className="review-label">{t('description')}</span>
          <span className="review-value">{activeRequest.description}</span>
        </div>
        <div className="review-row">
          <span className="review-label">{t('date')}</span>
          <span className="review-value">{formatDate(activeRequest.date)}</span>
        </div>
        <div className="review-row">
          <span className="review-label">{t('time')}</span>
          <span className="review-value">{formatTime(activeRequest.time)}</span>
        </div>
        <div className="review-row">
          <span className="review-label">{t('location')}</span>
          <span className="review-value">{getLocationDisplay(activeRequest.location)}</span>
        </div>
        <hr className="divider" />
        <div className="review-row">
          <span className="review-label font-semibold">{t('sahkaarApprovedBaseCharge')}</span>
          <span className="review-value font-bold currency">₹{approvedPrice}</span>
        </div>
        {band && (
          <p className="text-xs text-secondary" style={{ marginTop: 'var(--space-1)' }}>
            {t('effectiveFrom')}: {band.effectiveDate} • {t('workersParticipateInPricing')}
          </p>
        )}
      </Card>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <Button fullWidth size="lg" onClick={handleConfirm}>
          {t('confirmBooking')}
        </Button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   4. BOOKINGS LIST (Upcoming / Active / Completed)
   ═══════════════════════════════════════════ */

export function UserBookings() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getBookingsByStatus } = useBooking();
  const [tab, setTab] = useState('upcoming');

  const list = getBookingsByStatus(tab);

  return (
    <div className="page animate-fade-in">
      <h1 className="page-title">{t('myBookings')}</h1>
      <div className="tab-bar tab-bar--three">
        <button className={`tab-btn ${tab === 'upcoming' ? 'tab-btn--active' : ''}`} onClick={() => setTab('upcoming')}>
          {t('upcoming')}
        </button>
        <button className={`tab-btn ${tab === 'active' ? 'tab-btn--active' : ''}`} onClick={() => setTab('active')}>
          Active
        </button>
        <button className={`tab-btn ${tab === 'completed' ? 'tab-btn--active' : ''}`} onClick={() => setTab('completed')}>
          {t('completed')}
        </button>
      </div>
      {list.length === 0 ? (
        <EmptyState title={t('noBookingsYet')} description={t('noBookingsDesc')} />
      ) : (
        <div className="booking-list">
          {list.map((booking) => {
            const worker = booking.workerId ? mockWorkers[booking.workerId] : null;
            return (
              <Card key={booking.id} className="booking-card stagger-item" onClick={() => navigate(`/user/bookings/${booking.id}`)}>
                <div className="booking-card__top">
                  <h3 className="booking-card__service">{t(booking.service)}</h3>
                  <StatusBadge status={booking.status} size="sm" />
                </div>
                {worker && <p className="booking-card__worker text-secondary">{worker.name}</p>}
                <div className="booking-card__bottom">
                  <span className="text-sm text-secondary">
                    {formatDateShort(booking.date)} • {formatTime(booking.time)}
                  </span>
                  {booking.total > 0 && <span className="booking-card__price currency">₹{booking.total}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   5. BOOKING DETAIL — Live Tracking + Dual-Done
   ═══════════════════════════════════════════ */

export function BookingDetail() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const {
    getBooking, updateStatus, workerMarkDone, userMarkDone,
    getStatusIndex,
  } = useBooking();

  const booking = getBooking(id);
  const worker = booking?.workerId ? mockWorkers[booking.workerId] : null;

  // ─── Auto-progress simulation for demo ───
  useEffect(() => {
    if (!booking) return;

    const autoTransitions = {
      confirmed: { next: 'on_the_way', delay: 5000 },
      on_the_way: { next: 'arrived', delay: 6000 },
      arrived: { next: 'working', delay: 4000 },
      working: { next: null, delay: 0 }, // worker_done is manual
    };

    const transition = autoTransitions[booking.status];
    if (!transition || !transition.next) return;

    const timer = setTimeout(() => {
      updateStatus(booking.id, transition.next);
    }, transition.delay);

    return () => clearTimeout(timer);
  }, [booking?.status, booking?.id, updateStatus]);

  if (!booking) {
    return (
      <div className="page page--no-nav page--center">
        <EmptyState title="Booking not found" description="This booking doesn't exist." />
      </div>
    );
  }

  const statusLabels = [
    t('requestSubmitted'), t('workerSelected'), t('confirmed'),
    t('onTheWay'), t('arrived'), t('working'), 'Worker Done', t('serviceCompleted'),
  ];

  const currentStep = getStatusIndex(booking.status);
  const isActive = ['confirmed', 'on_the_way', 'arrived', 'working'].includes(booking.status);
  const isWorkerDone = booking.status === 'worker_done';
  const isCompleted = booking.status === 'completed';

  const handleSimulateWorkerDone = () => {
    workerMarkDone(booking.id);
  };

  const handleUserDone = () => {
    userMarkDone(booking.id);
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('booking')} {booking.id}</h1>
      </div>

      {/* ─── Booking Details Card ─── */}
      <div className="section">
        <Card>
          <div className="review-row"><span className="review-label">{t('service')}</span><span className="review-value">{t(booking.service)}</span></div>
          <div className="review-row"><span className="review-label">{t('description')}</span><span className="review-value">{booking.description}</span></div>
          {worker && <div className="review-row"><span className="review-label">{t('worker')}</span><span className="review-value">{worker.name}</span></div>}
          <div className="review-row"><span className="review-label">{t('date')}</span><span className="review-value">{formatDate(booking.date)}</span></div>
          <div className="review-row"><span className="review-label">{t('time')}</span><span className="review-value">{formatTime(booking.time)}</span></div>
          <div className="review-row"><span className="review-label">{t('location')}</span><span className="review-value">{getLocationDisplay(booking.location)}</span></div>
          {booking.photo && <div className="review-row"><span className="review-label">{t('photo')}</span><span className="review-value">📷 Attached</span></div>}
        </Card>
      </div>

      {/* ─── Status Timeline ─── */}
      <div className="section">
        <h3 className="section__title">{t('status')}</h3>
        <Timeline steps={statusLabels} currentStep={currentStep} />
      </div>

      {/* ─── Active tracking indicator ─── */}
      {isActive && (
        <div className="tracking-live-bar animate-fade-in-up">
          <div className="tracking-live-dot" />
          <span>
            {booking.status === 'confirmed' && 'Booking confirmed. Worker will be on the way soon.'}
            {booking.status === 'on_the_way' && `${worker?.name} is on the way to your location.`}
            {booking.status === 'arrived' && `${worker?.name} has arrived at your location.`}
            {booking.status === 'working' && 'Service is in progress...'}
          </span>
        </div>
      )}

      {/* ─── Simulate worker done (demo button) ─── */}
      {booking.status === 'working' && (
        <div className="status-action-bar animate-fade-in-up">
          <p className="text-secondary text-sm" style={{ marginBottom: 'var(--space-3)' }}>
            Demo: Simulate worker finishing the job
          </p>
          <Button fullWidth variant="secondary" onClick={handleSimulateWorkerDone}>
            Simulate Worker Done
          </Button>
        </div>
      )}

      {/* ─── Worker Done → User Verify & Mark Done ─── */}
      {isWorkerDone && (
        <div className="worker-done-banner animate-fade-in-up">
          <div className="worker-done-banner__icon">
            <AlertCircle size={24} />
          </div>
          <div className="worker-done-banner__content">
            <h3 className="worker-done-banner__title">Worker has marked the service as done</h3>
            <p className="worker-done-banner__desc text-secondary">
              Please verify the work and mark it as completed from your side.
            </p>
          </div>
          <Button fullWidth size="lg" onClick={handleUserDone} style={{ marginTop: 'var(--space-4)' }}>
            Verify & Mark as Done
          </Button>
        </div>
      )}

      {/* ─── Invoice (after completed) ─── */}
      {isCompleted && booking.total > 0 && (
        <div className="section">
          <h3 className="section__title">{t('invoice')}</h3>
          <Card>
            <div className="review-row"><span className="review-label">{t('sahkaarApprovedBaseCharge')}</span><span className="review-value currency">₹{booking.serviceCharge}</span></div>
            <div className="review-row">
              <span className="review-label">{t('materials')}</span>
              <span className="review-value currency">₹{booking.materials.reduce((s, m) => s + m.cost, 0)}</span>
            </div>
            <div className="review-row">
              <span className="review-label">{t('travel')} ({t('systemCalculated')})</span>
              <span className="review-value currency">₹{booking.travelCost}</span>
            </div>
            <hr className="divider" />
            <div className="review-row">
              <span className="review-label font-semibold">{t('total')}</span>
              <span className="review-value font-bold text-lg currency">₹{booking.total}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ─── Payment status or action ─── */}
      {isCompleted && booking.paymentStatus === 'paid' && (
        <div className="section">
          <div className="payment-success-inline">
            <CheckCircle2 size={20} className="text-success" />
            <span className="text-success font-semibold">{t('paymentSuccessful')} — ₹{booking.total}</span>
          </div>
        </div>
      )}

      {isCompleted && booking.paymentStatus === 'pending' && booking.total > 0 && (
        <Button fullWidth size="lg" onClick={() => navigate(`/user/payment/${booking.id}`)}>
          {t('payNow')} — ₹{booking.total}
        </Button>
      )}

      {/* ─── Rating display (if already rated) ─── */}
      {isCompleted && booking.rating && (
        <div className="section">
          <h3 className="section__title">{t('rating')}</h3>
          <RatingDisplay value={booking.rating} size={20} />
          {booking.review && <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>{booking.review}</p>}
        </div>
      )}

      {/* ─── Rate button (if completed + paid + not yet rated) ─── */}
      {isCompleted && booking.paymentStatus === 'paid' && !booking.rating && (
        <Button fullWidth variant="secondary" onClick={() => navigate(`/user/rate/${booking.id}`)}>
          {t('rateYourService')}
        </Button>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════
   6. INVOICE PAGE
   ═══════════════════════════════════════════ */

export function InvoicePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const { getBooking } = useBooking();

  const booking = getBooking(id);
  if (!booking) {
    return (
      <div className="page page--no-nav page--center">
        <EmptyState title="Invoice not found" description="This booking doesn't exist." />
      </div>
    );
  }

  const materialsCost = booking.materials.reduce((s, m) => s + m.cost, 0);

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">SAHKAAR {t('invoice')}</h1>
      </div>

      <div className="invoice-id text-secondary text-sm">
        {t('booking')}: {booking.id}
      </div>

      <Card>
        <div className="review-row"><span className="review-label">{t('sahkaarApprovedBaseCharge')}</span><span className="review-value currency">₹{booking.serviceCharge}</span></div>
        {booking.priceSource && <p className="text-xs text-secondary" style={{ paddingLeft: 'var(--space-2)' }}>☑ {t('priceLocked')} • {t('workersParticipateInPricing')}</p>}

        {booking.materials.length > 0 && (
          <>
            <div className="review-row"><span className="review-label font-medium">{t('materials')}</span><span className="review-value currency">₹{materialsCost}</span></div>
            {booking.materials.map((m, i) => (
              <div key={i} className="review-row review-row--indent">
                <span className="review-label text-sm text-secondary">{m.name} ×{m.quantity}</span>
                <span className="review-value text-sm currency">₹{m.cost}</span>
              </div>
            ))}
          </>
        )}

        <div className="review-row">
          <span className="review-label">{t('travel')} ({booking.travelDistance} {t('km')})</span>
          <span className="review-value currency">₹{booking.travelCost}</span>
        </div>
        <hr className="divider divider--strong" />
        <div className="review-row">
          <span className="review-label font-bold text-md">{t('total')}</span>
          <span className="review-value font-bold text-xl currency">₹{booking.total}</span>
        </div>
      </Card>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <Button fullWidth size="lg" onClick={() => navigate(`/user/payment/${booking.id}`)}>
          {t('payNow')} — ₹{booking.total}
        </Button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   7. PAYMENT PAGE — Pay Now + Sahkaar QR
   ═══════════════════════════════════════════ */

export function PaymentPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const { getBooking, recordPayment } = useBooking();

  const booking = getBooking(id);
  const [method, setMethod] = useState(null); // 'digital' | 'qr'
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!booking) {
    return (
      <div className="page page--no-nav page--center">
        <EmptyState title="Booking not found" description="This booking doesn't exist." />
      </div>
    );
  }

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      recordPayment(booking.id, method || 'digital');
      setProcessing(false);
      setSuccess(true);
    }, 2000);
  };

  if (success) {
    return (
      <div className="page page--no-nav page--center animate-scale-in">
        <div className="payment-success">
          <div className="payment-success__icon">
            <CheckCircle2 size={64} strokeWidth={1.5} />
          </div>
          <h1 className="payment-success__title">✓ {t('paymentSuccessful')}</h1>
          <p className="payment-success__amount currency">₹{booking.total}</p>
          <p className="text-secondary">{t('booking')} {booking.id}</p>
          <div className="payment-success__actions">
            {!booking.rating && (
              <Button onClick={() => navigate(`/user/rate/${booking.id}`)} style={{ marginTop: 'var(--space-4)' }}>
                {t('rateYourService')}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/user/home')} style={{ marginTop: 'var(--space-3)' }}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Payment method selection ───
  if (!method) {
    return (
      <div className="page page--no-nav animate-fade-in">
        <div className="request-header">
          <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="request-header__title">{t('payment')}</h1>
        </div>

        <div className="payment-amount-display">
          <span className="text-secondary">{t('total')}</span>
          <span className="payment-amount-value currency">₹{booking.total}</span>
        </div>

        <div className="payment-options">
          <button className="payment-option" onClick={() => setMethod('digital')}>
            <div className="payment-option__icon"><CreditCard size={24} /></div>
            <div className="payment-option__content">
              <h3>{t('payNow')}</h3>
              <p className="text-secondary text-sm">Digital payment</p>
            </div>
            <ChevronRight size={18} className="text-tertiary" />
          </button>

          <button className="payment-option" onClick={() => setMethod('qr')}>
            <div className="payment-option__icon"><QrCode size={24} /></div>
            <div className="payment-option__content">
              <h3>{t('showSahkaarQr')}</h3>
              <p className="text-secondary text-sm">Sahkaar-generated QR code</p>
            </div>
            <ChevronRight size={18} className="text-tertiary" />
          </button>
        </div>
      </div>
    );
  }

  // ─── Sahkaar QR display ───
  if (method === 'qr') {
    return (
      <div className="page page--no-nav animate-fade-in">
        <div className="request-header">
          <button className="auth-page__back" onClick={() => setMethod(null)} aria-label="Go back">
            <ArrowLeft size={22} />
          </button>
          <h1 className="request-header__title">Sahkaar QR</h1>
        </div>

        <div className="qr-payment">
          <div className="qr-code-container">
            <div className="qr-code-visual">
              <QrCode size={120} strokeWidth={1} />
            </div>
            <p className="qr-code-label">Sahkaar Payment QR</p>
          </div>
          <Card className="qr-details">
            <div className="review-row"><span className="review-label">{t('booking')}</span><span className="review-value">{booking.id}</span></div>
            <div className="review-row"><span className="review-label">{t('total')}</span><span className="review-value font-bold currency">₹{booking.total}</span></div>
          </Card>
          <p className="text-secondary text-sm" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>
            Show this QR to the worker to scan for payment
          </p>
          <div style={{ marginTop: 'var(--space-6)' }}>
            <Button fullWidth size="lg" onClick={handlePay}>
              Confirm Payment Received
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Digital payment ───
  return (
    <div className="page page--no-nav page--center">
      <div className="request-header" style={{ position: 'absolute', top: 'var(--space-4)', left: 'var(--space-4)', right: 'var(--space-4)' }}>
        <button className="auth-page__back" onClick={() => setMethod(null)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('payNow')}</h1>
      </div>
      <h1 className="text-2xl font-bold" style={{ marginBottom: 'var(--space-2)' }}>{t('total')}</h1>
      <p className="text-3xl font-bold currency" style={{ marginBottom: 'var(--space-8)' }}>₹{booking.total}</p>
      <Button fullWidth size="lg" onClick={handlePay} loading={processing}>
        {t('payNow')}
      </Button>
    </div>
  );
}


/* ═══════════════════════════════════════════
   8. RATE SERVICE
   ═══════════════════════════════════════════ */

export function RateService() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const { getBooking, addRating } = useBooking();
  const { addConsumerFeedback } = usePricing();

  const booking = getBooking(id);
  const worker = booking?.workerId ? mockWorkers[booking.workerId] : null;
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [priceSatisfaction, setPriceSatisfaction] = useState(0);
  const [affordability, setAffordability] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!booking) {
    return (
      <div className="page page--no-nav page--center">
        <EmptyState title="Booking not found" description="This booking doesn't exist." />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page page--no-nav page--center animate-scale-in">
        <CheckCircle2 size={48} className="text-success" />
        <h2 className="text-xl font-semibold" style={{ marginTop: 'var(--space-4)' }}>Thank you!</h2>
        <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>Your review helps workers improve their service.</p>
        <Button variant="secondary" onClick={() => navigate('/user/home')} style={{ marginTop: 'var(--space-6)' }}>
          Back to Home
        </Button>
      </div>
    );
  }

  const handleSubmit = () => {
    addRating(booking.id, rating, review);
    if (priceSatisfaction > 0) {
      addConsumerFeedback('U10482', booking.service, booking.id, priceSatisfaction, affordability || 'yes', false, '');
    }
    setSubmitted(true);
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('rateYourService')}</h1>
      </div>

      {worker && (
        <div className="rate-worker-info">
          <Avatar name={worker.name} size={56} />
          <h2 className="rate-worker-name">{worker.name}</h2>
          <p className="text-secondary text-sm">{t(booking.service)}</p>
        </div>
      )}

      <div className="rate-section">
        <p className="text-secondary text-md" style={{ marginBottom: 'var(--space-6)' }}>{t('howWasExperience')}</p>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-8)' }}>
          <RatingInput value={rating} onChange={setRating} size={40} />
        </div>
        <TextField multiline rows={3} value={review} onChange={setReview} placeholder={t('writeReview')} name="review" />
      </div>

      {/* ─── Pricing Feedback (optional) ─── */}
      <div className="section" style={{ marginTop: 'var(--space-6)' }}>
        <h3 className="section__title">{t('pricingFeedback')}</h3>
        <p className="text-xs text-secondary" style={{ marginBottom: 'var(--space-3)' }}>{t('pricingFeedbackOptional')}</p>
        <Card>
          <p className="text-sm font-medium" style={{ marginBottom: 'var(--space-3)' }}>{t('howWasPricing')}</p>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
            <RatingInput value={priceSatisfaction} onChange={setPriceSatisfaction} size={32} />
          </div>
          <p className="text-sm font-medium" style={{ marginBottom: 'var(--space-2)' }}>{t('wasServiceAffordable')}</p>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {['yes', 'somewhat', 'no'].map(opt => (
              <button
                key={opt}
                className={`filter-chip ${affordability === opt ? 'filter-chip--active' : ''}`}
                onClick={() => setAffordability(opt)}
                style={{ flex: 1, textTransform: 'capitalize', fontSize: '0.8rem', padding: 'var(--space-2)' }}
              >
                {t(opt)}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
        <Button fullWidth size="lg" onClick={handleSubmit} disabled={!rating}>
          {t('submitReview')}
        </Button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   9. USER PROFILE
   ═══════════════════════════════════════════ */

export function UserProfile() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { getUser, logout } = useAuth();
  const user = getUser();

  return (
    <div className="page animate-fade-in">
      <div className="profile-header">
        <Avatar name={user?.name} size={72} />
        <h1 className="profile-header__name">{user?.name}</h1>
        <p className="text-secondary text-sm">{t('userId')}: {user?.id}</p>
        <p className="text-secondary text-sm">{user?.mobile}</p>
      </div>
      <div className="settings-list">
        <button className="settings-item" onClick={() => navigate('/user/settings')}>
          <span>{t('settings')}</span>
          <span className="text-tertiary">›</span>
        </button>
        <button className="settings-item settings-item--danger" onClick={() => { logout(); navigate('/', { replace: true }); }}>
          <span>{t('logOut')}</span>
        </button>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════
   10. USER SETTINGS
   ═══════════════════════════════════════════ */

export function UserSettings() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'mr', label: 'मराठी' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'or', label: 'ଓଡ଼ିଆ' },
  ];

  const currentLang = languages.find(l => l.code === language) || languages[0];

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('settings')}</h1>
      </div>
      <div className="settings-list">
        <button className="settings-item" onClick={() => setShowLangPicker(!showLangPicker)}>
          <span>{t('language')}</span>
          <span className="text-tertiary">{currentLang.label} ›</span>
        </button>
        {showLangPicker && (
          <div className="lang-picker">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-picker__item ${language === lang.code ? 'lang-picker__item--active' : ''}`}
                onClick={() => { changeLanguage(lang.code); setShowLangPicker(false); }}
              >
                {lang.label}
                {language === lang.code && <span className="lang-picker__check">✓</span>}
              </button>
            ))}
          </div>
        )}
        <button className="settings-item"><span>{t('notifications')}</span><span className="text-tertiary">›</span></button>
        <div className="settings-item settings-item--no-hover">
          <span>{t('appearance')}</span>
          <div className="appearance-toggle">
            {['system', 'light', 'dark'].map((m) => (
              <button key={m} className={`appear-btn ${theme === m ? 'appear-btn--active' : ''}`} onClick={() => setTheme(m)}>
                {t(m)}
              </button>
            ))}
          </div>
        </div>
        <button className="settings-item"><span>{t('account')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item"><span>{t('privacy')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item"><span>{t('helpAndSupport')}</span><span className="text-tertiary">›</span></button>
      </div>
    </div>
  );
}

