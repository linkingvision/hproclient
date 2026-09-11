import http from "./http";

export const GetUscLog = (root:string,access_token:string,data:any) => http({
  url:`${root}/uapi/v1/UscLog/List`,
  method:'POST',
  data,
  headers:{
    Authorization: `Bearer ${access_token}`
  }

})