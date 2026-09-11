import { defineStore } from "pinia";
import {ref} from 'vue';

export const useClientConfig = defineStore('clientConfig',()=>{
  const wplRecordPath = ref('');
  const wplCapturePath = ref('');
  const wplGpuDecoding = ref('');
  const wplMetaRender = ref('');

  const wplConfig = (data:any) => {
    wplRecordPath.value = data.wplRecordPath;
    wplCapturePath.value = data.wplCapturePath;
    wplGpuDecoding.value = data.wplGpuDecoding;
    wplMetaRender.value = data.wplMetaRender;
  }

  return {
    wplRecordPath,
    wplCapturePath,
    wplGpuDecoding,
    wplMetaRender,
    wplConfig,
  }
},{
  persist:{
    key:'clientConfig',
    storage:localStorage,
    pick:['wplCapturePath','wplRecordPath','wplGpuDecoding','wplMetaRender']
  }
})