<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from '../store';
import LogoBlackEN from '../assets/image/HPro-black-en.svg'
import LogoWhiteEN from '../assets/image/HPro-white-en.svg'

const store = useStore();
const route = useRoute();


const activeIndex = ref<string>('');

// const sidebarRef = ref<HTMLElement | null>(null)
// const handleClickOutside = (e: MouseEvent) => {
//   console.log('handleClickOutside =>', e)
//   const target = e.target as HTMLElement;
//   if (sidebarRef.value && !sidebarRef.value.contains(target)) {
//     store.setSidebarShow(false) // 隐藏侧边栏
//   }
// }

// const getCurrentRouter = () => {
//   const fullPath = route.fullPath;
//   const parts = fullPath.split('/').filter(Boolean);
//   activeIndex.value = '/' + (parts[0] || '')
// }
const gotoPage = (page: string) => {
  // router.push(page)
}

// const show = computed(() => store.sidebarShow);
// watch(show, (newVal) => {
//   console.log('sidebarShow change =>', newVal)
//   if (newVal) {
//     setTimeout(() => {
//       document.addEventListener('click', handleClickOutside)
//     }, 100)
//   } else {
//     document.removeEventListener('click', handleClickOutside)
//   }
// })
// onMounted(() => {
//   getCurrentRouter();
// })
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
      <el-menu-item index="/View" @click="gotoPage('/View')">
        <i class="iconfont icon-xitong"></i>
        <span>{{ 'System' }}</span>
      </el-menu-item>
      <el-menu-item index="/SiteLogin" @click="gotoPage('/SiteLogin')">
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
    }
  }
}
.sidebar-hide {
  left: -256px;
}
</style>