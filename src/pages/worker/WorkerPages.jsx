import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { mockBookings, mockWorkers, mockReviews } from '../../data/mockData';
import { ArrowLeft, MapPin, Check, Navigation, CheckCircle2, Plus, Minus, Clock, Shield } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import StatusBadge from '../../components/ui/StatusBadge';
import { RatingDisplay } from '../../components/ui/Rating';
import EmptyState from '../../components/ui/EmptyState';
import Timeline from '../../components/ui/Timeline';
import './WorkerPages.css';

/* ── Worker Home Dashboard ── */
export function WorkerHome() {
  const { getUser } = useAuth();
  const { t, greeting } = useLanguage();
  const navigate = useNavigate();
  const worker = getUser();

  const todaysJobs = mockBookings.filter(b => b.workerId === worker?.id && b.status !== 'completed').length;
  const pendingRequests = 3;

  return (
    <div className="page animate-fade-in">
      <div className="user-home__header">
        <h1 className="user-home__greeting">{greeting()}, {worker?.name?.split(' ')[0]}</h1>
      </div>

      <div className="worker-stats-grid">
        <Card className="worker-stat">
          <span className="worker-stat__label">{t('verification')}</span>
          <StatusBadge status={worker?.verified ? 'verified' : 'pending'} />
        </Card>
        <Card className="worker-stat">
          <span className="worker-stat__label">{t('todaysJobs')}</span>
          <span className="worker-stat__value">{todaysJobs}</span>
        </Card>
        <Card className="worker-stat">
          <span className="worker-stat__label">{t('pendingRequests')}</span>
          <span className="worker-stat__value">{pendingRequests}</span>
        </Card>
        <Card className="worker-stat">
          <span className="worker-stat__label">{t('todaysEarnings')}</span>
          <span className="worker-stat__value currency">₹800</span>
        </Card>
      </div>

      <div className="worker-availability-toggle">
        <span className="font-medium">{t('availability')}</span>
        <button className={`avail-toggle avail-toggle--active`} onClick={() => {}}>
          <span className="avail-toggle__dot" />
          <span>{t('available')}</span>
        </button>
      </div>

      <div className="section">
        <h2 className="section__title">{t('newRequests')}</h2>
        <Card className="incoming-request" onClick={() => navigate('/worker/requests/new')}>
          <div className="booking-card__top">
            <h3 className="booking-card__service">{t('plumber')}</h3>
            <span className="text-sm text-secondary">4.2 {t('km')}</span>
          </div>
          <p className="text-secondary text-sm">Bathroom tap is continuously leaking.</p>
          <p className="text-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>18 Sept • 5:00 PM</p>
        </Card>
      </div>
    </div>
  );
}

/* ── Incoming Requests ── */
export function IncomingRequests() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const requests = [
    { id: 'R001', service: 'plumber', desc: 'Bathroom tap is continuously leaking.', date: '18 Sept', time: '5:00 PM', distance: 4.2 },
    { id: 'R002', service: 'electrician', desc: 'Fan not working in bedroom.', date: '19 Sept', time: '10:00 AM', distance: 2.1 },
    { id: 'R003', service: 'plumber', desc: 'Kitchen sink pipe broken.', date: '20 Sept', time: '3:00 PM', distance: 5.5 },
  ];

  return (
    <div className="page animate-fade-in">
      <h1 className="page-title">{t('requests')}</h1>
      {requests.map((req) => (
        <Card key={req.id} className="incoming-request" onClick={() => navigate('/worker/requests/new')} style={{ marginBottom: 'var(--space-3)' }}>
          <div className="booking-card__top">
            <h3 className="booking-card__service">{t(req.service)}</h3>
            <span className="text-sm text-secondary">{req.distance} {t('km')}</span>
          </div>
          <p className="text-secondary text-sm">{req.desc}</p>
          <p className="text-sm text-secondary" style={{ marginTop: 'var(--space-2)' }}>{req.date} • {req.time}</p>
        </Card>
      ))}
    </div>
  );
}

