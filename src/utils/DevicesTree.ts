import { computed } from 'vue';

import uuid from './uuid';
import { useSiteInfo } from '../store/site-info';
import { usePlayStore } from '../store/play';
import { useStore } from '../store';
import { GetAccessDeviceV2, GetCascadeHierarchyV2, GetDeviceChannelsV2, GetDevPartitionFilterNodeV2, GetDevPartitionItem, GetDevPartitionListWithPage, GetGroupListV2, GetLogicPartitionListV2, GetMapListV2, GetRoleListV2, GetSysConfigItemV2, GetUserConfigItemV2, PostDeviceChannelsAll } from '../api/map';
import { DiscoveredDevice } from '../types/site-info';

const siteStore = useSiteInfo()
const playStore = usePlayStore();
const store = useStore();
const darkMode = computed(() => store.darkMode);
const cameraIcon = darkMode ? 'iconfont icon-heishexiangjizaixian' : 'iconfont icon-baishexiangjizaixian';

var DevicePartitionData: any[] = [];// All devices and partition
var DevPartitionNoDevice: any[] = [];// Only partition,no device
var DevicePartitionStreamProfile: any = [];// Device partition has main stream profile
var DevicePartitionNoStreamProfile: any = [];// Device partition has no main stream profile
var AllDevicePartitionStreamProfile: any = [];// All device partition has main stream profile
var AllDevicePartitionNoStreamProfile: any = [];// All device partition has no main stream profile
var CasDevicePartition: any[] = [];// Cascading Partitions: Shows parent device partition if sub-partitions exist; filters out empty ones.
var CasDevicePartitionNoDevice: any[] = [];// Cascading Partitions only (No devices)
var CasDevicePartitionStreamProfile: any[] = [];// Device Partitions with main stream nodes (Cascading)
var CasDevicePartitionNoStreamProfile: any[] = [];// Device Partitions without main stream nodes (Cascading)
var AccessDevicePartition: any[] = [];// Device Partitions (Access Control)
var DevCasPartition: any[] = [];// Device & Cascading Partitions (No devices)

var DevicePartitionDataFilterNode: any[] = [];//FilterNode(EnablePartitionTreeCacheSearch)

var LogicPartitionDeviceData: any[] = [];// All Logical Partitions (With main stream nodes)
var LogicPartitionDeviceDataNoStreamProfile: any[] = [];// All Logical Partitions (Without main stream nodes)
var LogicPartitionNoDevice: any[] = [];// Logical Partitions only (No devices)

var GroupData: any[] = [];// Group List
var RoleData: any[] = [];// Role List
var MapData: any[] = [];// Map List
var UserData: any[] = [];// User Configuration


const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string; session: string; root: string; username: string;} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const target = devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if (!target) {
        return { target: null, access_token: '', session: '', root: '', username: '' };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        root: `${protocol}://${target.ipv4Address}:${port}`,
        username: target.username ? decodeURIComponent(target.username) : ''
    };
}

// usable type
// ("USC_CHANNEL", "USC_DEV_PARTITION", "USC_CAS_PARTITION", "USC_DEVICE", "USC_MAP", "USC_VIEW", "USC_ACCESS_DEVICE")
// get device parition
function DevicePartition(type?: string, EnableDevPartitionLazyLoading?: boolean, EnableDevPartitionShowDeviceNode?: boolean, devPartitionId: number = 10000): Promise<any> {
  const { username, access_token, root } = getDeviceInfo();
  if (EnableDevPartitionLazyLoading) {
    return GetDevPartitionItem({ root, access_token, devPartitionId });
  }
  const params:{pageSize?:number;type?:string} = {pageSize:100000};
  if(type)params.type = type;
  return GetDevPartitionListWithPage({ root, access_token, params });
}

// search to filter node
function DevPartitionFilterNode(filterText: string): Promise<any> {
  const { username, access_token, root } = getDeviceInfo();
  return GetDevPartitionFilterNodeV2({ root, access_token, params: { filterText } });
}

async function getdevicePartition(result: any, EnableDevPartitionShowDeviceNode?: boolean, filterText?: string) {
  if (result.status === 200 && result.data.code === 0) {
    var data = result.data.result;
    if (data) {
      for (let i = 0; i < data.length; i++) {
        var srcGroup: any = { children: [] };
        srcGroup.label = data[i].devPartitionName;
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.devPartitionId = data[i].devPartitionId;
        srcGroup.parentId = data[i].parentId;
        srcGroup.description = data[i].description;
        srcGroup.uuid = data[i].uuid;
        srcGroup.CustomUuid = data[i].uuid;
        srcGroup.DifferentType = 'Root';
        srcGroup.children = data[i].children ? await Fn(data[i].children, false, EnableDevPartitionShowDeviceNode, filterText) : [];
        srcGroup.enableGB = data[i].enableGB;
        srcGroup.cascadeCode = data[i].cascadeCode;
        srcGroup.regionCodeName = data[i].regionCodeName;
        
        if (data[i].dev) {
          var dev = data[i].dev;
          var AllChannel: string[] = [];
          for (let k = 0; k < dev.length; k++) {
            if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
              var newItem: any = {
                token: dev[k].token,
                label: dev[k].name,
                type: dev[k].type,
                DifferentType: 'dev',
                enabled: dev[k].enabled,
                iconclass: 'iconfont icon-Device',
                children: [],
                DevicesQuantity: true,
                isFilter: true,
                online: 0,
                length: 0,
                uuid: dev[k].token,
                CustomUuid: dev[k].token,
              };
              if (!dev[k].online) {
                newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
                newItem['iconclass4'] = 'el-tree-camera';
              }
              if (!filterText) {
                let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
                newItem.children.push(res);
                srcGroup.children.push(newItem);
              } else {
                if (dev[k].channels?.length > 0) {
                  channelFilterNode(dev[k].channels, newItem, srcGroup);
                } else {
                  srcGroup.children.push(newItem);
                }
              }
            } else if (EnableDevPartitionShowDeviceNode == false) {
              AllChannel.push(dev[k].token);
            }
          }
          if (AllChannel.length > 0) {
            var channel = {
              tokens: AllChannel,
            };
            await DevPartitionShowDeviceNode(channel, false, srcGroup);
          }
        }
        
        if (data[i].casDev) {
          var casDev = data[i].casDev;
          for (let k = 0; k < casDev.length; k++) {
            var newCasItem: any = {
              token: casDev[k].token,
              label: casDev[k].name,
              type: casDev[k].casType,
              DifferentType: 'casDev',
              enabled: casDev[k].enabled,
              gbId: casDev[k].gbId,
              devId: casDev[k].devId,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: casDev[k].token,
              CustomUuid: casDev[k].token,
            };
            if (!casDev[k].online) {
              newCasItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newCasItem['iconclass4'] = 'el-tree-camera';
            }
            if (!filterText) {
              let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
              newCasItem.children.push(res);
              srcGroup.children.push(newCasItem);
            } else {
              if (casDev[k].casPartition) {
                if (casDev[k].casPartition[0].children?.length > 0) {
                  newCasItem.children = CascadeChildren(casDev[k].casPartition[0].children, false, false, false, filterText);
                }
                if (casDev[k].casPartition[0].chan?.length > 0) {
                  CascadeChan(casDev[k].casPartition[0].chan, newCasItem, false, false);
                }
              }
              srcGroup.children.push(newCasItem);
            }
          }
        }

        if (data[i].map) {
          var map = data[i].map;
          for (let k = 0; k < map.length; k++) {
            var newMapItem: any = {
              token: map[k].mapId,
              label: map[k].mapName,
              type: map[k].type,
              DifferentType: 'map',
              iconclass: 'iconfont icon-ditu-dibiao',
              extent: map[k].extent,
              center: map[k].center,
              projection: map[k].projection,
              zoom: map[k].zoom,
              imgData: map[k].imgData,
              mapUrl: map[k].mapUrl,
              mapUrl2: map[k].mapUrl2,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: map[k].uuid,
              CustomUuid: map[k].uuid,
              disabled_me: false,
              maxZoom: map[k].maxZoom,
              minZoom: map[k].minZoom,
              centerCord: map[k].centerCord,
              tileX: map[k].tileX,
              tileY: map[k].tileY,
              onlineTile: map[k].onlineTile,
              systemDefaultMap: map[k].systemDefaultMap,
            };
            srcGroup.children.push(newMapItem);
          }
        }

        if (data[i].view) {
          var view = data[i].view;
          for (let k = 0; k < view.length; k++) {
            var newViewItem: any = {
              token: view[k].viewId,
              label: view[k].viewName,
              type: view[k].viewType,
              DifferentType: 'view',
              enabled: view[k].enabled,
              iconclass: 'iconfont icon-shitu2',
              isFilter: true,
              online: 0,
              length: 0,
              uuid: view[k].uuid,
              CustomUuid: view[k].uuid,
              disabled_me: false,
              dwellTimeShow: false, 
              dwellTime: 20, 
            };
            srcGroup.children.push(newViewItem);
          }
        }

        if (data[i].accessDev) {
          var accessDev = data[i].accessDev;
          for (let k = 0; k < accessDev.length; k++) {
            var newAccessItem: any = {
              token: accessDev[k].accessToken,
              label: accessDev[k].name,
              type: accessDev[k].type,
              DifferentType: 'accessDev',
              enabled: accessDev[k].enabled,
              accessController: accessDev[k].accessController,
              accessDevId: accessDev[k].accessDevId,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: accessDev[k].uuid,
              CustomUuid: accessDev[k].uuid,
            };
            if (!accessDev[k].online) {
              newAccessItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newAccessItem['iconclass4'] = 'el-tree-camera';
            }
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
            newAccessItem.children.push(res);
            srcGroup.children.push(newAccessItem);
          }
        }

        if (!filterText) {
          DevicePartitionData.push(srcGroup);
        } else {
          DevicePartitionDataFilterNode.push(srcGroup);
        }
        var srcGroup2 = JSON.parse(JSON.stringify(srcGroup));
        var srcGroup3 = await Fn1(srcGroup2);
        DevPartitionNoDevice.push(await Fn2(srcGroup3));

        var srcGroup4 = JSON.parse(JSON.stringify(srcGroup));
        DevCasPartition.push(await Fn3(srcGroup4));

        var srcGroup5 = JSON.parse(JSON.stringify(srcGroup));
        var srcGroup6 = await Fn3(srcGroup5);
        CasDevicePartition.push(await Fn4(srcGroup6));
      }
    }
  }
}

