<template>
  <div class="wpl-player-container" id="wplplay" :style="containerStyle">
    <div v-if="connectionStatus === 'failed'" class="wpl_connection_error">
      <a>WPL connection disconnected, please exit and re-enter</a>
    </div>
    <div v-else :id="containerId" class="wpl-player" style="width: 100%; height: 100%;"></div>
    <div v-show="enablePlayback && showControls" class="playback-timeline">
      <div id="wpl-timeline" class="timeline" style="width: 100%;height: 80px;font-size: 10px;"></div>
    </div>
    <div v-show="enablePlayback && showControls" class="playback-controls">
      <div class="switch_type">
        <div class="async_switch">
          <span class="newPlaybackMode">
            <div class="iconfont icon-fuwucunchu" @click="toggleSyncMode" style="padding-inline:4px;" :class="{'is-active':syncMode === 'Sync'}" :title="syncMode === 'Sync' ? 'Sync' : 'Async'"></div>
					</span>
        </div>
        <!-- storage type -->
        <div class="storageType">
          <span class="playbackMode">
            <div class="iconfont icon-yuanduancunchu" @click="toggleStorageType" style="padding:5px 4px;cursor: pointer;" :class="{'is-active':DefaultStorage == 'DeviceStorage'}" :title="DefaultStorage === 'DeviceStorage'? 'Device Storage' : 'Central Record' "></div>
          </span>
        </div>
        <div style="width: 190px;"></div>
      </div>
      <div class="control_buttons">
        <div :class="playbackPlaying?'iconfont icon-zantingzhong':'iconfont icon-bofangzhong'" @click="togglePlaybackPause()" class="button_resume"></div>
        <div class="Speed">
          <i class="iconfont icon-zuobeisu" @click="speedDown"></i>
          <span style="align-items: center;justify-content: center;display: flex;">{{ playbackSpeed }}</span>
          <i class="iconfont icon-youbeisu" @click="speedUp"></i>
        </div>
        <div id="Audio_slider" class="Audio_slider">
          <div class="audio_icon" style="margin-right: 10px;">
            <i class="iconfont" :class="(AudioSlider==0)?'icon-jingyinguanbi':'icon-mn_shengyin_fill'" style="font-size: 22px;"></i>
          </div>
          <el-slider :step="1" :show-tooltip="false" :max="100" @input="AudioChange" v-model="AudioSlider" style="width: 80%;margin-right: 10px;"></el-slider>
        </div> 
      </div>

      <div class="caveat_butt">
        <div v-show="!showRecordType" style="width: 388px;"></div>
        <div class="showRecordType">
          <i class="iconfont" :class="showRecordType?'icon-yincang':'icon-xianshi'" @click="showRecordType = !showRecordType" style="cursor: pointer;"></i>
        </div>
        <div class="recordType" v-if="showRecordType">
          <button class="mr-0" type="button"></button>Schedule Record
          <button class="mr-1" type="button"></button>Manual Record
          <button class="mr-2" type="button"></button>Alarm Record
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import {ref,onMounted,onBeforeUnmount,watch, reactive, nextTick,} from 'vue';
import {getWPLPlayer,destroyWPLPlayer,clearWPLPlayer,fetchWPLConfig,setupWPLConfigListener, saveWPLConfigToMain} from "../utils/initWPL";
import uuid from '../utils/uuid'
import { backtopEmits, ElMessage,ElMessageBox } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Timeline } from '../assets/js/uplayersdk.esm.js'
import { useSiteInfo } from '../store/site-info';
import { DiscoveredDevice } from '../types/site-info';
import { useClientConfig } from '../store/client';

const siteStore = useSiteInfo();
const clientStore = useClientConfig()

const ES = ref<any>(null)

const props = defineProps({
  containerId:{type:String,default:'wplPlayer'},
  containerStyle:{type:Object,default:()=>({width:'100%',height:'100%'})},
  layoutType:{type:String,default:'WPL_LAYOUT_MODE_3X3'},
  visible:{type:Boolean,default:true},
  forceLayout:{type:Boolean,default:false},
  disableFullscreen:{type:Boolean,default:false},
  enablePlayback:{type:Boolean,default:false},
  //control ptz and stream info component
  showExtralComponent:{type:Boolean,default:true},
  //control playback control lane and timeline
  showControls:{type:Boolean,default:true},
})

const emit = defineEmits([
  'message','ready','play','stop-all','window-click','snapshot','local-snapshot','serve-snapshot',
  'intercom-clicked','intercom-started','intercom-stopped','ptz','info','local-record','serve-record',
  'layout-change','fullscreen','clear','destroy','play-ended','fullscreen-exit',
  //playback
  'playback-start','playback-pause','playback-resume','playback-ended','playback-time-update','audio-change','playback-speed'
])

const isReady = ref(false)
const isWindowCreated = ref(false)
const isConnected = ref(false)
const connectionStatus = ref('connecting')
const currentWindows = ref(new Map())
const windowCount = ref(9)
const currentLayoutType = ref('WPL_LAYOUT_MODE_3X3')
const intercomStatus = ref(new Map())
const lastIntercomTime = ref(0)
const eventsBound = ref(false)
const isInitializing = ref(false)
let wplPlayerInstance :any = null
let boundHandleMessage :any = null
let stopAllEventHandler :any = null
let pendingConfig :any = null


const playbackPlaying = ref(false)
const playbackWindowIndex = ref<number|null>(null)
const playbackSpeed = ref('1.0')
const currentPlaybackToken = ref('')
const playbackSpeedOptions = ['0.25','0.5','1.0','2.0','4.0','8.0','16.0']
const speedIndex = ref(2)
const AudioSlider = ref(0)
const DefaultStorage = ref<'CentralStorage'|'DeviceStorage'>('CentralStorage')
const syncMode = ref<'Async'|'Sync'>('Sync')
const showRecordType = ref(false)
const currentSelectedWindowIndex = ref(0)
const mousemoveFlag = ref(false);
const windowPlaybackStatus = ref(new Map())
const windowCurrentTime = ref(new Map())
const windowTimelineData = ref(new Map())
const windowPlaybackRange = ref(new Map())
const windowPlaybackSpeed = ref(new Map())
const windowVolume = ref(new Map()) 

const ptzVisible = ref(false)
const ptzToken = ref('')
const ptzWindowIndex = ref<number | null>(null)
const ptzStream = ref('')
const ptzSpeed = ref(0.5)
const presetList = ref<any[]>([])


const infoVisible = ref(false)
const infoToken = ref('')
const infoStream = ref('')
const infoData = reactive({video:[] as any[],audio:[] as any[]})
let infoTimer : any = null


const timelineInstance = ref<any>(null);
const isMoveto = ref(false);

const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string; session: string; root: string; ip:string ; port:number;protocol:string} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', session: '', root: '', protocol:'', ip:'', port:16445 };
    }
    let target = siteStore.selectedSite || devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if(target && target.login === false){
      const matched = devices.find(d => d.ipv4Address === target.ipv4Address && d.login === true && d.session);
      if(matched)target = matched;
    }
    if (!target) {
        return { target: null, access_token: '', session: '', root: '', protocol:'', ip:'', port:16445 };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        protocol:protocol,
        root: `${protocol}://${target.ipv4Address}:${port}`,
        port:port,
        ip:target.ipv4Address
    };
}

//=========init=========

