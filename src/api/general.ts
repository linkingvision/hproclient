import http from "./http";

export const GetHProConfigApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/HproClientConfig/List',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface UpdateConfigParams {
  key: string,
  value: string
}
export const UpdateHProConfigApi = (root: string, access_token: string, data: UpdateConfigParams) => http({
  url: root + '/uapi/v1/HproClientConfig/Update',
  method: 'PUT',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})