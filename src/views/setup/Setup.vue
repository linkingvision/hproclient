<script setup lang="ts">
import $ from 'jquery'
import { ref, onMounted, onUnmounted, watch, reactive, nextTick } from 'vue'
import { useSiteInfo } from '../../store/site-info';
import { useStore } from '../../store';
import { GetPartitionApi, GetDeviceChannelsApi } from '../../api/channel';
import { Search } from '@element-plus/icons-vue'
import { useTempStore } from '../../store/temp';

interface TreeNode {
  id: string;
  label: string;
  type: 'site' | 'partition' | 'device' | 'map' | 'view';
  children?: TreeNode[];
  online?: boolean;
  data: any;
  isLeaf?: boolean; // 标记是否为叶子节点
  loaded?: boolean; // 标记是否已加载过子节点
  isDeviceChannel?: boolean; // 标记是否为设备通道（展开设备后的子节点）
}

const store = useStore();
const siteStore = useSiteInfo();
const tempStore = useTempStore()

const filterText = ref<string>('')
const activeCollapse = ref<string>('partition')
const channelData = ref<any>([])
const props = {
  value: 'id',
  label: 'label',
  children: 'children'
}
const expandedKeys = ref<any[]>([])  // 保持所有要默认展开的key
const treeRef = ref<any>(null)  // 树组件的引用

const IsTreeFold = ref(false) // 左侧树状容器 收起/展示
const TreeFold = () => {
  IsTreeFold.value = !IsTreeFold.value;
  if (IsTreeFold.value) {
    $('.setup-left').css('width', '0')
  } else {
    $('.setup-left').css('width', '280px')
  }
}

