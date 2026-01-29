<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $router = useRouter();

const active = ref<string>('/DeviceManagement/VideoDevice')

const handleSelect = (index: string) => {
  active.value = index;
  $router.push(index)
}
</script>

<template>
  <div class="device-management">
    <div class="left">
      <el-menu :default-active="active" @select="handleSelect">
        <el-sub-menu index="/DeviceManagement/VideoDevice">
          <template #title>
            <i class="iconfont icon-cunchupeizhi"></i>
            <span>DeviceManagement</span>
          </template>
          <el-menu-item index="/DeviceManagement/VideoDevice"><span>VideoDevice</span></el-menu-item>
          <el-menu-item index="/DeviceManagement/AccessControlDevice"><span>AccessControlDevice</span></el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>
    <div class="right">
      <router-view></router-view>
    </div>
    
  </div>
</template>

<style scoped lang="scss">
.device-management {
  width: 100%;
  height: 100%;
  display: flex;
  .left {
    width: 200px;
    height: 100%;
    background-color: #1E1E1E;
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