import { useSiteInfo } from "../store/site-info";
import { DiscoveredDevice } from "../types/site-info";
const siteStore = useSiteInfo();

export const getDeviceInfo = (): { target: DiscoveredDevice | null; access_token: string;ip:string; session: string; root: string; username: string;} => {
    const devices = siteStore.siteDevices;
    if (!devices || devices.length === 0) {
        return { target: null, access_token: '', ip:'',session: '', root: '', username: '' };
    }
    let target = siteStore.selectedSite || devices.find((site: DiscoveredDevice) => site.login === true) || devices[0] || null;
    if(target && target.login === false){
      const matched = devices.find(d => d.ipv4Address === target.ipv4Address && d.login === true && d.session);
      if(matched)target = matched;
    }
    if (!target) {
        return { target: null, access_token: '', ip:'',session: '', root: '', username: '' };
    }
    const protocol = target.enableHttps ? 'https' : 'http';
    const port = target.enableHttps ? Number(target.httpsPort) : Number(target.httpPort);
    return {
        target,
        access_token: target.access_token || '',
        session: target.session || '',
        ip:target.ipv4Address,
        root: `${protocol}://${target.ipv4Address}:${port}`,
        username: target.username ? decodeURIComponent(target.username) : ''
    };
}