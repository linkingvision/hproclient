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
declare module '*/timeline-canvas.js'{
  export class TimeSlider{
    constructor(options:{
      canvasid:string;
      init_cells?:any[];
      thumbing_cb?:Function|null;
      begintime?:Date | number;
      videoid?:string|null;
      mousedown?:()=>void;
      mouseup?:(time:number)=>void;
      mousemove?:()=>void;
      croppingCallback?:(type:'start'|'end',time:Date) => void;
    });
    set_cells(cells:any[]):void;
    set_time_to_middle(time:number):void;
    setZoom(zoom:24|20|16|12|8|4|1):void;
    clearLine():void;
    IsCropping():void;
    set_start_time(time:number):void;
    clearCanvas():void;
    init(redrawFlag:boolean):void;
    draw_cells():void;
    draw_cropping():void;
  }
};
declare module '*uplayersdk.esm.js'
declare module '*h5splayer.js'
declare module '*webpluginsdk.esm.js'{
  export class WebPluginPlayer{
    constructor(config:any);
    connect():void;
    disconnect():void;
    [key:string]:any;
  }
};


interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import('electron').IpcRenderer
  $wplPlayer:any
  h5jssdk:any
}
