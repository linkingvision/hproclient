<template>
  <div class="video_slice" id="video_slice">

    <div class="left">

      <el-input class="left_filter" placeholder="Keywords Filter" v-model="filterText">
        <template #suffix>
          <i class="iconfont icon-sousuo" style="cursor: pointer;" @click="handleIconClick"></i>
        </template>
      </el-input>

      <el-collapse v-model="activeNames">
        <el-collapse-item name="devPartition" class="collapse_devPartition">
          <template #title>
            <div class="liveplay_collapse_title">
              <span>Device Partition</span>
              <span class="iconfont icon-shuaxin" @click.stop="getDevpartitionList"></span>
            </div>
          </template>
          <el-tree :data="dataSource" row-key='uuid' :props="defaultProps" @node-expand="handleNodeExpand"
            @node-collapse="handleNodeCollapse" @node-click="handleNodeClick" empty-text="No Data Available"
            :default-expand-keys="defaultExpandIds" highlight-current>
            <template #default="{ node, data }">
              <span style="width: 100%;">

                <div style="width: 100%;display: flex;justify-content: space-between;">
                  <span class="size_color" draggable="true" :class="{'offline-node':(data.bOnline === false && data.DifferentType === 'devChannel') || (data.online === 0 && data.DifferentType === 'dev')}"
                    style="display:flex;justify-content: flex-start;align-items: center;">

                    <svg v-if="data.iconclass2" :class="[data.dome == true ? 'CameraIcon DomeIcon' : 'CameraIcon',]"
                      aria-hidden="true" width="20" height="20">
                      <use :xlink:href="data.bOnline === true ? '#icon-baishexiangji' : '#icon-shexiangjilixian'"></use>
                    </svg>
                    <span v-else-if="data.dome === true" style="font-size: 16px;transform: scale(1.0);"
                      :class="[data.iconclass + ' ' + data.iconclass1,data.bOnline === true ? 'onlineDev' : 'offlineDev']" :id="'icon' + data.token"></span>
                    <span v-else :style="data.icontype == '' ? 'font-size: 19px' : 'font-size:16px'"
                      :class="data.iconclass + ' ' + data.iconclass1" :id="'icon' + data.token"></span>

                    <span v-if="data.alias" :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;"
                      :title="data.alias">{{ data.alias }}</span>
                    <span v-else :class="data.iconclass4 + ' ' + data.iconclass1" style="padding-left: 4px;"
                      :title="data.label">{{ data.label || data.name }}</span>
                  </span>
                </div>
              </span>
            </template>
          </el-tree>
        </el-collapse-item>
      </el-collapse>

    </div>

    <div class="center">
      <div class="progress" v-show="progress"></div>

      <div class="center_content">
        <div v-for="(value, key) in imgObj" :key="key" class="center_res">
          <div class="res_title_date">{{ key }}</div>
          <div v-for="(item, index) in value" :key="index + '1'" :class="item.class">
            <div class="res_img">

              <el-image v-if="!item.isDate" :src="'data:image/jpeg;base64,' + item.img" lazy
                @load="handleLoadImage($event, index)" style="height: 100px; min-width: 50px;"
                @click="clickImg(item)"></el-image>

              <div class="res_time" v-if="!item.isDate" :ref="'timeElement_' + index">{{ item.shortTime }}</div>

            </div>
          </div>
          <i v-for="item in 30" :key="item + ' 1'"></i>
        </div>
      </div>
      <div class="count">
        Total {{ count }} pieces
      </div>
    </div>

    <div class="right">

      <div class="time">

        <div class="block">
          <div class="label">Start Time</div>
          <el-date-picker popper-class="search_time" v-model="startTime" :teleported="false"
            type="datetime"></el-date-picker>
        </div>

        <div class="block">
          <div class="label">End Time</div>
          <el-date-picker popper-class="search_time" v-model="endTime" :teleported="false"
            type="datetime"></el-date-picker>
        </div>

        <div class="date">
          <div class="label">
            <span>Date</span>
          </div>
          <el-select v-model="timeSelect" placeholder="Please Select" :teleported="false"
            @change="dateChange">
            <el-option v-for="item in selectDate" :key="item.value" :label="item.label"
              :value="{ value: item.value, label: item.label }"></el-option>
          </el-select>
        </div>

      </div>

      <div class="interval">

        <div class="label">Interval Time</div>

        <el-select v-model="value3" :teleported="false" placeholder="Please Select">
          <el-option v-for="item in selectseconds" :key="item.value" :label="item.label" :value="item.value">
          </el-option>
          <div class="customizeseconds">
            <el-input v-model="customize1" style="width: 100px" class="seconds" @blur="customizeSeconds1"
              placeholder="Customization"></el-input>
            <span>Second</span>
          </div>
        </el-select>
      </div>

      <div class="search_btn">
        <el-button class="start" @click="search" style="margin-left: 10px;">Start</el-button>
        <el-button class="end" @click="endSearch">End</el-button>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, } from 'vue'
