<template>
  <div class="ana_pb" id="ana_pb">
    <div class="ana_title">
      <div class="close-btn">
        <i class="iconfont icon-guanbixiaoanniu" @click="closeWindow" style="font-size: 25px;cursor: pointer;"></i>
      </div>
    </div>
    <div class="ana_content">
      <div class="ana_pb_left">
        <div class="start_end_time">
          <span>Start Time:{{ begintime }}</span>
          <span>End Time:{{ endtime }}</span>
        </div>
        <div class="wplPlayer">
          <div v-if="(client.isLinux || client.isWindows)" style="width: 100%;height: 100%;">
            <WPLplayer ref="wplPlayerRef" container-id="wplPlayer" :visible="true" :enable-playback="true"
              :show-controls="false" :show-extral-component="false" @playback-time-update="onPlaybackTimeUpdate"
              @playback-pause="onPlaybcakStateChange" layout-type="WPL_LAYOUT_MODE_1X1"></WPLplayer>
          </div>
          <div v-else-if="client.isMac" style="display: flex;align-items: center;justify-content: center;">
            <Avintercomsplay ref="cellRefs" h5id="h1-1" h5videoid="hvideo1-1" canvasid="canvas1-1"
              :access_token="accessToken" :time="dateValue" :selectedId="selectedCellId" :grid="grid"
              :replayData="replayData" :root="root" :session="session" :MoveTo="false" :MouseMoveFlag="false"
              :zoomHourGrid="12" :offReplayVideo="''" :seekTime="seekTime" :play-command="playCommand"
              :replay-trigger="replayTrigger" :speed-command="speedCommand" :volume-command="volumeCommand"
              :fullscreen-icon="fullscreenIcon" hide-controls @pb-time="onPbTime" @record-list="onRecordList"
              @update-grid-icon="onUpdateGridIcon" @close-token='onCloseToken' @fullscreen="panelFullScreen"
              @update-playing="onUpdatePlaying" @register-handler="onRegisterHandler"
              @unregister-handler="onUnregisterHandler" @update-channel-token="onUpdateChannelToken">
            </Avintercomsplay>
          </div>

        </div>
        <div class="timeline">
          <canvas id="timeline"></canvas>
        </div>
        <div class="vid_tools">
          <div class="caveat_butt">
            <div class="showRecordType" style="display: flex;">
              <div class="video_types" style="font-size: 12px;" v-show="showRecordType">
                <button class="mr-0" type="button"></button>Schedule Record
                <button class="mr-1" type="button"></button>Manual Record
                <button class="mr-2" type="button"></button>Alarm Record
              </div>
              <div>
                <i class="iconfont"
                  :class="showRecordType ? 'icon-xianshi' : 'icon-yincang'"></i><!-- @click="showRecordType = !showRecordType" -->
              </div>
              <div style="width: 187px;" v-show="!showRecordType"></div>
            </div>
          </div>
          <div class="tools">
            <i class="iconfont icon-zuobeisu" @click="backward"></i>
            <div v-if="client.isMac" :class="playbackPlaying ? 'iconfont icon-zantingzhong' : 'iconfont icon-bofangzhong'"
              @click="toggleplaybackPause()" class="button_resume"></div>
            <div v-else :class="playbackPlaying ? 'iconfont icon-bofangzhong' : 'iconfont icon-zantingzhong'"
              @click="toggleplaybackPause()" class="button_resume"></div>
            <i class="iconfont icon-youbeisu" @click="forward"></i>
          </div>
          <div class="calendar" style="width: 200px;display: flex;justify-content: flex-end;cursor: pointer;"
            @click="toggleShowCalendar()">
            <i class="iconfont icon-rili"></i>
            <span style="margin-left: 8px;font-size: 12px;">{{ dateValue ? formatToDateTime(dateValue).split(' ')[0] :
              ''
            }}</span>
          </div>
        </div>
      </div>

      <div class="ana_pb_right">
        <div class="current_time">
          <i class="iconfont icon-shijian1" style="font-size: 18px;"></i>
          <span>{{ currentTime }}</span>
        </div>
        <div class="camera_name">
          <i class="iconfont icon-shexiangjikongxian" style="font-size: 18px;"></i>
          <span>{{ channelName }}</span>
        </div>
        <div class="event_type">
          <span>{{ targetType }}</span>
          <div class="event_image">
            <img v-if="playbackData && (playbackData.type === 'AISearch' || playbackData.type === 'TextSearch')"
              :src="img" alt="" />
            <img v-else :src="'data:image/jpeg;base64,' + img" alt="" />
          </div>
        </div>
        <div class="check_all">
          <el-checkbox v-model="trackIdAll" @change="selectTrack"> Select All</el-checkbox>
        </div>
        <div class="find_same">
          Find Similar
        </div>
        <div class="similar_group"
          v-if="playbackData && (playbackData.type === 'AISearch' || playbackData.type === 'TextSearch')">
          <el-select style="width: 80%;" v-model="timeSelect" placeholder="Please Select" @change="dateChange"
            :teleported="false">
            <el-option v-for="item in selectDate" :key="item.value" :label="item.label"
              :value="{ value: item.value, label: item.label }"></el-option>
          </el-select>
          <span class="iconfont icon-sousuo1" style="margin-left: 10px;cursor: pointer;" @click="findSimilar"></span>
        </div>
        <div class="calendar-wrapper" v-show="showCalendar">
          <div style="width: auto;">
            <el-button-group style="display: flex;width: 100%;justify-content: space-between;" class="date_button">
              <el-button @click="preYearWPL" class="iconfont icon-xiangzuotiao"></el-button>
              <el-button @click="preMonthWPL" class="iconfont icon-shangyibu"></el-button>
              <el-button class="el-calendar-title" @click="today">
                {{ dateValue ? dateValue.getFullYear() : '' }}-{{ dateValue ? dateValue.getMonth() + 1 : '' }}
              </el-button>
              <el-button @click="nextMonthWPL" class="iconfont icon-xiayibu"></el-button>
              <el-button @click="nextYearWPL" class="iconfont icon-xiangyoutiao"></el-button>
            </el-button-group>
            <div class="custom-week-header">
              <span class="week-item">Su</span>
              <span class="week-item">Mo</span>
              <span class="week-item">Tu</span>
              <span class="week-item">We</span>
              <span class="week-item">Th</span>
              <span class="week-item">Fr</span>
              <span class="week-item">Sa</span>
            </div>
            <el-calendar ref="calendar" v-model="dateValue" :key="calendarKey"></el-calendar>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onBeforeUnmount, nextTick, watch, reactive } from 'vue';
