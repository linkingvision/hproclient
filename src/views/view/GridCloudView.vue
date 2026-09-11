<template>
  <div class="liveview grid-cloud-view" id="grid-cloud-view" style="width: 100%;height: 100%;">
    <div class="liveview_left">
      <div class="left_top">
        <span></span>
        <span class="iconfont icon-liebiao" @click="TreeFold"></span>
      </div>
      <div class="left_content">
        <DeviceTree ref="deviceTreeRef" @drag-start="handleDeviceDragStart"></DeviceTree>
      </div>
    </div>

    <!-- 右侧视频栏 -->
    <div class="liveview_right" id="videoPanel">
      <div style="width: 100%; height: 100%; display: flex; flex-direction: column;">
        <div class="liveview_right_video_hed" id="video_hed" style="position: relative;" @drop="dropTarget($event)"
          @dragover.prevent="dragOver($event)">
          <!-- Grid布局视频单元格 -->
          <div class="malv" :class="informationshow ? '' : 'malv-hide'" style="position: absolute;">
            <div class="malv-close" @click="closeInformation">×</div>
            <div class="malv-left">
              <div class="information_title">Video</div>
              <div class="information_content" v-for="(a, index) in informationVideo" :key="index">
                <div class="information_content_left">{{ a.name }}</div>
                <div class="information_content_right">{{ a.data }}</div>
              </div>
            </div>
            <div class="malv-right">
              <div class="information_title">Audio</div>
              <div class="information_content" v-for="(a, index) in informationAudio" :key="index">
                <div class="information_content_left">{{ a.name }}</div>
                <div class="information_content_right">{{ a.data }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="control_area" style="width: 100%;">
          <div class="timeline-box"
            style="width: 100%; height: 80px; padding: 0; box-sizing: border-box; border: none;">
            <svg id="timeline"></svg>
          </div>
          <div class="control_btns">
            <!-- 左侧 报警状态 -->
            <div class="caveat_butt">
              <div class="recodeType" v-if="showRecodeType" style="padding: 0 10px;display: flex;align-items: center;">
                <button class="mr-0" type="button" />
                Schedule Record
                <button class="mr-1" type="button" />
                Manual Record
                <button class="mr-2" type="button" />
                Alarm Record
              </div>
              <div class="showRecodeType">
                <i class="iconfont" :class="showRecodeType ? 'icon-xianshi' : 'icon-yincang'"
                  @click="showRecodeType = !showRecodeType"></i>
              </div>
            </div>
            <!-- 时间选择器、倍速、暂停、音量 -->
            <div class="control-center">
              <el-date-picker style="width: 130px;" class="fixed_input" popper-class="date_popper" :teleported="false"
                v-model="xzvalue" size="small" @change="input_ch" @focus="isShow($event)" @blur="isClose" type="date"
                placeholder="Please Select" :picker-options="pickerOptions"
                :default-time="new Date(2000, 1, 1, 0, 0, 0)" :append-to-body="false" />
              <el-select v-model="region" size="small" class="ele" :popper-append-to-body="false" :teleported="false"
                popper-class="selectdrop" style="width: 45px;" @change="timeSpeed(region)" placeholder="Please Select"
                @visible-change="timeInput">
                <el-option v-for="item in regiondata" :key="item.value" :label="item.label" :value="item.value" />
              </el-select>
              <button class="resume-btn" @click="resume">
                <i class="iconfont" :class="isPlaying ? 'icon-zantingzhong' : 'icon-bofangzhong'"
                  style="font-size: 32px;line-height: 35px;"></i>
              </button>
              <div id="Audio_slider-bottom" class="Audio_slider-bottom">
                <div style="margin-right: 10px;">
                  <i class="iconfont" :class="(Audioslider == 0) ? 'icon-jingyinguanbi' : 'icon-mn_shengyin_fill'"
                    style="font-size: 22px;"></i>
                </div>
                <el-slider :step="0.1" :show-tooltip="false" :max="1" v-model="Audioslider"
                  style="width: 60%; margin-right: 10px;" />
              </div>
            </div>
            <!-- 右侧 全部关闭、宫格切换、全屏功能 -->
            <div class="gongge-btns"
              style="height: 50px; padding-right: 20px; width: 17%; display: flex; justify-content: flex-end; align-items: center;">
              <el-button v-if="!isLiveview" class="goto-live" @click="gotoLive">
                Go To Live Stream
              </el-button>
              <el-button class="iconfont icon-guanbigongge offAllVideo func_btn" @click="Alloffvideo"></el-button>
              <el-button class="iconfont icon-quanping func_btn" @click="panelFullScreen($event)"></el-button>
            </div>
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
        <i class="iconfont icon-shouqi" @click="closePtz"></i>
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
          <div class="ptz-item corner">
            <div class="zs" @mousedown="PtzAction('upleft')" @mouseup="PtzAction('stop')">
              <i class="iconfont icon-zuoshang"></i>
            </div>
          </div>
          <div class="ptz-item shang" @mousedown="PtzAction('up')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-xiangshang"></i>
          </div>
          <div class="ptz-item corner">
            <div class="ys" @mousedown="PtzAction('upright')" @mouseup="PtzAction('stop')">
              <i class="iconfont icon-youshang"></i>
            </div>
          </div>
          <div class="ptz-item zuo" @mousedown="PtzAction('left')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-xiangzuo"></i>
          </div>
          <div class="ptz-item center"></div>
          <div class="ptz-item you" @mousedown="PtzAction('right')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-xiangyou"></i>
          </div>
          <div class="ptz-item corner">
            <div class="zx" @mousedown="PtzAction('downleft')" @mouseup="PtzAction('stop')">
              <i class="iconfont icon-zuoxia"></i>
            </div>
          </div>
          <div class="ptz-item xia" @mousedown="PtzAction('down')" @mouseup="PtzAction('stop')">
            <i class="iconfont icon-xiangxia"></i>
          </div>
          <div class="ptz-item corner">
            <div class="yx" @mousedown="PtzAction('downright')" @mouseup="PtzAction('stop')">
              <i class="iconfont icon-youxia"></i>
            </div>
          </div>
        </div>
      </div>
      <div class="ptz-slider">
        <span>{{ ptzvalue }}</span>
        <el-slider v-model="ptzvalue" :show-tooltip="false" :max="1" :min="0.1" :step="0.1"></el-slider>
      </div>
      <el-timeline>
        <el-timeline-item placement="top" v-for="Pre in Presetdata" :key="Pre.strName">
          <el-card>
            <div class="preset_bgc">
              <input type="text" class="preset_input" :value="Pre.strName" />
              <button type="button" class="iconfont icon-RectangleCopy1" @click="preset_Jump(Pre.strToken)"></button>
              <button type="button" class="iconfont icon-icon-test1" @click="preset_set(Pre.strToken, $event)"></button>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePlayStore } from '../../store/play'
import uuid from '../../utils/uuid'
import '../../assets/js/adapter.js'
import { H5sPlayerAudBack } from '../../assets/js/h5splayer.js'
import { XboxGamepad } from '../../../src/utils/gamepad'
import DeviceTree from '../../components/DeviceTree.vue'
import { UPlayerSDK, UPlayerList, GridLayoutManager } from '../../assets/js/uplayersdk.esm.js'
import { ManualRecStart, Ptz, PtzControl, SearchRecordedCalendar, ManualRecEnable, View, PresetJump, PresetSet, GetStreamInfo } from '../../api/player'
import { ElMessage } from 'element-plus'
import { useSiteInfo } from '../../store/site-info.js'
import { useStore } from '../../store/index.js'
import { getDeviceInfo } from '../../utils/site'
const { t } = useI18n()
const mainStore = useStore();
const siteStore = useSiteInfo();
const playStore = usePlayStore();

interface InformationItem {
  name: string,
  data: any,
}


