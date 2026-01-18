export interface ProbeRequest {
    Uuid: string;
    Types: string;
    ResponseMode?: string;
}

export interface ProbeMatchResponse {
    uuid: string;
    deviceName: string;
    ipv4Address: string;
    httpPort: number;
    httpsPort: number;
    softwareVersion: string;
}

export interface DiscoveredDevice {
    type: "manual" | "auto";
    uuid: string;
    deviceName: string;
    ipv4Address: string;
    httpPort: number;
    httpsPort: number;
    softwareVersion: string;
    responseTime: Date;
    enabled: boolean;
    login: boolean;
    lastSeen?: Date;
    session?: string;
    access_token?: string;
    enableHttps?: boolean;
}

export interface DiscoveryOptions {
    broadcastAddress?: string;
    port?: number;
    timeout?: number;
    queryInterval?: number;
}