import WPLplayer from '../../components/WPLplayer.vue';
import Avintercomsplay from '../view/Avintercomsplay.vue';
import { formatToDateTime } from '../../utils/dateUtil.js';
import { TimeSlider } from '../../assets/js/timeline-canvas.js'
import { useClientConfig } from '../../store/client.js';

const props = defineProps({
  dialogBack: { type: Object, required: true }
})

const client = useClientConfig();
const ES = ref<any>(null)
const wplPlayerRef = ref<InstanceType<typeof WPLplayer> | null>(null);
const playbackData = ref<any>(null);
const begintime = ref('');
const endtime = ref('');
const channelName = ref('');
const img = ref('');
const targetType = ref('');
const trackId = ref('');
const token = ref('');
const time = ref('');
const currentTime = ref('');
const playbackPlaying = ref(false);
const showRecordType = ref(false);
const trackIdAll = ref(false);
const timeSlider = ref<any>(null);
const dateValue = ref(new Date());
const calendarKey = ref(0);
const clickedWindowIndex = ref<number | null>(null);
const wplToken = ref<Record<number, string>>({});
const wplCustomDateArr = ref<number[]>([]);
const isDraggingTimeline = ref(false);
const targetSeekTimeMs = ref<number | null>(null);
const showCalendar = ref(false);
const root = ref('');
const session = ref('');
const timeSelect = ref('')
let nStartTime = new Date().getTime() - 3600 * 1000 * 24;
let nEndTime = new Date().getTime();
const selectDate = reactive([
  {
    value: (new Date().getTime() - 3600 * 1000 * 1),
    label: 'Last Hour'
  },
  {
    value: (new Date().getTime() - 3600 * 1000 * 24),
    label: 'Last Day'
  },
  {
    value: (new Date().getTime() - 3600 * 1000 * 24 * 7),
    label: 'Last Week'
  },
  {
    value: (new Date().getTime() - 3600 * 1000 * 24 * 30),
    label: 'Last Month'
  },
])

