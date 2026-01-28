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

// 开启 / 关闭手动录像
interface SetRecEnableParams {
  root: string;
  access_token: string;
  devUUID: string;
  setting: {
    manualRecEnable: boolean
  }
}

export const SetRecEnableApi = (data: SetRecEnableParams) => http({
  url: data.root + '/uapi/v1/ManualRecEnable',
  method: 'PUT',
  data: {
    devUUID:  data.devUUID,
    setting: data.setting
  },
  headers: {
    Authorization: `Bearer ${data.access_token}`
  }
})

export const GetInformationDataApi = (root: string, access_token: string, token: string) => http({
  url: root + '/uapi/v1/GetVidStreamStatus?token=' + token + '&stream=main',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 获取设备云台预置位查询
export const GetPresetsApi = (root: string, access_token: string, token: string) => http({
  url: root + '/uapi/v1/GetPresets?token=' + token,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 云台预置位跳转
export const PresetJumpApi = (root: string, access_token: string, ptzToken: string, presetToken: string, speed: number) => http({
  url: root + '/uapi/v1/Ptz?token=' + ptzToken + '&action=preset&preset=' + presetToken + '&speed=' + speed,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 云台预置位设置
export const SetPresetApi = (root: string, access_token: string, ptzToken: string, inputVal: string, presetToken: string) => http({
  url: root + '/uapi/v1/SetPreset?token=' + ptzToken + '&presetname=' + inputVal + '&presettoken=' + presetToken,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

// 云台控制
export const PtzApi = (root: string, access_token: string, ptzToken: string, action: string, speed: number) => http({
  url: root + '/uapi/v1/Ptz?token=' + ptzToken + '&action=' + action + '&speed=' + speed,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetChannels = (root: string, access_token: string, data: any) => http({
  url: root + '/uapi/v1/Device/Channels',
  method: 'POST',
  data: data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})