import dayjs from 'dayjs'
import { GetAccessDevice, GetCascadeHierarchy, GetDeviceChannels, GetDevPartition, GetLogicPartition } from '../../utils/DevicesTree';
import { H5sThumbnail } from '@/assets/js/h5sthumbnail.js'
import { ElMessage } from 'element-plus';
import { GetCasDeviceChannelCount, GetDeviceChannelCount, SearchCentralStorage } from '../../api/search';
import { usePlayStore } from '../../store/play';
import { getDeviceInfo } from '../../utils/site';

interface DeviceObject {
  label: string,
  gbId?: any,
  casPartitionId?: any,
  token?: any,
  CasToken?: string,
  devPartitionId?: any,
}

interface AnaDialog {
  trackId: string,
  speed: string,
  myModal: boolean,
  begintime: string,
  endtime: string,
  time: string,
  channelName: string,
  img: string,
  trackIdAll: boolean,
  type: string,
  NodeId: string,
}

const defaultProps = {
  children: 'children',
  label: 'label',
  token: 'token',
  iconclass: 'iconclass',
}

const playStore = usePlayStore();

const elHS = document.getElementById('#headswitch') as HTMLElement;
const elHS1 = document.getElementById('#headswitch1') as HTMLElement;
const elVC = document.getElementById('#viewclis') as HTMLElement;

const timeElementRefs = ref<Map<number, HTMLElement>>(new Map());

const selectDate = reactive([{
  value: (new Date().getTime() - 3600 * 1000 * 1),
  label: 'Last Hour'
}, {
  value: (new Date().getTime() - 3600 * 1000 * 24),
  label: 'Last Day'
}, {
  value: (new Date().getTime() - 3600 * 1000 * 24 * 7),
  label: 'Last Week'
}, {
  value: (new Date().getTime() - 3600 * 1000 * 24 * 30),
  label: 'Last Month'
}])

const selectseconds = reactive([
  {
    value: (5),
    label: '5 Seconds'
  },
  {
    value: (10),
    label: '10 Seconds'
  },
  {
    value: (30),
    label: '30 Seconds'
  },
  {
    value: (60),
    label: '1 Minute'
  },
  {
    value: (60 * 5),
    label: '5 Minutes'
  },
  {
    value: (60 * 15),
    label: '15 Minutes'
  },
  {
    value: (60 * 30),
    label: '30 Minutes'
  },
  {
    value: (60 * 60),
    label: '1 Minutes'
  },
])

const dialogBack = ref<AnaDialog>({
  trackId: "",
  speed: "1x",
  myModal: false,
  begintime: "",
  endtime: "",
  time: "",
  channelName: "",
  img: "",
  trackIdAll: false,
  type: "TextSearch",
  NodeId: "",
})

const startTime = ref<number>(new Date().getTime() - 3600 * 1000 * 1);
const endTime = ref<number>(new Date().getTime());
const date = ref<Date>(new Date());

