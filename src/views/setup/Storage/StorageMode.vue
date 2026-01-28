<script setup lang="ts">
import { GetWorkServerListApi, GetStorageModeApi, SetStorageModeApi } from '../../../api/storage';
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { useTempStore } from '../../../store/temp';
import { useSiteInfo } from '../../../store/site-info';

const tempStore = useTempStore();
const siteStore = useSiteInfo();

const form = reactive({
  nodeId: '',
  mode: ''
})
const storageModeList = [{
  value: 'USC_STORAGE_MODE_OBJECT',
  label: 'Local Object Storage'
}, {
  value: 'USC_STORAGE_MODE_S3',
  label: 'S3 Storage'
}]
const site = siteStore.getSiteDevice(tempStore.tempIP)
const root = ref<string>('')

const Node = async () => {
  if (!site || !site.access_token) return;
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort)
  const res = await GetWorkServerListApi(root.value, site.access_token)
  if (res.data.result.list && res.data.result.list.length > 0) {
    form.nodeId = res.data.result.list[0].nodeId;
    GetStorageMode(form.nodeId)
  }
}

const GetStorageMode = async (nodeId: string) => {
  if (!site || !site.access_token) return
  const res = await GetStorageModeApi(root.value, site.access_token, nodeId);
  if (res.status == 200 && res.data.code == 0) {
    form.mode = res.data.result.mode;
  }
}

const onSubmit = async () => {
  if (!site || !site.access_token) return
  const res = await SetStorageModeApi(root.value, site.access_token, form);
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: 'Modify Success',
      type: 'success',
      duration: 2000
    })
  } else {
    ElMessage({
      message: 'Modify Failed',
      type: 'error',
      duration: 2000
    })
  }
}

onMounted(() => {
  // console.log('StorageMode', site)
  Node();
})
</script>

<template>
  <div class="storage-mode">
    <div class="title">Storage Mode</div>
    <el-form label-width="120px" label-position="left" :model="form" style="width: 520px;">
      <el-form-item :label="'Storage Mode'">
        <el-select v-model="form.mode" style="width: 400px;">
          <el-option v-for="(item, index) in storageModeList" :key="index" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item class="submit">
        <el-button size="default" class="cannel">{{ 'cannel' }}</el-button>
        <el-button type="primary" size="default" @click="onSubmit">{{ 'save' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss">
.storage-mode {
  width: 100%;
  height: 100%;
  padding: 30px 40px;
  .title {
    font-size: 20px;
    margin-bottom: 20px;
  }
  :deep(.el-button) {
    width: 70px;
    height: 28px;
    span {
      font-size: 16px;
    }
  }
}
</style>