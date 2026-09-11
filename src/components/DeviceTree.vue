<template>
  <div class="device_tree" id="device_tree" style="height: 100%;width: 100%;">
    <el-input class="left_search" :placeholder="$t('Common.comm_filtration')" v-model="filterText">
      <template #suffix>
        <i class="iconfont icon-sousuo" style="cursor: pointer;" @click="PartitionTreeCacheSearch"></i>
      </template>
    </el-input>
    <el-collapse v-model="activeNames">
      <el-collapse-item name="devPartition">
        <template #title>
          <div style="display: flex; justify-content: space-between; align-items: center;padding: 0 10px 0 20px;">
            <div style="white-space: nowrap;">Partition</div>
            <div class="liveview_titleicon1 iconfont icon-shuaxin" @click.stop="loadDeviceTree"></div>
          </div>
        </template>
        <el-tree :data="channelData" node-key="uuid" ref="tree" @node-contextmenu="Nodecontextmenu"
          @node-expand="handleNodeExpand" @node-collapse="handleNodeCollapse" :props="treeProps"
          :default-expanded-keys="defaultExpandIds" :empty-text="emptyText">
          <template #default="{ data }">
            <span style="width: 100%;" >
              <div style="width: 100%; display: flex; justify-content: space-between;" @click="selectColor(data,$event)"  :style="siteStyle(data)">
                <el-tooltip :content="getMsg(data)" placement="top" :offset="-8" :disabled="data.type !== 'site'">
                  <span class="size_color" draggable="true"
                    @dragstart="dragStart($event, data.token, data.label, data.streamprofile, data.name, data.disabled_me, data)"
                    style="display: flex; justify-content: space-between; align-items: center;">

                    <svg v-if="data.data && data.data.recording" class="icon" aria-hidden="true"
                      style="width: 19px; height: 17px; margin-right: 10px;">
                      <use :href="getRecordingIcon(data)"></use>
                    </svg>

                    <i v-else :class="`iconfont ${getNodeIcon(data)}`"
                      :style="{ opacity: getNodeColor(data), marginRight: '8px', fontSize: data.type === 'device' && data.isLeaf ? '22px' : '20px', color: isChannelPlaying(data) ? '#00ff00' : 'inherit' }"></i>

                    <span
                      :style="{ opacity: getNodeColor(data), color: isChannelPlaying(data) ? '#00ff00' : 'inherit', fontSize: '14px' }">
                      {{ data.label || data.name }}
                    </span>
                  </span>
                </el-tooltip>
                <span v-if="isChannelPlaying(data)"
                  style="color: #00ff00; font-size: 12px; margin-left: 10px; display: flex; gap: 8px; align-items: center; white-space: nowrap;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #00ff00;"></div>
                  {{ data.type === 'view' ? 'Displaying...' : 'Playing...' }}
                </span>
              </div>
            </span>
          </template>
        </el-tree>
        <div v-show="visible" style="width: 320px;" ref="card" class="box-card">
          <div class="input-pin">
            <div class="popover_Title" style="display: flex; justify-content: space-between; flex-direction: row;">
              <span>Dome:</span>
              <el-switch v-model="currentData.dome" @change="SetChannelDomeMode()" />
            </div>
            <div class="popover_Title"
              style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px;margin-bottom: 0px;">
              <div style="margin-right: 12px;">
                <span>Alias:</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div class="popver_input" style="width: 200px;">
                  <el-input v-model="currentData.alias" suffix-icon="icon-bieming" />
                </div>
                <div style="margin-left: 12px;" @click="platformyes('delete')">
                  <i class="icon-lajitong"></i>
                </div>
              </div>
            </div>
            <div class="button_edi" style="justify-content: flex-end; height: 45px;">
              <el-button class="form_butt1" @click="ClosePopover()" style="margin-right: 10px;">
                Cancel
              </el-button>
              <el-button class="form_butt" @click="platformyes()" style="margin-right: 0px;">
                OK
              </el-button>
            </div>
          </div>
        </div>
        <div v-show="DevicesQuantity" ref="DevicesQuantityPrompt" class="camera_status"
          style="border-radius: 4px; z-index: 999; position: absolute; width: 320px; padding: 12px;">
          <div style="display: flex; flex-direction: row; justify-content: space-around;">
            <span style="padding-right: 20px; display: flex; flex-direction: column; border-right: 1px solid #353535;">
              <div>Online</div>
              <div style="display: flex; align-items: center; justify-content: center;">
                <span><i class="iconfont icon-heishexiangjizaixian" style="font-size: 19px;" /></span>
                <span style="margin-left: 5px;">:{{ dataQuantity.online }}</span>
              </div>
            </span>
            <span style="padding-right: 20px; display: flex; flex-direction: column; border-right: 1px solid #353535;">
              <div>Offline</div>
              <div style="display: flex; align-items: center; justify-content: center;color: #9a9a9a;">
                <span><i class="iconfont icon-shexiangjilixian el-tree-camera" style="font-size: 19px;" /></span>
                <span class="el-tree-camera" style="margin-left: 5px;">:{{ dataQuantity.offline }}</span>
              </div>
            </span>
            <span style="padding-right: 20px; display: flex; flex-direction: column; border-right: 1px solid #353535;">
              <div>Forbidden</div>
              <div style="display: flex; align-items: center; justify-content: center;color: #9a9a9a;">
                <span><i class="iconfont icon-shexiangjijinyong el-tree-camera" style="font-size: 19px;" /></span>
                <span class="el-tree-camera" style="margin-left: 5px;">:{{ dataQuantity.disable }}</span>
              </div>
            </span>
            <span style="display: flex; flex-direction: column;">
              <div>Idle</div>
              <div style="display: flex; align-items: center; justify-content: center;color: #9a9a9a;">
                <span>
                  <i class="iconfont icon-shexiangjikongxian el-tree-camera" style="font-size: 19px;"></i>
                </span>
                <span class="el-tree-camera" style="margin-left: 5px;">
                  :{{ dataQuantity.idle }}
                </span>
              </div>
            </span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'DeviceTree'
})
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { usePlayStore } from '../store/play';
import axiosOriginal from 'axios'
import { useStore } from '../store/index';
import { useSiteInfo } from '../store/site-info';
import { GetPartitionApi, GetDeviceChannelsApi } from '../api/channel';
import { GetCasDeviceChannelCount, GetChannelCount, GetDeviceChannelCount, SetChannelAliasName, SetChannelDome } from '../api/player';
import { getDeviceInfo } from '../utils/site';
import { GridLayoutManager } from '@/assets/js/uplayersdk.esm.js';
import uuid from '../utils/uuid';

