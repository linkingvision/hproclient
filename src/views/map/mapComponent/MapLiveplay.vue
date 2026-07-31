<template>
  <div class="liveplay hscontainer" id="map_liveplay" @dragover.prevent="dragover($event)" @drop="dropTarget()">
  <video class="hsvideo" :id="props.videoid" autoplay webkit-playsinline playsinline></video>
  <div :id="MapId" class="map"></div>
  <div class="OnlyMap" v-if="props.independenceMap">
    <el-collapse v-model="activeNames">
      <el-collapse-item name="1">
        <template #title>
          <div style="display: flex;justify-content: space-between;padding-inline: 5px;width: 90%;align-items: center;flex-shrink: 0;font-size: 14px;font-weight: 500;">
            <div style="white-space: nowrap;">Device partition</div>
            <div class="liveview_colltitle" style="align-items: center;">
              <div class="liveview_titleicon1 iconfont icon-shuaxin" @click.stop="Refresh()"></div>
            </div>
          </div>
        </template>
       <el-tree :data="MapData" ref="treeRef" node-key="CustomUuid" show-checkbox :default-expanded-keys="defaultExpandIds" @node-expand="handleNodeExpand"
        @node-collapse="handleNodeCollapse" @check-change="filterMapChannel">
          <template #default="{ node, data }">
            <span style="width:100%;">
              <div style="width:100%;display: flex;justify-content: space-between;">
                <span class="size_color" style="display: flex; justify-content: flex-start; align-items: center;">
                  <svg v-if="data.iconclass2" :class="data.dome == true ? 'CameraIcon DomeIcon' : 'CameraIcon'" aria-hidden="true" width="20" height="20">
                    <use :xlink:href="data.iconclass2"></use>
                  </svg>
                  <span v-else-if="data.dome == true" style="font-size: 19px;transform: scale(1.0);" :class="data.iconclass + ' ' + data.iconclass1" :id="'icon' + data.token"></span>
                  <span v-else :style="data.icontype == '' ? 'font-size: 19px;' : 'font-size: 16px;'" :class="data.iconclass + ' ' + data.iconclass1" :id="'icon' + data.token"></span>
                  <span v-if="data.alias" :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;" :title="data.alias">{{ data.alias }}</span>
                  <span v-else :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;" :title="data.label">{{ data.label || data.name }}</span>
                  <span v-if="typeof data.AllLength !== 'undefined'" style="padding-left: 4px;">
                    {{ data.online }}/{{ data.AllLength }}
                  </span>
                </span>
              </div>
            </span>
          </template>
        </el-tree>
      </el-collapse-item>
    </el-collapse>
  </div>
  <div class="byted-weektime" v-if="props.parent=='MotionDetection'">
    <div class="calendar">
      <table class="calendar-table" style="width: 100%;height: 100%;">
        <tbody>
          <tr v-for="(row,rowIndex) in rowUnit1" :key="rowIndex">
            <td class="calendar-atom-time NoBorder" :class="item.class" v-for="(item,colIndex) in row" :key="colIndex">
              {{ item.text }}
            </td>
          </tr>
        </tbody>
      </table>
      
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, getCurrentInstance, nextTick, onMounted, onBeforeUnmount, } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { GetAccessDevice, GetCascadeHierarchy, GetDeviceChannels, GetDevPartition } from '../../../utils/DevicesTree';
import { DiscoveredDevice } from '../../../types/site-info';
import H5smap from '../../../assets/js/h5mapts';
import h5jssdk from '../../../assets/js/h5jssdk.esm.js';
import { fromLonLat,toLonLat } from 'ol/proj';
import {Map,View} from 'ol';
import ImageLayer from 'ol/layer/Image';
import { ImageStatic } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import {XYZ,WMTS} from "ol/source"
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getWidth,getTopLeft } from 'ol/extent';
import {get} from "ol/proj";
import Overlay from 'ol/Overlay';
import ScaleLine from "ol/control/ScaleLine"
import { usePlayStore } from '../../../store/play';
import { useSiteInfo } from '../../../store/site-info';
import { GetMapElement, GetMapDetail, GetChannel } from '../../../api/map';
// import MapView from './MapView.vue';

const playStore = usePlayStore();
const siteStore = useSiteInfo();
const {t,locale} = useI18n();
const instance = getCurrentInstance();
const { H5sPlayerWS2 } = h5jssdk;

const props = defineProps({
  id:{type:String,default:""},
  hsid:{type:String,default:""},
  h5videoid:{type:String,default:""},
  canvasid:{type:String,default:""},
  selected:{type:String,default:""},
  selectedId:{type:String,default:""},
  parentId:{type:String,default:""},
  independenceMap:{type:Boolean,default:false},
  videoid:{type:String,default:""},
  parent:{type:String,default:""}, 
  cols:{type:Number,default:1},
  rows:{type:Number,default:1},
});

const activeNames = ref(["1"]);
const MapData = ref<any[]>([]);
const defaultExpandIds = ref<string[]>([]);
const defaultExpandIdsDevices = ref<any[]>([]);
const filterText = ref("");
const map = ref<any>(null);
const drawMap = ref<any>(null);
const overlay = ref<Record<string,any>>({});
const mapElementThrottle = ref(false);
const entity = ref<any[]>([]);
const isStaticMapOnly = ref(false);
const OnlyMapData = ref<any>({});
const mapInstanceId = ref("map" + Date.now() + props.hsid);
const videoPlayer = ref<any>(null);
const playFailureTimer = ref<any>(null);
const isPlaying = ref(false);
const channelDataArray = ref<any[]>([]);
const rowUnit = ref<any[]>([]);
const rowUnit1 = ref<any[]>([]);
const expandedCellId = ref<string|null>(null);
const selectedCellId = ref<string|null>(null);
const linkLoading = ref(false);
const AccessDoorData = ref<any>(null);
const mapList = ref<any[]>([]);

const computeCellStyle = (cell:any,layoutType:string) => {
  const borderWidth = "1px";
  const selectedBorderWidth = "2px";
  if(expandedCellId.value === cell.id){
    return {
      position:"absolute",
      top:0,
      left:0,
      width:"100%",
      height:"100%",
      margin:"0",
      boxSizing:"border-box",
      border:"none",
      zIndex:10,
    }
  }

  const [totalRows,totalCows] = layoutType.split("|").map(Number);
  const cellWidth = 100/totalCows;
  const cellHeight = 100 / totalRows;
  const isSelected = selectedCellId.value === cell.id;

  const style : any = {
    position:"absolute",
    top:`${(cell.rowStart - 1) * cellHeight}%`,
    left:`${(cell.colStart - 1) * cellWidth}%`,
    width:`calc(${cellWidth * (cell.colEnd - cell.colStart)}% - ${borderWidth})`,
    height: `calc(${cellHeight * (cell.rowEnd - cell.rowStart)}% - ${borderWidth})`,
    boxSizing: "border-box",
    border: `${borderWidth} solid transparent`,
    zIndex: 1,
  }

  if(isSelected){
    style.border = `${selectedBorderWidth} solid #F44336`;
  }
  return style;
}