const init = async () =>{
  if(!ES.value){
    ES.value = await window.ipcRenderer.invoke('get-storage-data');
  }
  if(!ES.value.windowBuffer){
    await new Promise<void>((resolve)=>{
      const checkInterval = setInterval(()=>{
        if(ES.value.windowBuffer){
          clearInterval(checkInterval);
          resolve();
        }
      },50);
    });
  }
  const currentWindowId = ES.value.windowId;
  if(!currentWindowId){
    await new Promise<void>((resolve) =>{
      const checkInterval = setInterval(()=>{
        if(ES.value.windowId){
          clearInterval(checkInterval);
          resolve();
        }
      },50);
    });
  }
  let finalWindowId = ES.value.windowId;
  if(window.ipcRenderer && !finalWindowId){
    try{
      finalWindowId = await window.ipcRenderer.invoke('get-current-window-id');
      if(finalWindowId && finalWindowId !== ES.value.windowId){
        ES.value.windowId = finalWindowId;
      }
    }catch(error){
      console.error(error);
    }
  }
  const config = await fetchWPLConfig();
  if(config){
    clientStore.wplConfig({
      wplRecordPath:config.recordPath || '',
      wplCapturePath:config.capturePath || '',
      wplGpuDecoding:String(config.gpuDecoding || false),
      wplMetaRender:String(config.metaRender || true),
    })
  }
  try{

    const player = await getWPLPlayer();

    if(player && player.isConnected){
      onConnected();
    }else{
      window.addEventListener('wpl-connected',onConnected);
    }
  }catch(error){
    console.error(error);
    connectionStatus.value = 'failed'
  }
  setTimeout(()=>{
    if(connectionStatus.value !== 'success'){
      connectionStatus.value = 'failed'
    }
  },3000)
}

/**
 * WS connect
 */
const onConnected=()=>{
  wplPlayerInstance = window.$wplPlayer;
  connectionStatus.value = 'success';
  isConnected.value = true;

  if(props.disableFullscreen && wplPlayerInstance){
    if(wplPlayerInstance.fullScreen){
      wplPlayerInstance.fullScreen = () =>{
        return;
      };
    }
    if(wplPlayerInstance.mediaController && wplPlayerInstance.mediaController.setFullScreen){
      wplPlayerInstance.mediaController.setFullScreen=()=>{return;};
    }
  }

  bindEvents();
  createWindow();
  emit('ready',window.$wplPlayer);
  window.removeEventListener('wpl-connected',onConnected);

  if(pendingConfig){
    const player = window.$wplPlayer;
    if(player && player.setLocalConfig){
      player.setLocalConfig({
        recordPath:pendingConfig.recordPath || '',
        capturePath:pendingConfig.capturePath || '',
        gpuDecoding:pendingConfig.gpuDecoding || 'false',
        metaRender:pendingConfig.metaRender || 'true',
      });
      pendingConfig = null;
    }
  }
}

/**
 * bind events
 */
const bindEvents = () =>{
  if(eventsBound.value)return;
  eventsBound.value = true;
  boundHandleMessage = handleMessage;
  wplPlayerInstance.off('message',boundHandleMessage);
  wplPlayerInstance.on('message',boundHandleMessage);
  stopAllEventHandler = () =>{
    currentWindows.value.clear();
    emit('stop-all')
  }
  wplPlayerInstance.off('stopAll',stopAllEventHandler);
  wplPlayerInstance.on('stopAll',stopAllEventHandler);
}

/**
 * deal with message from webSocket
 */
const handleMessage = (data:any) =>{
  if(props.disableFullscreen){
    if(data.method === 'wpl_window_fullScreen')return;
  }
  if(data && data.method === 'wpl_system_webconnect'){
    emit('ready',wplPlayerInstance);
    return;
  }
  if(data.method === 'wpl_window_exitfullScreen'){
    emit('fullscreen-exit')
    return;
  }
    if(data.method === 'wpl_notify_video_playback_time'){
      const {nCurrentTime,nDuration} = data.notifyVidPlaybackTime || {};
      emit('playback-time-update',{currentTime:nCurrentTime,duration:nDuration});
      return;
    }

  switch (data.method){
    case 'wpl_notify_window_clicked':
      const windowIndex = data.notifyWinClicked?.strWinIndex;
      if(windowIndex !== undefined){
        handleWindowClick(data);
      }
      break;
    case 'wpl_notify_video_serve_snapshot_clicked':
      handleServeSnapshotClicked(data);
      break;
    case 'wpl_notify_video_local_snapshot_clicked':
      handleLocalSnapshotClicked(data);
      break;
    case 'wpl_notify_video_intercom_clicked':
      handleIntercomClicked(data);
      break;
    case 'wpl_notify_video_ptz_clicked':
      handlePTZ(data);
      break;
    case 'wpl_notify_video_codecinfo_clicked':
      handleInfoClicked(data);
      break;
    case 'wpl_notify_video_local_record_clicked':
      handleLocalRecordClicked(data);
      break;
    case 'wpl_notify_video_serve_record_clicked':
      handleServeRecordClicked(data);
      break;
    case 'wpl_notify_video_play_status':
      handlePlayStatus(data);
      break;
    case 'wpl_video_playbackMode':
      updateTimeline(data);
      break;
    default:
      break;
  }
  emit('message',data);
}


//=========window manage=========
/**
 * create window
 */
const createWindow = () =>{
  if(isWindowCreated.value)return;
  const player = window.$wplPlayer;
  if(!player)return;
  
  const container = document.getElementById(props.containerId);
  if(!container){
    setTimeout(createWindow,200);
    return;
  }
  if(player.createWindow){
    const layoutType = props.layoutType;

    player.createWindow({
      videoId:props.containerId,
      windowType:layoutType,
      windowId:ES.value.windowBuffer
    });
    isWindowCreated.value = true;
    isReady.value = true;
    emit('layout-change',{layoutType});
  }
  connectionStatus.value = 'success';
  isConnected.value = true;

  setTimeout(()=>{
    player.syncWindowPosition();
    player.show();
  },100);
}

/**
 *  set layout Type
 * @param {string} layoutType -layout type
 */
const switchLayout = (layoutType:string)=>{
  
  const player = window.$wplPlayer;
  
  if(!player)return;
  if(player.switchLayout){
    player.switchLayout(layoutType);
  }
  
  currentLayoutType.value = layoutType;
  windowCount.value = getWindowCountFromLayout(layoutType);
  
  emit('layout-change',{layoutType,windowCount:windowCount.value});
}

/**
 *  get grid window id
 * @param {string} layoutType -layout type
 */
const getWindowCountFromLayout=(layoutType:string):number =>{
  const countMap:Record<string,number>={
    'WPL_LAYOUT_MODE_1X1': 1, 'WPL_LAYOUT_MODE_2X2': 4,'WPL_LAYOUT_MODE_3X3': 9,
    'WPL_LAYOUT_MODE_4X4': 16,'WPL_LAYOUT_MODE_5X5': 25,'WPL_LAYOUT_MODE_6X6': 36,
    'WPL_LAYOUT_MODE_8X8': 64,'WPL_LAYOUT_MODE_6': 6,'WPL_LAYOUT_MODE_1p1': 2,
    'WPL_LAYOUT_MODE_1p2': 3, 'WPL_LAYOUT_MODE_1p3': 4, 'WPL_LAYOUT_MODE_8': 4, 
  };
  return countMap[layoutType] || 9;
}

//=========play control=========
/**
 * play ontime video
 * @param options - play data
 */
const play = async(options:any)=>{
  const player = window.$wplPlayer;
  if(!player) throw new Error('[WPL] player is unalready');
  const {windowIndex,token,streamprofile,channelName,host,meta='true',session,port,protocol}=options;
  const playConfig={
    protocol:protocol,
    host:`${host}:${port}`,
    rootpath:'/',
    token:token,
    streamprofile:streamprofile,
    session:session,
    meta:meta,
    channelName:channelName,
    enableServeRecord:'false',
  };
    try {
        player.play(String(windowIndex), playConfig);
    } catch (error) {
        console.error(error);
        throw error;
    }
  currentWindows.value.set(windowIndex,{token,streamprofile,channelName,playTime:Date.now()});
  emit('play',{windowIndex,token,streamprofile,channelName});
}

/**
 * play playback video
 * @param options -play data
 */
