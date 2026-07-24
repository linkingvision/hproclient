import http from "./http";

// ==================== Map ====================

// get user information
interface GetUserItemParams {
  root: string;
  access_token: string;
  username: string;
}
export const GetUserItem = (params: GetUserItemParams) => http({
  url: params.root + '/uapi/v1/User/Item?username=' + params.username,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get user default map
interface GetMapUserDefaultParams {
  root: string;
  access_token: string;
  userId: string;
}
export const GetMapUserDefault = (params: GetMapUserDefaultParams) => http({
  url: params.root + '/uapi/v1/Map/UserDefaultMap?userId=' + params.userId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get system default map
interface GetMapSystemDefaultParams {
  root: string;
  access_token: string;
}
export const GetMapSystemDefault = (params: GetMapSystemDefaultParams) => http({
  url: params.root + '/uapi/v1/Map/SystemDefaultMap',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// ==================== MapLiveplay ====================

// get map elements
interface GetMapElementParams {
  root: string;
  access_token: string;
  data: object;
}
export const GetMapElement = (params: GetMapElementParams) => http({
  url: params.root + '/uapi/v1/Map/Element',
  method: 'POST',
  data: params.data,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get channel details
interface GetChannelParams {
  root: string;
  access_token: string;
  params: object;
}
export const GetChannel = (params: GetChannelParams) => http({
  url: params.root + '/uapi/v1/Device/Channel',
  method: 'GET',
  params: params.params,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get map details
interface GetMapDetailParams {
  root: string;
  access_token: string;
  mapId: string;
}
export const GetMapDetail = (params: GetMapDetailParams) => http({
  url: params.root + '/uapi/v1/Map/' + params.mapId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// ==================== DevicesTree ====================

// get device partitin list
interface GetDevPartitionListWithPageParams {
  root: string;
  access_token: string;
  params?: {
    pageSize?: number;
    type?: string;
  };
}
export const GetDevPartitionListWithPage = (params: GetDevPartitionListWithPageParams) => http({
  url: params.root + '/uapi/v1/DevPartition/List',
  method: 'GET',
  params: params.params,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get device partition details
interface GetDevPartitionItemParams {
  root: string;
  access_token: string;
  devPartitionId: number;
}
export const GetDevPartitionItem = (params: GetDevPartitionItemParams) => http({
  url: params.root + '/uapi/v1/DevPartition/Item/' + params.devPartitionId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// search filter node
interface GetDevPartitionFilterNodeV2Params {
  root: string;
  access_token: string;
  params: {
    filterText: string;
  };
}
export const GetDevPartitionFilterNodeV2 = (params: GetDevPartitionFilterNodeV2Params) => http({
  url: params.root + '/uapi/v1/DevPartition/FilterNode',
  method: 'GET',
  params: params.params,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get device channel list
interface GetDeviceChannelsV2Params {
  root: string;
  access_token: string;
  params: {
    token: string;
    all?: boolean;
  };
}
export const GetDeviceChannelsV2 = (params: GetDeviceChannelsV2Params) => http({
  url: params.root + '/uapi/v1/Device/Channels',
  method: 'GET',
  params: params.params,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get all device channel
interface PostDeviceChannelsAllParams {
  root: string;
  access_token: string;
  data: object;
}
export const PostDeviceChannelsAll = (params: PostDeviceChannelsAllParams) => http({
  url: params.root + '/uapi/v1/Device/Channels',
  method: 'POST',
  data: params.data,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get cascade hierarchy
interface GetCascadeHierarchyV2Params {
  root: string;
  access_token: string;
  params: {
    token: string;
    casPartitionToken: string;
  };
}
export const GetCascadeHierarchyV2 = (params: GetCascadeHierarchyV2Params) => http({
  url: params.root + '/uapi/v1/Cascade/List/Hierarchy',
  method: 'GET',
  params: params.params,
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get access device
interface GetAccessDeviceV2Params {
  root: string;
  access_token: string;
  token: string;
}
export const GetAccessDeviceV2 = (params: GetAccessDeviceV2Params) => http({
  url: params.root + '/uapi/v1/AccessDevice/' + params.token,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get logic partition list
interface GetLogicPartitionListV2Params {
  root: string;
  access_token: string;
}
export const GetLogicPartitionListV2 = (params: GetLogicPartitionListV2Params) => http({
  url: params.root + '/uapi/v1/LogicPartition/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get group list
interface GetGroupListV2Params {
  root: string;
  access_token: string;
}
export const GetGroupListV2 = (params: GetGroupListV2Params) => http({
  url: params.root + '/uapi/v1/Group/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get role list
interface GetRoleListV2Params {
  root: string;
  access_token: string;
}
export const GetRoleListV2 = (params: GetRoleListV2Params) => http({
  url: params.root + '/uapi/v1/Role/List?pageSize=100000',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get map list
interface GetMapListV2Params {
  root: string;
  access_token: string;
}
export const GetMapListV2 = (params: GetMapListV2Params) => http({
  url: params.root + '/uapi/v1/Map/List',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get user configuration
interface GetUserConfigItemV2Params {
  root: string;
  access_token: string;
}
export const GetUserConfigItemV2 = (params: GetUserConfigItemV2Params) => http({
  url: params.root + '/uapi/v1/UserConfig/Item',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})

// get system configuration
interface GetSysConfigItemV2Params {
  root: string;
  access_token: string;
}
export const GetSysConfigItemV2 = (params: GetSysConfigItemV2Params) => http({
  url: params.root + '/uapi/v1/SysConfig/Item?pageSize=100000&pageIndex=1',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${params.access_token}`
  }
})