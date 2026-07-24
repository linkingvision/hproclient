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
        show: false,
        hasShadow: false,
        transparent: true,
        focusable: true,
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
        webPreferences: {
          devTools: true,
          preload: this.preload,
          nodeIntegration: true,
        },
      };

      if (process.platform === 'darwin') {
        windowOptions.acceptFirstMouse = true;
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

    log.info(`[WindowPool] total window poll: ${poolsArray.length}, active window number: ${activeCount}`);
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
    // get the children of current window
    let win_children = windowPool.window.getChildWindows()
    if (win_children) {
      // close children one by one
      win_children.forEach(child => {
        child.close()
      });
    }

    windowPool.window.close()
    this.windowPools.delete(id);
  }

}

export default WindowPoolManager;