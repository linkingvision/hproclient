<script setup lang="ts">
  

import { onMounted, watch, onUnmounted } from "vue";
import { useStore } from "./store";
import { setupIPCListeners, destroyIPCListeners } from './utils/ipc'
import { useSiteInfo } from "./store/site-info";


const store = useStore();
const siteStore = useSiteInfo();

let prevClass: string | null = null;
const updateBodyTheme = (theme: string) => {
  console.log('updateBodyTheme =>', theme);
  const body = document.body;
  if (prevClass && body.classList.contains(prevClass)) {
    body.classList.remove(prevClass)
  }
  if (theme) {
    body.classList.add(theme);
    prevClass = theme;
  }
  // else {
  //   body.classList.add('c-light-theme');
  //   prevClass = 'c-light-theme'
  // }
}
watch(() => store.darkMode, (newVal: any) => {
    updateBodyTheme(newVal)
    console.log('darkMode =>', newVal)
}, { immediate: true })
onMounted(() => {
  // updateBodyTheme(store.darkMode)
  console.log(store.darkMode, store.lang)
  setupIPCListeners()
})
onUnmounted(() => {
  destroyIPCListeners();
})
</script>

<template>
  <RouterView />
</template>

<style></style>
