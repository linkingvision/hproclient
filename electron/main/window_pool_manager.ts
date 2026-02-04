import path from 'node:path';
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';
import log from 'electron-log';

export type WindowPools = {
  id: number,
  active: boolean,
  window: BrowserWindow
}

class WindowPoolManager {
  private windowPoolSize: number;
  private windowPools: Map<number, WindowPools>;
  private VITE_DEV_SERVER_URL: string;
  private indexHtml: string;
  private preload: string;

  constructor(options: { indexHtml: string, VITE_DEV_SERVER_URL: string, preload: string }) {
    this.windowPoolSize = 5;
    this.VITE_DEV_SERVER_URL = options.VITE_DEV_SERVER_URL;
    this.indexHtml = options.indexHtml;
    this.preload = options.preload;
    this.windowPools = new Map<number, WindowPools>();
    this.initPool();
  }

  private initPool() {
    for (let i = 0; i < this.windowPoolSize; i++) {
      const windowOptions: BrowserWindowConstructorOptions = {
        title: "Hpro client",
        width: 800,
        height: 600,
        frame: false,
        show: false, // 窗口默认隐藏
        hasShadow: false,
        transparent: true, // 窗口透明
        focusable: true,  // 保证窗口可以获得焦点
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // 设置图标路径
        webPreferences: {
          devTools: true,
          preload: this.preload,
          nodeIntegration: true,
        },
      };

      // Mac平台特殊配置
      if (process.platform === 'darwin') {
        windowOptions.acceptFirstMouse = true; // 允许第一次点击就激活窗口
        windowOptions.skipTaskbar = false;
      }

      this.createPoolWindow(windowOptions);
    }
  }

  private createPoolWindow(windowOptions: BrowserWindowConstructorOptions): { id: number, windowPool: WindowPools } {
    const win = new BrowserWindow({ ...windowOptions });
    let windowPool = {
      id: win.id,
      active: false,
      window: win
    }
    this.windowPools.set(win.id, windowPool);
    return {
      id: win.id,
      windowPool,
    };
  }


  public openWindow(): WindowPools {
    let win: WindowPools;
    const poolsArray = Array.from(this.windowPools.values());
    for (const windowPool of poolsArray) {
      if (!windowPool.active) {
        windowPool.active = true;
        win = windowPool;
        break;
      }
    }

    const activeCount = poolsArray.reduce(
      (count, pool) => count + (pool.active ? 1 : 0), 0
    );
    if (poolsArray.length - activeCount < 2) {
      this.initPool();
    }

    log.info(`[WindowPool] 总窗口池: ${poolsArray.length}, 活跃窗口数量: ${activeCount}`);
    return win;
  }

  public getWindow(id: number): BrowserWindow {
    let windowPool = this.windowPools.get(id);
    return windowPool.window;
  }

  public getAllWindow(): BrowserWindow[] {
    const activeWindows: BrowserWindow[] = [];

    this.windowPools.forEach((windowPool) => {
      if (windowPool.active) {
        activeWindows.push(windowPool.window);
      }
    });

    return activeWindows;
  }

  public closeWindow(id: number) {
    let windowPool = this.windowPools.get(id);
    if (!windowPool) {
      return;
    }
    //获取当前窗口的子窗口
    let win_children = windowPool.window.getChildWindows()
    if (win_children) {
      //逐个关闭子窗口
      win_children.forEach(child => {
        child.close()
      });
    }

    windowPool.window.close()
    this.windowPools.delete(id);
  }

}

export default WindowPoolManager;