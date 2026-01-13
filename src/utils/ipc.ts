import { DiscoveredDevice } from '../types/site-info';
import { SiteInfo } from '../store/site-info';

export const setupIPCListeners = () => {
  const siteInfo = SiteInfo();

  window.ipcRenderer.on('main-process-message', (_event, ...args) => {
    console.log('[ipc] main process message:', ...args)
  })

  window.ipcRenderer.on('site-device', (_event, ...args) => {
    console.log('[ipc] site device:', ...args)
  })

  window.ipcRenderer.invoke('get-site-device').then((msg: Array<DiscoveredDevice>) => {
    console.log('[ipc] get site device data:', msg);
    siteInfo.setSiteDevices(msg)
  })
}