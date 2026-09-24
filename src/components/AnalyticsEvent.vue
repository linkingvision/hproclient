<template>
  <div class="analytics_panel" id="analytics_panel">
    <div class="analytics_header">
      <span>Event</span>
    </div>

    <div class="analytics_body" ref="analyticsBody" @scroll="handleScroll">
      <div v-for="(item,index) in displayData" :key="index" class="analytics_card">
        <div class="card_header" :style="getHeaderStyle(item)">
          <span class="channel_name">{{ item.channelName }}</span>
          <span :class="'iconfont ' + shapeIconMap[item.targetType]" class="target-icon"></span>
        </div>
        <div class="card_body">
          <div class="card_image">
            <el-popover placement="bottom-end" trigger="hover" :popover-style="{maxHeight:'300px'}" v-model:visible="popoverVisibleList[index]">
              <img :src="'data:image/jpeg;base64,' + item.img" alt="" style="max-height: 300px;max-width: 400px;"/>
              <template #reference>
                <img :src="'data:image/jpeg;base64,' + item.img" alt=""  @click="handleImageClick(item,index)"/>
              </template>
            </el-popover>
          </div>

          <div class="card_info">
            <div class="info_left">
              <p class="info_label">{{ getEventLabel(item) }}:</p>
              <p class="info_value">{{ getEventValue(item) }}</p>

              <p class="info_label">Time</p>
              <p class="info_value">{{ formatTime(item.time) }}</p>
            </div>

            <div class="info_right">
              <p class="info_label">Confidence:</p>
              <p class="info_value" :style="{color:getConfidenceColor(item.confidence)}">{{ Math.round(item.confidence * 100) }}%</p>

              <p class="info_label">Rule Type:</p>
              <p class="info_value">{{ ruleTypeMap[item.ruleType] || item.ruleType }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading_more">
        <el-icon class="is-loading"><Loading/></el-icon>
        <span>Loading</span>
      </div>
      <div v-else-if="total === 0" class="empty_state">
        No data available
      </div>
    </div>

    <div class="analytics_footer">
      <el-pagination background layout="prev,pager,next" :pager-count = "5" :page-size="pageSize" :current-page="currentPage" :total="total" @current-change="handlePageChange" size="small"></el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref,computed,onMounted,onBeforeUnmount,watch} from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { H5jsEvent } from '../assets/js/h5jsevent';
import { DiscoveredDevice } from '../types/site-info';
import { useSiteInfo } from '../store/site-info';

interface AnalyticsEvent{
  id?:string | number;
  anaName:string;
  channelName:string;
  channelToken:string;
  targetType:string;
  anaEvent:string;
  ruleType:string;
  time:string;
  priority:string;
  confidence:number;
  img:string;
  trackid:number;
  strEntity:string;
  root:string;
  session:string;
}

const siteStore = useSiteInfo();

const getDeviceInfo = () => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return [];
    }
    return devices.filter((site:DiscoveredDevice) => site.login === true);
}

const ruleTypeMap = computed<Record<string,string>>(() => ({
  "USC_ANA_RULE_MIAA":'Moving In An Area',
  "USC_ANA_RULE_CRAL":'Crossing A Line',
  "USC_ANA_RULE_LOIT":'Loitering',
  "USC_ANA_RULE_STVE":'Stopped Vehicle',
  "USC_ANA_RULE_VECT":'Vehicle Counting',
  "USC_ANA_RULE_PECT":'Person Counting',
  "USC_ANA_RULE_PPE":'Helmet Detection',
  "USC_ANA_RULE_PEFA":'Fall Detection',
  "USC_ANA_RULE_FARE":'Face Recognition',
  "USC_ANA_RULE_LPRE":'License Plate Recognition',
  "USC_ANA_RULE_CROD":'Crowd',
  "USC_ANA_RULE_FISM":'Fire Smoke Detection',
  "USC_ANA_RULE_FBLK":'Fire Lane',
  "USC_ANA_RULE_FIGT":'Fight Detection',
}));

const shapeIconMap:Record<string,string> = {
  "person":"icon-person",
  "vehicle":'icon-vehicle',
  'motorcycle':'icon-motorcycle',
  'bicycle':'icon-bicycle',
  'car':'icon-car',
  'truck':'icon-truck',
  'bus':'icon-bus',
  'face':'icon-face',
}

const priorityColorMap:Record<string,string> = {
  "Critical":"#7DDFDF",
  "High":"#D83D3D",
  "Medium":"#F09C37",
  "Low":"#00B75B",
}

const props = defineProps<{
  initialData?:AnalyticsEvent[];
  autoLoad?:boolean;
}>();

