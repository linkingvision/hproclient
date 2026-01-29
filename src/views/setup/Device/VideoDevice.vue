<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, nextTick } from 'vue';
import { GetDeviceListApi, GetDevFileApi, GetDevPartitionApi, AddOnfstgApi, AddRTSPApi, AddFileApi, GetNodeApi, EditDevApi, DelDeviceApi } from '../../../api/device';
import type { editDevice, delDeviceParams } from '../../../api/device'
import { Search,ArrowRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n';
import { ElMessage, ElMessageBox  } from 'element-plus';
import uuid from '@/assets/js/uuid.js';
import { H5jsEvent } from '@/assets/js/h5jsevent.js'
import { useTempStore } from '../../../store/temp';
import { useSiteInfo } from '../../../store/site-info';


const { t } = useI18n()
const tempStore = useTempStore();
const siteStore = useSiteInfo();

const site = siteStore.getSiteDevice(tempStore.tempIP)
const root = ref<string>('')

const options = reactive<any[]>([{
  value: 'H5_DEV_ONFSTG',
  label: 'H5_DEV_ONFSTG'
}, {
  value: 'H5_DEV_RTSP',
  label: 'H5_DEV_RTSP'
}, {
  value: 'H5_DEV_FILE',
  label: 'H5_DEV_FILE'
}])
const filterText = ref<string>('');
const addVisiable = ref<boolean>(false);
const editVisiable = ref<boolean>(false);
const onvifVisiable = ref<boolean>(true);
const tableData = ref<any[]>([]);
const currentPage = ref<number>(1);
const pageSize = ref<number>(10);
const total = ref<number>(0)
let devData = reactive<any[]>([])
const filterText1 = ref<string>('')
const treeProps = reactive<any>({
  value: 'devPartitionId',
  label: 'devPartitionName',
  children: 'children'
})
let fileData = reactive<any[]>([]);
const filterText2 = ref<string>('')
const fileTreeProps = reactive<any>({
  value: 'id',
  label: 'Url',
  children: 'children'
})
const rtspSelectData = [{
  value: 'H5_RTSP_TCP',
  label: 'H5_RTSP_TCP'
}, {
  value: 'H5_RTSP_UDP',
  label: 'H5_RTSP_UDP'
}, {
  value: 'H5_RTSP_AUTO',
  label: 'H5_RTSP_AUTO'
}]
const addForm = ref({
  nodeId: '',
  name: 'Device1',
  token: '',
  user: 'admin',
  password: 'admin12345',
  ip: '192.168.100.1',
  port: '80',
  audio: true,
  sandbox: false,
  maxchannel: 0,
  update: false,
  rbuffertime: 200,
  Type: 'H5_DEV_ONFSTG',
  devPartitionName: '',
  devPartitionId: '',
  strUrl: 'rtsp://192.168.1.1/stream',
  bEnableUrlSub: false,
  strUrlSub: 'rtsp://192.168.1.1/stream2',
  h5RTSPConnectType: 'H5_RTSP_AUTO',
  description: 'description',
  DevFile_Url: '',
  DevFile_Name: ''
})
const addTreeRef = ref();
const addFileTreeRef = ref();


const addHandleCheck = (data: any, info: any) => {
  const currentKey = data.devPartitionId;
  addTreeRef.value.setCheckedKeys([]);  // 先取消所有节点的选中
  addTreeRef.value.setCheckedKeys([currentKey]) // 再仅选中当前节点
  addForm.value.devPartitionId = currentKey;
  addForm.value.devPartitionName = data.devPartitionName;
}
const onQueryChanged = (query: string) => {
  addTreeRef.value!.filter(query)
}
const filterMethod = (query: string, node: any) => {
  return node.devPartitionName!.includes(query)
}
const addFileHandleCheck = () => {
  const checkedNodes = addFileTreeRef.value.getCheckedNodes();
  // console.log('选中的File节点 =>', checkedNodes)
  let url = '';
  let name = '';
  checkedNodes.forEach((item: any) => {
    if (!item.children) {
      url += item.Url;
      name += item.Url.substr(item.Url.lastIndexOf("\\") + 1) + ';'
    }
  })
  addForm.value.DevFile_Url = url;
  addForm.value.DevFile_Name = name
}
const onQueryChanged2 = () => {
  addFileTreeRef.value.filter(filterText2.value);
}
const filterMethod2 = (value: any, data: any) => {
  if (!value) return true;
  const filename = data.Url.substr(data.Url.lastIndexOf("\\") + 1);
  return filename.toLowerCase().includes(value.toLowerCase());
}

const GetDeviceList = async () => {
  if (!site || !site.access_token) return;
  const res = await GetDeviceListApi(root.value, site.access_token)
  // console.log(res)
  if (res.status == 200 && res.data.code == 0) {
    if (res.data.result.list && res.data.result.list.length) {
      tableData.value = res.data.result.list;
      total.value = res.data.result.list.length
    }
    Refresh()
  }
}

const GetDevPartition = async () => {
  if (!site || !site.access_token) return;
  const res = await GetDevPartitionApi(root.value, site.access_token);
  if (res.status == 200 && res.data.code === 0) {
    // console.log('GetDevPartition => ', res)
    devData = res.data.result;
  }
}

const DevFile = async () => {
  if (!site || !site.access_token) return;
  const res = await GetDevFileApi(root.value, site.access_token);
  if (res.status == 200 && res.data.code == 0) {
    // console.log('DevFileList => ', res)
    fileData = [];
    const result = res.data.result;
    const srcGroup: any = { children: [] };
    if (!result) return;
    for (let i = 0; i < result.length; i++) {
      srcGroup.Url = '视频列表';
      srcGroup.id = i;
      let url = {
        Url: result[i],
        id: i + '-' + i
      }
      srcGroup.children.push(url)
    }
    fileData.push(srcGroup)
  }
  // console.log('fileData =>', fileData)
}

const add = () => {
  addVisiable.value = true;
  // console.log('add ==>',devData[0]?.devPartitionId)
  addForm.value.devPartitionId = devData[0]?.devPartitionId;
  addForm.value.devPartitionName = devData[0]?.devPartitionName;
  nextTick(() => {
    addTreeRef.value.setCheckedKeys([devData[0]?.devPartitionId || ''])
  })
  
}

const addOnSubmit = async () => {
  addForm.value.token = uuid(4, 16).toLowerCase();
  addForm.value.maxchannel = Number(addForm.value.maxchannel);
  addForm.value.rbuffertime = Number(addForm.value.rbuffertime)
  const resetData = {
    nodeId: '',
    name: 'Device1',
    token: '',
    user: 'admin',
    password: 'admin12345',
    ip: '192.168.100.1',
    port: '80',
    audio: true,
    sandbox: false,
    maxchannel: 0,
    update: false,
    rbuffertime: 200,
    Type: 'H5_DEV_ONFSTG',
    devPartitionName: 'root',
    devPartitionId: '',
    strUrl: 'rtsp://192.168.1.1/stream',
    bEnableUrlSub: false,
    strUrlSub: 'rtsp://192.168.1.1/stream2',
    h5RTSPConnectType: 'H5_RTSP_AUTO',
    description: 'description',
    DevFile_Url: '',
    DevFile_Name: ''
  }
  if (addForm.value.Type == 'H5_DEV_ONFSTG') {
    const params = {
      name: addForm.value.name,
      username: addForm.value.user,
      password: addForm.value.password,
      devIP: encodeURIComponent(addForm.value.ip),
      devPort: encodeURIComponent(addForm.value.port),
      enableAudio: addForm.value.audio,
      sandbox: addForm.value.sandbox,
      maxChannel: Number(addForm.value.maxchannel),
      rBufferTime: Number(addForm.value.rbuffertime),
      description: addForm.value.description,
      enabled: true,
      devPartitionId: Number(addForm.value.devPartitionId),
      nodeId: encodeURIComponent(addForm.value.nodeId)
    }
    if (!site || !site.access_token) return;
    const res = await AddOnfstgApi(root.value, site.access_token, params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_add_successfully'),
        type: 'success',
        duration: 2000
      })
      goback('add');
      GetDeviceList();
      addForm.value = resetData
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_add_failed'),
        type: 'error',
        duration: 2000
      })
    }
  } else if (addForm.value.Type == 'H5_DEV_RTSP') {
    const params = {
      nodeId: encodeURIComponent(addForm.value.nodeId),
      setToken: false,
      token: addForm.value.token,
      name: addForm.value.name,
      username: addForm.value.user,
      password: addForm.value.password,
      enableAudio: addForm.value.audio,
      description: addForm.value.description,
      enabled: true,
      devPartitionId: Number(addForm.value.devPartitionId),
      strUrl: addForm.value.strUrl,
      bEnableUrlSub: addForm.value.bEnableUrlSub,
      strUrlSub: addForm.value.strUrlSub,
      h5RTSPConnectType: addForm.value.h5RTSPConnectType,
    }
    if (!site || !site.access_token) return;
    const res = await AddRTSPApi(root.value, site.access_token, params)
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_add_successfully'),
        type: 'success',
        duration: 2000
      })
      goback('add');
      GetDeviceList();
      addForm.value = resetData
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_add_failed'),
        type: 'error',
        duration: 2000
      })
    }
  } else if (addForm.value.Type == 'H5_DEV_FILE') {
    const params = {
      nodeId: encodeURIComponent(addForm.value.nodeId),
      // setToken: true,
      // token: addForm.value.token,
      name: addForm.value.name,
      strUrl: addForm.value.DevFile_Url,
      enableAudio: addForm.value.audio,
      description: addForm.value.description,
      enabled: true,
      devPartitionId: Number(addForm.value.devPartitionId)
    }
    if (!site || !site.access_token) return;
    const res = await AddFileApi(root.value, site.access_token, params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_add_successfully'),
        type: 'success',
        duration: 2000
      })
      goback('add');
      GetDeviceList();
      addForm.value = resetData
    } else {
      ElMessage({
        message: t('CommTableEdit.comm_add_failed'),
        type: 'error',
        duration: 2000
      })
    }
  }
}

