import { DiscoveredDevice } from '../types/site-info';
import { setActivePinia } from 'pinia';
import pinia from '../store/pinia'
import { useSiteInfo } from '../store/site-info';

setActivePinia(pinia)
const siteInfo = useSiteInfo();

const siteDeviceHandler = (_event: any, ...args: any[]) => {
  console.log('[ipc] site device:', ...args)
}

export const setupIPCListeners = () => {
  

  window.ipcRenderer.on('main-process-message', (_event, ...args) => {
    console.log('[ipc] main process message:', ...args)
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