const currentPage = ref<number>(1);
const total = ref<number>(0);
const pageSize = ref<number>(4);
const count = ref<number>(0);
const value3 = ref<number>(60 * 5);

const progress = ref(false);

const filterText = ref<string>("");
const channelToken = ref<string>("");
const channelName = ref<string>("");
const streamprofile = ref<string>("");
const timeSelect = ref<string>("");
const customize1 = ref<string>("");
const svgClass = ref<string>("");
const iconclass2 = ref<string>("")


const tableData = ref<any>([]);
const data = ref<any>([]);
const data1 = ref<any>([]);
const defaultExpandIds = ref<any>([]);
const defaultExpandIdsDevices = ref<DeviceObject[]>([])
const dataSource = ref<any>([]);
const activeNames = ref<string[]>(["devPartition"])

const imgObj = ref<any>({});
const currentData = ref<any>({});

const v1 = ref();
const searchOffTimeout = ref();

onMounted(() => {
  getDevpartitionList();
  timeSelect.value = selectDate[0].label;
})

const getDevpartitionList = async () => {
  try {
    const devPartitionRes = await GetDevPartition(
      playStore.PartitionLoadDeviceOnly ? 'USC_DEVICE' : undefined,
      playStore.EnableDevPartitionLazyLoading,
      playStore.EnableDevPartitionShowDeviceNode,
    );
    const addIcons = (nodes: any[]) => {
      nodes.forEach((node: any) => {
        if (node.typeTree === 'devPartition') {
          node.iconfont = node.iconfont || 'icon-shexiangji';
        }
        if (node.children) {
          addIcons(node.children);
        }
      })
    }
    addIcons(devPartitionRes.DevicePartitionData[0].children);

    dataSource.value = devPartitionRes.DevicePartitionData[0].children;

    await defaultExpandedKeys();

    if (playStore.EnableDevPartitionLazyLoading) {
      GetDevChannelCount(devPartitionRes.DevicePartitionData[0]);
    }
  } catch (error) {
    console.error('refresh device partition failed:', error);
    ElMessage({
      showClose: true,
      message: 'Failed to obtain device partition information',
      type: 'warning',
    });
  }
};

const GetDevChannelCount = (data: any) => {
  const {root,access_token} = getDeviceInfo();
  if (data.devPartitionId) {
    GetDeviceChannelCount(root,access_token,data.devPartitionId).then(async (result: any) => {
      if (result.status === 200) {
        if (result.data.msg == "Success") {
          data.online = result.result.online;
          data.AllLength = result.result.total;
          if (data.children?.length > 0) {
            for (const item of data.children) {
              if (item.DifferentType === "PartitionNode" && typeof item.AllLength === "undefined") {
                GetDevChannelCount(item);
              }
            }
          }
        }
      }
    });
  }
};

const removeChildrenIds = (data: any) => {
  if (data.children) {
    data.children.forEach((item: any) => {
      defaultExpandIds.value = defaultExpandIds.value.filter((uuid: any) => uuid !== item.uuid);
      removeChildrenIds(item)
    })
  }
}

const handleNodeCollapse = (data: any) => {
  defaultExpandIds.value = defaultExpandIds.value.filter((i: any) => i !== data.uuid);
  removeChildrenIds(data);
}

const createDeviceObject = (data: any) => {
  if (data.gbId) return { label: 'Device', gbId: data.gbId };
  else if (data.casPartitionId) return { label: 'Device', casPartitionId: data.casPartitionId, token: data.rootToken, CasToken: data.token };
  else if (data.devPartitionId) return { label: 'PartitionNode', devPartitionId: data.devPartitionId };
  else return { label: 'Device', token: data.token };
}

