import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('main', () => {
  // 多语言类型
  const lang = ref<"en" | "zhchs" | "zhcht" | "pt" | "es">('en');
  function changeLang(newLang: "en" | "zhchs" | "zhcht" | "pt" | "es") {
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
    setLiveviewrtc1
  }
}, {
  persist: {
    key: 'main',
    storage: localStorage,
  }
})