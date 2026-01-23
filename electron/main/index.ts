import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import WindowPoolManager, { WindowPools } from './window_pool_manager';
import { GetDiscoveryClient } from './site-manager/site_client';
import "./log-config/index"
import log from 'electron-log';
import http from '../http';
const DiscoveryClient = GetDiscoveryClient()

// 示例：每30秒打印一次设备列表
setInterval(() => {
  const devices = DiscoveryClient.getDevices();
  log.info(`\n[${new Date().toLocaleTimeString()}] 当前在线设备: ${devices.length} 台`);

  if (devices.length > 0) {
    devices.forEach((device, index) => {
      const lastSeen = device.lastSeen || device.responseTime;
      const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
      log.info(`${index + 1}. ${device.deviceName} (${device.ipv4Address}) - 更新于${secondsAgo}秒前`);
    });
  }
}, 30000);

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, '../..');

export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7;
if (os.release().startsWith('6.1')) {
  app.disableHardwareAcceleration();
}

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName());
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
};

let winManager: WindowPoolManager | null = null;
let logo_win: BrowserWindow | null = null;
let mainWinArray: Map<number, BrowserWindow> = new Map<number, BrowserWindow>();
const preload = path.join(__dirname, '../preload/index.mjs');
const indexHtml = path.join(RENDERER_DIST, 'index.html');

//win.hide()再使用win.show()会引起窗口闪烁问题
app.commandLine.appendSwitch('wm-window-animations-disabled');
app.commandLine.appendSwitch('ignore-certificate-errors');

