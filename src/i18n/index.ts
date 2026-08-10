import { createI18n } from 'vue-i18n'
import id from './id'
import en from './en'
import zh from './zh'

const i18n = createI18n({
  legacy: false,
  locale: 'id',
  fallbackLocale: 'en',
  messages: {
    id,
    en,
    zh
  }
})

export default i18n
