<script setup lang="ts">
import $ from 'jquery';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTempStore } from '../../../store/temp';
import { useSiteInfo } from '../../../store/site-info';


const $router = useRouter();
const siteStore = useSiteInfo();
const tempStore = useTempStore();

const site = computed(() => siteStore.getSiteDevice(tempStore.tempIP))

const active = ref<string>('/User/UserConfig')

const handleSelect = (index: string) => {
  active.value = index;
  $router.push(index)
}
const isCollapse = ref<boolean>(false)
const collapse = () => {
  isCollapse.value = !isCollapse.value;
  if (isCollapse.value) {
    $('.left').width('64px')
  } else {
    $('.left').width('200px')
  }
}
</script>

<template>
  <div class="User">
    <div class="left">
      <div class="collapse" @click="collapse">
        <i class="iconfont icon-liebiao"></i>
      </div>
      <div class="site-name">
        <i class="iconfont icon-shebeiguanli"></i>
        <span>{{ site?.deviceName }}</span>
      </div>
      <el-menu :default-active="active" @select="handleSelect" :collapse="isCollapse" :teleported="false">
        <el-sub-menu index="/User/UserConfig">
          <template #title>
            <i class="iconfont icon-yonghupeizhi_xian"></i>
            <span>User</span>
          </template>
          <el-menu-item index="/User/UserConfig"><span>User Config</span></el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="right">
      <router-view></router-view>
    </div>
  </div>
</template>

<style scoped lang="scss">
.User {
  width: 100%;
  height: 100%;
  display: flex;
  .left {
    width: 200px;
    height: 100%;
    background-color: #1E1E1E;
    .collapse {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      padding-left: 20px;
      cursor: pointer;
      i {
        font-size: 20px;
      }
    }
    .collapse:hover {
      background: url("../../../assets/image/sidebar1.png") no-repeat;
    }
    .site-name {
      width: 100%;
      height: 56px;
      line-height: 56px;
      padding-left: 20px;
      border-bottom: #0399FE 1px solid;
      i {
        font-size: 20px;
        margin-right: 10px;
        color: #0399FE;
      }
      span {
        color: #0399FE;
      }
    }
    .el-menu-item, .el-sub-menu {
      i {
        font-size: 20px;
        margin-right: 8px;
      }
    }
  }
  .right {
    flex: 1;
    height: 100%;
  }
}
</style>