//  device partition lazy load
async function getdevicePartitionItem(result: any, EnableDevPartitionLazyLoading?: boolean, EnableDevPartitionShowDeviceNode?: boolean) {
    if (result.status === 200 && result.data.code === 0) {
      var data = result.data.result;
      var srcGroup: any = { children: [] };
      if (data.devPartitionId == 10000) {
        srcGroup.label = 'Root';
        srcGroup.DifferentType = 'Root';
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.devPartitionId = data.devPartitionId;
        srcGroup.parentId = data.parentId;
        srcGroup.description = data.description;
        srcGroup.uuid = data.uuid;
        srcGroup.CustomUuid = data.uuid;
        srcGroup.enableGB = data.enableGB;
        srcGroup.cascadeCode = data.cascadeCode;
        srcGroup.regionCodeName = data.regionCodeName;
      }
      srcGroup.children = data.children ? await Fn(data.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode) : [];
      if (data.dev) {
        var dev = data.dev;
        var AllChannel: string[] = [];
        for (let k = 0; k < dev.length; k++) {
          if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
            var newItem: any = {
              token: dev[k].token,
              label: dev[k].name,
              type: dev[k].type,
              DifferentType: 'dev',
              enabled: dev[k].enabled,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: dev[k].token,
              CustomUuid: dev[k].token,
            };
            if (!dev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
            newItem.children.push(res);
            srcGroup.children.push(newItem);
          } else if (EnableDevPartitionShowDeviceNode == false) {
            AllChannel.push(dev[k].token);
          }
        }
        if (AllChannel.length > 0) {
          var channel = {
            tokens: AllChannel,
          };
          await DevPartitionShowDeviceNode(channel, false, srcGroup);
        }
      }
      if (data.casDev) {
        var casDev = data.casDev;
        for (let k = 0; k < casDev.length; k++) {
          var newCasItem: any = {
            token: casDev[k].token,
            label: casDev[k].name,
            type: casDev[k].casType,
            DifferentType: 'casDev',
            enabled: casDev[k].enabled,
            gbId: casDev[k].gbId,
            devId: casDev[k].devId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: casDev[k].token,
            CustomUuid: casDev[k].token,
          };
          if (!casDev[k].online) {
            newCasItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newCasItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
          newCasItem.children.push(res);
          srcGroup.children.push(newCasItem);
        }
      }
      if (data.map) {
        var map = data.map;
        for (let k = 0; k < map.length; k++) {
          var newMapItem: any = {
            token: map[k].mapId,
            label: map[k].mapName,
            type: map[k].type,
            DifferentType: 'map',
            iconclass: 'iconfont icon-ditu-dibiao',
            extent: map[k].extent,
            center: map[k].center,
            projection: map[k].projection,
            zoom: map[k].zoom,
            imgData: map[k].imgData,
            mapUrl: map[k].mapUrl,
            mapUrl2: map[k].mapUrl2,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: map[k].uuid,
            CustomUuid: map[k].uuid,
            disabled_me: false,
            maxZoom: map[k].maxZoom,
            minZoom: map[k].minZoom,
            centerCord: map[k].centerCord,
            tileX: map[k].tileX,
            tileY: map[k].tileY,
            onlineTile: map[k].onlineTile,
            systemDefaultMap: map[k].systemDefaultMap,
          };
          srcGroup.children.push(newMapItem);
        }
      }
      if (data.view) {
        var view = data.view;
        for (let k = 0; k < view.length; k++) {
          var newViewItem: any = {
            token: view[k].viewId,
            label: view[k].viewName,
            type: view[k].viewType,
            DifferentType: 'view',
            enabled: view[k].enabled,
            iconclass: 'iconfont icon-shitu2',
            isFilter: true,
            online: 0,
            length: 0,
            uuid: view[k].uuid,
            CustomUuid: view[k].uuid,
            disabled_me: false,
            dwellTimeShow: false, 
            dwellTime: 20, 
          };
          srcGroup.children.push(newViewItem);
        }
      }
      if (data.accessDev) {
        var accessDev = data.accessDev;
        for (let k = 0; k < accessDev.length; k++) {
          var newAccessItem: any = {
            token: accessDev[k].accessToken,
            label: accessDev[k].name,
            type: accessDev[k].type,
            DifferentType: 'accessDev',
            enabled: accessDev[k].enabled,
            accessController: accessDev[k].accessController,
            accessDevId: accessDev[k].accessDevId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: accessDev[k].uuid,
            CustomUuid: accessDev[k].uuid,
          };
          if (!accessDev[k].online) {
            newAccessItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newAccessItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
          newAccessItem.children.push(res);
          srcGroup.children.push(newAccessItem);
        }
      }
      if (data.devPartitionId == 10000) {
        DevicePartitionData.push(srcGroup);
      } else {
        DevicePartitionData = srcGroup.children;
      }

      var srcGroup2 = JSON.parse(JSON.stringify(srcGroup));
      var srcGroup3 = await Fn1(srcGroup2);
      DevPartitionNoDevice.push(await Fn2(srcGroup3));

      var srcGroup4 = JSON.parse(JSON.stringify(srcGroup));
      DevCasPartition.push(await Fn3(srcGroup4));

      var srcGroup5 = JSON.parse(JSON.stringify(srcGroup));
      var srcGroup6 = await Fn3(srcGroup5);
      CasDevicePartition.push(await Fn4(srcGroup6));
    }
}

// search filtered channel
function channelFilterNode(channels: any[], ParentItem: any, srcGroup: any, fromPage?: boolean) {
  var res = channels;
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;
  
  // To avoid undefined variable usage error, assigning a boolean implicitly handled above
  let isDisabledExempt = false;

  for (let k = 0; k < res.length; k++) {
    if (res[k].online && res[k].enabled) {
      number = number + 1;
    }
    var newItem: any = {
      token: res[k].token,
      label: res[k].name,
      name: res[k].name,
      type: res[k].type,
      DifferentType: 'devChannel',
      enabled: res[k].enabled,
      iconclass: cameraIcon,
      devChannel: res[k].devChannel,
      disabled_me: false,
      children: [],
      nodeId: res[k].nodeId,
      online: res[k].online,
      parentToken: res[k].parentToken,
      dome: res[k].dome,
      alias: res[k].alias,
      iconclass1: '',
      icontype: '',
      uuid: res[k].uuid,
      CustomUuid: res[k].uuid,
      setting: res[k].setting,
      recording: res[k].recording,
      metaEnabled: res[k].metaEnabled,
      longitude: res[k].longitude,
      latitude: res[k].latitude,
    };
    if (res[k].online == true) {
      newItem['bOnline'] = true;
    } else if (res[k].online == false) {
      newItem['bOnline'] = false;
    }
    if (!res[k].online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (res[k].recording == true) {
      if (res[k].dome == true) {
        if (darkMode) {
          newItem['iconclass2'] = '#icon-baiqiuji';
        } else {
          newItem['iconclass2'] = '#icon-heiqiuji';
        }
      } else {
        if (darkMode) {
          newItem['iconclass2'] = '#icon-baishexiangji';
        } else {
          newItem['iconclass2'] = '#icon-heishexiangji';
        }
      }
      newItem['recording'] = true;
    } else if (res[k].recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (res[k].enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (res[k].enabled == false) {
      if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (res[k].enabled == false && playStore.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      if (!isDisabledExempt) {
        continue;
      }
    }
    if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    if (fromPage) {
      const { username } = getDeviceInfo();
      if (username && localStorage.getItem(username)) {
        let localToken = JSON.parse(localStorage.getItem(username) as string)['src'];
        for (let i = 0; i < localToken.length; i++) {
          const playtoken = localToken[i]['strToken'];
          if (playtoken == res[k].token && res[k].online == true) {
            newItem['iconclass'] = cameraIcon;
            newItem['iconclass1'] = 'el-tree-camera-play';
            newItem['iconclass3'] = 'none';
            newItem['iconclass4'] = '';
            if (res[k].recording) {
              if (res[k].dome == true) {
                newItem['iconclass2'] = '#icon-lvqiuji';
              } else {
                newItem['iconclass2'] = '#icon-lvshexiangji';
              }
            }
          }
        }
      }
    }
    if (res[k].dome == true) {
      if (!res[k].online) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }
    var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
    if (!res[k].online || res[k].disabled_me) {
      ParentItem.children.push(NoStreamProfileItem);
    } else {
      ParentItem.children.unshift(NoStreamProfileItem);
    }
  }
  srcGroup.children.push(ParentItem);
}

// the children partitions and devices
async function Fn(data: any[], EnableDevPartitionLazyLoading?: boolean, EnableDevPartitionShowDeviceNode?: boolean, filterText?: string): Promise<any[]> {
  let result: any[] = [];
  for (let i = 0; i < data.length; i++) {
    let item = data[i];
    if (item.dev || item.casDev || item.map || item.view || item.accessDev) {
      var devChildren: any = {
        parentId: item.parentId,
        devPartitionId: item.devPartitionId,
        label: item.devPartitionName,
        description: item.description,
        uuid: item.uuid,
        CustomUuid: item.uuid,
        iconclass: 'iconfont icon-gen',
        DifferentType: 'PartitionNode',
        disOrder: item.disOrder,
        enableGB: item.enableGB,
        cascadeCode: item.cascadeCode,
        regionCodeName: item.regionCodeName,
        children: item.children ? await Fn(item.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, filterText) : [] 
      }
      if (item.dev) {
        var AllChannel: string[] = [];
        for (let k = 0; k < item.dev.length; k++) {
          if (EnableDevPartitionShowDeviceNode || EnableDevPartitionShowDeviceNode == undefined) {
            var newItem: any = {
              token: item.dev[k].token,
              label: item.dev[k].name,
              type: item.dev[k].type,
              DifferentType: 'dev',
              enabled: item.dev[k].enabled,
              iconclass: 'iconfont icon-Device',
              children: [],
              DevicesQuantity: true,
              isFilter: true,
              online: 0,
              length: 0,
              uuid: item.dev[k].token,
              CustomUuid: item.dev[k].token,
            };
            if (!item.dev[k].online) {
              newItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if (!filterText) {
              let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
              newItem.children.push(res);
              devChildren.children.push(newItem);
            } else {
              if (item.dev[k].channels?.length > 0) {
                channelFilterNode(item.dev[k].channels, newItem, devChildren);
              } else {
                devChildren.children.push(newItem);
              }
            }
          } else if (EnableDevPartitionShowDeviceNode == false) {
            AllChannel.push(item.dev[k].token);
          }
        }
        if (AllChannel.length > 0) {
          var channel = {
            tokens: AllChannel,
          }
          await DevPartitionShowDeviceNode(channel, false, devChildren); 
        }
      }
      if (item.casDev) {
        for (let k = 0; k < item.casDev.length; k++) {
          var newCasItem: any = {
            token: item.casDev[k].token,
            label: item.casDev[k].name,
            type: item.casDev[k].casType,
            DifferentType: 'casDev',
            enabled: item.casDev[k].enabled,
            gbId: item.casDev[k].gbId,
            devId: item.casDev[k].devId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.casDev[k].token,
            CustomUuid: item.casDev[k].token,
          };
          if (!item.casDev[k].online) {
            newCasItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newCasItem['iconclass4'] = 'el-tree-camera';
          }
          if (!filterText) {
            let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
            newCasItem.children.push(res);
            devChildren.children.push(newCasItem);
          } else {
            if (item.casDev[k].casPartition) {
              if (item.casDev[k].casPartition[0].children?.length > 0) {
                newCasItem.children = CascadeChildren(item.casDev[k].casPartition[0].children, false, false, false, filterText);
              }
              if (item.casDev[k].casPartition[0].chan?.length > 0) {
                CascadeChan(item.casDev[k].casPartition[0].chan, newCasItem, false, false);
              }
            }
            devChildren.children.push(newCasItem);
          }
        }
      }
      if (item.map) {
        for (let k = 0; k < item.map.length; k++) {
          var newMapItem: any = {
            token: item.map[k].mapId,
            label: item.map[k].mapName,
            type: item.map[k].type,
            DifferentType: 'map',
            iconclass: 'iconfont icon-ditu-dibiao',
            extent: item.map[k].extent,
            center: item.map[k].center,
            projection: item.map[k].projection,
            zoom: item.map[k].zoom,
            imgData: item.map[k].imgData,
            mapUrl: item.map[k].mapUrl,
            mapUrl2: item.map[k].mapUrl2,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.map[k].uuid,
            CustomUuid: item.map[k].uuid,
            disabled_me: false,
            maxZoom: item.map[k].maxZoom,
            minZoom: item.map[k].minZoom,
            centerCord: item.map[k].centerCord,
            tileX: item.map[k].tileX,
            tileY: item.map[k].tileY,
            onlineTile: item.map[k].onlineTile,
            systemDefaultMap: item.map[k].systemDefaultMap,
          };
          devChildren.children.push(newMapItem);
        }
      }
      if (item.view) {
        for (let k = 0; k < item.view.length; k++) {
          var newViewItem: any = {
            token: item.view[k].viewId,
            label: item.view[k].viewName,
            type: item.view[k].viewType,
            DifferentType: 'view',
            enabled: item.view[k].enabled,
            iconclass: 'iconfont icon-shitu2',
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.view[k].uuid,
            CustomUuid: item.view[k].uuid,
            disabled_me: false,
            dwellTimeShow: false, 
            dwellTime: 20, 
          };
          devChildren.children.push(newViewItem);
        }
      }
      if (item.accessDev) {
        for (let k = 0; k < item.accessDev.length; k++) {
          var newAccessItem: any = {
            token: item.accessDev[k].accessToken,
            label: item.accessDev[k].name,
            type: item.accessDev[k].type,
            DifferentType: 'accessDev',
            enabled: item.accessDev[k].enabled,
            accessController: item.accessDev[k].accessController,
            accessDevId: item.accessDev[k].accessDevId,
            iconclass: 'iconfont icon-Device',
            children: [],
            DevicesQuantity: true,
            isFilter: true,
            online: 0,
            length: 0,
            uuid: item.accessDev[k].uuid,
            CustomUuid: item.accessDev[k].uuid,
          };
          if (!item.accessDev[k].online) {
            newAccessItem['iconclass'] = 'iconfont icon-Devicelixian el-tree-camera';
            newAccessItem['iconclass4'] = 'el-tree-camera';
          }
          let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
          newAccessItem.children.push(res);
          devChildren.children.push(newAccessItem);
        }
      }
      result.push(devChildren);
    } else {
      var children: any[] = [];
      let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
      children.push(res);
      result.push({
        parentId: item.parentId,
        devPartitionId: item.devPartitionId,
        label: item.devPartitionName,
        description: item.description,
        uuid: item.uuid,
        CustomUuid: item.uuid,
        iconclass: 'iconfont icon-gen',
        DifferentType: 'PartitionNode',
        disOrder: item.disOrder,
        enableGB: item.enableGB,
        cascadeCode: item.cascadeCode,
        regionCodeName: item.regionCodeName,
        children: item.children && item.children.length > 0 ? await Fn(item.children, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, filterText) : (EnableDevPartitionLazyLoading ? children : [])
      });
    }
  }
  result.sort((a, b) => a.disOrder - b.disOrder);
  return result;
}

// device partition,filter device
function Fn1(data: any): any {
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      if (data.children[i].isFilter) {
        data.children[i] = {};
      } else {
        if (data.children[i].children) {
          Fn1(data.children[i]);
        }
      }
    }
  }
  return data;
}

function Fn2(data: any): any {
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      if (JSON.stringify(data.children[i]) == '{}') {
        if (JSON.stringify(data.children) == '[]' || data.children.length === 1 && JSON.stringify(data.children[0]) == '{}') {
          data.children = [];
        } else {
          data.children.splice(i, 1);
          i--;
        }
      } else {
        if (data.children[i].children) {
          Fn2(data.children[i]);
        }
      }
    }
  }
  return data;
}

// Filter out non-cascading items under device partitions 
function Fn3(data: any): any {
  if (Array.isArray(data.children)) {
    for (let i = 0; i < data.children.length; i++) {
      if (data.children[i].DifferentType == 'dev' || data.children[i].DifferentType == 'map' || data.children[i].DifferentType == 'view' || data.children[i].DifferentType == 'accessDev' || data.children[i].DifferentType == 'devChannel' || data.children[i].DifferentType == 'CasDevChannel') {
        data.children.splice(i, 1);
        i--;
        continue;
      } else if (data.children[i].DifferentType == 'PartitionNode' || data.children[i].DifferentType == 'casDev' || data.children[i].DifferentType == 'CasDevChildren') {
        Fn3(data.children[i]);
      }
    }
  }
  return data;
}

// Keep only cascading items under device partitions
function Fn4(node: any): any {
  if (!node.children || !Array.isArray(node.children)) {
    return null;
  }
  const filteredChildren = node.children.filter((child:any) => {
    if (child.DifferentType === 'casDev') {
      return true; 
    }
    const result = Fn4(child); 
    return result !== null; 
  });
  
  node.children = filteredChildren;
  const hasCasDevChild = node.children.some((child: any) => child.DifferentType === 'casDev');
  
  if (node.DifferentType === 'casDev') {
    return node;
  }
  if (!hasCasDevChild && node.children.length === 0) {
    return null;
  }
  return node;
}

// get channel under device
function DeviceChannels(token: string, isDisabledExempt?: boolean): Promise<any> {
  const { username, access_token, root } = getDeviceInfo();
  const all = isDisabledExempt || playStore.devicemarktoggle === 'true';
  return GetDeviceChannelsV2({ root, access_token, params: { token, all } });
}

function channelThen(result: any, isDisabledExempt?: boolean, fromPage?: boolean, srcGroup?: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var number = 0;
      var numberbDisable = 0;
      var offlineNumber = 0;
      var disableNumber = 0;
      var IdleNumber = 0;

      var tempStream: any[] = [];
      var tempNoStream: any[] = [];

      for (let k = 0; k < res.length; k++) {
        if (res[k].online && res[k].enabled) {
          number = number + 1;
        }
        var newItem: any = {
          token: res[k].token,
          label: res[k].name,
          name: res[k].name,
          type: res[k].type,
          DifferentType: 'devChannel',
          enabled: res[k].enabled,
          iconclass: cameraIcon,
          devChannel: res[k].devChannel,
          disabled_me: false,
          children: [],
          nodeId: res[k].nodeId,
          online: res[k].online,
          parentToken: res[k].parentToken,
          dome: res[k].dome,
          alias: res[k].alias,
          iconclass1: '',
          icontype: '',
          uuid: res[k].uuid,
          CustomUuid: res[k].uuid,
          setting: res[k].setting,
          recording: res[k].recording,
          metaEnabled: res[k].metaEnabled,
          longitude: res[k].longitude,
          latitude: res[k].latitude,
        };
        if (res[k].online == true) {
          newItem['bOnline'] = true;
        } else if (res[k].online == false) {
          newItem['bOnline'] = false;
        }
        if (!res[k].online) {
          newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
        }
        if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
          offlineNumber = offlineNumber + 1;
        }
        if (res[k].recording == true) {
          if (res[k].dome == true) {
            newItem['iconclass2'] = darkMode ? '#icon-baiqiuji' : '#icon-heiqiuji';
          } else {
            newItem['iconclass2'] = darkMode ? '#icon-baishexiangji' : '#icon-heishexiangji';
          }
          newItem['recording'] = true;
        } else if (res[k].recording == false) {
          newItem['recording'] = false;
          newItem['iconclass2'] = '';
        }
        if (res[k].enabled == false) {
          newItem['disabled_me'] = true;
          newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera camera';
        }
        if (res[k].enabled == false) {
          if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
            disableNumber = disableNumber + 1;
          }
        }
        if (res[k].enabled == false && playStore.devicemarktoggle == 'false') {
          numberbDisable = numberbDisable + 1;
          if (!isDisabledExempt) {
            continue;
          }
        }
        if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
          newItem['idle'] = true;
          newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
          IdleNumber = IdleNumber + 1;
        }
        if (res[k].dome == true) {
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
          } else {
            newItem['iconclass'] = 'iconfont icon-zaixian';
          }
        }
        var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
        
        tempStream.push(newItem);
        tempNoStream.push(NoStreamProfileItem);

        tempStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });
        tempNoStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });

        DevicePartitionStreamProfile = tempStream as any;
        DevicePartitionNoStreamProfile = tempNoStream as any;

        if(srcGroup){
          srcGroup.children = tempStream;
        }

        (DevicePartitionNoStreamProfile as any).AllLength = result.data.result.length - numberbDisable;
        (DevicePartitionNoStreamProfile as any).online = number;
        (DevicePartitionNoStreamProfile as any).offline = offlineNumber;
        (DevicePartitionNoStreamProfile as any).disable = disableNumber;
        (DevicePartitionNoStreamProfile as any).idle = IdleNumber;

        (DevicePartitionStreamProfile as any).AllLength = result.data.result.length - numberbDisable;
        (DevicePartitionStreamProfile as any).online = number;
        (DevicePartitionStreamProfile as any).offline = offlineNumber;
        (DevicePartitionStreamProfile as any).disable = disableNumber;
        (DevicePartitionStreamProfile as any).idle = IdleNumber;
      }
    }
  }
}

