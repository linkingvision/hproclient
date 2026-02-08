<script setup lang="ts">
import $ from 'jquery'
import { ref, onMounted, onUnmounted, watch, reactive, nextTick, computed } from 'vue'
import { useSiteInfo } from '../../store/site-info';
import { useStore } from '../../store';
import { useTempStore } from '../../store/temp';
import { GetPartitionApi, GetDeviceChannelsApi, RecEnableApi, GetRecordCalendar, SetRecEnableApi, GetInformationDataApi, GetPresetsApi, PresetJumpApi, SetPresetApi, PtzApi } from '../../api/channel';
import { Search } from '@element-plus/icons-vue'
import { UPlayerSDK as UPlayerSDKClass, UPlayerList as UPlayerListClass, GridLayoutManager } from '@/assets/js/uplayersdk.esm.js';
import { H5sPlayerAudBack } from '@/assets/js/h5splayer.js';
import uuid from '@/assets/js/uuid.js';
import { ElMessage } from 'element-plus';

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
interface gridListenerType {
  closeCellHandler: null | Function,
  changeMainSDKHandler: null | Function,
  recEnableHandler: null | Function,
  SnapshotHandler: null | Function,
  InformationHandler: null | Function,
  ShoutwheatHandler: null | Function,
  PtzControlShowHandler: null | Function,
  layoutLoadedFromCacheHandler: null | Function
}

