import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DiscoveredDevice } from '../types/site-info';

export const useSiteInfo = defineStore('siteStore', () => {
    const siteDevices = ref<Array<DiscoveredDevice>>([])

    function getSiteDevice(params: string) {
        return siteDevices.value.find(
            device => device.ipv4Address === params
        )
    }
    function getSiteDevices() {
        return siteDevices.value
    }
    function setSiteDevices(data: Array<DiscoveredDevice>) {
        console.log('store setSite =>', data)
        siteDevices.value = data;
    }
    function updateSiteName(ip: string, name: string) {
        siteDevices.value = siteDevices.value.map(item => {
            if (item.ipv4Address === ip) {
                return { ...item, deviceName: name }; // 创建新对象
            }
            return item;
        });
    }

    // 监听 localStorage 变化
    const storageKey = 'siteStore';
    const handleStorageChange = (event: StorageEvent): void => {
        // console.log('handleStorageChange =>', event.newValue)
        if (event.key === storageKey && event.newValue) {
            try {
                const storedData = JSON.parse(event.newValue)
                siteDevices.value = storedData.siteDevices
                console.log('handleStorageChange =>', siteDevices.value)
            } catch (error) {
                console.error('Failed to parse localStorage data:', error)
            }
        }
    }
    // 启动监听
    const startListening = (): void => {
        window.addEventListener('storage', handleStorageChange)
    }

    // 停止监听
    const stopListening = (): void => {
        window.removeEventListener('storage', handleStorageChange)
    }
    return {
        siteDevices,
        getSiteDevice,
        setSiteDevices,
        updateSiteName,
        startListening,
        stopListening
    }
}, {
    persist: {
        key: 'siteStore',
        storage: localStorage,
    }
})