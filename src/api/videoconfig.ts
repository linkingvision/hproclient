import http from "./http";

export const GetNodeApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/WorkServer/List',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetRecordingCountApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + `/uapi/v1/Device/RecordingCount?nodeId=${nodeId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetRecordingStatusApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + `/uapi/v1/Device/RecordingStatus?nodeId=${nodeId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetDiskPartitionApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + `/uapi/v1/Storage/List/DiskPartitions?nodeId=${nodeId}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})