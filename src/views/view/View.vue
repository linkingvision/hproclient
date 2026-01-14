<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSiteInfo } from '../../store/site-info';

const siteStore = useSiteInfo();

const getSites = () => {
    console.log(111111)
    const sites = siteStore.getSiteDevices()
    console.log('View Get Sites', sites)
}

onMounted(() => {
    // console.log(siteStore)
})
</script>

<template>
    <div class="view-page">
        <div class="view-left">
            <button @click="getSites">get sites</button>
        </div>
        <div class="view-right">
            <div class="video_hed" id="video_hed"></div>
            <div class="control"></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.view-page {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: space-between;
    .view-left {
        height: 100%;
        width: 280px;
        margin-right: 8px;
        background-color: #252525;
    }
    .view-right {
        height: 100%;
        flex: 1;
        // background-color: #282828;
        display: flex;
        flex-direction: column;
        padding: 0 5px 5px 0;
        .video_hed {
            width: 100%;
            flex: 1;
            overflow: hidden;
            background-color: #222222;
            background-image: url(../../assets/image/GridLogo.png);
            background-size: 22%;
            background-repeat: no-repeat;
            background-position: center center;
        }
        .control {
            width: 100%;
            height: 160px;
            background-color: #282828;
            margin-top: 5px;
        }
    }
}
</style>
