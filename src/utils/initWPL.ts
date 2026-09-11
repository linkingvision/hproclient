import {WebPluginPlayer} from '../assets/js/webpluginsdk.esm.js';

let wplPlayer:any = null;
let initPromise:Promise<any> | null = null;
let isInitializing = false;
let configResolve:((value:any)=>void) | null = null;

const isElectron = typeof process !== 'undefined' && process.versions !== null && process.versions.electron !== null;
const wplPlayerMap = new Map<number,any>();
let ES:any = null;
// const ES = await window.ipcRenderer.invoke('get-storage-data')
let esInitPromise:any = null;

async function initStorage(){
  if(esInitPromise)return esInitPromise;
  esInitPromise = (async () => {
    try{
      if(typeof window !== 'undefined' && window.ipcRenderer){
        const data = await window.ipcRenderer.invoke('get-storage-data');
        ES = data;
        return data;
      }
    }catch(error){
      console.warn('failed to get storage data :',error)
    }
    ES = {windowId:0,vedPort:'',windowBuffer:0};
    return ES;
  })();
  return esInitPromise;
}

export async function fetchWPLConfig():Promise<any>{
  try{
    if(typeof window === 'undefined' || !window.ipcRenderer)return {};
    const config = await window.ipcRenderer.invoke('wpl:get-config');
    return config || {}
  }catch(error){
    console.log(error);
    return{
    };
  }
}

export async function saveWPLConfigToMain(config:any):Promise<boolean>{
  try{
      if(typeof window === 'undefined' || !window.ipcRenderer)return false;
      const result = await window.ipcRenderer.invoke('wpl:save-config', config);
      return result?.success || false;
  }catch(err){
    console.log(err);
    return false;
  }
}

let configListenerSetup = false;

export function setupWPLConfigListener(){
  if(configListenerSetup)return;
  configListenerSetup = true;

  if(typeof window === 'undefined' || !window.ipcRenderer)return;

  window.ipcRenderer.on('wpl-config-updated',(_,config)=>{
    window.dispatchEvent(new CustomEvent('wpl-config-received',{
      detail:config
    }));

    const player = (window as any).$wplPlayer;
    if(player && player.setLocalConfig){
      try{
        player.setLocalConfig({
          recordPath:config.recordPath || '',
          capturePath:config.capturePath || '',
          gpuDecoding:config.gpuDecoding || 'false',
          metaRender:config.metaRender || 'true',
        })
      }catch(err){
        console.warn(err);
      }
    }else{
      (window as any).__pendingWPLConfig = config;
    }
  });
}

/**
 * get current window ID
 */
function getCurrentWindowId(){
  if(!ES) return 0;
  return ES.windowId || 0;
}

/**
 * get host configuration
 */
async function getWPLHost() {
  if(!ES) await initStorage();
  const port = ES?.vedPort;
  if(port && port !== '' && port !== '36085'){
    return `127.0.0.1:${port}`;
  }
  
  if(isElectron && window.ipcRenderer){
    try{
      const host = await window.ipcRenderer.invoke('get-wpl-host');
      return host;
    }catch(error){
      return '127.0.0.1:36085';
    }
  }
  return '127.0.0.1:36085';
}

if(typeof window !== 'undefined' && window.ipcRenderer){
  window.ipcRenderer.on('ved-port-update',(event:any,port:number)=>{
    initStorage().then(()=>{
      const windowId = getCurrentWindowId();
      const wplPlayer = wplPlayerMap.get(windowId);

      if(wplPlayer && wplPlayer.wsManager){
        const newHost = `127.0.0.1:${port}`;
        const currentHost = wplPlayer.wsManager.host;
        if(currentHost !== newHost){
          wplPlayer.wsManager.host = newHost;
          wplPlayer.wsManager.connect();
        }
      }      
    })

  })
}
/**
 * initialize WPL player
 */
export async function initWPLPlayer(options:any={}) {
  if(!ES) await initStorage();
  const windowId = getCurrentWindowId();
  const existingPlayer = wplPlayerMap.get(windowId);
  if(existingPlayer && existingPlayer.isInitialized && !existingPlayer.isDestroying){
    return existingPlayer;
  }
  if(existingPlayer){
    await destroyWPLPlayerForWindow(windowId);
  }

  if(!wplPlayer){
    try{
      const config = await fetchWPLConfig();
      if(config && (config.recordPath || config.capturePath)){
        if(ES){
          ES.wplConfig({
            wplRecordPath:config.recordPath || '',
            wplCapturePath:config.capturePath || '',
            wplGpuDecoding:String(config.gpuDecoding || false),
            wplMetaRender:String(config.metaRender || true),
          });
        }
      }
    }catch(err){
      console.warn(err);
    }
  }
    try{
      let wplHost = options.host || await getWPLHost();
      const windowBuffer = ES.windowBuffer || 0;
      // Create an instance without specifying videoId
      wplPlayer = new WebPluginPlayer({
        host:wplHost,
        rootpath:"/",
        consolelog:'true',
        windowId:windowBuffer,
        customBrowser:true,
      });
      // listen message
      wplPlayer.on('message',(data:any)=>{
        switch (data.method) {
          case 'wpl_system_webconnect':
            wplPlayer.isConnected = true;
            window.dispatchEvent(new CustomEvent('wpl-connected',{detail:wplPlayer}));
            break;
          case 'wpl_update_config':
          case 'wpl_system_config':
            window.dispatchEvent(new CustomEvent('wpl-config-received',{
              detail:{
                recordPath:data.configResp?.strRecordPath || '',
                capturePath:data.configResp?.strCapturePath || '',
                gpuDecoding:data.configResp?.bGPUDecoding,
                metaRender:data.configResp?.bMetaRender,
                gpuSupport:data.configResp?.bSupportGPU,
                wplVision:data.configResp?.strWplVision || '',
              }
            }));
            break;
          default:
            break;
        }
      });

      // connect WebSocket
      if(wplPlayer.wsManager){
        wplPlayer.wsManager.connect();
        const onOpen = () =>{
          fetchWPLConfig().then(config => {
            if(config && (config.recordPath || config.capturePath)){
              wplPlayer.setLocalConfig({
                recordPath:config.recordPath || '',
                capturePath:config.capturePath || '',
                gpuDecoding:config.gpuDecoding || 'false',
                metaRender:config.metaRender || 'true',
              });
            }
          })
          if(wplPlayer.wsManager.videoWS){
            wplPlayer.wsManager.videoWS.removeEventListener('open',onOpen);
          }
        };
        if(wplPlayer.wsManager.videoWS){
          wplPlayer.wsManager.videoWS.addEventListener('open',onOpen);
        }
      }
      wplPlayer.isInitialized = true;
      wplPlayer.windowId = windowId;
      wplPlayerMap.set(windowId,wplPlayer);
      (window as any).$wplPlayer = wplPlayer;
      return wplPlayer;
    }catch(error){
      throw error;
    }
}
/**
 * get WPL instance
 */