const gamepad = ref<any>(null)
const DevicesQuantity = ref(false)
const dataQuantity = reactive({
  online: 0,
  offline: 0,
  idle: 0,
  disable: 0
})
const isSearching = ref(false)
const mouseX = ref(0)
const mouseY = ref(0)
const IsTreeFold = ref(false)
const showRecodeType = ref(false)
const xzvalue = ref(new Date())
const region = ref('1.0')
const regiondata = [
  { value: '16.0', label: '16x' },
  { value: '8.0', label: '8x' },
  { value: '4.0', label: '4x' },
  { value: '2.0', label: '2x' },
  { value: '1.0', label: '1x' },
  { value: '0.5', label: '1/2x' },
  { value: '0.25', label: '1/4x' }
]
const Audioslider = ref(0)
const customDateArr = ref<any[]>([])
const GridManager = ref<InstanceType<typeof GridLayoutManager> | null>(null)
const isDrag = ref(false)
const drag = ref<any>({})
const selectCellId = ref('')
const isPlaying = ref(false)
const isLiveview = ref(true)
const PlayingArr = ref<any[]>([])
const PlayBackArr = ref<any[]>([])
const informationshow = ref(false)
const informationVideo = ref<InformationItem[]>([])
const informationAudio = ref<InformationItem[]>([])
const ptzShow = ref(false)
const ptzToken = ref('')
const ptzvalue = ref(0.5)
const Presetdata = ref<any[]>([])
const mainSDKId = ref('')
const playingViewId = ref('')
const uplayerList = ref<any>(null)
const audioback = ref<any>(null)
const timerRunInfo = ref<any>(null)
const monthChangeHandler = ref<any>(null)

const DevicesQuantityPrompt = ref<any>(null)
const deviceTreeRef = ref<InstanceType<typeof DeviceTree> | null>(null);
const pickerOptions = computed(() => ({
  cellClassName(Date: any) {
    if (customDateArr.value.indexOf(Date.getTime()) !== -1) {
      return 'custom_date_class'
    }
  }
}))

const initGridLayout = () => {
  GridManager.value = new GridLayoutManager('#video_hed', {
    cacheKey: 'grid-cloud-view-layout',
    padding: 20,
    aspectRatio: [16, 9],
    animationDuration: 500,
    createIcons: {
      playModeIcon: true,
      playModeText: 'WS2',
      informationIcon: true,
      shouwhearIcon: true,
      snapshotIcon: true,
      recEnableIcon: true,
      ptzcontrolIcon: true
    }
  })

  GridManager.value.addEventListener('closeCell', closeCellHandler)
  GridManager.value.addEventListener('cellClick', changeMainSDKHandler)
  GridManager.value.addEventListener('recEnableClick', recEnableHandler)
  GridManager.value.addEventListener('Snapshot', SnapshotHandler)
  GridManager.value.addEventListener('Information', InformationHandler)
  GridManager.value.addEventListener('Shoutwheat', ShoutwheatHandler)
  GridManager.value.addEventListener('PtzControlShow', PtzControlShowHandler)
  GridManager.value.addEventListener('layoutLoadedFromCache', LayoutReadyHandler)
}

const closeCellHandler = (event: any) => {
  closePlayContainer(event.detail)
}

const changeMainSDKHandler = (event: any) => {
  changeMainSDK(event.detail)
}

const recEnableHandler = (event: any) => {
  DoManualRecordStart(event.detail.id, event.detail.recEnable)
}

const SnapshotHandler = (event: any) => {
  DoSnapshotWeb(event.detail.id)
}

const InformationHandler = (event: any) => {
  Information(event.detail.id)
}

const ShoutwheatHandler = (event: any) => {
  Shoutwheat(event.detail.id, event.detail.audio)
}

const PtzControlShowHandler = (event: any) => {
  PtzControlShow(event.detail.id)
}

const LayoutReadyHandler = (event: any) => {
  LoadLayoutReady(event.detail)
}

const initUPlayList = () => {
  let timelineBackgroundColor
  if (mainStore.darkMode === 'c-dark-theme') {
    timelineBackgroundColor = '#343434'
  }
  // else if (darkMode.value === 'white') {
  //   timelineBackgroundColor = '#E4E4E4'
  // } else if (darkMode.value === 'blue') {
  //   timelineBackgroundColor = '#1C2850'
  // }
  uplayerList.value = new UPlayerList('#timeline', { timelineBackgroundColor });
  GridManager.value.initialize();
}

const LoadLayoutReady = async (detail: any) => {
  const { root, session } = getDeviceInfo()
  await nextTick();
  const baseUrl = new URL(root);
  const AccessToken = sessionStorage.getItem('Access_token') || '';

  detail.forEach((item: any) => {
    item.forEach((row: any) => {
      if (row && row.camera) {
        const conf = {
          videoid: row.camera.videoid,
          protocol: baseUrl.protocol,
          host: baseUrl.host,
          token: row.camera.token,
          session: session,
          accessToken: AccessToken,
          resourceUUID: row.camera.resourceUUID,
          name: row.camera.name,
          label: row.camera.label,
          liveVideoType: 'WS2',
          recording: row.camera.recording,
          onPlaybackModeChange: (mode: any) => {
            if (mode === 'live') {
              isLiveview.value = true;
              GridManager.value.changePlayModeText('WS2');
            } else {
              isLiveview.value = false;
              GridManager.value.changePlayModeText('WS2');
            }
          },
          onError: (err: any) => {
            console.warn('Play Error =>', err)
          }
        }
        const UPlayer = new UPlayerSDK('G' + conf.videoid, conf);
        uplayerList.value.addPlayer(UPlayer);
        PlayingArr.value.push(UPlayer);
        PlayBackArr.value.push(UPlayer);
        isPlaying.value = true;
        deviceTreeRef.value?.updatePlayingStatus('add', row.camera.token);
      }
    })
    uplayerList.value.playAll();
  })
}

const closePlayContainer = (id: any) => {
  if (!uplayerList.value) return;
  if (PlayingArr.value.length === 0) return;

  const vid = id.slice(1);
  const currentSDK = PlayingArr.value.find((sdk) => sdk.conf.videoid === vid);
  if (currentSDK) {
    deviceTreeRef.value?.updatePlayingStatus('del', currentSDK.conf.token);
    currentSDK.destroy?.();
    PlayingArr.value = PlayingArr.value.filter((sdk) => sdk.conf.videoid !== vid);
    PlayBackArr.value = PlayBackArr.value.filter((sdk) => sdk.conf.videoid !== vid);
    uplayerList.value.removePlayer?.(vid);
    if (playingViewId.value && PlayingArr.value.length === 0) {
      deviceTreeRef.value?.updatePlayingStatus('del', `view_${playingViewId.value}`);
      playingViewId.value = '';
    }
  }
}

const PtzControlShow = (id: any) => {
  const { access_token, root } = getDeviceInfo()
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === vid);
  if (!sdk) return;
  ptzShow.value = true;
  ptzToken.value = sdk.conf.token;
  Presetdata.value = [];

  PtzControl(root, access_token, ptzToken.value).then((result: any) => {
    if (result) {
      for (let i = 0; i < result.data.preset.length; i++) {
        const newItem = {
          strName: result.data.preset[i].strName,
          strToken: result.data.preset[i].strToken
        }
        if (i >= 8) {
          break;
        }
        Presetdata.value.push(newItem);
      }
      console.log(JSON.stringify(Presetdata.value));
    }
  })
}

const PtzAction = (action: any, speed?: any) => {
  const { access_token, root } = getDeviceInfo()
  const speedValue = speed || ptzvalue.value;
  if (!ptzToken.value) return;
  Ptz(root, access_token, ptzToken.value, action, speedValue).then((result) => { });
}

const closePtz = () => {
  ptzShow.value = false;
  ptzToken.value = '';
}

