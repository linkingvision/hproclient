<template>
  <div class="text_search" id="text_search">

    <div class="top">

      <div class="top_left">

        <div class="search_type">
          <el-radio-group v-model="objectType" style="display: flex;gap: 30px;border-radius: 6px;">
            <el-radio-button v-for="objType in objectTypes" :key="objType.label" :value="objType.label">
              <span class="iconfont" :class="objType.iconfont"></span>{{ objType.name }}
            </el-radio-button>
          </el-radio-group>

        </div>

        <div class="search_text">

          <div class="text">
            <span>Search</span>
            <el-input v-model="Text" placeholder="Please enter content" @keyup.enter.native="search(Text)"
              style="width: 75%;"></el-input>
          </div>

          <div class="btn">
            <el-button class="search" @click="search()" style="margin-left: 10px;">Start</el-button>
            <el-button class="end_search" @click="endSearch">End</el-button>
          </div>

        </div>

        <div class="search_history">
          <span>Recent search:</span>
          <div v-for="(item, index) in searchHistory" :key="index" class="searchHistoryBtn"
            @click="searchHistoryClick(item)">
            <span>{{ item }}</span>
          </div>
        </div>

      </div>

      <div class="top_right">

        <div class="right_content time_select">

          <div class="time">
            <span class="label">Start Time</span>
            <el-date-picker popper-class="searchTime" :teleported="false" v-model="startTime" type="datetime"
              :clearable="false"></el-date-picker>
          </div>

          <div class="time">
            <span class="label">End Time</span>
            <el-date-picker popper-class="searchTime" :teleported="false" v-model="endTime" type="datetime"
              :clearable="false"></el-date-picker>
          </div>

          <div class="time">
            <el-dropdown @command="dateChange" :teleported="false">
              <template #default>
                <el-button size="small" type="primary" class="time_span">
                  <span>
                    <span class="iconfont icon-shijian1" style="margin-right: 5px;"></span>
                    <span style="position: relative;top: -1px;">{{ timeSelect }}</span>
                  </span>
                </el-button>
              </template>
              <template #dropdown>
                <el-dropdown-menu class="timeSelectDropdown">
                  <el-dropdown-item v-for="item in selectdate" :key="item" :command="item">{{ item }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

        </div>

        <div class="right_content confidence_and_server" style="margin-top: 5px;">

          <div class="confidence">
            <span class="label">Confidence</span>
            <div style="width: 175px;display: flex;gap: 5px;justify-content: space-between;line-height: 32px;">
              <el-slider style="width: 145px;" v-model="confidence" :show-tooltip="false"
                @change="confidenceChange"></el-slider> &nbsp;{{ confidence }}%
            </div>
          </div>

          <div class="server">
            <span style="margin-right: 20px;">Work Server</span>
            <el-select :teleported="false" v-model="NodeId" placeholder="Please Select"
              style="width: 165px;">
              <el-option v-for="item in NodeList" :key="item.nodeName" :label="item.nodeName"
                :value="item.nodeId"></el-option>
            </el-select>
          </div>

        </div>

        <div class="right_content similarity_and_sort">

          <div class="similarity">
            <span class="label">Similarity</span>
            <div style="width: 175px;display: flex;justify-content: space-between;line-height: 37px;">
              <el-slider style="width: 145px;" v-model="similarity" :show-tooltip="false"
                @change="similarityChange"></el-slider> &nbsp;{{ similarity }}%
            </div>
          </div>

          <div class="sort">

            <div class="sortBySimilarity">
              <div class="iconfont icon-icon-xiangsidu sort_change" :class="{ sortColor: sortType === 'confidence' }"
                @click="updateSortType('confidence')" style="flex: 1;"></div>
              <div class="sort_btn">
                <span class="iconfont icon-xiangshang" @click="updateConfidenceSort('asc')"
                  style="height: 48%;font-size: 8px;"
                  :class="{ sortColor: sortType === 'confidence' && confidenceSort === 'asc' }"></span>
                <span class="iconfont icon-xiangxia" @click="updateConfidenceSort('desc')"
                  style="height: 52%;font-size: 8px;"
                  :class="{ sortColor: sortType === 'confidence' && confidenceSort === 'desc' }"></span>
              </div>
            </div>

            <div class="sortDate">
              <div class="iconfont icon-shijian1 sort_change" :class="{ sortColor: sortType === 'date' }"
                @click="updateSortType('date')" style="flex: 1;"></div>
              <div class="sort_btn">
                <span class="iconfont icon-xiangshang" @click="updateDateSort('asc')"
                  style="height: 48%;font-size: 8px;"
                  :class="{ sortColor: sortType === 'date' && dateSort === 'asc' }"></span>
                <span class="iconfont icon-xiangxia" @click="updateDateSort('desc')" style="height: 52%;font-size: 8px;"
                  :class="{ sortColor: sortType === 'date' && dateSort === 'desc' }"></span>
              </div>
            </div>

          </div>


        </div>

      </div>

    </div>

    <div class="progress" v-show="progress"></div>

    <div class="search_center" v-show="total != 0">
      <el-card class="box-card"
        v-for="(imgData, key) in filterImgObj.slice((currentPage - 1) * pageSize, currentPage * pageSize)" :key="key">
        <div class="search_center_item">
          <div class="search_center_item_img">
            <img :src="imgData.img" alt="" @click="clickImg(imgData)" @error="handleImageError"
              style="min-height: 50px; max-height: 140px;min-width: 50px; max-width: 230px;">
          </div>
          <el-progress :percentage="Math.ceil(imgData.confidence * 100)"
            :color="imgData.confidence * 100 > 90 ? '#EA2F06' : imgData.confidence * 100 > 85 ? '#FF7C00' : '#0399FE'"></el-progress>
          <span style="height: 25px;line-height: 25px;">{{ imgData.strThumbnailTime }}</span>
        </div>
      </el-card>
    </div>

    <div class="empty" v-show="total === 0">
      <el-empty description="No Data Available" :image="emptyBlackImg"></el-empty>
    </div>

    <div class="search_bottom">
      <el-pagination size="small" background layout="total,prev,pager,next,sizes,jumper" :teleported="false"
        popper-class="page_select" @size-change="handleSizeChange" @current-change="handleCurrentChange"
        :pager-count="5" :page-sizes="[24, 36, 48]" :page-size="pageSize" :current-page="currentPage" :total="total">
      </el-pagination>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { DeviceChannelState, WorkServer } from '../../api/search';
import emptyBlackImg from '../../assets/image/emptyDarkImg.png'
import { H5jsEvent } from '../../assets/js/h5jsevent';
import { getDeviceInfo } from '../../utils/site';

const objectTypes = reactive([
  {
    label: "H5_SIMILARITY_OBJ_HUMAN",
    name: 'Human',
    iconfont: "icon-person"
  },
  {
    label: "H5_SIMILARITY_OBJ_VEHICLE",
    name: 'Vehicle',
    iconfont: "icon-car"
  },
  {
    label: "H5_SIMILARITY_OBJ_NMV",
    name: 'NMV',
    iconfont: "icon-bicycle"
  },
  {
    label: "H5_SIMILARITY_OBJ_ANIMAL",
    name: 'Animal',
    iconfont: "icon-dongwu"
  },
  {
    label: "H5_SIMILARITY_OBJ_OBJECT",
    name: 'Object',
    iconfont: "icon-wupin"
  },
])

interface Node {
  nodeId: string,
  nodeType: string,
  nodeName: string,
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

const selectdate = reactive<any>([
  'Today',
  'Yesterday',
  'Last Two Days',
  'Last Three Days',
  'Last Seven Days',
  'Last Fourteen Days',
  'Last Thirty Days',
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

const startTime = ref<number>(new Date().setHours(0, 0, 0, 0));
const endTime = ref<number>(new Date().setHours(23, 59, 59, 999))

const progress = ref(false);

const objectType = ref<string>("H5_SIMILARITY_OBJ_HUMAN");
const timeSelect = ref<string>('');
const Text = ref<string>("");
const confidenceSort = ref<string>("desc");
const dateSort = ref<string>("desc");
const sortType = ref<string>("confidence");
const NodeId = ref<string>("");
const channelName = ref<string>("");

const similarity = ref<number>(70);
const confidence = ref<number>(50);
const currentPage = ref<number>(1);
const total = ref<number>(0);
const pageSize = ref<number>(24);
const count = ref<number>(0);

const tableData = ref<any[]>([]);
const searchHistory = ref<string[]>([]);
const imgObj = ref<any[]>([]);
const filterImgObj = ref<any[]>([]);
const NodeList = ref<Node[]>([]);

const v1 = ref();

const updateDialogBack = (updatedDialogBack: AnaDialog) => {
  dialogBack.value = updatedDialogBack;
}

const search = (data?: any) => {
  const {root,session} = getDeviceInfo();
  const baseUrl = new URL(root);
  if (!data) {
    if (Text.value === "") {
      ElMessage({
        message: 'Please enter content',
        type: "warning",
        duration: 500,
        customClass: "warning-message",
      });
      return;
    }
  }
  if (!data) {
    updateSearchHistory(Text.value);
  }
  imgObj.value = [];
  count.value = 0;
  if (v1.value !== undefined) {
    v1.value.disconnect();
    v1.value = undefined;
    progress.value = false;
  }

  const pbconf = {
    callback: searchPlaybackCB,
  }
  const conf = {
    protocol: baseUrl.protocol,
    host: baseUrl.host,
    rootpath: '/',
    apipath: '/api/v1/h5slinksimilarity',
    nodeid: data ? data.NodeId : NodeId.value,
    callback: searchPlaybackCB,
    userdata: null,
    session: session,
    consolelog: 'false',
    pbconf: pbconf,
  }
  v1.value = new H5jsEvent(conf);
  v1.value.connect();
  progress.value = true;
  function SimilarityTxtSearch() {
    var strLang = "en";
    var j = {} as any;
    j.cmd = "H5_SIMILARITY_TXT_SEARCH";
    j.strBeginTime = new Date(startTime.value).toISOString();
    j.strEndTime = new Date(endTime.value).toISOString();
    j.strTxt = Text.value;
    j.strLang = strLang;
    j.nLimit = confidence.value;
    j.nMinSimilarity = similarity.value;
    j.nObjectType = objectType.value;
    v1.value.send(j);
  }
  function SimilarityImgSearch() {
    var j = {} as any;
    j.cmd = "H5_SIMILARITY_IMG_SEARCH";
    j.strBeginTime = new Date(data.begintime).toISOString();
    j.strEndTime = new Date(data.endtime).toISOString()
    j.strJpg = data.img;
    j.nLimit = confidence.value;
    j.nObjectType = objectType.value;
    v1.value.send(j);
  }
  setTimeout(() => {
    if (v1.value.wsSocket.readyState === 1) {
      if (data) {
        SimilarityImgSearch();
      } else {
        SimilarityTxtSearch();
      }
    }
  }, 500);
}

const endSearch = () => {
  if (v1.value !== undefined) {
    v1.value.disconnect();
    v1.value = undefined;
    progress.value = false;
  }
}

const searchHistoryClick = (item: any) => {
  Text.value = item;
  search();
}

const loadSearchHistory = () => {
  const history = localStorage.getItem('searchHistory');
  if (history) {
    searchHistory.value = JSON.parse(history);
  } else {
    searchHistory.value = [];
  }
}

const updateSearchHistory = (text: any) => {
  const index = searchHistory.value.indexOf(text);
  if (index !== -1) {
    searchHistory.value.splice(index, 1);
  }
  searchHistory.value.unshift(text);
  if (searchHistory.value.length > 7) {
    searchHistory.value.pop();
  }

  localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value));
}

const Node = () => {
  const {root,access_token} = getDeviceInfo();
  WorkServer(root,access_token).then((res: any) => {
    if (res.status === 200) {
      if (res.data.msg === "Success") {
        var item = res.data.result.list;
        for (var i = 0; i < item.length; i++) {
          var nodeList = {
            nodeId: item[i].nodeId,
            nodeType: item[i].nodeType,
            nodeName: item[i].nodeName,
          };
          NodeList.value.push(nodeList);
          NodeId.value = NodeList.value[0].nodeId;
        }
      }
    }
  })
}

const dateChange = (params: any) => {
  const label = params;
  const now = new Date();
  const currentTime = now.getTime();

  const setStartOfDay = (date: Date): number => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  const setEndOfDay = (date: Date): number => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  };

  switch (label) {
    case 'Today':
      startTime.value = setStartOfDay(now);
      endTime.value = setEndOfDay(now);
      break;
    case 'Yesterday':
      const yesterday = new Date(currentTime - 3600 * 1000 * 24);
      startTime.value = setStartOfDay(yesterday);
      endTime.value = setEndOfDay(yesterday);
      break;
    case 'Last Two Days':
      startTime.value = setStartOfDay(new Date(currentTime - 3600 * 1000 * 24));
      endTime.value = setEndOfDay(now);
      break;
    case 'Last Three Days':
      startTime.value = setStartOfDay(new Date(currentTime - 3600 * 1000 * 24 * 2));
      endTime.value = setEndOfDay(now);
      break;
    case 'Last Seven Days':
      startTime.value = setStartOfDay(new Date(currentTime - 3600 * 1000 * 24 * 6));
      endTime.value = setEndOfDay(now);
      break;
    case 'Last Fourteen Days':
      startTime.value = setStartOfDay(new Date(currentTime - 3600 * 1000 * 24 * 13));
      endTime.value = setEndOfDay(now);
      break;
    case 'Last Thirty Days':
      startTime.value = setStartOfDay(new Date(currentTime - 3600 * 1000 * 24 * 29));
      endTime.value = setEndOfDay(now);
      break;
    default:
      break;
  }
}

const sortData = () => {
  filterImgObj.value = imgObj.value.filter(item => { return item.confidence * 100 > similarity.value });
  total.value = filterImgObj.value.length;
  let isAscending = false;
  switch (sortType.value) {
    case "date":
      isAscending = dateSort.value === 'asc';
      filterImgObj.value.sort((a: any, b: any) => {
        const dateA = new Date(a.time || 0).getTime();
        const dateB = new Date(b.time || 0).getTime();
        return isAscending ? dateA - dateB : dateB - dateA;
      })
      break;
    case "confidence":
      isAscending = confidenceSort.value === 'asc';
      filterImgObj.value.sort((a: any, b: any) => {
        const confidenceA = a.confidence || 0;
        const confidenceB = b.confidence || 0;
        return isAscending ? confidenceA - confidenceB : confidenceB - confidenceA;
      })
      break;
    default:
      break;
  }
}

const setLocalStorage = (type: string, data: number | string) => {
  let textSearch: string = localStorage.getItem('TextSearch') || '';
  let textSearchData = JSON.parse(textSearch) || {};
  switch (type) {
    case "confidence":
      textSearchData["confidence"] = data;
      break;
    case "similarity":
      textSearchData["similarity"] = data;
      break;
    case "confindenceSort":
      textSearchData["confidenceSort"] = data;
      break;
    case "dateSort":
      textSearchData["dateSort"] = data;
      break;
    case "sortType":
      textSearchData["sortType"] = data;
      break;
    default:
      break;
  }
  localStorage.setItem('TextSearch', JSON.stringify(textSearchData))
}

const similarityChange = (val: number) => {
  setLocalStorage('similarity', val);
  return val;
}

const confidenceChange = (val: number) => {
  setLocalStorage('confidence', val);
  return val;
}

const updateSortType = (data: string) => {
  sortType.value = data;
  sortData();
  setLocalStorage("sortType", data);
}

const updateConfidenceSort = (data: string) => {
  confidenceSort.value = data;
  sortData();
  setLocalStorage("dateOrder", data);
}

const updateDateSort = (data: string) => {
  dateSort.value = data;
  sortData();
  setLocalStorage("dateSort", data);
}

const clickImg = (data: any) => {
  const {root,session} = getDeviceInfo();
  const currentTime = new Date(data.time);
  const Before = new Date(currentTime.getTime() - 5 * 1000);
  const After = new Date(currentTime.getTime() + 30 * 1000);
  window.ipcRenderer.send('open-playback', {
    trackId: data.trackId || '',
    NodeId: data.NodeId || '',
    time: data.time,
    channelName: channelName.value || '',
    img: data.img || '',
    begintime: Before.toISOString(),
    endtime: After.toISOString(),
    token: data.token || '',
    cls: data.cls || '',
    type: 'TextSearch',
    root:root,
    session:session,
  })
}

const handleImageError = (event: any) => {
  const img = event.target;
  if (img.dataset.errorHandled) return;
  img.dataset.errorHandled = 'true';

  const retryCount = parseInt(img.dataset.retryCount || '0');
  if (retryCount >= 3) {
    showFallbackImage(img);
    return;
  }

  img.dataset.retryCount = (retryCount + 1).toString();

  setTimeout(() => {
    const originalSrc = img.src;
    img.src = '';
    img.src = originalSrc;
  }, 1000);
}

const showFallbackImage = (img: any) => {
  console.log(img);
}

const handleSizeChange = (val: number) => {
  currentPage.value = 1;
  pageSize.value = val;
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
}

const DeviceChannelName = async (data: any) => {
  const {root,access_token} = getDeviceInfo();
  const obj = data.map((i: any) => ({ token: i.token }));
  const data1 = { obj };
  try {
    const res: any = await DeviceChannelState(root,access_token ,data1);
    if (res.status === 200 && res.data.msg === 'Success') {
      const channelMap = new Map(res.data.result.obj.map((channel: any) => [channel.token, channel.name]));
      data.forEach((item: any) => {
        if (channelMap.has(item.token)) {
          item.channelName = channelMap.get(item.token);
          channelName.value = item.channelName;
        }
      });
    }
  } catch (error) {
    console.error("Error fetching channel names:", error);
  }
}

const searchPlaybackCB = async (event: any) => {
  const {root,session} = getDeviceInfo();
  count.value = 0;
  let msg = JSON.parse(event);
  if (msg.code === 0) {
    await DeviceChannelName(msg.result);
    for (let i = 0; i < msg.result.length; i++) {
      const item = msg.result[i];
      const time = item.time.replace("T", " ").replace(/\+.*/, "");
      item.time = time;
      let newMsg = JSON.parse(JSON.stringify(item));
      newMsg.class = "search_center_title";
      newMsg.token = item.token;
      newMsg.channelName = item.channelName;
      newMsg.img = `${root}${item.url}&nodeid=${v1.value._conf.nodeid}&session=${session}`;
      newMsg.strThumbnailTime = item.time;
      newMsg.strToken = item.token;
      newMsg.NodeId = v1.value._conf.nodeid;
      newMsg.session = session;
      newMsg.root = root;
      imgObj.value.push(newMsg);
    }
  }
  filterImgObj.value = [...imgObj.value];
  total.value = filterImgObj.value.length;
  sortObj();
  endSearch();
}

const sortObj = () => {
  filterImgObj.value = imgObj.value.filter((item: any) => {
    return item.confidence * 100 > similarity.value;
  })
  total.value = filterImgObj.value.length;
  let isAscending: boolean;
  switch (sortType.value) {
    case 'date':
      isAscending = dateSort.value === 'asc';
      filterImgObj.value.sort((a: any, b: any) => {
        const dateA = new Date(a.time || 0).getTime();
        const dateB = new Date(b.time || 0).getTime();
        return isAscending ? dateA - dateB : dateB - dateA;
      })
      break;
    case 'confidence':
      isAscending = dateSort.value === 'asc';
      filterImgObj.value.sort((a: any, b: any) => {
        const confidenceA = a.confidence || 0;
        const confidenceB = b.confidence || 0;
        return isAscending ? confidenceA - confidenceB : confidenceB - confidenceA;
      })
      break;
    default:
      break;
  }
}

const handleFindSimilar = (event: any, params: any) => {
  search(params);
}

//============lifecycle============
onMounted(() => {
  window.ipcRenderer.on('find-similar-data', handleFindSimilar)
  timeSelect.value = selectdate[0];
  loadSearchHistory();
  const textSearch = localStorage.getItem('TextSearch');
  if (textSearch) {
    let data = JSON.parse(textSearch);
    confidence.value = data?.confidence || 50;
    similarity.value = data?.similarity || 70;
    confidenceSort.value = data?.confidenceSort || 'desc';
    dateSort.value = data?.dateSort || 'desc';
    sortType.value = data?.orderType || 'confidence';
  }

  Node();

})

onBeforeUnmount(() => {
  window.ipcRenderer.off('find-similar-data', handleFindSimilar);
  endSearch();
})
</script>

<style scoped lang="scss">
.text_search {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .top {
    margin: 4px;
    padding: 13px 13px 0 13px;
    display: flex;
    justify-content: space-between;
    min-width: 0;

    .top_left {
      width: 50%;
      display: flex;
      flex-direction: column;

      .search_type {
        width: 80%;
        margin-bottom: 10px;
      }

      .search_text {
        width: 100%;
        display: flex;

        .text {
          display: flex;
          align-items: center;
          width: 70%;

          span {
            width: 15%;
            font-size: 14px;
          }
        }

        .btn {
          .search {
            background: #177ddc;
            border-radius: 2px;
            color: #FFFFFF;
            border: none;
          }

          .end_search {
            background: transparent;
            border: 1px solid #177ddc;
            color: #177ddc;
            box-sizing: border-box;
          }
        }
      }

      .search_history {
        margin-top: 14px;
        width: 100%;
        display: flex;

        .searchHistoryBtn {
          display: flex;
          max-width: 100px;
          height: 24px;
          border-radius: 16px;
          text-align: center;
          line-height: 24px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0 6px;
          padding: 0 10px;
        }

        span {
          font-size: 14px;
          width: 12%;
          line-height: 24px;
        }
      }
    }

    .top_right {
      width: 50%;
      display: flex;
      flex-direction: column;

      .right_content {
        display: flex;
        justify-content: space-between;
        font-size: 14px;

        .label {
          padding: 0 15px;
          width: 120px;
        }

        .time {
          display: flex;
          align-items: center;

          :deep(.el-input__wrapper) {
            background-color: transparent;
          }

          :deep(.el-dropdown-menu){
            background-color: transparent;
          }
        }

        .confidence {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          height: 50px;

          span {}
        }

        .server {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .similarity {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .sort {
          display: flex;
          justify-content: space-around;
          align-items: center;
          gap: 15px;

          .sortBySimilarity,
          .sortDate {
            display: flex;
            height: 32px;
            line-height: 32px;
            align-items: center;
            padding-inline: 10px;
            background: #0399FE;
            color: rgba(255, 255, 255, 0.4);
            border-radius: 4px;
            gap: 10px;

            .sort_change {
              width: 28px;
              border-right: 1px solid rgba(255, 255, 255, 0.2);
            }

            .sort_btn {
              display: flex;
              flex-direction: column;

            }

            span {
              height: 10px;
              line-height: 10px;
            }

            .sortColor {
              color: #FFFFFF
            }
          }
        }
      }
    }
  }

  .progress {
    width: 100%;
    height: 5px;
    border-radius: 10px;
    overflow: hidden;
    z-index: 10;
  }

  .progress:after {
    content: '';
    display: block;
    background-color: #0399FE;
    width: 30%;
    height: 5px;
    animation: progressAnimation 5s infinite;
    position: relative;
  }

  @keyframes progressAnimation {
    0% {
      left: 0;
    }

    100% {
      left: 100%;
    }
  }

  .search_center {
    height: 80%;
    margin: 4px 3px 0 6px;
    max-width: 99%;
    display: flex;
    overflow: auto;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 10px;
    padding: 15px 0 15px 15px;
    align-content: flex-start;

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

    .box-card {
      width: 16%;
      height: 200px;
      border: none;
      font-size: 14px;

      :deep(.el-card__body) {
        padding: 0 !important;
      }

      .search_center_item {
        text-align: center;
        height: 150px;
        .search_center_item_img{
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }

      .search_center_item_img {
        margin-bottom: 5px;
        line-height: 15px;
        cursor: pointer;
      }
    }

    .virtualDom {
      min-width: 50px;
      object-fit: fill;
      flex-grow: 1;
    }

  }

  .empty {
    height: 80%;
    max-width: 99%;
  }

  .search_bottom {
    margin: 0 12px 0 6px;
    padding-top: 6px;
    height: 46px;
    display: flex;
    justify-content: flex-end;

    :deep(.el-pagination) {
      .el-pager li {
        background-color: transparent !important;

        &:hover {
          background-color: #409EFF !important;
          border: #409EFF solid 1px !important;
        }

        &.is-active {
          color: #409eff !important;
          font-weight: normal;
          border: #409EFF solid 1px !important;
        }
      }

      .btn-prev,
      .btn-next,
      .el-select__wrapper,
      .el-input__wrapper {
        min-height: 0;
        background-color: transparent;
        height: 25px;
      }
    }
  }

}
</style>