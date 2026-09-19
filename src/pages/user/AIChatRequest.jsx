import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useBooking } from '../../contexts/BookingContext';
import { ArrowLeft, Send, Camera, MapPin, Navigation, ChevronRight } from 'lucide-react';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import Card from '../../components/ui/Card';
import './AIChatRequest.css';

/* ─── AI Response Templates ─── */
const SERVICE_MAP = {
  'tap': 'plumber', 'leak': 'plumber', 'pipe': 'plumber', 'plumb': 'plumber', 'drain': 'plumber', 'water': 'plumber',
  'switch': 'electrician', 'wire': 'electrician', 'light': 'electrician', 'fan': 'electrician', 'electric': 'electrician', 'socket': 'electrician',
  'paint': 'painter', 'wall': 'painter', 'color': 'painter',
  'door': 'carpenter', 'wood': 'carpenter', 'furniture': 'carpenter', 'cabinet': 'carpenter',
  'clean': 'cleaner', 'bathroom': 'cleaner', 'kitchen': 'cleaner', 'sofa': 'cleaner',
  'cook': 'domestic_helper', 'laundry': 'domestic_helper', 'maid': 'domestic_helper',
  'care': 'caregiver', 'elderly': 'caregiver', 'child': 'caregiver', 'patient': 'caregiver',
  'drive': 'driver', 'car': 'driver',
  'garden': 'gardener', 'plant': 'gardener', 'lawn': 'gardener', 'tree': 'gardener',
  'ac': 'technician', 'repair': 'technician', 'appliance': 'technician', 'tv': 'technician', 'computer': 'technician',
};

const SERVICE_LABELS = {
  plumber: 'Plumber', electrician: 'Electrician', painter: 'Painter',
  carpenter: 'Carpenter', cleaner: 'Cleaner', domestic_helper: 'Domestic Helper',
  caregiver: 'Caregiver', driver: 'Driver', gardener: 'Gardener', technician: 'Technician',
};

function detectService(text) {
  const lower = text.toLowerCase();
  for (const [keyword, service] of Object.entries(SERVICE_MAP)) {
    if (lower.includes(keyword)) return service;
  }
  return 'technician'; // fallback
}

/* ─── Flow Steps ───
   0: waiting for user input
   1: AI analyzing → shows structured request → asks photo
   2: photo decision made → asks date/time
   3: date/time set → asks location
   4: location set → shows review card
   5: user confirmed → navigate to matching
*/