export function getWPLPlayer(){
  const windowId = getCurrentWindowId();
  const existingPlayer = wplPlayerMap.get(windowId);
  if(existingPlayer){
    return Promise.resolve(existingPlayer);
  }
  if((window as any).$wplPlayer){
    return Promise.resolve((window as any).$wplPlayer);
  }
  return initWPLPlayer();
}
/**
 * destory specifying WPL player
 */
export function destroyWPLPlayerForWindow(windowId:number){
  const wplPlayer = wplPlayerMap.get(windowId);
  if(!wplPlayer){
    return false;
  }
  if(wplPlayer.isDestroying){
    return false;
  }
  try{
    if(typeof wplPlayer.enableAudio === 'function'){
      wplPlayer.enableAudio(false);
    }
    if(wplPlayer.destroy && typeof wplPlayer.destroy === 'function'){
      wplPlayer.destroy();
    }else{
      if(wplPlayer.wsManager && wplPlayer.wsManager.close){
        wplPlayer.wsManager.close();
      }
    }

    if((window as any).$wplPlayer === wplPlayer){
      (window as any).$wplPlayer = null;
    }
    wplPlayerMap.delete(windowId);
    return true;
  }catch(error){
    wplPlayerMap.delete(windowId);
    return false;
  }
}
/**
 * destory current window instance
 */
export function destroyWPLPlayer(){
  const windowId = getCurrentWindowId();
  return destroyWPLPlayerForWindow(windowId);
}
/**
 * get configuration from WPL plugin
 */
export async function getWPLConfig(){
  const player = await getWPLPlayer();
  if(!player)return null;
  if(!player.wsManager?.isWsConnected)return null;
  return new Promise((resolve,reject)=>{
    configResolve = resolve;
    setTimeout(() => {
      if(configResolve){
        configResolve(null);
        configResolve = null;
        reject(new Error('get config timeout'));
      }
    }, 5000);
    player.getLocalConfig();
  })
}
/**
 * setting WPL config
 */
export async function setWPLConfig(config:any){
  const player = await getWPLPlayer();
  if(!player)return false;
  if(player.setLocalConfig){
    player.setLocalConfig({
        recordPath:config.recordPath||'',
        capturePath:config.capturePath || '',
        gpuDecoding:config.gpuDecoding || 'false',
        metaRender:config.metaRender || 'true',
      });
      if(window.ipcRenderer){
        await window.ipcRenderer.invoke('wpl:save-config',config);
      }
      return true;
  }
  return false;
}
/**
 * only closing no disconnect
 */
export function clearWPLPlayer(){
  const windowId = getCurrentWindowId();
  const wplPlayer = wplPlayerMap.get(windowId);
  if(!wplPlayer)return false;
  if(wplPlayer.isDestroying)return false;
  try{
    if(typeof wplPlayer.enableAudio === 'function'){
      wplPlayer.enableAudio(false);
    }
    // stop playing all video
    if(wplPlayer.stopAllVideo && typeof wplPlayer.stopAllVideo === 'function'){
      wplPlayer.stopAllVideo();
    }
    // hidden window
    if(wplPlayer.hide && typeof wplPlayer.hide === 'function'){
      wplPlayer.hide();
    }
    return true;
  }catch(error){
    return false;
  }
}
/**
 * check wheather player is usable
 */
export function isWPLPlayerReady(){
  const windowId = getCurrentWindowId();
  const wplPlayer = wplPlayerMap.get(windowId);
  if(!wplPlayer)return false;
  const ws = wplPlayer.wsManager?.videoWS;
  const isConnected = ws && ws.readyState === WebSocket.OPEN;

  return isConnected && !wplPlayer.isDestroying;
}
export default {initWPLPlayer,getWPLPlayer,destroyWPLPlayerForWindow,destroyWPLPlayer,clearWPLPlayer,isWPLPlayerReady,getWPLConfig,setWPLConfig};
