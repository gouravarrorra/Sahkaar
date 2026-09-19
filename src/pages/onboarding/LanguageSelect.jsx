import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { languages } from '../../data/languages';
import { Check } from 'lucide-react';
import Button from '../../components/ui/Button';
import './LanguageSelect.css';

export default function LanguageSelect() {
  const navigate = useNavigate();
  const { language, changeLanguage } = useLanguage();
  const [selected, setSelected] = useState(language || null);
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [typingDone, setTypingDone] = useState(false);
  const fullText = 'Select your language';
  const charIndex = useRef(0);

  useEffect(() => {
    if (language) {
      // If language already selected, skip to auth
      navigate('/auth', { replace: true });
      return;
    }
    
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (charIndex.current < fullText.length) {
          setTypedText(fullText.slice(0, charIndex.current + 1));
          charIndex.current++;
        } else {
          clearInterval(interval);
          setTypingDone(true);
        }
      }, 55);
      return () => clearInterval(interval);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (selected) {
      changeLanguage(selected);
      navigate('/auth');
    }
  };

  return (
    <div className="language-page">
      <div className="language-page__top">
        <h1 className="language-page__brand">Sahkaar</h1>
        <div className="language-page__prompt">
          <span className="language-page__typed">{typedText}</span>
          {showCursor && <span className="typewriter-cursor" />}
        </div>
      </div>

      <div className={`language-page__list ${typingDone ? 'language-page__list--visible' : ''}`}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`language-option ${selected === lang.code ? 'language-option--selected' : ''}`}
            onClick={() => setSelected(lang.code)}
            aria-label={`Select ${lang.name}`}
            aria-pressed={selected === lang.code}
          >
            <span className="language-option__name">{lang.nativeName}</span>
            <span className="language-option__english">{lang.name}</span>
            {selected === lang.code && (
              <span className="language-option__check">
                <Check size={18} strokeWidth={2.5} />
              </span>
            )}
          </button>
        ))}
      </div>

      <div className={`language-page__footer ${typingDone ? 'language-page__footer--visible' : ''}`}>
        <Button
          fullWidth
          size="lg"
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