// get all channels under device
function DeviceChannelsAll(data: any): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return PostDeviceChannelsAll({ root, access_token, data });
}

function channelThenAll(result: any, isDisabledExempt?: boolean, srcGroup?: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var number = 0;
      var numberbDisable = 0;
      var offlineNumber = 0;
      var disableNumber = 0;
      var IdleNumber = 0;

      var tempStream: any[] = [];
      var tempNoStream: any[] = [];

      for (let k = 0; k < res.length; k++) {
        if (res[k].online && res[k].enabled) {
          number = number + 1;
        }
        var newItem: any = {
          token: res[k].token,
          label: res[k].name,
          name: res[k].name,
          type: res[k].type,
          DifferentType: 'devChannel',
          enabled: res[k].enabled,
          iconclass: cameraIcon,
          devChannel: res[k].devChannel,
          disabled_me: false,
          children: [],
          nodeId: res[k].nodeId,
          online: res[k].online,
          parentToken: res[k].parentToken,
          dome: res[k].dome,
          alias: res[k].alias,
          iconclass1: '',
          icontype: '',
          uuid: res[k].uuid,
          CustomUuid: res[k].uuid,
          setting: res[k].setting,
          recording: res[k].recording,
          metaEnabled: res[k].metaEnabled,
          longitude: res[k].longitude,
          latitude: res[k].latitude,
        };
        if (res[k].online == true) {
          newItem['bOnline'] = true;
        } else if (res[k].online == false) {
          newItem['bOnline'] = false;
        }
        if (!res[k].online) {
          newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
        }
        if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
          offlineNumber = offlineNumber + 1;
        }
        if (res[k].recording == true) {
          if (res[k].dome == true) {
            newItem['iconclass2'] = darkMode ? '#icon-baiqiuji' : '#icon-heiqiuji';
          } else {
            newItem['iconclass2'] = darkMode ? '#icon-baishexiangji' : '#icon-heishexiangji';
          }
          newItem['recording'] = true;
        } else if (res[k].recording == false) {
          newItem['recording'] = false;
          newItem['iconclass2'] = '';
        }
        if (res[k].enabled == false) {
          newItem['disabled_me'] = true;
          newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera camera';
        }
        if (res[k].enabled == false) {
          if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
            disableNumber = disableNumber + 1;
          }
        }
        if (res[k].enabled == false && playStore.devicemarktoggle == 'false') {
          numberbDisable = numberbDisable + 1;
          if (!isDisabledExempt) {
            continue;
          }
        }
        if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
          newItem['idle'] = true;
          newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
          newItem['iconclass4'] = 'el-tree-camera';
          IdleNumber = IdleNumber + 1;
        }
        if (res[k].dome == true) {
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
          } else {
            newItem['iconclass'] = 'iconfont icon-zaixian';
          }
        }
        var NoStreamProfileItem = JSON.parse(JSON.stringify(newItem));
        
        tempStream.push(newItem);
        tempNoStream.push(NoStreamProfileItem);

        tempStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });
        tempNoStream.sort((a,b) =>{
          if(a.online === true && b.online !== true )return -1;
          if(a.online !== true && b.online === true )return 1;
          return 0;
        });

        AllDevicePartitionStreamProfile = tempStream as any;
        AllDevicePartitionNoStreamProfile = tempNoStream as any;

        if(srcGroup){
          srcGroup.children = tempStream;
        }
        (AllDevicePartitionNoStreamProfile as any).AllLength = result.data.result.length - numberbDisable;
        (AllDevicePartitionNoStreamProfile as any).online = number;
        (AllDevicePartitionNoStreamProfile as any).offline = offlineNumber;
        (AllDevicePartitionNoStreamProfile as any).disable = disableNumber;
        (AllDevicePartitionNoStreamProfile as any).idle = IdleNumber;

        (AllDevicePartitionStreamProfile as any).AllLength = result.data.result.length - numberbDisable;
        (AllDevicePartitionStreamProfile as any).online = number;
        (AllDevicePartitionStreamProfile as any).offline = offlineNumber;
        (AllDevicePartitionStreamProfile as any).disable = disableNumber;
        (AllDevicePartitionStreamProfile as any).idle = IdleNumber;
      }
    }
  }
}

