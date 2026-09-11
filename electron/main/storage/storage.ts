class Storage {
  username = '';
  ip = '';
  vedSession = '';
  vedProtocol = 'http';
  vedPortHttp = 16085;
  vedPortHttps = 16445;
  login = false;
  windowId = 0;
  windowBuffer = 0;
  setUsername(username:any) {
    this.username = username;
  }
  getUsername() {
    return this.username;
  }
  setIP(ip:any) {
    this.ip = ip;
  }
  getIP() {
    return this.ip;
  }
  setVedSession(session:any) {
    this.vedSession = session;
  }
  getVedSession() {
    return this.vedSession;
  }
  setVedProtocol(protocol:any) {
    this.vedProtocol = protocol;
  }
  getVedProtocol() {
    return this.vedProtocol;
  }
  setLoginStatus(status:any) {
    this.login = status;
  }
  getLoginStatus() {
    return this.login;
  }
  setVedPortHttp(port:any){
    this.vedPortHttp = port;
  }
  getVedPortHttp(){
    return this.vedPortHttp;
  }
  setVedPortHttps(port:any){
    this.vedPortHttps = port;
  }
  setWindowId(windowId:number){
    this.windowId = windowId
  }
  getWindowId(){
    return this.windowId
  }
  setWindowBuffer(windowBuffer:number){
    this.windowBuffer = windowBuffer;
  }
  getWindowBuffer(){
    return this.windowBuffer;
  }
  getVedPortHttps(){
    return this.vedPortHttps;
  }
  getVedPort() {
    if (this.vedProtocol == "http") {
      return this.vedPortHttp;
    } else {
      return this.vedPortHttps;
    }
  }
  
  get(){
    return {
      username:this.getUsername(),
      ip:this.getIP(),
      vedSession:this.getVedSession(),
      vedProtocol:this.getVedProtocol(),
      vedPort:this.getVedPort(),
      login:this.getLoginStatus(),
      windowId:this.windowId,
      windowBuffer:this.windowBuffer,
    }
  }
}

export const storage  = new Storage()