const preset_Jump = (token: any) => {
  const { access_token, root } = getDeviceInfo()
  PresetJump(root, access_token, ptzToken.value, token, ptzvalue.value).then((result) => { });
}

const preset_set = (token: any, event: any) => {
  const { access_token, root } = getDeviceInfo()
  const input_val = event.currentTarget.previousElementSibling.previousElementSibling.value;
  PresetSet(root, access_token, ptzToken.value, input_val, token).then((result) => { });
}

const Information = (id: any) => {
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === vid);
  if (informationshow.value) {
    informationshow.value = false;
    clearInterval(timerRunInfo.value);
    timerRunInfo.value = null;
  } else {
    informationshow.value = true;
    Informationdate(vid, sdk.conf.token);
    timerRunInfo.value = setInterval(() => {
      Informationdate(vid, sdk.conf.token);
    }, 8000)
  }
}

const Informationdate = (id: any, token: any) => {
  const { access_token, root } = getDeviceInfo()
  GetStreamInfo(root, access_token, token).then((item: any) => {
    if (item) {
      informationAudio.value = [
        { name: 'Codec', data: item.data.strAudioType },
        { name: 'Sample Rate', data: item.data.nAudioSampleRate },
        { name: 'Sample Bit', data: item.data.nAudioSampleBit },
        { name: 'Channels', data: item.data.nAudioChannels },
        { name: 'Bitrate', data: (item.data.nAudioBitrate / 1024).toFixed(1) + 'kpbs' }
      ],
        informationVideo.value = [
          { name: 'Codec', data: item.data.strVideoType },
          { name: 'Width', data: item.data.nVideoWidth },
          { name: 'Height', data: item.data.nVideoHeight },
          { name: 'FPS', data: item.data.nVideoFPS },
          { name: 'Bitrate', data: (item.data.nVideoBitrate / 1024).toFixed(1) + 'kpbs' }
        ]
    }
  })
}

const closeInformation = () => {
  informationshow.value = false;
  if (timerRunInfo.value) {
    clearInterval(timerRunInfo.value);
    timerRunInfo.value = null;
  }
}

const Shoutwheat = (id: any, audio: any) => {
  const { session, root } = getDeviceInfo()
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === vid);
  if (!sdk) return;
  const urlPart = new URL(root);
  const protocol = urlPart.protocol;
  const host = urlPart.host
  const conf = {
    protocol: protocol,
    host: host,
    rootpath: '/',
    token: sdk.conf.token,
    session: session
  }
  if (audio) {
    if (audioback.value) {
      audioback.value.disconnect();
      delete audioback.value;
      audioback.value = null;
    }
  } else {
    if (audioback.value) {
      audioback.value.disconnect();
      delete audioback.value;
      audioback.value = null;
    }
    audioback.value = new H5sPlayerAudBack(conf);
    audioback.value.connect();
  }
  GridManager.value.changeAudio(id, !audio);
}

const DoSnapshotWeb = (id: any) => {
  const vid = id.slice(1);
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === vid);
  if (!sdk) return;

  const date = new Date();
  const fileName = `${sdk.conf.token}_${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
  let video: any;
  if (isLiveview.value) {
    video = document.getElementById(sdk.conf.videoid);
  } else {
    video = document.querySelector(`#playback${vid} video[pos="0"]`);
  }

  if (video) video.crossOrigin = 'anonymous';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imgURL = canvas.toDataURL('image/png');

  const dlLink = document.createElement('a');
  dlLink.download = fileName;
  dlLink.href = imgURL;
  document.body.appendChild(dlLink);
  dlLink.click();
  document.body.removeChild(dlLink);
}

const changeMainSDK = (id: any) => {
  const vid = id.slice(1);
  if (!isLiveview.value && mainSDKId.value === id) {
    const playSDK = PlayingArr.value.find((item) => item.conf.videoid === vid);
    if (playSDK) {
      const playbackSDK = PlayBackArr.value.find((item) => item.conf.videoid === vid);
      const target = document.getElementById(id);
      if (playbackSDK && target) {
        if (PlayBackArr.value.length > 1) {
          uplayerList.value.getOutPlayer(vid);
          PlayBackArr.value = PlayBackArr.value.filter((item) => item.conf.videoid !== vid);
          target.classList.remove('playback_check_border');
          target.classList.remove('blue_dashed');
          target.classList.add('red_border');
        }
      } else {
        uplayerList.value.addPlayer(playSDK);
        PlayBackArr.value.push(playSDK);
        target?.classList.remove('red_border');
        target?.classList.add('playback_check_border');
      }
    }
  } else {
    if (uplayerList.value && uplayerList.value.UPlayerSDKList.length > 0) {
      uplayerList.value.changeMainSDK(vid);
    }
  }

  selectCellId.value = vid;
  mainSDKId.value = id;

  if (isLiveview.value) {
    document.querySelectorAll('.grid_cell.red_border').forEach((el) => el.classList.remove('red_border'));
    const target = document.getElementById(id);
    if (target) target.classList.add('red_border');
  } else {
    document.querySelectorAll('.grid_cell.red_border').forEach((el) => el.classList.remove('red_border'));
    document.querySelectorAll('.grid_cell.playback_check_border').forEach((el) => el.classList.remove('playback_check_border'));
    const item = PlayBackArr.value.find((item) => item.conf.videoid === vid);
    const target = document.getElementById(id);
    if (target) {
      if (item) {
        target.classList.add('blue_dashed');
        target.classList.add('playback_check_border');
      } else {
        target.classList.add('red_border');
      }
    }
  }
}

const DoManualRecordStart = (id: any, recEnable: any) => {
  const { access_token, root } = getDeviceInfo()
  const vid = id.slice(1);
  const manualRecEnable = !recEnable;
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === vid);
  if (!sdk) return;
  const data = {
    devUUID: sdk.conf.resourceUUID,
    setting: { manualRecEnable }
  }
  ManualRecStart(root, access_token).then((result: any) => {
    if (result.data.code === 0) {
      if (result.data.msg === 'Success') {
        const message = manualRecEnable
          ? 'Start Recording'
          : 'Stop Recording';
        ElMessage({
          message,
          type: 'success',
          duration: 5000,
          customClass: 'success-message'
        });
        GridManager.value.changeRecEnable(id, manualRecEnable);
      }
    }
  })
}

const input_ch = () => {
  if (!uplayerList.value) return;
  uplayerList.value.setAllPosition(xzvalue.value.getTime()).then(() => {
    uplayerList.value.playAll(xzvalue.value.getTime());
  })
}

const isShow = async (e: any) => {
  await nextTick();
  monthChangeHandler.value = () => {
    monthChange();
  }
  document.querySelector('.el-month-table')?.addEventListener('click', monthChangeHandler.value);
  document
    .querySelectorAll("[aria-label='下个月'],[aria-label='上个月'],[aria-label='后一年'],[aria-label='前一年']")
    .forEach((item) => item.addEventListener('click', monthChangeHandler.value))

  customDateArr.value = [];
  const year = xzvalue.value.getFullYear();
  const month = xzvalue.value.getMonth() + 1;

  if (!selectCellId.value) return;
  const sdk = PlayingArr.value.find((item) => item.conf.videoid === selectCellId.value);
  if (sdk && sdk.conf.token) {
    SearchRecordCalendar(sdk.conf.token, year, month);
  }
}

const isClose = () => {
  document.querySelector('.el-month-table')?.removeEventListener('click', monthChangeHandler.value);
  document
    .querySelectorAll("[aria-label='下个月'],[aria-label='上个月'],[aria-label='后一年'],[aria-label='前一年']")
    .forEach((item) => item.removeEventListener('click', monthChangeHandler.value))
}