// add loading status and cache
let isLoading = ref(false);
let deviceCache = new Map(); // Cache device channel data
const getDeviceList = async () => {
  if (isLoading.value) return;  // loading,skip repeat request
  isLoading.value = true;
  try {
    channelData.value = [];
    const channelArr = [];
    for (const site of siteStore.siteDevices) {
      if (site.login) {
        const siteData: any = {
          id: `site_${site.ipv4Address}`,
          isLeaf: false,
          label: site.deviceName,
          loaded: true,
          online: site.login,
          type: 'site',
          data: site,
          children: []
        }
        const protocol = site.enableHttps ? 'https:' : 'http:';
        const port = site.enableHttps ? site.httpsPort : site.httpPort;
        const root = `${protocol}//${site.ipv4Address}:${port}`;
        const partitionParams = {
          root,
          access_token: site.access_token ?? ''
        };
        const res = await GetPartitionApi(partitionParams);
        if (res.status == 200 && res.data.code == 0) {
          const result = res.data.result;
          // Use flatten function and sort by priority
          const list = flattenRootNodes(result);

          // Load channel data for device nodes - adopt caching and smaller batches
          const deviceItems = list.filter(item => item.type === 'device' && item.data && item.data.token);

          // Reduce batch size to prevent excessive concurrent requests
          const batchSize = 3;
          for (let i = 0; i < deviceItems.length; i += batchSize) {
            const batch = deviceItems.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (item) => {
                try {
                  // check cache
                  const cacheKey = item.data.token;
                  if (deviceCache.has(cacheKey)) {
                    const cachedData = deviceCache.get(cacheKey);
                    if (cachedData.length > 0) {
                      item.children = cachedData;
                      item.loaded = true;
                      item.isLeaf = false;
                    } else {
                      delete item.children;
                      item.loaded = true;
                      item.isLeaf = true;
                    }
                    return;
                  }

                  const ress = await GetDeviceChannelsApi({
                    root,
                    access_token: site.access_token ?? '',
                    token: item.data.token
                  })
                  if (ress.status == 200 && ress.data.code == 0 && ress.data.result.length > 0) {
                    // Convert channel data to tree node format while retaining online status
                    const channels = ress.data.result.map((channel: any, index: number) => ({
                      id: `channel_${item.data.devId}_${index}`,
                      label: channel.name || `channel ${index + 1}`,
                      name: channel.name || `channel ${index + 1}`,
                      token: channel.token,
                      online: channel.online,
                      type: 'device', // Channels also belong to the device type, distinguished via isDeviceChannel flag
                      data: channel,
                      isLeaf: true,
                      isDeviceChannel: true, // Mark as device channel
                      ipv4Address: site.ipv4Address,
                      protocol: site.enableHttps ? 'https:' : 'http:',
                      host: site.enableHttps ? site.httpsPort : site.httpPort,
                      session: site.session,
                      access_token: site.access_token
                    }));
                    
                    // cache data
                    deviceCache.set(cacheKey, channels);
                    
                    item.children = channels;
                    item.loaded = true;
                    item.isLeaf = false;
                  } else {
                    // cache empty
                    deviceCache.set(cacheKey, []);
                    
                    // remove the children property when a device has no channels to hide the expand icon
                    delete item.children;
                    item.loaded = true;
                    item.isLeaf = false; // Set as leaf node
                  }
                } catch (error) {
                  console.error(`failed to load device ${item.data.devId} of channels:`, error);
                  // clear placeholders even when errors occur
                  delete item.children;
                  item.loaded = true;
                  item.isLeaf = false;
                }
              })
            )
            // add a short delay between each batch to mitigate excessive server load
            if (i + batchSize < deviceItems.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          console.log('The data of device tree', list)
          siteData.children = list;
        }
        channelArr.push(siteData);
      }
    }
    channelData.value = channelArr;
    expandedKeys.value = getAllKeys(channelArr);
  } finally{
    console.log('finally !!!', channelData.value, Array.isArray(channelData.value))
    isLoading.value = false;
  }
}
// Flatten root nodes, display their contents directly and sort by priority
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  partitions.forEach(partition => {
    // 1. Prioritize displaying child partitions
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. Display dev devices secondly
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // Implement lazy loading for device channels
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. Display map items afterwards; maps are leaf nodes with no expand icon required
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true, // map is leaf node
          loaded: true
        });
      });
    }
    
    // 4. Display views last; views are leaf nodes without expand icons.
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          isLeaf: true, // view is leaf node
          loaded: true
        });
      });
    }
  })
  return result;
}
const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];

  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) ||
                       (partition.dev && partition.dev.length > 0) ||
                       (partition.map && partition.map.length > 0) ||
                       (partition.view && partition.view.length > 0);
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      data: partition,
      isLeaf: !hasChildren,
      loaded: false
    };
    // only set the children property when actual child data exists
    if (hasChildren) {
      partitionNode.children = [];
      
      // 1. prioritize rendering child partitions first
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }
      
      // 2. render dev devices next
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // implement lazy loading for device channels
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. display map items afterwards; maps are leaf nodes with no expand icon required
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            isLeaf: true, // map is leaf node
            loaded: true
          });
        });
      }
      
      // 4. display views last; views are leaf nodes without expand icons.
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            isLeaf: true, // view is leaf node
            loaded: true
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    // do not set the children property if no child data exists, so the tree component will not render the expand icon.
    
    result.push(partitionNode);
  })

  return result;
}
const getAllKeys = (data: any) => {
  const keys: any[] = [];
  const stack = [...data];

  while (stack.length > 0) {
    const item = stack.pop();
    if (item && item.id !== 'placeholder') {
      keys.push(item.id);
      if (item.children && item.children.length > 0) {
        // only process child nodes for non-leaf nodes
        if (!item.isLeaf) {
          stack.push(...item.children);
        }
      }
    }
  }
  return keys;
}
// click node
const clickSite = (node: TreeNode) => {
  console.log(node)
  if (node.type == 'site' && node.data.ipv4Address) {
    tempStore.setTempIP(node.data.ipv4Address);
    // $router.push('/Setup')
  }
}
// get node style class
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    
    if (isOnline) {
      classes.push('device-online');
    } else {
      classes.push('device-offline');
    }
  }
  if (node.data.ipv4Address == tempStore.tempIP) {
    classes.push('site-checked')
  }
  return classes.join(' ');
};
//  get svg icon of recording status
const getRecordingIcon = (node: TreeNode) => {
  return getNodeIcon(node);
};
// get the node color
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // get online status
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
};
// get node iconfont
const getNodeIcon = (node: TreeNode) => {
  // console.log('getNodeIcon', node)
  switch (node.type) {
    case 'site':
      return 'icon-shebeiguanli';
    case 'partition':
      // children node use icon-gen
      return 'icon-gen';
    case 'device':
      // Use the camera icon for device channels (leaf nodes).
      if (node.isLeaf || node.isDeviceChannel) {
        if (node.data.recording) {
          if (store.darkMode) {
            return '#icon-baishexiangji'
          } else {
            return '#icon-heishexiangji'
          }
        }
        return 'icon-shexiangjizaixian';
      }
      // icon-Device is used by devices in dev
      return 'icon-Device';
    case 'map':
      // icon-ditu is used by element in map
      return 'icon-ditu';
    case 'view':
      // icon-shitu2 is used by element in view
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};

// debounce the refresh function
let refreshTimer: any = null;
const refresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer)
  }
  refreshTimer = setTimeout(() => {
    deviceCache.clear();
    getDeviceList();
  })
}

