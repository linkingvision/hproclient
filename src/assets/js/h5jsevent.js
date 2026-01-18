/** 
 *=================Event API
 *
 */
/** 
 * Interface with iot Event API
 * @constructor
 * @param 
 var conf = {
	protocol: window.location.protocol, // {string} - 'http:' or 'https:'
	host: window.location.host, //{string} - 'localhost:8080'
	rootpath:window.location.pathname, // {string} - path of the app running
	apipath:'/api/v1/event', // {string} - '/api/v1/event'
	callback: EventCB, //{function}(event(string), userdata(object)) 
	userdata: user data // user data
	session:'c1782caf-b670-42d8-ba90-2244d0b0ee83', //{string} - session got from login
	consolelog: 'true', // 'true' or 'false' enable/disable console.log
	pbconf:pbconf
};
*/

function H5jsEvent(conf) {
	this.wsSocket;
	this.keepaliveTimerId;
	this.bNeedReconnect = false;
	this.bDisConnected = false;
	this._pbconf = conf.pbconf;
	this.parameters = conf.parameters
	this._conf = conf;
	this._token = conf.token;
	this._debug = true;
	this.strHevc = "false";
	this.h5spath;
	this.streamprofile = conf.streamprofile || "main";
	this.serverpb = conf.serverpb || "false";
	if (conf.consolelog !== undefined) {
		if (conf.consolelog === 'false') {
			this._debug = false;
		}
	}

	if (this._debug === true) console.log("[WS] Websocket Conf:", conf);
	this.init(this._conf)

}
H5jsEvent.prototype.init = function (conf) {
	var mimeCodec = 'video/mp4; codecs="hev1.1.6.L93.B0, mp4a.40.2"';
	if ('MediaSource' in window && MediaSource.isTypeSupported(mimeCodec)) {
		if (this._debug === true) console.log('[WS] MIME type or codec: ', mimeCodec);
		this.strHevc = "true";
	} else {
		if (this._debug === true) console.log('[WS] Unsupported MIME type or codec: ', mimeCodec);
		this.strHevc = "false"
	}
	if (conf.consolelog !== undefined) {
		if (conf.consolelog === 'false') {
			this._debug = false;
		}
	}
	switch (conf.apipath) {
		case "/api/v1/ws/anaSearch":
			this.h5spath = conf.rootpath + conf.apipath + "?token=" + conf.token +
				'&profile=' + this.streamprofile + "&playback=true&hevc=" + this.strHevc + "&serverpb=" + this.serverpb +
				"&begintime=" + encodeURIComponent(this._pbconf.begintime) + "&endtime=" + encodeURIComponent(this._pbconf.endtime) +
				"&meta=true&session=" + conf.session;
			break;
		case "/api/v1/ws/anaEvent":
			this.h5spath = conf.rootpath + conf.apipath + '?session=' + conf.session;
			break;
		default:
			this.h5spath = conf.rootpath + conf.apipath + '?session=' + conf.session;
			break;
	}
}
H5jsEvent.prototype.ReconnectFunction = function () {
	//if(this._debug === true) console.log('Try Reconnect...', this.bNeedReconnect);
	if (this.bNeedReconnect === true) {
		if (this._debug === true) console.log('Reconnect...');

		this.setupWebSocket(this._token);
		this.bNeedReconnect = false;
	}
	//if(this._debug === true) console.log('Try Reconnect...', this.bNeedReconnect);
}


H5jsEvent.prototype.H5SWebSocketClient = function (h5spath) {
	var socket;
	if (this._debug === true) console.log("H5SWebSocketClient");
	try {
		//alert(this._conf.protocol);
		if (this._conf.protocol == "http:") {
			if (typeof MozWebSocket != "undefined") {
				socket = new MozWebSocket('ws://' + this._conf.host + h5spath);
			} else {
				socket = new WebSocket('ws://' + this._conf.host + h5spath);
			}
		}
		if (this._conf.protocol == "https:") {
			//alert(this._conf.host);
			if (this._debug === true) console.log(this._conf.host);
			if (typeof MozWebSocket != "undefined") {
				socket = new MozWebSocket('wss://' + this._conf.host + h5spath);
			} else {
				socket = new WebSocket('wss://' + this._conf.host + h5spath);
			}
		}
		if (this._debug === true) console.log(this._conf.host);
	} catch (e) {
		alert('error');
		return;
	}
	return socket;
}

