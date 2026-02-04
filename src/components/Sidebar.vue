<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useStore } from '../store';
import LogoBlackEN from '../assets/image/HPro-black-en.svg'
import LogoWhiteEN from '../assets/image/HPro-white-en.svg'

const store = useStore();


const activeIndex = ref<string>('');

const gotoPage = (page: string) => {
  // router.push(page)
  if (page == 'sitelogin') {
    console.log(page)
    window.ipcRenderer.send('sidebar-switch-tab', page);
  }
}

console.log('SideBar')
onUnmounted(() => {
    console.log('sideBar')
})
</script>

<template>
  <div class="side-bar" ref="sidebarRef">
    <div class="sidebar-logo" v-if="store.darkMode">
      <img :src="store.lang === 'en' ? LogoBlackEN : ''" alt="">
    </div>
    <div class="sidebar-logo" v-else>
      <img :src="store.lang === 'en' ? LogoWhiteEN : ''" alt="">
    </div>
    <el-menu
      :default-active="activeIndex"
      class="el-menu-vertical-demo"
      close-on-click-outside
    >
      <el-menu-item index="/View" @click="() => gotoPage('system')">
        <i class="iconfont icon-xitong"></i>
        <span>{{ 'System' }}</span>
      </el-menu-item>
      <el-menu-item index="/SiteLogin" @click="() => gotoPage('sitelogin')">
        <i class="iconfont icon-dengru"></i>
        <span>{{ 'Site Login' }}</span>
      </el-menu-item>
    </el-menu>
  </div>
</template>

<style scoped lang="scss">
.side-bar {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  transition: 0.3s;
  z-index: 10000;
  .sidebar-logo {
    width: 100%;
    height: 56px;
    display: flex;
    // justify-content: center;
    padding-left: 20px;
    align-items: center;
    img {
      height: 20px;
    }
  }
  .el-menu {
    background-color: transparent;
    border: none;
    i {
        margin-right: 10px;
        font-size: 20px;
    }
  }
}
.sidebar-hide {
  left: -256px;
}
</style>