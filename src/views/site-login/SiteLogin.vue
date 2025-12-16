<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { TabsPaneContext } from 'element-plus'
const activeName = ref('all')
const handleClick = (tab: TabsPaneContext, event: Event) => {
    console.log(tab, event)
}
interface siteDeviceType {
    uuid: string;
    deviceName: string;
    ipv4Address: string;
    httpPort: number;
    httpsPort: number;
    softwareVersion: string;
    responseTime: Date;
    enabled: boolean;
    login: boolean;
    lastSeen?: Date;
}
const siteDevice = ref<Array<siteDeviceType>>()
function getSiteDevice() {
    window.ipcRenderer.invoke('get-site-device').then((msg: Array<siteDeviceType>) => {
        console.log('Received get-site-device data:', msg);
        siteDevice.value = msg
    })
}
const timerRef = ref<NodeJS.Timeout | null>(null);
// 在组件挂载时启动定时器
onMounted(() => {
    // 立即执行一次
    getSiteDevice();
    // 设置定时器，并保存引用
    timerRef.value = setInterval(() => {
        getSiteDevice();
    }, 10000);
});
onUnmounted(() => {
    if (timerRef.value) {
        clearInterval(timerRef.value);
        timerRef.value = null;
        console.log('定时器已清除');
    }
});
</script>

<template>
    <div id="setup">

        <div class="sites_select">
            <div class="sites_logo">Logo占位</div>
            <div class="sites_search">搜索、添加site占位</div>
            <el-tabs v-model="activeName" type="card" class="demo-tabs" @tab-click="handleClick">
                <el-tab-pane label="ALL" name="all">
                    <div v-for="(site, key) in siteDevice" :key="key">
                        <span>{{ site.deviceName }}</span>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Available" name="available">
                    <div v-for="(site, key) in siteDevice" :key="key" v-show="site.enabled">
                        <span>{{ site.deviceName }}</span>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="Unavailable" name="unavailable">
                    <div v-for="(site, key) in siteDevice" :key="key" v-show="!site.enabled">
                        <span>{{ site.deviceName }}</span>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
        <div class="sites_login">
            login
        </div>
    </div>
</template>

<style lang="scss">
#setup {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #fafcffd7;

    .sites_select {
        width: 400px;
        height: 496px;
        padding: 50px;
        background-color: #fff;
        .sites_logo{
            height: 40px;
        }
        .sites_search{
            height: 40px;
        }
    }
}
</style>