// get all channels under device
async function DevPartitionShowDeviceNode(data: any, isDisabledExempt?: boolean, srcGroup?: any) {
  try {
    const { access_token, root } = getDeviceInfo();
    const result = await PostDeviceChannelsAll({ root, access_token, data }) as any;
    if (result.status === 200 && result.data.code === 0) {
      if (result.data.msg == 'Success') {
        var res = result.data.result;
        var number = 0;
        var numberbDisable = 0;
        var offlineNumber = 0;
        var disableNumber = 0;
        var IdleNumber = 0;

        var tempChildren: any[] = [];
        for (let k = 0; k < res.length; k++) {
          if (res[k].online && res[k].enabled) {
            number = number + 1;
          }
          var newItem: any = {
            token: res[k].token,
            label: res[k].name,
            name: res[k].name,
            type: res[k].type,
            DifferentType: 'devChannel',
            enabled: res[k].enabled,
            iconclass: cameraIcon,
            devChannel: res[k].devChannel,
            disabled_me: false,
            children: [],
            nodeId: res[k].nodeId,
            online: res[k].online,
            parentToken: res[k].parentToken,
            dome: res[k].dome,
            alias: res[k].alias,
            iconclass1: '',
            icontype: '',
            uuid: res[k].uuid,
            CustomUuid: res[k].uuid,
            setting: res[k].setting,
            recording: res[k].recording,
            metaEnabled: res[k].metaEnabled,
            longitude: res[k].longitude,
            latitude: res[k].latitude,
          };
          if (res[k].online == true) {
            newItem['bOnline'] = true;
          } else if (res[k].online == false) {
            newItem['bOnline'] = false;
          }
          if (!res[k].online) {
            newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
          }
          if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
            offlineNumber = offlineNumber + 1;
          }
          if (res[k].recording == true) {
            if (res[k].dome == true) {
              newItem['iconclass2'] = darkMode ? '#icon-baiqiuji' : '#icon-heiqiuji';
            } else {
              newItem['iconclass2'] = darkMode ? '#icon-baishexiangji' : '#icon-heishexiangji';
            }
            newItem['recording'] = true;
          } else if (res[k].recording == false) {
            newItem['recording'] = false;
            newItem['iconclass2'] = '';
          }
          if (res[k].enabled == false) {
            newItem['disabled_me'] = true;
            newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera camera';
          }
          if (res[k].enabled == false) {
            if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
              disableNumber = disableNumber + 1;
            }
          }
          if (res[k].enabled == false && playStore.devicemarktoggle == 'false') {
            numberbDisable = numberbDisable + 1;
            if (!isDisabledExempt) {
              continue;
            }
          }
          if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
            newItem['idle'] = true;
            newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
            newItem['iconclass4'] = 'el-tree-camera';
            IdleNumber = IdleNumber + 1;
          }
          if (res[k].dome == true) {
            if (!res[k].online) {
              newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
            } else {
              newItem['iconclass'] = 'iconfont icon-zaixian';
            }
          }
          
          tempChildren.push(newItem);

          tempChildren.sort((a, b) => {
            if (a.online === true && b.online !== true) return -1;
            if (a.online !== true && b.online === true) return 1;
            return 0;
          });

          if(srcGroup){
            srcGroup.children = tempChildren;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching device channels:', error);
  }
}

function CascadeHierarchy(token: string, casPartitionToken: string = token): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetCascadeHierarchyV2({ root, access_token, params: { token, casPartitionToken } });
}

