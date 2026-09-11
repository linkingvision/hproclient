import{fork,ChildProcess}  from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import log from 'electron-log'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let vedWorkerPath : string;

if(process.env.NODE_ENV == 'development'){
  vedWorkerPath = path.join(__dirname,'../../electron/main/ved-node/ved-tools.cjs');
}else{
  vedWorkerPath = path.join(process.cwd(),'resources/ved-tools.cjs');
}

log.info('vedWorkerPath:', vedWorkerPath);

const vedWorker:ChildProcess = fork(vedWorkerPath);

vedWorker.on('exit',(code:number | null,signal:string | null) => {
  if(code === 0){
    log.info('Worker exited successfully');
  }else{
    log.error(`Worker exited with code : ${code}, signal: ${signal}`);
  }
});

vedWorker.on('error',(err:Error)=>{
  log.error('Worker encountered an error:',err);
});

export {vedWorker}