const playback = async(options:any)=>{
  const {session,ip,port,target} = getDeviceInfo(); 
  const player = window.$wplPlayer;
  if(!player)return;

  const {
    windowIndex,
    token,
    startTime,
    endTime,
    streamprofile='main',
    channelName = token,
    host = ip,
    uscPort = port
  } = options;
  if(!startTime || !endTime)return;

  const protocol = target?.enableHttps === true?"https:":"http:";
  const serverpb = DefaultStorage.value === 'CentralStorage' ? 'true' : 'false';

  windowPlaybackRange.value.set(parseInt(windowIndex),{
    beginTime:startTime,
    endTime:endTime,
  });

  let actualPlaybackTime = startTime;
  let currentPlayTimeForQuery = new Date(startTime);
  if(syncMode.value === 'Sync'){
    let foundPlaybackTime = null;
    for(const [idx,info] of currentWindows.value.entries()){
      if(info.isPlayback){
        const currentTime = windowCurrentTime.value.get(idx);
        if(currentTime){
          foundPlaybackTime = currentTime;
          actualPlaybackTime = currentTime.toISOString();
          break;
        }
      }
    }
    if(foundPlaybackTime){
      currentPlayTimeForQuery = foundPlaybackTime;
    }else{
      currentPlayTimeForQuery = new Date(startTime);
    }
  }

  currentSelectedWindowIndex.value = parseInt(windowIndex);
  windowPlaybackStatus.value.set(parseInt(windowIndex),true);
  playbackPlaying.value = true;
  playbackSpeed.value = '1.0';
  speedIndex.value = 2;
  mousemoveFlag.value = false;
  windowCurrentTime.value.set(parseInt(windowIndex),new Date(startTime));

  const queryDate = new Date(currentPlayTimeForQuery);
  const queryEndtime = new Date(queryDate);
  queryEndtime.setHours(23,59,59,999);
  const queryStartTime = new Date(queryDate);
  queryStartTime.setDate(queryStartTime.getDate()-1);
  queryStartTime.setHours(0,0,0,0);

  await searchRecordByTime(token,queryStartTime,queryEndtime,serverpb,parseInt(windowIndex));

  const playConfig = {
    protocol:protocol,
    host:`${host}:${uscPort}`,
    rootpath:'/',
    token:token,
    streamprofile:'main',
    session:session,
    meta:'true',
    channelName:channelName,
    enableServeRecord:'false',
    playMode:'playback',
    pbconf:{
      begintime:startTime,
      endtime:endTime,
      moveto:startTime,
      serverpb:serverpb,
    }
  };
  try{
    player.play(String(windowIndex),playConfig);
    playbackWindowIndex.value = windowIndex;
    currentPlaybackToken.value = token;
    playbackPlaying.value = true;
    
    currentWindows.value.set(windowIndex,{
      token,
      streamprofile,
      channelName,
      playTime:Date.now(),
      isPlayback:true,
      playbackBeginTime:startTime,
      playbackEndTime:endTime
    });
    emit('playback-start',{windowIndex,token,startTime,endTime});
  }catch(error){
    console.error(error);
  }
}

const initTimeline = () =>{
  if(!props.showControls)return;
  const container = document.getElementById('wpl-timeline');
  if(!container){
    setTimeout(initTimeline,200);
    return;
  }
  container.innerHTML = '';

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','100%');
  svg.setAttribute('height','100%');
  svg.setAttribute('id','timeline-svg');
  container.appendChild(svg);

  let timelineBackgroundColor = '#343434';

  timelineInstance.value = new Timeline('#timeline-svg',{
    baseMinutes:720,
    backgroundColor:timelineBackgroundColor,
  });
  timelineInstance.value.addEventListener('change',(e:any)=>{
    if(playbackWindowIndex.value !== null && !isMoveto.value){
      moveto(playbackWindowIndex.value,e.detail,true);
    }
  });
  timelineInstance.value.addEventListener('pause',()=>{
    if(playbackWindowIndex.value === null)return;
    pause(playbackWindowIndex.value);
  });
  timelineInstance.value.addEventListener('resume',(e:any)=>{
    if(playbackWindowIndex.value !== null){
      const time = e?.detail?.time || e?.detail;
      if(time){
        moveto(playbackWindowIndex.value,time,true);
        resume(playbackWindowIndex.value);
      }
      
    }
  });
}

const moveto = (windowIndex:number,time:string,isFromTimeline = false) =>{
  const player = window.$wplPlayer;
  if(!player)return;
  if(isFromTimeline){
    isMoveto.value = true;
    setTimeout(()=>{
      isMoveto.value = false;
    },1000);
  }
  player.moveto?.(String(windowIndex),time);
}

const pause = (windowIndex:number)=>{
  const player = window.$wplPlayer;
  if(!player)return;
  if(player.pause){
    player.pause(String(windowIndex));
  }
  if(syncMode.value === 'Sync'){
    windowPlaybackStatus.value.set('global',false);
    playbackPlaying.value = false;
    for(const [idx,info] of currentWindows.value.entries()){
      if(info.isPlayback){
        windowPlaybackStatus.value.set(idx,false);
      }
    }
  }else{
    windowPlaybackStatus.value.set(windowIndex,false);
    if(currentSelectedWindowIndex.value === windowIndex){
      playbackPlaying.value = false;
    }
  }
  emit('playback-pause',{windowIndex});
};

const resume = (windowIndex:number) =>{
  const player = window.$wplPlayer;
  if(!player)return;
  if(player.resume){
    player.resume(String(windowIndex));
  }
  if(syncMode.value === 'Sync'){
    windowPlaybackStatus.value.set('global',true);
    playbackPlaying.value = true;
    for(const [idx,info] of currentWindows.value.entries()){
      if(info.isPlayback){
        windowPlaybackStatus.value.set(idx,true);
      }
    }
  }else{
    windowPlaybackStatus.value.set(windowIndex,true);
    if(currentSelectedWindowIndex.value === windowIndex){
      playbackPlaying.value = true;
    }
  }
  emit('playback-resume',{windowIndex});
};

/**
 * get weather the video is stoped
 */
const handlePlayStatus = (data: any) => {
  const { strToken, status, strWinIndex } = data.notifyVidPlayStatus || {};

  if (strWinIndex === undefined || strWinIndex === null)return;
  
  const windowIndex = parseInt(strWinIndex);
  
  if (status === 'WPL_PLAY_STATUS_ENDED') {
    intercomStatus.value.delete(strToken);
  
    const windowInfo = currentWindows.value.get(windowIndex);
    
    if (!windowInfo) return;

    const token = windowInfo.token;
    let hasOtherPlay = false;
    for (const [idx, info] of currentWindows.value.entries()) {
      if (info.token === token && idx !== windowIndex) {
        hasOtherPlay = true;
        break;
      }
    }
    
    currentWindows.value.delete(windowIndex);
    windowTimelineData.value.delete(windowIndex);
    windowTimelineData.value.delete('all_' + windowIndex);
    windowPlaybackRange.value.delete(windowIndex);
    windowCurrentTime.value.delete(windowIndex);
    windowPlaybackStatus.value.delete(windowIndex);
    windowPlaybackSpeed.value.delete(windowIndex);
    windowVolume.value.delete(windowIndex);

    if(currentSelectedWindowIndex.value === windowIndex){
      if(timelineInstance.value){
        timelineInstance.value.options.name = '';
        (timelineInstance.value as any)._initEventBarName?.();
        timelineInstance.value.updateMotionEvents([],[]);
        (timelineInstance.value as any).updateTimelineView?.();
        timelineInstance.value.options.motionEvents = [];
        timelineInstance.value.options.motionEventsAll = [];
        timelineInstance.value.motionBars = [];
        timelineInstance.value.motionBarsAll = [];
        timelineInstance.value._createMotionBars();
        (timelineInstance.value as any).updateTimelineView?.();
      }
      playbackPlaying.value = false;
    }else{
      const hasOtherPlayback = Array.from(currentWindows.value.values()).some(info => info.isPlayback);
      if(!hasOtherPlayback){
        if(timelineInstance.value){
          timelineInstance.value.options.name = '';
          (timelineInstance.value as any)._initEventBarName?.();
          timelineInstance.value.updateMotionEvents([],[]);
          (timelineInstance.value as any).updateTimelineView?.();
          timelineInstance.value.options.motionEvents = [];
          timelineInstance.value.options.motionEventsAll = [];
          timelineInstance.value.motionBars = [];
          timelineInstance.value.motionBarsAll = [];
          timelineInstance.value._createMotionBars();
          (timelineInstance.value as any).updateTimelineView?.();
        }
        playbackPlaying.value = false;
      }
    }
    
    emit('play-ended', {
      token: token,
      windowIndex,
      streamprofile: windowInfo?.streamprofile,
      hasOtherPlay:hasOtherPlay
    });
  }
}