const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string; session: string; root: string;} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', session: '', root: '' };
    }
    const target = siteStore.selectedSite || devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if (!target) {
        return { target: null, access_token: '', session: '', root: '' };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        root: `${protocol}://${target.ipv4Address}:${port}`
    };
}

const defaultProps = {
  children:"children",
  label:"label",
  token:"token",
  iconclass:"iconclass"
};

const defaultProps1 = {
  children:"children",
  label:"name",
  token:"token",
  iconclass:"iconclass",
}

const treeRef = ref<any>(null);
const MapId = ref("map" + props.hsid);

const ViewPlayMap = (data:any) => {
  if(!data)return;
  const mapData = data.mapId?data:{...data,mapId:data.token};
  if(!mapData.mapId)return;
  const container = document.getElementById(MapId.value);
  if(!container){
    nextTick(()=>{
      const containerRetry = document.getElementById(MapId.value);
      if(containerRetry){
        initMap(data,containerRetry);
      }
    });
    return;
  }
  initMap(data,container);
}

const initMap = (data:any,container:HTMLElement) => {
  if(!data)return;
  if(!data.mapId)return;
  if(map.value){
    map.value.setTarget(null);
    map.value = null;
  }
  if(drawMap.value){
    drawMap.value.destroy();
    drawMap.value = null;
  }
  if(container.children.length > 0){
    container.innerHTML = "";
  }

  const videoEl = document.getElementById(props.h5videoid);
  if(videoEl){
    videoEl.style.display = "none";
  }

  map.value = new Map({
    target:container,
  });

  container.setAttribute("playMapId",data.mapId || data.token);

  initializeMap(data).then((isStaticMap)=> {
    isStaticMapOnly.value = isStaticMap;
    if(data.mapId){
      MapChannel(data.mapId,map.value,isStaticMap);
    }else{
      MapChannel(data.token,map.value,isStaticMap);
    }
    rememberPlayMapStatus();

    map.value.on("moveend",()=>{
      rememberPlayMapStatus()
      if(data.mapId){
        MapChannel(data.mapId,map.value,isStaticMap);
      }else{
        MapChannel(data.mapId,map.value,isStaticMap);
      }
    })
  });
  map.value.once("rendecomplete",()=>{
    map.value.updateSize();
  });

  setTimeout(()=>{
    if(map.value){
      map.value.updateSize();
    }
  },300);
}

const PlayVideo = (token:string | number,streamprofile:string,label:string | null,name:string | null,uniqueId?:string | null) => {
  CloseVideo();
  const videoEl = document.getElementById(props.videoid) as HTMLVideoElement;
  const tokenStr = String(token)
  if(!videoEl)return;

  videoEl.style.display = 'block';
  const mapContainer = document.getElementById(MapId.value);
  if(mapContainer){
    mapContainer.style.display = "none";
  }
  const {session,root,target} = getDeviceInfo()
  const protocol = target?.enableHttps ? 'https' : 'http';
  const host = target ? `${target.ipv4Address}:${target.enableHttps ? target.httpsPort : target.httpPort}` : '';
  const conf = {
    videoid:props.videoid,
    protocol:protocol,
    host:host,
    streamprofile:streamprofile || 'main',
    rootpath:'/',
    token:tokenStr,
    hlsver:'v1',
    session:session,
    consolelog:'true',
    buffersize:300,
    h264cpumode:'false',
  }
  
  videoPlayer.value = new H5sPlayerWS2(conf);
  videoPlayer.value.connect();

  let count=0;
  const currentTime:number[] = [];
  clearInterval(playFailureTimer.value);
  playFailureTimer.value = setInterval(()=>{
    count++;
    currentTime.push(videoEl.currentTime);
    if(videoEl.paused || currentTime[currentTime.length - 2]===currentTime[currentTime.length-1]){
      if(count === 5){
        const $controlPlayError = document.querySelector(`#${props.hsid} .PlayFailurePrompted`) as HTMLElement;
        if($controlPlayError) $controlPlayError.style.display = 'block';
        count = 0;
      }
    }else{
      const $controlPlayError = document.querySelector(`#${props.hsid} .PlayFailurePrompted`) as HTMLElement;
      if($controlPlayError)$controlPlayError.style.display = 'none';
      if(count === 5 ){
        count = 0;
        currentTime.length = 0;
      }
    }
  },2000);
  isPlaying.value = true;
}

const loadDeviceTree = async() => {
  const res = await GetDevPartition(
    playStore.PartitionLoadDeviceOnly ? "device" : undefined,
    playStore.EnableDevPartitionLazyLoading
  );
  MapData.value = res.DevicePartitionData[0]?.children || [];
  defaultExpandIds.value = [];
  if(res.DevicePartitionData[0]?.uuid){
    defaultExpandIds.value.push(res.DevicePartitionData[0].uuid);
  }
}

const CloseVideo = () => {
  clearInterval(playFailureTimer.value);
  playFailureTimer.value = null;
  if(videoPlayer.value){
    videoPlayer.value.disconnect();
    videoPlayer.value = null;
  }

  const videoEl = document.getElementById(props.videoid) as HTMLVideoElement;
  if(videoEl){
    videoEl.poster = '';
    videoEl.load();
    if (map.value) {
      videoEl.style.display = 'none';
      const mapContainer = document.getElementById(MapId.value);
      if (mapContainer) {
        mapContainer.style.display = 'block';
      }
    }
  }

  const $controlPlayError = document.querySelector(`#${props.hsid} .PlayFailurePrompted`) as HTMLElement;
  if($controlPlayError)$controlPlayError.style.display = 'none';
  isPlaying.value = false;
}

const initializeMap = (data:any):Promise<boolean> => {
  
  return new Promise((resolve)=>{
    let isStaticMap = false;
    switch(data.type){
      case "USC_MAP_STATIC":
        StaticMap(data,map.value).then(()=>{
          resolve(true);
        });
        break;
      case "USC_MAP_GAO_DE":
      case "USC_MAP_GOOGLE":
      case "USC_MAP_TIAN":
      case "USC_MAP_TITLE":
        GISMap(data,map.value).then(()=>{
          resolve(false);
        });
        break;
      default:
        resolve(false);
        break;
    }
  });
}

