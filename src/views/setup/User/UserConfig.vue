<script setup lang="ts">
import $ from 'jquery'
import { ref, reactive, onMounted, computed } from 'vue';
import { GetUsernameApi, GetUserConfigApi, GetDefaultPartitionApi, UpdateUserConfigApi } from '../../../api/user';
import type { UpdateUserConfigParams } from '../../../api/user'
import getOppositeColor from '../../../utils/OppositeColor'
import { useSiteInfo } from '../../../store/site-info';
import { useTempStore } from '../../../store/temp';
import { useStore } from '../../../store';
import { ElMessage } from 'element-plus';

const siteStore = useSiteInfo();
const tempStore = useTempStore();
const store = useStore()

const site = computed(() => siteStore.getSiteDevice(tempStore.tempIP));
const root = ref<string>('');

const avatar = ref<any>();
const acronym = ref<any>();
const background = ref<any>()

const liveviewrtc = ref<string>(store.liveviewrtc);   // 存放store中的默认值
const liveviewrtc1 = ref<string>(store.liveviewrtc1); // 存放store中的默认值
const watermark = ref<string>('watermark')            // 存放store中的默认值
const watermarkEnable = ref<boolean>(false)           // 存放store中的默认值 
const rtcEngine = ref<string>('v1')                   // 存放store中的默认值
const devicemarktoggle = ref<boolean>(false); // 存放store中的默认值
const elqualitytoggle = ref<boolean>(false);     // 存放store中的默认值
const WebclientAutoLogoutTime = ref<string>('180')
const WebclientAutoLogoutTimeEnable = ref<boolean>(false);  // 存放store中的默认值
const websocketDecoder = ref<string>('H264 H265')
const rtcDecoder = ref<string>('H264')
const keepAspectRatio = ref<boolean>(false)   // 存放store中的默认值
const VideoBackground = ref<number>(2)  
const color = ref<string>('#000000'); // 存放store中的默认值
const mapCluster = ref<boolean>(false);
const CascadeLoadingLevel = ref<string>('3'); // 存放store中的默认值
const DefaultStorage = ref<string>('CentralStorage'); // 存放store中的默认值
const DefaultView = ref<number>(1); // 存放store中的默认值
const DefaultMap = ref<string>('');
const partitionType = ref<string>('');
const RBufferTime = ref<number>(0); // 存放store中的默认值
const H264CpuDecode = ref<boolean>(true); // 存放store中的默认值


const ProtocolOptions = [{
  value: 'WS',
  label: 'WS'
}, {
  value: 'RTC',
  label: 'RTC'
}, {
  value: 'WS2',
  label: 'WS2'
}]
const rtcEngineOptions = [{
  value: 'v1',
  label: 'v1'
}, {
  value: 'v2',
  label: 'v2'
}]
const displayOption = [{
  label: 'Show',
  value: true
}, {
  label: 'Hide',
  value: false
}]
const colorOptions = [{
  value: 1,
  label: 'White'
}, {
  value: 2,
  label: 'Black'
}, {
  value: 3,
  label: 'Dark Blue'
}]
const playbackModeOptions = [{
  value: "CentralStorage",
  label: "CentralStorage",
}, {
  value: "DeviceStorage",
  label: "DeviceStorage",
}]
const mapOptions: any = [];
const partitionOptions = [{
  label: 'devPartition',
  value: 'devPartition',
}, {
  label: 'logicPartition',
  value: 'logicPartition',
}];
const viewOptions = [{
  icon: 'iconfont icon-a-1gongge',
  value: 1,
}, {
  icon: 'iconfont icon-a-3gongge',
  value: 3,
}, {
  icon: 'iconfont icon-a-4gongge',
  value: 4,
}, {
  icon: 'iconfont icon-sigongge',
  value: '4Alt',
}, {
  icon: 'iconfont icon-a-6gongge',
  value: 6
}, {
  icon: 'iconfont icon-a-7gongge',
  value: 7
}, {
  icon: 'iconfont icon-a-9gongge',
  value: 9
}, {
  icon: 'iconfont icon-a-13gongge',
  value: 13,
}, {
  icon: 'iconfont icon-a-16gongge',
  value: 16,
}, {
  icon: 'iconfont icon-a-25gongge',
  value: 25,
}]


// 获取用户头像
const userList = async () => {
  if (!site.value || !site.value.access_token || !site.value.username) return;
  const res = await GetUsernameApi(root.value, site.value.access_token, site.value.username)
  if (res.status === 200 && res.data.msg === 'Success') {
    var item = res.data.result;
    acronym.value = item.acronym;
    background.value = item.background;
    avatar.value = item.avatar;
    $('.avatar').css('color', getOppositeColor(item.background));
    console.log(item)
  }
}

