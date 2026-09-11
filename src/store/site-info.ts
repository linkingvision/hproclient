import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DiscoveredDevice } from '../types/site-info';

export const useSiteInfo = defineStore('siteStore', () => {
    const siteDevices = ref<Array<DiscoveredDevice>>([])
    const selectedSite = ref<DiscoveredDevice | null>(null)

    function backupManualDevices(){
        const manuals = siteDevices.value.filter(d => d.type === 'manual');
        localStorage.setItem('manualBackup',JSON.stringify(manuals));
    }

    function restoreManualDevices():Array<DiscoveredDevice>{
        const data = localStorage.getItem('manualBackup');
        return data? JSON.parse(data):[];
    }

    function getManualDevices(){
        return siteDevices.value.filter(d => d.type === 'manual');
    }

    function mergeSiteDevices(data:Array<DiscoveredDevice>){
        console.log('=== mergeSiteDevices ===');
        console.log('传入数据:', data.map(d => ({ ip: d.ipv4Address, session: d.session, login: d.login })));
        console.log('当前 siteDevices:', siteDevices.value.map(d => ({ ip: d.ipv4Address, session: d.session, login: d.login })));
        const loginBackup = new Map();
        siteDevices.value.forEach(d => {
            if(d.login && d.session){
                loginBackup.set(d.ipv4Address,{
                    session:d.session,
                    access_token:d.access_token,
                    login:true,
                    username:d.username
                })
            }
        })
        const map = new Map<string,DiscoveredDevice>();
        data.forEach(d => map.set(d.ipv4Address,{...d}));

        const manualBackup = restoreManualDevices();

        manualBackup.forEach(d=>{
            if(!map.has(d.ipv4Address)){
                map.set(d.ipv4Address,{
                    ...d,
                    login:false,
                    access_token:undefined,
                    session:undefined,
                })
            }
        });

        siteDevices.value = Array.from(map.values());

        siteDevices.value = siteDevices.value.map(d => {
            const saved = loginBackup.get(d.ipv4Address);
            if(saved) {
                return {...d,...saved}
            }
            return d;
        })

        if(selectedSite.value){
            const matched = siteDevices.value.find(d => d.ipv4Address === selectedSite.value?.ipv4Address);
            if(matched){
                selectedSite.value = {...matched};
            }else{
                selectedSite.value = null;
            }
        }

        backupManualDevices();
    }

    function addSiteDevice(device:DiscoveredDevice){
        const existing = siteDevices.value.find(item => item.ipv4Address === device.ipv4Address);
        if(!existing){
            siteDevices.value.push({
                type:'manual',
                uuid:device.uuid,
                deviceName:device.deviceName,
                ipv4Address:device.ipv4Address,
                httpPort:String(device.httpPort),
                httpsPort:String(device.httpsPort),
                softwareVersion:device.softwareVersion,
                enabled:true,
                login:false,
                responseTime:new Date(),
                lastSeen:new Date(),
            });
            backupManualDevices();
        }
    }

    function removeSiteDevice(ip:string){
        siteDevices.value = siteDevices.value.filter(item => item.ipv4Address !== ip);
        const manuals = restoreManualDevices();
        const filtered = manuals.filter(d => d.ipv4Address !== ip);
        localStorage.setItem('manualBackup',JSON.stringify(filtered));
        if(selectedSite.value?.ipv4Address === ip){
            selectedSite.value = null;
        }
    }

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
                return { ...item, deviceName: name }; // create new Object
            }
            return item;
        });
        if(selectedSite.value?.ipv4Address === ip){
            selectedSite.value = siteDevices.value.find(d => d.ipv4Address === ip) || null;
        }
        backupManualDevices();
    }

    // listen localStorage
    const storageKey = 'siteStore';
    const handleStorageChange = (event: StorageEvent): void => {
        // console.log('handleStorageChange =>', event.newValue)
        if (event.key === storageKey && event.newValue) {
            try {
                const storedData = JSON.parse(event.newValue);
                if(JSON.stringify(storedData.siteDevices)!==JSON.stringify(siteDevices.value)){
                    siteDevices.value = storedData.siteDevices
                }
                if(storedData.selectedSite && storedData.selectedSite.ipv4Address !== selectedSite.value?.ipv4Address){
                    selectedSite.value = storedData.selectedSite
                }
                console.log('handleStorageChange =>', siteDevices.value)
            } catch (error) {
                console.error('Failed to parse localStorage data:', error)
            }
        }
    }

    function setSelectedSite(device: DiscoveredDevice | null) {
        if (selectedSite.value?.ipv4Address === device?.ipv4Address) return;
        selectedSite.value = device;
    }

    function clearSelectedSite() {
        selectedSite.value = null;
    }

    const startListening = (): void => {
        window.addEventListener('storage', handleStorageChange)
    }
    const stopListening = (): void => {
        window.removeEventListener('storage', handleStorageChange)
    }
    return {
        siteDevices,
        selectedSite,
        getSiteDevice,
        getSiteDevices,
        setSiteDevices,
        mergeSiteDevices,
        addSiteDevice,
        removeSiteDevice,
        restoreManualDevices,
        getManualDevices,
        updateSiteName,
        setSelectedSite,
        clearSelectedSite,
        startListening,
        stopListening,
    }
}, {
    persist: {
        key: 'siteStore',
        storage: localStorage,
    }
})