//WS2
const grid = ref<any[]>([{ id: '1-1', rowStart: 1, rowEnd: 2, colStart: 1, colEnd: 2, merged: false }]);
const selectedCellId = ref('1-1');
const replayData = ref<any>(null);
const playCommand = ref<any>(null);
const accessToken = ref('');
const seekTime = ref<number | null>(null);
const replayTrigger = ref<any>(null);
const speedCommand = ref<any>(null);
const volumeCommand = ref<any>(null);
const fullscreenIcon = ref('icon-fangda');
const cellRefs = ref<any>(null);
let h5Handler: any = null;



onMounted(async () => {
  if (!ES.value) {
    ES.value = await window.ipcRenderer.invoke('get-storage-data');
  }


  if (!ES.value.windowBuffer) {
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        if (ES.value.windowBuffer) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }
  const data = await window.ipcRenderer.invoke('get-analytics-init-data');
  if (data) {
    playbackData.value = data;
    targetType.value = playbackData.value.cls;
  }
  if (data?.windowBuffer) {
    ES.value.windowBuffer = data.windowBuffer;
    ES.value.windowId = data.windowId;
  }
  timeSelect.value = selectDate[0].label;
  initPlayback(data);
})

const initPlayback = (data: any) => {
  const initTimeStr = data.time;
  const initDate = new Date(initTimeStr);

  const startDate = new Date(initDate.getTime() - 5000);
  const endDate = new Date(initDate.getTime() + 30000);

  begintime.value = formatToDateTime(startDate.toISOString());
  endtime.value = formatToDateTime(endDate.toISOString());
  channelName.value = data.channelName || '';
  img.value = data.img || '';
  targetType.value = playbackData.value.type === 'TextSearch' ? playbackData.value.cls : data.targetType || '';
  trackId.value = data.trackId || '';
  token.value = data.channelToken || data.token || '';
  time.value = data.time || '';
  root.value = data.root || '';
  session.value = data.session || '';

  currentTime.value = formatToDateTime(time.value);

  if (client.isMac) {
    const queryStartTime = new Date(initDate);
    queryStartTime.setDate(queryStartTime.getDate() - 1);
    queryStartTime.setHours(0, 0, 0, 0);
    const queryEndTime = new Date(initDate);
    initTimeline(queryStartTime, initDate);
    if(token.value){
      fetchTimelineData(token.value,queryStartTime,queryEndTime);
      setTimeout(() => refreshWPLRecordCalendar(token.value),300);
    }

    accessToken.value = data.accessToken || '';
    replayData.value = {
      token: token.value,
      vid: 'h1-1',
      channelName: channelName.value,
      streamprofile: 'main',
      begintime: startDate.toISOString(),
      endtime: endDate.toISOString(),
      movetotime: initDate.toISOString(),
    }
    if(token.value){
      setTimeout(() => refreshWPLRecordCalendar(token.value),300);
    }
    return;
  }

  setTimeout(() => {
    if (wplPlayerRef.value && token.value) {
      const now = new Date(time.value);
      const queryStartTime = new Date(now);
      queryStartTime.setDate(queryStartTime.getDate() - 1);
      queryStartTime.setHours(0, 0, 0, 0);

      const queryEndTime = new Date(now);
      queryEndTime.setHours(23, 59, 59, 999);

      initTimeline(queryStartTime, initDate);

      if (token.value) {
        fetchTimelineData(token.value, queryStartTime, queryEndTime);
      }

      if (wplPlayerRef.value) {
        (wplPlayerRef.value as any).DefaultStorage = 'CentralStorage';
      }

      wplPlayerRef.value.playback({
        windowIndex: 0,
        token: token.value,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        streamprofile: 'main',
        channelName: channelName.value,
        moveto: initDate.toISOString(),
      });
    }
  }, 800);

  wplToken.value[0] = token.value;
  clickedWindowIndex.value = 0;
}