// 获取用户配置
const userConfig = async () => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetUserConfigApi(root.value, site.value.access_token)
  console.log('userConfig =>', res);
  if (res.status == 200 && res.data.code == 0 && res.data.result.length > 0) {
    res.data.result.forEach((item: any) => {
      switch (item.key) {
        case "LiveViewProtocol":
          liveviewrtc.value = item.value;
          break;
        case "PlaybackProtocol":
          liveviewrtc1.value = item.value;
          break;
        case "WatermarkContent":
          watermark.value = item.value;
          break;
        case "WatermarkStatus":
          watermarkEnable.value = item.value === 'true' ? true : false;
          break;
        case "RTCEngine":
          rtcEngine.value = item.value;
          break;
        case "DeviceDisable":
          devicemarktoggle.value = item.value === 'true' ? true : false;
          break;
        case "PictureQuality":
          elqualitytoggle.value = item.value === 'true' ? true : false;
          break;
        case "WebclientAutoLogoutTime":
          WebclientAutoLogoutTime.value = item.value;
          break;
        case "WebclientAutoLogoutTimeEnable":
          WebclientAutoLogoutTimeEnable.value = item.value === 'true' ? true : false;
          break;
        case "BufferTime":
          RBufferTime.value = item.value;
          break;
        case "H264CPUDecode":
          H264CpuDecode.value = item.value === 'true' ? true : false;
          break;
        // case 'websocketDecoder':
        //   websocketDecoder.value = item.value;
        //   break;
        // case 'rtcDecoder':
        //   rtcDecoder.value = item.value;
        //   break;
        case "VideoAspectRatio":
          keepAspectRatio.value = item.value === 'true' ? true : false;
          break;
        case 'VideoBackground':
          VideoBackground.value = item.value;
          break;
        case "MapCluster":
          mapCluster.value = item.value === 'true' ? true : false;
          break;
        case "CasLevel":
          CascadeLoadingLevel.value = item.value;
          break;
        case "DefaultStorage":
          DefaultStorage.value = item.value;
          break;
        case "DefaultView":
          DefaultView.value = item.value;
          break;
        case "DefaultMap":
          DefaultMap.value = item.value;
          break;
        case "DefaultPartition":
          partitionType.value = item.value;
          break;
      }
    })
  }
}

const updateUserConfig = async () => {
  if (!site.value || !site.value.access_token) return;
  const data = [{
    key: 'LiveViewProtocol',
    value: liveviewrtc.value
  }, {
    key: 'PlaybackProtocol',
    value: liveviewrtc1.value
  }]
  console.log('updateUserConfig =>', data);
  for(const item of data) {
    const res = await UpdateUserConfigApi(root.value, site.value.access_token, item)
    if (res.status == 200 && res.data.code == 0) {
      console.log(`Update ${item.key} success`);
      if (item.key == 'LiveViewProtocol') store.setLiveviewrtc(item.value)
      if (item.key == 'PlaybackProtocol') store.setLiveviewrtc1(item.value)
      ElMessage({
        message: 'Save success',
        type: 'success',
        duration: 2000
      })
    }
  }
}

const GetDefaultPartition = async (userId: number) => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetDefaultPartitionApi(root.value, site.value.access_token, userId)
  console.log(res);
}

onMounted(() => {
  if (!site.value || !site.value.access_token) return;
  root.value = (site.value.enableHttps ? 'https://' : 'http://') + site.value.ipv4Address + ':' + (site.value.enableHttps ? site.value.httpsPort : site.value.httpPort)

  userList();
  userConfig()
})
</script>

