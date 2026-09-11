<template>
  <div id="client_config_basc">
    <el-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
      <el-tab-pane name="basicParam">
        <template #label>
          <span class="custom-tabs-label" style="padding: 0 10px;">
            Basic Parameters
          </span>
        </template>
        <BasicParam></BasicParam>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import {ref} from "vue"
import type { TabsPaneContext } from "element-plus";
import { useRouter } from "vue-router";

import BasicParam from "./BasicParam.vue";
const router = useRouter();
const activeName = ref('basicParam');
const handleClick = (tab:TabsPaneContext,event:Event) => {
  console.log(tab,event);
}
</script>

<style scoped lang="scss">
#client_config_basc{
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 10px;
}
</style>