const handleNodeExpand = async (data: any, lastlevel: any) => {
  if (!defaultExpandIds.value.includes(data.uuid)) {
    defaultExpandIds.value.push(data.uuid);
  }
  if (data.children && data.children[0]) {
    if (data.children[0].EmptyItem && data.children[0].EmptyItem == 1) {
      data.children = [];
      if ((data.token || data.devPartitionId) && data.children.length <= 0) {
        const object = createDeviceObject(data);
        if (!defaultExpandIdsDevices.value.some((item: any) =>
          (item.token && item.token == data.token) ||
          (item.devPartitionId && item.devPartitionId == data.devPartitionId) ||
          (item.gbId && data.gbId == item.gbId) ||
          (item.casPartitionId && data.casPartitionId == item.casPartitionId)
        )) defaultExpandIdsDevices.value.push(object);

        const token = data.gbId ? data.gbId : data.rootToken;
        const CasToken = data.gbId ? undefined : data.token;
        await Promise.all([
          data.gbId || data.casPartitionId ? GetCascadeHierarchy(token, CasToken) :
            data.accessDevId ? GetAccessDevice(data.accessDevId) :
              data.devPartitionId ? GetDevPartition(playStore.PartitionLoadDeviceOnly ? 'USC_DEVICE' : undefined,
                playStore.EnableDevPartitionLazyLoading,
                playStore.EnableDevPartitionShowDeviceNode,
                data.devPartitionId) : GetDeviceChannels(data.token, undefined, 'Liveview')
        ]).then(res => {
          if (data.gbId || (data.casPartitionId && res[0]?.CasDevicePartitionStreamProfile?.length > 0)) {            
            updateDeviceData(data, res[0].CasDevicePartitionStreamProfile[0], "CasDevChannel");
            if (lastlevel) {
              GetCasDevChannelCount(data, 'defaultExpandChildren');
            } else {
              GetCasDevChannelCount(data);
            }
          } else if (data.accessDevId && res[0]?.AccessDevicePartition?.length > 0) {
            updateDeviceData(data, res[0].AccessDevicePartition[0]);
          } else if (res[0]?.DevicePartitionStreamProfile?.length > 0) {
            updateDeviceData(data, res[0].DevicePartitionStreamProfile, "devChannel");
          } else if (res[0]?.DevicePartitionData?.length > 0) {
            updateDeviceData(data, res[0].DevicePartitionData, "PartitionNode");
          }
        }).catch(err => {
          console.log(err);
        });
      }
    }
  }
}

const defaultExpandedKeys = async () => {
  const addKeys = async (nodes: any[], level: number) => {
    if (level <= 0) return;
    for (const node of nodes) {
      const expandType = level === 1 ? 'lastlevel' : undefined;
      await handleNodeExpand(node, expandType);
      if (node.children && level > 1) {
        await addKeys(node.children, level - 1);
      }
    }
  }
  await addKeys(dataSource.value, playStore.CascadeLoadingLevel || 1);
}

const updateDeviceData = (data: any, profile: any, type?: string) => {
  if (type == "devChannel") {
    data.online = profile.online;
    data.AllLength = profile.total;
  } else if (type == "CasDevChannel") {
    for (let i = 0; i < profile.children.length; i++) {
      const item = profile.children[i];
    }
  }
  if (type !== "PartitionNode") {
    data.online = profile.online;
    data.offline = profile.offline;
    data.disable = profile.disable;
    data.idle = profile.idle;
    data.AllLength = profile.AllLength;
  } else if (type == "PartitionNode" && playStore.EnableDevPartitionLazyLoading) GetDevChannelCount(data);
  data.children = type === "devChannel" || type === "PartitionNode" ? profile : profile.children || [];
};

const handleIconClick = () => {
  if (filterText.value == "") {
    return;
  }
};

const handleNodeClick = (data: any, e: any) => {
  if (data.DifferentType === 'devChannel' || data.DifferentType === 'CasDevChannel') {
    channelToken.value = data.token;
    streamprofile.value = data.streamprofile;
    channelName.value = data.name.split("-")[0];
  }
}

