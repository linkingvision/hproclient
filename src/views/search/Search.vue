<template>
  <div class="search_list" id="search_list">

    <div class="left">

      <el-menu v-if="isFold" router :default-active="activeIndex" class="el-menu-vertical-demo fold1"
        :background-color="color1"
        style="height: 100%;border: none;width: 100%;">
        <el-menu-item @click="fold">
          <span class="FoldBtn iconfont icon-liebiao" style="background: transparent; border: none;"></span>
        </el-menu-item>
        <el-menu-item index="/Search/TextSearch">
          <span>
            <i class="iconfont icon-wenbensousuo" style="font-size: 20px;"></i>
            <span class="setting_tree">Text Search</span>
          </span>
        </el-menu-item>
        <el-menu-item index="/Search/VideoSlice">
          <span>
            <i class="iconfont icon-shipinqiepian" style="font-size: 20px;"></i>
            <span class="setting_tree">Video Slice</span>
          </span>
        </el-menu-item>
      </el-menu>
      <el-menu v-else router :default-active="activeIndex" class="el-menu-vertical-demo fold"
        :background-color="color1"
        style="height: 100%;border: none;">
        <el-menu-item @click="fold">
          <span class="FoldBtn iconfont icon-liebiao"></span>
        </el-menu-item>
        <el-menu-item index="/Search/TextSearch">
          <i class="iconfont icon-wenbensousuo" style="font-size: 20px;"></i>
        </el-menu-item>
        <el-menu-item index="/Search/VideoSlice">
          <i class="iconfont icon-shipinqiepian" style="font-size: 20px;"></i>
        </el-menu-item>
      </el-menu>

    </div>

    <div class="right">
      <router-view></router-view>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const router = useRoute();

const color1 = '#181818'
const activeIndex = computed(() => router.path);
const isFold = ref(true)
const dateKey = Date.now()
const dateKey1 = Date.now()

const fold = () => {
  const left = document.querySelector('.left') as HTMLElement
  const right = document.querySelector('.right') as HTMLElement
  if (isFold.value) {
    left.style.width = '3%'
    right.style.width = '96.3%'
  } else {
    left.style.width = '11%'
    right.style.width = '89%'
  }
  isFold.value = !isFold.value;
}
</script>

<style scoped lang="scss">
.search_list {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;

  .left {
    width: 11%;
    // max-width: 278px;
    height: 100%;

    .el-menu {
      overflow: auto;

      &::-webkit-scrollbar {
        /*滚动条整体样式*/
        width: 8px;
        /*高宽分别对应横竖滚动条的尺寸*/
        height: 8px;
        scrollbar-arrow-color: red;
      }

      &::-webkit-scrollbar-thumb {
        /*滚动条里面小方块*/
        border-radius: 5px;
        -webkit-box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        background: rgba(218, 218, 218, 0.2);
        scrollbar-arrow-color: red;
      }

      &::-webkit-scrollbar-track {
        /*滚动条里面轨道*/
        -webkit-box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        border-radius: 0;
        background: rgba(218, 218, 218, 0.1);
      }
    }
  }

  i {
    margin-right: 10px;
  }

  .right {
    width: 89%;
    height: 100%;
  }
}
</style>