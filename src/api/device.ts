import http from './http'

export const GetNodeApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/WorkServer/List',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetDeviceListApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/Device/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 获取设备根目录
export const GetDevPartitionApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/DevPartition/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 获取视频文件
export const GetDevFileApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/Device/DevFileList',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface DeviceParam {
  token: string
}
export const GetDeviceApi = (root: string, access_token: string, data: DeviceParam) => http({
  url: root + '/iapi/v1/GetDevice',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetDeviceChannelsApi = (root: string, access_token: string, data: DeviceParam) => http({
  url: root + '/iapi/v1/GetDeviceChannels',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface addOnfstg {
  nodeId: string,
  name: string,
  username: string,
  password: string,
  devIP: string,
  devPort: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  rBufferTime: number,
  sandbox: boolean,
  maxChannel: number,
}
export const AddOnfstgApi = (root: string, access_token: string, data: addOnfstg) => http({
  url: root + '/uapi/v1/Device/Add/OnfStg',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface addRTSP {
  nodeId: string,
  setToken: boolean,
  token: string,
  name: string,
  username: string,
  password: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  strUrl: string,
  bEnableUrlSub: boolean,
  strUrlSub: string,
  h5RTSPConnectType: string,
}
export const AddRTSPApi = (root: string, access_token: string, data: addRTSP) => http({
  url: root + '/uapi/v1/Device/Add/RTSP',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface addFile {
  nodeId: string,
  setToken?: boolean,
  token?: string,
  name: string,
  strUrl: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number
}
export const AddFileApi = (root: string, access_token: string, data: addFile) => http({
  url: root + '/uapi/v1/Device/Add/FILE',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export interface editDevice {
  nodeId: string,
  devId: number,
  name: string,
  enableAudio: boolean,
  description: string,
  enabled: boolean,
  devPartitionId: number,
  username?: string,
  password?: string,
  devIP?: string,
  devPort?: string,
  strUrl?: string,
  bEnableUrlSub?: boolean,
  strUrlSub?: string,
  h5RTSPConnectType?: string,
  rBufferTime?: number,
  maxChannel?: number,
  sandbox?: boolean
}
export const EditDevApi = (root: string, access_token: string, data: editDevice) => http({
  url: root + '/uapi/v1/Device/Update',
  method: 'PUT',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export interface delDeviceParams {
  ids: number[] | []
}
export const DelDeviceApi = (root: string, access_token: string, data: delDeviceParams) => http({
  url: root + '/uapi/v1/Device',
  method: 'DELETE',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})