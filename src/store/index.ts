import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('mainStore', () => {
  // 多语言类型
  const lang = ref<"en" | "zhchs" | "zhcht" | "pt" | "es">('en');
  function changeLang(newLang: "en" | "zhchs" | "zhcht" | "pt" | "es") {
    console.log('changeLang =>', newLang)
    lang.value = newLang;
  }

  // 主题
  type ThemeType = 'darkblue' | 'c-dark-theme' | false
  const darkMode = ref<ThemeType>('c-dark-theme')
  function setDarkMode(value: ThemeType) {
    darkMode.value = value;
  }

  // 侧边栏导航显示/隐藏
  const sidebarShow = ref<boolean>(false)
  function setSidebarShow(flag: boolean) {
    sidebarShow.value = flag;
  }

  const liveviewrtc = ref<string>('WS');
  function setLiveviewrtc(value: string) {
    liveviewrtc.value = value;
  }

  const liveviewrtc1 = ref<string>('RTC');
  function setLiveviewrtc1(value: string) {
    liveviewrtc1.value = value;
  }

  // 监听 localStorage 变化
  const storageKey = 'mainStore';
  const handleStorageChange = (event: StorageEvent): void => {
    if (event.key === storageKey && event.newValue) {
      try {
        const storedData = JSON.parse(event.newValue)
        lang.value = storedData.lang
        darkMode.value = storedData.darkMode
        sidebarShow.value = storedData.sidebarShow
        liveviewrtc.value = storedData.liveviewrtc
        liveviewrtc1.value = storedData.liveviewrtc1
      } catch (error) {
        console.error('Failed to parse localStorage data:', error)
      }
    }
  }
  // 启动监听
  const startListening = (): void => {
    window.addEventListener('storage', handleStorageChange)
  }

  // 停止监听
  const stopListening = (): void => {
    window.removeEventListener('storage', handleStorageChange)
  }

  return {
    lang,
    changeLang,
    darkMode,
    setDarkMode,
    sidebarShow,
    setSidebarShow,
    liveviewrtc,
    setLiveviewrtc,
    liveviewrtc1,
    setLiveviewrtc1,
    startListening,
    stopListening
  }
}, {
  persist: {
    key: 'mainStore',
    storage: localStorage,
  }
})