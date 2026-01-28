<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';

const $router = useRouter();

const active = ref<string>('/Setup/StorageSetting/StorageMode')

const handleSelect = (index: string) => {
  active.value = index;
  $router.push(index)
}
</script>

<template>
  <div class="storage-settings">
    <div class="left">
      <el-menu :default-active="active" @select="handleSelect">
        <el-menu-item index="/Setup/StorageSetting/StorageMode">
          <i class="iconfont icon-a-StorageMode"></i>
          <span>StorageMode</span>
        </el-menu-item>
        <el-menu-item index="/Setup/StorageSetting/MetaStorage">
          <i class="iconfont icon-a-MetaStorage"></i>
          <span>MetaStorage</span>
        </el-menu-item>
        <el-menu-item index="/Setup/StorageSetting/LocalStorage">
          <i class="iconfont icon-a-LocalObjectStorage"></i>
          <span>Local Object Storage</span>
        </el-menu-item>
        <el-menu-item index="/Setup/StorageSetting/S3Storage">
          <i class="iconfont icon-a-S3Storage"></i>
          <span>S3 Storage</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="right">
      <router-view></router-view>
    </div>
    
  </div>
</template>

<style scoped lang="scss">
.storage-settings {
  width: 100%;
  height: 100%;
  display: flex;
  .left {
    width: 200px;
    height: 100%;
    background-color: #1E1E1E;
    .el-menu-item {
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