const GetCasDevChannelCount = (data: any, defaultExpandChildren?: any) => {
  const {root,access_token} = getDeviceInfo();
  if (data.casPartitionId) {
    GetCasDeviceChannelCount(root, access_token ,data.casPartitionId).then(async (result: any) => {
      if (result.code === 200) {
        if (result.status === "Success") {
          data.online = result.data.result.online;
          data.AllLength = result.data.result.total;
          if (defaultExpandChildren && data.children?.length > 0) {
            for (const item of data.children) {
              if (item.DifferentType === "CasDevChildren" && typeof item.AllLength === 'undefined') {
                GetCasDevChannelCount(item);
              }
            }
          }
        }
      }
    })
  } else if (data.gbId) {
    if (defaultExpandChildren && data.children?.length > 0) {
      for (const item of data.children) {
        if (item.DifferentType === "CasDevChildren" && typeof item.AllLength === "undefined") {
          GetCasDevChannelCount(item);
        }
      }
    }
  }
};

const handleLoadImage = (event: any, index: any) => {
  const img = event.target as HTMLImageElement;
  const txt = timeElementRefs.value.get(index);
  if (!img || !txt) return;
  const txtRect = txt.getBoundingClientRect();
  const imgRect = txt.getBoundingClientRect();
  const { width, height } = txtRect;
  const offsetX = txtRect.left - imgRect.left;
  const offsetY = txtRect.top - imgRect.top;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  ctx?.drawImage(img, offsetX, offsetY, width, height, 0, 0, width, height);
  let computedColor: string = 'white';
  try {
    const data = ctx?.getImageData(0, 0, width, height).data;
    if (data) {
      var pixelCount = data.length / 4;
      let [r, g, b] = [0, 0, 0];
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      computedColor = 'rgb(' + Math.round(255 - r / pixelCount) + ',' + Math.round(255 - g / pixelCount) + ',' + Math.round(255 - b / pixelCount) + ')';
    }
  } catch (error) {
    computedColor = 'white';
  }
  txt.style.color = computedColor;
}

const customizeSeconds1 = () => {
  if (Number(customize1.value) === 0) {
    value3.value = 60 * 5;
  } else {
    value3.value = Number(customize1.value);
  }
}

const getDataTime = (strTime: string) => { //时间日期格式
  var date = new Date(strTime);
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');
  var seconds = String(date.getSeconds()).padStart(2, '0');
  const formattedDate = year + '-' + month + '-' + day + 'T' + hours + ':' + minutes + ':' + seconds + "+08:00";
  return formattedDate;
}