const monthChange = async () => {
  let year;
  let month;
  year = document.querySelectorAll('.el-date-picker__header-label')[0].innerHTML.slice(0, 4);
  month = document.querySelectorAll('.el-date-picker__header-label')[1].innerHTML.slice(0, -1);
  year = Number(year);
  month = Number(month);
  xzvalue.value = new Date(xzvalue.value);
  xzvalue.value.setFullYear(year);
  xzvalue.value.setMonth(month - 1);

  const sdk = PlayingArr.value.find((item) => item.conf.videoid === selectCellId.value);
  if (sdk && sdk.conf.token) {
    SearchRecordCalendar(sdk.conf.token, year, month);
  }
}

const SearchRecordCalendar = (token: any, year: any, month: any) => {
  const { access_token, root } = getDeviceInfo()
  customDateArr.value = [];
  document.querySelectorAll('.available').forEach((el) => el.classList.remove('custom_date_class'));
  SearchRecordedCalendar(root, access_token, token, year, month).then((result: any) => {
    if (result.data.record) {
      result.data.record.forEach((key: any) => {
        if (key.bHasRec || key.bHasAlarmRec) {
          const months = month < 10 ? '0' + month : month;
          const day = key.nDay < 10 ? '0' + key.nDay : key.nDay;
          const data = year + '-' + months + '-' + day + 'T00:00:00+08:00';
          customDateArr.value.push(new Date(data).getTime());
        }
      })
    }
  })
}

const timeSpeed = (speed: any) => {
  if (isLiveview.value) {
    region.value = '1.0';
    return;
  }
  if (!uplayerList.value.UPlayerSDKList.length) return;
  uplayerList.value.setAllPlaybackRate(speed);
}

const timeInput = (e: any) => {
  if (e) {
    const isFullscreen = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    );

    const dropdown = document.querySelector('.ele .selectdrop') as HTMLElement;
    if (!dropdown) return;

    if (!isFullscreen) {
      dropdown.style.left = '-19px';
    } else {
      dropdown.style.left = '0px !important';
    }
  }
}

const resume = () => {
  if (!uplayerList.value.UPlayerSDKList.length) return;
  if (isLiveview.value) return;
  if (isPlaying.value) {
    uplayerList.value.pauseAll();
  } else {
    uplayerList.value.playAll();
  }
  isPlaying.value = !isPlaying.value;
}

const Alloffvideo = () => {
  if (playingViewId.value) {
    deviceTreeRef.value?.updatePlayingStatus('del', `view_${playingViewId.value}`)
    playingViewId.value = '';
  }
  if (!uplayerList.value) return;
  if (PlayingArr.value.length === 0) return;

  PlayingArr.value.forEach((item) => {
  })

  const notTorgetPlaybackArr = PlayingArr.value.filter((item) => !PlayBackArr.value.includes(item));
  if (notTorgetPlaybackArr && notTorgetPlaybackArr.length > 0) {
    notTorgetPlaybackArr.forEach((item) => {
      item.destroy();
    })
  }
  PlayingArr.value = [];
  PlayBackArr.value = [];
  uplayerList.value.destroyAll();
  isLiveview.value = true;
  isPlaying.value = false;
  mainSDKId.value = '';
  const cellFactory = async (cell: any) => {
    console.log('close', cell)
  }
  GridManager.value.reloadStageConfiguration(cellFactory);
  deviceTreeRef.value?.updatePlayingStatus('clear', '');
}

const gotoLive = async () => {
  const now = new Date();
  uplayerList.value.pauseAll();
  if (PlayingArr.value.length === PlayBackArr.value.length) {
    await uplayerList.value.setAllPosition(now.getTime());
    uplayerList.value.playAll();
    isLiveview.value = true;
  } else {
    const notPlaybackArr = PlayingArr.value.filter((item) => !PlayBackArr.value.includes(item));
    await Promise.all(
      notPlaybackArr.map((item) => {
        return new Promise<void>((resolve) => {
          uplayerList.value.addPlayer(item);
          PlayBackArr.value.push(item);
          resolve();
        })
      })
    )
    await uplayerList.value.setAllPosition(now.getTime()).then(() => {
      uplayerList.value.playAll();
    })
    isLiveview.value = true
  }
}

const panelFullScreen = (event: any) => {
  var elem = document.getElementById("video_hed");
  if (!elem) return;

  const isFullscreen = !!document.fullscreenElement;

  if (isFullscreen) {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch((err) => { console.error(err); });
    }
  } else {
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err) => { console.error(err); });
    } else {
      return;
    }
  }
}

const TreeFold = () => {
  IsTreeFold.value = !IsTreeFold.value;
  const leftEl = document.querySelector('.liveview_left') as HTMLElement;
  const rightEl = document.querySelector('.liveview_right') as HTMLElement;

  if (!leftEl || !rightEl) return;
  if (IsTreeFold.value) {
    leftEl.style.flex = '0 0 0%';
    rightEl.style.width = '100%';
  } else {
    leftEl.style.flex = '0 0 280px';
    rightEl.style.width = 'calc(100% - 280px)';
  }
}


const handleDeviceDragStart = (ev: DragEvent, dragData: any) => {
  isDrag.value = true;
  drag.value = dragData;
  GridManager.value?.showLines();
  GridManager.value?.highlightCells([]);
};

const dragOver = (ev: any) => {
  if ((!isDrag.value && !drag.value.videoid) || (!isDrag.value && !drag.value.viewid)) return;
  const eventX = ev.pageX;
  const eventY = ev.pageY;
  let cellsToHighlight = [];
  GridManager.value.showGridLines();
  const gridPosition = GridManager.value.findGridPositionByCoordinates(eventX, eventY);
  if (gridPosition !== false) {
    const gridDimensions = GridManager.value.getDimensionsForGridPosition(gridPosition[0], gridPosition[1]);
    cellsToHighlight.push(gridDimensions);
  }
  GridManager.value.highlightCells(cellsToHighlight, 'rgba(141,189,255,0.3)');
}

const dropTarget = async (ev: any) => {
  const { access_token, root } = getDeviceInfo()
  if ((!isDrag.value && !drag.value.videoid) || (!isDrag.value && !drag.value.viewid)) {
    GridManager.value.hideLines();
    GridManager.value.highlightCells([]);
    return;
  }
  if (drag.value.videoid) {
    let recEnable;
    const res = await ManualRecEnable(root, access_token, drag.value.token) as any;
    if (res.data.code === 0) {
      recEnable = res.data.result.manualRecEnable;
    }
    const eventX = ev.pageX;
    const eventY = ev.pageY;
    const conf = {
      pageX: eventX,
      pageY: eventY,
      id: 'G' + drag.value.videoid,
      recording: drag.value.recording,
      recEnable,
      audio: false,
      camera: {
        videoid: drag.value.videoid,
        token: drag.value.token,
        session: drag.value.session,
        name: drag.value.name,
        label: drag.value.label,
        resourceUUID: drag.value.resourceUUID,
        recording: drag.value.recording
      }
    }
    GridManager.value.claimCellByCoordinates(conf);

    const UPlayer = new UPlayerSDK(conf.id, drag.value);
    uplayerList.value.addPlayer(UPlayer);
    PlayingArr.value.push(UPlayer);
    PlayBackArr.value.push(UPlayer);
    uplayerList.value.playAll();
    isPlaying.value = true;
    changeMainSDKHandler({ detail: conf.id });
    const channelId = `channel_${drag.value.resourceUUID || drag.value.token}`;
    deviceTreeRef.value?.updatePlayingStatus('add', channelId);
  } else if (drag.value.viewid) {
    srcView(drag.value.viewid);
    playingViewId.value = drag.value.viewid;
  }

  isDrag.value = false;
  GridManager.value.hideLines();
  GridManager.value.highlightCells([]);
}

