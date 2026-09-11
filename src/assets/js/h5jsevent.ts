// src/plugins/js/h5jsevent.ts

interface H5jsEventConfig {
    protocol: string; // {string} - 'http:' or 'https:'
    host: string; // {string} - 'localhost:8080'
    rootpath: string; // {string} - path of the app running
    apipath: string; // {string} - '/api/v1/event'
    userdata: any; // user data
    session: string; // {string} - session got from login
    consolelog?: string; // 'true' or 'false' enable/disable console.log
    pbconf?: any;
    token?: string;
    streamprofile?: string;
    serverpb?: string;
    parameters?: any;
    nodeid?: any;
}

interface PbConf {
    begintime?: string;
    endtime?: string;
    cls?: any;
    colors?: any;
    polygon?: any[];
    parameters?: any;
}

class H5jsEvent {
    private wsSocket: WebSocket | null;
    private keepaliveTimerId: NodeJS.Timeout | null;
    private bNeedReconnect: boolean;
    private bDisConnected: boolean;
    private _pbconf: PbConf;
    private parameters: any;
    private _conf: H5jsEventConfig;
    private _token: string | undefined;
    private _debug: boolean;
    private strHevc: string;
    private h5spath: string;
    private streamprofile: string;
    private serverpb: string;
    private reconnectTimerId: NodeJS.Timeout | null;

    constructor(conf: H5jsEventConfig) {
        this.wsSocket = null;
        this.keepaliveTimerId = null;
        this.bNeedReconnect = false;
        this.bDisConnected = false;
        this._pbconf = conf.pbconf || {};
        this.parameters = conf.parameters;
        this._conf = conf;
        this._token = conf.token;
        this._debug = true;
        this.strHevc = "false";
        this.h5spath = '';
        this.streamprofile = conf.streamprofile || "main";
        this.serverpb = conf.serverpb || "false";
        this.reconnectTimerId = null;

        if (conf.consolelog !== undefined) {
            if (conf.consolelog === 'false') {
                this._debug = false;
            }
        }

        if (this._debug === true) console.log("[WS] Websocket Conf:", conf);
        this.init(this._conf);
    }

