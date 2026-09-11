import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('mainStore', () => {
  // multilingual type
  const lang = ref<"en" | "zhcht" | "pt" | "es">('en');
  function changeLang(newLang: "en"  | "zhcht" | "pt" | "es") {
    console.log('changeLang =>', newLang)
    lang.value = newLang;
  }

  // theme
  type ThemeType = 'darkblue' | 'c-dark-theme' | false
  const darkMode = ref<ThemeType>('c-dark-theme')
  function setDarkMode(value: ThemeType) {
    darkMode.value = value;
  }

  // show/hide sidebar navigation
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

  // listen localStorage 
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
  // enable listenning
  const startListening = (): void => {
    window.addEventListener('storage', handleStorageChange)
  }

  // stop listenning
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