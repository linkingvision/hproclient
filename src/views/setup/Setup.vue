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

// 添加加载状态和缓存
let isLoading = ref(false);
let deviceCache = new Map(); // 缓存设备通道数据
const getDeviceList = async () => {
  if (isLoading.value) return;  // 正在加载中，跳过重复请求
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
          // 使用扁平化函数，按照优先级排序
          const list = flattenRootNodes(result);

          // 为设备节点加载通道数据 - 使用缓存和更小的批次
          const deviceItems = list.filter(item => item.type === 'device' && item.data && item.data.token);

          // 减少批次大小，避免同事发起太多请求
          const batchSize = 3;
          for (let i = 0; i < deviceItems.length; i += batchSize) {
            const batch = deviceItems.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (item) => {
                try {
                  // 检查缓存
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
                    // 将通道数据转换为树节点格式，保持在线状态
                    const channels = ress.data.result.map((channel: any, index: number) => ({
                      id: `channel_${item.data.devId}_${index}`,
                      label: channel.name || `channel ${index + 1}`,
                      name: channel.name || `channel ${index + 1}`,
                      token: channel.token,
                      online: channel.online,
                      type: 'device', // 通道也是device类型，但通过isDeviceChannel区分
                      data: channel,
                      isLeaf: true,
                      isDeviceChannel: true, // 标记为设备通道
                      ipv4Address: site.ipv4Address,
                      protocol: site.enableHttps ? 'https:' : 'http:',
                      host: site.enableHttps ? site.httpsPort : site.httpPort,
                      session: site.session,
                      access_token: site.access_token
                    }));
                    
                    // 缓存数据
                    deviceCache.set(cacheKey, channels);
                    
                    item.children = channels;
                    item.loaded = true;
                    item.isLeaf = false;
                  } else {
                    // 缓存空结果
                    deviceCache.set(cacheKey, []);
                    
                    // 设备没有通道时，删除children属性，这样就不会显示展开图标
                    delete item.children;
                    item.loaded = true;
                    item.isLeaf = false; // 设置为叶子节点
                  }
                } catch (error) {
                  console.error(`加载设备 ${item.data.devId} 的通道失败:`, error);
                  // 出错时也要清理占位符
                  delete item.children;
                  item.loaded = true;
                  item.isLeaf = false;
                }
              })
            )
            // 每批之间添加小延迟，避免服务器压力过大
            if (i + batchSize < deviceItems.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          console.log('设备树数据', list)
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
// 扁平化根节点，直接展示其内容，按照优先级排序
const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  partitions.forEach(partition => {
    // 1. 优先展示children（子分区）
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes);
    }
    
    // 2. 其次展示dev设备
    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 设备需要懒加载通道
          isLeaf: false,
          loaded: false
        });
      });
    }
    
    // 3. 然后展示map地图 - map是叶子节点，不需要展开图标
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true, // map是叶子节点
          loaded: true
        });
      });
    }
    
    // 4. 最后展示view视图 - view是叶子节点，不需要展开图标
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          isLeaf: true, // view是叶子节点
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
    // 只有当有实际的子数据时，才设置children属性
    if (hasChildren) {
      partitionNode.children = [];
      
      // 1. 优先展示children（子分区）
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }
      
      // 2. 其次展示dev设备
      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }], // 设备需要懒加载通道
            isLeaf: false,
            loaded: false
          });
        });
      }
      
      // 3. 然后展示map地图 - map是叶子节点，不需要展开图标
      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.mapName,
            type: 'map',
            data: map,
            isLeaf: true, // map是叶子节点
            loaded: true
          });
        });
      }
      
      // 4. 最后展示view视图 - view是叶子节点，不需要展开图标
      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `view_${view.viewId}`,
            label: view.viewName,
            type: 'view',
            data: view,
            isLeaf: true, // view是叶子节点
            loaded: true
          });
        });
      }
      
      partitionNode.loaded = true;
    }
    // 没有子数据时不设置children属性，这样树组件就不会显示展开图标
    
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
        // 只有非叶子节点才继续处理子节点
        if (!item.isLeaf) {
          stack.push(...item.children);
        }
      }
    }
  }
  return keys;
}
// 点击节点
const clickSite = (node: TreeNode) => {
  console.log(node)
  if (node.type == 'site' && node.data.ipv4Address) {
    tempStore.setTempIP(node.data.ipv4Address);
    // $router.push('/Setup')
  }
}
// 获取节点样式类
const getNodeClass = (node: TreeNode) => {
  const classes = ['tree-node'];
  if (node.type === 'device') {
    // 获取在线状态
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
// 获取录像状态的SVG图标
const getRecordingIcon = (node: TreeNode) => {
  return getNodeIcon(node);
};
// 获取节点颜色
const getNodeColor = (node: TreeNode) => {
  if (node.type === 'device') {
    // 获取在线状态
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
};
// 获取节点图标
const getNodeIcon = (node: TreeNode) => {
  // console.log('getNodeIcon', node)
  switch (node.type) {
    case 'site':
      return 'icon-shebeiguanli';
    case 'partition':
      // children节点使用icon-gen
      return 'icon-gen';
    case 'device':
      // 如果是设备通道（叶子节点），使用摄像机图标
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
      // dev里的设备使用icon-Device
      return 'icon-Device';
    case 'map':
      // map里的使用icon-ditu
      return 'icon-ditu';
    case 'view':
      // view里的使用icon-shipin
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
};

// 防抖刷新函数
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
                <!-- 字体图标 - 用于非录像状态 -->
                <svg v-if="data.data && data.data.recording" class="icon" aria-hidden="true" :style="{
                  marginRight: '0'
                }">
                  <use :xlink:href="getRecordingIcon(data)"></use>
                </svg>
                <!-- 字体图标 - 用于非录像状态 -->
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
