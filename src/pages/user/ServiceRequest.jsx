import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { serviceSubTypes, serviceCategories } from '../../data/mockData';
import { ArrowLeft, Camera, Image, X, MapPin, Navigation, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Card from '../../components/ui/Card';
import './ServiceRequest.css';

const STEPS = ['service', 'description', 'photo', 'datetime', 'location', 'review'];

export default function ServiceRequest() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createRequest } = useBooking();
  const [searchParams] = useSearchParams();
  const preSelectedService = searchParams.get('service');

  const [step, setStep] = useState(preSelectedService ? 1 : 0);
  const [form, setForm] = useState({
    service: preSelectedService || '',
    subType: '',
    description: '',
    photo: null,
    date: '2026-09-18',
    time: '17:00',
    locationType: '',
    house: '',
    street: '',
    city: '',
    state: '',
    pin: '',
  });

  const update = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const currentService = serviceCategories.find(s => s.id === form.service);
  const subTypes = serviceSubTypes[form.service] || [];

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => {
    if (step === 0) navigate(-1);
    else setStep((s) => s - 1);
  };

  const handleSubmit = () => {
    createRequest(form);
    navigate('/user/matching');
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (t) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <div className="page page--no-nav animate-fade-in">
      <div className="request-header">
        <button className="auth-page__back" onClick={goBack} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <h1 className="request-header__title">{t('serviceRequest')}</h1>
        <span className="request-header__step">{step + 1}/{STEPS.length}</span>
      </div>

      {/* Step 0: Service & SubType Selection */}
      {step === 0 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">Select Service</h2>
          <div className="subtype-list">
            {serviceCategories.map((s) => (
              <button key={s.id} className={`subtype-item ${form.service === s.id ? 'subtype-item--selected' : ''}`} onClick={() => update('service')(s.id)}>
                {t(s.label)}
              </button>
            ))}
          </div>
          {form.service && subTypes.length > 0 && (
            <>
              <h3 className="request-step__subtitle">Type</h3>
              <div className="subtype-list">
                {subTypes.map((st) => (
                  <button key={st.id} className={`subtype-item ${form.subType === st.id ? 'subtype-item--selected' : ''}`} onClick={() => update('subType')(st.id)}>
                    {st.name}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="request-step__footer">
            <Button fullWidth size="lg" onClick={goNext} disabled={!form.service}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 1: Description */}
      {step === 1 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">{t('description')}</h2>
          <TextField
            multiline
            rows={4}
            value={form.description}
            onChange={update('description')}
            placeholder={t('describeTheProblem')}
            name="description"
          />
          <div className="request-step__footer">
            <Button fullWidth size="lg" onClick={goNext} disabled={!form.description}>{t('continue')}</Button>
          </div>
        </div>
      )}

      {/* Step 2: Photo */}
      {step === 2 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">{t('addPhoto')}</h2>
          {!form.photo ? (
            <div className="photo-options">
              <button className="photo-option" onClick={() => update('photo')('camera_photo.jpg')}>
                <Camera size={24} />
                <span>{t('takePhoto')}</span>
              </button>
              <button className="photo-option" onClick={() => update('photo')('gallery_photo.jpg')}>
                <Image size={24} />
                <span>{t('chooseFromGallery')}</span>
              </button>
            </div>
          ) : (
            <div className="photo-preview">
              <div className="photo-preview__placeholder">Photo attached</div>
              <button className="photo-preview__remove" onClick={() => update('photo')(null)}>
                <X size={16} /> Remove
              </button>
            </div>
          )}
          <div className="request-step__footer">
            <Button fullWidth size="lg" onClick={goNext}>{form.photo ? t('continue') : t('skip')}</Button>
          </div>
        </div>
      )}

      {/* Step 3: Date & Time */}
      {step === 3 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">{t('date')} & {t('time')}</h2>
          <div className="datetime-fields">
            <TextField label={t('date')} type="date" value={form.date} onChange={update('date')} name="date" />
            <TextField label={t('time')} type="time" value={form.time} onChange={update('time')} name="time" />
          </div>
          <div className="request-step__footer">
            <Button fullWidth size="lg" onClick={goNext} disabled={!form.date || !form.time}>{t('continue')}</Button>
          </div>
        </div>
      )}

      {/* Step 4: Location */}
      {step === 4 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">{t('serviceLocation')}</h2>
          {!form.locationType ? (
            <div className="location-options">
              <button className="location-option" onClick={() => update('locationType')('gps')}>
                <Navigation size={20} />
                <span>{t('useGpsLocation')}</span>
                <ChevronRight size={18} className="text-tertiary" />
              </button>
              <button className="location-option" onClick={() => update('locationType')('manual')}>
                <MapPin size={20} />
                <span>{t('enterLocationManually')}</span>
                <ChevronRight size={18} className="text-tertiary" />
              </button>
            </div>
          ) : form.locationType === 'gps' ? (
            <div className="gps-location">
              <div className="gps-map-placeholder">
                <MapPin size={32} />
                <p>Sector 22, Near Gurudwara, Chandigarh</p>
              </div>
              <div className="request-step__footer">
                <Button fullWidth size="lg" onClick={goNext}>{t('confirmLocation')}</Button>
              </div>
            </div>
          ) : (
            <div className="manual-location">
              <TextField label={t('houseFlat')} value={form.house} onChange={update('house')} placeholder="42-B" name="house" />
              <TextField label={t('streetArea')} value={form.street} onChange={update('street')} placeholder="Sector 22, Near Gurudwara" name="street" />
              <TextField label={t('city')} value={form.city} onChange={update('city')} placeholder="Chandigarh" name="city" />
              <TextField label={t('state')} value={form.state} onChange={update('state')} placeholder="Chandigarh" name="state" />
              <TextField label={t('pinCode')} value={form.pin} onChange={update('pin')} placeholder="160022" type="number" name="pin" />
              <div className="request-step__footer">
                <Button fullWidth size="lg" onClick={goNext} disabled={!form.street || !form.city}>{t('confirmLocation')}</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <div className="request-step animate-fade-in-up">
          <h2 className="request-step__title">{t('serviceRequest')}</h2>
          <Card className="review-card">
            <div className="review-row">
              <span className="review-label">{t('service')}</span>
              <span className="review-value">{currentService ? t(currentService.label) : form.service}</span>
            </div>
            {form.subType && (
              <div className="review-row">
                <span className="review-label">Type</span>
                <span className="review-value">{subTypes.find(s => s.id === form.subType)?.name}</span>
              </div>
            )}
            <div className="review-row">
              <span className="review-label">{t('description')}</span>
              <span className="review-value">{form.description}</span>
            </div>
            <div className="review-row">
              <span className="review-label">{t('photo')}</span>
              <span className="review-value">{form.photo ? 'Attached' : 'None'}</span>
            </div>
            <div className="review-row">
              <span className="review-label">{t('date')}</span>
              <span className="review-value">{formatDate(form.date)}</span>
            </div>
            <div className="review-row">
              <span className="review-label">{t('time')}</span>
              <span className="review-value">{formatTime(form.time)}</span>
            </div>
            <div className="review-row">
              <span className="review-label">{t('location')}</span>
              <span className="review-value">
                {form.locationType === 'gps' ? 'Sector 22, Near Gurudwara, Chandigarh' : `${form.house}, ${form.street}, ${form.city}`}
              </span>
            </div>
          </Card>
          <div className="request-step__footer">
            <Button fullWidth size="lg" onClick={handleSubmit}>{t('confirmRequest')}</Button>
          </div>
        </div>
      )}
    </div>
  );
}