const srcView = (viewid: any) => {
  const { access_token, root } = getDeviceInfo()
  Alloffvideo();
  View(root, access_token, viewid).then(async (res: any) => {
    if (res.data.code === 0) {
      const result = res.data.result;
      const layoutData = transformViewToGrid(result.layout, result.viewEntity);
      localStorage.setItem('grid-cloud-view-layout', JSON.stringify(layoutData));
      GridManager.value.initialize();
      await nextTick();
      deviceTreeRef.value?.updatePlayingStatus('add', `view_${viewid}`);
    }
  })
}

const transformViewToGrid = (layoutData: any, viewEntities: any) => {
  const { access_token, root, session } = getDeviceInfo()
  const layout = layoutData.setting.layoutView;
  const positionMap = {} as any;
  viewEntities.forEach((entity: any) => {
    const pos = entity.layoutPosition;
    if (pos) {
      positionMap[pos] = {
        token: entity.Channel.token,
        name: entity.Channel.name,
        resourceUUID: entity.resourceUUID,
        recording: entity.Channel.recording
      }
    }
  })

  const maxRow = Math.max(...layout.map((cell: any) => cell.rowEnd)) - 1;
  const maxCol = Math.max(...layout.map((cell: any) => cell.colEnd)) - 1;
  const result = Array.from({ length: maxRow }, () => Array.from({ length: maxCol }, () => ({})));

  const processedCells = new Set();
  const sortedLayout = [...layout].sort((a, b) => {
    if (a.merged && !b.merged) return -1;
    if (!a.merged && b.merged) return 1;
    return 0;
  })

  sortedLayout.forEach((cell) => {
    const row = cell.rowStart - 1;
    const col = cell.colStart - 1;
    const cellKey = `${row}-${col}`;

    if (processedCells.has(cellKey)) return;

    const posKey = `h${cell.rowStart}-${cell.colStart}`;
    const hasCamera = positionMap[posKey];

    if (cell.merged) {
      const rowSpan = cell.rowEnd - cell.rowStart;
      const colSpan = cell.colEnd - cell.colStart;

      if (hasCamera) {
        const videoId = uuid(8);
        result[row][col] = {
          row: row,
          column: col,
          rowSpan: rowSpan,
          columnSpan: colSpan,
          forceLbm: false,
          claimed: true,
          spannedUpon: false,
          camera: {
            videoid: videoId,
            token: hasCamera.token,
            session: session,
            name: hasCamera.name,
            label: hasCamera.name,
            resourceUUID: hasCamera.resourceUUID,
            recording: hasCamera.recording
          },
          id: `G${videoId}`
        }
        processedCells.add(cellKey);

        for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + colSpan; c++) {
            const subCellKey = `${r}-${c}`
            if (r === row && c === col) continue
            if (r < maxRow && c < maxCol) {
              result[r][c] = {
                row: r,
                column: c,
                rowSpan: 1,
                columnSpan: 1,
                forceLbm: false,
                claimed: false,
                spannedUpon: true,
                camera: null,
                id: null
              }
              processedCells.add(subCellKey);
            }
          }
        }
      } else {
        result[row][col] = {}
        processedCells.add(cellKey)
        for (let r = row; r < row + rowSpan; r++) {
          for (let c = col; c < col + colSpan; c++) {
            const subCellKey = `${r}-${c}`
            if (r !== row || c !== col) {
              processedCells.add(subCellKey);
            }
          }
        }
      }
    } else {
      if (!processedCells.has(cellKey)) {
        if (hasCamera) {
          const videoId = uuid(8)
          result[row][col] = {
            row: row,
            column: col,
            rowSpan: 1,
            columnSpan: 1,
            forceLbm: false,
            claimed: true,
            spannedUpon: false,
            camera: {
              videoid: videoId,
              token: hasCamera.token,
              session: session,
              name: hasCamera.name,
              label: hasCamera.name,
              resourceUUID: hasCamera.resourceUUID,
              recording: hasCamera.recording
            },
            id: `G${videoId}`
          }
        } else {
          result[row][col] = {}
        }
        processedCells.add(cellKey);
      }
    }
  })
  return result;
}

watch(
  () => mainStore.darkMode,
  (newVal) => {
    if (uplayerList.value && uplayerList.value.timeline) {
      if (newVal === 'c-dark-theme') {
        uplayerList.value.timeline.updateBackgroundColor('#343434');
      }
      // else if (newVal === 'black') {
      //   uplayerList.value.timeline.updateBackgroundColor('#E4E4E4');
      // } else if (newVal === 'blue') {
      //   uplayerList.value.timeline.updateBackgroundColor('#1C2850');
      // }
    }
  }
)

watch(
  isLiveview,
  (newVal) => {
    if (newVal) {
      document.querySelectorAll('.grid_cell.blue_dashed').forEach((el) => el.classList.remove('blue_dashed'))
      document.querySelectorAll('.grid_cell.playback_check_border').forEach((el) => el.classList.remove('playback_check_border'))
      const target = document.getElementById(mainSDKId.value)
      if (target) target.classList.add('red_border')
    } else {
      document.querySelectorAll('.grid_cell.red_border').forEach((el) => el.classList.remove('red_border'))
      PlayBackArr.value.forEach((item) => {
        const target = document.getElementById('G' + item.conf.videoid)
        if (target) target.classList.add('blue_dashed')
      })
      const currentTarget = document.getElementById(mainSDKId.value)
      if (currentTarget) {
        currentTarget.classList.add('playback_check_border')
      }
    }
  }
)

onMounted(() => {
  gamepad.value = new XboxGamepad({
    onButtonPress: onButtonPress,
    onButtonRelease: onButtonRelease,
    onAxisChange: onAxisChange as any,
    deadZone: 0.1
  }) as any;

  initGridLayout()
  initUPlayList()

})

onBeforeUnmount(() => {
  const notTorgetPlaybackArr = PlayingArr.value.filter((item) => !PlayBackArr.value.includes(item))
  if (notTorgetPlaybackArr && notTorgetPlaybackArr.length > 0) {
    notTorgetPlaybackArr.forEach((item) => {
      item.destroy()
    })
  }
  PlayingArr.value = []
  PlayBackArr.value = []
  if (uplayerList.value) {
    uplayerList.value.destroyAll()
  }
  isLiveview.value = true
  isPlaying.value = false
  mainSDKId.value = ''

  if (gamepad.value) {
    gamepad.value.stopListening()
  }

  if (uplayerList.value) {
    uplayerList.value = null
  }

  if (GridManager.value) {
    GridManager.value.removeEventListener('closeCell', closeCellHandler)
    GridManager.value.removeEventListener('cellClick', changeMainSDKHandler)
    GridManager.value.removeEventListener('recEnableClick', recEnableHandler)
    GridManager.value.removeEventListener('Snapshot', SnapshotHandler)
    GridManager.value.removeEventListener('Information', InformationHandler)
    GridManager.value.removeEventListener('Shoutwheat', ShoutwheatHandler)
    GridManager.value.removeEventListener('PtzControlShow', PtzControlShowHandler)
    GridManager.value.removeEventListener('layoutLoadedFromCache', LayoutReadyHandler)
    GridManager.value.destroy()
    GridManager.value = null
  }

  if (timerRunInfo.value) {
    clearInterval(timerRunInfo.value)
    timerRunInfo.value = null
  }
})


const onButtonPress = (button: any) => {

}

const onButtonRelease = (button: any) => {

}

const onAxisChange = (axis: any, value: any) => {

}
</script>

