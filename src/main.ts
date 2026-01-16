import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { router } from "./router";
import './assets/scss/style.scss'
import './assets/icon/iconfont.js'
import './assets/icon/iconfont.css'
import '@imengyu/vue3-context-menu/lib/vue3-context-menu.css'
import ContextMenu from '@imengyu/vue3-context-menu'
import pinia from './store/pinia';
import i18n from './static/i18n';


createApp(App).use(ElementPlus)
  .use(ContextMenu)
  .use(router)
  .use(pinia)
  .use(i18n)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
