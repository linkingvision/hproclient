import { Socket, createSocket, RemoteInfo } from 'dgram';
import { parseStringPromise } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import log from 'electron-log';
import {
    ProbeMatchResponse,
    DiscoveredDevice,
    DiscoveredDeviceResponse,
    DiscoveryOptions,
} from './site_types';
import http from '../../http';
export class DiscoveryClient {
    private client: Socket;
    private discoveredDevices: Map<string, DiscoveredDevice>;
    private options: Required<DiscoveryOptions>;
    private isRunning: boolean = false;
    private queryInterval?: NodeJS.Timeout;
    private lastQueryTime: number = 0;

    constructor(options: DiscoveryOptions = {}) {
        this.client = createSocket('udp4');
        this.discoveredDevices = new Map();

        this.options = {
            broadcastAddress: options.broadcastAddress || '255.255.255.255',
            port: options.port || 37121,
            timeout: options.timeout || 3000,
            queryInterval: options.queryInterval || 10000
        };

        this.setupListeners();
    }

    private setupListeners(): void {
        this.client.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
            this.handleResponse(msg.toString(), rinfo).catch(error => {
                log.debug(`dealing response failed: ${error.message}`);
            });
        });

        this.client.on('error', (err: Error) => {
            log.debug(`Socket error: ${err.message}`);
            if (this.isRunning) {
                this.stop();
            }
        });
    }

    /**
     * 启动持续发现设备
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            log.debug('server has been running');
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.isRunning = true;

            this.client.bind(() => {
                const address = this.client.address();
                log.debug(`server has been run,listening port: ${address.port}`);

                // enable broadcast
                this.client.setBroadcast(true);

                // research once right now
                this.sendProbeRequests();

                // setting timing research
                if (this.options.queryInterval > 0) {
                    this.queryInterval = setInterval(() => {
                        if (this.isRunning) {
                            this.sendProbeRequests();
                        }
                    }, this.options.queryInterval);
                }

                resolve();
            });

            this.client.once('error', reject);
        });
    }

    /**
     * send Probe request
     */
    private async sendProbeRequests(): Promise<void> {
        if (!this.isRunning) return;

        this.lastQueryTime = Date.now();

        const probeXml = this.createProbeRequest();

        this.client.send(
            probeXml,
            this.options.port,
            this.options.broadcastAddress,
            (error?: Error | null) => {
                if (error) {
                    log.debug(`发送Probe失败: ${error.message}`);
                    return;
                }
                // log.info(`发送Probe请求到 ${this.options.broadcastAddress}:${this.options.port}`);
            }
        );

    }

    /**
     * creat Probe request XML
     */
    private createProbeRequest(): string {
        const probeId = uuidv4().toUpperCase();
        return `<?xml version="1.0" encoding="utf-8"?>
<Probe>
  <Uuid>${probeId}</Uuid>
  <Types>inquiry</Types>
  <ResponseMode>2</ResponseMode>
</Probe>`;
    }

    /**
     * handles the device response
     */
    private async handleResponse(xmlData: string, rinfo: RemoteInfo): Promise<void> {
        try {
            const result = await parseStringPromise(xmlData, {
                explicitArray: false,
                mergeAttrs: true,
                explicitRoot: true
            });

            if (result && result.ProbeMatch) {
                const device = this.parseDeviceInfo(
                    result.ProbeMatch as ProbeMatchResponse,
                    rinfo
                );
                device.ipv4Address = rinfo.address;
                // checks if the device already exists.
                const existingDevice = this.discoveredDevices.get(device.ipv4Address);

                if (!existingDevice) {
                    device.type = "auto";
                    // new device
                    this.discoveredDevices.set(device.ipv4Address, device);
                    this.printDeviceInfo(device, 'new device');
                } else {
                    // update existing device (update timestamp)

                    log.info(` devices:${device.ipv4Address} already exists. update device information...`);
                    existingDevice.lastSeen = new Date();
                    existingDevice.deviceName = device.deviceName;
                    this.discoveredDevices.set(device.ipv4Address, existingDevice);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                log.debug(`failed to parse response: ${error.message}`);
            }
        }
    }

    /**
     * parse device information
     */
    private parseDeviceInfo(
        data: ProbeMatchResponse,
        rinfo: RemoteInfo
    ): DiscoveredDevice {
        return {
            type: "auto",
            uuid: data.uuid,
            deviceName: data.deviceName,
            ipv4Address: data.ipv4Address,
            httpPort: data.httpPort,
            httpsPort: data.httpsPort,
            softwareVersion: data.softwareVersion,
            enabled: true,
            responseTime: new Date(),
            login: false,
            lastSeen: new Date(),
        };
    }

    /**
     * print device information
     */
    private printDeviceInfo(device: DiscoveredDevice, prefix: string = ''): void {
        const timeStr = new Date().toLocaleTimeString();
        log.info(`[${timeStr}] ${prefix} find device: ${device.deviceName}`);
        log.info(`   IP address: ${device.ipv4Address}`);
        log.info(`   uuid: ${device.uuid}`);
        log.info(`   httpPort: ${device.httpPort}`);
        log.info(`   httpsPort: ${device.httpsPort}`);
        log.info(`   software vision: ${device.softwareVersion}`);
        log.info(`   the time got: ${device.responseTime}`);
    }

    /**
     * end serve
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        if (this.queryInterval) {
            clearInterval(this.queryInterval);
            this.queryInterval = undefined;
        }

        // close socket
        this.client.close();

        log.info('found serve has been paused');
    }

    /**
     * manually trigger a device query
     */
    public queryNow(): void {
        if (this.isRunning) {
            log.info('handle to trigger the query of device...');
            this.sendProbeRequests();
        } else {
            log.debug('found serve has not been enabled,cannot query');
        }
    }

    public addDevice(data: any) {
        let device: DiscoveredDevice = {
            type: "manual",
            uuid: data.uuid,
            deviceName: data.deviceName,
            ipv4Address: data.ipv4Address,
            httpPort: data.httpPort,
            httpsPort: data.httpsPort,
            softwareVersion: data.softwareVersion,
            enabled: true,
            responseTime: new Date(),
            login: false,
            lastSeen: new Date(),
        };
        const existingDevice = this.discoveredDevices.get(device.ipv4Address);
        if (!existingDevice) {
            this.discoveredDevices.set(device.ipv4Address, device);
        }
    }

    /**
     * get device list
     */
    public getDevices(): DiscoveredDeviceResponse[] {
        // log.info(Array.from(this.discoveredDevices.values()))
        let devices: DiscoveredDeviceResponse[] = [];
        devices = Array.from(this.discoveredDevices.values()).map(item => {
            return {
                type: item.type,
                uuid: item.uuid,
                deviceName: item.deviceName,
                ipv4Address: item.ipv4Address,
                httpPort: item.httpPort,
                httpsPort: item.httpsPort,
                softwareVersion: item.softwareVersion,
                responseTime: item.responseTime,
                enabled: item.enabled,
                login: item.login,
                lastSeen: item.lastSeen,
                session: item.session,
                access_token: item.access_token,
                enableHttps: item.enableHttps,
                username: item.username
            }
        })
        return devices;
    }

    public getDevice(ip: string): DiscoveredDeviceResponse | undefined {
        return this.discoveredDevices.get(ip);
    }

    public setDevice(data: DiscoveredDeviceResponse) {
        let device = this.discoveredDevices.get(data.ipv4Address);
        if(device){
            device.login = data.login;
            device.session = data.session;
            device.access_token = data.access_token;
            device.enableHttps = data.enableHttps;
            device.username = data.username;
            if (data.login) {
                this.keepAlive(device);
            } else {
                this.clearKeepAlive(device);
            }
        }
    }
    /**
     * keepalive
     * @param device 
     */

    private keepAlive(device: DiscoveredDevice) {
        if (device.keepAliveTimer != null) {
            return;
        }
        let root = (device.enableHttps ? 'https://' : 'http://') + device.ipv4Address + ':' + (device.enableHttps ? device.httpsPort : device.httpPort);
        const url = root + '/uapi/v1/User/Keepalive'
        log.info('[keep-alive] url =>', url)
        if (device.keepAliveTimer) {
            clearInterval(device.keepAliveTimer);
            device.keepAliveTimer = null;
            log.info('clear keep alive setInterval')
        }
        device.keepAliveTimer = setInterval(async () => {
            log.info('keep-alive in setInterval');
            try {
                const res = await http.get(url, {
                    headers: {
                        'Authorization': `Bearer ${device.access_token}`
                    },
                    timeout: 10000
                })
                log.info(`[KeepAlive] ${device.ipv4Address} success =>`, res.status)
            } catch (err) {
                device.login = false;
                device.session = undefined;
                device.access_token = undefined;
                device.enableHttps = false;
                // if error happened,clear the interval to fix the login status
                this.clearKeepAlive(device);
                log.info(`[KeepAlive]-------------------------------------------- ${device.ipv4Address} failed,has cleared the status of login`);
            }
        }, 60_000)
    }
    /**
     * clear keepalive interval
     * @param device 
     */
    private clearKeepAlive(device: DiscoveredDevice) {
        if (device.keepAliveTimer == null) {
            return;
        }
        clearInterval(device.keepAliveTimer);
        device.keepAliveTimer = null;
    }

    public getDeviceCount(): number {
        return this.discoveredDevices.size;
    }

    public clearDevice(ip: string) {
        let device = this.discoveredDevices.get(ip);
        this.clearKeepAlive(device);
        this.discoveredDevices.delete(ip);
    }


    public clearDevices(): void {
        const count = this.discoveredDevices.size;
        this.discoveredDevices.clear();
        log.info(`has cleared all the devices, the total is ${count}`);
    }

    /**
     * set offline devices (no response after specified time)
     */
    public setOfflineDevices(timeoutMs: number = 60000) {
        const now = Date.now();
        Array.from(this.discoveredDevices.entries()).forEach(([ip, device]) => {
            if (device.type != "auto") {
                return;
            }
            const lastSeenTime = device.lastSeen ? device.lastSeen.getTime() : device.responseTime.getTime();
            if (now - lastSeenTime > timeoutMs) {
                log.info(`setting offline devices: ${device.deviceName} (${device.ipv4Address})`);
                device.enabled = false;
            }
        });

    }

    /**
     * export device list as json format
     */
    public exportToJSON(): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            deviceCount: this.discoveredDevices.size,
            lastQueryTime: this.lastQueryTime,
            devices: Array.from(this.discoveredDevices.values())
        }, null, 2);
    }


    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * event emitter
     */
    private emitDeviceAdded(device: DiscoveredDevice): void {
        // add custom event handler
    }


    private emitDeviceRemoved(device: DiscoveredDevice): void {
        // delete custom event
    }

    /**
     * check if service is running
     */
    public isDiscovering(): boolean {
        return this.isRunning;
    }

    /**
     * get the last time to query
     */
    public getLastQueryTime(): Date {
        return new Date(this.lastQueryTime);
    }
}

export function GetDiscoveryClient() {
    const client = new DiscoveryClient({
        broadcastAddress: '255.255.255.255',
        port: 37121,
        queryInterval: 15000,
    });

    try {
        // enable the serve of founding
        client.start();
        // periodically update offline devices (e.g., cleanup once per minute)
        setInterval(() => {
            client.setOfflineDevices(120000); // considered offline if unresponsive for 2 minutes
        }, 60000);

    } catch (error) {
        log.debug('failed to enable:', error);
        client.stop();
    }

    return client;
}