const filterText3 = ref<string>('')
const filterText4 = ref<string>('')
const editTreeRef = ref();
const editFileTreeRef = ref();
const editForm = ref<any>({})

const findNameById = (id: number, data: any): string => {
  for (const item of data) {
    if (item.devPartitionId === id) {
      return item.devPartitionName;
    }
    if (item.children && item.children.length > 0) {
      const result = findNameById(id, item.children);
      if (result) return result;
    }
  }
  return '';
}
const findfileByUrl = (Url: string, data: any): string => {
  for (const item of data) {
    if (item.Url == Url) {
      return item.id
    }
    if (item.children && item.children.length > 0) {
      const result = findfileByUrl(Url, item.children);
      if (result) return result;
    }
  }
  return '';
}

const edit = (row: any) => {
  editVisiable.value = true;
  editForm.value = {...row}
  // console.log(editForm.value)
  editForm.value.devPartitionName = findNameById(row.devPartitionId, devData);
  nextTick(() => {
    editTreeRef.value.setCheckedKeys([row.devPartitionId])
  })
  if (row.type === 'H5_DEV_FILE') {
    const checkArr = row.strUrl.split(';')
    // console.log(checkArr)
    // checkArr.pop();
    var strUrl = '';
    for (let i = 0; i < checkArr.length; i++) {
      strUrl += checkArr[i].substr(checkArr[i].lastIndexOf("\\") + 1) + ';';
    }
    editForm.value["DevFile_Name"] = strUrl;
    editForm.value["DevFile_Url"] = row.strUrl;
    nextTick(() => {
      const arr: string[] = []
      checkArr.forEach((item: any) => {
        arr.push(findfileByUrl(item, fileData))
      })
      editFileTreeRef.value.setCheckedKeys(arr)
    })
  }
}
const onQueryChanged3 = (query: string) => {
  editTreeRef.value!.filter(query)
}
const filterMethod3 = (query: string, node: any) => {
  return node.devPartitionName!.includes(query)
}
const editHandleCheck = (data: any, info: any) => {
  const currentKey = data.devPartitionId;
  editTreeRef.value.setCheckedKeys([]);  // 先取消所有节点的选中
  editTreeRef.value.setCheckedKeys([currentKey]) // 再仅选中当前节点
  editForm.value.devPartitionId = currentKey;
  editForm.value.devPartitionName = data.devPartitionName;
}
const onQueryChanged4 = () => {
  editFileTreeRef.value.filter(filterText4.value);
}
const editFileHandleCheck = () => {
  const checkedNodes = editFileTreeRef.value.getCheckedNodes();
  // console.log('选中的File节点 =>', checkedNodes)
  let url = '';
  let name = '';
  checkedNodes.forEach((item: any) => {
    if (!item.children) {
      url += item.Url + ';';
      name += item.Url.substr(item.Url.lastIndexOf("\\") + 1) + ';'
    }
  })
  editForm.value.DevFile_Url = url;
  editForm.value.DevFile_Name = name;
}

