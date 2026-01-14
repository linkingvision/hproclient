import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DiscoveredDevice } from '../types/site-info';

export const useSiteInfo = defineStore('siteInfo', () => {
    const siteDevices = ref<Array<DiscoveredDevice>>()
    function getSiteDevice(params: string) {
        siteDevices.value?.forEach(device => {
            if (device.ipv4Address == params) {
                return device
            }
        });
        return {}
    }
    function getSiteDevices() {
        return siteDevices;
    }
    function setSiteDevices(data: Array<DiscoveredDevice>) {
        console.log('store setSite =>', data)
        siteDevices.value = data;
    }
    return {
        getSiteDevice,
        getSiteDevices,
        setSiteDevices
    }
}, {
  persist: true
})