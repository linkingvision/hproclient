<script setup lang="ts">
import { ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus';
import { onMounted, ref } from 'vue';
import { GetWorkServerListApi, GetDiskPartitionApi, GetMetaStorageApi, SetMetaStorageApi } from '../../../api/storage';
import { useTempStore } from '../../../store/temp';
import { useSiteInfo } from '../../../store/site-info';

const tempStore = useTempStore();
const siteStore = useSiteInfo();

const site = siteStore.getSiteDevice(tempStore.tempIP)
const root = ref<string>('')
const nodeId = ref<string>('')
const tableData = ref<any[]>([])
const diskData = ref<any[]>([])

const Node = async () => {
  if (!site || !site.access_token) return;
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort)
  const res = await GetWorkServerListApi(root.value, site.access_token)
  if (res.data.result.list && res.data.result.list.length > 0) {
    nodeId.value = res.data.result.list[0].nodeId;
    GetMetaStorage();
  }
}

const GetMetaStorage = async () => {
  if (!site || !site.access_token) return;
  tableData.value = [];
  const arr = [];
  const res = await GetMetaStorageApi(root.value, site.access_token, nodeId.value)
  if (res.status == 200 && res.data.code == 0) {
    arr[0] = res.data.result;
  }
  const result = await GetDiskPartitionApi(root.value, site.access_token, nodeId.value);
  if (result.status == 200 && result.data.code == 0) {
    arr[0].partition = result.data.result.partition;
    diskData.value = result.data.result.partition;
    const checkedDisk = result.data.result.partition.find((item: any) => item.strDevice == res.data.result.strMetaPartitionDevice)
    // console.log(checkedDisk);
    if (checkedDisk) {
      arr[0].checkedDisk = checkedDisk;
    }
  }
  tableData.value = arr;
}

const editVisiable = ref<boolean>(false)
const editData = ref<any>({})
const editMeta = (row: any) => {
  editData.value = row;
  editVisiable.value = true;
}

const goback = () => {
  editVisiable.value = false;
}

const changeDisk = (device: string, point: string) => {
  editData.value.strMetaPartitionDevice = device;
  editData.value.strMetaPartitionMountpoint = point;
}

const submit = async () => {
  if (!site || !site.access_token) return;
  const params = {
    nodeId: nodeId.value,
    bEnableMetaStorage: editData.value.bEnableMetaStorage,
    strMetaPartitionDevice: editData.value.strMetaPartitionDevice,
    strMetaPartitionMountpoint: editData.value.strMetaPartitionMountpoint,
    nMetaRetentionInDay: Number(editData.value.nMetaRetentionInDay)
  }
  // console.log(root.value, site.access_token, params)
  const res = await SetMetaStorageApi(root.value, site.access_token, params);
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: '修改成功',
      type: 'success',
      duration: 2000
    })
    goback()
    GetMetaStorage()
  }
}

const CalculateCapacity = (value: any) => {
  if (value) {
    // 是不是小于1GB, 
    if ((value / 1024) < 1) {
      return (value / 1024).toFixed(1) + "GB";
    } else if ((value / 1024) > 1000) {
      // 是不是大于1000GB, 
      return (value / 1024 / 1024).toFixed(0) + "TB";
    } else {
      return (value / 1024).toFixed(0) + "GB";
    }
  }
}

onMounted(() => {
  Node()
})

</script>

<template>
  <div class="meta-storage">
    <el-table :data="tableData" style="width: 100%;" v-if="!editVisiable">
      <el-table-column :label="'Enable Matadata Storage'" align="center">
        <template #default="{row}">
          <el-switch v-model="row.bEnableMetaStorage" disabled></el-switch>
        </template>
      </el-table-column>
      <el-table-column prop="nMetaRetentionInDay" :label="'Metadata Retention Period'" align="center"></el-table-column>
      <el-table-column label="MetaPartition" align="center" width="300">
        <template #default="{row}">
          <div class="pregress-box" v-if="row.checkedDisk">
            <span class="disk">{{ row.strMetaPartitionDevice }}</span>
            <el-progress
              :percentage="Number((((row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) / row.checkedDisk.nTotalInM) * 100).toFixed(0))"
              :show-text="false"
            ></el-progress>
            <div class="count">
              <span class="used">{{ CalculateCapacity(row.checkedDisk.nTotalInM - row.checkedDisk.nFreeInM) }}</span>
               / 
              <span>{{ CalculateCapacity(row.checkedDisk.nTotalInM) }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column :label="'Operational'" align="center">
        <template #default="{row}">
          <el-button @click="editMeta(row)" type="text" size="small" class="edit-btn">{{ 'Edit' }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-else class="edit-meta">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback">{{ 'Meta Storage' }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ 'Edit' }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title">{{ 'Edit' }}</div>
      <el-form :form="editData" label-width="200px" label-position="left" style="margin-left: 10px;">
        <el-form-item :label="'Enable Metadata Storage'">
          <el-switch v-model="editData.bEnableMetaStorage"></el-switch>
        </el-form-item>
        <el-form-item :label="'Metadata Retention Period'" style="width: 600px;">
          <el-input v-model="editData.nMetaRetentionInDay" type="number"></el-input>
        </el-form-item>
      </el-form>
      <div class="disk-list">
        <div class="disk-item"
          :class="item.strDevice === editData.strMetaPartitionDevice ? 'active' : ''"
          v-for="(item, index) in editData.partition" :key="index"
          @click="changeDisk(item.strDevice, item.strMountpoint)">
          <div class="top">
            <span>{{ item.strDevice }} {{ item.strFstype }}</span>
            <span>Mount Point：{{ item.strMountpoint }}</span>
          </div>
          <el-progress
            :percentage="Number((((item.nTotalInM - item.nFreeInM) / item.nTotalInM) * 100).toFixed(0))"
            :show-text="false"
          ></el-progress>
          <div class="bottom">Used/All：<span class="used">{{ CalculateCapacity(item.bTotal - item.nFreeInM) }}</span>/{{ CalculateCapacity(item.nTotalInM) }}</div>
        </div>
      </div>
      <el-button type="primary" size="small" @click="submit">Save</el-button>
    </div>
  </div> 
</template>

<style scoped lang="scss">
.meta-storage {
  width: 100%;
  height: 100%;

  .edit-meta {
    padding: 20px 30px;
    .title {
      font-size: 18px;
      margin-bottom: 20px;
      margin: 20px 0;
    }
    .disk-list {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      .disk-item {
        width: 32%;
        margin-right: 20px;
        margin-bottom: 20px;
        height: 120px;
        border-radius: 4px;
        padding: 16px;
        cursor: pointer;
        .top {
          display: flex;
          justify-content: space-between;
        }
        .el-progress {
          margin: 10px 0;
        }
        :deep(.el-progress-bar__outer) {
          height: 14px !important;
          // background-color: rgba($color: #fff, $alpha: 0.2) !important;
        }
      }
    }
    .bread-header {
      width: 100%;
      height: 50px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
  }

  .pregress-box {
    width: 100%;
    display: flex;
    align-items: center;
    .disk {
      margin-right: 10px;
    }
    :deep(.el-progress) {
      flex: 1;
      margin-right: 10px;
      .el-progress-bar__outer {
        height: 8px !important;
      }
    }
    .used {
      color: #409EFF;
    }
  }
}
</style>