const editOnSubmit = async () => {
  // const res = await AddDeviceOnfStgApi(editForm.value);
  // if (res.status == 200 && res.data.code == 'HPRO_CODE_OK') {
  //   ElMessage({
  //     message: t('CommTableEdit.comm_modify_success'),
  //     type: 'success',
  //     duration: 2000
  //   })
  //   goback('edit');
  //   GetDeviceList();
  // } else {
  //   ElMessage({
  //     message: t('CommTableEdit.comm_modify_failed'),
  //     type: 'error',
  //     duration: 2000
  //   })
  // }
  const params: editDevice = {
    nodeId: editForm.value.nodeId,
    devId: Number(editForm.value.devId),
    name: editForm.value.name,
    enableAudio: editForm.value.enableAudio,
    description: editForm.value.description,
    enabled: true,
    devPartitionId: Number(editForm.value.devPartitionId),
  }
  if (editForm.value.type === 'H5_DEV_ONFSTG') {
    params.devIP = editForm.value.devIP;
    params.devPort = editForm.value.devPort;
    params.maxChannel = Number(editForm.value.maxChannel);
    params.username = editForm.value.username;
    params.password = editForm.value.password;
    params.rBufferTime = Number(editForm.value.rBufferTime);
    params.sandbox = editForm.value.sandbox;
  } else if (editForm.value.type == 'H5_DEV_RTSP') {
    params.bEnableUrlSub = editForm.value.bEnableUrlSub;
    params.devIP = editForm.value.devIP;
    params.devPort = editForm.value.devPort;
    params.h5RTSPConnectType = editForm.value.h5RTSPConnectType;
    params.strUrl = editForm.value.strUrl;
    params.strUrlSub = editForm.value.strUrlSub;
    params.username = editForm.value.username;
    params.password = editForm.value.password;
  } else if (editForm.value.type == 'H5_DEV_FILE') {
    params.strUrl = editForm.value.DevFile_Url;
  }
  // console.log(editForm.value.type, '=>>', params);
  if (!site || !site.access_token) return;
  const res = await EditDevApi(root.value, site.access_token, params);
  if (res.status == 200 && res.data.code == 0) {
     ElMessage({
      message: t('CommTableEdit.comm_modify_success'),
      type: 'success',
      duration: 2000
    })
    goback('edit');
    GetDeviceList();
  } else {
    ElMessage({
      message: t('CommTableEdit.comm_modify_failed'),
      type: 'error',
      duration: 2000
    })
  }
}