onMounted(() => {
  getDeviceList()
  siteStore.startListening()
  // console.log('tempIP => ', tempStore.tempIP)
})

onUnmounted(() => {
  siteStore.stopListening()
})
</script>

<template>
  <div class="setup-page">
    <div class="setup-left">
      <div class="input-div">
        <el-input v-model="filterText" placeholder="Keywords Filter" :suffix-icon="Search"></el-input>
        <i class="iconfont icon-liebiao"  @click="TreeFold"></i>
      </div>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item name="partition">
          <template #title>
            <div
              style="display: flex; justify-content: space-between; width: 90%; align-items: center; padding-left: 10px;">
              <div class="title-text" style="white-space: nowrap;">{{ 'Partition' }}</div>
              <div class="liveview-colltitle" style="align-items: center;">
                <div @click.stop="refresh"><i class="iconfont icon-shuaxin"></i></div>
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
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <div
                draggable="true"
                style="width: 100%; display: flex; align-items: center; position: relative;"
                :class="getNodeClass(data)" @click="clickSite(data)">
                <!-- font icon: used for non-recording status -->
                <svg v-if="data.data && data.data.recording" class="icon" aria-hidden="true" :style="{
                  marginRight: '0'
                }">
                  <use :xlink:href="getRecordingIcon(data)"></use>
                </svg>
                <!-- font icon: used for non-recording status -->
                <i :class="`iconfont ${getNodeIcon(data)}`"
                :style="{
                  opacity: getNodeColor(data),
                  marginRight: '8px',
                  fontSize: data.type === 'device' && data.isLeaf ? '22px' : '20px'
                }"></i>
                <span :style="{
                  opacity: getNodeColor(data),
                  fontSize: '14px',
                }">{{ node.label }}</span>
              </div>
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="setup-right">
      <router-view></router-view>
    </div>
    <div v-if="IsTreeFold" class="TreeFold" @click="TreeFold">
      <i class="iconfont icon-liebiao"></i>
    </div>
  </div>
</template>

<style scoped lang="scss">
.setup-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  position: relative;
  .setup-left {
    height: 100%;
    width: 280px;
    // margin-right: 8px;
    background-color: #252525;
    overflow: hidden;

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
    .icon {
      width: 18px;
      height: 18px;
      // vertical-align: 15px;
      fill: currentColor;
      overflow: hidden;
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
      .el-tree-node:has(.site-checked) {
        background-color: rgba($color: #8DBDFF, $alpha: 0.3);
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
  .setup-right {
    height: 100%;
    flex: 1;
    // background-color: #282828;
    display: flex;
    flex-direction: column;
    // padding: 0 5px 5px 0;
  }
  .TreeFold {
    position: absolute;
    left: 0;
    top: 0;
    background: rgba(124, 124, 124, 0.5);
    border-radius: 0px 2px 2px 0px;
    z-index: 50;
    text-align: center;
    line-height: 40px;
    width: 30px;
    height: 30px;
    line-height: 30px;
    text-align: center;
    cursor: pointer;
    i {
      font-size: 18px;
    }
  }
}
</style>
