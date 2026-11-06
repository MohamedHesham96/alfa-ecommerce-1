'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import arMessages from '../public/locales/ar.json';
import enMessages from '../public/locales/en.json';

const BUNDLES = { ar: arMessages, en: enMessages };
const SUPPORTED_LANGUAGES = ['ar', 'en'];

const LanguageContext = createContext({
  locale: 'ar',
  setLocale: () => {},
  t: (key) => key,
  isLanguageReady: true,
});

export const LanguageProvider = ({ children }) => {
  // Render Arabic on the server and on the first client paint. This keeps the
  // SEO-visible HTML translated instead of exposing translation keys, and
  // avoids a hydration mismatch when the visitor later switches language.
  const [locale, setLocale] = useState('ar');
  const [languageReady, setLanguageReady] = useState(false);

  useEffect(() => {
    let savedLang = null;

    try {
      savedLang = localStorage.getItem('lang');
    } catch (error) {
      console.error('Unable to read saved language:', error);
    }

    // Arabic is the canonical server-rendered language. Do not auto-switch to
    // the browser language: that would replace already-rendered Arabic content
    // after hydration, causing layout shifts and inconsistent SEO content.
    if (SUPPORTED_LANGUAGES.includes(savedLang)) {
      setLocale(savedLang);
    }
    setLanguageReady(true);
  }, []);

  useEffect(() => {
    // Never persist the temporary Arabic first-paint value before the saved
    // preference has been read. In React StrictMode (or any remount before the
    // state update commits) that could overwrite `en` with `ar` on navigation.
    if (!languageReady) return;
    try {
      localStorage.setItem('lang', locale);
    } catch (error) {
      console.error('Unable to save language:', error);
    }
  }, [languageReady, locale]);

  const messages = BUNDLES[locale] || BUNDLES.ar;

  const t = (key) => {
    if (!key) return '';
    return messages[key] ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        t,
        isLanguageReady: true,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
