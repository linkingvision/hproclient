<script setup lang="ts">
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import { useStore } from '../../store'
import { useSiteInfo } from '../../store/site-info'
import type { TabsPaneContext } from 'element-plus'
import { DiscoveredDevice } from '../../types/site-info';
import { Search } from '@element-plus/icons-vue'
import LogoBlackEN from '../../assets/image/HPro-black-en.svg'
import LogoWhiteEN from '../../assets/image/HPro-white-en.svg'
import { md5 } from 'js-md5';
import { Base64 } from 'js-base64';
import { LoginApi, GetSiteApi, LoginSessionApi } from '../../api/login';
import { ElMessage } from 'element-plus';

const store = useStore()
const siteStore = useSiteInfo();

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

const rememberUsers = ref<any[]>([])

const handleClick = (tab: TabsPaneContext, event: Event) => {
    console.log(tab, event)
}

const siteDevice = ref<Array<DiscoveredDevice>>([])
const getSiteDevice = async () => {
    window.ipcRenderer.invoke('get-site-device').then((msg: Array<DiscoveredDevice>) => {
        console.log('Received get-site-device data:', msg);
        siteDevice.value = msg
    })
}
const timerRef = ref<NodeJS.Timeout | null>(null);

//登录成功调用
//window.ipcRenderer.on('get-site-device')

const clickSite = (row: any) => {
    // console.log('click Site => ', row)
    checkedSites.value = row
    const userIndex = rememberUsers.value.findIndex((item: any) => item.ipv4Address == row.ipv4Address)
    if (userIndex !== -1) {
        const pwd = rememberUsers.value[userIndex].password.slice(11);
        form.username = rememberUsers.value[userIndex].username;
        form.password = Base64.decode(pwd);
        form.enableHttps = rememberUsers.value[userIndex].enableHttps;
        form.remPwd = rememberUsers.value[userIndex].rememberPwd;
    } else {
        Object.assign(form, {
            username: '',
            password: '',
            enableHttps: false,
            remPwd: false
        })
    }
}
const addSite = async () => {
    if (!addform.ip || !addform.port) return;
    const root = window.location.protocol + '//' + addform.ip + ':' + addform.port;
    const res = await GetSiteApi(root)
    if (res.status == 200 && res.data.code == 200) {
        const result = res.data.result;
        window.ipcRenderer.invoke('add-site-device', {
            uuid: result.UUID,
            deviceName: result.DeviceName,
            ipv4Address: result.IPv4Address,
            httpPort: result.HttpPort,
            httpsPort: result.HttpsPort,
            softwareVersion: result.SoftwareVersion,
        }).then((msg: Array<DiscoveredDevice>) => {
            siteDevice.value = msg;
        })
        addVisible.value = false;
    }
}
const delSite = (ip: string) => {
    checkedSites.value = {};
    console.log('Del Site => ', ip)
    window.ipcRenderer.invoke('delete-site-device', ip).then((msg: Array<DiscoveredDevice>) => {
        console.log('Received get-site-device data:', msg);
        siteDevice.value = msg
    })
}