const playStore = usePlayStore()
const mainStore = useStore()
const siteStore = useSiteInfo()

interface TreeNode {
  id: string;
  label: string;
  type: 'site' | 'partition' | 'device' | 'map' | 'view';
  children?: TreeNode[];
  online?: boolean;
  data: any;
  token?: '',
  isLeaf?: boolean;
  loaded?: boolean;
  isDeviceChannel?: boolean;
}
const treeProps = {
  value: 'id',
  label: 'label',
  children: 'children'
}
const filterText = ref('');
const isPutAway = ref(true);
const activeNames = ref(['devPartition']);
const defaultExpandIds = ref<any[]>([]);
const defaultExpandIdsDevices = ref<any[]>([]);
const channelData = ref<any[]>([]);
const playingIdArr = ref<string[]>([]);
let deviceCache = new Map();
const visible = ref(false);
const currentData = ref<any>('');
const currentNode = ref('')
const DevicesQuantity = ref(false);
const mouseX = ref(0);
const mouseY = ref(0);
const isSearching = ref(false);
const card = ref<any>(null);
const DevicesQuantityPrompt = ref<any>(null);
const loadImageTimeout = ref<any>(null);
const isDrag = ref(false);
const drag = ref<any>({});
const isLive = ref(true);
const isSelected = ref(false);
const selectedNode = ref<any>(null);

const GridManager = ref<InstanceType<typeof GridLayoutManager> | null>(null)

const dataQuantity = reactive({
  online: 0,
  offline: 0,
  idle: 0,
  disable: 0
});

const imageStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${mouseX.value}px` as const,
  top: `${mouseY.value}px` as const,
  zIndex: 2024 as const,
}))

const emptyText = computed(() => {
  return isSearching.value ? 'Searching' : 'No Data Avaliable'
})

const emit = defineEmits<{
  (e: 'dragStart', ev: DragEvent, dragData: any): void;
  (e: 'nodeClick', data: any): void;
}>()

const PartitionTreeCacheSearch = () => {
  if (filterText.value) {
    isSearching.value = true;
    filterTreeData(filterText.value);
  } else {
    loadDeviceTree();
  }
}

const filterTreeData = (keyword: string) => {
  if (!keyword.trim()) {
    loadDeviceTree();
    return;
  }
  const filtered = filterNodes(channelData.value, keyword.toLowerCase());
  channelData.value = filtered;
  isSearching.value = false;
}

const filterNodes = (nodes: any[], keyword: string): any[] => {
  const result: any[] = [];
  for (const node of nodes) {
    const label = (node.label || node.name || '').toLowerCase();
    const matches = label.includes(keyword);
    let filteredChildren: any[] = [];
    if (node.children && node.children.length > 0) {
      filteredChildren = filterNodes(node.children, keyword);
    }
    if (matches || filteredChildren.length > 0) {
      result.push({
        ...node,
        children: filteredChildren.length > 0 ? filteredChildren : node.children
      });
    }
  }
  return result;
}

const getNodeIcon = (node: any) => {
  switch (node.type) {
    case 'site':
      return 'icon-shebeiguanli';
    case 'partition':
      return 'icon-gen';
    case 'device':
      if (node.isLeaf || node.isDeviceChannel) {
        if (node.data && node.data.recording) {
          if (mainStore.darkMode) {
            return '#icon-baishexiangji';
          } else {
            return '#icon-heishexiangji';
          }
        }
        return 'icon-shexiangjizaixian';
      }
      return 'icon-Device';
    case 'map':
      return 'icon-ditu';
    case 'view':
      return 'icon-shitu2';
    default:
      return 'icon-gen';
  }
}

const getNodeColor = (node: any) => {
  if (node.type === 'device') {
    const isOnline = node.online !== undefined ? node.online : (node.data && node.data.online);
    return isOnline ? '1' : '0.6';
  }
  return '1';
}

const getRecordingIcon = (node: any) => {
  if (isChannelPlaying(node)) {
    return '#icon-lvshexiangji';
  }
  if (node.data && node.data.recording) {
    if (mainStore.darkMode) {
      return '#icon-baishexiangji';
    } else {
      return '#icon-heishexiangji';
    }
  }
  return getNodeIcon(node);
}

const isChannelPlaying = (node: any) => {
  if (!node.data) return false;
  if (!node.isLeaf && !node.isDeviceChannel && node.type !== 'view') return false;
  return playingIdArr.value.includes(node.id);
}

const updatePlayingStatus = (type: string, id: string) => {
  if (type === 'clear') {
    playingIdArr.value = [];
    return;
  }
  if (!id) return;
  if (type === 'add') {
    if (!playingIdArr.value.includes(id)) {
      playingIdArr.value.push(id);
    }
  } else if (type === 'del') {
    playingIdArr.value = playingIdArr.value.filter((item: any) => item !== id);
  }
}

const loadDeviceTree = async () => {
  if (isSearching.value) return;
  isSearching.value = true;
  try {
    channelData.value = [];
    const channelArr = [];
    for (const site of siteStore.siteDevices) {
      if (site.login) {
        const siteData: any = {
          id: `site_${site.ipv4Address}`,
          isLeaf: false,
          label: site.deviceName || site.ipv4Address,
          loaded: true,
          online: site.login,
          type: 'site',
          data: site,
          children: [],
        }
        const protocol = site.enableHttps ? 'https:' : 'http:';
        const port = site.enableHttps ? site.httpsPort : site.httpPort;
        const root = `${protocol}//${site.ipv4Address}:${port}`;

        const partitionParams = {
          root,
          access_token: site.access_token ?? ''
        }

        const res = await GetPartitionApi(partitionParams);

        if (res.status == 200 && res.data.code == 0) {
          const result = res.data.result;
          const list = flattenRootNodes(result);

          const deviceItems: any[] = [];
          const collectDevices = (nodes: any[]) => {
            for (const node of nodes) {
              if (node.type === 'device' && node.data && node.data.token) {
                deviceItems.push(node);
              }
              if (node.children && node.children.length > 0) {
                collectDevices(node.children);
              }
            }
          };
          collectDevices(list);
          const batchSize = 3;
          for (let i = 0; i < deviceItems.length; i += batchSize) {
            const batch = deviceItems.slice(i, i + batchSize);
            await Promise.allSettled(
              batch.map(async (item) => {
                try {
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
                  const res = await GetDeviceChannelsApi({
                    root,
                    access_token: site.access_token ?? '',
                    token: item.data.token
                  });
                  if (res.status == 200 && res.data.code == 0 && res.data.result.length > 0) {
                    const channels = res.data.result.map((channel: any, index: number) => ({
                      id: channel.token,
                      label: channel.name || `channel ${index + 1}`,
                      name: channel.name || `channel ${index + 1}`,
                      token: channel.token,
                      online: channel.online,
                      type: 'device',
                      data: channel,
                      isLeaf: true,
                      isDeviceChannel: true,
                      DifferentType: 'devChannel',
                      ipv4Address: site.ipv4Address,
                      protocol: site.enableHttps ? 'https:' : 'http:',
                      host: site.enableHttps ? site.httpsPort : site.httpPort,
                      session: site.session,
                      access_token: site.access_token,
                      recording: channel.recording || false,
                      enabled: channel.enabled !== false,
                    }));
                    deviceCache.set(cacheKey, channels);
                    item.children = channels;
                    item.loaded = true;
                    item.isLeaf = false;
                  } else {
                    deviceCache.set(cacheKey, []);
                    delete item.children;
                    item.loaded = true;
                    item.isLeaf = false;
                  }
                } catch (error) {
                  console.error(`failed to load device ${item.data.devId} channels`, error);
                  delete item.children;
                  item.loaded = true;
                  item.isLeaf = false;
                }
              })
            );
            if (i + batchSize < deviceItems.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          siteData.children = list;
        }
        channelArr.push(siteData);
      }
    }
    channelData.value = channelArr;
    defaultExpandIds.value = getAllKeys(channelArr);
  } finally {
    isSearching.value = false;
  }
}