const formatWithTimezoneOffset = (date: any) => {
  if (!date) {
    date = new Date();
  }
  // 获取日期的各个组成部分
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const timezoneOffset = date.getTimezoneOffset();
  const absoluteOffset = Math.abs(timezoneOffset);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
  const offsetMinutes = String(absoluteOffset % 60).padStart(2, '0');
  const offsetSign = timezoneOffset <= 0 ? '+' : '-';
  const formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetSign}${offsetHours}:${offsetMinutes}`;
  return formattedDate;
}

const clickImg = (data: any) => {
  window.ipcRenderer.send('open-playback',{
    img:data.img,
    channelName:data.channelName,
    time:data.strTime,
    token:data.strToken,
  })
}

const dateChange = (params: any) => {
  const { value, label } = params;
  switch (label) {
    case 'Last Hour':
      startTime.value = new Date().getTime() - 3600 * 1000 * 1;
      break;
    case 'Last Day':
      startTime.value = new Date().getTime() - 3600 * 1000 * 24;
      break;
    case 'Last Week':
      startTime.value = new Date().getTime() - 3600 * 1000 * 24 * 7;
      break;
    case 'Last Month':
      startTime.value = new Date().getTime() - 3600 * 1000 * 24 * 30;
      break;
    default:
      break;
  }
  endTime.value = new Date().getTime();
}

const headswitch = () => {
  elHS.style.display = 'block';
  elHS1.style.display = 'none';
}

const endSearch = () => {
  if (v1.value !== undefined) {
    v1.value.disconnect();
    v1.value = undefined;
    progress.value = false;
  }
}

const search = () => {
  const {root,session,access_token} = getDeviceInfo()
  if (channelToken.value === "") {
    ElMessage({
      message: 'Please select channel',
      type: 'warning',
      duration: 5000,
      customClass: 'warning-message',
    })
    return;
  }
  imgObj.value = {};
  count.value = 0;
  if (v1.value !== undefined) {
    v1.value.disconnect();
    v1.value = undefined;
    progress.value = false;
  }
  const pbconf = {
    serverpb: 'true',
    callback: searchPlaybackCB,
  }
  const baseUrl = new URL(root);
  const conf = {
    protocol: baseUrl.protocol,
    host: baseUrl.host,
    rootpath: '/',
    token: channelToken.value,
    session: session,
    pbconf: pbconf,
  }
  v1.value = new H5sThumbnail(conf);
  v1.value.connect();
  v1.value.channelName = channelName.value;
  progress.value = true;
  searchOffTimeout.value = setTimeout(endSearch, 60000);

  const beginTime = new Date(startTime.value).getTime();
  const stopTime = new Date(endTime.value).getTime();
  const timeInterval = value3.value * 1000;
  const timeData = [] as any;
  for (let currentTime = Number(beginTime); currentTime <= Number(stopTime); currentTime += timeInterval) {
    timeData.push(currentTime);
  }
  SearchCentralStorage(root,access_token,channelToken.value, encodeURIComponent(dayjs(startTime.value).format('YYYY-MM-DDTHH:mm:ss+08:00')), encodeURIComponent(dayjs(endTime.value).format('YYYY-MM-DDTHH:mm:ss+08:00'))).then((res: any) => {
    const records = res.data.record.map((item: any) => ({
      startTime: new Date(item['strStartTime']).getTime(),
      endTime: new Date(item['strEndTime']).getTime(),
    }));
    const filteredTimeData = timeData.filter((timeStamp: any) =>
      records.some((record: any) => timeStamp >= record.startTime && timeStamp <= record.endTime)
    );

    setTimeout(() => {
      if (v1.value.wsSocket.readyState === 1) {
        filteredTimeData.forEach((time: any) => {
          v1.value.getthumbnail(new Date(time));
        })
      }
    }, 500);

  }).catch(error => {
    console.error(error);
  })
}

const searchPlaybackCB = (event: any, userdata: any) => {
  count.value = 0;
  let msg = JSON.parse(event);
  if (msg.type === 'H5S_EVENT_GOT_THUMBNAIL') {
    const [date, time] = msg.strTime.split('T');
    const shortTime = time.slice(0, 5); // 取前5个字符即"00:00"
    msg.shortTime = shortTime;
    let imgArray = [];
    if (imgObj.value[date]) {
      imgArray = imgObj.value[date]
    }
    let newMsg = JSON.parse(JSON.stringify(msg));
    newMsg.class = "search_center_title";
    newMsg.isDate = false;
    newMsg.token = v1.value._conf.token;
    newMsg.channelName = v1.value.channelName;
    newMsg.img = msg.thumbnail.strJpeg;
    newMsg.strThumbnailTime = msg.thumbnail.strThumbnailTime;
    newMsg.strToken = msg.thumbnail.strToken;
    imgArray.push(newMsg);
    imgObj.value[date] = imgArray
    for (const key in imgObj.value) {
      count.value += imgObj.value[key].length
    }
  }
  if (searchOffTimeout.value) {
    clearTimeout(searchOffTimeout.value);
    searchOffTimeout.value = setTimeout(endSearch, 60000);
  }
}

const headswitch1 = () => {
  elHS1.style.display = 'block';
  elHS.style.display = 'none';
}

const handleSizeChange = (val: number) => {
  currentPage.value = 1;
  pageSize.value = val;
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
}

const filterNode = (value: any, data: any, node: any) => {
  if (!data.label) return false;
  if (!value) return true;
  if (data.label && data.label.indexOf(value) !== -1) return true;
  return checkBelongToChooseNode(value, data, node);
}

const checkBelongToChooseNode = (value: any, data: any, node: any) => {
  const level = node.level;
  if (level === 1) return false;
  let parentData = node.parent;
  let index = 0;
  while (index < level - 1) {
    if (parentData.data.label.indexOf(value) !== -1) return true;
    parentData = parentData.parent;
    index++;
  }
  return false;
}

</script>

<style scoped lang="scss">
.video_slice {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: space-between;

  .left {
    width: 15%;
    min-width: 290px;
    margin: 0;

    .offline-node{
      .iconfont{
        color: #9A9A9A;
      }
      .text{
        color: #9A9A9A;
      }
    }

    .left_filter {
      padding: 15px 8px;

      :deep(.el-input__wrapper) {
        border-radius: 16px;
      }
    }

    .liveplay_collapse_title {
      padding-inline: 10px;
      display: flex;
      justify-content: space-between;
    }

    &::-webkit-scrollbar {
      display: none;
    }

    .el-collapse {
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

  .center {
    width: 69%;
    position: relative;
    margin: 8px 3px 0 6px;
    font-size: 14px;

    .progress {
      width: 100%;
      height: 5px;
      position: absolute;
      border-radius: 10px;
      overflow: hidden;
      top: 0;
      left: 0;
      z-index: 10;
    }

    .progress:after {
      content: '';
      display: block;
      background-color: #0399FE;
      width: 30%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      animation: progressAnimation 5s infinite;
    }

    @keyframes progressAnimation {
      0% {
        left: 0;
      }

      100% {
        left: 100%;
      }
    }

    .center_content {
      width: 100%;
      height: 98%;
      display: flex;
      flex-direction: column;
      overflow: auto;
      padding: 0 5px 0 5px;

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

      .center_res {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-content: flex-start;
        position: relative;

        .res_title_date {
          width: 100%;
        }

        .search_center_title {
          object-fit: fill;
          flex-grow: 1;
          transition: transform 0.2s;

          .res_img {
            width: 100%;
            position: relative;

            img {
              width: auto;
              object-fit: fill;
            }
          }

          .res_time {
            font-size: 11px;
            position: absolute;
            bottom: 5px;
            left: 0;
            right: 0;
            margin: auto;
            width: 30px;
            color: #9c9ea5
          }
        }

        .search_center_title:hover {
          transform: scale(1.2);
          z-index: 100;

          .res_time {
            font-size: 12px;
          }
        }

        i {
          min-width: 50px;
          object-fit: fill;
          flex-grow: 1;
        }

      }

    }

    .count {
      font-size: 14px;
      position: absolute;
      right: 20px;
      bottom: 0;
    }

  }

  .right {
    width: 15.5%;
    height: 100%;
    margin: 2px;
    padding: 13px 15px 0 13px;
    margin: 4px 4px 0 4px;
    position: relative;
    overflow: auto;
    font-size: 14px;

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

    .time,
    .interval {
      padding: 0 0 20px 5px;
      display: flex;
      flex-direction: column;

      .el-select {
        width: 220px;
      }

      .block,
      .date,
      .label {
        padding: 13px 0;
      }

      .customizeseconds {
        padding-left: 20px;

        .seconds {
          width: 20px;
          margin-right: 5px;

          .el-input__inner {
            height: 25px;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      }
    }

    .search_btn {
      position: absolute;
      bottom: 0;
      margin-bottom: 30px;
      display: flex;
      width: 93%;
      flex-direction: row-reverse;
      justify-content: center;

      .start {
        background: #177ddc;
        border-radius: 2px;
        color: #fff;
        border: none;
      }

      .end {
        background: transparent;
        border: 1px solid #177ddc !important;
        color: #177ddc;
        box-sizing: border-box;
      }
    }
  }

  .offline{

  }
}
</style>