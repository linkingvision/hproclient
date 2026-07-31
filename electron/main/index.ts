import { app, BrowserWindow, shell, ipcMain, BrowserWindowConstructorOptions, screen } from 'electron';
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

// example: print device list every 30 seconds
setInterval(() => {
  const devices = DiscoveryClient.getDevices();
  log.info(`[site] the total online devices online new: ${devices.length} `);

  if (devices.length > 0) {
    devices.forEach((device, index) => {
      const lastSeen = device.lastSeen || device.responseTime;
      const secondsAgo = Math.floor((Date.now() - lastSeen.getTime()) / 1000);
      log.info(`${index + 1}. ${device.deviceName} (${device.ipv4Address}) - has been updated before ${secondsAgo} seconds`);
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
    show: false, //  the window default hidden
    // alwaysOnTop: true, // keep on the top
    focusable: true,  // promise the window can get focuse
    transparent: true, 
    resizable: false, // banned to fix the window
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // set the iconfont path
    parent: parentWin,
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    // sidebarWin.webContents.openDevTools()
    sidebarWin.loadURL(`${VITE_DEV_SERVER_URL}#Sidebar`)
    // Open devTool if the app is not packaged
  } else {
    sidebarWin.loadFile(indexHtml, { hash: "Sidebar" })
  }

  sidebarWin.webContents.on('did-finish-load', () => {
    let clientBounds = parentWin.getContentBounds();
    sidebarWin.setBounds({ x: clientBounds.x, y: clientBounds.y, width: 250, height: clientBounds.height });
    sidebarWin.setParentWindow(parentWin);
    // var message = {
    //   type: "Sidebar",
    // }

    // mainWin?.webContents.send('main-process-message', message)
  })
  sidebarWin.on('blur', () => {
    sidebarWin.hide()
  })
};

// header the more setting windows
// let headerMoreWin: BrowserWindow | null = null;
async function createHeaderMoreWindow(parentWin: BrowserWindow) {
  const headerMoreWin = new BrowserWindow({
    title: 'HPro Client Header More',
    frame: false,
    show: false,
    focusable: true,  
    transparent: true, 
    resizable: false, 
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    parent: parentWin,
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    headerMoreWin.loadURL(`${VITE_DEV_SERVER_URL}#HeaderMore`)
  } else {
    headerMoreWin.loadFile(indexHtml, { hash: "HeaderMore" })
  }
  headerMoreWin.on('blur', () => {
    headerMoreWin?.hide()
  })
  headerMoreWin.setAlwaysOnTop(true);
}

async function createAboutWindow(parentWin: BrowserWindow) {
  const aboutWin = new BrowserWindow({
    title: 'HPro Client About',
    frame: false,
    show: false,
    focusable: true,
    transparent: true,
    resizable: false,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    parent: parentWin,
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  })
  if (VITE_DEV_SERVER_URL) {
    aboutWin.loadURL(`${VITE_DEV_SERVER_URL}#About`)
  } else {
    aboutWin.loadFile(indexHtml, { hash: "About" })
  }
  aboutWin.on('blur', () => {
    aboutWin?.hide()
  })
  aboutWin.setAlwaysOnTop(true);
}

//main window
async function createWindow(childPath: string) {
  const windowOptions: BrowserWindowConstructorOptions = {
    title: "Hpro client main",
    width: 800,
    height: 600,
    frame: false,
    show: false,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      nodeIntegration: false,
    },
  };

  // special configuration of Mac platform
  if (process.platform === 'darwin') {
    windowOptions.acceptFirstMouse = true; // admit activate the window at first
    windowOptions.skipTaskbar = false;
  }

  let mainWin = new BrowserWindow(windowOptions);
  if (VITE_DEV_SERVER_URL) {
    mainWin.webContents.openDevTools()
    mainWin.loadURL(VITE_DEV_SERVER_URL)
    // open devTool if the app is not packaged
  } else {
    mainWin.loadFile(indexHtml)
  }

  mainWinArray.set(mainWin.webContents.id, mainWin)

  // the event about the web has been loaded
  mainWin.webContents.on('did-finish-load', () => {
    var message = {
      type: "tabs",
      data: {
        path: childPath,
      }
    }
    mainWin?.webContents.send('main-process-message', message)
  })

  // open all links via browser instead of app
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  // win.webContents.on('will-navigate', (event, url) => { }) #344
  mainWin.once('ready-to-show', () => {
    mainWin.show();
    createSidebarWindow(mainWin)
    createHeaderMoreWindow(mainWin)
    createAboutWindow(mainWin)
    //fullscreen mode
    if (!mainWin.isMaximized()) {
      mainWin.maximize();
    }
    
    // special handling for Mac platform: Ensure the main window gains focus
    if (process.platform === 'darwin') {
      setTimeout(() => {
        mainWin.focus();
        app.focus({ steal: true });
      }, 100);
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
      let clientBounds = mainWin.getContentBounds();  // get bounds of content area
      win_children.forEach(child => {
        if (child.getTitle() == "Hpro client sidebar") {
          // update child window position to follow main window
          child.setBounds({ x: clientBounds.x, y: clientBounds.y, width: 250, height: clientBounds.height });
        }else if (child.getTitle() == 'HPro Client Header More') {
          child.setBounds({ x: 0, y: 0, width: 270, height: 170 });
        } else if (child.getTitle() == 'HPro Client About') {
          child.setBounds({ x: 10, y: 10, width: 530, height: 326 })
        } else {
          // update child window position to follow main window
          child.setBounds({ x: clientBounds.x + 1, y: clientBounds.y + 40, width: clientBounds.width - 2, height: clientBounds.height - 41 });
        }
      });
    }
  }
};

// splash screen logo
const splashScreen = () => {
  logo_win = new BrowserWindow({
    title: "Hpro client logo",
    width: 750,
    height: 500,
    frame: false,
    show: false,
    // transparent: true,
    // alwaysOnTop: true, 
    focusable: true,
    resizable: false,
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),

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
    logo_win?.show()
  })
  winManager = new WindowPoolManager({ VITE_DEV_SERVER_URL, indexHtml, preload });
  const logoout = () => {
    createWindow("SiteLogin")
    logo_win?.close();
  }
  setTimeout(logoout, 3000);

};


// when Electron finishes initialization and is ready to create browser windows
app.whenReady().then(splashScreen);

// when all browser windows are closed
app.on('window-all-closed', () => {
  mainWinArray = new Map<number, BrowserWindow>();
  if (process.platform !== 'darwin') app.quit()
});

// triggered when user double-clicks app icon to relaunch
// app.on('second-instance', () => {
//   if (mainWin) {
//     // Focus on the main window if the user tried to open another
//     if (mainWin.isMinimized()) mainWin.restore()
//     mainWin.focus()
//   }
// });

// triggered when clicking dock icon to reactivate app on macos
app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow("SiteLogin")
  }
});
app.on('before-quit', (event) => {
  console.log('app about to quit');
});