//侧边栏
async function createSidebarWindow(parentWin: BrowserWindow) {
  let sidebarWin = new BrowserWindow({
    title: "Hpro client sidebar",
    frame: false,
    show: false, // 窗口默认隐藏
    // alwaysOnTop: true, // 保持在最顶层
    transparent: true, // 窗口透明
    resizable: false, // 禁止调整窗
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // 设置图标路径
    parent: parentWin,
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    sidebarWin.webContents.openDevTools()
    sidebarWin.loadURL(`${VITE_DEV_SERVER_URL}#Sidebar`)
    // Open devTool if the app is not packaged
  } else {
    sidebarWin.loadFile(indexHtml, { hash: "Sidebar" })
  }

  //网页加载完成事件
  sidebarWin.webContents.on('did-finish-load', () => {
    let clientBounds = parentWin.getContentBounds();  // 获取内容区域的边界
    sidebarWin.setBounds({ x: clientBounds.x, y: clientBounds.y, width: 250, height: clientBounds.height });
    sidebarWin.setParentWindow(parentWin);
    // var message = {
    //   type: "Sidebar",
    // }

    // 主动测试向渲染器推送消息
    // mainWin?.webContents.send('main-process-message', message)
  })
  sidebarWin.on('blur', () => {
    sidebarWin.hide()
  })
};

//主窗口
async function createWindow(childPath: string) {
  let mainWin = new BrowserWindow({
    title: "Hpro client main",
    width: 800,
    height: 600,
    frame: false,
    show: false, // 窗口默认隐藏
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // 设置图标路径
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    mainWin.webContents.openDevTools()
    mainWin.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
  } else {
    mainWin.loadFile(indexHtml)
  }

  mainWinArray.set(mainWin.webContents.id, mainWin)

  //网页加载完成事件
  mainWin.webContents.on('did-finish-load', () => {
    var message = {
      type: "tabs",
      data: {
        path: childPath,
      }
    }
    // 主动测试向渲染器推送消息
    mainWin?.webContents.send('main-process-message', message)
  })

  // 使用浏览器而不是应用程序打开所有链接
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // win.webContents.on('will-navigate', (event, url) => { }) #344
  mainWin.once('ready-to-show', () => {
    mainWin.show();
    createSidebarWindow(mainWin)
    //全屏模式 
    if (!mainWin.isMaximized()) {
      mainWin.maximize();
    }
  })
  mainWin.on('minimize', () => {
    console.log("minimize...");
  });
  mainWin.on('move', () => {
    setChildrenBounds()

  });
  mainWin.on('resize', () => {
    setChildrenBounds()
  });
  mainWin.on('maximize', () => {
    console.log("maximize...");
    mainWin.webContents.send("header-minimize", "icon-xiangxiahuanyuan");
  });
  mainWin.on('unmaximize', () => {
    console.log("unmaximize...");
    mainWin.webContents.send("header-minimize", "icon-zuidahua");
    setChildrenBounds()
  });
  mainWin.on('restore', () => {
    console.log("win restore...");
  });
  mainWin.on('close', (event) => {
    mainWinArray.delete(mainWin.webContents.id);

    if (mainWinArray.size == 0) {
      app.quit()
    }
    mainWin = null;
  });

  function setChildrenBounds() {
    let win_children = mainWin.getChildWindows()
    if (win_children) {
      let clientBounds = mainWin.getContentBounds();  // 获取内容区域的边界
      win_children.forEach(child => {
        if (child.getTitle() == "Hpro client sidebar") {
          // 更新子窗口的位置，使其跟随主窗口
          child.setBounds({ x: clientBounds.x, y: clientBounds.y, width: 250, height: clientBounds.height });
        } else {
          // 更新子窗口的位置，使其跟随主窗口
          child.setBounds({ x: clientBounds.x + 1, y: clientBounds.y + 40, width: clientBounds.width - 2, height: clientBounds.height - 41 });
        }
      });
    }
  }
};

//启动页logo画面
const splashScreen = () => {
  logo_win = new BrowserWindow({
    title: "Hpro client logo",
    width: 750,
    height: 500,
    frame: false,
    show: false,
    // transparent: true,
    // alwaysOnTop: true, // 保证启动图像在最前面
    resizable: false, // 禁止调整窗
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // 设置图标路径

    webPreferences: {
      devTools: false,
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    logo_win.loadURL(`${VITE_DEV_SERVER_URL}#Logo`)
  } else {
    logo_win.loadFile(indexHtml, { hash: "Logo" })
  }
  logo_win.once('ready-to-show', () => {
    logo_win.show()
  })
  winManager = new WindowPoolManager({ VITE_DEV_SERVER_URL, indexHtml, preload });
  const logoout = () => {
    createWindow("SiteLogin")
    logo_win.close();
  }
  setTimeout(logoout, 3000);

};


//当 Electron 完成初始化并准备创建浏览器窗口时
app.whenReady().then(splashScreen);

//当所有浏览器窗口都关闭时
app.on('window-all-closed', () => {
  mainWinArray = new Map<number, BrowserWindow>();
  if (process.platform !== 'darwin') app.quit()
});

// //用户双击应用图标再次启动时触发
// app.on('second-instance', () => {
//   if (mainWin) {
//     // Focus on the main window if the user tried to open another
//     if (mainWin.isMinimized()) mainWin.restore()
//     mainWin.focus()
//   }
// });

//在 macOS 上点击 Dock 图标重新激活应用时
app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow("SiteLogin")
  }
});
// 监听 before-quit 事件（在退出应用前触发）
app.on('before-quit', (event) => {
  console.log('应用即将退出');
});

// 监听 will-quit 事件（在退出应用时触发）
app.on('will-quit', (event) => {
  console.log('应用正在退出');
});

//接收最小化命令
ipcMain.on('window-min', function (event) {
  // 通过 WebContents 找到对应的 BrowserWindow
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow.minimize()
});
//接收最大化命令
ipcMain.on('window-max', function (event) {
  // 通过 WebContents 找到对应的 BrowserWindow
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow.isMaximized()) {
    senderWindow.unmaximize()
  } else {
    senderWindow.maximize()
  }
});
//接收关闭命令
ipcMain.on('window-close', function (event) {
  //获取当前窗口
  const win = BrowserWindow.fromWebContents(event.sender);

  //获取当前窗口的子窗口
  let win_children = win.getChildWindows()
  if (win_children) {
    //逐个关闭子窗口
    win_children.forEach(child => {
      winManager.closeWindow(child.id);
    });
  }
  win.close()
})
//接收关闭标签命令
ipcMain.on('window-tabs-close', function (event, id) {
  //关闭此标签
  winManager.closeWindow(id);
})
//接收sidebar导航栏显示消息
ipcMain.on('sidebar-show', function (event, id) {
  const sender = event.sender;
  //  通过 WebContents 找到点击的 BrowserWindow
  const win = BrowserWindow.fromWebContents(sender);
  const sidebarWindows = win.getChildWindows().find(win => {
    const title = win.getTitle()
    return title === "Hpro client sidebar";
  })

  sidebarWindows?.show();
})

//发送给所有窗口站点信息
ipcMain.on('get-site-device', function (event, uuid) {
  const devices = DiscoveryClient.getDevices();
  log.info(`\n[${new Date().toLocaleTimeString()}] 当前在线设备: ${devices.length} 台`);

  mainWinArray.forEach(win => {
    win.webContents.send("site-device", devices)
    let win_children = win.getChildWindows()
    if (win_children) {
      win_children.forEach(child => {
        child.webContents.send("site-device", devices)
      });
    }
  });
})