const store = useStore();
const siteStore = useSiteInfo();
const tempStore = useTempStore();

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
    $('.view-left').css('width', '0')
  } else {
    $('.view-left').css('width', '280px')
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
    console.log('localStorage siteStore =>', localStorage.getItem('siteStore'))
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

const playingIdArr = ref<string[]>([])
// 根据token查找对应的设备树节点ID
const findNodeIdByToken = (token: string): string | null => {
  const findInNodes = (nodes: TreeNode[]): string | null => {
    for (const node of nodes) {
      // 检查当前节点
      if (node.data && node.data.token === token) {
        return node.id;
      }
      // 递归检查子节点
      if (node.children && node.children.length > 0) {
        const found = findInNodes(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findInNodes(channelData.value);
};
const updatePlayingStatus = (type: string, id: string) => {
  if (!id) return;
  
  if (type == 'add') {
    // 添加播放状态，先检查是否已存在，避免重复添加
    if (!playingIdArr.value.includes(id)) {
      playingIdArr.value.push(id);
    }
  } else if (type == 'del') {
    console.log('清楚播放状态 id =>', id)
    // 删除播放状态
    playingIdArr.value = playingIdArr.value.filter(item => item !== id);
  }
  
  // console.log('playingIdArr after update =>', playingIdArr.value);
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
  return classes.join(' ');
};
// 获取录像状态的SVG图标
const getRecordingIcon = (node: TreeNode) => {
  if (isChannelPlaying(node)) {
    return '#icon-lvshexiangji';
  }
  return getNodeIcon(node);
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
// 检查通道是否正在播放
const isChannelPlaying = (node: TreeNode) => {
  if (!node.data) return false;
  
  // 只对叶子节点（实际的通道）或view类型进行播放状态检查
  // 避免父设备节点也显示播放状态
  if (!node.isLeaf && !node.isDeviceChannel && node.type !== 'view') return false;
  
  // 检查当前节点是否在播放列表中
  const isPlaying = playingIdArr.value.includes(node.id);
  if (isPlaying) {
    console.log('isChannelPlaying', node.id, node.label);
  }
  return isPlaying;
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

const UPlayerList  = ref<any>(null)
const initUPlayerList = (): void => {
  let timelineBackgroundColor;
  if (store.darkMode == false) {
    timelineBackgroundColor = '#E4E4E4'
  } else if (store.darkMode == 'c-dark-theme') {
    timelineBackgroundColor = '#343434'
  } else if (store.darkMode == 'darkblue') {
    timelineBackgroundColor = '#1C2850'
  }
  // console.log(store.darkMode)
  UPlayerList.value = new UPlayerListClass('#timeline', {timelineBackgroundColor});
  GridManager.value.initialize()
}

const GridManager = ref<any>(null)
const gridListener = reactive<gridListenerType>({
  closeCellHandler: null,
  changeMainSDKHandler: null,
  recEnableHandler: null,
  SnapshotHandler: null,
  InformationHandler: null,
  ShoutwheatHandler: null,
  PtzControlShowHandler: null,
  layoutLoadedFromCacheHandler: null
})
const initGridLayout = (): void => {
  GridManager.value = new GridLayoutManager('#video_hed', {
    cacheKey: 'hpro-client-view-layout',
    padding: 20,
    aspectRatio: [16, 9],
    animationDuration: 500,
    createIcons: {
      playModeIcon: true,
      playModeText: store.liveviewrtc,
      informationIcon: true,
      shouwhearIcon: true,
      snapshotIcon: true,
      recEnableIcon: true,
      ptzcontrolIcon: true
    }
  })

  gridListener.closeCellHandler = (event: CustomEvent<any>) => {
    closePlayContainer(event.detail)
  }
  gridListener.changeMainSDKHandler = (event: CustomEvent<any>) => {
    changeMainSDK(event.detail)
  }
  gridListener.recEnableHandler = (event: CustomEvent<any>) => {
    DoManualRecordStart(event.detail.id, event.detail.recEnable)
  }
  gridListener.InformationHandler = (event: CustomEvent<any>) => {
    Information(event.detail.id)
  }
  gridListener.SnapshotHandler = (event: CustomEvent<any>) => {
    DoSnapshotWeb(event.detail.id)
  }
  gridListener.ShoutwheatHandler = (event: CustomEvent<any>) => {
    Shoutwheat(event.detail.id, event.detail.audio)
  }
  gridListener.PtzControlShowHandler = (event: CustomEvent<any>) => {
    PtzControlShow(event.detail.id)
  }
  gridListener.layoutLoadedFromCacheHandler = async (event: CustomEvent<any>) => {
    console.log('layoutLoadedFromCacheHandler =>', event.detail)
    await nextTick();
    // 等待设备树数据加载完成的辅助函数
    const waitForDeviceData = async (maxRetries = 10, delay = 500) => {
      for (let i = 0; i < maxRetries; i++) {
        if (channelData.value && channelData.value.length > 0) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      return false;
    };
    
    // 等待设备树数据加载完成
    const deviceDataReady = await waitForDeviceData();
    if (!deviceDataReady) {
      console.warn('Device tree data not ready, skipping playing status update');
    }

    event.detail.forEach((item: any) => {
      item.forEach((row: any) => {
        if (row && row.camera) {
          const nodeId = deviceDataReady ? findNodeIdByToken(row.camera.token) : null;
          const arr = row.camera.host.split(':');
          const site = findSiteByIp(arr[0]);
          if (!site) return;
          const conf = {
            videoid: row.camera.videoid,
            protocol: row.camera.protocol,
            host: row.camera.host,
            token: row.camera.token,
            session: site.session,
            accessToken: site.access_token,
            resourceUUID: row.camera.resourceUUID,
            name: row.camera.name,
            label: row.camera.label,
            liveVideoType: store.liveviewrtc,
            recording: row.camera.recording,
            playingId: nodeId, // 添加playingId，用于关闭时更新设备树状态
            onPlaybackModeChange: (mode: string) => {
              console.log('onPlaybackModeChange =>', mode);
              if (mode == 'live') {
                isLiveview.value = true;
                GridManager.value.changePlayModeText(store.liveviewrtc)
              } else {
                isLiveview.value = false;
                GridManager.value.changePlayModeText(store.liveviewrtc1)
              }
            },
            onError: (err: object) => {
              console.warn('Play Error =>', err)
            }
          }
          const UPlayer = new UPlayerSDKClass('G' + conf.videoid, conf);
          UPlayerList.value.addPlayer(UPlayer)
          PlayingArr.value.push(UPlayer);
          PlayBackArr.value.push(UPlayer);
          isPlaying.value = true;

          // 更新播放状态
          if (nodeId) {
            updatePlayingStatus('add', nodeId);
            console.log('Auto-play: Updated playing status for node:', nodeId, 'token:', row.camera.token);
          } else {
            console.warn('Auto-play: Could not find node for token:', row.camera.token);
          }
        }
      })
    })
    UPlayerList.value.playAll();
  }

  GridManager.value.addEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.addEventListener('cellClick', gridListener.changeMainSDKHandler)
  GridManager.value.addEventListener('recEnableClick', gridListener.recEnableHandler)
  GridManager.value.addEventListener('Information', gridListener.InformationHandler)
  GridManager.value.addEventListener('Snapshot', gridListener.SnapshotHandler)
  GridManager.value.addEventListener('Shoutwheat', gridListener.ShoutwheatHandler)
  GridManager.value.addEventListener('PtzControlShow', gridListener.PtzControlShowHandler)
  GridManager.value.addEventListener('layoutLoadedFromCache', gridListener.layoutLoadedFromCacheHandler)
}
const findSiteByIp = (ip: string) => {
  const site = siteStore.siteDevices.find(item => item.ipv4Address == ip);
  if (!site) return null;
  return site;
}
const findSDKById = (id: string) => {
  const sdk = PlayingArr.value.find(item => item.conf.videoid === id);
  if (!sdk) {
    throw new Error(`未找到 id=${id}的 sdk`)
  }
  return sdk;
}
// 云台控制
const ptzShow = ref<boolean>(false);
const ptzToken = ref<string>('');
const PresetData = reactive<any[]>([])
const ptzvalue = ref<number>(0.5);
const ptzRoot = ref<string>('')
const ptzAccessToken = ref<string>('')
const PtzControlShow = async (id: string) => {
  const vid = id.slice(1)
  const sdk = findSDKById(vid);
  if (!sdk) return;
  ptzShow.value = true;
  ptzShow.value = true;
  ptzToken.value = sdk.conf.token;
  PresetData.splice(0);
  ptzRoot.value = sdk.conf.protocol + '//' + sdk.conf.host
  ptzAccessToken.value = sdk.conf.accessToken
  const res = await GetPresetsApi(ptzRoot.value, ptzAccessToken.value, ptzToken.value);
  if (res.status == 200) {
    if (res.data && res.data.preset.length > 0) {
      const preset = res.data.preset;
      for(let i = 0; i < preset.length; i++) {
        const newItem = {
          strName: preset[i].strName,
          strToken: preset[i].strToken
        }
        if (i >= 8) break;
        PresetData.push(newItem);
      }
    }
  }
}
const PtzAction = async (action: string, speed?: number) => {
  const speedValue = speed || ptzvalue.value;
  if (!ptzToken.value) return;
  const res = await PtzApi(ptzRoot.value, ptzAccessToken.value, ptzToken.value, action, speedValue)
  if (res.status == 200 && res.data.code == 0) {}
}
const preset_jump = async (token: string) => {
  const res = await PresetJumpApi(ptzRoot.value, ptzAccessToken.value, ptzToken.value, token, ptzvalue.value)
  if (res.status == 200 && res.data.code == 0) {}
}
const preset_set = async (token: string, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement
  const input = target.previousElementSibling?.previousElementSibling as HTMLInputElement
  var input_val = input?.value;
  const res = await SetPresetApi(ptzRoot.value, ptzAccessToken.value, ptzToken.value, input_val, token)
  if (res.status == 200 && res.data.code == 0) {}
}
const closePtz = () => {
  ptzShow.value = false;
  ptzToken.value = '';
  ptzRoot.value = '';
  ptzAccessToken.value = '';
  PresetData.splice(0);
}
// 点击语音
const audioback = ref<any>(null)
const Shoutwheat = (id: string, audio: boolean) => {
  const vid = id.slice(1)
  const sdk = findSDKById(vid);
  if (!sdk) return;
  const conf = {
    protocol: sdk.conf.protocol,
    host: sdk.conf.host,
    rootpath: '/',
    token: sdk.conf.token,
    session: sdk.conf.session
  }
  if (audio) {
    audioback.value.disconnect();
    delete audioback.value;
    audioback.value = null
  } else {
    if (audioback.value) {
      audioback.value.disconnect();
      delete audioback.value;
      audioback.value = null
    }
    audioback.value = new H5sPlayerAudBack(conf);
    audioback.value.connect();
  }
  GridManager.value.changeAudio(id, !audio)
}
// 本地抓图
const DoSnapshotWeb = (id: string) => {
  const vid = id.slice(1);
  const sdk = findSDKById(vid);
  if (sdk) return;
  const date = new Date();
  const fileName = `${sdk.conf.token}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  let video: any;
  if (isLiveview.value) {
    video = $('#' + sdk.conf.videoid).get(0);
  } else {
    video = $('#playback' + vid).find('video[pos="0"]').get(0);
  }
  // ✅ 新增：跨域属性
  if (video) video.crossOrigin = 'anonymous';
  const canvas = document.createElement('canvas');
  const ctx: any = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  var imgURL = canvas.toDataURL("image/png");

  var dlLink = document.createElement('a');
  dlLink.download = fileName;
  dlLink.href = imgURL;
  document.body.appendChild(dlLink);
  dlLink.click();
  document.body.removeChild(dlLink);
}
// 打开 / 关闭仪表
const Information = (id: string) => {
  const vid = id.slice(1);
  const sdk = findSDKById(vid);
  if (informationshow.value) {
    informationshow.value = false;
    clearInterval(timerRunInfo.value);
    timerRunInfo.value = null;
  } else {
    informationshow.value = true;
    const root = sdk.conf.protocol + '//' + sdk.conf.host
    Informationdata(root, sdk.conf.accessToken, sdk.conf.token);
    timerRunInfo.value = setInterval(() => {
      Informationdata(root, sdk.conf.accessToken, sdk.conf.token);
    }, 8000)
  }
}
// 获取码流信息
const Informationdata = async (root: string, access_token: string, token: string) => {
  const res = await GetInformationDataApi(root, access_token, token);
  if (res.status == 200) {
    const item = res.data;
    informationAudio.value = [{
      // name: '编码类型',
      name: 'Codec',
      data: item.strAudioType
    }, {
      // name: '采样率',
      name: 'Sample Rate',
      data: item.nAudioSampleRate
    }, {
      // name: '采样位宽',
      name: 'Sample Bit',
      data: item.nAudioSampleBit
    }, {
      // name: '声道数',
      name: 'Channels',
      data: item.nAudioChannels
    }, {
      // name: '码率',
      name: 'Bitrate',
      data: (item.nAudioBitrate / 1024).toFixed(1) + 'kpbs'
    }];
    informationVideo.value = [{
      // name: '编码类型',
      name: 'Codec',
      data: item.strVideoType
    }, {
      // name: '宽',
      name: 'Width',
      data: item.nVideoWidth
    }, {
      // name: '高',
      name: 'Height',
      data: item.nVideoHeight
    }, {
      // name: '帧率',
      name: 'FPS',
      data: item.nVideoFPS
    }, {
      // name: '码率',
      name: 'Bitrate',
      data: (item.nVideoBitrate / 1024).toFixed(1) + 'kpbs'
    }]
  }
}
// 关闭仪表
const closeInformation = (): void => {
  informationshow.value = false;
  if (timerRunInfo.value) {
    clearInterval(timerRunInfo.value)
    timerRunInfo.value = null;
  }
}
// 开启 / 关闭手动录像
const DoManualRecordStart = async (id: string, recEnable: boolean) => {
  const vid = id.slice(1)
  const sdk = findSDKById(vid);
  if (!sdk) return;
  // console.log('手动录像 id => ', root, access_token);
  let manualRecEnable;
  if (recEnable) {
    manualRecEnable = false;
  } else {
    manualRecEnable = true;
  }
  const res = await SetRecEnableApi({
    root: sdk.conf.protocol + '//' + sdk.conf.host,
    access_token: sdk.conf.accessToken,
    devUUID: sdk.conf.resourceUUID,
    setting: { manualRecEnable }
  });
  if (res.status == 200 && res.data.code == 0) {
    if (manualRecEnable) {
      ElMessage({
        message: '开启录像',
        type: 'success',
        duration: 2000
      })
    } else {
      ElMessage({
        message: '停止录像',
        type: 'success',
        duration: 2000
      })
    }
    GridManager.value.changeRecEnable(id, manualRecEnable)
  } else {
    if (manualRecEnable) {
      ElMessage({
        message: '开启失败',
        type: 'error',
        duration: 2000
      })
    } else {
      ElMessage({
        message: '关闭失败',
        type: 'error',
        duration: 2000
      })
    }
  }
}
// 关闭单个单元格
const closePlayContainer = (id: string) => {
  console.log('closePlayContainer id => ', id);
  if (!UPlayerList.value) return;
  if (PlayingArr.value.length == 0) return;
  const vid = id.slice(1);
  const currentSDK = PlayingArr.value.find(sdk => sdk.conf.videoid == vid);
  if (currentSDK) {
    const SDKinPlayback = PlayBackArr.value.find(sdk => sdk.conf.videoid == vid);
    if (SDKinPlayback) {
      UPlayerList.value.removePlayer(vid);
    } else {
      currentSDK.destory()
    }
    if (currentSDK.conf.token === ptzToken.value) {
      closePtz()
    }
    PlayingArr.value = PlayingArr.value.filter(sdk => sdk.conf.videoid !== vid)
    PlayBackArr.value = PlayBackArr.value.filter(sdk => sdk.conf.videoid !== vid)
    if (!PlayingArr.value.length) {
      isLiveview.value = true;
      isPlaying.value = false;
    }

    // 更新播放状态：优先使用playingId，如果为空则根据token查找
    let nodeIdToRemove = currentSDK.conf.playingId;
    if (!nodeIdToRemove && currentSDK.conf.token) {
      nodeIdToRemove = findNodeIdByToken(currentSDK.conf.token);
      console.log('closePlayContainer: playingId not found, using token to find nodeId:', nodeIdToRemove);
    }

    if (nodeIdToRemove) {
      updatePlayingStatus('del', nodeIdToRemove);
    } else {
      console.warn('closePlayContainer: Could not find nodeId to remove playing status for token:', currentSDK.conf.token);
    }
    // 触发树的重新渲染以更新播放状态显示
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.$forceUpdate?.();
      }
    });
  }
}

const isLiveview = ref<boolean>(true);
const isPlaying = ref<boolean>(false)
const PlayingArr = ref<any[]>([])
const PlayBackArr = ref<any[]>([])
const selectCellId = ref<string>('')
const mainSDKId = ref<string>('')
const informationshow = ref<boolean>(false)
const timerRunInfo = ref<any>(null)
const informationAudio = ref<any[]>([])
const informationVideo = ref<any[]>([])
const Audioslider = ref<number>(0)

// 切换主播放器
const changeMainSDK = (id: string) => {
  const vid = id.slice(1);
  // 如果当前为回放，且点击和当前选中时同一个，那么 加入/取消 回放组
  if (!isLiveview.value && mainSDKId.value === id) {
    const playSDK = PlayingArr.value.find(item => item.conf.videoid === vid);
    if (playSDK) {  // 当前点击区域有正在播放的视频
      const playbackSDK = PlayBackArr.value.find(item => item.conf.videoid === vid);
      const target = document.getElementById(id)
      if (playbackSDK) {
        if (PlayBackArr.value.length > 1) {
          UPlayerList.value.getOutPlayer(vid);
          PlayBackArr.value = PlayBackArr.value.filter(item => item.conf.videoid != vid)
          target?.classList.remove('playback_check_border')
          target?.classList.remove('blue_dashed')
          target?.classList.add('red_border')
        }
      } else {
        UPlayerList.value.addPlayer(playSDK);
        PlayBackArr.value.push(playSDK)
        target?.classList.remove('red_border')
        target?.classList.add('playback_check_border')
      }
    }
  } else {
    if (UPlayerList.value && UPlayerList.value.UPlayerSDKList.length > 0) {
      UPlayerList.value.changeMainSDK(vid)
    }
  }

  selectCellId.value = vid;
  mainSDKId.value = id;

  if (isLiveview.value) {
    document.querySelectorAll('.grid_cell.red_border')
      .forEach(el => el.classList.remove('red_border'))
    const target = document.getElementById(id);
      if (target) target.classList.add('red_border')
  } else {
    document.querySelectorAll('.grid_cell.red_border').forEach(el => el.classList.remove('red_border'))
    document.querySelectorAll('.grid_cell.playback_check_border').forEach(el => el.classList.remove('playback_check_border'))
    const item = PlayBackArr.value.find(item => item.conf.videoid == vid)
    const target = document.getElementById(id);
    if (target) {
      if (item) {
        target.classList.add('blue_dashed')
        target.classList.add('playback_check_border')
      } else {
        target.classList.add('red_border')
      }
    }
  }
}

const gotoLive = async () => {
  const now = new Date();
  UPlayerList.value.pauseAll();
  isLiveview.value = false;
  if (PlayingArr.value.length == PlayBackArr.value.length) {
    await UPlayerList.value.setAllPosition(now.getTime())
    UPlayerList.value.playAll()
    isLiveview.value = true;
  } else {
    const notPlaybackArr = PlayingArr.value.filter(item => !PlayBackArr.value.includes(item))
    // 
    await Promise.all(
      notPlaybackArr.map(item => {
        return new Promise<void>((resolve) => {
          UPlayerList.value.addPlayer(item);
          PlayBackArr.value.push(item);
          resolve()
        })
      })
    )
    // 再统一进入实时播放
    await UPlayerList.value.setAllPosition(now.getTime()).then(() => {
      UPlayerList.value.playAll();
    })
    isLiveview.value = true;
  }
}
const Alloffvideo = () => { // 关闭所有视频以及单元格
  if (!UPlayerList.value) return;
  if (PlayingArr.value.length == 0) return;
  const notPlaybackArr = PlayingArr.value.filter(item => !PlayBackArr.value.includes(item));
  if (notPlaybackArr && notPlaybackArr.length > 0) {
    notPlaybackArr.forEach(item => {
      item.destroy();
    })
  }
  PlayingArr.value = [];
  PlayBackArr.value = [];
  UPlayerList.value.destroyAll();
  isLiveview.value = true;
  isPlaying.value = false;
  mainSDKId.value = '';
  // 清除所有播放状态
  playingIdArr.value = [];
  const cellFactory = async (cell: any) => {
    console.log('关闭', cell)
  }
  GridManager.value.reloadStageConfiguration(cellFactory)
}



const isDrag = ref<boolean>(false)
const drag = ref<any>({})
const handleDragStart = (node: any) => {
  drag.value = {};
  isDrag.value = true;
  let conf = {};
  if (node.data.data.type == "H5_CH_DEV" || node.data.data.type == "H5_FILE") {
    console.log('handleDragStart channel =>', node.data)
    conf = {
      videoid: uuid(8),
      protocol: node.data.protocol,
      host: node.data.ipv4Address + ':' + node.data.host,
      token: node.data.token,
      session: node.data.session,
      accessToken: node.data.access_token,
      name: node.data.name,
      label: node.data.label,
      resourceUUID: node.data.data.uuid,
      liveVideoType: store.liveviewrtc,
      recording: node.data.data.recording,
      playingId: node.data.id,  // 仅用于设备树显示状态
      onPlaybackModeChange: (mode: string) => {
        console.log('onPlaybackModeChange view =>', mode);
        if (mode == 'live') {
          isLiveview.value = true;
          GridManager.value.changePlayModeText(store.liveviewrtc)
        } else {
          isLiveview.value = false;
          GridManager.value.changePlayModeText(store.liveviewrtc1)
        }
      },
      onError: (err: object) => {
        console.warn('Play Error =>', err)
      }
    }
    drag.value = conf;
  } else {
    if (node.data.type == 'view') {
      // console.log('handleDragStart view =>', node.data)
      drag.value.viewId = node.data.data.viewId;
      drag.value.playingId = node.data.id;
    } else if (node.data.type == 'map') {
      // console.log('handleDragStart map =>', node.data)
      // 暂时为map设置playingId，但不实现播放逻辑
      drag.value.mapId = node.data.data.mapId;
      drag.value.playingId = node.data.id;
    }
  }
  GridManager.value.showLines();
  GridManager.value.highlightCells([]);
  console.log('drag =>', drag.value)
}
// 正在拖动
const dragOver = (event: any) => {
  if (!isDrag.value || (!drag.value.viewId && !drag.value.videoid)) return;
  // console.log(!isDrag.value , !drag.value.viewId , !isDrag.value , !drag.value.videoid)
  // const container: Element | null = document.getElementById('video_hed');
  // const rect: any = container?.getBoundingClientRect();
  const eventX = event.pageX;
  const eventY = event.pageY;
  let cellsToHighlight = [];
  // 显示网格
  GridManager.value.showLines()
  let gridPosition = GridManager.value.findGridPositionByCoordinates(eventX, eventY);
  if (gridPosition !== false) {
    let gridDimensions = GridManager.value.getDimensionsForGridPosition(gridPosition[0], gridPosition[1]);
    cellsToHighlight.push(gridDimensions);
  }
  GridManager.value.highlightCells(cellsToHighlight, "rgba(141,189,255,0.3)");
}
const dropTarget = async (event: any) => {
  if (!isDrag.value && !drag.value.viewId || !isDrag.value && !drag.value.videoid) {
    GridManager.value.hideLines()
    GridManager.value.highlightCells([]);
    isDrag.value = false;
    return
  }
  if (drag.value.videoid) {
    let eventX = event.pageX;
    let eventY = event.pageY;
    let recEnable = false;
    const res = await RecEnableApi({
      root: drag.value.protocol + '//' + drag.value.host,
      access_token: drag.value.accessToken,
      token: drag.value.token
    });
    console.log('record =>', res)
    if (res.status == 200 && res.data.code == 0) {
      recEnable = res.data.result.manualRecEnable;
    }
    let conf = {
      pageX: eventX,
      pageY: eventY,
      id: 'G' + drag.value.videoid,
      recording: false,
      recEnable,
      audio: false,
      camera: {
        videoid: drag.value.videoid,
        token: drag.value.token,
        // session: drag.value.session,
        name: drag.value.name,
        label: drag.value.name,
        resourceUUID: drag.value.resourceUUID,
        recording: drag.value.recording,
        protocol: drag.value.protocol,
        host: drag.value.host,
        // access_token: drag.value.access_token
      }
    }
    GridManager.value.claimCellByCoordinates(conf);
    isDrag.value = false;

    const UPlayer = new UPlayerSDKClass(conf.id, drag.value)
    UPlayerList.value.addPlayer(UPlayer);
    PlayingArr.value.push(UPlayer)
    PlayBackArr.value.push(UPlayer)
    UPlayerList.value.playAll();
    isPlaying.value = true;
    gridListener.changeMainSDKHandler?.({detail: conf.id})
    updatePlayingStatus('add', drag.value.playingId)
  }
  GridManager.value.hideLines()
  GridManager.value.highlightCells([]);

  // 触发树的重新渲染以更新播放状态显示
  nextTick(() => {
    // 强制更新树组件
    if (treeRef.value) {
      treeRef.value.$forceUpdate?.();
    }
  });
}

const showRecodeType = ref<boolean>(false)
const panelFullScreen = (event: any) => { // 全屏展示 / 退出全屏
  const elem: any = document.getElementById("video_hed");
  const doc: any = document;
  if (doc.fullscreenEnabled || doc.webkitFullscreenEnabled || doc.mozFullScreenEnabled || doc.msFullscreenEnabled) {
    if (doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    } else {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    }
  } else {
    console.log("Fullscreen is not supported on your browser.");
  }
}
const xzvalue = ref<Date>(new Date())
const customDateArr = ref<any>([])    // 用于存放'已标记的日期数组'
const input_ch = () => {    // 时间选择器时间发生改变触发的函数
  if (!UPlayerList.value) return;
  UPlayerList.value.setAllPosition(xzvalue.value.getTime()).then(() => {
    UPlayerList.value.playAll(xzvalue.value.getTime());
  })
}
const isShow = async () => {    // 获取焦点，展示日期
  await nextTick();
  customDateArr.value = [];
  const year = xzvalue.value.getFullYear();
  const month = xzvalue.value.getMonth() + 1;

  if (!selectCellId.value) return;
  const sdk = PlayingArr.value.find(item => item.conf.videoid == selectCellId.value);
  if (sdk && sdk.conf.token) {
    console.log(sdk)
    await SearchRecordCalendar(sdk.conf.protocol + '//' + sdk.conf.host, sdk.conf.accessToken, sdk.conf.token, year, month);
    markRecordDates(year, month)
  }
}
const monthChange = async (panelDate: Date, type: 'month' | 'year') => {   // 切换年月后重新调接口
  const year = panelDate.getFullYear()
  const month = panelDate.getMonth() + 1 // 0-based
  // console.log(type, year, month)
  // 查找当前选中宫格是否存在视频播放器
  const sdk = PlayingArr.value.find(item => item.conf.videoid === selectCellId.value);
  if (sdk && sdk.conf.token) {
    await SearchRecordCalendar(sdk.conf.protocol + '//' + sdk.conf.host, sdk.conf.accessToken, sdk.conf.token, year, month)
    markRecordDates(year, month)
  }
}
const closePicker = () => {
    document
      .querySelectorAll('.date-picker td.available')
      .forEach(td => {
          td.classList.remove('custom_date_class')
      })
}
const SearchRecordCalendar = async (root: string, access_token: string, token: string, year: number, month: number) => {    // 根据年月获取有录像的日期
  customDateArr.value = [];
  $('.available').removeClass('custom_date_class');
  let res = await GetRecordCalendar({
    root,
    access_token,
    token,
    year,
    month
  });
  if (res.status == 200 && res.data.record) {
    res.data.record.forEach((key: any) => {
      if (key.bHasRec || key.bHasAlarmRec) {
        const m = String(month).padStart(2, '0')
        const d = String(key.nDay).padStart(2, '0')
        const dateStr = `${year}-${m}-${d}T00:00:00+08:00`
        customDateArr.value.push(new Date(dateStr).getTime())
      }
    })
  }
}
const markRecordDates = (year: number, month: number) => {
  nextTick(() => {
    document
      .querySelectorAll('.date-picker td.available')
      .forEach(td => {
        const span = td.querySelector('span')
        if (!span) return

        const day = span.textContent?.padStart(2, '0')
        if (!day) return

        const m = String(month).padStart(2, '0')
        const dateStr = `${year}-${m}-${day}T00:00:00+08:00`
        const time = new Date(dateStr).getTime()

        if (customDateArr.value.includes(time)) {
          td.classList.add('custom_date_class')
        } else {
          td.classList.remove('custom_date_class')
        }
      })
  })
}
let region = ref<string>('1.0')
const regiondata = reactive([{
  value: "16.0",
  label: "16x"
}, {
  value: "8.0",
  label: "8x"
}, {
  value: "4.0",
  label: "4x"
}, {
  value: "2.0",
  label: "2x"
}, {
  value: "1.0",
  label: "1x"
}, {
  value: "0.5",
  label: "1/2x"
}, {
  value: "0.25",
  label: "1/4x"
}])
const timeSpeed = (speed: string) => {
  console.log('选择的倍速 =>', speed);
  if (isLiveview.value) {
    region.value = '1.0';
    return;   // 直播状态下不处理
  }
  if (!UPlayerList.value.UPlayerSDKList.length) return;   // 没有播放器实例不处理
  UPlayerList.value.setAllPlaybackRate(speed)
}
const timeInput = (e: Event) => {
  if (e) {
    const doc: any = document;
    if (!doc.fullscreenElement && !doc.webkitIsFullScreen && !doc.mozFullScreen && !doc.msFullscreenElement) {
      $('.ele .selectdrop').css('left', '-19px');
    } else {
      $('.ele .selectdrop').css('left', '0px !important');
    }
  }
}

const resume = () => {
  if (!UPlayerList.value.UPlayerSDKList.length) return; // 没有播放器实例不处理
  if (isLiveview.value) return;   // 直播状态下不处理
  if (isPlaying.value) {
    UPlayerList.value.pauseAll()
  } else {
    UPlayerList.value.playAll()
  }
  isPlaying.value = !isPlaying.value;
}

onMounted(() => {
  getDeviceList();
  initGridLayout();
  initUPlayerList();
  window.addEventListener('click', menuHide)
  siteStore.startListening();
})

onUnmounted(() => {
  if (UPlayerList.value) {
    UPlayerList.value.destroyAll();
    // const arr = PlayingArr.value.map(item => item.conf)
    // localStorage.setItem('view-playing', JSON.stringify(arr));
    PlayingArr.value = [];
    PlayBackArr.value = [];
    UPlayerList.value.destroyAll();
    isLiveview.value = true;
    isPlaying.value = false;
    mainSDKId.value = '';
  }

  GridManager.value.removeEventListener('closeCell', gridListener.closeCellHandler)
  GridManager.value.removeEventListener('cellClick', gridListener.changeMainSDKHandler)
  GridManager.value.removeEventListener('recEnableClick', gridListener.recEnableHandler)
  GridManager.value.removeEventListener('Information', gridListener.InformationHandler)
  GridManager.value.removeEventListener('Snapshot', gridListener.SnapshotHandler)
  GridManager.value.removeEventListener('Shoutwheat', gridListener.ShoutwheatHandler)
  GridManager.value.removeEventListener('PtzControlShow', gridListener.PtzControlShowHandler)
  GridManager.value.removeEventListener('layoutLoadedFromCache', gridListener.layoutLoadedFromCacheHandler)
  GridManager.value.destroy();
  GridManager.value = null;

  window.removeEventListener('click', menuHide)
  siteStore.stopListening()
})

watch(isLiveview, (newVal) => {
  if (newVal) {
    console.log('isLivevie watch =>', newVal);
    // 去除所有回放组边框 和选中回放组的边框效果
    document.querySelectorAll('.grid_cell.blue_dashed').forEach(el => el.classList.remove('blue_dashed'))
    document.querySelectorAll('.grid_cell.playback_check_border').forEach(el => el.classList.remove('playback_check_border'))
    // 添加直播状态下 选中效果
    const target = document.getElementById(mainSDKId.value);
    if (target) target.classList.add('red_border')
  } else {
    console.log('isLiveview watch >', newVal)
    document.querySelectorAll('.grid_cell.red_border')
      .forEach(el => el.classList.remove('red_border'))
    PlayBackArr.value.forEach(item => {
      const target = document.getElementById('G' + item.conf.videoid);
      if (target) target.classList.add('blue_dashed')
    })
    const currentTargetarget = document.getElementById(mainSDKId.value);
    if (currentTargetarget) {
      currentTargetarget.classList.add('playback_check_border')
    }
  }
})

const menuVisible = ref<boolean>(false);
const setupIP = ref<string>('')
const x = ref<number>(0)
const y = ref<number>(0)
const menuShow = (event: MouseEvent) => {
  event.preventDefault();
  x.value = event.clientX;
  y.value = event.clientY;
  menuVisible.value = true;
}
const menuHide = () => {
  setupIP.value = '';
  menuVisible.value = false;
}
const goSetup = () => {
  menuVisible.value = false;
  window.ipcRenderer.send('open-new-tab', {
    data: {
      label: 'Setup',
      key: "Setup" + uuid(4),
      path: "Setup",
    },
    type: 'setup',
    ip: setupIP.value
  })
  setupIP.value = '';
}
const onRightClick = (e: MouseEvent, data: any) => {
  if (data.type !== 'site') return;
  console.log('onRightClick =>', data)
  setupIP.value = data.data.ipv4Address;
  tempStore.setTempIP(setupIP.value)
  menuShow(e);
}
</script>

<template>
  <div class="view-page">
    <div class="view-left">
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
          >
            <template #default="{ node, data }">
              <div
                draggable="true"
                @dragstart="handleDragStart(node)"
                style="width: 100%; display: flex; align-items: center; position: relative;"
                :class="getNodeClass(data)" @contextmenu="onRightClick($event, data)">
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
                  fontSize: data.type === 'device' && data.isLeaf ? '22px' : '20px',
                  color: isChannelPlaying(data) ? '#00ff00' : 'inherit'
                }"></i>
                <span :style="{
                  opacity: getNodeColor(data),
                  color: isChannelPlaying(data) ? '#00ff00' : 'inherit',
                  fontSize: '14px',
                }">{{ node.label }}</span>
                <!-- 播放状态指示 -->
                <span v-if="isChannelPlaying(data)" style="color: #00ff00; font-size: 12px; position: absolute; right: 10px;">
                  Playing...
                </span>
              </div>
            </template>
          </el-tree-v2>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div class="view-right">
      <div class="video_hed" id="video_hed" @dragover.prevent="dragOver($event)" @drop="dropTarget($event)">
        <div class="malv" :class="informationshow ? '' : 'malv-hide'" style="position: absolute;">
          <div class="malv-close" @click="closeInformation">×</div>
          <div class="malv-left">
            <div class="information_title">{{ 'Video' }}</div>
            <div class="information_content" v-for="(a, index) in informationVideo" :key="index">
              <div class="information_content_left">{{ a.name }}</div>
              <div class="information_content_right">{{ a.data }}</div>
            </div>
          </div>
          <div class="malv-right">
            <div class="information_title">{{ 'Audio' }}</div>
            <div class="information_content" v-for="(a, index) in informationAudio" :key="index">
              <div class="information_content_left">{{ a.name }}</div>
              <div class="information_content_right">{{ a.data }}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="control">
        <div class="timeline-box" >
          <svg id="timeline"></svg>
        </div>
        <div class="control_btns">
          <div class="caveat_butt">
            <div class="recodeType" v-if="showRecodeType" style="padding: 0 10px;">
              <button class="mr-0"></button>schedule
              <button class="mr-1"></button>manual
              <button class="mr-2"></button>alarm
            </div>
            <div class="showRecodeType"
                @click="showRecodeType = !showRecodeType;">
              <i class="iconfont" :class="showRecodeType ? 'icon-zuojiantou' : 'icon-youjiantou'"></i>
            </div>
          </div>
          <div class="control-center">
            <el-date-picker class="fixed_input" v-model="xzvalue" size="small" @change="input_ch" @focus="isShow" @panel-change="monthChange" @blur="closePicker"
              :append-to-body="false" :clearable="false" popper-class="date-picker">
            </el-date-picker>
            <el-select v-model="region" size="small" class="ele" popper-class='selectdrop' @change="timeSpeed(region)" @visible-change="timeInput" popper-style="border: 0;">
              <el-option v-for="(item, index) in regiondata" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
            <button class="resume-btn" @click="resume">
              <i class="iconfont" :class="isPlaying ? 'icon-zanting' : 'icon-bofang'"></i>
            </button>
            <div id="Audio_slider-bottom" class="Audio_slider-bottom">
              <div style="margin-right: 10px;">
                <i class="iconfont" :class="(Audioslider == 0) ? 'icon-shengyinguan' : 'icon-shengyinkai'"
                  style="font-size:22px;"></i>
              </div>
              <el-slider :step='0.1' :show-tooltip="false" :max='1' v-model="Audioslider"
                style="width:60%;margin-right: 10px;"></el-slider>
            </div>
          </div>
          <div class="gongge-btns" style="height: 50px; padding-right: 20px; width: 20%; display: flex; justify-content: flex-end; align-items: center;">
            <el-button v-if="!isLiveview" class="goto-live" @click="gotoLive" round>go to live</el-button>
            <el-button class="iconfont icon-guanbi2 offAllVideo" @click="Alloffvideo"></el-button>
            <el-button class="iconfont icon-quanping1" @click="panelFullScreen($event)"></el-button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="IsTreeFold" class="TreeFold" @click="TreeFold">
      <i class="iconfont icon-liebiao"></i>
    </div>
    <div class="yuntai" :class="ptzShow ? '' : 'yuntai-hide'">
      <div class="header">
        <span>PTZ</span>
        <i class="iconfont icon-zhankai2" @click="closePtz"></i>
      </div>
      <div class="controls">
        <div class="left">
          <i class="iconfont icon-jujiao2" @mousedown="PtzAction('focusin')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-jujiao1" @mousedown="PtzAction('focusout')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guangquanjia" @mousedown="PtzAction('irisin')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guangquanjian" @mousedown="PtzAction('irisout')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-light-open" @mousedown="PtzAction('lighton')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-light-close" @mousedown="PtzAction('lightoff')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-kaiyushua" @mousedown="PtzAction('wiperon')" @mouseup="PtzAction('stop')"></i>
          <i class="iconfont icon-guanyushua" @mousedown="PtzAction('wiperoff')" @mouseup="PtzAction('stop')"></i>
        </div>
        <div class="right">
          <div class="ptz-item corner"><div class="zs" @mousedown="PtzAction('upleft')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-zuoshang"></i>
          </div></div>
          <div class="ptz-item shang" @mousedown="PtzAction('up')" @mouseup="PtzAction('stop')"><i class="iconfont icon-shang"></i></div>
          <div class="ptz-item corner"><div class="ys" @mousedown="PtzAction('upright')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-youshang"></i>
          </div></div>
          <div class="ptz-item zuo" @mousedown="PtzAction('left')" @mouseup="PtzAction('stop')"><i class="iconfont icon-zuo"></i></div>
          <div class="ptz-item center"></div>
          <div class="ptz-item you" @mousedown="PtzAction('right')" @mouseup="PtzAction('stop')"><i class="iconfont icon-you"></i></div>
          <div class="ptz-item corner"><div class="zx" @mousedown="PtzAction('downleft')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-zuoxia"></i>
          </div></div>
          <div class="ptz-item xia" @mousedown="PtzAction('down')" @mouseup="PtzAction('stop')"><i class="iconfont icon-xia"></i></div>
          <div class="ptz-item corner" ><div class="yx" @mousedown="PtzAction('downright')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-youxia"></i>
          </div></div>
        </div>
      </div>
      <div class="ptz-slider">
        <span>{{ ptzvalue }}</span>
        <el-slider v-model="ptzvalue" :show-tooltip="false" :max="1" :min="0.1" :step="0.1"></el-slider>
      </div>
      <el-timeline>
        <el-timeline-item placement="top" v-for="Pre in PresetData" :key="Pre.strName">
          <el-card>
            <div class="preset_bgc">
              <input type="text" class="preset_input" :value="Pre.strName" />
              <button type="button" class="iconfont icon-RectangleCopy1"
                @click="preset_jump(Pre.strToken)"></button>
              <button type="button" class="iconfont icon-icon-test1"
                @click="preset_set(Pre.strToken, $event)"></button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
    <div v-if="menuVisible" class="context-menu" :style="{ left: x + 'px', top: y + 'px' }">
      <div class="menu-item" @click="goSetup">Set Up</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.view-page {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;
  position: relative;
  .context-menu {
    width: 140px;
    padding: 10px 0;
    background-color: #3A3A3A;
    position: absolute;
    border-radius: 4px;
    .menu-item {
      width: 100%;
      height: 37px;
      font-size: 14px;
      text-align: center;
      line-height: 37px;
      cursor: pointer;
    }
    .menu-item:hover {
      background-color: #555555;
    }
  }
  .view-left {
    height: 100%;
    width: 280px;
    margin-right: 8px;
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
      background-image: url('../../assets/image/GridLogo.png');
      background-size: 22%;
      background-repeat: no-repeat;
      background-position: center center;
      position: relative;

      .malv {
        position: absolute;
        top: 20px;
        right: 16px;
        z-index: 100;
        width: 400px;
        height: 150px;
        // background-color: grey;
        display: flex;
        transition: 0.2s;
        .malv-close {
          position: absolute;
          top: 3px;
          right: 8px;
          font-size: 16px;
          cursor: pointer;
        }
        .malv-left, .malv-right {
          width: 50%;
          height: 100%;
          background-color: rgba($color: #333, $alpha: 0.5);
          .information_title {
            width: 100%;
            height: 30px;
            line-height: 30px;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 0 10px;
          }
          .information_content {
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 2px;

            .information_content_left {
              width: 50%;
              color: #3ABBFE;
              text-align: left;
            }

            .information_content_right {
              width: 50%;
              color: #3ABBFE;
              text-align: left;
            }

          }
        }
      }
      .malv-hide {
        right: -400px;
      }
    }

    .control {
      width: 100%;
      height: 160px;
      background-color: #252525;
      margin-top: 5px;
      display: flex;
      flex-direction: column;
      .timeline-box {
        width: 100%;
        height: 90px;
        padding: 0;
        box-sizing: border-box;
        border: none;
      }
      .control_btns {
        flex: 1;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        .caveat_butt {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 20%;
          .recodeType {
            font-size: 14px;
          }
          .showRecodeType {
            width: 24px;
            height: 32px;
            text-align: center;
            line-height: 32px;
            border-radius: 4px;
            margin-right: 10px;
            background-color: #424242;
            cursor: pointer;
          }

          .mr-1 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin: 0 5px;
            vertical-align: middle;
            background-color: rgb(60, 196, 60);
          }

          .mr-2 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin: 0 5px;
            vertical-align: middle;
            background-color: #ee1011;
          }

          .mr-0 {
            width: 15px;
            height: 15px;
            border-radius: 50px;
            border: 0;
            margin-right: 5px !important;
            vertical-align: middle;
            background-color: #31b1ff;
          }
        }
        button {
          padding: 0;
          border: none;
          background: none;
          font-size: 22px;
          margin-right: 10px;
          color: #fff;
        }
        :deep(.goto-live) {
          font-size: 14px;
          background-color: rgba(141,189,255,0.16);
          padding: 0 20px;

          span {
            color: #0399FE;
          }
        }
      }
      .control-center {
        display: flex;
        align-items: center;
        .resume-btn {
          i {
            font-size: 24px;
            cursor: pointer;
          }
        }
        :deep(.ele) {
          width: 45px;
          height: 24px;
          border-radius: 12px;
          background-color: #0399FE;
          margin: 0;
          padding: 0;
          margin-right: 10px;
          .el-select__wrapper {
            width: 100%;
            height: 100%;
            line-height: 24px;
            border: none;
            box-shadow: none;
            background-color: transparent;
            padding: 0;
            text-align: center;
          }
          .el-select__suffix {
            display: none;
          }
        }
        // :deep(.fixed_input) {
        :deep(.fixed_input) {
          width: 120px;
          margin-right: 20px;
          .el-input__wrapper {
            background-color: #121212;
            border: 0;
            box-shadow: none;

          }
        }
      }
    }
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
  .yuntai {
    position: absolute;
    left: 5px;
    bottom: 0;
    width: 275px;
    height: 550px;
    transition: 0.3s;
    background-color: rgba($color: #323232, $alpha: 1);
    .header {
      width: 100%;
      height: 32px;
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background-color: rgba($color: #2A2A2A, $alpha: 1);
      i {
        display: block;
        width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        border-radius: 50%;
        cursor: pointer;
        font-size: 10px;
        background-color: #232323;
      }
    }
    :deep(.el-timeline) {
      padding: 0 20px;
      margin-top: 10px;
      .el-timeline-item {
        padding: 0;
      }
      .el-timeline-item__wrapper {
        .el-timeline-item__timestamp {
          margin: 0;
          padding: 0;
        }
        .el-card {
          background-color: transparent;
          border: none;
        }
        .el-card__body {
          height: 26px;
          margin-bottom: 4px;
          padding: 0;
          background-color: rgba($color: #E5E7EB, $alpha: 0.12) !important;
        }
        .preset_bgc {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: transparent;
          padding: 0 10px;
          .preset_input{
            width: 150px;
            background-color: transparent;
            border: none;
            box-shadow: none;
            padding-left: 10px;
            color: #fff !important;
          }
          button {
            background-color: transparent;
            border: none;
            color: #fff !important;
            font-size: 16px;
            cursor: pointer;
          }
        }
      }
    }
    .ptz-slider {
      width: 100%;
      padding: 0 20px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      .el-slider {
        width: 100%;
      }
    }
    .controls {
      width: 100%;
      height: 144px;
      display: flex;
      justify-content: space-between;
      padding: 0 20px;
      margin: 20px 0;
      .left {
        width: 70px;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, 32px);
        grid-template-rows: repeat(4, 32px);
        grid-column-gap: 5px;
        grid-row-gap: 5px;
        i {
          display: flex;           // 用 flex 让文字居中
          align-items: center;
          justify-content: center;
          background-color: rgba($color: #E5E7EB, $alpha: 0.12);
          border-radius: 4px;
          width: 32px;
          height: 32px;
          font-size: 20px;
          cursor: pointer;
        }
        i:active {
          color: #0399FE;
        }
      }
      .right {
        width: 144px;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid-column-gap: 0px;
        grid-row-gap: 0px;
        .ptz-item {
          background-color: rgba($color: #E5E7EB, $alpha: 0.12);
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;

          i {
            font-size: 22px;
          }
        }
        .shang {border-radius: 4px 4px 0 0; cursor: pointer;}
        .zuo {border-radius: 4px 0 0 4px; cursor: pointer;}
        .you {border-radius: 0 4px 4px 0; cursor: pointer;}
        .xia {border-radius: 0 0 4px 4px; cursor: pointer;}
        .corner {
          background-color: transparent;
          .zs, .ys, .zx, .yx {
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 4px;
            background-color: rgba($color: #E5E7EB, $alpha: 0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            i {
              font-size: 20px;
            }
          }
          .zs {
            top: 0;
            left: 0;
          }
          .ys {
            top: 0;
            right: 0;
          }
          .zx {
            left: 0;
            bottom: 0;
          }
          .yx {
            right: 0;
            bottom: 0;
          }
        }
        .ptz-item:active {
          i {
            color: #0399FE;
          }
        }
      }
    }
  }
  .yuntai-hide {
    bottom: -550px;

  }
  .Audio_slider-bottom {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    width: 210px;

    i {
      // color: #999999;
      font-size: 20px;
    }

    .el-slider__runway {
      height: 3px;
      background-color: rgba(73, 74, 76, 0.5) !important;

      .el-slider__bar {
        height: 3px;
      }

      .el-slider__button-wrapper {
        height: 34px;
        width: 36px;

        .el-slider__button {
          width: 4px;
          border: 1px solid #409EFF;
          height: 12px;
          background-color: #409eff;
          border-radius: 0px;
        }
      }
    }
  }
}
</style>
<style lang="scss">
#timeline {
  .center-pointer line {
      stroke: #FEEF03;
      stroke-width: 2;
  }

  .label text {
    font-size: 14px;
  }
  .bar-name text {
      font-size: 12px;
  }

  .timeline-box {
      margin-top: 10px;
  }

  .x.axis line {
      stroke: #D8D8D8;
  }

  .x.axis text {
      fill: white;
  }

  .x.axis.minor line {
      stroke: #D8D8D8;
  }

  .x.axis.minor text {
      fill: #999999;
  }

  .domain {
      // stroke: #D8D8D8;
      display: none;
      visibility: hidden;
  }
}
.line-matrix {
  position: absolute;
  z-index: 40;
  top: 0;
  left: 0;
  line {
    shape-rendering: crispEdges;
    stroke: #585858;
  }
}
.cell-matrix {
  z-index: 42;
  position: absolute;
  top: 0;
  left: 0;
  .red_border {
    border: #f44336 2px solid;
  }
  .blue_dashed {
    border: #0399FE 2px dashed;
  }
  .playback_check_border {
    border: #CDFF00 2px solid;
  }
  div {
    overflow: hidden;
    position: absolute;
  }
  .grid_cell:hover  {
    .cell-i {
      bottom: 3px;
    }
    .float-layer {
      top: 0;
    }
  }
  // .grid_cell {
  //   transition: all 0.5s ease;
  // }
  .active {
    transform: scale(1.2);
    z-index: 100;
  }
  .float-layer {
    position: absolute;
    right: 0;
    top: -30px;
    z-index: 10;
    height: 30px;
    line-height: 30px;
    background: url('../../assets/image/liveview_buttback.png') no-repeat;
    background-size: 290px 30px;
    // background-color: pink;
    text-align: right;
    padding: 0 10px;
    transition: 0.2s;
    i, span {
      margin-left: 10px;
      font-size: 18px;
      cursor: pointer;
      color: #fff;
    }
    span {
      font-size: 14px;
    }
  }
  .cell-i {
    font-style: normal;
    position: absolute;
    bottom: -30px;
    right: 5px;
    color: aliceblue;
    font-size: 20px;
    z-index: 10;
    cursor: nwse-resize;
    transition: 0.2s;
  }
  .cell-close {
    font-style: normal;
    position: absolute;
    top: 3px;
    right: 5px;
    color: aliceblue;
    font-size: 20px;
    z-index: 10;
    cursor: pointer;
    display: none;
  }
}
.cell-highlighter {
  z-index: 44;
  position: absolute;
  top: 0;
  left: 0;
  display: none;
}
.Audio_slider-bottom {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  width: 210px;

  i {
    // color: #999999;
    font-size: 20px;
  }

  .el-slider__runway {
    height: 3px;
    background-color: rgba(73, 74, 76, 0.5) !important;

    .el-slider__bar {
      height: 3px;
    }

    .el-slider__button-wrapper {
      height: 34px;
      width: 36px;

      .el-slider__button {
        width: 4px;
        border: 1px solid #409EFF;
        height: 12px;
        background-color: #409eff;
        border-radius: 0px;
      }
    }
  }
}
</style>