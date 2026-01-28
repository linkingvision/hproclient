<script setup lang="ts">
import { ref, onMounted, h } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight } from '@element-plus/icons-vue'
import { GetS3BucketsApi, AddS3BucketApi, EditS3BucketApi, DeleteS3BucketApi, GetWorkServerListApi } from '../../../api/storage'
import { useSiteInfo } from '../../../store/site-info';
import { useTempStore } from '../../../store/temp';
import StorageState from './components/StorageStatus.vue';

const siteStore = useSiteInfo();
const tempStore = useTempStore();

const site = siteStore.getSiteDevice(tempStore.tempIP)
const root = ref<string>('')

const tableData = ref<any[]>([]);
const addVisiable = ref<boolean>(false)
const editVisiable = ref<boolean>(false)
const stateVisible = ref<boolean>(false)
const addForm = ref<any>({
  // part: {
  //   nIndex: 0,
  //   strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
  //   strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
  //   strRegionName: 'region-a',
  //   strBucketName: 'bucket-a',
  //   strEndpoint: 'http://192.168.100.100:9000/'
  // },
  // update: false
  nIndex: 0,
  strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
  strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
  strRegionName: 'region-a',
  strBucketName: 'bucket-a',
  strEndpoint: 'http://192.168.100.100:9000/'
});
const editForm = ref<any>({});
const hasIndex = ref<number[]>([])
const nodeId = ref<string>('')

const Node = async () => {
  if (!site || !site.access_token) return;
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort)
  const res = await GetWorkServerListApi(root.value, site.access_token);
  if (res.status == 200 && res.data.code == 0) {
    nodeId.value = res.data.result.list[0].nodeId;
    GetS3Buckets();
  }
}

const GetS3Buckets = async () => {
  if (!site || !site.access_token) return;
  const res = await GetS3BucketsApi(root.value, site.access_token, nodeId.value);
  hasIndex.value = [];
  if (res.status === 200 && res.data.code === 0) {
    if (res.data.result.bucket) {
      tableData.value = res.data.result.bucket.map((item: any) => {
        hasIndex.value.push(item.nIndex)
        return {
          ...item,
          nodeId: nodeId.value
        }
      })
    } else {
      tableData.value = [];
    }
  }
}

const indexDisabled = ref<boolean>(true)
const add = () => {
  addForm.value.nIndex = findMissingNumber(hasIndex.value)
  addVisiable.value = true;
}
const addSubmit = async () => {
  if (!site || !site.access_token) return;
  addForm.value.nIndex = Number(addForm.value.nIndex)
  addForm.value.nodeId = nodeId.value;
  const res = await AddS3BucketApi(root.value, site.access_token, addForm.value)
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: 'Add Successfully!',
      type: 'success',
      duration: 2000
    })
    goback('add');
    GetS3Buckets()
    addForm.value = {
      nIndex: 0,
      strAccessKey: 'bMoLv2fz1sGtmeNgwyCY',
      strSecretKey: 'xvfpS6Ps6Cni0ab8so0obgpn2r0Ryycc7Ye2uy1I',
      strRegionName: 'region-a',
      strBucketName: 'bucket-a',
      strEndpoint: 'http://192.168.100.100:9000/'
    }
  } else {
    ElMessage({
      message: 'Add Failed!',
      type: 'error',
      duration: 2000
    })
  }
}

const edit = (row: any) => {
  editForm.value = JSON.parse(JSON.stringify(row))
  editVisiable.value = true;
}
const editSubmit = async () => {
  if (!site || !site.access_token) return;
  editForm.value.nIndex = Number(editForm.value.nIndex)
  const res = await EditS3BucketApi(root.value, site.access_token, editForm.value)
  if (res.status == 200 && res.data.code == 0) {
    ElMessage({
      message: 'Modify Successfully!',
      type: 'success',
      duration: 2000
    })
    goback('edit');
    GetS3Buckets()
  } else {
    ElMessage({
      message: 'Modify Failed!',
      type: 'error',
      duration: 2000
    })
  }
}

