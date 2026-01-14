import http from "./http";

export const LoginApi = (root: string, data: Object) => http({
  url: `${root}/uapi/v1/Login`,
  method:'POST',
  data
})

export const LoginSessionApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/User/LoginSession',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetSiteApi = (root: string) => http({
  url: root + '/uapi/v1/DiscoverService/Site',
  method: 'GET'
})

export const KeepAliveApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/User/Keepalive',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})