const initTimeline = (begintime: Date, currentTime?: Date) => {
  const canvas = document.getElementById('timeline') as HTMLCanvasElement;
  if (!canvas) return;

  if (timeSlider.value) {
    timeSlider.value.clearLine?.();
    timeSlider.value = null;
  }

  const container = canvas.parentElement;
  if (container) {
    canvas.width = container.clientWidth || 600;
    canvas.height = 55;
  }

  const initialTime = currentTime || begintime;

  const options = {
    canvasid: "timeline",
    init_cells: [],
    begintime: begintime.getTime(),
    mousedown: () => { },
    mouseup: (time: number) => {
      if (client.isMac) {
        cellRefs.value?.moveto?.(new Date(time));
        return;
      }
      if (wplPlayerRef.value) {
        const player = wplPlayerRef.value as any;
        const targetTime = new Date(time).toISOString();

        isDraggingTimeline.value = true;

        if (typeof player.moveto === 'function') {
          player.moveto(0, targetTime, true);
        }
        setTimeout(() => {
          isDraggingTimeline.value = false;
        }, 1200);
      }
    },
    mousemove: () => { },
    currentTime: initialTime.getTime()
  };

  timeSlider.value = new TimeSlider(options);
  timeSlider.value.set_time_to_middle(initialTime.getTime());
};

const updateTimeline = (timelineData: any[]) => {
  if (timeSlider.value) {
    timeSlider.value.set_cells(timelineData);
  }
};

const updateTimePosition = (time: number) => {
  if (timeSlider.value) {
    timeSlider.value.set_time_to_middle(time);
  }
};

const fetchTimelineData = async (token: string, startTime: Date, endTime: Date) => {
  let urlBase = root.value;
  const url = `${urlBase}/api/v1/SearchStorRecordByTime?type=record&token=${token}&start=${encodeURIComponent(startTime.toISOString())}&end=${encodeURIComponent(endTime.toISOString())}&session=${session.value}&maxlen=86400`;
  try {
    const response = await fetch(url);
    const result = await response.json();
    const records = result.data?.record || result.record || [];

    const timedata = records.map((item: any) => {
      let bgColor;
      const types = item.type || [];
      if (types.includes('H5_STOR_REC_ALERT')) {
        bgColor = '#EE1011';
      } else if (types.includes('H5_STOR_REC_N_MANUAL')) {
        bgColor = '#31B1FE';
      } else if (types.includes('H5_STOR_REC_N_SCHED')) {
        bgColor = '#31B1FE';
      }
      return {
        beginTime: new Date(item.strStartTime).getTime(),
        endTime: new Date(item.strEndTime).getTime(),
        style: { background: bgColor },
      };
    });
    updateTimeline(timedata);
  } catch (error) {
    console.error(error);
  }
}

const onPlaybackTimeUpdate = (data: any) => {
  const timeStr = data?.time || data?.currentTime;
  const timeMs = data?.timeMs || data?.timestamp;

  if (timeStr) {
    currentTime.value = formatToDateTime(timeStr);
  }

  if (timeMs && !isNaN(timeMs)) {
    if (isDraggingTimeline.value && targetSeekTimeMs.value !== null) {
      const timeDiff = Math.abs(timeMs - targetSeekTimeMs.value);
      if (timeDiff < 3000) {
        isDraggingTimeline.value = false;
        targetSeekTimeMs.value = null;
      } else {
        return;
      }
    }
    updateTimePosition(timeMs);
  }
}

const forward = () => {
  const currentTimeStr = currentTime.value;
  if (!currentTimeStr) return;

  const currentTimeMs = new Date(currentTimeStr).getTime();
  if (isNaN(currentTimeMs)) return;

  const targetTime = new Date(currentTimeMs + 5000);
  if (client.isMac) {
    cellRefs.value?.moveto?.(targetTime);
    return;
  }
  if (!wplPlayerRef.value) return;
  const player = wplPlayerRef.value as any;
  player.moveto?.(0, targetTime.toISOString());
};

const backward = () => {
  const currentTimeStr = currentTime.value;
  if (!currentTimeStr) return;
  const currentTimeMs = new Date(currentTimeStr).getTime();
  if (isNaN(currentTimeMs)) return;
  const targetTime = new Date(currentTimeMs - 5000);

  if (client.isMac) {
    cellRefs.value?.moveto?.(targetTime);
    return;
  }
  if (!wplPlayerRef.value) return;
  const player = wplPlayerRef.value as any;

  player.moveto?.(0, targetTime.toISOString());
}

