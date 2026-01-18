import { Socket, createSocket, RemoteInfo } from 'dgram';
import { parseStringPromise } from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import log from 'electron-log';
import {
    ProbeMatchResponse,
    DiscoveredDevice,
    DiscoveryOptions,
} from './site_types';
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
                log.debug(`处理响应失败: ${error.message}`);
            });
        });

        this.client.on('error', (err: Error) => {
            log.debug(`Socket错误: ${err.message}`);
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
            log.debug('服务已经在运行中');
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.isRunning = true;

            this.client.bind(() => {
                const address = this.client.address();
                log.debug(`服务已启动，监听端口: ${address.port}`);

                // 启用广播
                this.client.setBroadcast(true);

                // 立即执行一次查询
                this.sendProbeRequests();

                // 设置定时查询
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
     * 发送 Probe 请求
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
                log.info(`发送Probe请求到 ${this.options.broadcastAddress}:${this.options.port}`);
            }
        );

    }

    /**
     * 创建 Probe 请求 XML
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
     * 处理设备响应
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

                // 检查设备是否已存在
                const existingDevice = this.discoveredDevices.get(device.ipv4Address);

                if (!existingDevice) {
                    device.type = "auto";
                    // 新设备
                    this.discoveredDevices.set(device.ipv4Address, device);
                    this.printDeviceInfo(device, '新设备');
                } else {
                    // 更新现有设备（更新时间戳）

                    log.info(` 设备:${device.ipv4Address} 已存在. 更新设备信息...`);
                    existingDevice.lastSeen = new Date();
                    this.discoveredDevices.set(device.ipv4Address, existingDevice);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                log.debug(`解析响应失败: ${error.message}`);
            }
        }
    }

    /**
     * 解析设备信息
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
     * 打印设备信息
     */
    private printDeviceInfo(device: DiscoveredDevice, prefix: string = ''): void {
        const timeStr = new Date().toLocaleTimeString();
        log.info(`\n[${timeStr}] ${prefix} 发现设备: ${device.deviceName}`);
        log.info(`   IP地址: ${device.ipv4Address}`);
        log.info(`   uuid: ${device.uuid}`);
        log.info(`   httpPort: ${device.httpPort}`);
        log.info(`   httpsPort: ${device.httpsPort}`);
        log.info(`   软件版本: ${device.softwareVersion}`);
        log.info(`   获取时间: ${device.responseTime}`);
    }

    /**
     * 停止服务
     */
    public stop(): void {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;

        // 清除定时器
        if (this.queryInterval) {
            clearInterval(this.queryInterval);
            this.queryInterval = undefined;
        }

        // 关闭socket
        this.client.close();

        log.info('发现服务已停止');
    }

    /**
     * 手动触发一次设备查询
     */
    public queryNow(): void {
        if (this.isRunning) {
            log.info('手动触发设备查询...');
            this.sendProbeRequests();
        } else {
            log.debug('发现服务未启动，无法查询');
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
     * 获取设备列表
     */
    public getDevices(): DiscoveredDevice[] {
        return Array.from(this.discoveredDevices.values());
    }

    /**
     * 获取设备
     */
    public getDevice(ip: string): DiscoveredDevice | undefined {
        return this.discoveredDevices.get(ip);
    }

    /**
     * 修改设备
     */
    public setDevice(data: DiscoveredDevice) {
        let device = this.discoveredDevices.get(data.ipv4Address);
        device.login = data.login;
        device.session = data.session;
        device.access_token = data.access_token;
        device.enableHttps = data.enableHttps;
    }
    /**
     * 获取设备数量
     */
    public getDeviceCount(): number {
        return this.discoveredDevices.size;
    }
    /**
     * 清除设备
     */
    public clearDevice(ip: string) {
        this.discoveredDevices.delete(ip);
    }

    /**
     * 清除所有设备（重置列表）
     */
    public clearDevices(): void {
        const count = this.discoveredDevices.size;
        this.discoveredDevices.clear();
        log.info(`已清除所有设备，共 ${count} 台`);
    }

    /**
     * 设置离线设备（超过指定时间未响应）
     */
    public setOfflineDevices(timeoutMs: number = 60000) {
        const now = Date.now();
        // 将 Map 转换为数组，然后使用 forEach 遍历
        Array.from(this.discoveredDevices.entries()).forEach(([ip, device]) => {
            if (device.type != "auto") {
                return;
            }
            const lastSeenTime = device.lastSeen ? device.lastSeen.getTime() : device.responseTime.getTime();
            if (now - lastSeenTime > timeoutMs) {
                log.info(`设置离线设备: ${device.deviceName} (${device.ipv4Address})`);
                device.enabled = false;
            }
        });

    }

    /**
     * 导出设备列表为 JSON 格式
     */
    public exportToJSON(): string {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            deviceCount: this.discoveredDevices.size,
            lastQueryTime: this.lastQueryTime,
            devices: Array.from(this.discoveredDevices.values())
        }, null, 2);
    }

    /**
     * 延迟函数
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 事件发射器
     */
    private emitDeviceAdded(device: DiscoveredDevice): void {
        // 添加自定义事件处理
    }


    private emitDeviceRemoved(device: DiscoveredDevice): void {
        // 删除自定义事件
    }

    /**
     * 检查服务是否运行
     */
    public isDiscovering(): boolean {
        return this.isRunning;
    }

    /**
     * 获取最后查询时间
     */
    public getLastQueryTime(): Date {
        return new Date(this.lastQueryTime);
    }
}

export function GetDiscoveryClient() {
    const client = new DiscoveryClient({
        broadcastAddress: '255.255.255.255',
        port: 37121,
        queryInterval: 15000, // 每15秒查询一次
    });

    try {
        // 启动发现服务
        client.start();
        // 定期更新离线设备（例如每分钟清理一次）
        setInterval(() => {
            client.setOfflineDevices(120000); // 2分钟未响应视为离线
        }, 60000);

    } catch (error) {
        log.debug('启动失败:', error);
        client.stop();
    }

    return client;
}