export default function AIChatRequest() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { createRequest } = useBooking();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [flowStep, setFlowStep] = useState(0);
  const bottomRef = useRef(null);

  // ─── Extracted request data ───
  const [reqData, setReqData] = useState({
    service: '',
    description: '',
    photo: null,
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    locationType: '',
    house: '', street: '', city: '', state: '', pin: '',
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, flowStep]);

  const addUserMsg = (text) => {
    setMessages((prev) => [...prev, { role: 'user', text }]);
  };

  const addAiMsg = (text, delay = 800) => {
    return new Promise((resolve) => {
      setIsTyping(true);
      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'ai', text }]);
        setIsTyping(false);
        resolve();
      }, delay);
    });
  };

  // ─── Step 0: User describes problem ───
  const handleSend = async () => {
    if (!input.trim() || flowStep !== 0) return;
    const userText = input.trim();
    addUserMsg(userText);
    setInput('');

    const service = detectService(userText);
    const serviceLabel = SERVICE_LABELS[service] || service;

    setReqData((prev) => ({ ...prev, service, description: userText }));

    await addAiMsg(`I understand your problem. It sounds like you need a **${serviceLabel}**.`, 1200);
    await addAiMsg(`Here's what I understood:\n\n**Service:** ${serviceLabel}\n**Problem:** ${userText}`, 800);
    await addAiMsg('Would you like to add a photo of the problem? This helps the worker understand the issue better.', 600);

    setFlowStep(1);
  };

  // ─── Step 1: Photo decision ───
  const handlePhotoChoice = async (choice) => {
    if (choice === 'add') {
      addUserMsg('Yes, I want to add a photo');
      setReqData((prev) => ({ ...prev, photo: 'user_photo.jpg' }));
      await addAiMsg('📷 Photo attached! Great, this will help the worker.', 800);
    } else {
      addUserMsg('Skip photo');
      await addAiMsg('No problem! We can proceed without a photo.', 600);
    }
    await addAiMsg('When do you need this service? Please select a date and time.', 600);
    setFlowStep(2);
  };

  // ─── Step 2: Date/Time set ───
  const handleDateTimeConfirm = async () => {
    const dateObj = new Date(reqData.date);
    const dateStr = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    const [h, m] = reqData.time.split(':');
    const hour = parseInt(h);
    const timeStr = `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;

    addUserMsg(`${dateStr} at ${timeStr}`);
    await addAiMsg(`Great! Scheduled for ${dateStr} at ${timeStr}.`, 600);
    await addAiMsg('Now, where do you need the service? You can use your GPS location or enter it manually.', 600);
    setFlowStep(3);
  };

  // ─── Step 3: Location ───
  const handleLocationGPS = async () => {
    setReqData((prev) => ({ ...prev, locationType: 'gps' }));
    addUserMsg('Use my GPS location');
    await addAiMsg('📍 Location detected: Sector 22, Near Gurudwara, Chandigarh', 1000);
    showReview();
  };

  const handleLocationManualConfirm = async () => {
    const loc = [reqData.house, reqData.street, reqData.city].filter(Boolean).join(', ');
    setReqData((prev) => ({ ...prev, locationType: 'manual' }));
    addUserMsg(`Manual location: ${loc}`);
    await addAiMsg(`📍 Location set: ${loc}`, 800);
    showReview();
  };

  const showReview = async () => {
    await addAiMsg('Here\'s your complete service request. Please review and confirm to submit.', 600);
    setFlowStep(4);
  };

  // ─── Step 4: Confirm & Submit ───
  const handleConfirm = () => {
    createRequest(reqData);
    setFlowStep(5);
    navigate('/user/matching');
  };

  // ─── Manual location state ───
  const [showManualForm, setShowManualForm] = useState(false);

  const serviceLabel = SERVICE_LABELS[reqData.service] || reqData.service;
  const [h, m] = reqData.time.split(':');
  const hour = parseInt(h);
  const formattedTime = `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
  const formattedDate = reqData.date ? new Date(reqData.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' }) : '';

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="auth-page__back" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="chat-header__title">{t('askSahkaar')}</h1>
          <p className="chat-header__subtitle text-secondary">{t('describeYourProblem')}</p>
        </div>
      </div>

      <div className="chat-messages">
        {/* ─── Empty state suggestions ─── */}
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="text-secondary">{t('tellUsWhatHappened')}</p>
            <div className="chat-suggestions">
              <button className="chat-suggestion" onClick={() => setInput('Mere bathroom ka tap leak kar raha hai.')}>
                "Mere bathroom ka tap leak kar raha hai."
              </button>
              <button className="chat-suggestion" onClick={() => setInput('Two switches in my living room are not working.')}>
                "Two switches in my living room are not working."
              </button>
              <button className="chat-suggestion" onClick={() => setInput('I need help with painting my bedroom walls.')}>
                "I need help with painting my bedroom walls."
              </button>
            </div>
          </div>
        )}

        {/* ─── Messages ─── */}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble chat-bubble--${msg.role}`}>
            {msg.role === 'ai' && <span className="chat-bubble__label">Sahkaar AI</span>}
            <p className="chat-bubble__text" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
          </div>
        ))}

        {/* ─── Typing indicator ─── */}
        {isTyping && (
          <div className="chat-bubble chat-bubble--ai">
            <span className="chat-bubble__label">Sahkaar AI</span>
            <div className="dot-pulse"><span /><span /><span /></div>
          </div>
        )}

        {/* ─── Step 1: Photo choices ─── */}
        {flowStep === 1 && !isTyping && (
          <div className="chat-inline-actions animate-fade-in-up">
            <button className="chat-inline-btn" onClick={() => handlePhotoChoice('add')}>
              <Camera size={18} />
              <span>Add Photo</span>
            </button>
            <button className="chat-inline-btn chat-inline-btn--secondary" onClick={() => handlePhotoChoice('skip')}>
              <span>Skip</span>
            </button>
          </div>
        )}

        {/* ─── Step 2: Date & Time picker ─── */}
        {flowStep === 2 && !isTyping && (
          <div className="chat-inline-form animate-fade-in-up">
            <div className="chat-datetime-fields">
              <TextField
                label={t('date')} type="date" value={reqData.date}
                onChange={(v) => setReqData((p) => ({ ...p, date: v }))} name="ai-date"
              />
              <TextField
                label={t('time')} type="time" value={reqData.time}
                onChange={(v) => setReqData((p) => ({ ...p, time: v }))} name="ai-time"
              />
            </div>
            <Button fullWidth onClick={handleDateTimeConfirm}>{t('continue')}</Button>
          </div>
        )}

        {/* ─── Step 3: Location picker ─── */}
        {flowStep === 3 && !isTyping && !showManualForm && (
          <div className="chat-inline-actions animate-fade-in-up">
            <button className="chat-location-btn" onClick={handleLocationGPS}>
              <Navigation size={18} />
              <span>{t('useGpsLocation')}</span>
              <ChevronRight size={16} className="text-tertiary" />
            </button>
            <button className="chat-location-btn" onClick={() => setShowManualForm(true)}>
              <MapPin size={18} />
              <span>{t('enterLocationManually')}</span>
              <ChevronRight size={16} className="text-tertiary" />
            </button>
          </div>
        )}

        {/* ─── Step 3b: Manual location form ─── */}
        {flowStep === 3 && showManualForm && (
          <div className="chat-inline-form animate-fade-in-up">
            <TextField label={t('houseFlat')} value={reqData.house} onChange={(v) => setReqData((p) => ({ ...p, house: v }))} placeholder="42-B" name="ai-house" />
            <TextField label={t('streetArea')} value={reqData.street} onChange={(v) => setReqData((p) => ({ ...p, street: v }))} placeholder="Sector 22" name="ai-street" />
            <TextField label={t('city')} value={reqData.city} onChange={(v) => setReqData((p) => ({ ...p, city: v }))} placeholder="Chandigarh" name="ai-city" />
            <TextField label={t('state')} value={reqData.state} onChange={(v) => setReqData((p) => ({ ...p, state: v }))} placeholder="Chandigarh" name="ai-state" />
            <TextField label={t('pinCode')} value={reqData.pin} onChange={(v) => setReqData((p) => ({ ...p, pin: v }))} placeholder="160022" type="number" name="ai-pin" />
            <Button fullWidth onClick={handleLocationManualConfirm} disabled={!reqData.street || !reqData.city}>
              {t('confirmLocation')}
            </Button>
          </div>
        )}

        {/* ─── Step 4: Review card ─── */}
        {flowStep === 4 && !isTyping && (
          <div className="chat-review-card animate-fade-in-up">
            <Card className="review-card">
              <div className="review-row"><span className="review-label">{t('service')}</span><span className="review-value">{serviceLabel}</span></div>
              <div className="review-row"><span className="review-label">{t('description')}</span><span className="review-value">{reqData.description}</span></div>
              <div className="review-row"><span className="review-label">{t('photo')}</span><span className="review-value">{reqData.photo ? '📷 Attached' : 'None'}</span></div>
              <div className="review-row"><span className="review-label">{t('date')}</span><span className="review-value">{formattedDate}</span></div>
              <div className="review-row"><span className="review-label">{t('time')}</span><span className="review-value">{formattedTime}</span></div>
              <div className="review-row">
                <span className="review-label">{t('location')}</span>
                <span className="review-value">
                  {reqData.locationType === 'gps'
                    ? 'Sector 22, Near Gurudwara, Chandigarh'
                    : [reqData.house, reqData.street, reqData.city].filter(Boolean).join(', ')
                  }
                </span>
              </div>
            </Card>
            <Button fullWidth size="lg" onClick={handleConfirm}>
              Confirm & Submit Request
            </Button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ─── Input bar (only active at step 0) ─── */}
      <div className="chat-input-bar">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={flowStep === 0 ? t('tellUsWhatHappened') : 'AI is helping you...'}
          disabled={flowStep !== 0}
          aria-label="Type your message"
        />
        <button className="chat-send" onClick={handleSend} disabled={!input.trim() || flowStep !== 0} aria-label="Send">
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
