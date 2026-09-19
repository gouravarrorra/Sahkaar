import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Phone, Mail, ArrowLeft, Loader } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import './AuthForms.css';

const API = 'http://localhost:4000/api';

// ═══════════════════════════════════════════
// USER LOGIN — Dual method: Gmail + Phone OTP
// ═══════════════════════════════════════════

export function UserLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [method, setMethod] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpHint, setOtpHint] = useState('');

  const handleSendOtp = async () => {
    setLoading(true);
    setErrorMsg('');
    setOtpHint('');

    try {
      const endpoint = method === 'email'
        ? '/auth/user/email/send-otp'
        : '/auth/user/phone/send-otp';

      const body = method === 'email'
        ? { email }
        : { mobile };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setOtpSent(true);
        setOtpHint('OTP sent! Check your email inbox (or spam folder).');
      } else {
        setErrorMsg(data.error || 'Failed to send OTP');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = method === 'email'
        ? '/auth/user/email/verify-otp'
        : '/auth/user/phone/verify-otp';

      const body = method === 'email'
        ? { email, otp, language }
        : { mobile, otp, language };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        login('user', data.data.user.id, data.data.token, data.data.user);
        navigate('/user/home', { replace: true });
      } else {
        setErrorMsg(data.error || 'Verification failed');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOtpSent(false);
    setOtp('');
    setErrorMsg('');
    setOtpHint('');
  };

  const switchMethod = (m) => {
    setMethod(m);
    resetForm();
    setEmail('');
    setMobile('');
  };

  const canSendOtp = method === 'email' ? email.includes('@') : mobile.length >= 10;

  return (
    <div className="auth-page">
      <button className="auth-page__back" onClick={() => navigate('/auth')} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>

      <div className="auth-page__top">
        <h1 className="auth-page__title">{t('login')}</h1>
        <p className="auth-page__subtitle text-secondary">Welcome back to Sahkaar</p>
      </div>

      {/* Method Tabs */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${method === 'email' ? 'auth-tab--active' : ''}`}
          onClick={() => switchMethod('email')}
          type="button"
        >
          <Mail size={18} />
          <span>Gmail</span>
        </button>
        <button
          className={`auth-tab ${method === 'phone' ? 'auth-tab--active' : ''}`}
          onClick={() => switchMethod('phone')}
          type="button"
        >
          <Phone size={18} />
          <span>Phone</span>
        </button>
      </div>

      <div className="auth-page__form">
        {/* Input Field */}
        {method === 'email' ? (
          <TextField
            label="Email Address"
            value={email}
            onChange={(v) => { setEmail(v); setErrorMsg(''); }}
            placeholder="yourname@gmail.com"
            type="email"
            name="email"
            icon={Mail}
            disabled={otpSent}
          />
        ) : (
          <TextField
            label={t('mobileNumber')}
            value={mobile}
            onChange={(v) => { setMobile(v); setErrorMsg(''); }}
            placeholder="+91 98765 43210"
            type="tel"
            name="mobile"
            icon={Phone}
            disabled={otpSent}
          />
        )}

        {/* OTP Flow */}
        {!otpSent ? (
          <Button fullWidth size="lg" onClick={handleSendOtp} disabled={!canSendOtp || loading}>
            {loading ? <><Loader size={18} className="spin" /> Sending...</> : t('sendOtp')}
          </Button>
        ) : (
          <>
            {otpHint && <p className="auth-otp-hint">{otpHint}</p>}
            <TextField
              label={t('otp')}
              value={otp}
              onChange={(v) => { setOtp(v); setErrorMsg(''); }}
              placeholder="Enter 6-digit OTP"
              type="number"
              name="otp"
            />
            <Button fullWidth size="lg" onClick={handleVerifyOtp} disabled={otp.length < 4 || loading}>
              {loading ? <><Loader size={18} className="spin" /> Verifying...</> : t('verifyOtp')}
            </Button>
            <button className="auth-resend" onClick={() => { resetForm(); }} type="button">
              ← Change {method === 'email' ? 'email' : 'number'} or resend OTP
            </button>
          </>
        )}

        {/* Error */}
        {errorMsg && <p className="auth-error">{errorMsg}</p>}
      </div>

      <p className="auth-page__switch">
        Don't have an account? <Link to="/auth/user/register" className="auth-page__link">Register</Link>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// USER REGISTER — also dual method with OTP
// ═══════════════════════════════════════════

export function UserRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, language } = useLanguage();

  const [method, setMethod] = useState('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = input, 2 = otp
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [otpHint, setOtpHint] = useState('');

  const handleSendOtp = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = method === 'email'
        ? '/auth/user/email/send-otp'
        : '/auth/user/phone/send-otp';

      const body = method === 'email'
        ? { email, name }
        : { mobile, name };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        setStep(2);
        setOtpHint('OTP sent! Check your email inbox (or spam folder).');
      } else {
        setErrorMsg(data.error || 'Failed to send OTP');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const endpoint = method === 'email'
        ? '/auth/user/email/verify-otp'
        : '/auth/user/phone/verify-otp';

      const body = method === 'email'
        ? { email, otp, language }
        : { mobile, otp, language };

      const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        login('user', data.data.user.id, data.data.token, data.data.user);
        navigate('/user/home', { replace: true });
      } else {
        setErrorMsg(data.error || 'Verification failed');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const switchMethod = (m) => {
    setMethod(m);
    setStep(1);
    setOtp('');
    setErrorMsg('');
    setOtpHint('');
  };

  const canSend = name.length >= 2 && (method === 'email' ? email.includes('@') : mobile.length >= 10);

  return (
    <div className="auth-page">
      <button className="auth-page__back" onClick={() => navigate('/auth')} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>

      <div className="auth-page__top">
        <h1 className="auth-page__title">{t('register')}</h1>
        <p className="auth-page__subtitle text-secondary">Create your Sahkaar account</p>
      </div>

      {/* Method Tabs */}
      <div className="auth-tabs">
        <button
          className={`auth-tab ${method === 'email' ? 'auth-tab--active' : ''}`}
          onClick={() => switchMethod('email')}
          type="button"
        >
          <Mail size={18} />
          <span>Gmail</span>
        </button>
        <button
          className={`auth-tab ${method === 'phone' ? 'auth-tab--active' : ''}`}
          onClick={() => switchMethod('phone')}
          type="button"
        >
          <Phone size={18} />
          <span>Phone</span>
        </button>
      </div>

      <div className="auth-page__form">
        <TextField label={t('name')} value={name} onChange={setName} placeholder="Amit Sharma" name="name" required disabled={step === 2} />

        {method === 'email' ? (
          <TextField label="Email Address" value={email} onChange={setEmail} placeholder="yourname@gmail.com" type="email" name="email" icon={Mail} disabled={step === 2} />
        ) : (
          <TextField label={t('mobileNumber')} value={mobile} onChange={setMobile} placeholder="+91 98765 43210" type="tel" name="mobile" icon={Phone} disabled={step === 2} />
        )}

        {step === 1 ? (
          <Button fullWidth size="lg" onClick={handleSendOtp} disabled={!canSend || loading}>
            {loading ? <><Loader size={18} className="spin" /> Sending...</> : t('sendOtp')}
          </Button>
        ) : (
          <>
            {otpHint && <p className="auth-otp-hint">{otpHint}</p>}
            <TextField label={t('otp')} value={otp} onChange={(v) => { setOtp(v); setErrorMsg(''); }} placeholder="Enter 6-digit OTP" type="number" name="otp" />
            <Button fullWidth size="lg" onClick={handleVerifyAndRegister} disabled={otp.length !== 6 || loading}>
              {loading ? <><Loader size={18} className="spin" /> Creating account...</> : t('register')}
            </Button>
            <button className="auth-resend" onClick={() => { setStep(1); setOtp(''); setErrorMsg(''); setOtpHint(''); }} type="button">
              ← Back to edit details
            </button>
          </>
        )}

        {errorMsg && <p className="auth-error">{errorMsg}</p>}
      </div>

      <p className="auth-page__switch">
        Already have an account? <Link to="/auth/user/login" className="auth-page__link">Log In</Link>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// WORKER LOGIN (unchanged — password-based)
// ═══════════════════════════════════════════

export function WorkerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/auth/worker/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login('worker', data.data.worker.id, data.data.token, data.data.worker);
        navigate('/worker/home', { replace: true });
      } else {
        setErrorMsg(data.error || 'Invalid credentials');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-page__back" onClick={() => navigate('/auth')} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>
      <div className="auth-page__top">
        <h1 className="auth-page__title">{t('login')}</h1>
        <p className="auth-page__subtitle text-secondary">Welcome back, Worker</p>
      </div>
      <div className="auth-page__form">
        <TextField label={t('mobileNumber')} value={email} onChange={setEmail} placeholder="9876543210" name="mobile" icon={Phone} />
        <TextField label={t('password')} value={password} onChange={setPassword} placeholder="Enter password" type="password" name="password" />
        {errorMsg && <p className="auth-error">{errorMsg}</p>}
        <Button fullWidth size="lg" onClick={handleLogin} disabled={!email || !password || loading}>
          {loading ? <><Loader size={18} className="spin" /> Logging in...</> : t('login')}
        </Button>
      </div>
      <p className="auth-page__switch">
        Don't have an account? <Link to="/auth/worker/register" className="auth-page__link">Register</Link>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// WORKER REGISTER
// ═══════════════════════════════════════════

export function WorkerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', mobile: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));
  const isValid = form.name && form.mobile.length >= 10 && form.email && form.password && form.password === form.confirmPassword;

  const handleRegister = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/auth/worker/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          mobile: form.mobile,
          email: form.email,
          password: form.password,
          communityId: 'COOP-MH-001',
          skills: ['SVC001'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        login('worker', data.data.worker.id, data.data.token, data.data.worker);
        navigate('/worker/home', { replace: true });
      } else {
        setErrorMsg(data.error || 'Registration failed');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-page__back" onClick={() => navigate('/auth')} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>
      <div className="auth-page__top">
        <h1 className="auth-page__title">{t('register')}</h1>
        <p className="auth-page__subtitle text-secondary">Join the Sahkaar cooperative</p>
      </div>
      <div className="auth-page__form">
        <TextField label={t('name')} value={form.name} onChange={update('name')} placeholder="Ravi Kumar" name="name" required />
        <TextField label={t('mobileNumber')} value={form.mobile} onChange={update('mobile')} placeholder="+91 87654 32109" type="tel" name="mobile" icon={Phone} required />
        <TextField label="Email" value={form.email} onChange={update('email')} placeholder="ravi.kumar@gmail.com" name="email" required />
        <TextField label={t('password')} value={form.password} onChange={update('password')} placeholder="Create password" type="password" name="password" required />
        <TextField label="Confirm Password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder="Confirm password" type="password" name="confirmPassword" required error={form.confirmPassword && form.password !== form.confirmPassword ? 'Passwords do not match' : ''} />
        {errorMsg && <p className="auth-error">{errorMsg}</p>}
        <Button fullWidth size="lg" onClick={handleRegister} disabled={!isValid || loading}>
          {loading ? <><Loader size={18} className="spin" /> Registering...</> : t('register')}
        </Button>
      </div>
      <p className="auth-page__switch">
        Already have an account? <Link to="/auth/worker/login" className="auth-page__link">Log In</Link>
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════

export function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`${API}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        login('admin', data.data.admin.id, data.data.token, data.data.admin);
        navigate('/admin/schemes', { replace: true });
      } else {
        setErrorMsg(data.error || 'Invalid credentials');
      }
    } catch {
      setErrorMsg('Network error. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="auth-page__back" onClick={() => navigate('/auth')} aria-label="Go back">
        <ArrowLeft size={22} />
      </button>
      <div className="auth-page__top">
        <h1 className="auth-page__title">Admin {t('login')}</h1>
        <p className="auth-page__subtitle text-secondary">SAHKAAR Cooperative Administration</p>
      </div>
      <div className="auth-page__form">
        <TextField label="Email" value={email} onChange={setEmail} placeholder="admin@sahkaar.coop" name="email" />
        <TextField label={t('password')} value={password} onChange={setPassword} placeholder="Enter password" type="password" name="password" />
        {errorMsg && <p className="auth-error">{errorMsg}</p>}
        <Button fullWidth size="lg" onClick={handleLogin} disabled={!email || !password || loading}>
          {loading ? <><Loader size={18} className="spin" /> Logging in...</> : t('login')}
        </Button>
      </div>
    </div>
  );
}