/**
 * stop all
 */
const stopAll = ()=>{
  const player = window.$wplPlayer;
  if(player){
    player.sendMessage({method:'wpl_video_stopAll',timestamp:Date.now(),sequence:uuid().toLowerCase(),sessionUuid:player.session});
  }
  const playingTokens = new Set();
  for(const [idx,info] of currentWindows.value.entries()){
    if(info.isPlayback){
      playingTokens.add(info.token);
    }
  }
  currentWindows.value.clear();
  playbackPlaying.value = false;
  isMoveto.value = false;
  mousemoveFlag.value = false;
  windowPlaybackStatus.value.clear();
  windowCurrentTime.value.clear();
  windowTimelineData.value.clear();
  windowPlaybackRange.value.clear();
  windowPlaybackSpeed.value.clear();
  windowVolume.value.clear();
  if(timelineInstance.value){
    timelineInstance.value.updateMotionEvents([],[]);
    (timelineInstance.value as any).updateTimelineView?.();

    timelineInstance.value.options.motionEvents = [];
    timelineInstance.value.options.motionEventsAll = [];
    timelineInstance.value.motionBars = [];
    timelineInstance.value.motionsBarsAll = [];

    timelineInstance.value._createMotionBars();
    (timelineInstance.value as any).updateTimelineView?.();

    timelineInstance.value.options.name = '';
    (timelineInstance.value as any)._initEventBarName?.();
  }
  emit('stop-all',{tokens:Array.from(playingTokens)});
}

const show = () => window.$wplPlayer?.show();

const hide = () => window.$wplPlayer?.hide();

/**
 * full screen
 */
const fullScreen = () =>{
  window.$wplPlayer?.sendMessage({method:'wpl_window_fullScreen',timestamp:Date.now(),sequence:uuid().toLowerCase(),sessionUuid:window.$wplPlayer?.session});
  emit('fullscreen');
}

const getWindowInfo = (windowIndex:number) => currentWindows.value.get(windowIndex) || null;
const getAllPlayingWindows = () => Array.from(currentWindows.value.keys());

/**
 * close player but no disconnect 
 */
const clearPlayer = () =>{
  clearWPLPlayer();
  isReady.value = false;
  isWindowCreated.value = false;
  emit('clear');
}

/**
 * disconnect
 */
const destroy = () =>{
  const player = window.$wplPlayer;
  if(player?.off){
    player.off('message',boundHandleMessage);
    if(stopAllEventHandler)player.off('stopAll',stopAllEventHandler);
  }
  if(infoTimer)clearInterval(infoTimer);
  destroyWPLPlayer();
  emit('destroy');
}

//=========video function=========
/**
 * local snapshot
 */
const handleLocalSnapshotClicked = (data:any) =>{
  const {strToken,strPath} = data.notifyVidLocalSnapshotClicked || {};
  let windowIndex :number | null=null;
  for(const [idx,info] of currentWindows.value.entries()){
    if(info.token === strToken){windowIndex = idx;break;}
  }
  emit('local-snapshot',{token:strToken,windowIndex,path:strPath || '',originalData:data});
}

/**
 * serve snapshot
 */
const handleServeSnapshotClicked = async (data:any) =>{
  const {root,session} = getDeviceInfo()
  const {strToken} = data.notifyVidServeSnapshotClicked || {};
  if(!strToken)return;
  const url = `${root}//uapi/v1/Snapshot?token=${strToken}&session=${session}`;
  try{
    const response = await fetch(url);
    const result = await response.json();
    if(result.bStatus !== false){
      ElMessage.success('Server snapshot succeeded');
      emit('serve-snapshot',{token:strToken,success:true})
    }
  }catch(error){
    ElMessage.error('Server snapshot failed');
  }
}


/**
 * local record
 * @param data - video data
 */
const handleLocalRecordClicked = (data:any) =>{
  const {strToken,strPath,bEnable} = data.notifyVidLocalRecordClicked || {};
  let windowIndex:number | null = null ;
  for(const [idx,info] of currentWindows.value.entries()){
    if(info.token === strToken){windowIndex = idx;break;}
  }
  emit('local-record',{token:strToken,windowIndex,path:strPath,isRecording:bEnable === "true",originalData:data});
};

/**
 * serve record
 * @param data - video data
 */
const handleServeRecordClicked = async (data:any) => {
  const {root,session} = getDeviceInfo()
  const {strToken,bEnable} = data.notifyVidServeRecordClicked || {};
  if(!strToken)return;
  const action = bEnable ? 'ManualRecordStop' : 'ManualRecordStart';
  const url = `${root}//uapi/v1/${action}?token=${strToken}&session=${session}`;
  try{
    const response = await fetch(url);
    const result = await response.json();
    if(result.bStatus !== false){
      const message = bEnable?'Server recording ended':'Server recording started';
      ElMessage.success(message);
      emit('serve-record',{token:strToken,isRecording:!bEnable,success:true});
    }else{
      const message = bEnable?'Server recording failed':'Server recording failed';
      ElMessage.error(message);
      emit('serve-record',{token:strToken,isRecording:bEnable,success:false,error:result.strError});
    }
  }catch(error){
    console.error('record failed：',error);
  }
}

const requestMicPermission = async () : Promise<boolean> =>{
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    stream.getTracks().forEach(track => track.stop());
    return true;
  }catch(error :any){
    console.error('get mic permission failed:',error);
    if(error.name === 'NotAllowedError'){
      ElMessage.error('Please allow microphone permission');
    }else if(error.name === 'NotFoundError'){
      ElMessage.error('No microphone device detected');
    }else{
      ElMessage.error('Failed to obtain microphone permission')
    }
    return false;
  }
}

/**
 * begin intercom
 */
const startIntercom = async (token:string,windowIndex:number)=>{
  const player = window.$wplPlayer;
  if(!player)return false;
  if(!player.wsManager?.isWsConnected)return false;
  const hasPremission = await requestMicPermission();
  if(!hasPremission) return false;
  const message = {
    method:'wpl_video_intercom',
    timestamp:Date.now(),
    sequence:uuid().toLowerCase(),
    sessionUuid:player.session,
    vidIntercomReq:{
      strToken:token,
      strWinIndex:String(windowIndex),
      bEnable:true
    }
  };
  player.sendMessage(message);
  intercomStatus.value.set(token,true);
  ElMessage.success('Intercom enabled');
  emit('intercom-started',{token,windowIndex});
  return true;
}

/**
 * stop intercom
 */
const stopIntercom = () => {
  const player = window.$wplPlayer;
  if(!player)return false;
  if(!player.wsManager?.isWsConnected)return false;
  
  const message = {
    method:'wpl_video_intercom',
    timestamp:Date.now(),
    sequence:uuid().toLowerCase(),
    sessionUuid:player.session,
    vidIntercomReq:{
      strToken:"",
      strWinIndex:"",
      bEnable:false,
    }
  };
  player.sendMessage(message);
  intercomStatus.value.clear();
  ElMessage.info('Intercom Disabled');
  emit('intercom-stopped');
  return true;
}

/**
 * deal intercom
 */
