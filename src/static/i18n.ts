import { createI18n } from "vue-i18n";
import LangEN from './lang/en.json'
import LangZhCHS from './lang/zh.json';
import LangZhCHT from './lang/zh-tw.json'
import LangPT from './lang/pt.json'
import LangES from './lang/es.json'

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: {
    'en': LangEN,
    'zhchs': LangZhCHS,
    'zhcht': LangZhCHT,
    'pt': LangPT,
    'es': LangES,
  },
  runtimeOnly: false
})

export default i18n;