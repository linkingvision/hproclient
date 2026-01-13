<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useStore } from '../../store'
import type { TabsPaneContext } from 'element-plus'
import { DiscoveredDevice } from '../../types/site-info';
import { Search } from '@element-plus/icons-vue'
import LogoBlackEN from '../../assets/image/HPro-black-en.svg'
import LogoWhiteEN from '../../assets/image/HPro-white-en.svg'
import axios from 'axios'

const store = useStore()

const activeName = ref('all')
const filterText = ref<string>('')
const checkedSites = ref<any>({})
const form = reactive<any>({
    username: '',
    password: '',
    enableHttps: false,
    remPwd: false
})
const addform = reactive({
    uuid: '',
    ip: '',
    port: '',
    deviceName: '',

})
const addVisible = ref<boolean>(false)

const handleClick = (tab: TabsPaneContext, event: Event) => {
    console.log(tab, event)
}
const siteDevice = ref<Array<DiscoveredDevice>>()
function getSiteDevice() {
    window.ipcRenderer.invoke('get-site-device').then((msg: Array<DiscoveredDevice>) => {
        console.log('Received get-site-device data:', msg);
        siteDevice.value = msg
    })
}
const timerRef = ref<NodeJS.Timeout | null>(null);

//登录成功调用
//window.ipcRenderer.on('get-site-device')

const GetSite = async () => {
    if (!addform.ip || !addform.port) return;
    const url = window.location.protocol + '//' + addform.ip + ':' + addform.port + '/uapi/v1/DiscoverService/Site';
    return axios({
        url,
        method:'GET'
    })
}

const clickSite = (row: any) => {
    console.log('click Site => ', row)
    checkedSites.value = row
}
const addSite = () => {
    GetSite().then((res: any) => {
        console.log('Get Site =>', res);
        if (res.status == 200 && res.data.code == 200) {
            console.log('可以添加')
        }
    }).catch(error => {
        console.error('Get Site 失败，不存在 =>', error)
    })
}
const delSite = (ip: string) => {
    console.log('Del Site => ', ip)
    window.ipcRenderer.invoke('delete-site-device', ip).then((msg: Array<DiscoveredDevice>) => {
        console.log('Received get-site-device data:', msg);
        siteDevice.value = msg
    })
}
// 在组件挂载时启动定时器
onMounted(() => {
    // 立即执行一次
    getSiteDevice();
    // 设置定时器，并保存引用
    timerRef.value = setInterval(() => {
        getSiteDevice();
    }, 10000);
    // console.log(window.location.protocol)
});
onUnmounted(() => {
    if (timerRef.value) {
        clearInterval(timerRef.value);
        timerRef.value = null;
        console.log('定时器已清除');
    }
});
</script>