const delRow = (id: string) => {
  ElMessageBox.confirm(
    t('CommTableEdit.comm_delete_confirm'),
    t('CommTableEdit.comm_prompt'),
    {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      cancelButtonClass: 'cancel',
      type: 'warning'
    }
  ).then(async () => {
    const params: delDeviceParams = {
      ids: [Number(id)]
    }
    if (!site || !site.access_token) return;
    const res = await DelDeviceApi(root.value, site.access_token, params);
    if (res.status == 200 && res.data.code == 0) {
        ElMessage({
          message: t('CommTableEdit.comm_delete_successfully'),
          type: 'success',
          duration: 2000
        })
        GetDeviceList();
    }
  }).catch(() => {

  })
  
}

const selectRows = ref<number[]>([])
const delAll = () => {
  if (selectRows.value.length == 0) return;
  ElMessageBox.confirm(
    t('CommTableEdit.comm_delete_confirm'),
    t('CommTableEdit.comm_prompt'),
    {
      confirmButtonText: t('CommTableEdit.comm_ok'),
      cancelButtonText: t('CommTableEdit.comm_cancel'),
      type: 'warning'
    }
  ).then(async () => {
    // console.log(selectRows.value)
    const params = {
      ids: selectRows.value
    }
    if (!site || !site.access_token) return;
    const res = await DelDeviceApi(root.value, site.access_token, params);
    if (res.status == 200 && res.data.code == 0) {
      ElMessage({
        message: t('CommTableEdit.comm_delete_successfully'),
        type: 'success',
        duration: 2000
      })
      GetDeviceList()
    }
  })
}

const selectChange = (arr: any[]) => {
  selectRows.value = [];
  arr.forEach(item => {
    selectRows.value.push(item.devId)
  })
  // console.log(selectRows.value)
}

const handleSizeChange = (val: number) => {

}

const handleCurrentChange = (val: number) => {

}

const goback = (type: string) => {
  if (type === 'add') {
    addVisiable.value = false;
  } else if (type === 'edit') {
    editVisiable.value = false;
    editForm.value = {};
  }
}

const onvifList = ref<any[]>([])
const search = ref<string>('')
const event = ref<any>()
const onvifRef = ref<any>()
const selectOnvif = ref<any>({})

