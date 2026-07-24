<template>
    <div id="header">
        <div class="header-left">
            <i class="iconfont icon-caidanlan" @click="sidebarShow"></i>
            <!-- <img src="" alt=""> Logo sit a sit -->
             <div class="sidebar-logo" v-if="store.darkMode">
                <img :src="store.lang === 'en' ? LogoBlackEN : ''" alt="">
            </div>
            <div class="sidebar-logo" v-else>
                <img :src="store.lang === 'en' ? LogoWhiteEN : ''" alt="">
            </div>
            <i class="iconfont icon-shouye"></i>
        </div>
        <vue3-tabs-chrome class="hpro-tabs" :ref="setTabRef" :tabs="tabs" @click="handleClick" @remove="handleRemove"
            v-model="tab" insert-to-after>
            <template v-slot:after>
                <span class="btn" v-if="afterAdd"
                    style="height: 24px;line-height: 24px; padding: 0 5px; text-align: center; font-size: 20px;" @click="handleAdd">+</span>
            </template>
        </vue3-tabs-chrome>
        <div class="header-right">
            <!-- <span @click.stop="addNewWindow" class="" style="font-size: 14px;width: 100px;" v-if="afterAdd">New Win</span> -->
            <!-- <span class="iconfont icon-xiazai"></span> -->
            <!-- <span class="iconfont icon-lingdang"></span> -->
            <span class="iconfont icon-androidgengduo" @click="DropDown"></span>
            <span @click.stop="minimizeWindow" class="iconfont icon-zuixiaohua"></span>
            <span @click.stop="toggleMaximizeWindow" class="iconfont" :class="toggleMaximize"></span>
            <span @click.stop="closeWindow" class="close iconfont icon-guanbibiaoqian"></span>
        </div>
    </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { Vue3TabsChrome } from "vue3-tabs-chrome";
import "vue3-tabs-chrome/dist/vue3-tabs-chrome.css";
import { useStore } from '../store';
import LogoBlackEN from '../assets/image/HPro-black-en.svg'
import LogoWhiteEN from '../assets/image/HPro-white-en.svg'
import LoginImg from './favicos/Login.png'
import viewImg from './favicos/view.png'
import UserImg from './favicos/User.png';
import setupImg from './favicos/setup.png';
import StorageImg from './favicos/StorageSetting.png'
import DeviceImg from './favicos/DeviceManagement.png'
import VideoImg from './favicos/VideoConfiguration.png'
import General from './favicos/General.png'
import MapImg from './favicos/map.png'

const store = useStore()

const afterAdd = ref(true)
const tabRef = ref()
const tab = ref()

function getSiteDevice() {
    window.ipcRenderer.invoke('get-site-device').then((msg: Array<any>) => {
        if (msg.length > 0 && msg.find((e) => e.login)?.length > 0) {
            afterAdd.value = true;
        }
    })
}
getSiteDevice();

window.ipcRenderer.invoke('open-win-tabs', {
    label: 'Site Login',
    key: 'sitelogin',
    path: "SiteLogin",
}).then((msg: any) => {
    if (msg) {
        tabRef.value.addTab({
            label: msg.label,
            key: msg.key,
            path: msg.path,
            icon: "",
            favico: LoginImg,
            id: msg.id
        });

        tab.value = msg.key;
    }
})

// creat tabs group, init tabs, need empty
const tabs = reactive<any[]>([])

const isDragging = ref(false);
let viewIndex = 0
const setTabRef = (el: any) => {
    tabRef.value = el
}

const sidebarShow = (event: Event) => {
    // console.log("sidebar-show=========>", event);

    window.ipcRenderer.send('sidebar-show')
}
const handleClick = (event: Event, data: any) => {
    window.ipcRenderer.send('switch-tabs', data.id)
    // console.log("[tab handleClick========", data, tabs);
}
const handleRemove = (data: any, index: any) => {
    // console.log("[tabs remove==========",tabs , data);
    // if (tabs.length > 1) {
        window.ipcRenderer.send("window-tabs-close", data.id);
    // }
};
const handleAdd = () => {
    let arg = {
        label: 'View ',
        key: "view",
        path: "View",
    }
    window.ipcRenderer.invoke('open-win-tabs', arg).then((msg: any) => {
        console.log('Received open-win-tabs data:', msg);
        if (msg) {
            viewIndex++;
            tabRef.value.addTab({
                label: msg.label + viewIndex,
                key: msg.key + viewIndex,
                path: msg.path,
                id: msg.id,
                favico: viewImg
            });

            tab.value = msg.key + viewIndex;
        }
        console.log('header tabs =>', tabs)
    })
}

const toggleMaximize = ref('icon-xiangxiahuanyuan');
//listen minimize message
window.ipcRenderer.on('header-minimize', (_, data) => {
    toggleMaximize.value = data
});