function CascadeThen(result: any, isDisabledExempt?: boolean) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      let item = result.data.result;
      let srcGroup: any = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      let srcGroup1: any = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      let srcGroup2: any = { children: [], uuid: item.uuid, casPartitionId: item.casPartitionId };
      
      if (item.children?.length > 0) {
        srcGroup.children = CascadeChildren(item.children, false, false, isDisabledExempt);
      }
      if (item.chan?.length > 0) {
        CascadeChan(item.chan, srcGroup, false, isDisabledExempt);
      }
      if (item.children?.length > 0) {
        srcGroup1.children = CascadeChildren(item.children, true, false, isDisabledExempt);
      }
      if (item.chan?.length > 0) {
        CascadeChan(item.chan, srcGroup1, true, isDisabledExempt);
      }
      if (item.children?.length > 0) {
        srcGroup2.children = CascadeChildren(item.children, true, true, isDisabledExempt);
      }
      CasDevicePartitionNoDevice.push(srcGroup2)
      CasDevicePartitionStreamProfile.push(srcGroup);
      CasDevicePartitionNoStreamProfile.push(srcGroup1);
    }
  }
}

function CascadeChildren(data: any[], NoStreamProfile?: boolean, NoDevice?: boolean, isDisabledExempt?: boolean, filterText?: string): any[] {
  let resData = data.map(item => {
    var devChildren: any = {
      parentId: item.parentId,
      casPartitionId: item.casPartitionId,
      label: item.casPartitionName,
      token: item.token,
      rootToken: item.rootToken,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      iconclass: 'iconfont icon-gen',
      DifferentType: 'CasDevChildren',
      disOrder: item.disOrder,
      children: [] 
    }
    if (!NoDevice && item.chan) {
      CascadeChan(item.chan, devChildren, NoStreamProfile, isDisabledExempt);
    }
    if (!filterText) {
      let res = { EmptyItem: 1, uuid: uuid(), CustomUuid: uuid() };
      devChildren.children.push(res);
    } else {
      if (item.children) {
        devChildren.children = CascadeChildren(item.children, NoStreamProfile, NoDevice, isDisabledExempt, filterText);
      }
    }
    return devChildren;
  })
  resData.sort((a, b) => a.disOrder - b.disOrder);
  return resData;
}

