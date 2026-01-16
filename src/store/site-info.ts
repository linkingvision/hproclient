import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DiscoveredDevice } from '../types/site-info';

export const useSiteInfo = defineStore('siteInfo', () => {
    const siteDevices = ref<Array<DiscoveredDevice>>([])

    function getSiteDevice(params: string) {
        return siteDevices.value.find(
            device => device.ipv4Address === params
        )
    }
    function setSiteDevices(data: Array<DiscoveredDevice>) {
        console.log('store setSite =>', data)
        siteDevices.value = data;
    }
    return {
        siteDevices,
        getSiteDevice,
        setSiteDevices
    }
}, {
    persist: {
        key: 'siteInfo',
        storage: localStorage,
    }
})