// minimize window
let minimizeWindow = () => {
    window.ipcRenderer.send("window-min");
}
// maximize window
let toggleMaximizeWindow = () => {
    window.ipcRenderer.send("window-max");
}
// close window
let closeWindow = () => {
    window.ipcRenderer.send("window-close");
}

const openSiteLogin = async(_: any, data: any) => {
    console.log('header-switch-tab =>', data, tabs)
    const tabItem = tabs.find(item => item.key == data);
    if (tabItem) {
        window.ipcRenderer.send('switch-tabs', tabItem.id)
        tab.value = tabItem.key;
    } else {
        const tabConfig = getTabConfig(data);
        window.ipcRenderer.invoke('open-win-tabs',tabConfig).then((msg: any) => {
            if (msg) {
                tabRef.value.addTab({
                    label: msg.label,
                    key: msg.key,
                    path: msg.path,
                    icon: "",
                    id: msg.id,
                    favico:getFavico(data) 
                });
                tab.value = msg.key;
            }
        })
    }
}

const getTabConfig = (key:string) => {
    const configMap:Record<string,{label:string,key:string,path:string}> = {
        'sitelogin':{label:'Site Login',key:'sitelogin',path:'SiteLogin'},
        'view':{label:'View',key:'View',path:'View'},
        'map':{label:'Map',key:'map',path:'Map'},


    }
    return configMap[key];
}

const getFavico = (key:string) => {
    const favicoMap:Record<string,any> = {
        'sitelogin':LoginImg,
        'view':viewImg,
        'map':MapImg,


    }
    return favicoMap[key];
}

const createTab = async (_: any, data: any) => {
    if (data) {
        const newTabData = {
            label: data.label,
            key: data.key,
            path: data.path,
            favico: "",
            id: data.id
        }
        switch(data.type) {
            case 'view': newTabData.favico = viewImg; break;
            case 'setup': newTabData.favico = setupImg; break;
            case "StorageSetting": newTabData.favico = StorageImg; break;
            case 'User': newTabData.favico = UserImg; break;
            case 'DeviceManagement': newTabData.favico = DeviceImg; break;
            case 'VideoConfiguration': newTabData.favico = VideoImg; break;
            case 'General': newTabData.favico = General; break;
            case 'Map': newTabData.favico = MapImg; break;
            default: newTabData.favico = ''
        }
        tabRef.value.addTab(newTabData)
        tab.value = data.key;
    }
    console.log('header tabs =>', tabs)
}

const DropDown = () => {
    console.log('header drop-down')
    window.ipcRenderer.send('header-drop-down')
}

onMounted(() => {
    window.ipcRenderer.on('header-switch-tab', openSiteLogin)
    window.ipcRenderer.on('create-new-tab', createTab)
})

onUnmounted(() => {
    window.ipcRenderer.off('header-switch-tab', openSiteLogin)
    window.ipcRenderer.off('create-new-tab', createTab)
})

console.log('Header')
</script>
<style lang="scss">
#header {
    display: flex;
    background: #dee1e6;
    user-select: none;

    .header-left {
        display: flex;
        min-width: 150px;
        // text-align: center;
        height: 40px;
        // line-height: 46px;
        padding: 0 10px;
        justify-content: space-between;
        align-items: center;
        i {
            // padding: 0 10px;
            font-size: 22px;
            cursor: pointer;
        }
        .icon-caidanlan {
            font-size: 22px;
        }
        img {
            height: 20px;
            margin-left: 10px;
            display: block;
        }
    }

    .hpro-tabs {
        -webkit-app-region: drag;
        flex: 1;
        padding-top: 6px;

        .tabs-main {
            -webkit-app-region: no-drag;
        }

        .tabs-close {
            -webkit-app-region: no-drag;
        }

        .btn {
            -webkit-app-region: no-drag;
        }

        .btn:hover {
            background-color: #A8C7FA;
            border-radius: 50%;
            cursor: pointer;
        }
        .tabs-favico {
            height: 22px;
        }
    }

    .el-tabs--card .el-tabs__header {
        -webkit-app-region: drag;

        .el-tabs__nav {
            -webkit-app-region: no-drag;
            user-select: none;

        }

        // .el-tabs__new-tab {
        //     width: 270px;
        //     border: none;
        // }
    }

    .header-right {
        -webkit-app-region: no-drag;

        cursor: pointer;
        display: flex;
        justify-content: flex-end;

        span {
            display: inline-block;
            line-height: 40px;
            width: 40px;
            text-align: center;
            font-size: 18px;
        }

        span:hover {
            background-color: #BDCCE3;
        }

        .close:hover {
            background-color: red;
        }
    }


}
</style>