const flattenRootNodes = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  partitions.forEach(partition => {
    if (partition.children && partition.children.length > 0) {
      const childrenNodes = transformToTreeData(partition.children);
      result.push(...childrenNodes)
    };

    if (partition.dev && partition.dev.length > 0) {
      partition.dev.forEach((device: any) => {
        result.push({
          id: `dev_${device.devId}`,
          label: device.name,
          type: 'device',
          online: device.online,
          data: device,
          children: [{ id: 'placeholder', label: '', type: 'device', data: null }],
          isLeaf: false,
          loaded: false,
        });
      });
    }
    if (partition.map && partition.map.length > 0) {
      partition.map.forEach((map: any) => {
        result.push({
          id: `map_${map.mapId}`,
          label: map.mapName,
          type: 'map',
          data: map,
          isLeaf: true,
          loaded: true,
        });
      });
    }
    if (partition.view && partition.view.length > 0) {
      partition.view.forEach((view: any) => {
        result.push({
          id: `view_${view.viewId}`,
          label: view.viewName,
          type: 'view',
          data: view,
          token: view.viewId,
          isLeaf: true,
          loaded: true
        });
      });
    }
  });
  return result;
}

const transformToTreeData = (partitions: any[]): TreeNode[] => {
  const result: TreeNode[] = [];
  partitions.forEach(partition => {
    const hasChildren = (partition.children && partition.children.length > 0) || (partition.dev && partition.dev.length > 0) || (partition.map && partition.map.length > 0) || (partition.view && partition.view.length > 0);
    const partitionNode: TreeNode = {
      id: `partition_${partition.devPartitionId}`,
      label: partition.devPartitionName,
      type: 'partition',
      data: partition,
      isLeaf: !hasChildren,
      loaded: false
    };
    if (hasChildren) {
      partitionNode.children = [];
      if (partition.children && partition.children.length > 0) {
        const childrenNodes = transformToTreeData(partition.children);
        partitionNode.children.push(...childrenNodes);
      }

      if (partition.dev && partition.dev.length > 0) {
        partition.dev.forEach((device: any) => {
          partitionNode.children!.push({
            id: `dev_${device.devId}`,
            label: device.name,
            type: 'device',
            online: device.online,
            data: device,
            children: [{ id: 'placeholder', label: '', type: 'device', data: null }],
            isLeaf: false,
            loaded: false
          })
        })
      }

      if (partition.map && partition.map.length > 0) {
        partition.map.forEach((map: any) => {
          partitionNode.children!.push({
            id: `map_${map.mapId}`,
            label: map.name,
            type: 'map',
            online: map.online,
            data: map,
            isLeaf: true,
            loaded: true
          })
        })
      }

      if (partition.view && partition.view.length > 0) {
        partition.view.forEach((view: any) => {
          partitionNode.children!.push({
            id: `map_${view.mapId}`,
            label: view.name,
            type: 'view',
            online: view.online,
            data: view,
            isLeaf: true,
            loaded: true
          })
        })
      }
      partitionNode.loaded = true;
    }
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
        if (!item.isLeaf) {
          stack.push(...item.children);
        }
      }
    }
  }
  return keys;
}