const handleIntercomClicked = async(data:any) =>{
  const token = data.notifyVidIntercomClicked?.strToken;
  if(!token)return;
  let windowIndex :number | null = null;
  for(const [idx,info] of currentWindows.value.entries()){
    if(info.token === token){windowIndex = idx;break;}
  }
  const now = Date.now();
  if(now - lastIntercomTime.value<300)return;
  lastIntercomTime.value = now;

  const currentStatus = intercomStatus.value.get(token) || false;
  if(currentStatus){
    await stopIntercom();
  }else{
    if(windowIndex !== null){
      await startIntercom(token,windowIndex);
    }
  }
}

/**
 * deal ptz
 */
const handlePTZ = (data:any) =>{
  const token = data.notifyVidPTZClicked?.strToken;
  if(!token)return;
  let windowIndex:number | null=null;
  let streamprofile:string | null=null;
  for(const [idx,info] of currentWindows.value.entries()){
    if(info.token === token){windowIndex = idx;streamprofile = info.streamprofile;break;}
  }
  emit('ptz',{token,windowIndex,streamprofile,originalData:data});
}

/**
 * show ptz controller
 * @param {string} token - device token
 * @param {number} windowIndex - device grid id
 * @param {string} stream - stream type
 */
const showPtz = (token:string,windowIndex:number | null,stream:string|null)=>{
  ptzToken.value = token;
  ptzWindowIndex.value = windowIndex;
  ptzStream.value = stream || '';
  ptzVisible.value = true;
  getPresets();
}

/**
 * close ptz controller
 */
const closePtz = () =>{
  ptzVisible.value = false;
  ptzToken.value = '';
  ptzWindowIndex.value = null;
  ptzStream.value = '';
  presetList.value = [];
}

/**
 * ptz controller action
 */
const ptzAction = (action:string)=>{
  const {root,session} = getDeviceInfo();
  if(!ptzToken.value)return;
  const directionActions = ['up','down','right','left','upleft','upright','downleft','downright'];
  const url = `${root}//uapi/v1/Ptz?token=${ptzToken.value}&action=${action}&session=${session}${directionActions.includes(action)?`&speed=${ptzSpeed.value}`:''}`;
  fetch(url).catch(console.error);
}

/**
 * get ptz presets list
 */
const getPresets = async() => {
  const {root,session} = getDeviceInfo()
  if(!ptzToken.value)return;
  console.log('-------------------------------',session)
  const url = `${root}//uapi/v1/GetPresets?token=${ptzToken.value}&session=${session}`;
  try{
    const res = await fetch(url);
    const data = await res.json();
    if(data.bStatus !== false && data.preset){
      presetList.value = data.preset.slice(0,8);
    }
  }catch(error){
    console.error('get presets failed',error);
  }
} 

/**
 * go to presets
 */
const gotoPreset = async(presetToken:string)=>{
  const {root,session} = getDeviceInfo();
  if(!ptzToken.value)return;
  const url = `${root}//uapi/v1/Ptz?token=${ptzToken.value}&preset=${presetToken}&speed=${ptzSpeed.value}&session=${session}`;
  await fetch(url);
}

/**
 * delete presets
 */
const deletePreset = async (presetToken:string) =>{
  const {root,session} = getDeviceInfo();
  try{
    await ElMessageBox.confirm('Are you sure you want to delete this preset position?','Tip',{type:'warning'});
    const url = `${root}//uapi/v1/DelPreset?token=${ptzToken.value}&preset=${presetToken}&session=${session}`;
    const res = await fetch(url);
    const data = await res.json();
    if(data.bStatus !== false){
      ElMessage.success('Deleted successfully');
      getPresets();
    }
  }catch(error){
    if(error !== 'cancel') console.error(error);
  }
}

/**
 * handle stream info
 */
const handleInfoClicked = (data:any) =>{
  const token = data.notifyVidCodecInfoClicked?.strToken;
  const stream = data.notifyVidCodecInfoClicked?.strStream;
  if(!token)return;
  if(ptzVisible.value)closePtz();
  if(infoVisible.value && infoToken.value === token && infoStream.value === stream){
    closeInfo();
  }else{
    showInfo(token,stream);
  }
  emit('info',{token,streamprofile:stream,originalData:data});
}

/**
 * get stream info
 */
const getStreamInfo = async() =>{
  const {root,session} = getDeviceInfo();
  if(!infoToken.value)return;
    const url=`${root}//uapi/v1/GetVidStreamStatus?token=${infoToken.value}&stream=${infoStream.value}&session=${session}`;
    try{
      const res = await fetch(url);
      const data = await res.json();
      if(data){
        infoData.video = [
          { name: 'Codec', data: data.strVideoType },
          { name: 'Width', data: data.nVideoWidth },
          { name: 'Height', data: data.nVideoHeight },
          { name: 'FPS', data: data.nVideoFPS },
          { name: 'Bitrate', data: ((data.nVideoBitrate || 0) / 1024).toFixed(1) + 'kbps' }
        ];
        infoData.audio = [
          { name: 'Codec', data: data.strAudioType },
          { name: 'Sample Rate', data: data.nAudioSampleRate },
          { name: 'Sample Bit', data: data.nAudioSampleBit },
          { name: 'Channels', data: data.nAudioChannels },
          { name: 'Bitrate', data: ((data.nAudioBitrate || 0) / 1024).toFixed(1) + 'kbps' } 
        ];
      }
    }catch(error){
      console.error(error);
    }
}

/**
 * show stream info display stand
 * @param token -device token 
 * @param stream - stream info
 */
const showInfo = (token:string,stream:string)=>{
  infoToken.value = token;
  infoStream.value = stream;
  infoVisible.value = true;
  getStreamInfo();
  if(infoTimer)clearInterval(infoTimer);
  infoTimer = setInterval(getStreamInfo,1000);
}

/**
 * close stream info display stand
 */
const closeInfo = () =>{
  infoVisible.value = false;
  infoToken.value = '';
  infoStream.value = '';
  if(infoTimer){clearInterval(infoTimer);infoTimer = null;}
}

const syncWindowPosition = () => {
  const result = window.$wplPlayer?.syncWindowPosition();
  return result;
}

//============replay function============

const togglePlaybackPause = () =>{
  const windowIndex = currentSelectedWindowIndex.value;
  const currentWindowInfo = currentWindows.value.get(windowIndex);
  if(!currentWindowInfo || !currentWindowInfo.isPlayback)return;
  const statusKey = syncMode.value === 'Sync' ? 'global' : windowIndex;
  const isPlaying = windowPlaybackStatus.value.get(statusKey) || false;
  if(isPlaying){
    pause(windowIndex);
  }else{
    resume(windowIndex);
  }
}

const speedUp = () => {
  if(speedIndex.value < playbackSpeedOptions.length - 1){
    speedIndex.value ++;
    playbackSpeed.value = playbackSpeedOptions[speedIndex.value];
    changeSpeed();
  }
}

const speedDown = () =>{
  if(speedIndex.value >0){
    speedIndex.value--;
    playbackSpeed.value = playbackSpeedOptions[speedIndex.value];
    changeSpeed();
  }
}

const speed = (windowIndex:number,speedValue:string) => {
  const player = window.$wplPlayer;
  if(!player)return;
  if(player.speed){
    player.speed(String(windowIndex),speedValue);
  }
  if(syncMode.value === 'Sync'){
    windowPlaybackSpeed.value.set('global',speedValue);
    playbackSpeed.value = speedValue;
  }else{
    windowPlaybackSpeed.value.set(windowIndex,speedValue);
    if(currentSelectedWindowIndex.value === windowIndex){
      playbackSpeed.value = speedValue;
    }
  }
  emit('playback-speed',{windowIndex,speed:speedValue});
}

const changeSpeed = () =>{
  const player = window.$wplPlayer;
  if(!player || playbackWindowIndex.value === null)return;
  const winIndex = currentSelectedWindowIndex.value;
  if(winIndex !== null && winIndex !== undefined){
    speed(winIndex,playbackSpeed.value);
  }
}

