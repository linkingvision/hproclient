/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*h5jssdk.esm.js'{
export class H5sPlayerWS2 {
    constructor(config: any);
    connect(): void;
    disconnect(): void;
    start(): void;
    pause(): void;
    resume(): void;
    seek(time: number): void;
    moveto(time: string): void;
    speed(speed: number): void;
    getStatus(): any;
  }
  
  export class AiDraw {
    constructor(canvas: HTMLCanvasElement, secondaryCanvas?: HTMLCanvasElement);
    setDefaultArrowDirection(direction: string): void;
    setLines(config: any): void;
    setPolygon(points: any[], id: string): void;
    setLinesCount(id: string, enter: number, leave: number): void;
    clearCanvas(): void;
    getLines(): any[];
    getPolygons(): any[];
    deleteLine(line: any): void;
    deletePolygon(polygon: any): void;
  }
  
  export function PackBitsCompress(data: string): string;
  export function PackBitsDecompress(data: string): string;
}

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
}