function CascadeChan(res: any[], data: any, NoStreamProfile?: boolean, isDisabledExempt?: boolean) {
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;

  var tempChildren: any[] = [];

  for (let k = 0; k < res.length; k++) {
    var newItem: any = {
      token: res[k].token,
      label: res[k].name,
      name: res[k].name,
      type: res[k].type,
      DifferentType: 'CasDevChannel',
      enabled: res[k].enabled,
      iconclass: cameraIcon,
      devChannel: res[k].devChannel,
      disabled_me: false,
      children: [],
      nodeId: res[k].nodeId,
      online: res[k].online,
      parentToken: res[k].parentToken,
      dome: res[k].dome,
      alias: res[k].alias,
      iconclass1: '',
      icontype: '',
      uuid: res[k].uuid,
      CustomUuid: res[k].uuid,
      setting: res[k].setting,
      recording: res[k].recording,
      metaEnabled: res[k].metaEnabled,
      longitude: res[k].longitude,
      latitude: res[k].latitude,
    };
    if (res[k].online == true) {
      newItem['bOnline'] = true;
    } else if (res[k].online == false) {
      newItem['bOnline'] = false;
    }
    if (!res[k].online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!res[k].online && res[k].idle == false && res[k].enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (res[k].recording == true) {
      if (res[k].dome == true) {
        newItem['iconclass2'] = darkMode ? '#icon-baiqiuji' : '#icon-heiqiuji';
      } else {
        newItem['iconclass2'] = darkMode ? '#icon-baishexiangji' : '#icon-heishexiangji';
      }
      newItem['recording'] = true;
    } else if (res[k].recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (res[k].enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (res[k].enabled == false) {
      if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (res[k].enabled == false && playStore.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      if (!isDisabledExempt) {
        continue;
      }
    }
    if (res[k].idle == true && res[k].enabled == true && !res[k].online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    const { username } = getDeviceInfo();
    if (username && localStorage.getItem(username)) {
      let localToken = JSON.parse(localStorage.getItem(username) as string)['src'];
      for (let i = 0; i < localToken.length; i++) {
        const playtoken = localToken[i]['strToken'];
        if (playtoken == res[k].token && res[k].online == true) {
          newItem['iconclass'] = cameraIcon;
          newItem['iconclass1'] = 'el-tree-camera-play';
          newItem['iconclass3'] = 'none';
          if (res[k].recording) {
            if (res[k].dome == true) {
              newItem['iconclass2'] = '#icon-lvqiuji';
            } else {
              newItem['iconclass2'] = '#icon-lvshexiangji';
            }
          }
        }
      }
    }
    if (res[k].dome == true) {
      if (!res[k].online) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }

    tempChildren.push(newItem);

    tempChildren.sort((a, b) => {
      if (a.online === true && b.online !== true) return -1;
      if (a.online !== true && b.online === true) return 1;
      return 0;
    });

    data.children = tempChildren;

    data.AllLength = res.length - numberbDisable;
    data.online = number;
    data.offline = offlineNumber;
    data.disable = disableNumber;
    data.idle = IdleNumber;
  }
}

function AccessDevice(token: string): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetAccessDeviceV2({ root, access_token, token });
}

function AccessThen(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var srcGroup: any = { children: [] };
      if (res.accessController.length > 0) {
        srcGroup.children = AccessChildren(res.accessController, res.accessToken);
      }
      AccessDevicePartition.push(srcGroup);
    }
  }
}

function AccessChildren(data: any[], accessToken: string): any[] {
  return data.map(item => {
    return {
      accessControllerId: item.accessControllerId,
      accessDevId: item.accessDevId,
      module: item.module,
      name: item.name,
      online: item.online,
      sn: item.sn,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      type: item.type,
      accessToken: accessToken,
      iconclass: 'iconfont icon-kongzhiqi',
      DifferentType: 'AccessChildren',
      children: item.Doors ? Doors(item.Doors, accessToken) : []
    }
  })
}

function Doors(data: any[], accessToken: string): any[] {
  return data.map(item => {
    return {
      alarm: item.alarm,
      connect: item.connect,
      controlUUID: item.controlUUID,
      controllerId: item.controllerId,
      id: item.id,
      name: item.name,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      relay: item.relay,
      sensor: item.sensor,
      accessToken: accessToken,
      iconclass: 'iconfont icon-kaimen',
      DifferentType: 'AccessChildrenDoors',
      children: item.Readers ? Readers(item.Readers, accessToken) : []
    }
  })
}

function Readers(data: any[], accessToken: string): any[] {
  return data.map(item => {
    return {
      DoorId: item.DoorId,
      doorUUID: item.doorUUID,
      id: item.id,
      name: item.name,
      uuid: item.uuid,
      CustomUuid: item.uuid,
      readerNo: item.readerNo,
      readerState: item.readerState,
      accessToken: accessToken,
      iconclass: 'iconfont icon-dukaqi',
      DifferentType: 'AccessChildrenReaders',
    }
  })
}

function LogicPartition(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetLogicPartitionListV2({ root, access_token });
}

function LogicPartitionDevice(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var data = result.data.result;
      if (!data) {
        return;
      }
      for (let i = 0; i < data.length; i++) {
        var tree: any = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        var tree1: any = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children, true),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        var tree2: any = {
          label: data[i].logicPartitionName,
          iconclass: 'iconfont icon-gen',
          id: data[i].id,
          parentId: data[i].parentId,
          description: data[i].description,
          children: FnChildrenDevice(data[i].children, false, true),
          uuid: data[i].uuid,
          disOrder: data[i].disOrder,
          LogicPartitionType: 'LogicPartition',
        }
        if (data[i].channel.length > 0) {
          FnChildrenChannel(FnChannel(data[i].channel), tree);
        }
        if (data[i].channel.length > 0) {
          FnChildrenChannel(FnChannel(data[i].channel), tree2, true);
        }
        LogicPartitionDeviceData.push(tree);
        LogicPartitionNoDevice.push(tree1);
        LogicPartitionDeviceDataNoStreamProfile.push(tree2);
      }
      LogicPartitionDeviceData.sort((a, b) => a.disOrder - b.disOrder);
      LogicPartitionNoDevice.sort((a, b) => a.disOrder - b.disOrder);
      LogicPartitionDeviceDataNoStreamProfile.sort((a, b) => a.disOrder - b.disOrder);
    }
  }
}