const LogIn = async () => {
    // console.log(checkedSites.value)
    // return
    if (!checkedSites.value || !checkedSites.value.ipv4Address) return;
    const params = {
        username: form.username,
        password: md5(form.password)
    };
    // console.log('params =>', params)
    let root;
    if (form.enableHttps) {
        root = 'https://' + checkedSites.value.ipv4Address + ':' + checkedSites.value.httpsPort;
    } else {
        root = 'http://' + checkedSites.value.ipv4Address + ':' + checkedSites.value.httpPort;
    }
    const res = await LoginApi(root, params, )
    // console.log('Login res => ', res)
    if (res.status == 200 && res.data.code == 0) {
        const result = res.data.result;

        const sessionRes = await LoginSessionApi(root, result.access_token);
        if (sessionRes.status === 200 && sessionRes.data.code === 0) {
            console.log(sessionRes.data.result.session)
            window.ipcRenderer.invoke('site-device-login', {
                ...checkedSites.value,
                login: true,
                access_token: result.access_token,
                session: sessionRes.data.result.session
            })
            ElMessage({
                message: '登录成功',
                type: 'success',
                duration: 2000
            })
            await getSiteDevice();
            siteStore.setSiteDevices(siteDevice.value)
            // const sites = siteStore.getSiteDevices();
            // console.log('siteStore sites =>', sites)
            // console.log('localstorage siteInfo =>', localStorage.getItem('siteInfo'))
            const usersStr = localStorage.getItem('users');
            let users = usersStr ? JSON.parse(usersStr) : [];
            if (form.remPwd) {
                const random = randomWord(11);
                const encryption = random + Base64.encode(form.password);
                let userIndex = users.findIndex((item: any) => item.ipv4Address == checkedSites.value.ipv4Address)
                const user = {
                    username: form.username,
                    password: encryption,
                    rememberPwd: form.remPwd,
                    enableHttps: form.enableHttps,
                    ipv4Address: checkedSites.value.ipv4Address
                }
                if (userIndex !== -1) {
                    users[userIndex] = user
                } else {
                    users.push(user)
                }
                localStorage.setItem('users', JSON.stringify(users))
            } else {
                users = users.filter((item: any) => item.ipv4Address != checkedSites.value.ipv4Address)
                localStorage.setItem('users', JSON.stringify(users))
            }
        }
    } else {
        ElMessage({
            message: '登录失败',
            type: 'error',
            duration: 2000
        })
    }
}
const randomWord = (num:number) => {
    var str = "",
        arr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    let pos;
    for (var i = 0; i < num; i++) {
        pos = Math.round(Math.random() * (arr.length - 1));
        str += arr[pos];
    }
    return str;
}
// 在组件挂载时启动定时器
onMounted(() => {
    // 查询记录的账号密码
    const usersStr = localStorage.getItem('users');
    rememberUsers.value = usersStr ? JSON.parse(usersStr) : [];

    // 立即执行一次
    getSiteDevice();
    // 设置定时器，并保存引用
    timerRef.value = setInterval(() => {
        getSiteDevice();
    }, 10000);
});
onUnmounted(() => {
    if (timerRef.value) {
        clearInterval(timerRef.value);
        timerRef.value = null;
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
                        class="site-item" :class="{'active-item': (item.uuid == checkedSites.uuid), 'isLogin': item.login}"
                        @click="clickSite(item)">
                        <i class="iconfont icon-shebei"></i>
                        <span>{{ item.deviceName }}</span>
                        <i class="iconfont icon-guanbi1 close" @click.stop="delSite(item.ipv4Address)"></i>
                    </li>
                </ul>
                <ul class="sites-list" v-if="activeName == 'available'">
                    <li v-for="item in siteDevice?.filter(data => !filterText || data.deviceName.toLowerCase().includes(filterText.toLowerCase()))"
                        v-show="item.enabled" class="site-item" :class="{'active-item': (item.uuid == checkedSites.uuid), 'isLogin': item.login}"
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
                        <el-input v-model="form.username" placeholder="Username"></el-input>
                    </el-form-item>
                    <el-form-item label="Password">
                        <el-input v-model="form.password" type="password" placeholder="Password" show-password></el-input>
                    </el-form-item>
                    <!-- <el-form-item></el-form-item> -->
                </el-form>
                <div class="checkboxs">
                    <el-checkbox v-model="form.enableHttps" label="Enable HTTPS" />
                    <el-checkbox v-model="form.remPwd" label="Remember password" />
                </div>
                <el-button class="login-submit" type="primary" @click="LogIn" :disabled="!checkedSites.ipv4Address || checkedSites.login">Log In</el-button>
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
        .isLogin {
            background-color: #0399FE;
            .close {
                color: #fff;
            }
        }
        .site-item:hover {
            background-color: #4D5C70;
            cursor: pointer;
        }
        .isLogin:hover {
            background-color: #0399FE;
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
