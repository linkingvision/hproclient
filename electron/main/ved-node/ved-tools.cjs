const path  = require('path');

let wplPath;
if(process.env.NODE_ENV === 'development'){
  const log = require('electron-log');
  log.transports.file.level = 'info';
  log.transports.file.resolvePathFn = () => path.join(process.cwd(),'logs/ved-tools.log'); // Optional,initialize the logger for any renderer processes
  wplPath = path.resolve(__dirname,'../../../wpl');
  log.info("wplPath",wplPath);
}else{
  wplPath = path.resolve(__dirname,"../wpl");
}

let wpl;
if(process.env.NODE_ENV === 'development'){
  wpl = require('../../../wpl/ved-node.node');
}else{
  wpl = require('../wpl/ved-node.node');
}

const getVedPort = () => {
  try{
    let port = wpl.getVedPort();
    console.log("[wpl] getVedPort:",port);
    process.send({type:'getVedPort',port});
  }catch(err){
    throw err;
  }
};

const initVed = () => {
  try{
    console.log('wpl',wpl);
    console.log('wplPath',wplPath);
    return wpl.initVed(wplPath,'ved');
  }catch(err){
    console.log(err);
  }
};

function init(){
  getVedPort();
  initVed();
  console.log("[wpl]Init VED finished");
}

init();

// listen message event on the Worker thread
process.on('message',(message)=>{
  console.log("[ved-worker-tools] msg:",message);
  try{
    switch(message.type){
      case 'getVedPort':
        getVedPort();
        break;
      default:
        console.log('Unknown message type:',message.type);
    }
  }catch(err){
    //send the error message to main process
  }
})