/* ── Request Detail ── */
export function RequestDetail() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  if (accepted) {
    return (
      <div className="page page--no-nav page--center animate-scale-in">
        <CheckCircle2 size={48} className="text-success" />
        <h2 className="text-xl font-semibold" style={{ marginTop: 'var(--space-4)' }}>Request Accepted</h2>
        <p className="text-secondary" style={{ marginTop: 'var(--space-2)' }}>Waiting for the customer to confirm you.</p>
        <Button variant="secondary" onClick={() => navigate('/worker/home')} style={{ marginTop: 'var(--space-6)' }}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('newServiceRequest')}</h1>
      </div>
      <Card>
        <h2 className="text-lg font-semibold" style={{ marginBottom: 'var(--space-4)' }}>{t('plumber')}</h2>
        <div className="review-row"><span className="review-label">{t('problem')}</span><span className="review-value">Bathroom tap is continuously leaking.</span></div>
        <div className="review-row"><span className="review-label">{t('date')}</span><span className="review-value">18 September</span></div>
        <div className="review-row"><span className="review-label">{t('time')}</span><span className="review-value">5:00 PM</span></div>
        <div className="review-row"><span className="review-label">{t('location')}</span><span className="review-value">Sector 22, Chandigarh</span></div>
        <div className="review-row"><span className="review-label">{t('distance')}</span><span className="review-value">4.2 {t('km')}</span></div>
        <div className="review-row"><span className="review-label">{t('photo')}</span><span className="review-value text-secondary">View</span></div>
      </Card>
      <div className="request-actions">
        <Button fullWidth size="lg" onClick={() => setAccepted(true)}>{t('accept')}</Button>
        <Button fullWidth size="lg" variant="secondary" onClick={() => navigate(-1)}>{t('reject')}</Button>
      </div>
    </div>
  );
}

