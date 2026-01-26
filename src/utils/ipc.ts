import { DiscoveredDevice } from '../types/site-info';
import { setActivePinia } from 'pinia';
import pinia from '../store/pinia'
import { useSiteInfo } from '../store/site-info';
import { useTempStore } from '../store/temp';

setActivePinia(pinia)
const siteInfo = useSiteInfo();
const tempStore = useTempStore()

const siteDeviceHandler = (_event: any, args: DiscoveredDevice[]) => {
  console.log('[ipc] site device:', args)
  siteInfo.setSiteDevices(args)
}

export const setupIPCListeners = () => {
  

  window.ipcRenderer.on('main-process-message', (_event, ...args) => {
    console.log('[ipc] main process message:', ...args, args[0])
    if (args && args[0] && args[0].type == 'setup') {
      tempStore.setTempIP(args[0].data.ip);
    }
  })

  window.ipcRenderer.on('site-device', siteDeviceHandler)

  window.ipcRenderer.invoke('get-site-device').then((msg: Array<DiscoveredDevice>) => {
    console.log('[ipc] get site device data:', msg);
    siteInfo.setSiteDevices(msg)
  })
}

export const destroyIPCListeners = () => {
  window.ipcRenderer.off('site-device', siteDeviceHandler)
}