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
        component: () => import('../views/setup/Setup.vue')
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
