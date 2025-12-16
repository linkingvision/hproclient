<template>
    <div id="header">
        <div class="header-left">
            <span class="iconfont icon-caidanlan"></span>
            <img src="" alt=""> Logo占位
            <span class="iconfont icon-shouye"></span>
        </div>
        <vue3-tabs-chrome class="hpro-tabs" :ref="setTabRef" :tabs="tabs" @click="handleClick" @remove="handleRemove"
            v-model="tab" insert-to-after>
            <template v-slot:after>
                <span class="btn" v-if="afterAdd"
                    style="height: 26px;line-height: 24px; padding: 0 5px; font-size: 20px;" @click="handleAdd">+</span>
            </template>
        </vue3-tabs-chrome>
        <div class="header-right">
            <span @click.stop="addNewWindow" class="" style="font-size: 14px;width: 100px;" v-if="afterAdd">new
                win</span>
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
        viewIndex++;
        tabRef.value.addTab({
            label: msg.label + viewIndex,
            key: msg.key + viewIndex,
            path: msg.path,
            icon: "",
            id: msg.id
        });

        tab.value = msg.key + viewIndex;
    }
})

/** //去缓存里面读取tabs 初始化tabs
    console.log('[default-tabs]:', msg)
    let label = "";
    let key = "";
    switch (msg) {
        case "SetUp":
            label = "Set Up";
            key = "setup";
            break;
        case "View":
            label = "View 1";
            key = "setup";
            viewIndex = 1;
        default:
            break;
    }
    let newTab = {
        label,
        key,
        id:msg.id
    }
    tabRef.value.addTab(newTab);
    tab.value = key;
 */

//创建tabs标签数据集 初始化tabs代码写好这里需要清空
const tabs = reactive([])

const isDragging = ref(false);
let viewIndex = 0
const setTabRef = (el: any) => {
    tabRef.value = el
}

const handleClick = (event: Event, data: any) => {
    window.ipcRenderer.send('switch-tabs', data.id)
    console.log("[tab handleClick========", data);
}
const handleRemove = (data: any, index: any) => {
    console.log("[tabs remove==========", data, index);
    if (!isDragging.value) {
    } else {
        isDragging.value = false
    }
    if (tab.value) {
        window.ipcRenderer.send("action-tab-uuid", tab.value);
    } else {
    }
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
                icon: "",
                id: msg.id
            });

            tab.value = msg.key + viewIndex;
        }
    })
}

const toggleMaximize = ref('icon-xiangxiahuanyuan');
//监听最大化还原消息 
window.ipcRenderer.on('header-minimize', (_, data) => {
    toggleMaximize.value = data
});
// 最小化窗口
let addNewWindow = () => {
    window.ipcRenderer.send("open-new-win");
}
// 最小化窗口
let minimizeWindow = () => {
    window.ipcRenderer.send("window-min");
}
// 最大化/还原窗口
let toggleMaximizeWindow = () => {
    window.ipcRenderer.send("window-max");
}
// 关闭窗口
let closeWindow = () => {
    window.ipcRenderer.send("window-close");
}

</script>
<style lang="scss">
#header {
    display: flex;
    background: #dee1e6;
    user-select: none;

    .header-left {
        display: flex;
        min-width: 150px;
        text-align: center;
        height: 40px;
        line-height: 46px;

        span {
            padding: 0 10px;
            font-size: 18px;
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
            font-size: 25px;
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