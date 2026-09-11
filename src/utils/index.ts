import { ref, onUnmounted ,Ref} from 'vue';
export interface headerTab {
    label: string,
    key: string,
    icon: string,
    path: string
}
export interface TreeNode {
    name: string;
    devPartitionName: string;
    iconfont: string;
    // cascadeCode: string;
    // chanOnlineCount: number;
    // chanTotal: number;
    // disOrder:number;
    // parentDevPartition?:number;
    // parentId:number
    leaf: boolean;
    children: any[];
    dev?: any[];
    casDev?: any[];
    view?: any[];
    map?: any[];
    accessDev?: any[];
    // more attributes can be added according to actual requirements
}
// define layout type
export type Layout = {
    [key: string]: number;
};

// button status interface
export interface GamepadButtonState {
  pressed: boolean;
  value: number;
  index: number;
}

// joystick status interface
export interface GamepadAxisState {
  value: number;
  index: number;
}