app.on('will-quit', (event) => {
  console.log('app is quitting');
});

ipcMain.on('window-min', function (event) {
  // find corresponding browserwindow via webcontents
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  senderWindow?.minimize()
});
// receive the order of maximizing
ipcMain.on('window-max', function (event) {
  // find corresponding browserwindow via webcontents
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow?.isMaximized()) {
    senderWindow?.unmaximize()
  } else {
    senderWindow?.maximize()
  }
});
// receive the order of closing
ipcMain.on('window-close', function (event) {

  const win = BrowserWindow.fromWebContents(event.sender);


  let win_children = win?.getChildWindows()
  if (win_children) {
    //close the children window one by one
    win_children.forEach(child => {
      winManager?.closeWindow(child.id);
    });
  }
  win?.close()
})
// receive the order of closing tab
ipcMain.on('window-tabs-close', function (event, id) {
  //close this tab
  winManager.closeWindow(id);
})
//receive sidebar navigation display messages
ipcMain.on('sidebar-show', function (event, id) {
  const sender = event.sender;
  // find the clicked BrowserWindow by WebContents
  const win = BrowserWindow.fromWebContents(sender);
  const sidebarWindows = win?.getChildWindows().find(win => {
    const title = win.getTitle()
    return title === "Hpro client sidebar";
  })

  sidebarWindows?.show();
})

