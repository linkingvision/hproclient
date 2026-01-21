import http from "./http";

interface GetPartitionParams {
  root: string,
  access_token: string,
}
// 获取设备分区
export const GetPartitionApi = (params: GetPartitionParams) => http({
  url: params.root + '/uapi/v1/DevPartition/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

interface GetDeviceChannelsParams {
  root: string
  access_token: string
  token: string
}
export const GetDeviceChannelsApi = (params: GetDeviceChannelsParams) => http({
  url: params.root + '/uapi/v1/Device/Channels?token=' + params.token,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

interface RecEnableParams {
  root: string;
  access_token: string;
  token: string;
}
export const RecEnableApi = (params: RecEnableParams) => http({
  url: params.root + '/uapi/v1/ManualRecEnable?devToken=' + params.token,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// 获取设备有录像日期
interface GetRecordCalendarParams {
  token: string;
  year: string | number;
  month: string | number;
  root: string;
  access_token: string;
}
export const GetRecordCalendar = (params: GetRecordCalendarParams) => http({
  url: params.root + '/api/v1/SearchStorRecordCalendar?token=' + params.token + '&year=' + params.year + '&month=' + params.month,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})