const switchStorageType = (type:'CentralStorage'|'DeviceStorage') =>{
  if(DefaultStorage.value === type) return;
  DefaultStorage.value = type;
  if(currentPlaybackToken.value && playbackWindowIndex.value !== null){
    const currentInfo = currentWindows.value.get(playbackWindowIndex.value);
    if(currentInfo?.isPlayback){
      playback({
        windowIndex:playbackWindowIndex.value,
        token:currentPlaybackToken.value,
        startTime:currentInfo.playbackBeginTime,
        endTime:currentInfo.playbackEndTime,
        streamprofile:currentInfo.streamprofile,
        channelName:currentInfo.channelName,
      });
    }
  }
}

const toggleStorageType = () => {
  const newType = DefaultStorage.value === 'CentralStorage' ? 'DeviceStorage' : 'CentralStorage';
  switchStorageType(newType);
}

const AudioChange = (value:number) =>{
  AudioSlider.value = value;
  const player = window.$wplPlayer;
  const windowIndex = currentSelectedWindowIndex.value;
  if(windowIndex !== null && player){
    if(syncMode.value === 'Sync'){
      windowVolume.value.set('global',value);
      for(const [idx,info] of currentWindows.value.entries()){
        if(info.isPlayback){
          player.setAudioVolumn?.({
            winIndex:String(idx),
            volume:value
          });
          windowVolume.value.set(idx,value);
        }
      }
    }else{
      player.setAudioVolumn?.({
        winIndex:String(windowIndex),
        volume:value
      });
      windowVolume.value.set(windowIndex,value);
    }
  }
  emit('audio-change',{volume:value});
}

const setSyncMode = (mode:'Async'|'Sync') => {
  const player = window.$wplPlayer;
  if(!player)return;

  if(!mode){
    const stored = localStorage.getItem('SyncMode');
    if(stored){
      try{
        const parsed = JSON.parse(stored);
        if(parsed === 'Sync' || parsed === 'Async'){
          mode = parsed;
        }
      }catch(e){
        console.error(e)
      }
    }
    if(!mode){
      mode = 'Sync'
    }
  }
  localStorage.setItem('SyncMode',JSON.stringify(mode));
  const wplMode = mode === 'Sync' ? 'WPL_PLAYBACK_MODE_SYNC' : 'WPL_PLAYBACK_MODE_ASYNC';
  const vidPlaybackModeReq ={
    strMode:wplMode,
  }
  player.sendMessage({
    method:'wpl_video_playbackMode',
    timestamp:Date.now(),
    sessionUuid:player.session,
    sequence:uuid().toLowerCase(),
    vidPlaybackModeReq
  });
  syncMode.value = mode;
}

const toggleSyncMode = () =>{
  const newMode = syncMode.value === 'Sync' ? 'Async' : 'Sync';
  setSyncMode(newMode);
}

const handleWindowClick = (data:any) => {
  const windowIndex = data.notifyWinClicked?.strWinIndex;
  if(windowIndex !== undefined){
    currentSelectedWindowIndex.value = parseInt(windowIndex);
    switchTimeline();
    
    const currentWindowInfo = currentWindows.value.get(currentSelectedWindowIndex.value);

    if(syncMode.value === 'Sync'){
      const isGlobal = windowPlaybackStatus.value.get('global') || false;
      const isCurrentPlaying = currentWindowInfo && currentWindowInfo.isPlayback && isGlobal;
      playbackPlaying.value = isCurrentPlaying;
      const savedSpeed = windowPlaybackSpeed.value.get('global');
      if(savedSpeed !== undefined){
        playbackSpeed.value = savedSpeed;
        const index = playbackSpeedOptions.indexOf(savedSpeed);
        if(index !== -1)speedIndex.value = index;
      }else{
        playbackSpeed.value = '1.0';
        speedIndex.value = 2;
      }
      const savedVolume = windowVolume.value.get('global');
      AudioSlider.value = savedVolume !== undefined ? savedVolume : 0
    }else{
      const isPlaying = windowPlaybackStatus.value.get(currentSelectedWindowIndex.value) || false;
      playbackPlaying.value = currentWindowInfo && currentWindowInfo.isPlayback && isPlaying;
      const savedSpeed = windowPlaybackSpeed.value.get(currentSelectedWindowIndex.value);
      if(savedSpeed !== undefined){
        playbackSpeed.value = savedSpeed;
        const index = playbackSpeedOptions.indexOf(savedSpeed);
        if(index !== -1)speedIndex.value = index;
      }else{
        playbackSpeed.value = '1.0';
        speedIndex.value = 2;
      }
      const savedVolume = windowVolume.value.get(currentSelectedWindowIndex.value);
      AudioSlider.value = savedVolume !== undefined ? savedVolume : 0;
    }
    emit('window-click',{
      windowIndex:parseInt(windowIndex),
      originalData:data
    });
  }
}

const switchTimeline = () => {
  if(!timelineInstance.value)return;

  const windowIndex = currentSelectedWindowIndex.value;
  if(windowIndex === null || windowIndex === undefined)return;
  const timelineData = windowTimelineData.value.get(windowIndex) || [];
  const allPlaybackData:any[]=[];
  for(const [idx,winInfo] of currentWindows.value.entries()){
    if(winInfo.isPlayback && windowTimelineData.value.has(idx)){
      const winData = windowTimelineData.value.get(idx);
      if(winData && winData.length > 0){
        allPlaybackData.push(...winData);
      }
    }
  }
  const motionEvents = convertToMotionEvents(timelineData);
  const allMotionEvents = convertToMotionEvents(allPlaybackData);

  timelineInstance.value.updateMotionEvents(motionEvents,allMotionEvents);

  (timelineInstance.value as any).updateTimelineView?.();

  let currentTime = windowCurrentTime.value.get(windowIndex);
  if(!currentTime){
    const range = windowPlaybackRange.value.get(windowIndex);
    currentTime = range ? new Date(range.beginTime) : new Date();
  }
  timelineInstance.value.setCurrentTime(currentTime);

  const windowInfo = getWindowInfo(currentSelectedWindowIndex.value);
  if(windowInfo?.channelName){
    timelineInstance.value.options.name = windowInfo.channelName;
    timelineInstance.value._initEventBarName?.();
  }
}

const convertToMotionEvents = (timelineData:any[]) =>{
  if(!timelineData || !timelineData.length)return [];
  return timelineData.map(item=>{
    let color = '#31B1FE';
    if(item.style && item.style.background){
      if(item.style.background === '#3CC43C'){
        color = '#3CC43C';
      }else if(item.style.background === '#EE1011'){
        color = '#EE1011';
      }else if(item.style.background === '#31B1FE'){
        color = '#31B1FE';
      }
    }
    return {
      strStartTime:item.beginTime,
      strEndTime:item.endTime,
      color:color,
      // type:['H5_STOR_REC_N_SCHED']
    };
  });
}

