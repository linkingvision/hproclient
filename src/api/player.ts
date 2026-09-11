import http from './http'

export const GetDeviceChannelCount = (root:string,access_token:string,devPartitionId:any) => http({
  url:`${root}/uapi/v1/Device/GetDevChannelCount?devPartitionId=${devPartitionId}`,
  method:'GET',
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

export const GetDeviceImage = (root:string,access_token:string,token:string) => http({
  url:`${root}/uapi/v1/GetDeviceImage?token=${token}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const ManualRecEnable = (root:string,access_token:string,token:string) => http({
  url:`${root}/uapi/v1/ManualRecEnable?devToken=${token}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const View = (root:string,access_token:string,viewid:any) => http({
  url:`${root}/uapi/v1/View/${viewid}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SearchCentralStorage = (root:string,access_token:string,token:string,start:any,end:any) => http({
  url:`${root}/api/v1/SearchStorRecordByTime?token=${token}&start=${start}&end=${end}&maxlen=86400`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SearchDeviceStorage = (root:string,access_token:string,token:string,start:any,end:any) => http({
  url:`${root}/api/v1/SearchDeviceRecordByTime?token=${token}&start=${start}&end=${end}&maxlen=86400`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SearchRecordedCalendar = (root:string,access_token:string,token:string,year:any,month:any) => http({
  url:`${root}/api/v1/SearchStorRecordCalendar?token=${token}&year=${year}&month=${month}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const Ptz = (root:string,access_token:string,ptzToken:string,action:string,speed:any) => http({
  url:`${root}/uapi/v1/Ptz?token=${ptzToken}&action=${action}&speed=${speed}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const PresetJump = (root:string,access_token:string,ptzToken:string,token:string,speed:any) => http({
  url:`${root}/uapi/v1/Ptz?token=${ptzToken}&action=preset&preset=${token}&speed=${speed}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const PresetSet = (root:string,access_token:string,ptzToken:string,val:string,token:string) => http({
  url:`${root}/uapi/v1/SetPreset?token=${ptzToken}&presetname=${val}&presettoken=${token}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetStreamInfo = (root:string,access_token:string,token:string) => http({
  url:`${root}/uapi/v1/GetVidStreamStatus?token=${token}&stream=main`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const ManualRecStart = (root:string,access_token:string) => http({
  url:`${root}/uapi/v1/ManualRecEnable`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const PtzControl = (root:string,access_token:string,ptzToken:any) => http({
  url:`${root}/uapi/v1/GetPresets?token=${ptzToken}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetUserConfig = (root:string,access_token:string) => http({
  url:`${root}/uapi/v1/UserConfig/Item`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetSysConfig = (root:string,access_token:string) => http({
  url:`${root}/uapi/v1/SysConfig/Item?pageSize=100000&pageIndex=1`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetChannelCount = (root:string,access_token:string,uuid:any) => http({
  url:`${root}/uapi/v1/Device/GetChannelCount?parentUUID=${uuid}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SetChannelAliasName = (root:string,access_token:string,token:string,alias?:string) => http({
  url:`${root}/uapi/v1/Device/SetChannelAliasName?token=${token}&alias=${alias}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const SetChannelDome = (root:string,access_token:string,token:string,dome:any) => http({
  url:`${root}/uapi/v1/Device/SetChannelDomeMode?token=${token}&dome=${dome}`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetChannels = (root:string,access_token:string,data: object) => http({
  url:`${root}/uapi/v1/Device/Channels`,
  method:'POST',
  data:data,
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})

export const GetDevPartitionList = (root:string,access_token:string) => http({
  url:`${root}/uapi/v1/DevPartition/List?type=USC_DEVICE`,
  method:'GET',
  headers:{
    Authorization:`Bearer ${access_token}`
  }
})