<template>
    <div id="setup">
        <div class="sites_select">
            <div class="login-left">
                <div class="login-logo" v-if="store.darkMode">
                    <img :src="store.lang === 'en' ? LogoBlackEN : ''" alt="">
                </div>
                <div class="login-logo" v-else>
                    <img :src="store.lang === 'en' ? LogoWhiteEN : ''" alt="">
                </div>
                <div class="sites_search">
                    <span>Select Sites</span>
                    <span class="add-sites" @click="addVisible = true"><i class="iconfont icon-jia"></i> Add Sites</span>
                </div>
                <el-input
                    v-model="filterText"
                    placeholder="Please Input"
                    :prefix-icon="Search"
                    class="search-input"
                />
                <el-radio-group v-model="activeName" class="login-tabs" @tab-click="handleClick" size="small">
                    <el-radio-button value="all">ALL</el-radio-button>
                    <el-radio-button value="available">Available</el-radio-button>
                    <el-radio-button value="unavailable">Unavailable</el-radio-button>
                </el-radio-group>
                <ul class="sites-list" v-if="activeName == 'all'">
                    <li v-for="item in siteDevice?.filter(data => !filterText || data.deviceName.toLowerCase().includes(filterText.toLowerCase()))"
                        class="site-item" :class="{'active-item': (item.uuid == checkedSites.uuid)}"
                        @click="clickSite(item)">
                        <i class="iconfont icon-shebei"></i>
                        <span>{{ item.deviceName }}</span>
                        <i class="iconfont icon-guanbi1 close" @click.stop="delSite(item.ipv4Address)"></i>
                    </li>
                </ul>
                <ul class="sites-list" v-if="activeName == 'available'">
                    <li v-for="item in siteDevice?.filter(data => !filterText || data.deviceName.toLowerCase().includes(filterText.toLowerCase()))"
                        v-show="item.enabled" class="site-item" :class="{'active-item': (item.uuid == checkedSites.uuid)}"
                        @click="clickSite(item)">
                        <i class="iconfont icon-shebei"></i>
                        <span>{{ item.deviceName }}</span>
                        <i class="iconfont icon-guanbi1 close" @click.stop="delSite(item.ipv4Address)"></i>
                    </li>
                </ul>
                <ul class="sites-list" v-if="activeName == 'unavailable'">
                    <li v-for="item in siteDevice?.filter(data => !filterText || data.deviceName.toLowerCase().includes(filterText.toLowerCase()))" v-show="!item.enabled" class="site-item">
                        <i class="iconfont icon-shebei"></i>
                        <span>{{ item.deviceName }}</span>
                        <i class="iconfont icon-guanbi1 close" @click.stop="delSite(item.ipv4Address)"></i>
                    </li>
                </ul>
            </div>
            <div class="login-right">
                <el-form :model="form" label-position="top" style="width: 100%;">
                    <el-form-item label="Username">
                        <el-input v-model="form.username"></el-input>
                    </el-form-item>
                    <el-form-item label="Password">
                        <el-input v-model="form.password" type="password" show-password></el-input>
                    </el-form-item>
                    <!-- <el-form-item></el-form-item> -->
                </el-form>
                <div class="checkboxs">
                    <el-checkbox v-model="form.enableHttps" label="Enable HTTPS" />
                    <el-checkbox v-model="form.remPwd" label="Remember password" />
                </div>
                <el-button class="login-submit" type="primary" >Log In</el-button>
            </div>
             <el-dialog v-model="addVisible" title="Add Site" width="340">
                <el-form :model="addform" label-position="top">
                    <el-form-item label="IP">
                        <el-input v-model="addform.ip"></el-input>
                    </el-form-item>
                    <el-form-item label="Port">
                        <el-input v-model="addform.port"></el-input>
                    </el-form-item>
                    <el-form-item class="submit-label" style="margin-top: 50px;">
                        <el-button type="primary" @click="addSite" class="add-site">Add</el-button>
                    </el-form-item>
                </el-form>
             </el-dialog>
        </div>
    </div>
</template>

<style lang="scss">
#setup {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: url('../../assets/image/login-background.png');
    background-size: cover; /* 图片等比例缩放，完全覆盖容器 */
    background-position: center center; /* 确保重要部分居中 */
    background-repeat: no-repeat;
    .sites-list {
        width: 100%;
        // max-height: 230px;
        height: 230px;
        // overflow: hidden;
        overflow-y: auto;
        // display: flex;
        background-color: #3B3B3B;
        border-radius: 0 0 2px 2px ;
        .site-item {
            width: 100%;
            height: 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #3B3B3B;
            padding: 0 10px;
            margin-bottom: 1px;
            i {
                font-size: 18px;
            }
            .close {
                color: #A8A8A8;
            }
            span {
                font-size: 14px;
            }
            .close:hover {
                color: #FF682C;
            }
            
        }
        .active-item {
            background-color: #4D5C70;
        }
        .site-item:hover {
            background-color: #4D5C70;
            cursor: pointer;
        }
    }
    .sites_select {
        width: 800px;
        height: 496px;
        display: flex;
        .login-left, .login-right {
            width: 400px;
            height: 100%;
            padding: 50px;
        }
        .login-left {
            border-right: 2px solid #222222;
            .login-logo {
                img {
                    height: 24px;
                }
            }
        }
        .login-right {
            padding-top: 100px;
            position: relative;
            .el-form-item__label {
                opacity: 0.7;
            }
            .checkboxs {
                width: 100%;
                display: flex;
                justify-content: space-between;
            }
            .el-checkbox {
                .el-checkbox__label {
                    font-size: 14px;
                    opacity: 0.7;
                }
            }
            .login-submit {
                width: 100%;
                margin-top: 108px;
            }
        }
        .sites_search{
            // height: 40px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            span {
                opacity: 0.7;
            }
            .add-sites {
                cursor: pointer;
            }
        }
        .search-input {
            margin: 14px 0;
        }
        .login-tabs {
            width: 100%;
            display: flex;
            .el-radio-button {
                flex: 1;
                .el-radio-button__inner {
                    width: 100%;
                }
            }
        }
        .el-dialog {
            padding: 40px;
            // .submit-label {
            //     .el-form-item__content {
                    // display: flex;
            //         justify-content: center;
            //     }
            // }
            .add-site {
                margin: 0 auto;
            }
        }
    }
}
</style>