const Nodecontextmenu = (e: any, data: any, node: any) => {
  const { access_token, root } = getDeviceInfo();
  e.preventDefault();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  const boxWidth = 320;
  const boxHeight = 150;
  let mouseX = e.clientX + 10;
  let mouseY = e.clientY + 10;
  if (mouseY + boxHeight > windowHeight) {
    mouseY = mouseY - boxHeight - 10;
  }
  if (mouseX + boxWidth > windowWidth) {
    mouseX = windowWidth - boxWidth - 10;
  }

  if (data.DifferentType === 'devChannel' || data.DifferentType === 'CasDevChannel') {
    visible.value = !visible.value;
    currentData.value = data;
    currentNode.value = node;
    if (card.value) {
      card.value.style.left = `${mouseX}px`;
      card.value.style.top = `${mouseY}px`;
    }
  } else if (data.DevicesQuantity) {
    DevicesQuantity.value = !DevicesQuantity.value;
    GetChannelCount(root, access_token, data.uuid).then((result: any) => {
      if (result.code === 0 && result.msg === 'Success') {
        const data1 = result.result;
        dataQuantity.online = data1.online || 0;
        dataQuantity.offline = data1.offline || 0;
        dataQuantity.idle = data1.idle || 0;
        dataQuantity.disable = data1.disable || 0;
      }
    })
    if (DevicesQuantityPrompt.value) {
      DevicesQuantityPrompt.value.style.left = `${e.clientX - 20}px`;
      DevicesQuantityPrompt.value.style.top = `${mouseY + 20}px`;
    }
  }
}

const handleNodeExpand = async (data: any, lastlevel: any) => {
  if (!defaultExpandIds.value.includes(data.uuid)) {
    defaultExpandIds.value.push(data.uuid);
  }
  if (data.loaded || !data.children || data.children.length === 0) {
    return;
  }
  if (data.children[0] && data.children[0].id === 'placeholder') {
    data.loaded = true;
  }
}

const handleNodeCollapse = (data: any) => {
  defaultExpandIds.value = defaultExpandIds.value.filter((item) => item !== data.uuid);
  removeChildrenIds(data);
}

const removeChildrenIds = (data: any) => {
  if (data.children) {
    data.children.forEach((item: any) => {
      defaultExpandIds.value = defaultExpandIds.value.filter((uuid) => uuid !== item.uuid);
      removeChildrenIds(item);
    })
  }
}

const getDeviceImageRaw = async (url: any, token: any) => {
  const { access_token } = getDeviceInfo()
  return axiosOriginal.get(`${url}/uapi/v1/GetDeviceImage?token=${token}`, {
    responseType: 'arraybuffer',
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });
};

const arrayBufferToBase64 = (buffer: any) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const dragStart = (ev: any, token: any, label: any, streamprofile: any, name: any, disabled_me: any, data: any) => {
  const { root, session } = getDeviceInfo()
  isDrag.value = true;
  const baseUrl = new URL(root);
  const AccessToken = sessionStorage.getItem('Access_token') || '';
  let dragData: any = {};
  if (data.enabled === true || data.loaded === true) {
    if (data.type === 'map') {
      return;
    }
    if (data.type === 'view') {
      dragData = {
        viewid: data.token,
        token: data.token
      }
    } else {
      dragData = {
        videoid: uuid(8),
        protocol: baseUrl.protocol,
        host: baseUrl.host,
        token: token,
        label: label,
        session: session,
        accessToken: AccessToken,
        liveVideoType: 'WS2',
        streamprofile: streamprofile,
        resourceUUID: data.uuid,
        name: label,
        recording: data.recording,
        rootpath: '/',
        onPlaybackModeChange: (mode: any) => {
          if (mode === 'live') {
            isLive.value = true;
          } else {
            isLive.value = false;
          }
        },
        onError: (err: any) => {
          console.log('Play Error', err)
        }
      }
    }
  }
  emit('dragStart', ev, dragData);
}

const ClosePopover = () => {
  if (visible.value) {
    visible.value = false;
    currentData.value = '';
    currentNode.value = '';
  }
}

const platformyes = async (deletd?: any) => {
  const { access_token, root } = getDeviceInfo()
  const node: any = currentNode.value;
  const data1 = currentData.value;
  let result;
  if (deletd) {
    result = await SetChannelAliasName(root, access_token, data1.token)
  } else {
    result = await SetChannelAliasName(root, access_token, data1.token, encodeURIComponent(data1.alias))
  }
  if (result.data.code === 0) {
    if (result.data.msg === 'Success') {
      if (visible.value) {
        visible.value = false
      }
      if (deletd) {
        node.alias = ''
      } else {
        node.alias = data1.alias
      }
    }
  }
}

