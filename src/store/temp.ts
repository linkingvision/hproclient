import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTempStore = defineStore('temp', () => {
  const tempIP = ref<string>('');
  const setTempIP = (str: string) => {
    tempIP.value = str;
  }

  return {
    tempIP,
    setTempIP
  }
})