const onPlaybcakStateChange = (data: any) => {
  if (data && data.status !== undefined) {
    if (data.status === 'started' || data.status === 'resume') {
      playbackPlaying.value = true;
    } else if (data.status === 'paused' || data.status === 'ended') {
      playbackPlaying.value = false;
    }
  }
}

const toggleplaybackPause = () => {
  if (client.isMac) {
    if (playbackPlaying.value) {
      cellRefs.value?.pause?.();
    } else {
      cellRefs.value?.resume?.();
    }
    playbackPlaying.value = !playbackPlaying.value;
    return;
  }
  if (!wplPlayerRef.value) return;
  wplPlayerRef.value.togglePlaybackPause();
  playbackPlaying.value = !playbackPlaying.value;
}

const dateChange = (params: any) => {
  const { value, label } = params;
  switch (label) {
    case 'Last Hour':
      nStartTime = new Date().getTime() - 3600 * 1000 * 1;
      break;
    case 'Last Day':
      nStartTime = new Date().getTime() - 3600 * 1000 * 24;
      break;
    case 'Last Week':
      nStartTime = new Date().getTime() - 3600 * 1000 * 24 * 7;
      break;
    case 'Last Month':
      nStartTime = new Date().getTime() - 3600 * 1000 * 24 * 30;
      break;
    default:
      break;
  }
  nEndTime = new Date().getTime();
}

const selectTrack = () => {

}

const findSimilar = () => {
  const params = {
    NodeId: playbackData.value?.NodeId || '',
    begintime: nStartTime,
    endtime: nEndTime,
    img: img.value,
    text: playbackData.value?.text || '',
  }

  if (playbackData.value.type === 'TextSearch') {
    window.ipcRenderer.send('find-similar', params);
    closeWindow();
  }
}

const closeWindow = () => {
  if (client.isMac) {
    cellRefs.value?.softCloseForLayout?.();
  }
  if (wplPlayerRef.value) {
    wplPlayerRef.value.stopAll();
  }
  window.ipcRenderer.send('close-playback');
}

const preYearWPL = () => {
  if (!dateValue.value) return;
  const newDate = new Date(dateValue.value);
  newDate.setFullYear(newDate.getFullYear() - 1);
  dateValue.value = newDate;
  calendarKey.value++;
}

const preMonthWPL = () => {
  if (!dateValue.value) return;
  const newDate = new Date(dateValue.value);
  newDate.setMonth(newDate.getMonth() - 1);
  dateValue.value = newDate;
  calendarKey.value++;

  if (token.value) {
    setTimeout(() => refreshWPLRecordCalendar(token.value), 200);
  }
}

const today = () => {
  dateValue.value = new Date();
  calendarKey.value++;
}

const nextMonthWPL = () => {
  if (!dateValue.value) return;
  const newDate = new Date(dateValue.value);
  newDate.setMonth(newDate.getMonth() + 1);
  dateValue.value = newDate;
  calendarKey.value++;

  if (token.value) {
    setTimeout(() => refreshWPLRecordCalendar(token.value), 200);
  }
}

const nextYearWPL = () => {
  if (!dateValue.value) return;
  const newDate = new Date(dateValue.value);
  newDate.setFullYear(newDate.getFullYear() + 1);
  dateValue.value = newDate;
  calendarKey.value++;
}

const toggleShowCalendar = () => {
  showCalendar.value = !showCalendar.value;
  if (showCalendar.value && token.value) {
    refreshWPLRecordCalendar(token.value);
  }
}

