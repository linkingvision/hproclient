import http from './http';

export const GetUsernameApi = (root: string, access_token: string, user: string) => http({
  url: root + '/uapi/v1/User/Item?username=' + user,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetUserConfigApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/UserConfig/Item',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const UpdateUserConfigApi = (root: string, access_token: string, data: any[]) => http({
  url: root + '/uapi/v1/UserConfig/Item',
  method: 'PUT',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetDefaultPartitionApi = (root: string, access_token: string, userId: number | string) => http({
  url: root + '/uapi/v1/User/DefaultPartition?userId=' + userId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})