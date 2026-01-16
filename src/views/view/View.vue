<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSiteInfo } from '../../store/site-info';
import { GetPartitionApi, GetDeviceChannelsApi } from '../../api/channel';
import { Search } from '@element-plus/icons-vue'

const siteStore = useSiteInfo();

const filterText = ref<string>('')
const activeCollapse = ref<string>('partition')
const channelData = ref<any>([])
const props = {
  value: 'id',
  label: 'label',
  children: 'children'
}
let expandedKeys = ref<any[]>([])  // 保持所有要默认展开的key

onMounted(() => {

})

watch(filterText, (newVal) => {
  console.log(newVal)
})
</script>

<template>
  <div class="view-page">
    <div class="view-left">
      <div class="input-div">
        <el-input v-model="filterText" placeholder="请输入关键字进行过滤" :suffix-icon="Search"></el-input>
        <i class="iconfont icon-liebiao"></i>
      </div>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="partition">
          <template #title>
            <div
              style="display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px;">
              <div class="title-text" style="white-space: nowrap;">{{ '分区' }}</div>
              <div class="liveview-colltitle" style="align-items: center;">
                <div @click.stop><i class="iconfont icon-shuaxin"></i></div>
              </div>
            </div>
          </template>
          <el-tree-v2
            ref="treeRef"
            style="max-width: 100%;"
            :data="channelData"
            :props="props"
            :default-expanded-keys="expandedKeys"
            node-key="id"
            :height="770"
          >
            <template #default="{ node, data }">
              
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
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

    .input-div {
      width: 100%;
      height: 48px;
      background-color: #1B1B1B;
      display: flex;
      justify-content: space-around;
      align-items: center;

      :deep(.el-input) {
        width: 224px;
        height: 32px;

        // border-radius: 16px;
        .el-input__wrapper {
          border-radius: 16px;
          background-color: #232323;
          box-shadow: none;
        }
      }

      i {
        font-size: 22px;
        cursor: pointer;
      }
    }
    :deep(.el-collapse) {
      // background-color: #424242;
      border: 0;
      .el-collapse-item__header {
        background-color: #303030;
        border: 0;
        color: #fff;
        height: 48px;
        .liveview-colltitle{
          display: flex;
          // width: ;
          div {
            margin-left: 12px;
            width: 26px;
            height: 26px;
            background-color: #232323;
            border-radius: 13px;
            text-align: center;
            line-height: 26px;
            i {
              font-size: 14px;
            }
          }
        }
      }
      .el-collapse-item__wrap {
        background-color: transparent;
        border: 0;
      }
      .el-tree {
        background-color: transparent;
        .el-tree-node:focus>.el-tree-node__content {
          background-color: transparent;
        }
        .el-tree-node__content:hover {
          background-color: rgba($color: #fff, $alpha: 0.2);
        }
      }
    }
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