const delRow = (row: any) => {
  const params = {
    nodeId: nodeId.value,
    nIndex: Number(row.nIndex),
    strBucketName: row.strBucketName,
    strEndpoint: row.strEndpoint
  }
  ElMessageBox.prompt('Are you sure to remove this option? after this operation succeeds, it cannot be restored', 'Prompt', {
    confirmButtonText: 'OK',
    cancelButtonText: 'Cancel',
    icon: h('i', {class: 'iconfont icon-tishi1 warn-tip'}),
    customClass: 'DeleteConfirm',
    cancelButtonClass: 'warn-cannel-btn',
    confirmButtonClass: 'warn-confirm-btn',
    inputPlaceholder: 'Please enter the index to delete.',
    inputValidator: (value) => {
      return value === row.nIndex.toString() ? true : 'Does not match the index to be deleted, please re-enter.';
    }
  }).then(async () => {
    if (!site || !site.access_token) return;
    const res = await DeleteS3BucketApi(root.value, site.access_token, params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: 'Delete Successfully!',
        type: 'success',
        duration: 2000
      })
      GetS3Buckets()
    } else {
      ElMessage({
        message: 'Delete Failed!',
        type: 'error',
        duration: 2000
      })
    }
  })
}

const highSetting = () => {
  indexDisabled.value = !indexDisabled.value;
}

const crumb = ref<string>('')
const activeObjPartitions = ref<any>()
const openState = (row: any) => {
  crumb.value = row.strBucketName;
  activeObjPartitions.value = row;
  stateVisible.value = true;
}

const goback = (type: string) => {
  if (type == 'add') {
    addVisiable.value = false;
    indexDisabled.value = true;
  } else if (type == 'edit') {
    editVisiable.value = false;
    indexDisabled.value = true;
  } else if (type == 'state') {
    stateVisible.value = false;
    crumb.value = '';
  }
}

const findMissingNumber = (arr: number[]) => {
  if (arr.length == 0) return 1;  // 如果数组为空，返回1
  const sortedUnique = [...new Set(arr)].sort((a, b) => a-b); // 对数组排序并去重
  for (let i = 1; i <= sortedUnique.length + 1; i++) {  // 从1开始查找第一个缺失的数字
    if (sortedUnique[i - 1] !== i) {
      return i;
    }
  }
  return sortedUnique.length + 1;
}
onMounted(() => {
  Node()
})
</script>