function FnChildrenDevice(data: any[], NoDevice?: boolean, NoStreamProfile?: boolean): any[] {
  let resData = data.map(item => {
    var newItem: any = {
      parentId: item.parentId,
      id: item.id,
      label: item.logicPartitionName,
      description: item.description,
      iconclass: 'iconfont icon-gen',
      children: [],
      uuid: item.uuid,
      disOrder: item.disOrder,
      LogicPartitionType: 'LogicPartition',
    }
    if (item.children) {
      if (NoDevice && NoDevice != null) {
        newItem.children = FnChildrenDevice(item.children, NoDevice);
      } else if (NoStreamProfile) {
        newItem.children = FnChildrenDevice(item.children, false, NoStreamProfile)
      } else {
        newItem.children = FnChildrenDevice(item.children)
      }
    }
    
    if (!NoDevice && (NoDevice != null || NoDevice == undefined)) {
      if (NoStreamProfile) {
        FnChildrenChannel(FnChannel(item.channel), newItem, NoStreamProfile);
      } else {
        FnChildrenChannel(FnChannel(item.channel), newItem);
      }
    }
    return newItem;
  })
  resData.sort((a, b) => a.disOrder - b.disOrder);
  return resData;
}

function FnChannel(data: any[]): any[] {
  return data.map(item => {
    return {
      devChannel: item.devChannel,
      enabled: item.enabled,
      label: item.name,
      name: item.name,
      online: item.online,
      token: item.token,
      nodeId: item.nodeId,
      type: item.type,
      parentToken: item.parentToken,
      iconclass: cameraIcon,
      children: [],
      disabled_me: false,
      dome: item.dome,
      alias: item.alias,
      chanNo: item.chanNo,
      icontype: '',
      uuid: item.uuid,
      LogicPartitionType: 'LogicPartitionChannel',
      setting: item.setting,
      recording: item.recording,
    }
  })
}

function FnChildrenChannel(data: any[], tree: any, NoStreamProfile?: boolean) {
  var number = 0;
  var numberbDisable = 0;
  var offlineNumber = 0;
  var disableNumber = 0;
  var IdleNumber = 0;

  var tempChildren: any[] = [];

  for (let k = 0; k < data.length; k++) {
    let item = data[k];
    if (item.online && item.enabled) {
      number = number + 1;
    }
    let newItem: any = {
      devChannel: item.devChannel,
      enabled: item.enabled,
      label: item.label,
      online: item.online,
      token: item.token,
      name: item.name,
      nodeId: item.nodeId,
      type: item.type,
      parentToken: item.parentToken,
      iconclass: cameraIcon,
      children: [],
      disabled_me: false,
      dome: item.dome,
      alias: item.alias,
      chanNo: item.chanNo,
      iconclass1: '',
      icontype: '',
      uuid: item.uuid,
      LogicPartitionType: 'LogicPartitionChannel',
      setting: item.setting,
      recording: item.recording,
    }
    newItem.treeid = uuid();
    if (item.online == true) {
      newItem['bOnline'] = true;
    } else if (item.online == false) {
      newItem['bOnline'] = false;
    }
    if (!item.online) {
      newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
    }
    if (!item.online && item.idle == false && item.enabled == true) {
      offlineNumber = offlineNumber + 1;
    }
    if (item.recording == true) {
      if (item.dome == true) {
        newItem['iconclass2'] = darkMode ? '#icon-baiqiuji' : '#icon-heiqiuji';
      } else {
        newItem['iconclass2'] = darkMode ? '#icon-baishexiangji' : '#icon-heishexiangji';
      }
      newItem['recording'] = true;
    } else if (item.recording == false) {
      newItem['recording'] = false;
      newItem['iconclass2'] = '';
    }
    if (item.enabled == false) {
      newItem['disabled_me'] = true;
      newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera camera';
    }
    if (item.enabled == false) {
      if (playStore.devicemarktoggle == undefined || playStore.devicemarktoggle == 'true') {
        disableNumber = disableNumber + 1;
      }
    }
    if (item.enabled == false && playStore.devicemarktoggle == 'false') {
      numberbDisable = numberbDisable + 1;
      continue;
    }
    if (item.idle == true && item.enabled == true && !item.online) {
      newItem['idle'] = true;
      newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camera';
      newItem['iconclass4'] = 'el-tree-camera';
      IdleNumber = IdleNumber + 1;
    }
    if (item.dome == true) {
      if (!item.online && item.disabled_me == false) {
        newItem['iconclass'] = 'iconfont icon-lixian el-tree-camera';
      } else {
        newItem['iconclass'] = 'iconfont icon-zaixian';
      }
    }
    
    tempChildren.push(newItem);
    tempChildren.sort((a, b) => {
      if (a.online === true && b.online !== true) return -1;
      if (a.online !== true && b.online === true) return 1;
      return 0;
    });
    tree.children = tempChildren;
  }
}

function GetGroupList(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetGroupListV2({ root, access_token });
}

function GetGroupListThen(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      var srcGroup: any = { children: [] };
      for (let i = 0; i < res.length; i++) {
        srcGroup.groupName = res[i].groupName;
        srcGroup.iconclass = 'iconfont icon-gen';
        srcGroup.groupId = res[i].groupId;
        srcGroup.parentId = res[i].parentId;
        srcGroup.description = res[i].description;
        srcGroup.uuid = res[i].uuid;
        srcGroup.roleId = res[i].roleId;
        srcGroup.children = GroupChildren(res[i].children);
        GroupData.push(srcGroup);
      }
    }
  }
}

function GroupChildren(data: any[]): any[] {
  return data.map(item => {
    return {
      parentId: item.parentId,
      groupId: item.groupId,
      groupName: item.groupName,
      description: item.description,
      uuid: item.uuid,
      iconclass: 'iconfont icon-gen',
      roleId: item.roleId,
      children: item.children ? GroupChildren(item.children) : item.children,
    }
  })
}

function GetRoleList(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetRoleListV2({ root, access_token });
}

function GetRoleListThen(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result.list;
      for (let i = 0; i < res.length; i++) {
        var item = res[i];
        playStore.passwordLength = item.passwordLength;
        var data = {
          index: i + 1,
          roleName: item.name,
          roleId: item.roleId,
          description: item.description,
          passwordLength: item.passwordLength,
          userLockTime: item.userLockTime,
          userLockLimit: item.userLockLimit,
          userLockTimeAgain: item.userLockTimeAgain,
          passwordExpiryTime: item.passwordExpiryTime,
          passwordAlertTime: item.passwordAlertTime,
          passwordExpiryChange: item.passwordExpiryChange,
          passwordRule: item.passwordRule,
          passwordFirstChange: item.passwordFirstChange,
          funcGroup: item.funcGroup,
          devPartition: item.devPartition,
        }
        RoleData.push(data);
      }
    }
  }
}

