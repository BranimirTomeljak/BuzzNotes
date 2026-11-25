// Hermes on Android has no Intl.PluralRules, which i18next needs for Croatian plural forms.
import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hr from './hr';
import en from './en';

const LANGUAGE_KEY = '@buzznotes/language';

i18n.use(initReactI18next).init({
  resources: {
    hr: { translation: hr },
    en: { translation: en },
  },
  lng: 'hr',
  fallbackLng: 'hr',
  interpolation: {
    escapeValue: false,
  },
});

export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved && (saved === 'hr' || saved === 'en')) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // Use default
  }
}

export async function setLanguage(lang: 'hr' | 'en') {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {
    // Ignore storage error
  }
}

export default i18n;
