import { createContext, useContext, useState, useCallback } from 'react';
import { getString, getGreeting } from '../data/languages';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('sahkaar-language') || null;
  });

  const changeLanguage = useCallback((langCode) => {
    setLanguage(langCode);
    localStorage.setItem('sahkaar-language', langCode);
  }, []);

  const t = useCallback((key) => {
    return getString(language || 'en', key);
  }, [language]);

  const greeting = useCallback(() => {
    return getGreeting(language || 'en');
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, greeting }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