<style lang="scss" scoped>
/* 设置整个 tree 的文字不可选中 */
.el-tree {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.canvasIconHighlighted {
  transform: scale(1.1);
  transition: transform 0.3s ease;
  box-shadow: 0 0 0 2px #fff100;
}

.canvasSelected {
  border: 2px solid #0399FE;
  box-sizing: border-box;
}

.liveview_right_video_hed {
  position: relative;
  width: 100%;
  flex: 1;
  overflow: hidden;
  background-image: url('./img/GridLogo_white.png');
  background-size: 380px 350px;
  background-repeat: no-repeat;
  background-position: center center;

  .malv {
    position: absolute;
    top: 20px;
    right: 16px;
    z-index: 100;
    width: 336px;
    height: 150px;
    display: flex;
    transition: 0.2s;


    .malv-close {
      position: absolute;
      top: 3px;
      right: 8px;
      font-size: 16px;
      cursor: pointer;
    }

    .malv-left,
    .malv-right {
      width: 100%;
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
        // padding: 0 2px;

        .information_content_left {
          width: 50%;
          color: #3abbfe;
          text-align: left;
        }

        .information_content_right {
          width: 50%;
          color: #3abbfe;
          text-align: left;
        }
      }
    }
  }

  .malv-hide {
    right: -336px;
  }

  :deep(.line-matrix) {
    position: absolute;
    z-index: 40;
    top: 0;
    left: 0;

    line {
      shape-rendering: crispEdges;
      stroke: #585858;
    }
  }

  :deep(.cell-matrix) {
    z-index: 42;
    position: absolute;
    top: 0;
    left: 0;

    .red_border {
      border: #f44336 2px solid;
    }

    .blue_dashed {
      border: #0399fe 2px dashed;
    }

    .playback_check_border {
      border: #cdff00 2px solid;
    }

    div {
      overflow: hidden;
      position: absolute;
    }

    .grid_cell:hover {
      .cell-i {
        bottom: 3px;
      }

      .float-layer {
        top: 0;
      }
    }

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
      background: url('./img/liveview_buttback.png') no-repeat;
      background-size: 290px 30px;
      text-align: right;
      padding: 0 10px;
      transition: 0.2s;

      i,
      span {
        margin-left: 10px;
        cursor: pointer;
        color: #fff;
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
}

.liveview {
  display: flex;
  justify-content: space-between;
  position: relative;
  overflow: hidden;

  .yuntai {
    position: absolute;
    left: 5px;
    bottom: 0;
    width: 270px;
    height: 550px;
    transition: 0.3s;

    .header {
      width: 100%;
      height: 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      i {
        display: block;
        width: 20px;
        height: 20px;
        line-height: 20px;
        text-align: center;
        border-radius: 50%;
        cursor: pointer;
        font-size: 10px;
      }
    }

    :deep(.el-timeline) {
      padding: 10px 5px;

      .el-card {
        background: transparent;
        border: none;
      }

      .el-card__body {
        padding: 0;
      }

      .el-timeline-item {
        padding-bottom: 0;
      }

      .el-timeline-item__wrapper {
        top: -15px;

        .preset_bgc {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: transparent;

          .preset_input {
            width: 150px;
            background-color: transparent;
            border: none;
            box-shadow: none;
            padding-left: 10px;
          }

          button {
            background-color: transparent;
            border: none;
          }
        }
      }
    }

    .ptz-slider {
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      .el-slider {
        width: 90%;
        padding: 0 10px;
      }
    }

    .controls {
      width: 100%;
      height: 144px;
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      padding-inline: 10px;

      .left {
        width: 70px;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, 32px);
        grid-template-rows: repeat(4, 32px);
        grid-column-gap: 5px;
        grid-row-gap: 5px;

        i {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          width: 32px;
          height: 32px;
          font-size: 20px;
          cursor: pointer;
        }

        i:active {
          color: #0399fe;
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
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;

          i {
            font-size: 22px;
          }
        }

        .shang {
          border-radius: 4px 4px 0 0;
          cursor: pointer;
        }

        .zuo {
          border-radius: 4px 0 0 4px;
          cursor: pointer;
        }

        .you {
          border-radius: 0 4px 4px 0;
          cursor: pointer;
        }

        .xia {
          border-radius: 0 0 4px 4px;
          cursor: pointer;
        }

        .corner {
          background-color: transparent !important;

          .zs,
          .ys,
          .zx,
          .yx {
            position: absolute;
            width: 32px;
            height: 32px;
            border-radius: 4px;
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
            color: #0399fe;
          }
        }
      }
    }
  }

  .yuntai-hide {
    bottom: -550px;
  }

  .TreeFold {
    position: absolute;
    top: 0;
    left: 0;
    width: 40px;
    height: 40px;
    background: rgba(124, 124, 124, 0.5);
    border-radius: 0px 2px 2px 0px;
    z-index: 1031;
    text-align: center;
    line-height: 40px;
    cursor: pointer;

    i {
      font-size: 18px;
    }
  }

  .icon_start {
    width: 32px;
    height: 32px;
    background-size: 100%;
  }

  .icon_stop {
    width: 32px;
    height: 32px;
    background-size: 100%;
  }

  #menu {
    width: 20px;
    height: 40px;
    background: #181818;
    line-height: 40px;
    text-align: center;
    position: absolute;
    color: #fff;
    right: 0%;
    top: 49%;
    z-index: 101;
  }

  #menu:hover {
    cursor: pointer;
  }

  .ai_replay:hover {
    cursor: pointer;
  }

  #watermarktoggle {
    position: fixed;
    z-index: 100;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    display: none;
    pointer-events: none;
    margin-top: 40px;
  }

  .liveview_left {
    flex: 0 0 280px;
    height: 100%;
    overflow: auto;

    &::-webkit-scrollbar {
      display: none;
    }

    .left_top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 17px;
      height: 40px;
      line-height: 40px;

      .icon-liebiao {
        cursor: pointer;
        font-size: 18px;
      }
    }

    .liveview_left_input {
      padding: 14px;

      .el-input__suffix {
        right: 20px !important;
        top: 3px;
        line-height: 45px;
      }
    }

    .black {
      display: none;
      font-size: 12px;
      color: #606266;
      padding-left: 4px;
      line-height: 24px;
      color: #f00;
    }

    .nowplay {
      display: none;
      font-size: 12px;
      color: #606266;
      padding-left: 4px;
      line-height: 23.5px;
      color: #30d158;

      .dot {
        font-size: 12px;
        line-height: 23.5px;
        padding-right: 4px;
      }

      .nowplayText {
        line-height: 26px;
      }
    }

    .el_tree .el-tree-node__content {
      min-height: 24px;
      height: auto;
    }

    .el-collapse {
      border-bottom: none;

      .el-collapse-item {
        height: 86vh;

        .el-collapse-item__wrap {
          .el-collapse-item__content {
            height: 86vh;
            padding: 0 10px;
            overflow: auto;
          }
        }
      }
    }
  }

  .liveview_lefts {
    width: 0%;
  }

  .liveview_right {
    width: calc(100% - 280px);
    height: 100%;
    margin-right: 2px;
    position: relative;

    :deep(.control_area) {
      width: 100%;
      height: 140px;
      display: flex;
      flex-direction: column;

      .control_btns {
        width: 100%;
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .goto-live {
          width: 90px;
          height: 26px;
          line-height: 26px;
          text-align: center;
          border-radius: 13px;
          background-color: rgba($color: #8dbdff, $alpha: 0.16) !important;
          color: #0399fe !important;
          font-size: 12px !important;
          margin-right: 10px;
        }

        .control-center {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;

          .fixed_input {
            .el-input__wrapper {
              background: transparent;
            }

            .el-input__suffix {
              display: none;
            }
          }

          .resume-btn {
            background-color: transparent;
            border: none;
            line-height: 20px !important;

            i {
              font-size: 22px;
            }
          }

          .resume-btn {
            margin-right: 10px;
          }

          .ele {
            margin-right: 5px;

            .el-select__placeholder {
              text-align: center;
              color: #FFFFFF;
            }

            .el-select__suffix {
              display: none;
            }

            .el-input__inner {
              border-radius: 2px;
            }

            .el-popper__arrow {
              display: none;
            }
          }

          .Audio_slider-bottom {
            display: flex;
            flex-direction: row;
            justify-content: flex-start;
            align-items: center;
            width: 210px;

            i {
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
                  border: 1px solid #409eff;
                  height: 12px;
                  background-color: #409eff;
                  border-radius: 0px;
                }
              }
            }
          }
        }

        .caveat_butt {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          width: 20%;

          .showRecodeType {
            width: 24px;
            height: 32px;
            text-align: center;
            line-height: 32px;
            border-radius: 4px;
            margin-right: 10px;
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
      }

      #timeline {
        .center-pointer line {
          stroke: #feef03;
          stroke-width: 2;
        }

        .label text {
          font-size: 14px;
          color: #ffffff;
        }

        .label rect {
          fill: #0399FE
        }

        .bar-name text {
          font-size: 10px;
        }

        .domain {
          display: none;
          visibility: hidden;
        }
      }
    }

    .dbclick {
      position: absolute;
      top: 1px;
      left: 1px;
      width: 83.45vw;
      height: 92.7vh;
      z-index: 102 !important;
    }

    .h5videoh {
      box-shadow: 0 0 0 2px #f44336;
      z-index: 101;
    }

    .h5videoh1 {
      box-shadow: 0 0 0 2px #fff100;
      z-index: 101;
      animation-name: breath;
      animation-duration: 1.5s;
      animation-timing-function: ease-in-out;
      animation-iteration-count: infinite;
      -webkit-animation-name: breath;
      -webkit-animation-duration: 1.5s;
      -webkit-animation-timing-function: ease-in-out;
      -webkit-animation-iteration-count: infinite;
    }

    @keyframes breath {
      from {
        box-shadow: 0 0 0 2px #fff100;
      }

      50% {
        box-shadow: none;
      }

      to {
        box-shadow: 0 0 0 2px #fff100;
      }
    }

    @-webkit-keyframes breath {
      from {
        box-shadow: 0 0 0 2px #fff100;
      }

      50% {
        box-shadow: none;
      }

      to {
        box-shadow: 0 0 0 2px #fff100;
      }
    }

    .h5videohs {
      border: 1px solid #409eff !important;
    }

    .videoColor:hover {
      .float-layer {
        display: block;
      }
    }

    .videoColor {
      .h5vccanvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1000;
      }

      .video_ptz {
        position: absolute;
        bottom: 0;
        background: rgba(255, 255, 255, 0);
        z-index: 1000;
        padding: 0px;
        box-sizing: content-box;
        width: 100%;
        height: 100%;

        .flex_content {
          width: 100%;
          height: 100%;
          padding: 8% 0 8% 0;
          position: relative;

          .content_zoom {
            width: 50%;
            height: 100%;
            display: flex;
            align-items: flex-end;

            .key_zoom {
              width: 25%;
              margin: 0 4% 0 8%;

              .key_flex {
                width: 100px;
                height: 100px;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                margin-left: 5%;
                background: url('./img/liveview_ptzbutton.png') no-repeat center;

                .key_but {
                  width: 33.33%;
                  height: 33.33%;
                  text-align: center;
                  font-size: 12px;

                  i:hover {
                    color: #0399fe;
                  }
                }
              }
            }

            .zoom {
              width: 20px;
              height: 50px;
              display: flex;
              flex-wrap: wrap;
              justify-content: space-around;
              align-content: space-around;
              margin-left: 40px;
              margin-bottom: 50px;

              .zoom_add {
                width: 20px;
                height: 20px;
                text-align: center;
                background: none;
                border: 0;
                padding: 0;
                color: #ffffff;

                &:hover {
                  color: #0399fe;
                }
              }
            }
          }

          .zoom_g {
            width: 20px;
            height: 100%;
            position: absolute;
            left: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            flex-wrap: wrap;
            justify-content: space-around;
            align-content: space-around;
            padding: 0 2px;

            .zoom_add {
              width: 20px;
              height: 20px;
              text-align: center;
              background: none;
              border: 0;
              padding: 0;
              color: #ffffff;
              font-size: 14px;

              &:nth-child(5) {
                color: #3abbfe;
                font-size: 18px;
              }

              &:nth-child(7) {
                color: #3abbfe;
                font-size: 18px;
              }

              &:nth-child(6) {
                font-size: 18px;
              }

              &:nth-child(8) {
                font-size: 18px;
              }

              &:hover {
                color: #0399fe;
              }
            }
          }

          .Preset {
            width: 30%;
            position: absolute;
            bottom: 10%;
            right: 4%;

            .block {
              width: 100%;
              height: 140px;
              margin-right: 4%;
              overflow: auto;
              color: #ffffff;

              &::-webkit-scrollbar {
                display: none;
              }

              .preset_bgc {
                width: 100%;
                height: 24px;
                background: rgba(255, 255, 255, 0.2);

                .preset_input {
                  width: 52%;
                  background: none;
                  border-radius: 12px;
                  border: 0;
                  padding: 0 0 0 10px;
                  color: rgba(255, 255, 255, 1) !important;
                }

                button {
                  width: 15%;
                  background: none;
                  border: 0;
                  font-size: 15px;
                  color: #ffffff;
                  margin-left: 3px;
                }
              }
            }
          }
        }
      }

      .float-layer {
        position: absolute;
        display: none;
        top: 0;
        right: 0px;
        z-index: 1012;
        height: 30px;
        line-height: 30px;
        background: url('./img/liveview_buttback.png') no-repeat;
        background-size: 290px 30px;
        text-align: right;
        padding: 0 10px;

        i {
          margin-left: 10px;
          cursor: pointer;
          color: #fff;
        }

        span {
          margin-left: 10px;
          cursor: pointer;
          color: #fff;
        }
      }

      .information {
        position: absolute;
        bottom: 40px;
        left: 10px;
        background: rgba(0, 0, 0, 0.5);
        box-sizing: content-box;
        z-index: 1000;
        width: 330px;
        height: 150px;
        color: #ffffff;

        .information_con {
          width: 100%;
          height: 90%;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          align-content: space-between;

          .information1 {
            width: 50%;

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
                color: #3abbfe;
                text-align: left;
              }

              .information_content_right {
                width: 50%;
                color: #3abbfe;
                text-align: left;
              }
            }
          }
        }
      }

      .icon-huifangbiaoshi {
        position: absolute;
        bottom: 5px;
        right: 10px;
        font-size: 18px !important;
      }

      .breath_light {
        position: absolute;
        bottom: 45px;
        left: 19px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: red;
        animation: breath 2s ease-in-out infinite;
      }

      @keyframes breath {
        0% {
          opacity: 0;
        }

        50% {
          opacity: 1;
        }

        100% {
          opacity: 0;
        }
      }

      .palace {
        background-size: 10%;
        flex: 1 1 10%;
        height: 100% !important;
      }

      .fours_Palace {
        flex: 1 1 33.33% !important;
        height: 33.33% !important;

        &:nth-child(1) {
          flex: 1 1 100% !important;
          height: 66.66% !important;
        }
      }

      .Six_Palace {
        flex: 1 1 33.33% !important;
        height: 33.33% !important;

        &:nth-child(1) {
          flex: 1 1 66.66% !important;
          height: 66.66% !important;
        }

        &:nth-child(3) {
          width: 33.33% !important;
          position: absolute;
          top: 33.33%;
          right: 0;
        }
      }

      .sixts {
        height: 100% !important;
        width: 100% !important;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1000;
      }

      .videoflexitem {
        flex: 1 1 25% !important;
        width: 25% !important;
        height: 25% !important;

        &:nth-child(6) {
          position: absolute;
          top: 50%;
          left: 0;
        }

        &:nth-child(7) {
          flex: 1 1 50% !important;
          height: 50% !important;
        }

        &:nth-child(8) {
          flex: 1 1 25% !important;
          position: absolute;
          top: 50%;
          right: 0;
        }
      }

      .Seven_Palace {
        flex: 1 1 33.33%;
        height: 33.33% !important;

        &:nth-child(1) {
          height: 100% !important;
        }

        &:nth-child(3) {
          width: 33.33% !important;
          position: absolute;
          top: 33.33%;
          right: 0;
        }

        &:nth-child(2) {
          width: 33.33% !important;
          position: absolute;
          top: 33.33%;
          right: 33.33%;
        }

        &:nth-child(6) {
          width: 33.33% !important;
          position: absolute;
          bottom: 0;
          right: 33.33%;
        }

        &:nth-child(7) {
          width: 33.33% !important;
          position: absolute;
          bottom: 0;
          right: 0;
        }
      }
    }

    div[name='flex'] {
      display: flex;
      flex-wrap: wrap;
      border-bottom: 0px !important;

      :hover {
        cursor: pointer;
      }

      +[name='flex'] {
        border-left: 0px !important;
      }
    }

    .liveview_group {
      width: 100%;
      padding: 20px 20%;
      display: flex;
      justify-content: space-between;

      button {
        border: none;
        background: none;
        font-size: 30px;
      }
    }
  }

  .liveview_right2 {
    display: none;
    width: 0%;
    height: 93vh;

    .el-tabs__nav.is-top {
      width: 100%;
    }

    .el-tabs__item {
      width: 25% !important;
      text-align: center;
    }

    .border_card {
      border: none !important;
      height: 100%;

      .icon {
        font-size: 20px;
      }

      .el-tabs__header {
        border: none !important;
      }

      .tab_pane {
        height: 82vh;
        overflow: auto;
        overflow-x: auto;
        overflow-y: auto;

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

        .datanodecam {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        &:nth-child(4) {
          margin-left: 10px;
        }
      }

      .el-tabs__item {
        border: none;
      }
    }
  }

  .liveview_right3 {
    width: 84%;
  }

  .liveview_rights {
    width: 100%;

    #video_hed {
      height: 100%;
    }

    .liveview_group {
      display: none;
    }
  }
}

