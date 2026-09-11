import http from "./http";

export const WorkServer = (root:string,access_token:string) => http({
  url:`${root}/uapi/v1/WorkServer/List`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const DeviceChannelState = (root:string,access_token:string,data:any) => http({
  url:`${root}/uapi/v1/Device/Channel/State?pageSize=100000`,
  method:'POST',
  data,
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetCasDeviceChannelCount = (root:string,access_token:string,casPartitionId:any) => http({
  url:`${root}/uapi/v1/Device/GetCasDevChannelCount?casDevPartitionId=${casPartitionId}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetDeviceChannelCount = (root:string,access_token:string,devPartitionId:any) => http({
  url:`${root}/uapi/v1/Device/GetDevChannelCount?devPartitionId=${devPartitionId}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SearchCentralStorage = (root:string,access_token:string,token:string,start:string,end:string) => http({
  url:`${root}/api/v1/SearchStorRecordByTime?token=${token}&start=${start}&end=${end}&maxlen=86400`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetAnaEventList = (root:string,access_token:string,data:any) => http({
  url:`${root}/uapi/v1/AnaEvent/List`,
  method:'POST',
  data,
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})