const selectChange2 = (arr: any) => {
  if (arr.length > 1) {
    onvifRef.value.clearSelection();
    onvifRef.value.toggleRowSelection(arr[arr.length - 1]);
  }
  selectOnvif.value = arr[arr.length - 1];
  if (!selectOnvif.value) {
    selectOnvif.value = {}
  }
  // console.log(selectOnvif.value)
}
const onvifsearchAdd = () => {
  if ((Object.keys(selectOnvif.value).length === 0)) return;
  // addForm.value.token = uuid(4)
  addForm.value.ip = selectOnvif.value.strIp;
  addForm.value.port = selectOnvif.value.strPort;
  addVisiable.value = true;
}
const Refresh = () => {
  if (event.value) {
    event.value.disconnect();
    delete event.value;
    event.value = undefined;
    onvifList.value = []
  }
  onvifsearch()
}
const onvifsearch = () => {
  const pbconf = {
    callback: EventbackCB
  }
  if (!site) return
  const conf = {
    protocol: site.enableHttps ? 'https:' : 'http:',
    host: site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort),
    rootpath: '/',
    apipath: "uapi/v1/h5sonvifsearchapi",
    userdata: null,
    session: site.session,
    consolelog: 'true',
    pbconf
  }
  event.value = new H5jsEvent(conf);
  event.value.connect()
}
const EventbackCB = (event: any, userdata: any) => {
  const newEvent = JSON.parse(event);
  // console.log(newEvent.strIp, tableData.value)
  const existsInOnvif = onvifList.value.some(item => item.strIp === newEvent.strIp);
  const existsInTableData1 = tableData.value.some(item => item.type === 'H5_DEV_ONFSTG' && item.devIP == newEvent.strIp)
  // console.log('EventbackCB =>', existsInOnvif, existsInTableData1)
  if (!existsInOnvif && !existsInTableData1) {
    const index = onvifList.value.length + 1;
    newEvent.index = index;
    onvifList.value.push(newEvent)
  }
}

const Node = async () => {
  if (!site || !site.access_token) return
  const res = await GetNodeApi(root.value, site.access_token);
  if (res.status == 200 && res.data.code == 0) {
    addForm.value.nodeId = res.data.result.list[0].nodeId;
  }
}

onMounted(() => {
  // console.log('Device SDK', site)
  if (!site || !site.access_token) return;
  root.value = (site.enableHttps ? 'https://' : 'http://') + site.ipv4Address + ':' + (site.enableHttps ? site.httpsPort : site.httpPort)
  Node();
  GetDeviceList()
  GetDevPartition()
  DevFile();
  // console.log('devData =>', devData)
})
onBeforeUnmount(() => {
  if (event.value) {
    event.value.disconnect();
    delete event.value;
    event.value = undefined;
    onvifList.value = []
  }
})
</script>