<template>
  <div class="user-config">
    <div class="header">
      <div class="title">User Config</div>
      <div class="avatar-box">
        <div v-if="avatar">
          <img :src="avatar" alt="" width="24px" height="24px">
        </div>
        <div v-else
          :style="{ background: background, width: '24px', height: '24px', borderRadius: '50%', fontSize: '14px', textAlign: 'center', lineHeight: '24px', position: 'relative', }">
          {{ acronym }}
          <div style="width: 6px;height: 6px;background: #5CFF00;border-radius: 50%;position: absolute;right:2px;top:17px;"></div>
        </div>
        <span class="username">{{ site?.username }}</span>
      </div>
    </div>
    <div class="form-box">
      <el-form label-position="left" label-width="250">
        <el-form-item :label="'Liveview Protocol: ' + liveviewrtc">
          <el-select v-model="liveviewrtc" style="width: 414px;">
            <el-option v-for="item in ProtocolOptions" :key="item.value" :value="item.value" :label="item.label"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="'Liveview Protocol: ' + liveviewrtc1">
          <el-select v-model="liveviewrtc1" style="width: 414px;">
            <el-option v-for="item in ProtocolOptions" :key="item.value" :value="item.value" :label="item.label"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item v-if="liveviewrtc == 'WS2'" :label="'缓存时间'">
          <el-input v-model="RBufferTime" style="width: 414px;">
            <template #suffix>
              <span>minutes</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item v-if="liveviewrtc == 'WS2'" :label="'H264 CPU解码'">
          <el-switch v-model="H264CpuDecode"></el-switch>
        </el-form-item>
        <el-form-item label="Watermark">
          <el-input style="width: 414px; margin-right: 10px;" v-model="watermark"></el-input>
          <el-radio-group v-model="watermarkEnable">
            <el-radio-button label="Enable Watermark" :value="true" />
            <el-radio-button label="Disable watermark" :value="false" />
          </el-radio-group>
        </el-form-item>
        <el-form-item label="RTC Engine">
          <el-select v-model="rtcEngine" style="width: 414px;" disabled>
            <el-option v-for="item in rtcEngineOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Display Disable">
          <el-select v-model="devicemarktoggle" style="width: 414px">
            <el-option v-for="item in displayOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Image Quality Selection">
          <el-select v-model="elqualitytoggle" style="width: 414px">
            <el-option v-for="item in displayOption" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Web Client Auto-logout Time">
          <el-input style="width: 414px; margin-right: 10px;" v-model="WebclientAutoLogoutTime">
            <template #suffix>
              <span>minutes</span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="Enable Web Client Auto-logout">
          <el-switch v-model="WebclientAutoLogoutTimeEnable"></el-switch>
        </el-form-item>
        <el-form-item label="WS Decoder">
          <el-input v-model="websocketDecoder" disabled style="width: 414px;"></el-input>
        </el-form-item>
        <el-form-item label="RTC Decoder">
          <el-input v-model="rtcDecoder" disabled style="width: 414px;"></el-input>
        </el-form-item>
        <el-form-item label="Aspect ritio">
          <el-switch v-model="keepAspectRatio"></el-switch>
        </el-form-item>
        <el-form-item label="Video Background Color">
          <el-select v-model="VideoBackground" style="width: 238px;">
            <el-option v-for="item in colorOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Map Cluster">
          <el-switch v-model="mapCluster"></el-switch>
        </el-form-item>
        <el-form-item label="Cascade Loading Level">
          <el-input v-model="CascadeLoadingLevel" style="width: 414px; margin-right: 10px;"></el-input>
          <el-button type="primary" >Reset</el-button>
        </el-form-item>
        <el-form-item label="Playback Mode">
          <el-select v-model="DefaultStorage" style="width: 414px;">
            <el-option v-for="item in playbackModeOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Default View">
          <div class="view-container">
            <i v-for="item in viewOptions" :key="item.value" :class="item.icon + ' ' + (item.value == DefaultView ? 'active' : '')"></i>
          </div>
        </el-form-item>
        <el-form-item label="Default Map">
          <el-select v-model="DefaultMap" style="width: 414px; margin-right: 10px;">
            <el-option v-for="item in mapOptions"  :key="item.uuid" :label="item.mapName" :value="item.mapId"></el-option>
          </el-select>
          <el-button type="primary" >Reset</el-button>
        </el-form-item>
        <el-form-item label="Default partition">
          <el-select v-model="partitionType" style="width: 414px;">
            <el-option v-for="item in partitionOptions" :key="item.value" :label="item.label" :value="item.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </div>
    <div class="submit-btns">
      <el-form >
        <el-form-item label="" label-width="250">
          <el-button class="cancel" @click="userConfig">Cancel</el-button>
          <el-button type="primary" @click="updateUserConfig">Save</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped lang="scss">
.user-config {
  width: 100%;
  height: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  .header {
    width: 50%;
    // height: 56px;
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    .title {
      font-size: 18px;
    }
    .avatar-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .username {
        margin-left: 10px;
      }
    }
  }
  .form-box {
    flex: 1;
    overflow-y: auto;
  }
  .submit-btns {
    width: 50%;
    // height: 56px;
  }
  .view-container {
    width: 414px;
    height: 56px;
    border: 1px solid #5B5B5B;
    display: flex;
    align-items: center;
    justify-content: center;
    i {
      font-size: 24px;
      margin-right: 12px;
      cursor: pointer;
    }
    .active {
      color: #409EFF;
    }
  }
}
</style>