import http from "./http";

export const GetWorkServerListApi = (root: string, access_token: string) => http({
  url: root + '/uapi/v1/WorkServer/List',
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetStorageModeApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + '/uapi/v1/Storage/StorageMode?nodeId=' + nodeId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface StorageModeParam {
  mode: string,
  nodeId: string
}
export const SetStorageModeApi = (root: string, access_token: string, data: StorageModeParam) => http({
  url: root + '/uapi/v1/Storage/StorageMode',
  method: 'PUT',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetDiskPartitionApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + '/uapi/v1/Storage/List/DiskPartitions?nodeId=' + nodeId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetMetaStorageApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + '/uapi/v1/Storage/MetaStorage?nodeId=' + nodeId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface MetaStorageParam {
  nodeId: string,
  bEnableMetaStorage: boolean,
  strMetaPartitionDevice: string,
  strMetaPartitionMountpoint: string,
  nMetaRetentionInDay: number
}
export const SetMetaStorageApi = (root: string, access_token: string, data: MetaStorageParam) => http({
  url: root + '/uapi/v1/Storage/MetaStorage',
  method: 'put',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetObjPartitionsApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + '/uapi/v1/Storage/List/ObjPartitions?nodeId=' + nodeId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface ObjPartitionParam {
  nodeId: string,
  nIndex: number,
  strDevice: string,
  strMountpoint: string
}
export const AddObjPartitionApi = (root: string, access_token: string, data: ObjPartitionParam) => http({
  url: root + '/uapi/v1/Storage/Add/ObjPartition',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface DelObjPartitionParam {
  nodeId: string,
  nIndex: number,
  strMountpoint: string
}
export const DelObjPartitionApi = (root: string, access_token: string, data: DelObjPartitionParam) => http({
  url: root + '/uapi/v1/Storage/ObjPartition',
  method: 'Delete',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const GetS3BucketsApi = (root: string, access_token: string, nodeId: string) => http({
  url: root + '/uapi/v1/Storage/List/S3Buckets?nodeId=' + nodeId,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface S3BucketParam {
  nodeId: string
  nIndex: number
  strAccessKey: string
  strSecretKey: string
  strRegionName: string
  strBucketName: string
  strEndpoint: string
}
export const AddS3BucketApi = (root: string, access_token: string, data: S3BucketParam) => http({
  url: root + '/uapi/v1/Storage/Add/S3Bucket',
  method: 'POST',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

export const EditS3BucketApi = (root: string, access_token: string, data: S3BucketParam) => http({
  url: root + '/uapi/v1/Storage/Update/S3Bucket',
  method: 'PUT',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})

interface DelS3BucketParam {
  nodeId: string
  nIndex: number
  strBucketName: string
  strEndpoint: string
}
export const DeleteS3BucketApi = (root: string, access_token: string, data: DelS3BucketParam) => http({
  url: root + '/uapi/v1/Storage/S3Bucket',
  method: 'DELETE',
  data,
  headers: {
    Authorization: `Bearer ${access_token}`
  }
})