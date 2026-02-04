import { DiscoveredDevice } from '../types/site-info';
import { useSiteInfo } from '../store/site-info';
import { useTempStore } from '../store/temp';

let siteInfo: any;
let tempStore: any;

const siteDeviceHandler = (_event: any, args: DiscoveredDevice[]) => {
  console.log('[ipc] site device:', args)
  siteInfo.setSiteDevices(args)
}

export const setupIPCListeners = () => {
  siteInfo = useSiteInfo();
  tempStore = useTempStore()
  window.ipcRenderer.on('main-process-message', (_event, ...args) => {
    console.log('[ipc] main process message:', ...args, args[0])
    if (args && args[0]) {
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