const refreshWPLRecordCalendar = (token: string) => {
  if (client.isLinux || client.isWindows) {
    if (!token || !wplPlayerRef.value) return;

    const defaultStorage = (wplPlayerRef.value as any)?.DefaultStorage;

    if (defaultStorage !== 'CentralStorage') {
      wplCustomDateArr.value = [];
      calendarKey.value++;
      return;
    }
  }else if(client.isMac){
    if(!token)return;
    const defaultStorage = localStorage.getItem('DefaultStorage') || 'CentralStorage';
    if(defaultStorage !== 'CentralStorage'){
      wplCustomDateArr.value = [];
      calendarKey.value++;
      return;
    }
  }
  const currentYear = dateValue.value.getFullYear();
  const currentMonth = dateValue.value.getMonth() + 1;

  const urlBase = root.value;
  const url = urlBase + "/api/v1/SearchStorRecordCalendar?token=" + token + "&year=" + currentYear + "&month=" + currentMonth + "&session=" + session.value;

  fetch(url).then(response => response.json()).then(result => {
    const recordDays: number[] = [];
    if (result.data?.record || result.record) {
      const records = result.data?.record || result.record;
      records.forEach((key: any) => {
        if (key.bHasRec || key.bHasAnalyticsRec) {
          recordDays.push(key.nDay);
        }
      });
    }
    setTimeout(() => {
      const wrapper = document.querySelector('.calendar-wrapper');
      if (!wrapper) return;

      wrapper.querySelectorAll('.record-dot-mark').forEach(el => el.remove());

      const cells = wrapper.querySelectorAll('.el-calendar-table td');
      cells.forEach(cell => {
        const daySpan = cell.querySelector('.el-calendar-day span') as HTMLElement;
        if (!daySpan) return;

        const dayNum = parseInt(daySpan.innerText);
        if (isNaN(dayNum)) return;

        const isCurrentMonth = !cell.classList.contains('prev') && !cell.classList.contains('next');

        if (isCurrentMonth && recordDays.includes(dayNum)) {
          const dot = document.createElement('span');
          dot.className = 'record-dot-mark';
          dot.style.cssText = `
            position: absolute;
            top: 1px;
            left: 1px;
            width: 0;
            height: 0;
            border-right:14px solid transparent;
						border-top:14px solid #FFFFFF;
            pointer-events: none;
						z-index:2
          `;
          if (getComputedStyle(cell).position === 'static') {
            (cell as HTMLElement).style.position = 'relative';
          }
          cell.appendChild(dot);
        }
      });
    }, 200);
  }).catch(error => {
    console.error(error);
  });
}

const onPbTime = (time: number, h5id: string) => {
  if (h5id !== 'h1-1') return;
  currentTime.value = formatToDateTime(new Date(time).toISOString());
  updateTimePosition(time);
}

const onRecordList = (timedata: any[]) => {
  updateTimeline(timedata)
}

const onUpdateGridIcon = () => { }
const onCloseToken = () => { }

const onUpdatePlaying = (cellId: string, v: boolean) => {
  playbackPlaying.value = v;
}

const onRegisterHandler = (h5id: string, handler: any) => {
  h5Handler = handler;
}

const onUnregisterHandler = () => {
  h5Handler = null;
}

const panelFullScreen = () => { }

const onUpdateChannelToken = () => { }

watch(dateValue, (newVal, oldVal) => {
  if (!newVal) return;
  if (oldVal && newVal.getTime() === oldVal.getTime()) return;
  if (!token.value) return;
  if (client.isMac) {
    const dayStart = new Date(newVal);
    dayStart.setDate(dayStart.getDate() - 1);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(newVal);
    dayEnd.setHours(23, 59, 59, 999);
    replayData.value = {
      token: token.value,
      vid: 'h1-1',
      channelName: channelName.value,
      streamprofile: 'main',
      begintime: dayStart.toISOString(),
      endtime: dayEnd.toISOString(),
      movetotime: dayStart.toISOString(),
    };
    initTimeline(dayStart, dayStart);
    fetchTimelineData(token.value,dayStart,dayEnd);
    refreshWPLRecordCalendar(token.value);
  }
})

onBeforeUnmount(() => {
  if (timeSlider.value) {
    timeSlider.value.clearLine?.();
    timeSlider.value = null;
  }
})
</script>