function GetMapList(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetMapListV2({ root, access_token });
}

function GetMapListThen(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      for (let i = 0; i < res.length; i++) {
        var item = res[i];
        var data = {
          index: i + 1,
          center: item.center,
          centerCord: item.centerCord,
          description: item.description,
          devPartitionId: item.devPartitionId,
          extent: item.extent,
          mapElementChannel: item.mapElementChannel,
          mapElementDoor: item.mapElementDoor,
          mapElementLink: item.mapElementLink,
          mapId: item.mapId,
          mapName: item.mapName,
          mapUrl: item.mapUrl,
          mapUrl2: item.mapUrl2,
          mapView: item.mapView,
          maxZoom: item.maxZoom,
          minZoom: item.minZoom,
          onlineTile: item.onlineTile,
          projection: item.projection,
          systemDefaultMap: item.systemDefaultMap,
          tileX: item.tileX,
          tileY: item.tileY,
          type: item.type,
          uuid: item.uuid,
          zoom: item.zoom,
        }
        MapData.push(data);
      }
    }
  }
}

function GetUserConfigItem(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
  return GetUserConfigItemV2({ root, access_token });
}

function GetUserConfigItemThen(result: any) {
  if (result.status === 200 && result.data.code === 0) {
    if (result.data.msg == 'Success') {
      var res = result.data.result;
      UserData.push(res);
    }
  }
}

function GetSysConfigItem(): Promise<any> {
  const { access_token, root } = getDeviceInfo();
 return GetSysConfigItemV2({ root, access_token });
}

function GetSysConfigItemThen(result: any) {
  if (result.status === 200 && result.data.code === 0 && result.data.msg === "Success") {
    let items = result.data.result.list;
    if (items.length === 0) {
      return;
    }
    for (let item of items) {
      if (item.key === 'PartitionLoadDeviceOnly') {
        playStore.PartitionLoadDeviceOnly = JSON.parse(item.value);
      }
      if (item.key === 'PlaybackShowStorageMode') {
        playStore.PlaybackShowStorageMode = JSON.parse(item.value);
      }
      if (item.key === 'EnablePartitionTreeCacheSearch') {
        playStore.EnablePartitionTreeCacheSearch = JSON.parse(item.value);
      }
      if (item.key === 'EnableDevPartitionLazyLoading') {
        playStore.EnableDevPartitionLazyLoading = JSON.parse(item.value);
      }
      if (item.key === 'EnableDevPartitionShowDeviceNode') {
        playStore.EnableDevPartitionShowDeviceNode = JSON.parse(item.value);
      }
    }
  }
}

async function GetDevPartition(type?: string, EnableDevPartitionLazyLoading?: boolean, EnableDevPartitionShowDeviceNode?: boolean, devPartitionId?: number): Promise<any> {
  try {
    const res = await DevicePartition(type, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode, devPartitionId);
    DevicePartitionData = [];
    DevPartitionNoDevice = [];
    CasDevicePartition = [];
    DevCasPartition = [];
    if (EnableDevPartitionLazyLoading) {
      await getdevicePartitionItem(res, EnableDevPartitionLazyLoading, EnableDevPartitionShowDeviceNode);
    } else {
      await getdevicePartition(res, EnableDevPartitionShowDeviceNode);
    }
    return { DevicePartitionData, DevPartitionNoDevice, CasDevicePartition, DevCasPartition };
  } catch (err) {
    console.error(err);
  }
}

function GetDevPartitionFilterNode(filterText: string): Promise<any> {
  return new Promise(resolve => {
    DevPartitionFilterNode(filterText).then((res) => {
      DevicePartitionDataFilterNode = [];
      getdevicePartition(res, true, filterText);
      resolve({ DevicePartitionDataFilterNode });
    });
  })
}

function GetDeviceChannels(token: string, isDisabledExempt?: boolean, fromPage?: boolean, srcGroup?: any): Promise<any> {
  return new Promise(resolve => {
    DeviceChannels(token, isDisabledExempt).then((res) => {
      DevicePartitionStreamProfile = [];
      DevicePartitionNoStreamProfile = [];
      channelThen(res, isDisabledExempt, fromPage, srcGroup);
      resolve({ DevicePartitionStreamProfile, DevicePartitionNoStreamProfile });
    });
  })
}

function GetDeviceChannelsAll(data: any, isDisabledExempt?: boolean, srcGroup?: any): Promise<any> {
  return new Promise(resolve => {
    DeviceChannelsAll(data).then((res) => {
      AllDevicePartitionStreamProfile = [];
      AllDevicePartitionNoStreamProfile = [];
      channelThenAll(res, isDisabledExempt, srcGroup);
      resolve({ AllDevicePartitionStreamProfile, AllDevicePartitionNoStreamProfile });
    });
  })
}

function GetCascadeHierarchy(token: string, casPartitionId: string, isDisabledExempt?: boolean): Promise<any> {
  return new Promise(resolve => {
    CascadeHierarchy(token, casPartitionId).then((res) => {
      CasDevicePartitionStreamProfile = [];
      CasDevicePartitionNoStreamProfile = [];
      CasDevicePartitionNoDevice = [];
      CascadeThen(res, isDisabledExempt);
      resolve({ CasDevicePartitionStreamProfile, CasDevicePartitionNoStreamProfile, CasDevicePartitionNoDevice });
    });
  })
}

function GetAccessDevice(token: string): Promise<any> {
  return new Promise(resolve => {
    AccessDevice(token).then((res) => {
      AccessDevicePartition = [];
      AccessThen(res);
      resolve({ AccessDevicePartition });
    });
  })
}

function GetLogicPartition(data?: any): Promise<any> {
  return new Promise(resolve => {
    LogicPartition().then((res) => { // Removed `data` argument here since LogicPartition() is defined with zero arguments
      LogicPartitionDeviceData = [];
      LogicPartitionNoDevice = [];
      LogicPartitionDeviceDataNoStreamProfile = [];
      LogicPartitionDevice(res);
      resolve({ LogicPartitionDeviceData, LogicPartitionNoDevice, LogicPartitionDeviceDataNoStreamProfile });
    });
  })
}

function GetGroup(): Promise<any> {
  return new Promise(resolve => {
    GetGroupList().then((res) => {
      GroupData = [];
      GetGroupListThen(res);
      resolve({ GroupData });
    });
  })
}

function GetRole(): Promise<any> {
  return new Promise(resolve => {
    GetRoleList().then((res) => {
      RoleData = [];
      GetRoleListThen(res);
      resolve({ RoleData });
    });
  })
}

function GetMap(): Promise<any> {
  return new Promise(resolve => {
    GetMapList().then((res) => {
      MapData = [];
      GetMapListThen(res);
      resolve({ MapData });
    });
  })
}

function GetUserConfig(): Promise<any> {
  return new Promise(resolve => {
    GetUserConfigItem().then((res) => {
      UserData = [];
      GetUserConfigItemThen(res);
      resolve({ UserData });
    });
  })
}

function GetSysConfig(): Promise<any> {
  return new Promise(resolve => {
    GetSysConfigItem().then((res) => {
      GetSysConfigItemThen(res);
      resolve({});
    });
  })
}

export { 
  GetDevPartition, 
  GetDevPartitionFilterNode, 
  GetLogicPartition, 
  GetDeviceChannels, 
  GetDeviceChannelsAll, 
  GetCascadeHierarchy, 
  GetAccessDevice, 
  GetGroup, 
  GetRole, 
  GetMap, 
  GetUserConfig, 
  GetSysConfig 
}