    private init(conf: H5jsEventConfig): void {
        const mimeCodec = 'video/mp4; codecs="hev1.1.6.L93.B0, mp4a.40.2"';
        if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
            if (this._debug === true) console.log('[WS] MIME type or codec: ', mimeCodec);
            this.strHevc = "true";
        } else {
            if (this._debug === true) console.log('[WS] Unsupported MIME type or codec: ', mimeCodec);
            this.strHevc = "false";
        }
        if (conf.consolelog !== undefined) {
            if (conf.consolelog === 'false') {
                this._debug = false;
            }
        }
        switch (conf.apipath) {
            case "/uapi/v1/ws/anaSearch":
                this.h5spath = conf.rootpath + conf.apipath + "?token=" + (conf.token || '') +
                    '&profile=' + this.streamprofile + "&playback=true&hevc=" + this.strHevc + "&serverpb=" + this.serverpb +
                    "&begintime=" + encodeURIComponent(this._pbconf.begintime || '') + "&endtime=" + encodeURIComponent(this._pbconf.endtime || '') +
                    "&meta=true&session=" + conf.session;
                break;
            case "/uapi/v1/ws/anaEvent":
                this.h5spath = conf.rootpath + conf.apipath + '?session=' + conf.session;
                break;
            case "/uapi/v1/ws/videoWall":
                this.h5spath = conf.rootpath + conf.apipath + '?session=' + conf.session;
                break;
            case "/api/v1/h5slinksimilarity":
                console.log('----------------similar')
                this.h5spath = conf.rootpath + conf.apipath + '?nodeid=' + conf.nodeid + '&session=' + conf.session;
                break;
            default:
                console.log('----------------default')
                this.h5spath = conf.rootpath + conf.apipath + '?session=' + conf.session;
                break;
        }
    }

    private ReconnectFunction(): void {
        if (this.bNeedReconnect === true) {
            if (this._debug === true) console.log('Reconnect...');
            this.setupWebSocket(this._token);
            this.bNeedReconnect = false;
        }
    }

    private H5SWebSocketClient(h5spath: string): WebSocket | null {
        let socket: WebSocket | null = null;
        if (this._debug === true) console.log("H5SWebSocketClient");
        try {
            const protocol = this._conf.protocol === "http:" ? "ws://" : "wss://";
            socket = new WebSocket(protocol + this._conf.host + h5spath);
            if (this._debug === true) console.log(this._conf.host);
        } catch (e) {
            alert('error');
            return null;
        }
        return socket;
    }

    private keepaliveTimer(): void {
        try {
            const j = { type: "keepalive" };
            this.wsSocket?.send(JSON.stringify(j));
        } catch (e) {
            if (this._debug === true) console.log(e);
        }
    }

    private cls(data: any): void {
        try {
            const j = { type: "cls", data };
            this.wsSocket?.send(JSON.stringify(j));
        } catch (e) {
            if (this._debug === true) console.log(e);
        }
    }

    private colors(data: any): void {
        try {
            const j = { type: "colors", data };
            this.wsSocket?.send(JSON.stringify(j));
        } catch (e) {
            if (this._debug === true) console.log(e);
        }
    }

    private polygon(data: any[]): void {
        try {
            const j = { type: "polygon", data };
            this.wsSocket?.send(JSON.stringify(j));
        } catch (e) {
            if (this._debug === true) console.log(e);
        }
    }

    private send(data: any): void {
        try {
            this.wsSocket?.send(JSON.stringify(data));
        } catch (e) {
            if (this._debug === true) console.log(e);
        }
    }

    private onWebSocketData(msg: MessageEvent): void {
        if (this._conf.pbconf?.callback !== undefined) {
            this._conf.pbconf.callback(msg.data, this._conf.userdata);
        }
    }

    private setupWebSocket(token: string | undefined): void {
        const h5spath = this.h5spath;
        if (this._debug === true) console.log("h5spath", h5spath);
        this.wsSocket = this.H5SWebSocketClient(h5spath);
        if (this._debug === true) console.log("setupWebSocket", this.wsSocket);
        this.wsSocket?.addEventListener('message', this.onWebSocketData.bind(this));
        this.wsSocket?.addEventListener('open', () => {
            if (this._debug === true) console.log("wsSocket.onopen", this);
            this.keepaliveTimerId = setInterval(this.keepaliveTimer.bind(this), 1000);
            if (this._pbconf) {
                if (this._pbconf.cls) {
                    this.cls(this._pbconf.cls);
                }
                if (this._pbconf.colors) {
                    this.colors(this._pbconf.colors);
                }
                if (this._pbconf.polygon && this._pbconf.polygon.length > 0) {
                    this.polygon(this._pbconf.polygon);
                }
                if (this._pbconf.parameters) {
                    if (Array.isArray(this._pbconf.parameters)) {
                        this._pbconf.parameters.forEach(element => {
                            this.send(element);
                        });
                    } else {
                        this.send(this._pbconf.parameters);
                    }
                }
            }
        });
        this.wsSocket?.addEventListener('close', () => {
            if (this._debug === true) console.log("wsSocket.onclose", this);
            if (this.bDisConnected === true) {
                if (this._debug === true) console.log("wsSocket.onclose disconnect");
            } else {
                this.bNeedReconnect = true;
            }
            this.CleanupWebSocket(this);
        });
    }

    private CleanupWebSocket(h5sPlayer: H5jsEvent): void {
        if (this._debug === true) console.log('CleanupWebSocket', h5sPlayer);
        clearInterval(this.keepaliveTimerId!);
    }

    public connect(): void {
        this.setupWebSocket(this._token);
        this.reconnectTimerId = setInterval(this.ReconnectFunction.bind(this), 3000);
    }

    public disconnect(): void {
        if (this._debug === true) console.log("disconnect", this);
        this.bDisConnected = true;
        clearInterval(this.reconnectTimerId!);
        if (this.wsSocket !== null) {
            this.wsSocket.close();
            this.wsSocket = null;
        }
        if (this._debug === true) console.log("disconnect", this);
    }
}

export { H5jsEvent };
export type { H5jsEventConfig, PbConf }