const emit = defineEmits<{
  (e:'image-click',data:AnalyticsEvent & {type:string;token:string}):void;
  (e:'update:data',data:AnalyticsEvent[]):void;
}>();

const tableData = ref<AnalyticsEvent[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(7);
const loading = ref(false);
const analyticsBodyRef = ref<HTMLElement|null>(null);
const currentTheme = ref('black');
const popoverVisibleList = ref<boolean[]>([]);
let reconnectTimer : number | null = null;

let anaEventWS:any = null;
let faceList:any[] = [];

const displayData = computed(()=>{
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return tableData.value.slice(start,end);
});

// load histoty analytics event
const getAnaListPage = async () => {
  loading.value = true;
  try {
    const loggedInSites = getDeviceInfo();
    if(loggedInSites.length === 0){
      loading.value = false;
      return;
    }

    let allEvents : AnalyticsEvent[] = [];
    for(const site of loggedInSites){
      const protocol = site.enableHttps ? 'https' : 'http';
      const port = site.enableHttps ? Number(site.httpsPort) : Number(site.httpPort);
      const root = `${protocol}://${site.ipv4Address}:${port}`;
      const session = site.session || '';
      const accessToken = site.access_token ?? '';
      try{
        const url = `${root}/uapi/v1/AnaEvent/List?pageSize=20`;
        const response = await fetch(url,{
          headers:{
            'Authorization':`Bearer ${accessToken}`,
            'Content-Type':'application/json',
          }
        });
        const result = await response.json();
        if (result.code === 0) {
          await getFaceList(root,accessToken);
          const data = result.result || [];
          const events = data.map((item: any) => {
            let strEntity = item.strEntity || '';
            if(item.ruleType === 'USC_ANA_RULE_FARE'){
              const person = faceList.find((p:any)=>p.id === strEntity);
              strEntity = person ? person.personName:'';
            }
            return {
              anaName: item.anaName || item.strAnaName || '',
              channelName: item.channelName || item.strChannelName || '',
              channelToken: item.channelToken || item.strChannelToken || '',
              targetType: item.targetType || item.strTargetType || '',
              anaEvent: item.anaEvent || item.strEvent || '',
              ruleType: item.ruleType || item.strRuleType || '',
              time: item.time || item.strTime || new Date().toISOString(),
              priority: item.priority || item.strPriority || 'Low',
              confidence: item.confidence ?? item.nConfidence ?? 0,
              img: item.img || item.strJpeg || '',
              trackid: item.trackid ?? item.nTrackId ?? 0,
              strEntity: item.strEntity || '',
              root:root,
              session:session,
            }
          });

          allEvents = [...allEvents,...events]
        }
      }catch(error){
        console.error(`get site ${site.ipv4Address} event failed: `,error);
      }
    }
    allEvents.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    tableData.value = allEvents;
    total.value = tableData.value.length;
    emit('update:data',tableData.value);
  } catch (error) {
    console.error('[AnalyticsEvent]:get list failed',error);
  } finally {
    loading.value = false;
  }
};

//get face store list
const getFaceList = async(root:string,accessToken:string):Promise<void> => {
  return new Promise((resolve)=>{
    const url = `${root}/uapi/v1/FaceLibrary/List`;

    fetch(url,{
      headers:{
        'Authorization':`Bearer ${accessToken}`,
       'Content-Type':'application/json',
      }
    })
      .then(res => res.json())
      .then(res=>{
        const result = res.result;
        if(Array.isArray(result) && result.length > 0){
          const promises = result.map((item:any)=>{
            const faceUrl = `${root}/uapi/v1/PersonLibrary/List?faceLibraryId=${item.faceLibraryId}`;
            return fetch(faceUrl,{
              headers:{
                'Authorization':`Bearer ${accessToken}`,
                'Content-Type':'application/json',
              }
            }).then(r=>r.json());
          });
          Promise.all(promises).then(results=>{
            results.forEach(r=>{
              if(r.code === 0 && r.result?.list){
                faceList.push(...r.result.list);
              }
            });
            resolve();
          }).catch(()=>resolve());
        }else{
          resolve();
        }
      }).catch(()=>resolve());
  });
}

//Websocket real-time alarm callback
const anaEventCB = (event:any,root:string,session:string) => {
  try{
    const msg = JSON.parse(event).msg;
    
    if(msg.strRuleType === 'USC_ANA_RULE_VECT' || msg.strRuleType === 'USC_ANA_RULE_PECT'){
      window.dispatchEvent(new CustomEvent('drawSetLinesCount',{
        detail:{uuid:msg.strAnaUUID,bEnter:msg.bEnter,bLeave:msg.bLeave}
      }));
      return;
    }
    window.dispatchEvent(new CustomEvent('setAlertState',{
      detail:{channelToken:msg.strChannelToken}
    }));
    let strEntity = msg.strEntity || '';
    if(msg.strRuleType === 'USC_ANA_RULE_FARE'){
      const person = faceList.find((p:any) => p.id === strEntity);
      strEntity = person?person.personName : '';
    }

    const data:AnalyticsEvent = {
      anaName:msg.strAnaName,
      channelName:msg.strChannelName,
      targetType:msg.strTargetType,
      anaEvent:msg.strEvent,
      ruleType:msg.strRuleType,
      time:msg.strTime,
      priority:msg.strPriority,
      confidence:msg.nConfidence,
      img:msg.strJpeg,
      channelToken:msg.strChannelToken,
      trackid:msg.nTrackId,
      strEntity:msg.strEntity,
      root:root,
      session:session
    };

    if(tableData.value.length >= 70){
      tableData.value.pop();
    }
    tableData.value.unshift(data);
    total.value = tableData.value.length;
    emit('update:data',tableData.value);
  }catch(error){
    console.error('[AnalyticsEvent]Websocket message parsing failed',error);
  }
}

let anaEventWSList:any[] = [];

const setAnaEvent = () =>{
  closeAllAnaEvent();
  const loggedInSites = getDeviceInfo();

  if(loggedInSites.length === 0){
    if(reconnectTimer){
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    reconnectTimer = setTimeout(()=>{
      setAnaEvent();
    },500) as unknown as number;
    return;
  }
  for(const site of loggedInSites){
    const protocol = site.enableHttps ? 'https:' : 'http:'
    const port = site.enableHttps ? Number(site.httpsPort) : Number(site.httpPort);
    const root = `${protocol}//${site.ipv4Address}:${port}`;
    const session = site.session || '';

    if(!session) continue;

    try{
      if (typeof H5jsEvent === 'undefined' || !H5jsEvent) continue;

      const pbconf = {callback:(event:any) => anaEventCB(event,root,session)};
      const [uscProtocol,host] = root.split('://');;

      const conf = {
        protocol:protocol,
        host:host,
        rootpath:'/',
        apipath:'/uapi/v1/ws/anaEvent',
        pbconf:pbconf,
        userdata:null,
        session:session,
        consolelog:'false'
      };

      const ws = new H5jsEvent(conf);
      ws.connect();
      anaEventWSList.push(ws)
    }catch(error){
      console.log(error);
    }
  }
}

const closeAllAnaEvent = () =>{
  for(const ws of anaEventWSList){
    if(ws){
      ws.disconnect();
    }
  }
  anaEventWSList = [];
};

//scroll load more
const handleScroll = () => {

}

const addEvent = (event: AnalyticsEvent) => {
  const exists = tableData.value.some(
    item => item.time === event.time && item.channelToken === event.channelToken
  );
  if (exists) return;

  if (tableData.value.length >= 70) {
    tableData.value.pop();
  }
  tableData.value.unshift(event);
  total.value = tableData.value.length;
  emit('update:data', tableData.value);
};

const addEvents = (events: AnalyticsEvent[]) => {
  const newEvents = events.filter(
    e => !tableData.value.some(
      item => item.time === e.time && item.channelToken === e.channelToken
    )
  );
  if (newEvents.length === 0) return;

  tableData.value = [...newEvents, ...tableData.value].slice(0, 70);
  total.value = tableData.value.length;
  emit('update:data', tableData.value);
};

const clearAll = () => {
  tableData.value = [];
  total.value = 0;
  currentPage.value = 1;
  emit('update:data', []);
};

const getHeaderStyle = (item: AnalyticsEvent) => {
  if (item.ruleType === 'USC_ANA_RULE_FARE' || item.ruleType === 'USC_ANA_RULE_LPRE') {
    const color = getConfidenceColor(item.confidence);
    const bgColor = '#1A1A1A';
    return {
      background: `linear-gradient(270deg, ${color} 0%, ${bgColor} 100%)`
    };
  }
  const color = priorityColorMap[item.priority];
  const bgColor = '#1A1A1A';
  return {
    background: `linear-gradient(270deg, ${color} 0%, ${bgColor} 100%)`
  };
};

const getConfidenceColor = (confidence: number) => {
  const colors = [
    '#6B84EE', // 0-20%
    '#4F99E8', // 20-40%
    '#33BA7F', // 40-60%
    '#FF7C00', // 60-80%
    '#FE5003', // 80-100%
  ];
  const index = Math.min(Math.floor(confidence / 0.2), 4);
  return colors[index] || '#999';
};

const getEventLabel = (item: AnalyticsEvent) => {
  if (item.ruleType === 'USC_ANA_RULE_FARE') return 'name';
  if (item.ruleType === 'USC_ANA_RULE_LPRE') return 'license';
  return 'Event';
};

const getEventValue = (item: AnalyticsEvent) => {
  if (item.ruleType === 'USC_ANA_RULE_FARE' || item.ruleType === 'USC_ANA_RULE_LPRE') {
    return item.strEntity || '--';
  }
  return item.anaEvent || '--';
};

const formatTime = (time: string) => {
  if (!time) return '--';
  return time.replace('T', ' ').replace(/-/g, '/').split('+')[0];
};

const handleImageClick = (item: AnalyticsEvent,index:number) => {
  popoverVisibleList.value[index] = false;
  window.ipcRenderer.send('open-playback', {
    channelName: item.channelName,
    channelToken: item.channelToken,
    targetType: item.targetType,
    img: item.img,
    trackId: item.trackid,
    time: item.time,
    token: item.channelToken,
    root:item.root,
    session:item.session,
  });
  emit('image-click', {
    ...item,
    type: 'Event',
    token: item.channelToken,
  });
};

const handleStorageChange = (event:StorageEvent) => {
  if(event.key === 'themeStore'){
    try{
      const themeData = JSON.parse(event.newValue || '{}');
      currentTheme.value = 'black';
    }catch{
      currentTheme.value = 'black';
    }
  }
}

/** 分页切换 */
const handlePageChange = (page: number) => {
  currentPage.value = page;
  if (analyticsBodyRef.value) {
    analyticsBodyRef.value.scrollTop = 0;
  }
};

onMounted(async()=>{
  if(props.initialData && props.initialData.length > 0){
    tableData.value = props.initialData.slice(0,70);
    total.value = tableData.value.length;
  }else if(props.autoLoad !== false){
    await getAnaListPage();
  }
  setAnaEvent();
  window.addEventListener('storage',handleStorageChange);
});

watch(displayData,(newData)=>{
  popoverVisibleList.value = newData.map(()=>false);
},{immediate:true});

watch(
  ()=>getDeviceInfo(),
  (newSites,oldSites) => {
    if(newSites.length > 0){
      setAnaEvent();
    }
  },{
    deep:true
  }
)

onBeforeUnmount(()=>{
  if(reconnectTimer){
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  closeAllAnaEvent();
  window.removeEventListener('storage',handleStorageChange);
});

defineExpose({
  getAnaListPage,closeAllAnaEvent,tableData,addEvent,addEvents,clearAll,total,
});
</script>

<style scoped lang="scss">
.analytics_panel{
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: inherit;
  overflow: hidden;

  .analytics_header{
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px 8px;
    flex-shrink: 0;
    font-size: 14px;

    .analytics_count{
      font-size: 12px;
    }
    .el-button{
      font-size: 16px;
      padding: 4px 8px;

      &:hover{
        color:#0399FE;
      }
    }
  }

  .analytics_body{
    flex: 1;
    overflow-y: auto;
    padding: 0 6px 4px;

    &::-webkit-scrollbar{
      width: 4px;
    }
    &::-webkit-scrollbar-thumb{
      border-radius: 4px;
      background-color: rgba(128,128,128,0.3);
    }
    &::-webkit-scrollbar-track{
      background: transparent;
    }
  }

  .analytics_card{
    margin-bottom: 8px;
    overflow: hidden;
    background:rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.06);
    transition: border-color 0.2s;

    &:hover{
      border-color:rgba(255,255,255,0.15);
    }

    .card_header{
      height: 32px;
      padding: 0 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
      
      .channel_name{
        flex:1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .target-icon{
        font-size:18px;
        margin-left: 8px;
        color: #FFFFFF;
      }
    }

    .card_body{
      display: flex;
      flex-direction: column;
      padding:8px;

      .card_image{
        width: 100%;
        height: 173px;
        flex-shrink: 0;
        background: #1A1A1A;
        border-radius: 4px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 14px;

        img{

          object-fit: contain;
        }

        .no-image{
          opacity: 0.2;
          font-size: 28px;
        }
      }

      .card_info{
        flex: 1;
        display: flex;
        gap: 12px;
        min-width: 0;
        font-size: 12px;
        align-items: center;

        .info_left,
        .info_right{
          flex: 1;
          min-width: 0;

          .info_label{
            margin-bottom: 1px;
            font-size: 10px;
          }

          .info_value{
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
  .analytics_footer{
    flex-shrink: 0;
    padding: 6px 8px;
    display: flex;
    border-top: 1px solid rgba(255,255,255,0.06);
  }

  .loading_more,
  .empty_state{
    text-align: center;
    padding: 30px 0;
    font-size: 12px;
    opacity: 0.5;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;

    .iconfont{
      font-size: 32px;
      opacity: 0.3;
    }
  }
}
</style>