declare module '*.vue' {
  import { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '@/assets/js/uplayersdk.esm.js' {
  export const UPlayerSDK: any
  export const UPlayerList: any
  export const GridLayoutManager: any
}

declare module '@/assets/js/uuid.js' {
  export default uuid; any
}

declare module '@/assets/js/h5jsevent.js' {
  export const H5jsEvent: any
}

declare module '@/assets/js/d3.v7.min.js' {
  export default d3; any
}

declare module '@/utils/localRecordingStatus.js' {
  export const RecordingStatus: any
}

declare module '@/assets/js/h5splayer.js' {
  export const H5sPlayerAudBack: any
  export const H5sPlayerWS: any
  export const H5sPlayerRTC: any
}

declare module '@/assets/js/h5jssdk.js' {
  export const AiDraw: any
  export const H5sPlayerWS2: any
}

declare module '@/assets/js/h5splayerhelper.js' {
  export const H5siOS: any
}