<template>
  <div class="s3-storage">
    <!-- 新增 -->
    <div v-if="addVisiable && !editVisiable && !stateVisible" class="add-s3">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('add')">S3 Storage</el-breadcrumb-item>
          <el-breadcrumb-item>Add</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 510px; margin: 20px 0; display: flex; justify-content: space-between;">
        <span style="font-size: 18px;">Add</span>
        <el-button size="small" type="primary" class="normal" @click="highSetting">Advanced Features</el-button>
      </div>
      <el-form :model="addForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item label="AccessKey" style="width: 500px;">
          <el-input v-model="addForm.strAccessKey"></el-input>
        </el-form-item>
        <el-form-item label="SecretKey" style="width: 500px;">
          <el-input v-model="addForm.strSecretKey"></el-input>
        </el-form-item>
        <el-form-item label="RegionName" style="width: 500px;">
          <el-input v-model="addForm.strRegionName"></el-input>
        </el-form-item>
        <el-form-item label="BucketName" style="width: 500px;">
          <el-input v-model="addForm.strBucketName"></el-input>
        </el-form-item>
        <el-form-item label="Endpoint" style="width: 500px;">
          <el-input v-model="addForm.strEndpoint"></el-input>
        </el-form-item>
        <el-form-item label="Index" style="width: 500px;">
          <el-input v-model="addForm.nIndex" :disabled="indexDisabled"></el-input>
        </el-form-item>
        <el-form-item style="width: 500px;">
          <el-button type="primary" size="small" @click="addSubmit">Save</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 编辑 -->
    <div v-if="editVisiable && !addVisiable && !stateVisible" class="edit-s3">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('edit')">S3 Storage</el-breadcrumb-item>
          <el-breadcrumb-item>Edit</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="width: 510px; margin: 20px 0; display: flex; justify-content: space-between;">
        <span style="font-size: 18px;">Edit</span>
        <!-- <el-button size="small" class="normal" @click="highSetting">{{ t('Configuration.conf_advanced_features') }}</el-button> -->
      </div>
      <el-form :model="editForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item label="AccessKey" style="width: 500px;">
          <el-input v-model="editForm.strAccessKey"></el-input>
        </el-form-item>
        <el-form-item label="SecretKey" style="width: 500px;">
          <el-input v-model="editForm.strSecretKey"></el-input>
        </el-form-item>
        <el-form-item label="RegionName" style="width: 500px;">
          <el-input v-model="editForm.strRegionName"></el-input>
        </el-form-item>
        <el-form-item label="BucketName" style="width: 500px;">
          <el-input v-model="editForm.strBucketName"></el-input>
        </el-form-item>
        <el-form-item label="Endpoint" style="width: 500px;">
          <el-input v-model="editForm.strEndpoint"></el-input>
        </el-form-item>
        <!-- <el-form-item label="Index" style="width: 500px;">
          <el-input v-model="editForm.nIndex" :disabled="indexDisabled"></el-input>
        </el-form-item> -->
        <el-form-item style="width: 500px;">
          <el-button type="primary" size="small" @click="editSubmit">Save</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div v-if="stateVisible && !addVisiable && !editVisiable" class="s3-state">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('state')">{{ 'S3 Storage' }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ crumb }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <StorageState router="S3Storage" :objPartitions="activeObjPartitions"></StorageState>
    </div>

    <!-- 主页 -->
    <div v-if="!addVisiable && !editVisiable && !stateVisible" class="s3-header">
      <el-button type="primary" size="small" @click="add">Add</el-button>
    </div>
    <el-table v-if="!addVisiable && !editVisiable && !stateVisible" :data="tableData" style="width: 100%;">
      <el-table-column label="nIndex" prop="nIndex" width="100" align="center"></el-table-column>
      <el-table-column label="AccessKey" prop="strAccessKey" show-overflow-tooltip width="140" align="center"></el-table-column>
      <el-table-column label="SecretKey" prop="strSecretKey" show-overflow-tooltip width="140" align="center"></el-table-column>
      <el-table-column label="RegionName" prop="strRegionName" width="140" align="center"></el-table-column>
      <el-table-column label="BucketName" prop="strBucketName" width="140" align="center"></el-table-column>
      <el-table-column label="Endpoint" prop="strEndpoint" align="center"></el-table-column>
      <el-table-column :label="'Mount'" width="120" align="center">
        <template #default="{ row }">
          <!-- <el-switch v-model="row.bMount" disabled></el-switch> -->
           <span v-if="row.bMount" style="color: #06D20B;">Online</span>
           <span v-else style="color: #FE1100;">Offline</span>
        </template>
      </el-table-column>
      <el-table-column :label="'Start Time'" prop="strStartTime" align="center"></el-table-column>
      <el-table-column :label="'End Time'" prop="strEndTime" align="center"></el-table-column>
      <el-table-column :label="'Opeartional'" align="center" width="240">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="openState(row)">Status</el-button>
          <el-button type="text" size="small" @click="edit(row)">Edit</el-button>
          <el-button type="text" size="small" @click="delRow(row)">Delete</el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped lang="scss">
.s3-storage {
  width: 100%;
  height: 100%;
  .s3-state {
    width: 100%;
    height: 100%;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
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
  .s3-header {
    padding: 10px;
  }
  .add-s3, .edit-s3 {
    padding: 20px;
    .bread-header {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      // background-color: #aaa;
      border-bottom: 1px solid #313131;
      .can-click {
        cursor: pointer;
      }
    }
  }
}
</style>