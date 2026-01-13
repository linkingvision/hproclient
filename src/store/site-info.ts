import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DiscoveredDevice } from '../types/site-info';

export const SiteInfo = defineStore('siteInfo', () => {
    const siteDevices = ref<Array<DiscoveredDevice>>()
    function setSiteDevices(data: Array<DiscoveredDevice>) {
        siteDevices.value = data;
    }
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
    return {
        getSiteDevice,
        getSiteDevices,
        setSiteDevices
    }
})