/* ── Active Job ── */
export function ActiveJob() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentStatus, setCurrentStatus] = useState(2); // confirmed
  const statusSteps = [t('requestSubmitted'), t('workerSelected'), t('confirmed'), t('onTheWay'), t('arrived'), t('working'), t('done')];

  const statusButtons = [
    { label: t('onTheWay'), next: 3, icon: Navigation },
    { label: t('arrived'), next: 4, icon: MapPin },
    { label: t('working'), next: 5, icon: Clock },
    { label: t('markDone'), next: 6, icon: Check },
  ];

  const availableBtn = statusButtons.find(b => b.next === currentStatus + 1);

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('activeJob')}</h1>
      </div>
      <Card style={{ marginBottom: 'var(--space-4)' }}>
        <div className="review-row"><span className="review-label">{t('customer')}</span><span className="review-value">Amit Sharma</span></div>
        <div className="review-row"><span className="review-label">{t('service')}</span><span className="review-value">Plumbing</span></div>
        <div className="review-row"><span className="review-label">{t('problem')}</span><span className="review-value">Bathroom tap leaking</span></div>
        <div className="review-row"><span className="review-label">{t('date')}</span><span className="review-value">18 September, 5:00 PM</span></div>
      </Card>

      <Button variant="secondary" fullWidth style={{ marginBottom: 'var(--space-5)' }} icon={Navigation}>
        {t('navigate')}
      </Button>

      <div className="section">
        <h3 className="section__title">{t('status')}</h3>
        <Timeline steps={statusSteps} currentStep={currentStatus} />
      </div>

      {currentStatus < 6 && availableBtn && (
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
          <Button fullWidth size="lg" onClick={() => {
            if (currentStatus + 1 === 6) {
              navigate('/worker/materials/B102938');
            } else {
              setCurrentStatus(currentStatus + 1);
            }
          }} icon={availableBtn.icon}>
            {availableBtn.label}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Worker Jobs ── */
export function WorkerJobs() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState('active');

  const activeJobs = mockBookings.filter(b => b.status !== 'completed');
  const completedJobs = mockBookings.filter(b => b.status === 'completed');
  const list = tab === 'active' ? activeJobs : completedJobs;

  return (
    <div className="page animate-fade-in">
      <h1 className="page-title">{t('jobs')}</h1>
      <div className="tab-bar">
        <button className={`tab-btn ${tab === 'active' ? 'tab-btn--active' : ''}`} onClick={() => setTab('active')}>Active</button>
        <button className={`tab-btn ${tab === 'completed' ? 'tab-btn--active' : ''}`} onClick={() => setTab('completed')}>{t('completed')}</button>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No jobs" description={tab === 'active' ? "You don't have any active jobs." : 'No completed jobs yet.'} />
      ) : (
        <div className="booking-list">
          {list.map((booking) => (
            <Card key={booking.id} className="booking-card" onClick={() => navigate(`/worker/jobs/${booking.id}`)}>
              <div className="booking-card__top">
                <h3 className="booking-card__service">{t(booking.service)}</h3>
                <StatusBadge status={booking.status} size="sm" />
              </div>
              <p className="text-secondary text-sm">{booking.description}</p>
              <div className="booking-card__bottom">
                <span className="text-sm text-secondary">{new Date(booking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                {booking.total > 0 && <span className="booking-card__price currency">₹{booking.total}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Materials Entry ── */
export function MaterialsEntry() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [materials, setMaterials] = useState([
    { name: 'Tap Washer', quantity: 2, cost: 40 },
    { name: 'Flexible Pipe', quantity: 1, cost: 230 },
  ]);

  const total = materials.reduce((s, m) => s + m.cost, 0);

  const addMaterial = () => setMaterials([...materials, { name: '', quantity: 1, cost: 0 }]);
  const removeMaterial = (i) => setMaterials(materials.filter((_, idx) => idx !== i));
  const updateMaterial = (i, field, value) => {
    const updated = [...materials];
    updated[i] = { ...updated[i], [field]: field === 'name' ? value : Number(value) || 0 };
    setMaterials(updated);
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('materialsUsed')}</h1>
      </div>
      <div className="materials-list">
        {materials.map((m, i) => (
          <div key={i} className="material-row animate-fade-in-up">
            <div className="material-fields">
              <TextField label={t('itemName')} value={m.name} onChange={(v) => updateMaterial(i, 'name', v)} placeholder="Item name" name={`item-${i}`} />
              <div className="material-row-split">
                <TextField label={t('quantity')} value={String(m.quantity)} onChange={(v) => updateMaterial(i, 'quantity', v)} type="number" name={`qty-${i}`} />
                <TextField label={t('actualCost')} value={String(m.cost)} onChange={(v) => updateMaterial(i, 'cost', v)} type="number" name={`cost-${i}`} />
              </div>
            </div>
            {materials.length > 1 && (
              <button className="material-remove" onClick={() => removeMaterial(i)} aria-label="Remove material">
                <Minus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" icon={Plus} onClick={addMaterial}>{t('addMaterial')}</Button>

      <div className="materials-total">
        <span>{t('materialsTotal')}</span>
        <span className="font-bold currency">₹{total}</span>
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
        <Button fullWidth size="lg" onClick={() => navigate('/worker/travel/B102938')}>{t('submit')}</Button>
      </div>
    </div>
  );
}

/* ── Travel Cost ── */
export function TravelCostPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('travelCost')}</h1>
      </div>
      <Card>
        <p className="text-sm text-secondary" style={{ marginBottom: 'var(--space-4)' }}>{t('systemCalculated')}</p>
        <div className="review-row"><span className="review-label">{t('distance')}</span><span className="review-value">4.2 {t('km')}</span></div>
        <div className="review-row"><span className="review-label">{t('travelCost')}</span><span className="review-value currency font-semibold">₹80</span></div>
      </Card>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
        <Button fullWidth size="lg" onClick={() => navigate('/worker/invoice/B102938')}>{t('continue')}</Button>
      </div>
    </div>
  );
}

/* ── Worker Invoice View ── */
export function WorkerInvoice() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [paid, setPaid] = useState(false);

  if (paid) {
    return (
      <div className="page page--no-nav page--center animate-scale-in">
        <CheckCircle2 size={48} className="text-success" />
        <h2 className="text-xl font-semibold" style={{ marginTop: 'var(--space-4)' }}>{t('payment')}</h2>
        <p className="text-success font-semibold" style={{ marginTop: 'var(--space-2)' }}>✓ {t('paid')}</p>
        <p className="text-secondary currency" style={{ marginTop: 'var(--space-1)' }}>₹650</p>
        <Button variant="secondary" onClick={() => navigate('/worker/home')} style={{ marginTop: 'var(--space-6)' }}>
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">SAHKAAR {t('invoice')}</h1>
      </div>
      <Card>
        <div className="review-row"><span className="review-label">{t('sahkaarApprovedBaseCharge')}</span><span className="review-value currency">₹300</span></div>
        <div className="review-row"><span className="review-label">{t('materials')}</span><span className="review-value currency">₹270</span></div>
        <div className="review-row"><span className="review-label">{t('travel')}</span><span className="review-value currency">₹80</span></div>
        <hr className="divider divider--strong" />
        <div className="review-row"><span className="review-label font-bold text-md">{t('total')}</span><span className="review-value font-bold text-xl currency">₹650</span></div>
      </Card>
      
      {!showQR ? (
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
          <Button fullWidth size="lg" onClick={() => setShowQR(true)}>{t('showSahkaarQr')}</Button>
        </div>
      ) : (
        <div className="qr-section animate-scale-in">
          <h3 className="text-md font-semibold" style={{ textAlign: 'center', marginBottom: 'var(--space-4)' }}>Sahkaar Payment QR</h3>
          <div className="qr-placeholder">
            <div className="qr-code-mock">
              {Array.from({length: 64}).map((_, i) => (
                <div key={i} className={`qr-cell ${Math.random() > 0.4 ? 'qr-cell--dark' : ''}`} />
              ))}
            </div>
          </div>
          <p className="text-sm text-secondary" style={{ textAlign: 'center', marginTop: 'var(--space-3)' }}>Booking B102938 • ₹650</p>
          <Button fullWidth variant="success" size="lg" onClick={() => setPaid(true)} style={{ marginTop: 'var(--space-4)' }}>
            Confirm Payment Received
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Earnings ── */
export function WorkerEarnings() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const worker = mockWorkers['W10245'];

  return (
    <div className="page animate-fade-in">
      <h1 className="page-title">{t('earnings')}</h1>
      <div className="earnings-summary">
        <Card className="earnings-card">
          <span className="earnings-card__label">{t('totalServiceEarnings')}</span>
          <span className="earnings-card__value currency">₹{worker.totalEarnings.toLocaleString('en-IN')}</span>
        </Card>
        <Card className="earnings-card">
          <span className="earnings-card__label">{t('thisMonth')}</span>
          <span className="earnings-card__value currency">₹{worker.monthEarnings.toLocaleString('en-IN')}</span>
        </Card>
      </div>
      <div className="section">
        <h3 className="section__title">Recent Transactions</h3>
        <Card>
          <div className="review-row"><span className="review-label">{t('sahkaarApprovedBaseCharge')}</span><span className="review-value currency">₹300</span></div>
          <div className="review-row"><span className="review-label">{t('materialReimbursement')}</span><span className="review-value currency text-secondary">₹270</span></div>
          <div className="review-row"><span className="review-label">{t('travelReimbursement')}</span><span className="review-value currency text-secondary">₹80</span></div>
          <hr className="divider" />
          <div className="review-row"><span className="review-label font-semibold">{t('transactionTotal')}</span><span className="review-value font-bold currency">₹650</span></div>
        </Card>
      </div>
    </div>
  );
}

/* ── Welfare & Insurance ── */
export function WorkerWelfare() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const worker = mockWorkers['W10245'];

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('welfareAndInsurance')}</h1>
      </div>
      <Card>
        <div className="review-row"><span className="review-label">{t('insurancePlan')}</span><span className="review-value">{worker.insurance.plan}</span></div>
        <div className="review-row"><span className="review-label">{t('coverage')}</span><span className="review-value currency">₹{worker.insurance.coverage.toLocaleString('en-IN')}</span></div>
        <div className="review-row"><span className="review-label">{t('monthlyPremium')}</span><span className="review-value currency">₹{worker.insurance.premium}</span></div>
        <div className="review-row"><span className="review-label">{t('status')}</span><StatusBadge status={worker.insurance.status.toLowerCase()} /></div>
      </Card>
      <div className="settings-list" style={{ marginTop: 'var(--space-5)' }}>
        <button className="settings-item"><span>{t('paymentHistory')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item"><span>{t('claims')}</span><span className="text-tertiary">›</span></button>
      </div>
    </div>
  );
}

/* ── Availability ── */
export function WorkerAvailability() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const worker = mockWorkers['W10245'];
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('availability')}</h1>
      </div>
      <div className="availability-list">
        {days.map((day) => {
          const schedule = worker.availability[day];
          return (
            <div key={day} className="availability-row">
              <span className="availability-day">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
              {schedule.off ? (
                <span className="text-secondary font-medium">{t('off')}</span>
              ) : (
                <span className="availability-time">{schedule.start.replace(/^0/, '')} – {schedule.end.replace(/^0/, '')}</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
        <Button fullWidth variant="secondary">{t('save')}</Button>
      </div>
    </div>
  );
}

/* ── Service Area ── */
export function WorkerServiceArea() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const worker = mockWorkers['W10245'];

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('serviceArea')}</h1>
      </div>
      <Card>
        <div className="review-row"><span className="review-label">{t('baseLocation')}</span><span className="review-value">{worker.baseLocation}</span></div>
        <div className="review-row"><span className="review-label">{t('serviceRadius')}</span><span className="review-value">{worker.serviceRadius} {t('km')}</span></div>
      </Card>
      <div style={{ marginTop: 'auto', paddingTop: 'var(--space-4)' }}>
        <Button fullWidth variant="secondary">{t('save')}</Button>
      </div>
    </div>
  );
}

/* ── Worker Profile ── */
export function WorkerProfile() {
  const { getUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const worker = getUser();

  return (
    <div className="page animate-fade-in">
      <div className="profile-header">
        <Avatar name={worker?.name} size={72} />
        <h1 className="profile-header__name">{worker?.name}</h1>
        <p className="text-secondary text-sm">{t('workerId')}: {worker?.id}</p>
        <StatusBadge status={worker?.verified ? 'verified' : 'pending'} />
      </div>

      {worker?.rating > 0 && (
        <div className="section">
          <div className="worker-profile-stats">
            <div className="stat-item">
              <span className="stat-value">{worker.rating}</span>
              <span className="stat-label">{t('rating')}</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-value">{worker.reviewCount}</span>
              <span className="stat-label">{t('reviews')}</span>
            </div>
          </div>
        </div>
      )}

      <div className="settings-list">
        <button className="settings-item" onClick={() => navigate('/worker/availability')}><span>{t('availability')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item" onClick={() => navigate('/worker/service-area')}><span>{t('serviceArea')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item" onClick={() => navigate('/worker/welfare')}><span>{t('welfareAndInsurance')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item" onClick={() => navigate('/worker/schemes')}><span>{t('governmentSchemes') || 'Government Schemes'}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item" onClick={() => navigate('/worker/pricing')}><span>{t('pricingParticipation') || 'Pricing Participation'}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item" onClick={() => navigate('/worker/settings')}><span>{t('settings')}</span><span className="text-tertiary">›</span></button>
        <button className="settings-item settings-item--danger" onClick={() => { logout(); navigate('/', { replace: true }); }}>
          <span>{t('logOut')}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Worker Settings ── */
export function WorkerSettings() {
  const { t, language, changeLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
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

