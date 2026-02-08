<script setup lang="ts">
import { GetHProConfigApi, UpdateHProConfigApi } from '../../../api/general';
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useSiteInfo } from '../../../store/site-info';
import { useTempStore } from '../../../store/temp';
import { ElMessage } from 'element-plus';

const siteStore = useSiteInfo();
const tempStore = useTempStore();

const site = computed(() => siteStore.getSiteDevice(tempStore.tempIP))
const root = ref<string>('');

const form = ref<any>({
  ComputerDeviceName: ''
})


const GetHProConfig = async () => {
  if (!site.value || !site.value.access_token) return;
  const res = await GetHProConfigApi(root.value, site.value.access_token);
  if (res.status == 200 && res.data.code == 0) {
    console.log('General => ', res.data.result);
    const item = res.data.result.find((item: any) => item.key == "ComputerDeviceName");
    form.value.ComputerDeviceName = item.value;
  }
}

const onSubmit = async () => {
  if (!site.value || !site.value.access_token) return;
  const res = await UpdateHProConfigApi(root.value, site.value.access_token, {
    key: 'ComputerDeviceName',
    value: form.value.ComputerDeviceName
  })
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      type: 'success',
      message: 'Save Success!',
      duration: 2000
    })
    siteStore.updateSiteName(site.value.ipv4Address, form.value.ComputerDeviceName)
  } else {
    ElMessage({
      type: 'error',
      message: 'Save Failed!',
      duration: 2000
    })
  }
}

onMounted(() => {
  if (!site.value || !site.value.access_token) return;
  root.value = (site.value.enableHttps ? 'https://' : 'http://') + site.value.ipv4Address + ':' + (site.value.enableHttps ? site.value.httpsPort : site.value.httpPort)
  GetHProConfig();

  siteStore.startListening()
})
onUnmounted(() => {
  siteStore.stopListening();
})
</script>

<template>
  <div class="general">
    <p class="title">General</p>
    <el-form :model="form" label-width="120" label-position="left">
      <el-form-item :label="'Site Name'">
        <el-input v-model="form.ComputerDeviceName" style="width: 400px;"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Save</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.general {
  width: 100%;
  height: 100%;
  padding: 30px 40px;
  .title {
    font-size: 18px;
    margin-bottom: 20px;
  }
}
</style>