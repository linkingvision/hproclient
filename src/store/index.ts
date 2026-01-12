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
  const darkMode = ref<ThemeType>(false)
  function setDarkMode(value: ThemeType) {
    darkMode.value = value;
  }

  // 侧边栏导航显示/隐藏
  const sidebarShow = ref<boolean>(false)
  function setSidebarShow(flag: boolean) {
    sidebarShow.value = flag;
  }

  return {
    lang,
    changeLang,
    darkMode,
    setDarkMode,
    sidebarShow,
    setSidebarShow
  }
}, {
  persist: true
})