H5jsEvent.prototype.keepaliveTimer = function () {
	try {
		var j = {};
		j.type = "keepalive";
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
		if (this._debug === true) console.log(e);
	}
}

H5jsEvent.prototype.cls = function (data) {
	try {
		var j = {};
		j.type = "cls";
		j.data = data;
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
		if (this._debug === true) console.log(e);
	}
}
H5jsEvent.prototype.colors = function (data) {
	try {
		var j = {};
		j.type = "colors";
		j.data = data;
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
		if (this._debug === true) console.log(e);
	}
}
H5jsEvent.prototype.send = function (data) {
	console.log("send",data);
	try {
		this.wsSocket.send(JSON.stringify(data));
	} catch (e) {
		if (this._debug === true) console.log(e);
	}
}
H5jsEvent.prototype.onWebSocketData = function (msg) {

	if (this._conf.pbconf.callback != undefined) {
		this._conf.pbconf.callback(msg.data, this._conf.userdata);
	}
}


H5jsEvent.prototype.setupWebSocket = function (token) {
	// var h5spath = this._conf.apipath;

	// h5spath = this._conf.rootpath + h5spath + '?session=' + this._conf.session;
	var h5spath = this.h5spath;

	if (this._debug === true) console.log("h5spath", h5spath);

	this.wsSocket = this.H5SWebSocketClient(h5spath);
	if (this._debug === true) console.log("setupWebSocket", this.wsSocket);
	this.wsSocket.binaryType = 'arraybuffer';
	this.wsSocket.h5 = this;
	this.wsSocket.onmessage = this.onWebSocketData.bind(this);

	this.wsSocket.onopen = function () {
		if (this.h5._debug === true) console.log("wsSocket.onopen", this.h5);

		this.h5.keepaliveTimerId = setInterval(this.h5.keepaliveTimer.bind(this.h5), 1000);
		if (this.h5._pbconf.cls) {
			this.h5.cls(this.h5._pbconf.cls)
		}
		if (this.h5._pbconf.colors) {
			this.h5.colors(this.h5._pbconf.colors)
		}
		console.log(this.h5._pbconf.parameters);
		if (this.h5._pbconf.parameters) {
			this.h5.send(this.h5._pbconf.parameters)
		}
	}

	this.wsSocket.onclose = function () {
		if (this.h5._debug === true) console.log("wsSocket.onclose", this.h5);
		if (this.h5.bDisConnected === true) {
			if (this.h5._debug === true) console.log("wsSocket.onclose disconnect");
		} else {
			this.h5.bNeedReconnect = true;
		}

		this.h5.CleanupWebSocket(this.h5);
	}

}


H5jsEvent.prototype.CleanupWebSocket = function (h5sPlayer) {
	if (h5sPlayer._debug === true) console.log('CleanupWebSocket', h5sPlayer);
	clearInterval(h5sPlayer.keepaliveTimerId);
	h5sPlayer.emptyBuffCnt = 0;
	h5sPlayer.lastBuffTime = 0;
	h5sPlayer.buffTimeSameCnt = 0;
}


/** 
 * Connect a websocket Stream to videoElement 
*/
H5jsEvent.prototype.connect = function () {
	/* start connect to server */
	this.setupWebSocket(this._token);
	this.reconnectTimerId = setInterval(this.ReconnectFunction.bind(this), 3000);
}


/** 
 * Disconnect a websocket Stream and clear videoElement source
*/
H5jsEvent.prototype.disconnect = function () {
	if (this._debug === true) console.log("disconnect", this);
	this.bDisConnected = true;
	clearInterval(this.reconnectTimerId);

	if (this.wsSocket != null) {
		this.wsSocket.close();
		this.wsSocket = null;
	}
	if (this._debug === true) console.log("disconnect", this);
} 
export {H5jsEvent}