<style scoped lang="scss">
.ana_pb {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .ana_title {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    flex-shrink: 0;
    border-bottom: 1px solid #000;

    .close-btn {
      padding: 5px;

      &:hover {
        background-color: red;
      }
    }
  }

  .ana_content {
    display: flex;
    padding: 15px;
    gap: 20px;
    flex: 1;

    .ana_pb_left {
      display: flex;
      flex: 3;
      flex-direction: column;
      min-width: 0;

      .start_end_time {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        padding-inline: 4px;
        margin-bottom: 8px;
      }

      .wplPlayer {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .timeline {
        height: 55px;
      }

      .vid_tools {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        padding: 5px 0;
        height: 32px;

        .tools {
          display: flex;
          align-items: center;
          gap: 5px;

          .iconfont {
            font-size: 25px;
            cursor: pointer;
          }

          .button_resume {
            font-size: 25px;
            cursor: pointer;
          }
        }

        .caveat_butt {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          cursor: pointer;

          .video_types {
            margin-right: 5px;

            .mr-0 {
              background-color: #31B1FE;
              width: 12px;
              height: 12px;
              padding: 1px 6px;
              margin: 0 5px 0 8px !important;
              border: none;
              border-radius: 16px;
            }

            .mr-1 {
              background-color: #3CC43C;
              width: 12px;
              height: 12px;
              padding: 1px 6px;
              margin: 0 5px 0 4px;
              border: none;
              border-radius: 16px;
            }

            .mr-2 {
              background-color: #EE1011;
              width: 12px;
              height: 12px;
              padding: 1px 6px;
              margin: 0 5px 0 5px;
              border: none;
              border-radius: 16px;
            }
          }
        }
      }
    }

    .ana_pb_right {
      display: flex;
      flex: 1;
      flex-shrink: 0;
      flex-direction: column;
      padding-top: 10px;

      .current_time,
      .camera_name {
        display: flex;
        display: flex;
        gap: 20px;
        align-items: center;
        font-size: 13px;
        height: 40px;

        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .event_type {
        font-size: 13px;

        .event_image {
          margin-top: 10px;
          display: flex;

          img {
            max-width: 225px;
            max-height: 100px;
            object-fit: contain;
          }
        }
      }

      .check_all {
        padding: 4px 0;
      }

      .find_same {
        padding: 8px 12px;
        font-size: 14px;
      }

      .calendar-wrapper {
        margin-top: auto;
        flex-shrink: 0;
        width: 100%;
        top: auto;
        bottom: 0;
        padding: 4px 6px 2px;
        box-sizing: border-box;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: inherit;

        .date_button {
          display: flex !important;
          width: 100% !important;
          justify-content: space-between !important;
          margin-bottom: 0;

          .el-button {
            padding: 0 4px;
            font-size: 11px;
            height: 22px;
            min-height: 22px;
            border: none;
            background: transparent;

            &.el-calendar-title {
              flex: 1;
              text-align: center;
              font-size: 12px;
              font-weight: 500;
              cursor: pointer;

              &:hover {
                color: #0399FE;
              }
            }

            &:hover {
              color: #0399FE;
            }
          }
        }

        .custom-week-header {
          display: flex;
          justify-content: space-around;
          padding: 1px 0;

          .week-item {
            flex: 1;
            text-align: center;
            font-size: 10px;
            padding: 1px 0;
            opacity: 0.5;
          }
        }

        :deep(.el-calendar) {
          height: auto !important;
          background: transparent !important;

          .el-calendar__header {
            display: none !important;
          }

          .el-calendar__body {
            padding: 0 !important;
          }

          .el-calendar-table {
            width: 100%;
            table-layout: fixed;

            thead {
              display: none !important;
            }

            td {
              position: relative;
              padding: 0 !important;
              text-align: center;
              border: none !important;

              .el-calendar-day {
                height: 0;
                padding-bottom: 100%;
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 11px;
                cursor: pointer;
                // border-radius: 50%;
                transition: all 0.15s ease;

                &:hover {
                  background-color: rgba(3, 153, 254, 0.12);
                }

                span {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  font-size: 10px;
                  line-height: 1;
                }
              }

              &.is-today .el-calendar-day span {
                color: #409EFF;
                font-weight: 600;
              }

              &.is-selected {
                background-color: transparent;

                .el-calendar-day {
                  background-color: #0399FE !important;

                  span {
                    color: #FFFFFF !important;
                  }
                }
              }

              &.custom_date_class .el-calendar-day::after {
                content: '';
                position: absolute;
                bottom: 10%;
                left: 50%;
                transform: translateX(-50%);
                width: 4px;
                height: 4px;
                background-color: #0399FE;
                border-radius: 50%;
                opacity: 0.8;
              }

              &.prev,
              &.next {
                .el-calendar-day span {
                  opacity: 0.3;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style>