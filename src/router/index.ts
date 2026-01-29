import type { RouteRecordRaw } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

let basicRoutes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Container',
        component: () => import('../components/Container.vue'),
        redirect: '/Home',  // 添加此行，确保根路径自动重定向到 /home
        children: [{
            path: '/Home',
            name: 'Home',
            component: () => import('../views/home/Home.vue'),
        }]
    }, {
        path: '/Logo',
        name: 'Logo',
        component: () => import('../components/Logo.vue'),
    }, {
        path: '/SiteLogin',
        name: 'SiteLogin',
        component: () => import('../views/site-login/SiteLogin.vue'),
    }, {
        path: '/View',
        name: 'View',
        component: () => import('../views/view/View.vue'),
    }, {
        path: '/Sidebar',
        name: 'Sidebar',
        component: () => import('../components/Sidebar.vue'),
    }, {
        path: '/Setup',
        name: 'Setup',
        component: () => import('../views/setup/Setup.vue'),
        redirect: '/Setup/Index',
        children: [{
            path: 'Index',
            name: 'SetupIndex',
            component: () => import('../views/setup/index.vue')
        }]
    }, {
        path: '/StorageSetting',
        name: 'StorageSetting',
        component: () => import('../views/setup/Storage/StorageSetting.vue'),
        redirect: '/StorageSetting/StorageMode',
        children: [{
            path: 'StorageMode',
            name: 'StorageMode',
            component: () => import('../views/setup/Storage/StorageMode.vue')
        }, {
            path: 'MetaStorage',
            name: 'MetaStorage',
            component: () => import('../views/setup/Storage/MetaStorage.vue')
        }, {
            path: 'LocalStorage',
            name: 'LocalStorage',
            component: () => import('../views/setup/Storage/LocalStorage.vue')
        }, {
            path: 'S3Storage',
            name: 'S3Storage',
            component: () => import('../views/setup/Storage/S3Storage.vue')
        },]
    }, {
        path: '/User',
        name: 'User',
        component: () => import('../views/setup/User/User.vue'),
        redirect: '/User/UserConfig',
        children: [{
            path: 'UserConfig',
            name: 'UserConfig',
            component: () => import('../views/setup/User/UserConfig.vue')
        }]
    }, {
        path: '/DeviceManagement',
        name: 'DeviceManagement',
        component: () => import('../views/setup/Device/DeviceManagement.vue'),
        redirect: '/DeviceManagement/VideoDevice',
        children: [{
            path: 'VideoDevice',
            name: 'VideoDevice',
            component: () => import('../views/setup/Device/VideoDevice.vue')
        }, {
            path: 'AccessControlDevice',
            name: 'AccessControlDevice',
            component: () => import('../views/setup/Device/AccessControlDevice.vue')
        }]
    },{
        path: '/VideoConfiguration',
        name: 'VideoConfiguration',
        component: () => import('../views/setup/VideoConfig/VideoConfiguration.vue'),
        redirect: '/VideoConfiguration/ChannelSetting',
        children: [{
            path: 'ChannelSetting',
            name: 'ChannelSetting',
            component: () => import('../views/setup/VideoConfig/ChannelSetting.vue')
        }, {
            path: 'RecordingStatus',
            name: 'RecordingStatus',
            component: () => import('../views/setup/VideoConfig/RecordingStatus.vue')
        }, {
            path: 'CameraPoint',
            name: 'CameraPoint',
            component: () => import('../views/setup/VideoConfig/CameraPoint.vue')
        }]
    }
]

// app router
// 创建一个可以被 Vue 应用程序使用的路由实例
export const router = createRouter({
    // 创建一个 hash 历史记录。
    history: createWebHashHistory('/'),
    // 应该添加到路由的初始路由列表。
    routes: basicRoutes as unknown as RouteRecordRaw[],
    // 是否应该禁止尾部斜杠。默认为假
    strict: true,
    scrollBehavior: () => ({ left: 0, top: 0 }),
});
