import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import fr from './locales/fr/translation.json'
import de from './locales/de/translation.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      de: { translation: de },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  })