const GISMap = (data: any, mapInstance: any): Promise<void> => {
  
  return new Promise((resolve) => {
    const savedState = JSON.parse(localStorage.getItem(MapId.value) || "null");
    let center = savedState?.center;
    let zoom = savedState?.zoom;

    if (data.token && savedState?.strToken === data.token) {
      center = savedState.center;
      zoom = savedState.zoom;
    }
    const projection = data.projection || "EPSG:3857";

    const view = new View({
      projection: projection,
      center: center || fromLonLat(data.center || [0, 0]),
      zoom: zoom || data.zoom || 7,
      minZoom: data.minZoom || 1,
      maxZoom: data.maxZoom || 18,
    });
    mapInstance.setView(view);
    
    if (data.type === "USC_MAP_TIAN") {
      const getprojection = get("EPSG:4326");
      const projectionExtent = getprojection?.getExtent();
      const size = getWidth(projectionExtent) / 256;
      const resolutions = new Array(18);
      const matrixIds = new Array(18);
      for (let z = 0; z < 18; ++z) {
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
      }
      const tileLayer = new TileLayer({
        source: new WMTS({
          style: "default",
          crossOrigin: "anonymous",
          matrixSet: "c",
          layer: "vec",
          format: "titles",
          url: data.mapUrl,
          tileGrid: new WMTSTileGrid({
            origin: getTopLeft(projectionExtent),
            resolutions: resolutions,
            matrixIds: matrixIds,
          }),
        }),
      });
      mapInstance.addLayer(tileLayer);

      if (data.mapUrl2) {
        const tileLayer2 = new TileLayer({
          source: new WMTS({
            style: "default",
            crossOrigin: "anonymous",
            matrixSet: "c",
            layer: "cva",
            format: "tiles",
            url: data.mapUrl2,
            tileGrid: new WMTSTileGrid({
              origin: getTopLeft(projectionExtent),
              resolutions: resolutions,
              matrixIds: matrixIds,
            }),
          }),
        });
        mapInstance.addLayer(tileLayer2);
      }
    } else if (data.type === "USC_MAP_GAO_DE" || data.type === "USC_MAP_TILE" || data.type === "USC_MAP_GOOGLE") {
      
      let mapUrl = data.mapUrl;
      const { root } = getDeviceInfo();
      if (data.type === "USC_MAP_TILE" && !data.onlineTile) {
        mapUrl = root + mapUrl + "/{z}/{x}/{y}.png";
      }
      
      const tileLayer = new TileLayer({
        source: new XYZ({
          url: mapUrl,
          projection: projection,
          crossOrigin: 'anonymous',
          tileSize: 256,
        }),
      });
      mapInstance.addLayer(tileLayer);
    }

    addScaleLineControl(mapInstance);

    mapInstance.once("rendercomplete", () => {
      resolve();
    });
    
    setTimeout(() => {
      resolve();
    }, 5000);
  });
};

const StaticMap = (data:any,mapInstance:any):Promise<void> => {
  return new Promise((resolve)=>{
    const savedState = JSON.parse(localStorage.getItem(MapId.value) || "null");
    let center = savedState?.center;
    let zoom = savedState?.zoom;

    const view = new View({
      center:center || fromLonLat([0,0]),
      zoom:zoom || data.zoom || 7,
      minZoom:data.minZoom || 1,
      maxZoom:data.maxZoom || 18,
    });
    mapInstance.setView(view);
    const { root } = getDeviceInfo();
    const img = new Image();
    img.src = root + "/" + data.mapUrl;
    img.onload = () => {
      const width = img.width;
      const height = img.height;
      const extent = [ -width * 1000, -height * 1000, width * 1000, height * 1000];

      const staticImageLayer = new ImageLayer({
        source:new ImageStatic({
          url:root + "/" + data.mapUrl,
          imageExtent:extent,
        }),
      });
      mapInstance.addLayer(staticImageLayer);
      resolve();
    };
    addScaleLineControl(mapInstance);
  });
}

const addScaleLineControl = (mapInstance:any) => {
  const scaleLine = new ScaleLine({
    units:"metric",
  });
  mapInstance.addControl(scaleLine);
}

const MapChannel = (id:string,mapInstance:any,isStaticMap:boolean) => {
  if(mapElementThrottle.value)return;
  if(drawMap.value){
    drawMap.value.destroy();
    drawMap.value = null;
  }
  mapElementThrottle.value = true;

  const extent = mapInstance.getView().calculateExtent(mapInstance.getSize());
  const projection = mapInstance.getView().getProjection();
  let lowerLeftCorner:number[];
  let topRightCorner:number[];

  if(projection.code_ === "EPSG:4326"){
    lowerLeftCorner = [extent[0],extent[1]];
    topRightCorner = [extent[2],extent[3]];
  }else{
    lowerLeftCorner = toLonLat([extent[0],extent[1]]);
    topRightCorner = toLonLat([extent[2],extent[3]]);
  }

  if (!lowerLeftCorner || !topRightCorner || 
    isNaN(lowerLeftCorner[0]) || isNaN(lowerLeftCorner[1]) ||
    isNaN(topRightCorner[0]) || isNaN(topRightCorner[1])) {
    mapElementThrottle.value = false;
    return;
  }

  const Data = {
    mapId:id,
    lowerLeftCorner:lowerLeftCorner,
    topRightCorner:topRightCorner,
  }
  if(entity.value.length > 0){
    (Data as any).entity = entity.value;
  }
  const { access_token, root } = getDeviceInfo();
  GetMapElement({root, access_token, data: Data}).then((result:any)=>{
    if(result.status === 200 && result.data.code === 0){
      drawMap.value = new H5smap(mapInstance);
      const projection = mapInstance.getView().getProjection();

      if(result.data.result.mapElementChannel){
        for(let i = 0; i < result.data.result.mapElementChannel.length; i++){
          const item = result.data.result.mapElementChannel[i];
          if(projection.code_ === "EPSG:3857"){
            const coords = fromLonLat([item.longitude,item.latitude]);
            item.longitude = coords[0];
            item.latitude = coords[1];
          }
          const conf = {
            map:mapInstance,
            cameraName:item.channel.name,
            cameraToken:item.channelUUID,
            radius:item.Radius,
            angle:item.angle,
            rotationAngle:item.rotationAngle,
            cameraType:item.fillColor,
            coordinate:[item.longitude,item.latitude],
            id:item.channel.token,
            type:"camera",
            cluster:isStaticMap ? false : playStore.mapCluster,
            RejectOperation:false,
            callback:EventCB,
          };
          drawMap.value.addLayer(conf);
        }
      }
      if(result.data.result.mapView){
        for(const item of result.data.result.mapView){
          if(projection.code_ === "EPSG:3857"){
            const coords = fromLonLat([item.longitude,item.latitude]);
            item.longitude = coords[0];
            item.latitude = coords[1];
          }
          const conf = {
            map:mapInstance,
            cameraName:item.viewName,
            cameraToken:item.viewUUID,
            cameraType:item.fillColor,
            coordinate:[item.longitude,item.latitude],
            drawIcon:true,
            id:item.view.viewId,
            type:"view",
            RejectOperation:false,
            callback:EventCB,
          };
          drawMap.value.addLayer(conf);
        }
      }
      if(result.data.result.mapElementLink){
        for(const item of result.data.result.mapElementLink){
          if(projection.code_ === "EPSG:3857"){
            const coords = fromLonLat([item.longitude,item.latitude]);
            item.longitude = coords[0];
            item.latitude = coords[1];
          }
          const conf = {
            map:mapInstance,
            cameraName:item.viewName,
            cameraToken:item.id,
            cameraType:item.fillColor,
            coordinate:[item.longitude,item.latitude],
            drawIcon:true,
            id:item.mapLinkId,
            type:"link",
            RejectOperation:false,
            callback:EventCB,
          };
          drawMap.value.addLayer(conf);
        }
      }
      if(result.data.result.mapElementDoor){
        for(const item of result.data.result.mapElementDoor){
          if(projection.code_ === "EPSG:3857"){
            const coords = fromLonLat([item.longitude,item.latitude]);
            item.longitude = coords[0];
            item.latitude = coords[1];
          }
          const conf = {
            map: mapInstance,
            cameraName: item.accessDoor.name,
            cameraToken: item.accessDoor.token,
            accessToken: item.accessToken,
            cameraType: item.fillColor,
            coordinate: [item.longitude, item.latitude],
            drawIcon: true,
            id: item.id,
            type: "accessDoor",
            RejectOperation: false,
            callback: EventCB,
          };
          drawMap.value.addLayer(conf);
        }
      }
    }
    mapElementThrottle.value = false;
  }).catch((e)=>{
    console.error("Failed to load map element",e);
    mapElementThrottle.value = false;
  })
}