.el-popover.el-popper {
  .liveview_popover {
    .liveview_popover_top {
      display: flex;
      width: 100%;
      margin-bottom: 10px;

      div {
        width: 35%;
        line-height: 40px;
      }

      .liveview_left_input {
        width: 65%;

        .el-input__inner {
          width: 100%;
          border: none;
        }
      }
    }

    .liveview_popover_but {
      width: 100%;
      display: flex;
      justify-content: flex-end;

      button {
        border-radius: 5px;
        border: none;
      }
    }
  }
}

.none {
  display: block !important;
}

.box-card {
  width: 150px;
  position: absolute;
  z-index: 1000;
  padding: 12px;

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

.GongGePopover {
  .LayoutSearch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    .SearchIcon {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      line-height: 32px;
      text-align: center;
    }

    .OpenLayoutDialog {
      text-align: right;
      cursor: pointer;
    }
  }

  .ViewLayout {
    width: 60%;
    overflow-y: auto;
    padding-left: 15px;

    .LayoutCanvas {
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
      align-items: center;
      position: relative;

      span {
        color: #06e8ea;
        position: absolute;
        font-size: 12px;
        top: 30%;
        display: none;
      }
    }

    .LayoutCanvasHover {
      background: #0e0e0e;
    }
  }
}

.ViewLayoutDialog {
  .layout_topBtn {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 5px;

    .button_edi {
      padding-left: 0px;

      button {
        border-radius: 2px;
        padding: 2px 12px;
        font-size: 14px;
        margin-right: 20px;
        border-color: none;
      }

      .form_butt {
        width: unset;
        height: 29px;
        color: #9ee577;
        padding: 2px 0px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0px 5px;

        :nth-child(1) {
          margin-right: 10px;
        }
      }

      .form_butt1 {
        width: 32px;
        height: 29px;
        padding: 2px 0px;
        color: #fe5003;
        border: none !important;
      }
    }

    .button_default {
      button {
        border-radius: 2px;
        font-size: 14px;
        width: unset;
        height: 29px;
        color: #0399fe;
        padding: 2px 0px;
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 0px 5px;

        :nth-child(1) {
          margin-right: 10px;
        }
      }
    }
  }

  .LayoutIcon {
    padding-top: 10px;
    height: 145px;
    overflow-y: auto;

    .liveview_group {
      p {
        margin-bottom: 0 !important;
        font-size: 12px;
        padding-left: 10px;
        height: 18px;
        line-height: 18px;
      }

      .PanelBtns {
        height: 45px;
        padding-left: 12px;
        display: flex;
        justify-content: flex-start;
        align-items: center;
      }

      button {
        padding: 0;
        border: none;
        background: none;
        font-size: 24px;
        margin: 0px 15px 0px 0px;
      }
    }

    .customIcon {
      p {
        margin-bottom: 5px !important;
        padding-left: 10px;
        height: 18px;
        line-height: 18px;
      }

      .DialogLayout {
        display: flex;
        flex-wrap: wrap;
        padding-left: 12px;

        div {
          display: flex;
          flex-wrap: wrap;
          flex-direction: column;
          align-items: center;
          margin: 0px 15px 0px 0px;

          canvas {
            margin: 5px 5px;
          }
        }
      }
    }
  }
}

