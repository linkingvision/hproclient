/** 
 *=================Thumbnail API
 *
 */
/** 
 * Interface with h5s Thumbnail API
 * @constructor
 * @param 
 var conf = {
	protocol: window.location.protocol, // {string} - 'http:' or 'https:'
	host: window.location.host, //{string} - 'localhost:8080'
	rootpath:window.location.pathname, // {string} - path of the app running
	callback: ThumbnailCB, //{function}(event(string), userdata(object)) 
	userdata: user data // user data
	session:'c1782caf-b670-42d8-ba90-2244d0b0ee83', //{string} - session got from login
	consolelog: 'true' // 'true' or 'false' enable/disable console.log
};
*/

function H5sThumbnail(conf)
{
	this.wsSocket;
	this.keepaliveTimerId;
	this.bNeedReconnect = false;
	this.bDisConnected = false;
	
	this._debug = true;	
	this._token = conf.token;
	this._pbconf = conf.pbconf;

	if (conf.consolelog !== undefined)
	{
		if (conf.consolelog === 'false')
		{
			this._debug = false;	
		}
	}	
	

	this._conf = conf;	
}

H5sThumbnail.prototype.ReconnectFunction = function() 
{
	//if(this._debug === true) console.log('Try Reconnect...', this.bNeedReconnect);
	if (this.bNeedReconnect === true)
	{
		if(this._debug === true) console.log('[Thumbnail] Reconnect...');
		
		this.setupWebSocket(this._token);
		this.bNeedReconnect = false;
	}
	//if(this._debug === true) console.log('Try Reconnect...', this.bNeedReconnect);
}
	
	
H5sThumbnail.prototype.H5SWebSocketClient = function(h5spath) 
{
	var socket;
	if(this._debug === true) console.log("[Thumbnail] H5SWebSocketClient");
	try {
		//alert(this._conf.protocol);
		if (this._conf.protocol == "http:") 
		{
			if (typeof MozWebSocket != "undefined")
			{
				socket = new MozWebSocket('ws://' + this._conf.host  +  h5spath);
			}else
			{
				socket = new WebSocket('ws://' + this._conf.host +  h5spath);
			}
		}
		if (this._conf.protocol == "https:")
		{	
			//alert(this._conf.host);
			if(this._debug === true) console.log("[Thumbnail] ", this._conf.host);
			if (typeof MozWebSocket != "undefined")
			{
				socket = new MozWebSocket('wss://' + this._conf.host +  h5spath);
			}else
			{
				socket = new WebSocket('wss://' + this._conf.host + h5spath);
			}				
		}
		if(this._debug === true) console.log(this._conf.host);
	} catch (e) {
		alert('[Thumbnail] WebSocketClient error');
		return;
	}
	return socket;
}

H5sThumbnail.prototype.keepaliveTimer = function()	
{
	try {
		var j = {};
		j.cmd = "H5_KEEPALIVE";
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
	  if(this._debug === true) console.log(e);
	}
}


H5sThumbnail.prototype.onWebSocketData = function(msg)	
{
	if (this._pbconf != undefined && this._pbconf.callback != undefined)
	{
		this._pbconf.callback(msg.data, this._pbconf.userdata);
	}
} 
	

H5sThumbnail.prototype.setupWebSocket = function(token)	
{	
	var h5spath = "api/v1/h5sthumbnailapi";
	var serverpb = 'true';
	if (this._pbconf.serverpb === undefined)
	{}else 
	{
		serverpb = this._pbconf.serverpb;
	}
	

	h5spath = this._conf.rootpath + h5spath + "?token=" + token 
						+ "&serverpb=" + serverpb
						+ '&session=' + this._conf.session;
	
	if(this._debug === true) console.log("[Thumbnail]", h5spath);
	
	this.wsSocket = this.H5SWebSocketClient(h5spath);
	if(this._debug === true) console.log("[Thumbnail] setupWebSocket", this.wsSocket);
	this.wsSocket.binaryType = 'arraybuffer';
	this.wsSocket.h5 = this;
	this.wsSocket.onmessage = this.onWebSocketData.bind(this);
	
	this.wsSocket.onopen = function()
	{
		if(this.h5._debug === true) console.log("[Thumbnail] wsSocket.onopen", this.h5);

		var j = {};
		j.type = "open";
		this.h5.wsSocket.send(JSON.stringify(j));
		
		this.h5.start();
		
		this.h5.keepaliveTimerId = setInterval(this.h5.keepaliveTimer.bind(this.h5), 1000);

	}
	
	this.wsSocket.onclose = function () {
		if(this.h5._debug === true) console.log("[Thumbnail] wsSocket.onclose", this.h5);
		if (this.h5.bDisConnected === true)
		{
			if(this.h5._debug === true) console.log("[Thumbnail] wsSocket.onclose disconnect");
		}else
		{
			this.h5.bNeedReconnect = true;
		}
		
		this.h5.CleanupWebSocket(this.h5);
	}

}


H5sThumbnail.prototype.CleanupWebSocket = function(h5sPlayer)
{
	if(h5sPlayer._debug === true) console.log('[Thumbnail] CleanupWebSocket', h5sPlayer);
	clearInterval(h5sPlayer.keepaliveTimerId);
	h5sPlayer.emptyBuffCnt = 0;
	h5sPlayer.lastBuffTime = 0;
	h5sPlayer.buffTimeSameCnt = 0;
}


/** 
 * Connect a websocket Stream to videoElement 
*/
H5sThumbnail.prototype.connect = function() {
	/* start connect to server */
	this.setupWebSocket(this._token);
	this.reconnectTimerId = setInterval(this.ReconnectFunction.bind(this), 3000);
}


/** 
 * Disconnect a websocket Stream and clear videoElement source
*/
H5sThumbnail.prototype.disconnect = function() {
	if(this._debug === true) console.log("[Thumbnail] disconnect", this);
	this.bDisConnected = true;
	clearInterval(this.reconnectTimerId);
	
	if (this.wsSocket != null)
	{
		this.wsSocket.close();
		this.wsSocket = null;
	}
	if(this._debug === true) console.log("[Thumbnail] disconnect", this);
}

H5sThumbnail.prototype.start = function(){
	try {
		var j = {};
		j.cmd = "H5_START";
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
	  if(this._debug === true) console.log(e);
	}
}

H5sThumbnail.prototype.getthumbnail = function(strTime){
	try {
		var j = {};
		j.cmd = "H5_GET_THUMBNAIL";
		j.strThumbnailTime = strTime;
		this.wsSocket.send(JSON.stringify(j));
	} catch (e) {
	  if(this._debug === true) console.log(e);
	}
}
export {H5sThumbnail}