const EventCB = async(data:any) => {
  if(props.independenceMap && data.feature?.length > 1){
    channelDataArray.value = [];
    const requests  = [];
    for(let i = 0;i < data.feature.length ; i++){
      const item = data.feature[i];
      const cameraToken = item.get("cameraToken");
      const { access_token, root } = getDeviceInfo();
      requests.push(
        GetChannel({root, access_token, params: { channelUUID: cameraToken }}).then((result:any)=>{
          if(result.status === 200 && result.data?.msg === "Success"){
            const res = result.data.result;
            const newItem = {
              token:res.token,
              label:res.name,
              name:res.name,
              type:res.type,
              idle:res.idle,
              DifferentType:'devChannel',
              enabled:res.enabled,
              iconclass:'iconfont icon-shexinagjizaixian',
              devChannel:res.devChannel,
              disabled_me: false,
              children: [],
              nodeId: res.nodeId,
              online: res.online,
              parentToken: res.parentToken,
              dome: res.dome,
              alias: res.alias,
              iconclass1: '',
              iconclass4:'',
              icontype: '',
              uuid: res.uuid,
              CustomUuid: res.uuid,
              setting: res.setting,
              recording: res.recording,
              metaEnabled: res.metaEnabled,
              longitude: res.longitude,
              latitude: res.latitude,
              center: data.center,
            }
            if(res.online == true) newItem['online'] = true
            else if(res.online == false) newItem['online'] = false

            if(!res.online){
              newItem['iconclass'] = 'iconfont icon-shexiangjilixian el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if(res.enable == false){
              newItem['disabled_me'] = true;
              newItem['iconclass'] = 'iconfont icon-xiangjijinyong el-tree-camera';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if(res.idle == true && res.enabled == true && !res.online){
              newItem['idle'] = true;
              newItem['iconclass'] = 'iconfont icon-shexiangjikongxian el-tree-camer';
              newItem['iconclass4'] = 'el-tree-camera';
            }
            if(res.dome == true){
              newItem['iconclass'] = !res.online?'iconfont icon-lixian el-tree-camera' : 'iconfont icon-zaixian'
            }
            if(!res.online || res.disable_me){
              channelDataArray.value.push(newItem);
            }else{
              channelDataArray.value.unshift(newItem)
            }
          }
        })
      )
    }
    Promise.all(requests).then(()=>{
      
    })
  }

  if(data.type === 'camera' && data.callbackType === "Update"){
    try{
      const { access_token, root } = getDeviceInfo();
      const result = await GetChannel({root, access_token, params: { channelUUID: data.cameraToken }}) as any;
      if(result.status === 200 && result.data?.msg === "Success"){
        const ChannelData = result.data.result;
        const divs = document.createElement("div");
        divs.innerHTML = 
        `
        <div id="${props.hsid + data.cameraToken}" class="ol-popup" style="width:808.5px;height:454.781px;border-radius:10px">
          <div id="${props.hsid + data.cameraToken}-closer" class="ol-popup-closer">
            <a herf="#" class="ol-popup-closer-btn"></a>
          </div>
          <div id="popup-content" class="popup-content">
            <div class="Map_Popup_title">
              <video class="h5video" id="${data.cameraToken}Mapvideoid${map.value?.ol_uid}" autoplay webkit-playsinline playsinline></video>
            </div>
            <div class="Map_Popup_content">
              <div class="Map_content_name">
                <p id="${props.hsid + data.cameraToken}Map_content_token">${ChannelData.name}</p>
              </div>
            </div>
          </div>
        </div>`;
        document.body.prepend(divs);
        const container = document.getElementById(props.hsid + data.cameraToken);
        const closer = document.getElementById(props.hsid + data.cameraToken + "-closer");
        if(container && map.value){
          overlay.value[props.hsid + data.cameraToken] = new Overlay({
            element:container,
            autoPan:true,
            autoPanAnimation:{duration:250}
          });
          map.value.addOverlay(overlay.value[props.hsid + data.cameraToken]);
          overlay.value[props.hsid + data.cameraToken].setPosition(data.center);
        }
        if(closer){
          closer.onclick=function(){
            const key = props.hsid + data.cameraToken;
            const win = window as any;
            if(win.h5handlerMapVideo && win.h5handlerMapVideo[key]){
              win.h5handlerMapVideo[key].disconnect();
              delete win.h5handlerMapVideo[key];
            }
            const videoId = data.cameraToken + 'Mapvideoid' + map.value?.ol_uid;
            const videoEl = document.getElementById(videoId);
            if(videoEl){
              (videoEl as HTMLVideoElement).poster = '';
              (videoEl as HTMLVideoElement).load();
            }
            if(map.value && overlay.value[props.hsid + data.cameraToken]){
              map.value.removeOverlay(overlay.value[props.hsid + data.cameraToken]);
              delete overlay.value[props.hsid + data.cameraToken];
            }
            const el = document.getElementById(props.hsid + data.cameraToken);
            if(el) el.remove();
            return false;
          }
        }
        const { session, root, target } = getDeviceInfo();
        const protocol = target?.enableHttps ? 'https' : 'http';
        const host = target ? `${target.ipv4Address}:${target.enableHttps ? target.httpsPort : target.httpPort}` : '';
        const conf = {
          videoid:data.cameraToken + 'Mapvideoid' + map.value?.ol_uid,
          protocol:protocol + ':',
          host:host,
          streamprofile:'main',
          rootpath:'/',
          token:ChannelData.token,
          hlsver:'v1',
          session:session,
          consolelog:'true',
          buffersize:300,
          h264cpumode:'false'
        };
        const player = new H5sPlayerWS2(conf);
        player.connect();
        const win = window as any;
        if(!win.h5handlerMapVideo)win.h5handlerMapVideo = {};
        win.h5handlerMapVideo[props.hsid + data.cameraToken] = player;
      }
    }catch(err){
      console.error(err)
    }
    return;
  }
  if(data.type === 'view' && data.callbackType === "Update"){
    const uniqueId = props.hsid + data.cameraToken;
    if(overlay.value[uniqueId]) return;

    const divs = document.createElement("div");
    divs.innerHTML = `
      <div id="${uniqueId}" class="ol-popup1" style="width:600px;height:300px;border-radius:10px;display:block;background:#1a1a1a;">
        <div id="${uniqueId}-closer" class="ol-popup-closer" style="position:absolute;top:8px;right:8px;z-index:10;width:20px;height:20px;background:rgba(105,105,105,0.7);border-radius:4px;text-align:center;line-height:20px;cursor:pointer;">
          <a href="#" class="ol-popup-closer-btn" style="text-decoration:none;font-size:14px;color:#fff;">✖</a>
        </div>
        <div id="popup-content" class="popup-content" style="width:100%;height:100%;">
          <div class="liveview_right" id="videoPanel" style="width:100%;height:100%;">
            <div class="liveview_right_video_hed" style="position:relative;width:100%;height:100%;">
              <div id="${uniqueId}-grid" style="width:100%;height:100%;position:relative;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.prepend(divs);

    const container = document.getElementById(uniqueId);
    const closer = document.getElementById(uniqueId + '-closer');

    if(container && map.value){
      overlay.value[uniqueId] = new Overlay({
        element:container,
        autoPan:true,
        autoPanAnimation:{duration:250}
      });
      map.value.addOverlay(overlay.value[uniqueId]);
      overlay.value[uniqueId].setPosition(data.center);
    }

    if(closer){
      closer.onclick = function(){
        if(map.value && overlay.value[uniqueId]){
          map.value.removeOverlay(overlay.value[uniqueId]);
          delete overlay.value[uniqueId];
        }
        const el = document.getElementById(uniqueId);
        if(el) el.style.display = 'none';
        return false;
      }
    }

    await srcview(data.id,uniqueId);
    return;
  }
  if(data.type === 'link' && data.callbackType === "Update"){
    if(linkLoading.value) return;
    linkLoading.value = true;
    try{
      const { access_token, root } = getDeviceInfo();
      const result = await GetMapDetail({root, access_token, mapId: data.id}) as any;
      if(result.status === 200 && result.data?.msg === "Success"){
        const mapdata = result.data.result
        if(mapdata.type){
          if(map.value){
            map.value.getLayers().clear();
          }
          drawMap.value = null;

          const isStaticMap = await initializeMap(mapdata);
          isStaticMapOnly.value = isStaticMap;

          if(mapdata.mapId){
            await MapChannel(mapdata.mapId,map.value,isStaticMap);
          }else{
            await MapChannel(mapdata.token,map.value,isStaticMap);
          }

          rememberPlayMapStatus();
        }
      }
    }catch(err){
      console.error(err)
    }finally{
      linkLoading.value = false;
    }
    return;
  }
  if(data.type === 'accessDoor' && data.callbackType === "Update"){
    const key = data.cameraToken;

    if(overlay.value[key]) return;
    
    AccessDoorData.value = data;
    const divs = document.createElement("div");
    divs.innerHTML = 
    `
    <div id="${key}" class="ol-popup2" style="width:112px;height:32px;min-height:31px;border-radius:4px">
      <div id="popup-content" class="popup-content" style=height:100%>
        <div class="Map_Popup_content" style="height:100%;display:flex;justify-content:space-around;align-items:center;text-align:center;line-height:32px;font-size:10px">
          <div id="${key}-openDoor" class="openDoor" style="width:unset;padding:0 20px;height:32px;background:#DAF0FF;border-radius:4px 0px 0px 4px;color:#0399FE;cursor:pointer;white-space:nowrap;">开门</div>
          <div id="${key}-closeDoor" class="closeDoor" style="width:unset;padding:0 20px;height:32px;background:#FFE9DA;border-radius:0px 4px 4px 0px;color:#FA6400;cursor:pointer;white-space:nowrap;">关门</div>
        </div>
      </div>
    </div>
    `;
    document.body.prepend(divs);

    const container = document.getElementById(key);
    const openDoor = document.getElementById(key + "-openDoor");
    const closeDoor = document.getElementById(key + "-closeDoor");

    if(container && map.value){
      overlay.value[key] = new Overlay({
        element:container,
        autoPan:true,
        autoPanAnimation:{duration:250}
      })
      map.value.addOverlay(overlay.value[key]);
      overlay.value[key].setPosition(data.center);
    }

    if(openDoor){
      openDoor.onclick = function(){
        RemoteDoor(true);
      }
    }

    if(closeDoor){
      closeDoor.onclick = function(){
        RemoteDoor(false);
      }
    }
    return;
  }
}

const RemoteDoor = async(isOpen:boolean) => {
  const data = AccessDoorData.value;
  if(!data)return;
  const key = data.cameraToken;

  const DoorDate : any = {
    doorToken:data.cameraToken,
    accessToken:data.accessToken,
  };

  try{
    const { root } = getDeviceInfo();
    let url:string;
    if(isOpen){
      DoorDate.interval = 30;
      url = root + "/uapi/v1/AccessDevice/RemoteOpenDoor";
    }else{
      url = root + "/uapi/v1/AccessDevice/RemoteCloseDoor";
    }

    const response = await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(DoorDate)
    });
    const result = await response.json();

    if(result.msg === "Success"){
      if(drawMap.value){
        const updateData = {
          id:data.id,
          longitude: data.center[0],
          latitude: data.center[1],
          fillColor: data.cameraType,
          accesstoken: data.accessToken,
          cameraToken: data.cameraToken,
        }
        drawMap.value.updateCamera(data.cameraType,updateData,isOpen);
      }

      if(map.value && overlay.value[key]){
        map.value.removeOverlay(overlay.value[key]);
        delete overlay.value[key];
      }
      const el = document.getElementById(key);
      if(el) el.remove();
    }
  }catch(e){
    console.log(e)
  }
}

const srcview = async (viewId: string, uniqueId: string) => {
  try {
    const { access_token, root } = getDeviceInfo();
    const result = await GetMapDetail({root, access_token, mapId: viewId}) as any;
    if (result.status === 200 && result.data?.msg === "Success") {
      const data = result.data.result;
      
      let layoutName = '4';
      if (data.layoutId === 1) layoutName = '1';
      else if (data.layoutId === 2) layoutName = '3';
      else if (data.layoutId === 3) layoutName = '13';
      else if (data.layoutId === 4) layoutName = '16';
      else if (data.layoutId === 5) layoutName = '25';
      else if (data.layoutId === 6) layoutName = '7';
      else if (data.layoutId === 7) layoutName = '4';
      else if (data.layoutId === 8) layoutName = '4Alt';
      else if (data.layoutId === 9) layoutName = '6';
      else if (data.layoutId === 10) layoutName = '9';

      const layoutType = getLayoutType(layoutName);
      const cells = getLayoutCells(layoutName);

      const gridContainer = document.getElementById(uniqueId + '-grid');
      if (gridContainer) {
        gridContainer.innerHTML = '';
        
        for (const cell of cells) {
          const cellDiv = document.createElement('div');
          cellDiv.className = 'palace videoColor';
          Object.assign(cellDiv.style, computeCellStyle(cell, layoutType));

          const videoId = uniqueId + '_video_' + cell.id;
          cellDiv.innerHTML = `
            <video 
              class="h5video" 
              id="${videoId}" 
              autoplay 
              webkit-playsinline 
              playsinline
              style="width:100%;height:100%;object-fit:fill;"
            ></video>
          `;
          gridContainer.appendChild(cellDiv);
        }
      }
      
      if (data.viewEntity && data.viewEntity.length > 0) {
        for (const entity of data.viewEntity) {
          const position = entity.layoutPosition;
          const cellId = position.length === 2 ? position[0] + '-' + position[1] : position;
          const videoId = uniqueId + '_video_' + cellId;
          
          PlayVideoToTarget(
            entity.Channel?.token || entity.token,
            entity.profile || 'main',
            entity.Channel?.name || entity.name,
            videoId,
            uniqueId
          );
        }
      }
    }
  } catch (err) {
    console.error('load view failed', err);
  }
};

const PlayVideoToTarget = (token: string | number, streamprofile: string, name: string, targetVideoId: string, uniqueId: string) => {
  const tokenStr = String(token);
  const videoEl = document.getElementById(targetVideoId) as HTMLVideoElement;
  if (!videoEl) return;
  
  const { session, root, target } = getDeviceInfo();
  const protocol = target?.enableHttps ? 'https' : 'http';
  const host = target ? `${target.ipv4Address}:${target.enableHttps ? target.httpsPort : target.httpPort}` : '';
  const conf = {
    videoid: targetVideoId,
    protocol: protocol,
    host: host,
    streamprofile: streamprofile || 'main',
    rootpath: '/',
    token: tokenStr,
    hlsver: 'v1',
    session: session,
    consolelog: 'true',
    buffersize: 300,
    h264cpumode: 'false',
  };
  
  const win = window as any;
  if (!win.h5handlerViewVideo) win.h5handlerViewVideo = {};
  if (win.h5handlerViewVideo[targetVideoId]) {
    win.h5handlerViewVideo[targetVideoId].disconnect();
  }
  
  const player = new H5sPlayerWS2(conf);
  player.connect();
  win.h5handlerViewVideo[targetVideoId] = player;
};

const getLayoutType = (name: string): string => {
  const layouts: Record<string, string> = {
    '1': '1|1',
    '3': '3|3',
    '13': '4|4',
    '16': '4|4',
    '25': '5|5',
    '7': '3|3',
    '4': '2|2',
    '4Alt': '3|3',
    '6': '3|3',
    '9': '3|3',
  };
  return layouts[name] || '2|2';
};

const getLayoutCells = (name: string): any[] => {
  const layouts: Record<string, any[]> = {
    '1': [
      { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: true }
    ],
    '4': [
      { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false },
      { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
      { id: '2-1', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, merged: false },
      { id: '2-2', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, merged: false },
    ],
    '4Alt': [
      { id: '1-1', rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 4, merged: true },
      { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
      { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
      { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
    ],
    '6': [
      { id: '1-1', rowStart: 1, rowEnd: 3, colStart: 1, colEnd: 3, merged: true },
      { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
      { id: '2-3', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, merged: false },
      { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
      { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
      { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
    ],
    '7': [
      { id: '1-1', rowStart: 1, rowEnd: 4, colStart: 1, colEnd: 2, merged: true },
      { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
      { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
      { id: '2-2', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, merged: false },
      { id: '2-3', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, merged: false },
      { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
      { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
    ],
    '9': [
      { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false },
      { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
      { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
      { id: '2-1', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, merged: false },
      { id: '2-2', rowStart: 2, rowEnd: 3, colStart: 2, colEnd: 3, merged: false },
      { id: '2-3', rowStart: 2, rowEnd: 3, colStart: 3, colEnd: 4, merged: false },
      { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
      { id: '3-2', rowStart: 3, rowEnd: 4, colStart: 2, colEnd: 3, merged: false },
      { id: '3-3', rowStart: 3, rowEnd: 4, colStart: 3, colEnd: 4, merged: false },
    ],
    '13': [
      { id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false },
      { id: '1-2', rowStart: 1, rowEnd: 2, colStart: 2, colEnd: 3, merged: false },
      { id: '1-3', rowStart: 1, rowEnd: 2, colStart: 3, colEnd: 4, merged: false },
      { id: '1-4', rowStart: 1, rowEnd: 2, colStart: 4, colEnd: 5, merged: false },
      { id: '2-1', rowStart: 2, rowEnd: 3, colStart: 1, colEnd: 2, merged: false },
      { id: '2-2', rowStart: 2, rowEnd: 4, colStart: 2, colEnd: 4, merged: true },
      { id: '2-4', rowStart: 2, rowEnd: 3, colStart: 4, colEnd: 5, merged: false },
      { id: '3-1', rowStart: 3, rowEnd: 4, colStart: 1, colEnd: 2, merged: false },
      { id: '3-4', rowStart: 3, rowEnd: 4, colStart: 4, colEnd: 5, merged: false },
      { id: '4-1', rowStart: 4, rowEnd: 5, colStart: 1, colEnd: 2, merged: false },
      { id: '4-2', rowStart: 4, rowEnd: 5, colStart: 2, colEnd: 3, merged: false },
      { id: '4-3', rowStart: 4, rowEnd: 5, colStart: 3, colEnd: 4, merged: false },
      { id: '4-4', rowStart: 4, rowEnd: 5, colStart: 4, colEnd: 5, merged: false },
    ],
    '16': [
      ...Array.from({ length: 16 }, (_, index) => {
        const row = Math.floor(index / 4) + 1;
        const col = (index % 4) + 1;
        return {
          id: `${row}-${col}`,
          rowStart: row,
          rowEnd: row + 1,
          colStart: col,
          colEnd: col + 1,
          merged: false,
        };
      }),
    ],
    '25': [
      ...Array.from({ length: 25 }, (_, index) => {
        const row = Math.floor(index / 5) + 1;
        const col = (index % 5) + 1;
        return {
          id: `${row}-${col}`,
          rowStart: row,
          rowEnd: row + 1,
          colStart: col,
          colEnd: col + 1,
          merged: false,
        };
      }),
    ],
  };
  return layouts[name] || layouts['4'];
};

const rememberPlayMapStatus = () => {
  if(!map.value)return;
  const view = map.value.getView();
  const obj = view.getProperties();
  localStorage.setItem(MapId.value,JSON.stringify(obj));
}

const handleNodeExpand = async(data:any,lastlevel:any) => {
  if(!defaultExpandIds.value.includes(data.CustomUuid)){
    defaultExpandIds.value.push(data.CustomUuid);
  }
  if(data.children && data.children[0] && data.children[0].EmptyItem === 1){
    data.children = [];
    if(data.token && data.children.length <= 0){
      const object = createDeviceObject(data);
      if(!defaultExpandIdsDevices.value.some(
        (item:any)=>
        item.token === data.token || (item.gbId && data.casPartitionId === item.casPartitionId)
      )){
        defaultExpandIdsDevices.value.push(object);
      }
      const token = data.gbId || data.rootToken;
      const CasToken = data.gbId ? undefined : data.token;

      try{
        const res = await Promise.all([
          data.gbId || data.casPartitionId?GetCascadeHierarchy(token,CasToken) : data.accssDevId ? GetAccessDevice(data.accessDevId) : GetDeviceChannels(data.token,undefined,undefined)
        ]);
        if(data.gbId || (data.casPartitionId && res[0]?.CasDevicePartitionStreamProfile?.length>0)){
          updateDeviceData(data,res[0].CasDevicePartitionStreamProfile[0],"CasDevChannel");
        }else if(data.accessDevId && res[0]?.AccessDevicePartition?.length > 0){
          updateDeviceData(data,res[0].AccessDevicePartition[0],'');
        }else if(res[0]?.DevicePartitionStreamProfile?.length > 0){
          updateDeviceData(data,res[0].DevicePartitionStreamProfile,"devChannel");
        }
      }catch(err){
        console.error(err);
      }
    }
  }
}

const handleNodeCollapse = (data:any) =>{
  defaultExpandIds.value = defaultExpandIds.value.filter(
    (item) => item !== data.CustomUuid
  );
  removeChildrenIds(data);
}

const removeChildrenIds = (data:any) => {
  if(data.children){
    data.children.forEach((item:any)=>{
      defaultExpandIds.value = defaultExpandIds.value.filter(
        (uuid) => uuid !== item.CustomUuid
      );
      removeChildrenIds(item);
    });
  }
}

const createDeviceObject = (data:any) => {
  if(data.gbId){
    return {label:"Device",gbId:data.gbId};
  }else if(data.casPartitionId){
    return{
      label:"Device",
      casPartitionId:data.casPartitionId,
      token:data.rootToken,
      CasToken:data.token,
    }
  }else{
    return{label:"Device",token:data.token}
  }
};

const updateDeviceData = (data:any,profile:any,type:string) => {
  if(type === "devChannel"){
    delete data.online;
    delete data.AllLength;
    data.online = profile.online;
    data.AllLength = profile.total;
  }else if(type === "CasDevChannel"){

  }
  data.online = profile.online;
  data.offline = profile.offline;
  data.disable = profile.disable;
  data.idle = profile.idle;
  data.AllLength = profile.AllLength;
  data.children = type === "devChannel" ? profile : profile.children || [];
};

const Refresh = () =>{
  GetDevPartition(
    playStore.PartitionLoadDeviceOnly ? "device" : undefined,
    playStore.EnableDevPartitionLazyLoading
  ).then((res)=>{
    MapData.value = res.DevicePartitionData[0]?.children || [];
    for(let i = 0; i < defaultExpandIdsDevices.value.length; i++){
      RefreshLoadDevice(
        MapData.value,
        defaultExpandIdsDevices.value[i].token,
        defaultExpandIdsDevices.value[i].gbId,
        defaultExpandIdsDevices.value[i].casPartitionId
      );
    }
  }).catch((err)=>{
    console.error(err);
  })
}

const RefreshLoadDevice = (data:any[],token:string,gbId:string,casPartitionId:string)=>{
  data.forEach((item)=>{
    if((item.token && item.token === token) || (item.gbId && item.gbId === gbId)){
      if(item.gbId && item.gbId === gbId){
        const CascadeToken = item.gbId || item.rootToken;
        const CasToken = item.gbId ? undefined : item.token;
        GetCascadeHierarchy(CascadeToken,CasToken).then((res)=>{
          if(res.CasDevicePartitionStreamProfile.length > 0){
            item.online = res.CasDevicePartitionStreamProfile.online;
            item.offline = res.CasDevicePartitionStreamProfile.offline;
            item.disable = res.CasDevicePartitionStreamProfile.disable;
            item.idle = res.CasDevicePartitionStreamProfile.idle;
            item.AllLength = res.CasDevicePartitionStreamProfile.AllLength;
          }
          item.children = res.CasDevicePartitionStreamProfile[0]?.children || [];
          if(item.children.length > 0){
            GetCascadeChildren(item.children);
          }
        }).catch((err)=>{
          console.error(err);
        });
      }else{
        GetDeviceChannels(item.token,undefined,undefined).then((res)=>{
          if(res.DevicePartitionStreamProfile.length > 0){
            delete item.online;
            delete item.AllLength;
            item.online = res.DevicePartitionStreamProfile.online;
            item.offline = res.DevicePartitionStreamProfile.offline;
            item.disable = res.DevicePartitionStreamProfile.disable;
            item.idle = res.DevicePartitionStreamProfile.idle;
            item.AllLength = res.DevicePartitionStreamProfile.AllLength;
          }
          item.children = res.DevicePartitionStreamProfile;
        }).catch((err)=>{
          console.error(err);
        })
      }
    }else{
      if(item.children){
        RefreshLoadDevice(item.children,token,gbId,casPartitionId);
      }
    }
  });
}

const GetCascadeChildren = (data:any[])=>{
  for(let i = 0; i < defaultExpandIdsDevices.value.length; i++){
    data.forEach((item)=>{
      if(item.casPartitionId && item.casPartitionId === defaultExpandIdsDevices.value[i].casPartitionId){
        const CascadeToken = item.rootToken;
        const CasToken = item.token;
        GetCascadeHierarchy(CascadeToken,CasToken).then((res)=>{
          if(res.CasDevicePartitionStreamProfile.length > 0){
            item.online = res.DevicePartitionStreamProfile.online;
            item.offline = res.DevicePartitionStreamProfile.offline;
            item.disable = res.DevicePartitionStreamProfile.disable;
            item.idle = res.DevicePartitionStreamProfile.idle;
            item.AllLength = res.DevicePartitionStreamProfile.AllLength;
          }
          item.children  = res.CasDevicePartitionStreamProfile[0]?.children || [];
          if(item.children.length > 0){
            GetCascadeChildren(item.children);
          }
        }).catch((err)=>{
          console.error(err);
        });
      }
    });
  }
}

const filterMapChannel = () =>{
  const nodes = getSelectedNodes();
  if(nodes.length > 0){
    entity.value = buildEntity(nodes);
  }else {
    entity.value = []; 
  }
  MapChannel(
    OnlyMapData.value?.mapId || OnlyMapData.value?.token,
    map.value,
    isStaticMapOnly.value
  );  
};

const getSelectedNodes = () => {
  const checkedNodes = treeRef.value?.getCheckedNodes() || [];
  const checkedKeys = treeRef.value?.getCheckedKeys() || [];
  return checkedNodes.filter((node:any)=>{
    let parent = node.parent;
    while(parent){
      if(checkedKeys.includes(parent.key)){
        return false;
      }
      parent = parent.parent;
    }
    return true;
  })
}

const buildEntity = (nodes:any[]) => {
  const DevPartition:any[] = [];
  const CasPartition:any[] = [];
  nodes.forEach((node)=>{
    if(node.DifferentType === "PartitionNode" || node.DifferentType === "devChannel"){
      DevPartition.push({type:"USC_DEV_PARTITION",uuid:node.CustomUuid});
    }else if(node.DifferentType === "casDev" || node.DifferentType === "CasDevChildren" || node.DifferentType === "CasDevChannel"){
      CasPartition.push({
        type:"USC_CAS_PARTITION",
        uuid:node.CustomUuid,
      });
    }
  });
  return [...DevPartition,...CasPartition];
};

const dragover = (event:DragEvent)=>{

}

const dropTarget = () => {

}

const onContextMenu = (event:MouseEvent) => {

}

watch(
  () => playStore.liveplay,
  (token) => {
    if(!token)return;
    if (token?.entityType === "USC_VIEW_MAP") {
      let mapData = token.Mapdata;
      if(!mapData){
        mapData = {
          mapId:token.token,
          token: token.token,
          label: token.label,
          name: token.name,
          type: 'USC_MAP_STATIC', 
        }
      }
      OnlyMapData.value = mapData;
      ViewPlayMap(mapData);
      return;
    }
    if(token.token && token.vid){
      let targetId = token.vid;
      if(targetId.startsWith('h')){
        targetId = 'Maph' + targetId.substring(1);
      }
      if(props.hsid === targetId){
        PlayVideo(
          token.token,
          token.streamprofile || 'main',
          token.label || token.name,
          token.name,
          token.vid,
        )
      }
    }
  },
  { deep: true, immediate: true }
);

watch(filterText,(val)=>{
  if(treeRef.value){
    treeRef.value.filter(val);
  }
});
onMounted(()=>{
    if(props.independenceMap){
      loadDeviceTree();
    }
    const rootInstance = instance?.proxy?.$root as any;
    if(rootInstance?.bus){
      rootInstance.bus.$on("strLayoutType_Mapview",(data:string)=>{
        if(map.value){
          setTimeout(()=>{
            map.value.updateSize();
          },500);
        }
      });
      rootInstance.bus.$on("closeOverlay",(selected:string,uniqueId:string)=>{
          if(uniqueId){
            if(overlay.value[uniqueId]){
              overlay.value[uniqueId].setPosition(undefined);
              delete overlay.value[uniqueId];
            }
          }
        });

        rootInstance.bus.$on("closeMap",(token:string)=>{
          if(map.value){
            map.value.setTarget(null);
            map.value = null;
          }
          if(drawMap.value){
            drawMap.value.destroy();
            drawMap.value = null;
          }
          for(const key in overlay.value){
            overlay.value[key].setPosition(undefined);
          }
          overlay.value = {};
        });

    }    
})

onBeforeUnmount(()=>{
  if(map.value){
    map.value.setTarget(null);
    map.value = null;
  }
  if(drawMap.value){
    drawMap.value.destroy();
    drawMap.value = null;
  }
  for(const key in overlay.value){
    overlay.value[key].setPosition(undefined);
  }
  overlay.value = {};

  const win = window as any;
  if(win.h5handlerViewVideo){
    for(const key in win.h5handlerViewVideo){
      if(win.h5handlerViewVideo[key]){
        win.h5handlerViewVideo[key].disconnect();
      }
    }
    delete win.h5handlerViewVideo;
  }

  const rootInstance = instance?.proxy?.$root as any;
  if(rootInstance?.bus){
    rootInstance.bus.$off("strLayoutType_Mapview");
    rootInstance.bus.$off("closeOverlay");
    rootInstance.bus.$off("closeMap");    
  }
  CloseVideo()
})

defineExpose({
  Refresh,
  ViewPlayMap,
  MapChannel,
  map,
});
</script>

<style scoped>
.liveplay{
  width:100%;
  height: 100%;
  position: relative;

  :deep(.ol-zoom)  {
    bottom: 10px !important;
    right: 10px !important;
    top: auto !important;
    left: auto !important;
  }
  .OnlyMap{
    position:absolute;
    top: 20px;
    left: 20px;
    z-index:129;
    width: 264px;
    height: 420px;
    border-radius: 4px;
    padding:  12px 7px 12px;

    :deep(.el-collapse){
      .el-collapse-item__header{
        height: 40px;

        .liveview_colltitle{
          display: flex;
          .liveview_titleicon1{
            width: 35px;
            height: 35px;
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            font-size: 18px;
          }
        }
      }
    }

    .el-tree{
      overflow: auto;
      height: 380px;

      &::-webkit-scrollbar {
        width: 8px;
        height: 8px;
        scrollbar-arrow-color: red;
      }

      &::-webkit-scrollbar-thumb {
        border-radius: 5px;
        -webkit-box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        background: rgba(218, 218, 218, 0.2);
        scrollbar-arrow-color: red;
      }

      &::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        box-shadow: inset 0 0 5px rgba(218, 218, 218, 0.2);
        border-radius: 0;
        background: rgba(218, 218, 218, 0.1);
      }
    }
  }

  :deep(.ol-popup) {
    width: 808.5px;
    position: absolute;
    -webkit-filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
    filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.2));
    bottom: 12px;
    left: -100px;
    border-radius: 10px;
    overflow: hidden;

    &:after,
    &:before {
      top: 100%;
      content: " ";
      height: 0;
      width: 0;
      position: absolute;
      pointer-events: none;
      left: 100px;
    }

    .ol-popup-closer {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
      width: 20px;
      height: 20px;
      background: rgba(105, 105, 105, 0.7);
      box-shadow: 0px 1px 1px 0px rgba(0, 0, 0, 0.32);
      border-radius: 4px;
      text-align: center;
      line-height: 20px;

      &:hover {
        background: rgba(141, 189, 255, 0.3);
        .ol-popup-closer-btn {
          color: #32ACFF;
          opacity: 1;
          cursor: pointer;
        }
      }

      &:active {
        .ol-popup-closer-btn {
          color: #0399FE;
          opacity: 1;
          cursor: pointer;
        }
      }

      .ol-popup-closer-btn {
        text-decoration: none;
        font-size: 14px;
        color: #fff;
        opacity: 0.7;
        &:after {
          content: "✖";
        }
      }
    }

    .popup-content {
      width: 100%;
      height: 100%;

      .Map_Popup_title {
        width: 100%;
        height: 90%;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 10px 10px 0 0; 
        .h5video{
          width: 90%;
          height: 100%;
          object-fit: contain;
        }
      }
      .Map_Popup_content {
        height: 10%;
        flex-shrink: 0;
        border-radius: 0 0 10px 10px;
        p {
          margin: 0;
          padding-left: 4%;
          padding-top: 1.5%;
          margin-bottom: .2rem;
          font-size: 13px;
        }
      }
    }

    
  }

  .ol-popup1 {
    width: 600px;
    height: 300px;
  }

  .ol-popup2{
    width:112px;
    height:32px;
    min-height:32px;
    border-radius:4px;
    .openDoor,.closeDoor{
      width:unset;
      padding:0 20px;
      height:32px;
      border-radius:4px 0 0 4px;
      cursor:pointer;
      white-space:nowrap;
    }
  }
}
</style>