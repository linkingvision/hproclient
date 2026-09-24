import { defineStore } from "pinia";
import { ref } from 'vue';

export const useClientConfig = defineStore('clientConfig', () => {
  const wplRecordPath = ref('');
  const wplCapturePath = ref('');
  const wplGpuDecoding = ref('');
  const wplMetaRender = ref('');
  const platform = ref('');
  const isWindows = ref(false);
  const isMac = ref(false);
  const isLinux = ref(false);
  let initPromise:Promise<void> | null = null;

  const systemPlatform = () => {
    if (initPromise) return initPromise;
    initPromise = (async () => {
      const info = await window.systemAPI.getPlatform();
      platform.value = info.platform;
      isWindows.value = info.platform === 'win32';
      isMac.value = info.platform === 'darwin';
      isLinux.value = info.platform === 'linux';
    })();
    return initPromise;
  }

  const wplConfig = (data: any) => {
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
    platform,
    isWindows,
    isMac, 
    isLinux,
    systemPlatform,
  }
}, {
  persist: {
    key: 'clientConfig',
    storage: localStorage,
    pick: ['wplCapturePath', 'wplRecordPath', 'wplGpuDecoding', 'wplMetaRender','isLinux','isMac','isWindows']
  }
})