import path from 'node:path';
import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

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
      this.createPoolWindow({
        title: "Hpro client",
        width: 800,
        height: 600,
        frame: false,
        show: false, // 窗口默认隐藏
        hasShadow: false,
        transparent: true, // 窗口透明
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'), // 设置图标路径
        webPreferences: {
          devTools: true,
          preload: this.preload,
          nodeIntegration: true,
        },
      });
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
    if (activeCount < 2) {
      this.initPool();
    }
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