//站点登录保存信息
ipcMain.handle('site-device-login', function (event, data) {
  DiscoveryClient.setDevice(data);
})
//获取站点信息
ipcMain.handle('get-site-device', async (event) => {
  const devices = DiscoveryClient.getDevices();
  log.info(`\n[${new Date().toLocaleTimeString()}] 当前在线设备: ${devices.length} 台`);

  if (devices.length > 0) {
    devices.forEach((device, index) => {
      const lastSeen = device.lastSeen || device.responseTime;
      const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
      log.info(`${index + 1}. ${device.deviceName} (${device.ipv4Address}) - 更新于${secondsAgo}秒前`);
    });
  }
  return devices
});
//删除站点
ipcMain.handle('delete-site-device', function (event, ipv4Address) {
  DiscoveryClient.clearDevice(ipv4Address)
  const devices = DiscoveryClient.getDevices();
  log.info(`\n[${new Date().toLocaleTimeString()}] 当前在线设备: ${devices.length} 台`);

  if (devices.length > 0) {
    devices.forEach((device, index) => {
      const lastSeen = device.lastSeen || device.responseTime;
      const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
      log.info(`${index + 1}. ${device.deviceName} (${device.ipv4Address}) - 更新于${secondsAgo}秒前`);
    });
  }
  return devices
})

//添加站点
ipcMain.handle('add-site-device', function (event, data) {
  DiscoveryClient.addDevice(data)
  const devices = DiscoveryClient.getDevices();
  log.info(`\n[${new Date().toLocaleTimeString()}] 当前在线设备: ${devices.length} 台`);

  if (devices.length > 0) {
    devices.forEach((device, index) => {
      const lastSeen = device.lastSeen || device.responseTime;
      const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
      log.info(`${index + 1}. ${device.deviceName} (${device.ipv4Address}) - 更新于${secondsAgo}秒前`);
    });
  }
  return devices
})
//切换标签
ipcMain.on('switch-tabs', function (event, data) {
  const sender = event.sender;
  //  通过 WebContents 找到点击的 BrowserWindow
  const win = BrowserWindow.fromWebContents(sender);
  let win_children = win.getChildWindows();
  if (win_children) {
    win_children.forEach(child => {
      if (child.id == data) {
        child.show();
      } else {
        child.hide();
      }
    });
  }
})
//打开新的窗口
ipcMain.on('open-new-win', (event, arg) => {
  createWindow("View")
});
//添加新的标签页
ipcMain.handle('open-win-tabs', (event, arg) => {
  const newWin = winManager.openWindow().window;
  newWin.resizable = false;
  const sender = event.sender;
  // 通过 WebContents 找到对应的 BrowserWindow
  const senderWindow = BrowserWindow.fromWebContents(sender);
  if (!senderWindow) {
    return null;
  };
  let clientBounds = senderWindow.getContentBounds();  // 获取内容区域的边界
  // 设置新窗口的大小边界
  newWin.setBounds({ x: clientBounds.x + 1, y: clientBounds.y + 40, width: clientBounds.width - 2, height: clientBounds.height - 41 });
  newWin.setParentWindow(senderWindow);
  let routerPath = arg.path;
  if (VITE_DEV_SERVER_URL) {
    // newWin.webContents.openDevTools()
    newWin.loadURL(`${VITE_DEV_SERVER_URL}#${routerPath}`)
  } else {
    newWin.loadFile(indexHtml, { hash: routerPath })
  };

  //   //网页加载完成事件
  // mainWin.webContents.on('did-finish-load', () => {
  //   var message = {
  //     type: "tabs",
  //     data: {
  //       path: childPath,
  //     }
  //   }
  //   // 主动测试向渲染器推送消息
  //   mainWin?.webContents.send('main-process-message', message)
  // })

  newWin.once('ready-to-show', () => {
    newWin.show();
  })
  arg.id = newWin.id;
  return arg;
});


// 接收 SideBar 信息, 切换页面
ipcMain.on('sidebar-switch-tab', async (event, data) => {
  console.log('sidebar-switch-tab =>', data)
  const sender = event.sender;
  // 通过 WebContents 找到对应的 BrowserWindow
  const senderWindow = BrowserWindow.fromWebContents(sender);
  const mainWin = senderWindow.getParentWindow()
  // mainWinArray.get('header')?.webContents.send('header-switch-tab', data)
  mainWin?.webContents.send('header-switch-tab', data)
})

// 页面中操作打开新页面
ipcMain.on('go-tab', async (event, data) => {
  const sender = event.sender;
  // 通过 WebContents 找到对应的 BrowserWindow
  const senderWindow = BrowserWindow.fromWebContents(sender);
  const mainWin = senderWindow.getParentWindow()

  mainWin?.webContents.send('header-new-tab', data)
})