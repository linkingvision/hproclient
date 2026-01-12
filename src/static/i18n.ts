import { createI18n } from "vue-i18n";
import LangEN from './lang/en.json'
import LangZHCHS from './lang/zh.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    'en': LangEN,
    'zhchs': LangZHCHS,
  },
  runtimeOnly: false
})

export default i18n;