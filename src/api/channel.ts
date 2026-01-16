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