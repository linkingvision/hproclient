<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useTempStore } from '../../store/temp';
import { useSiteInfo } from '../../store/site-info';
import { useRouter } from 'vue-router';
import uuid from '@/assets/js/uuid.js';

const tempStore = useTempStore();
const siteStore = useSiteInfo()
const $router = useRouter()

const site = computed(() => siteStore.getSiteDevice(tempStore.tempIP))

const goPage = (url: string) => {
  // $router.push(url)
  window.ipcRenderer.send('open-new-tab', {
    data: {
      label: url,
      key: url + uuid(4),
      path: "/" + url,
    },
    type: url,
    ip: tempStore.tempIP
  })
}

onMounted(() => {
  // console.log('Setup Index ', tempStore.tempIP)
})
</script>

<template>
  <div class="setup-index">
    <div class="setup-header">
      <i class="iconfont icon-shebeiguanli"></i>
      <span>{{ site?.deviceName }}</span>
    </div>
    <div class="setup-body">
      <div class="setup-list">
        <div class="setup-item">
          <div class="title">Basic</div>
          <div class="boxes">
            <div class="box" @click="goPage('General')">
              <i class="iconfont icon-icon-test1"></i>
              <span>General</span>
            </div>
            <div class="box" @click="goPage('StorageSetting')">
              <i class="iconfont icon-cunchupeizhi"></i>
              <span>Storage Settings</span>
            </div>
            <div class="box" @click="goPage('User')">
              <i class="iconfont icon-yonghupeizhi_xian"></i>
              <span>User Config</span>
            </div>
          </div>
        </div>
        <div class="setup-item">
          <div class="title">Device</div>
          <div class="boxes">
            <div class="box" @click="goPage('DeviceManagement')">
              <i class="iconfont icon-shebeiguanli"></i>
              <span>Device Management</span>
            </div>
            <div class="box" @click="goPage('VideoConfiguration')">
              <i class="iconfont icon-shipinpeizhi"></i>
              <span>Video Configuration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.setup-index {
  width: 100%;
  height: 100%;
  padding: 10px;
  .setup-header {
    width: 100%;
    height: 106px;
    background-color: #222222;
    display: flex;
    align-items: center;
    padding-left: 50px;
    i {
      font-size: 22px;
      margin-right: 10px;
    }
    span {
      font-size: 18px;
    }
  }
  .setup-body {
    width: 100%;
    padding: 40px;;
    .setup-list {
      width: 100%;
      .setup-item {
        width: 100%;
        margin-bottom: 20px;
        .title {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .boxes {
          width: 100%;
          display: flex;
          .box {
            width: 200px;
            height: 120px;
            background-color: #222222;
            margin-right: 32px;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            i {
              font-size: 32px;
              margin-bottom: 10px;
            }
          }
        }
      }
    }
  }
}
</style>