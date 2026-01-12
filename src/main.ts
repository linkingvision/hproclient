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
import './utils/ipc'
import { createPinia } from 'pinia';
import piniaPluginPersistedstate  from 'pinia-plugin-persistedstate'
import i18n from './static/i18n';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)

createApp(App).use(ElementPlus)
  .use(ContextMenu)
  .use(router)
  .use(pinia)
  .use(i18n)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