.liveview_group {
  button {
    margin: 0px 15px 0px 0px;
  }
}

.liveview_footer {
  .BlankPlaceholder {
    width: 20%;
    display: flex;

    .PatrolBtn {
      width: 100px;
      height: 20px;
      border-radius: 4px;
      line-height: 20px;
      text-align: center;
      cursor: pointer;
    }

    .PatrolBtn.active {
      background-color: #0399fe;
      color: #ffffff;
    }

    .PatrolBtn:not(.active) {
      background: #313131;
      color: #0399fe;
    }
  }

  .show-play-replay {
    display: flex;
    align-items: center;

    .changeLiveReplay {
      width: 100px;
      height: 20px;
      border-radius: 4px;
      text-align: center;
      line-height: 20px;
      cursor: pointer;
    }
  }
}

.CameraIcon {
  width: 1.3em;
  height: 1.2em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
  margin-left: 0.05em;
}

.DomeIcon {
  height: 1.3em;
}

.PatrolPopover {
  padding: 0px;

  .PatrolContainer {
    height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .PatrolTitle {
      height: 60px;
      padding: 15px;

      .el-select {
        width: 100%;

        .el-input__inner {
          background: transparent;
        }
      }
    }

    .PatrolContent {
      height: 100%;
      padding: 15px;
      overflow: auto;

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

      .PatrolContentElementView {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 32px;
        border-radius: 2px;
        padding: 0px 10px;

        i {
          margin-right: 5px;
        }
      }
    }

    .PatrolFooter {
      height: 32px;
      padding: 0 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      i {
        cursor: pointer;
      }

      .xunhuan {
        color: #67c23a;
      }

      .PatrolPlay {
        color: #0399fe;
      }

      .guanbiPatrol {
        color: #fe5003;
      }
    }
  }
}

.Preview {
  margin: 15px 0px;

  img {
    cursor: pointer;

    &:active {
      border: 2px solid #0399fe;
    }
  }

  .Preview_img_error {
    width: 240px;
    height: 146px;
    text-align: center;
    line-height: 146px;

    i {
      font-size: 32px;
    }
  }

  .Preview_label {
    width: 240px;
    height: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
    line-height: 32px;

    i {
      font-size: 18px;
    }

    span {
      margin-left: 12px;
    }
  }
}

.hover-image {
  .hover_img_error {
    width: 100%;
    height: 146px;
    text-align: center;
    line-height: 146px;

    i {
      font-size: 32px;
    }
  }

  .hover_label {
    width: 260px;
    height: 20px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: 5px;
    line-height: 20px;

    i {
      font-size: 18px;
    }

    span {
      margin-left: 5px;
    }
  }
}
</style>