const SetChannelDomeMode = () => {
  const { access_token, root } = getDeviceInfo()
  const node = currentNode.value as any;
  const data1 = currentData.value as any;
  SetChannelDome(root, access_token, data1.token, data1.dome).then((result: any) => {
    if (result.code === 0) {
      if (result.msg === 'Success') {
        if (data1.dome) {
          if (data1.recording) {
            if (data1.iconclass3 !== 'none') {
              // if (themeStore.darkMode === 'black') {
              //   data1.iconclass2 = '#icon-baiqiuji'
              // } else {
              data1.iconclass2 = '#icon-heiqiuji'
              // }
            } else {
              data1.iconclass2 = '#icon-lvqiuji'
            }
          } else {
            if (node.data.disabled_me) {
              node.data.iconclass = 'iconfont icon-jinyong el-tree-camera'
            } else if (!node.data.online) {
              node.data.iconclass = 'iconfont icon-lixian el-tree-camera'
            } else {
              node.data.iconclass = 'iconfont icon-zaixian'
            }
          }
        } else if (data1.dome === false) {
          if (data1.recording) {
            if (data1.iconclass3 !== 'none') {
              // if (themeStore.darkMode === 'white') {
              //   data1.iconclass2 = '#icon-haishexiangji';
              // } else {
              data1.iconclass2 = '#icon-baishexiangji';
              // }
            } else {
              data1.iconclass2 = '#icon-lvshexiangji';
            }
          } else {
            if (node.data.disabled_me) {
              node.data.iconclass = 'iconfont icon-xiangjijinyong el-tree-camera';
            } else if (!node.data.online) {
              node.data.iconclass = 'iconfont icon-shexiangjilixian el-tree-camera';
            } else {
              node.data.iconclass = 'iconfont icon-shexiangjizaixian';
            }
          }
        }
      }
    }
  })
}

const getMsg = (data:any) => {
  if(data.type === 'site'){
    const site = data.data || data;
    const port = site.enableHttps ? site.httpsPort : site.httpPort;
    return `${site.ipv4Address}:${port}`;
  }
}

const selectColor = (data:any,event:Event) => {
  if(data.type === 'site'){
    event.stopPropagation();
  }
  if(data.type !== 'site'){
    // if(selectedNode.value){
    //   selectedNode.value = null;
    //   isSelected.value = false;
    // }
    return;
  }

  if(selectedNode.value === data){
    selectedNode.value = null;
    isSelected.value = false;
  }else{
    selectedNode.value = data;
    isSelected.value = true;
  }
}

const siteStyle = (data:any) => {
  if(data.type === 'site' && isSelected.value && selectedNode.value === data){
    return {
      backgroundColor:'#4D5C70'
    }
  }
  return {}
}

onMounted(() => {
  loadDeviceTree();
})

watch(
  () => siteStore.siteDevices,
  (newDev, oldDev) => {
    if (newDev && newDev.length > 0) {
      loadDeviceTree();
    }
  },
  { deep: true, immediate: true }
)

defineExpose({
  loadDeviceTree,
  PartitionTreeCacheSearch,
  channelData,
  filterText,
  defaultExpandIds,
  refresh: loadDeviceTree,
  playingIdArr,
  updatePlayingStatus,
})
</script>

<style>
.device_tree {
  .left_search {
    padding: 20px 10px;
    display: flex;
    justify-items: center;
    justify-content: center;
  }

  .box-card {
    width: 150px;
    position: absolute;
    z-index: 1000;
    padding: 12px;
    background: #222222;

    .input-pin {
      .popover_Title {
        margin-bottom: 10px;

        .popver_input {
          .el-input__inner {
            height: 25px !important;
            line-height: 25px !important;
          }

          .el-input__suffix {
            i {
              line-height: 25px !important;
            }
          }
        }
      }

      .button_edi {
        display: flex;
        justify-content: flex-end;
        padding-top: 10px;

        .form_butt1 {
          background: transparent;
          border: 1px solid #177ddc !important;
          color: #177ddc;
          box-sizing: border-box;
        }

        .form_butt {
          background: #177ddc;
          border-radius: 2px;
          color: #fff;
          border: none;
        }
      }
    }
  }
}
</style>