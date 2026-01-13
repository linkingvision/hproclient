<template>
    <div id="container">
        <el-header>
            <AppHeader />
        </el-header>
        <router-view></router-view>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import AppHeader from "./Header.vue";

</script>
<style lang="scss">
#container {
    width: 100%;
    height: 100%;
    font-size: 14px;
    position: relative;

    .el-header {
        --el-header-height: 40px;
        padding: 0;
    }

}
</style>