// mac focus fix: handle header window focus issues exclusively
ipcMain.on('mac-focus-fix', function (event) {
  if (process.platform === 'darwin') {
    const sender = event.sender;
    const win = BrowserWindow.fromWebContents(sender);
    
    // force activate app and focus window
    app.focus({ steal: true });
    setTimeout(() => {
      win?.focus();
      win?.moveTop();
    }, 10);
  }
})

// send to all window the information about site
ipcMain.on('get-site-device', function (event, uuid) {
  const devices = DiscoveryClient.getDevices();

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

// save the information when the site has logined
ipcMain.handle('site-device-login', function (event, data) {
  DiscoveryClient.setDevice(data);
})
// get the information of sites
ipcMain.handle('get-site-device', async (event) => {
  const devices = DiscoveryClient.getDevices();
  return devices
});
// delete a site
ipcMain.handle('delete-site-device', function (event, ipv4Address) {
  DiscoveryClient.clearDevice(ipv4Address)
  const devices = DiscoveryClient.getDevices();
  return devices
})

// add a site
ipcMain.handle('add-site-device', function (event, data) {
  DiscoveryClient.addDevice(data)
  const devices = DiscoveryClient.getDevices();
  return devices
})
//shift tab
ipcMain.on('switch-tabs', function (event, data) {
  const sender = event.sender;
  // find the clicked BrowserWindow by WebContents
  const win = BrowserWindow.fromWebContents(sender);
  let win_children = win?.getChildWindows();
  if (win_children) {
    win_children.forEach(child => {
      if (child.id == data) {
        child.show();
        // mac special handling: ensure window gains focus
        if (process.platform === 'darwin') {
          // delay focus: focus window after fully displayed
          setTimeout(() => {
            child.focus();
            // attempt to activate app if focus still fails
            if (!child.isFocused()) {
              app.focus({ steal: true });
              child.focus();
            }
          }, 10);
        }
      } else {
        child.hide();
      }
    });
  }
})
//open the new window
ipcMain.on('open-new-win', (event, arg) => {
  createWindow("View")
});
// add the new tab
ipcMain.handle('open-win-tabs', (event, arg) => {
  const newWin = winManager?.openWindow().window;
  newWin.resizable = false;
  const sender = event.sender;
  // find the clicked BrowserWindow by WebContents
  const senderWindow = BrowserWindow.fromWebContents(sender);
  if (!senderWindow) {
    return null;
  };
  let clientBounds = senderWindow.getContentBounds();
  newWin?.setBounds({ x: clientBounds.x + 1, y: clientBounds.y + 40, width: clientBounds.width - 2, height: clientBounds.height - 41 });
  newWin?.setParentWindow(senderWindow);
  let routerPath = arg.path;
  if (VITE_DEV_SERVER_URL) {
    // newWin.webContents.openDevTools()
    newWin?.loadURL(`${VITE_DEV_SERVER_URL}#${routerPath}`)
  } else {
    newWin?.loadFile(indexHtml, { hash: routerPath })
  };

  // mainWin.webContents.on('did-finish-load', () => {
  //   var message = {
  //     type: "tabs",
  //     data: {
  //       path: childPath,
  //     }
  //   }
  //   mainWin?.webContents.send('main-process-message', message)
  // })

  newWin?.once('ready-to-show', () => {
    newWin.show();
    //mac special handling: ensure window gains focus
    // if (process.platform === 'darwin') {
    //   setTimeout(() => {
    //     newWin.focus();
    //     if (senderWindow && !senderWindow.isFocused()) {
    //       senderWindow.focus();
    //     }
    //   }, 50);
    // }
  })
  newWin?.on('show', () => {
    // mac special handling: ensure window gains focus
    if (process.platform === 'darwin') {
        newWin.focus();
    }
  })
  arg.id = newWin?.id;
  return arg;
});


// receive SideBar message, tab page
ipcMain.on('sidebar-switch-tab', async (event, data) => {
  const sender = event.sender;
  //find the current BrowserWindow by WebContents
  const senderWindow = BrowserWindow.fromWebContents(sender);
  const mainWin = senderWindow.getParentWindow()
  // mainWinArray.get('header')?.webContents.send('header-switch-tab', data)
  mainWin?.webContents.send('header-switch-tab', data)
})

// open the new Page in current page
ipcMain.on('open-new-tab', async (event, arg) => {
  const newWin = winManager?.openWindow().window;
  newWin.resizable = false;
  const sender = event.sender;
  // find the current BrowserWindow by WebContents
  const senderWindow = BrowserWindow.fromWebContents(sender)?.getParentWindow();
  if (!senderWindow) {
    return null;
  };
  let clientBounds = senderWindow.getContentBounds();
  // set the new window of boundary
  newWin?.setBounds({
    x: clientBounds.x + 1,
    y: clientBounds.y + 40,
    width: clientBounds.width - 2,
    height: clientBounds.height - 41
  });
  newWin?.setParentWindow(senderWindow);
  let routerPath = arg.data.path;
  if (VITE_DEV_SERVER_URL) {
    // newWin.webContents.openDevTools()
    newWin?.loadURL(`${VITE_DEV_SERVER_URL}#${routerPath}`)
  } else {
    newWin?.loadFile(indexHtml, { hash: routerPath })
  };


  // notice header
  senderWindow.webContents.send('create-new-tab', { ...arg.data, id: newWin?.id, type: arg.type })

  newWin?.once('ready-to-show', () => {
    newWin.show();
    // Mac platform：ensure focusing the new window
    // if (process.platform === 'darwin') {
    //   setTimeout(() => {
    //     newWin.focus();
    //     // ensure the father can response the focus
    //     if (senderWindow && !senderWindow.isFocused()) {
    //       senderWindow.focus();
    //     }
    //   }, 50);
    // }
  })
  newWin?.on('show', () => {
    // Mac platform：ensure focusing the new window
    if (process.platform === 'darwin') {
        newWin.focus();
    }
  })
  
  newWin?.webContents.on('did-finish-load', () => {
    const message = {
      type: arg.type,
      data: {
        ip: arg.ip
      }
    }
    // push the message by itself
    log.info('[open-new-tab] message =>', message)
    newWin?.webContents.send('main-process-message', message)
  })
})

ipcMain.on('header-drop-down', (event) => {
  const sender = event.sender;
  //  find the clicked BrowserWindow by WebContents
  const win = BrowserWindow.fromWebContents(sender);
  const headerMoreWin = win?.getChildWindows().find(win => {
    const title = win.getTitle()
    return title === "HPro Client Header More";
  })
  headerMoreWin?.show();
  const point = screen.getCursorScreenPoint();
  headerMoreWin?.setPosition(point.x - 200, point.y + 22);
})

ipcMain.on('header-drop-hide', (event) => {
  const sender = event.sender;
  //  find the clicked BrowserWindow by WebContents
  const win = BrowserWindow.fromWebContents(sender);
  const headerMoreWin = win.getChildWindows().find(win => {
    const title = win.getTitle()
    return title === "HPro Client Header More";
  })
  headerMoreWin?.hide();
})

ipcMain.on('header-about-show', (event) => {
  const sender = event.sender;
  //  find the clicked BrowserWindow by WebContents
  const win = BrowserWindow.fromWebContents(sender);
  const parentWin = win?.getParentWindow();
  const aboutWin = parentWin?.getChildWindows().find(win => {
    const title = win.getTitle()
    return title === "HPro Client About";
  })
  if (!aboutWin) return;

  // get the position and size of parent window frist
  const [parentX, parentY] = parentWin.getPosition();
  const [parentWidth, parentHeight] = parentWin.getSize();

  const [width, height] = aboutWin.getSize();

  // curculate the center position
  const x = parentX + Math.round((parentWidth - width) / 2);
  const y = parentY + Math.round((parentHeight - height) / 2);

  aboutWin.setPosition(x, y);
  aboutWin.show();
})