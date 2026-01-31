<script setup lang="ts">
import $ from 'jquery'
import { ref, reactive, onMounted } from 'vue';
import { GetUsernameApi, GetUserConfigApi, GetDefaultPartitionApi, UpdateUserConfigApi } from '../../../api/user';
import getOppositeColor from '../../../utils/OppositeColor'
import { useSiteInfo } from '../../../store/site-info';
import { useTempStore } from '../../../store/temp';
import { useStore } from '../../../store';

const siteStore = useSiteInfo();
const tempStore = useTempStore();
const store = useStore()

const site = siteStore.getSiteDevice(tempStore.tempIP);
const root = ref<string>('');

const avatar = ref<any>();
const acronym = ref<any>();
const background = ref<any>()
// 获取用户头像
const userList = async () => {
  if (!site || !site.access_token || !site.username) return;
  const res = await GetUsernameApi(root.value, site.access_token, site.username)
  if (res.status === 200 && res.data.msg === 'Success') {
    var item = res.data.result;
    acronym.value = item.acronym;
    background.value = item.background;
    avatar.value = item.avatar;
    $('.avatar').css('color', getOppositeColor(item.background));
    console.log(item)
  }
}

const GetDefaultPartition = async (userId: number) => {
  if (!site || !site.access_token) return;
  const res = await GetDefaultPartitionApi(root.value, site.access_token, userId)
  console.log(res);
}

const liveviewrtc = ref<string>(store.liveviewrtc);
const liveviewrtc1 = ref<string>(store.liveviewrtc1);
const watermark = ref<string>('watermark')
const watermarkEnable = ref<boolean>(false)
const rtcEngine = ref<string>('v1')
const displayEnable = ref<boolean>(false);
const elqualitytoggle = ref<boolean>(false)
const WebclientAutoLogoutTime = ref<string>('180')


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


onMounted(() => {
  if (!site || !site.access_token) return;
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort)

  userList();
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
      <el-form label-position="left" label-width="220">
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
          <el-select v-model="displayEnable" style="width: 414px">
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
      </el-form>
    </div>
    <div class="submit-btns">
      <el-form >
        <el-form-item label="" label-width="200">
          <el-button class="cancel">Cancel</el-button>
          <el-button type="primary">Save</el-button>
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
}
</style>