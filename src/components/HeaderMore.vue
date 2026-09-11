<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from '../store';

const store = useStore();

interface ThemeItem {
  label: string;
  value: 'c-dark-theme' | 'darkblue' | false;
}
const themeList: ThemeItem[] = [{
//   label: 'White',
//   value: false
// }, {
  label: 'Black',
  value: 'c-dark-theme'
// }, {
//   label: 'Dark Blue',
//   value: 'darkblue'
}]

const darkMode = computed(() => store.darkMode);

const addNewWindow = () => {
    window.ipcRenderer.send("open-new-win");
}
const changeDarkMode = (mode: 'darkblue' | 'c-dark-theme' | false) => {
  store.setDarkMode(mode);
}
const About = () => {
  console.log('about click')
  window.ipcRenderer.send('header-about-show')
}
// const Logout = () => {
//   window.ipcRenderer.send('hpro-log-out');
// }
onMounted(() => {
  // headerMoreRef.value
  document.body.style.backgroundColor = 'transparent';
})
</script>

<template>
  <div class="header-more">
    <div class="options">
      <div class="header-option" @click="addNewWindow">
        <i class="iconfont icon-jia"  style="margin-right: 5px;"></i>
        <span>New</span>
      </div>
      <el-popover placement="left" :width="120">
        <template #reference>
          <div class="header-option" style="font-size: 14px;">
            <span class="iconfont icon-zhuti"  style="margin-right: 5px;"></span>
            <span>Theme</span>
          </div>
        </template>
        <div class="theme-options">
          <div class="theme-item" :class="{active: item.value == darkMode}" v-for="item in themeList" :key="item.label" @click="changeDarkMode(item.value)">{{ item.label }}</div>
        </div>
      </el-popover>
      <div class="header-option" @click="About">
        <span class="iconfont icon-guanyu" style="margin-right: 5px;"></span>
        <span>About</span>
      </div>
      <!-- <div class="header-option" @click="Logout">Log out</div> -->
    </div>
  </div>
</template>

<style scoped lang="scss">
.header-more {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  .options {
    width: 125px;
    height: 100%;
    background-color: #3A3A3A;
    display: flex;
    flex-direction: column;
    padding: 12px 0;
    border-radius: 4px;
    .header-option {
      width: 100%;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding-left: 20px;
      cursor: pointer;
      &:hover {
        background-color: #555555;
      }
    }
  }
}
</style>