const searchRecordByTime = async(token:string,startTime:any,endTime:any,storageType:string,windowIndex:number) => {
  const {root,session} = getDeviceInfo();
  let url;

  let startStr = startTime;
  let endStr = endTime;

  if(startTime instanceof Date){
    startStr = formatLocalDateTime(startTime);
  }
  if(endTime instanceof Date){
    endStr = formatLocalDateTime(endTime);
  }

  if(storageType === 'false'){
    url = root + "/uapi/v1/SearchDeviceRecordByTime?token=" + token + "&start=" + encodeURIComponent(startStr) + "&end=" + encodeURIComponent(endStr) + "&session=" + session;
  }else{
    url = root + "/api/v1/SearchStorRecordByTime?type=record&token=" + token + "&start=" + encodeURIComponent(startStr) + "&end=" + encodeURIComponent(endStr) + "&session=" + session;
  }
  try{
    const response = await fetch(url);
    const result = await response.json();
    let timedata1:any[] = [];
      const records = result.data?.record || result.record || [];
      records.forEach((item:any,index:number)=>{
        let bgColor;
        const types = item.type || [];
        if(types.includes('H5_STOR_REC_ALERT')){
          bgColor = '#EE1011';
        }else if(types.includes('H5_STOR_REC_N_MANUAL')){
          bgColor = '#31B1FE';
        }else if(types.includes('H5_STOR_REC_N_SCHED')){
          bgColor = '#31B1FE';
        }
        const timeitem = {
          beginTime:new Date(item.strStartTime),
          endTime:new Date(item.strEndTime),
          style:{background:bgColor}
        };
        timedata1.push(timeitem);
      });
    windowTimelineData.value.set(windowIndex,timedata1);

    const allRequests = [];
    const allRecordData = [...timedata1];

    for(const [idx,winInfo] of currentWindows.value.entries()){
      if(idx === windowIndex)continue;
      if(!winInfo.isPlayback)continue;
      const allToken = winInfo.token;
      if(!allToken)continue;

      let allURL;
      if(storageType === 'false'){
        allURL = root +"/uapi/v1/SearchDeviceRecordByTime?token=" + allToken + "&start=" + encodeURIComponent(startStr) + "&end=" + encodeURIComponent(endStr) + "&session=" + session;
      }else{
        allURL = root +"/api/v1/SearchStorRecordByTime?type=record&token=" +  allToken + "&start=" + encodeURIComponent(startStr) + "&end=" + encodeURIComponent(endStr) + "&session=" + session;
      }

      const request = fetch(allURL).then(res=>res.json()).then(otherResult=>{
          const records = otherResult.data?.record || otherResult.record || [];
          records.forEach((item:any)=>{
            let bgColor;
            const types = item.type || [];
            if(types.includes('H5_STOR_REC_ALERT')){
              bgColor = '#EE1011';
            }else if(types.includes('H5_STOR_REC_N_MANUAL')){
              bgColor = '#31B1FE';
            }else if(types.includes('H5_STOR_REC_N_SCHED')){
              bgColor = '#31B1FE';
            }
            const timeitem = {
              beginTime:new Date(item.strStartTime),
              endTime:new Date(item.strEndTime),
              style:{background:bgColor}
            };
            allRecordData.push(timeitem);
          });
      }).catch(err=>console.warn(err));
      allRequests.push(request);
    }
    await Promise.allSettled(allRequests);
    windowTimelineData.value.set('all_'+windowIndex,allRecordData);
    if(currentSelectedWindowIndex.value === windowIndex && timelineInstance.value){
      const savedZoom = (timelineInstance.value as any).zoom;
      const savedBaseMinutes = (timelineInstance.value as any).options?.baseMinutes;
      const motionEvents = convertToMotionEvents(timedata1);
      const allMotionEvents = convertToMotionEvents(allRecordData);

      timelineInstance.value.updateMotionEvents(motionEvents,allMotionEvents);
      if(savedBaseMinutes){
        timelineInstance.value.options.baseMinutes = savedBaseMinutes;
      }
      if(savedZoom){
        (timelineInstance.value as any).zoom = savedZoom;
      }
      (timelineInstance.value as any).updateTimelineView?.();

      const targetTime = startTime instanceof Date ? startTime : new Date(startTime);
      timelineInstance.value.setCurrentTime(targetTime);
      windowCurrentTime.value.set(windowIndex,targetTime);
    }
  }catch(error){
    console.error(error);
    windowTimelineData.value.set(windowIndex,[]);
  }
}