<template>
  <div class="device-sdk">
    <!-- 添加表单 -->
    <div v-if="addVisiable && !editVisiable" class="add-device">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('add')">{{ t('Device.device_video_device') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t("CommTableEdit.comm_add") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="margin: 20px 0;">
        <span style="font-size: 18px;">{{ $t("CommTableEdit.comm_add") }}</span>
      </div>
      <div style="display: flex; ">
        <el-form :model="addForm" label-width="120px" label-position="left" style="margin-left: 10px;" class="form-left">
          <el-form-item :label="t('CommTableEdit.comm_table_type')" style="width: 500px;">
            <el-select v-model="addForm.Type">
              <el-option v-for="(item, index) in options" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_FILE'" :label="t('Device.device_audio')" style="width: 500px;">
              <el-switch v-model="addForm.audio"></el-switch>
          </el-form-item>
          <el-form-item :label="t('Common.comm_device_partition')" style="width: 500px;" class="form-item-tree">
            <el-input
              v-model="addForm.devPartitionName"
              style="width: 100%"
              disabled
              placeholder="Please input"
            />
            <div class="tow_node">
              <el-input v-model="filterText1" @input="onQueryChanged" style="width: 100%" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
              <el-tree-v2
                style="width: 100%;"
                :data="devData"
                :props="treeProps"
                check-strictly
                show-checkbox
                :height="350"
                :filter-method="filterMethod"
                @check="addHandleCheck"
                ref="addTreeRef">
                <template #default="{ node }">
                  <i class="iconfont icon-gen"></i>
                  <span style="margin-left: 5px; font-size: 14px;">{{ node.data.devPartitionName }}</span>
                </template>
              </el-tree-v2>
            </div>
          </el-form-item>
        </el-form>
        <el-form :model="addForm" label-width="120px" label-position="left" style="margin-left: 50px;"  class="form-right">
          <el-form-item :label="t('CommTableEdit.comm_table_name')" style="width: 500px;">
            <el-input v-model="addForm.name"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG' || addForm.Type == 'H5_DEV_RTSP'" :label="t('Login.login_username')" style="width: 500px;">
            <el-input v-model="addForm.user"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG' || addForm.Type == 'H5_DEV_RTSP'" :label="t('Login.login_password')" style="width: 500px;">
            <el-input v-model="addForm.password" type="password" show-password></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG'" :label="t('CommTableEdit.comm_table_ip')" style="width: 500px;">
            <el-input v-model="addForm.ip"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG'" :label="t('CommTableEdit.comm_table_port')" style="width: 500px;">
            <el-input v-model="addForm.port"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_RTSP'" label="URL" style="width: 500px;">
            <el-input v-model="addForm.strUrl"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_dev_sub_stream')" style="width: 500px;">
            <el-switch v-model="addForm.bEnableUrlSub"></el-switch>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_RTSP' && addForm.bEnableUrlSub" :label="t('Configuration.conf_substream_url')" style="width: 500px;">
            <el-input v-model="addForm.strUrlSub"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_connection_type')" style="width: 500px;">
            <el-select v-model="addForm.h5RTSPConnectType">
              <el-option v-for="(item, index) in rtspSelectData" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG' || addForm.Type == 'H5_DEV_RTSP'" :label="t('Device.device_audio')" style="width: 500px;">
              <el-switch v-model="addForm.audio"></el-switch>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_FILE'" :label="t('Configuration.conf_description')" style="width: 500px;">
            <el-input v-model="addForm.description"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG'" :label="t('Device.device_sandbox')" style="width: 500px;">
            <el-switch v-model="addForm.sandbox"></el-switch>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG'" :label="t('Device.device_max_channels')" style="width: 500px;">
            <el-input v-model="addForm.maxchannel"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG'" :label="t('Device.device_buffertime')" style="width: 500px;">
            <el-input v-model="addForm.rbuffertime"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_ONFSTG' || addForm.Type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_description')" style="width: 500px;">
            <el-input v-model="addForm.description"></el-input>
          </el-form-item>
          <el-form-item v-if="addForm.Type == 'H5_DEV_FILE'" :label="t('Configuration.conf_file_list')" style="width: 500px;"  class="form-item-tree">
            <el-input
              v-model="addForm.DevFile_Name"
              style="width: 100%"
              disabled
              placeholder="Please Check"
            />
            <div class="tow_node">
              <el-input v-model="filterText2" @input="onQueryChanged2" style="width: 100%" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
              <el-tree-v2
                style="width: 100%;"
                :data="fileData"
                :props="fileTreeProps"
                show-checkbox
                :height="350"
                :filter-method="filterMethod2"
                @check="addFileHandleCheck"
                ref="addFileTreeRef">
                <template #default="{ node }">
                  <span style="margin-left: 5px; font-size: 14px;">{{ node.data.Url.substr(node.data.Url.lastIndexOf("\\") + 1) }}</span>
                </template>
              </el-tree-v2>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <el-form :model="addForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item style="width: 500px;">
          <el-button class="cancel" @click="goback('add')">{{ t('CommTableEdit.comm_cancel') }}</el-button>
          <el-button type="primary" @click="addOnSubmit">{{ t('CommTableEdit.comm_save') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <!-- 编辑表单 -->
    <div v-if="!addVisiable && editVisiable" class="edit-device">
      <div class="bread-header">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item class="can-click" @click="goback('edit')">{{ t('Device.device_video_device') }}</el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t("CommTableEdit.comm_edit") }}</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="title" style="margin: 20px 0;">
        <span style="font-size: 18px;">{{ $t("CommTableEdit.comm_edit") }}</span>
      </div>
      <div style="display: flex; ">
        <el-form :model="editForm" label-width="120px" label-position="left" style="margin-left: 10px;" class="form-left">
          <el-form-item :label="t('CommTableEdit.comm_table_type')" style="width: 500px;">
            <el-select v-model="editForm.type" disabled>
              <el-option v-for="(item, index) in options" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_FILE'" :label="t('Device.device_audio')" style="width: 500px;">
              <el-switch v-model="editForm.enableAudio"></el-switch>
          </el-form-item>
          <el-form-item :label="t('Common.comm_device_partition')" style="width: 500px;" class="form-item-tree">
            <el-input
              v-model="editForm.devPartitionName"
              style="width: 100%"
              disabled
              placeholder="Please input"
            />
            <div class="tow_node">
              <el-input v-model="filterText3" @input="onQueryChanged3" style="width: 100%" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
              <el-tree-v2
                style="width: 100%;"
                :data="devData"
                :props="treeProps"
                check-strictly
                show-checkbox
                :height="350"
                :filter-method="filterMethod3"
                @check="editHandleCheck"
                ref="editTreeRef">
                <template #default="{ node }">
                  <i class="iconfont icon-gen"></i>
                  <span style="margin-left: 5px; font-size: 14px;">{{ node.data.devPartitionName }}</span>
                </template>
              </el-tree-v2>
            </div>
          </el-form-item>
        </el-form>
        
        <el-form :model="editForm" label-width="120px" label-position="left" style="margin-left: 50px;" class="form-right">
          <el-form-item :label="t('CommTableEdit.comm_table_name')" style="width: 500px;">
            <el-input v-model="editForm.name"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_RTSP'" :label="t('CommTableEdit.comm_table_token')" style="width: 500px;">
            <el-input v-model="editForm.token" disabled></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG' || editForm.type == 'H5_DEV_RTSP'" :label="t('Login.login_username')" style="width: 500px;">
            <el-input v-model="editForm.username"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG' || editForm.type == 'H5_DEV_RTSP'" :label="t('Login.login_password')" style="width: 500px;">
            <el-input v-model="editForm.password" type="password" show-password></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG'" :label="t('CommTableEdit.comm_table_ip')" style="width: 500px;">
            <el-input v-model="editForm.devIP"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG'" :label="t('CommTableEdit.comm_table_port')" style="width: 500px;">
            <el-input v-model="editForm.devPort"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_RTSP'" label="URL" style="width: 500px;">
            <el-input v-model="editForm.strUrl"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_dev_sub_stream')" style="width: 500px;">
            <el-switch v-model="editForm.bEnableUrlSub"></el-switch>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_RTSP' && editForm.bEnableUrlSub" :label="t('Configuration.conf_substream_url')" style="width: 500px;">
            <el-input v-model="editForm.strUrlSub"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_connection_type')" style="width: 500px;">
            <el-select v-model="editForm.h5RTSPConnectType">
              <el-option v-for="(item, index) in rtspSelectData" :key="index" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG' || editForm.type == 'H5_DEV_RTSP'" :label="t('Device.device_audio')" style="width: 500px;">
              <el-switch v-model="editForm.enableAudio"></el-switch>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_FILE'" :label="t('Configuration.conf_description')" style="width: 500px;">
            <el-input v-model="editForm.description"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG'" :label="t('Device.device_sandbox')" style="width: 500px;">
            <el-switch v-model="editForm.sandbox"></el-switch>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG'" :label="t('Device.device_max_channels')" style="width: 500px;">
            <el-input v-model="editForm.maxChannel"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG'" :label="t('Device.device_buffertime')" style="width: 500px;">
            <el-input v-model="editForm.rBufferTime"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_ONFSTG' || editForm.type == 'H5_DEV_RTSP'" :label="t('Configuration.conf_description')" style="width: 500px;">
            <el-input v-model="editForm.description"></el-input>
          </el-form-item>
          <el-form-item v-if="editForm.type == 'H5_DEV_FILE'" :label="t('Configuration.conf_file_list')" style="width: 500px;"  class="form-item-tree">
            <el-input
              v-model="editForm.DevFile_Name"
              style="width: 100%"
              disabled
              placeholder="Please Check"
            />
            <div class="tow_node">
              <el-input v-model="filterText4" @input="onQueryChanged4" style="width: 100%" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
              <el-tree-v2
                style="width: 100%;"
                :data="fileData"
                :props="fileTreeProps"
                show-checkbox
                :height="350"
                :filter-method="filterMethod2"
                @check="editFileHandleCheck"
                ref="editFileTreeRef">
                <template #default="{ node }">
                  <span style="margin-left: 5px; font-size: 14px;">{{ node.data.Url.substr(node.data.Url.lastIndexOf("\\") + 1) }}</span>
                </template>
              </el-tree-v2>
            </div>
          </el-form-item>
        </el-form>
      </div>
      <el-form :model="editForm" label-width="120px" label-position="left" style="margin-left: 10px;">
        <el-form-item style="width: 500px;">
          <el-button class="cancel" @click="goback('edit')">{{ t('CommTableEdit.comm_cancel') }}</el-button>
          <el-button type="primary" @click="editOnSubmit">{{ t('CommTableEdit.comm_save') }}</el-button>
        </el-form-item>
      </el-form>
    </div>
    <div v-if="!addVisiable && !editVisiable" class="header-btns">
      <div class="left">
        <el-button type="primary" @click="add">{{ t('CommTableEdit.comm_add') }}</el-button>
        <el-button class="cancel" @click="delAll">{{ t('CommTableEdit.comm_delete') }}</el-button>
      </div>
      <div class="right">
        <el-input
          v-model="filterText"
          style="width: 240px"
          :placeholder="t('Common.comm_filtration')"
          :prefix-icon="Search"
        />
        <el-button type="primary">{{ t('CommTableEdit.comm_search') }}</el-button>
      </div>
    </div>
    <el-table v-if="!addVisiable && !editVisiable"
      :data="tableData.filter(item => !filterText || item.name.toLowerCase().includes(filterText.toLowerCase())).slice((currentPage - 1) * pageSize, currentPage * pageSize)" 
       @selection-change="selectChange" height="100%" style="width: 100%;">
      <el-table-column type="selection" width="55" />
      <el-table-column :label="t('CommTableEdit.comm_table_serial_number')" type="index" align="center" width="160"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_name')" prop="name" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_ip')" prop="devIP" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_port')" prop="devPort" align="center"></el-table-column>
      <el-table-column :label="t('Login.login_username')" prop="username" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_online')" prop="online" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_type')" prop="type" align="center"></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_table_token')" prop="token" align="center" show-overflow-tooltip></el-table-column>
      <el-table-column :label="t('CommTableEdit.comm_operational')" align="center">
        <template #default="{ row }">
          <el-button type="text" @click="edit(row)">{{ t('CommTableEdit.comm_edit') }}</el-button>
          <el-button type="text" @click="delRow(row.devId)">{{ t('CommTableEdit.comm_delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="!addVisiable && !editVisiable" class="pagination-box">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 30, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
    <div v-if="onvifVisiable && !addVisiable && !editVisiable" class="Onvif-table">
      <div class="header">
        <div class="close" @click="onvifVisiable = !onvifVisiable">
          <i class="iconfont icon-shouqi1"></i>
          <span>{{ `${t('Device.device_unadded_device')}(${onvifList.length})` }}</span>
        </div>
        <div class="add-onvif" @click="onvifsearchAdd">
          <i class="iconfont icon-xinjian"></i>
          <span>{{ t('CommTableEdit.comm_add') }}</span>
        </div>
        <div class="refresh" @click="Refresh">
          <i class="iconfont icon-shuaxin"></i>
          <span>{{ t('CommTableEdit.comm_refresh') }}</span>
        </div>
      </div>
      <el-table :data="onvifList.filter(item => !search || item.strIp.toLowerCase().includes(search.toLowerCase()))"
         @selection-change="selectChange2" ref="onvifRef" height="100%" style="width: 100%;">
        <el-table-column type="selection" width="55"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_table_serial_number')" prop="index" align="center" width="160"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_table_ip')" prop="strIp" align="center"></el-table-column>
        <el-table-column :label="t('CommTableEdit.comm_table_port')" prop="strPort" align="center"></el-table-column>
        <el-table-column :label="t('Device.device_onvif_address')" prop="strOnvifAddr" align="center"></el-table-column>
        <el-table-column :label="t('Device.device_model')" prop="strModel" align="center"></el-table-column>
        <el-table-column fixed="right" width="240">
          <template #header>
            <el-input v-model="search" :placeholder="t('Common.comm_filtration')" :prefix-icon="Search"></el-input>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
  <div v-if="!onvifVisiable && !addVisiable && !editVisiable" class="onvif-position" @click="onvifVisiable = !onvifVisiable">
    <i class="iconfont icon-zhankai1"></i>
    <span>{{ `${t('Device.device_unadded_device')}(${onvifList.length})` }}</span>
  </div>
</template>

<style scoped lang="scss">
.device-sdk {
  width: 100%;
  height: 100%;
  padding: 10px 10px 0 10px;
  display: flex;
  flex-direction: column;
  .add-device, .edit-device {
    padding: 10px;
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
    .form-left, .form-right {
      // height: 100%;
      display: flex;
      flex-direction: column;
      .form-item-tree {
        flex: 1;
        :deep(.el-form-item__content) {
          display: flex;
          flex-direction: column;
          .tow_node {
            width: 100%;
            flex: 1;
            margin-top: 10px;
            padding: 10px;
            border: 1px solid #666;
            border-radius: 4px;
          }

        }
      }
    }
  }
  .header-btns {
    width: 100%;
    padding-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .el-button {
      width: 70px;
      height: 28px;
    }
    .el-input {
      height: 30px;
      margin-right: 10px;
    }
  }

  .pagination-box {
    margin-bottom: 10px;
  }

  :deep(.el-table) {
    flex: 1;
    .el-table__body-wrapper {
      background-color: #181818;
    }
  }
  .Onvif-table {
    width: 100%;
    height: 240px;
    background-color: #393939;
    display: flex;
    flex-direction: column;
    .header {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      div {
        height: 20px;
        line-height: 20px;
        width: 160px;
        text-align: center;
        cursor: pointer;
        i {
          margin-right: 10px;
        }
      }
      .add-onvif, .refresh {
        border-left: #4d4d4d 1px solid;
      }
    }
    .el-table {
      flex: 1;
      :deep(.el-input__wrapper) {
        border-radius: 18px;
      }
    }
  }
}
.onvif-position {
  position: absolute;
  width: 200px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  background-color: #393939;
  left: 10px;
  bottom: 0;
  border-radius: 10px 10px 0 0;
  cursor: pointer;
  i {
    margin-right: 10px;
  }
}
</style>