const formatLocalDateTime = (date:Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth()+1).padStart(2,'0');
  const day = String(date.getDate()).padStart(2,'0');
  const hours = String(date.getHours()).padStart(2,'0');
  const minutes = String(date.getMinutes()).padStart(2,'0');
  const seconds = String(date.getSeconds()).padStart(2,'0');
  const offset = -date.getTimezoneOffset();
  const offsetHours = String(Math.floor(Math.abs(offset)/60)).padStart(2,'0');
  const sign = offset >= 0 ? '+' : '-';
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:00`;
}

const reinitTimeline = () => {
  if(!timelineInstance.value){
    initTimeline();
    return;
  }
  const currentTime = (timelineInstance.value as any).currentTime;
  const name = (timelineInstance.value as any).options?.name || '';

  const windowIndex = currentSelectedWindowIndex.value;

  let motionEvents:any[] = [];
  let motionEventsAll:any[] = [];

  if(windowIndex !== null && windowIndex !== undefined){
    const timelineData = windowTimelineData.value.get(windowIndex)  || [];
    motionEvents = convertToMotionEvents(timelineData);

    const allPlaybackData:any[] = [];
    for(const [idx,winInfo] of currentWindows.value.entries()){
      if(winInfo.isPlayback && windowTimelineData.value.has(idx)){
        const winData = windowTimelineData.value.get(idx);
        if(winData && winData.length>0){
          allPlaybackData.push(...winData);
        }
      }
    }
    motionEventsAll = convertToMotionEvents(allPlaybackData);
  }

  if(typeof (timelineInstance.value as any).destroyTimer === 'function'){
    (timelineInstance.value as any).destroyTimer();
  }

  const container = document.getElementById('wpl-timeline');
  if(container){
    container.innerHTML = '';
  }
  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('width','100%');
  svg.setAttribute('height','100%');
  svg.setAttribute('id','timeline-svg');
  if(container){
    container.appendChild(svg);
  }
  let timelineBackgroundColor = '#343434';
  timelineInstance.value = new Timeline('#timeline-svg',{
    backgroundColor:timelineBackgroundColor,
    name:name
  });

  if(motionEvents.length > 0 || motionEventsAll.length > 0){
    timelineInstance.value.updateMotionEvents(motionEvents,motionEventsAll);
  }
  if(currentTime){
    timelineInstance.value.setCurrentTime(currentTime);
  }else if(windowIndex !== null && windowIndex !== undefined){
    const savedTime = windowCurrentTime.value.get(windowIndex);
    if(savedTime){
      timelineInstance.value.setCurrentTime(savedTime);
    }
  }
  timelineInstance.value.addEventListener('change',(e:any)=>{
    if(currentSelectedWindowIndex.value !== null && !isMoveto.value){
      moveto(currentSelectedWindowIndex.value,e.detail,true);
    }
  });
  timelineInstance.value.addEventListener('pause',(e:any)=>{
    pause(currentSelectedWindowIndex.value);
  });
  timelineInstance.value.addEventListener('resume',(e:any)=>{
    if(currentSelectedWindowIndex.value !== null){
      moveto(currentSelectedWindowIndex.value,e.detail,true);
      resume(currentSelectedWindowIndex.value);
    }
  });
}

const updateTimeline = (data:any) => {
  const { strWinIndex,strMessage } = data.notifyVideoCallback || {};
  if(!strMessage)return;
  try{
    const pbMessage = JSON.parse(strMessage);
    if(pbMessage.type === 'H5S_EVENT_PB_TIME' && pbMessage.pbTime){
      const timeStr = pbMessage.pbTime.strTime;
      const windowIndex = parseInt(strWinIndex);
      if(timeStr){
        const winInfo = currentWindows.value.get(windowIndex);
        if(winInfo && winInfo.isPlayback){
          if(currentSelectedWindowIndex.value === windowIndex){
            if(!playbackPlaying.value){
              playbackPlaying.value = true;
            }
          }
          if(syncMode.value === 'Sync'){
            windowPlaybackStatus.value.set('global',true);
          }
          windowPlaybackStatus.value.set(windowIndex,true);
        }
      }
      if(timeStr && !mousemoveFlag.value && !isMoveto.value){
        if(syncMode.value === 'Sync'){
          for(const [idx] of currentWindows.value.entries()){
            windowCurrentTime.value.set(idx,new Date(timeStr));
          }
          if(timelineInstance.value){
            const timeMs = new Date(timeStr).getTime();
            timelineInstance.value.setCurrentTime(new Date(timeMs));
          }
        }else{
          windowCurrentTime.value.set(windowIndex,new Date(timeStr));
          if(currentSelectedWindowIndex.value === windowIndex){
            if(timelineInstance.value){
              const timeMs = new Date(timeStr).getTime();
              timelineInstance.value.setCurrentTime(new Date(timeMs));
            }
          }
        }
        emit('playback-time-update',{
          time:timeStr,
          timeMs:new Date(timeStr).getTime(),
          windowIndex:windowIndex,
        });
      }
    }
  }catch(error){
    console.error(error);
  }
}

//bind wpl-show event
const handleWplShow = () =>{
  setTimeout(()=>{
    syncWindowPosition?.();
    setTimeout(()=>{
      reinitTimeline();
    },200);
  },300);
};


//=========application config=========
const applyLocalConfig = async(config:any) =>{
  const player = window.$wplPlayer;
  if(!player){
    pendingConfig = config;
    return;
  }
  await saveWPLConfigToMain(config);
}

//=========life cricle=========
watch(()=>props.layoutType,(newType) => {switchLayout(newType)});
watch(()=>props.visible,(val)=>{val?show():hide();});
watch(()=>props.enablePlayback,(newVal)=>{
  if(newVal){
    nextTick(()=>{
      const container = document.getElementById('wpl-timeline');
      if(container && container.offsetHeight > 0 && container.offsetWidth > 0){
        initTimeline();
        switchTimeline();
      }else{
        requestAnimationFrame(()=>{
          initTimeline();
          switchTimeline();
        });
      }
    });
  }else{
    if(timelineInstance.value){
      if(typeof (timelineInstance.value as any).destroyTimer === 'function'){
        (timelineInstance.value as any).destroyTimer();
      }
      timelineInstance.value = null;
    }
    const container = document.getElementById('wpl-timeline');
    if(container){
      container.innerHTML = '';
    }
  }
})

onMounted(()=>{
  setupWPLConfigListener();
  init();


  if(localStorage.getItem('isLive') === null){
    localStorage.setItem('isLive',JSON.stringify(true));
  }

  const syncModeFromStorage = localStorage.getItem('SyncMode');
  if(syncModeFromStorage){
    try{
      const parsed = JSON.parse(syncModeFromStorage);
      if(parsed === 'Sync' || parsed === 'Async'){
        syncMode.value = parsed;
        setSyncMode(parsed);
      }
    }catch(e){
      console.error(e);
    }
  }

  if(props.enablePlayback){
    setTimeout(()=>{
      initTimeline();
    },500);
  }

  window.ipcRenderer.on('wpl-show',handleWplShow);

  window.addEventListener('wpl-config-received',((e:CustomEvent)=>{
    const config = e.detail;
  })as EventListener);
});

onBeforeUnmount(()=>{
  if(infoTimer){
    clearInterval(infoTimer);
    infoTimer = null;
  }

  if(timelineInstance.value){
    if(typeof(timelineInstance.value as any).destroyTimer === 'function'){
      (timelineInstance.value as any).destroyTimer();
    }
    timelineInstance.value = null;
  }

  currentWindows.value.clear();
  intercomStatus.value.clear();
  windowPlaybackStatus.value.clear();
  windowCurrentTime.value.clear();
  windowTimelineData.value.clear();
  windowPlaybackRange.value.clear();
  windowPlaybackSpeed.value.clear();
  windowVolume.value.clear();
  const player = window.$wplPlayer;
  if(player?.off){
    player.off('message',boundHandleMessage);;
    if(stopAllEventHandler)player.off('stopAll',stopAllEventHandler);
  }
  window.removeEventListener('wpl-connected',onConnected);
  // window.ipcRenderer.removeListener('wpl-show',handleWplShow);
  destroyWPLPlayer();
});

defineExpose({
  //实时
  play,stopAll,switchLayout,show,hide,fullScreen,clearPlayer,destroy,getWindowInfo,getAllPlayingWindows,isReady,isWindowCreated,currentWindows,windowCount,applyLocalConfig,
  infoData,ptzAction,ptzSpeed,ptzToken,presetList,getPresets,gotoPreset,deletePreset,closePtz,showPtz,syncWindowPosition,
  //回放
  playback,togglePlaybackPause,speedDown,speedUp,switchStorageType,playbackPlaying,playbackSpeed,timelineInstance,DefaultStorage,moveto,
  //时间轴
  switchTimeline,reinitTimeline,searchRecordByTime,convertToMotionEvents,updateTimeline,
  //状态
  currentSelectedWindowIndex,windowPlaybackRange,windowPlaybackSpeed,windowPlaybackStatus,windowCurrentTime,windowTimelineData,currentLayoutType
});
</script>

<style lang="scss" scoped>
.wpl-player-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;

  .wpl-player { width: 100%; flex: 1; }
  .wpl_connection_error { width: 100%; flex: 1; text-align: center; padding-top: 100px; }
  .playback-timeline{
    :deep(.timeline .label text){
      fill:#FFFFFF !important;
      font-size: 12px;
    }
    :deep(.timeline .label rect){
      fill: #0399FE !important;
    }
    :deep(.center-pointer line){
      stroke: #FEEF03 !important;
      stroke-width: 2px !important;
    }
  }

  .playback-controls{
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    .switch_type{
      margin-left: 5px;
      display: flex;
      align-items: center;
      gap: 8px;
      .async_switch{
          display: inline-block;
          height: 24px;
          line-height: 24px;
          //border-radius: 12px;
          display: flex;
          justify-content: space-between;
          text-align: center;
          cursor: pointer;
          color: #0399FE;
          margin-left: 5px;
          .iconfont{
            font-size: 20px !important;
          }
          .is-active{
            color: #0399FE !important;
          }
        }
        .storageType{
          height: 24px;
          line-height: 24px;
          display: flex;
          align-items: center;
          color: #0399FE;
          border-radius: 16px;
          .playbackMode{
            display: flex;
            .iconfont{
              font-size: 22px !important;
            }
            .is-active{
              color: #0399FE;
            }
          }
        }
    }
    
    .control_buttons{
      display: flex;
      align-items: center;
      justify-content: space-around;
      .Speed{
        margin-inline: 5px;
        display: flex;
        align-items: center;
        gap: 8px;
        i{
          font-size: 32px;
          cursor: pointer;
        }
        span{
          font-size: 14px;
          min-width: 36px;
          text-align: center;
        }
      }

      .button_resume{
        font-size: 22px;
        cursor: pointer;
        font-size: 32px;
      }

      .Audio_slider{
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
        width: 100px;
        gap:10px;
        margin-left: 5px;
        .audio_icon i{
          font-size: 22px;
        }
        :deep(.el-slider){
          .el-slider__runway{
            height: 3px;
            .el-slider__bar{
              height: 3px;
              // background: #0399FE;
            }
            .el-slider__button-wrapper{
              height: 34px;
              width: 36px;
              .el-slider__button{
                width: 4px;
                height: 12px;
                border: 1px solid #409EFF;
                border-radius: 0px;
              }
            }
          }
        }
      }
    }
    .caveat_butt{
      display: flex;
      justify-content: flex-end;
      align-items: center;
      .mr-0{
        background-color: #31B1FE;
        width: 15px;
        height: 15px;
        padding: 1px 6px;
        margin: 0 5px 0 5px !important;
        border: none;
        border-radius: 16px;
      }
      .mr-1{
        background-color: #3CC43C;
        width: 15px;
        height: 15px;
        padding: 1px 6px;
        margin: 0 4px 0 5px;
        border: none;
        border-radius: 16px;
      }
      .mr-2{
        background-color: #EE1011;
        width: 15px;
        height: 15px;
        padding: 1px 6px;
        margin: 0 8px 0 5px;
        border: none;
        border-radius: 16px;
      }
    }
  }
}
</style>
