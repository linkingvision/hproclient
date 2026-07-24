import log from 'electron-log';
import { join } from 'path';

// setting level and path of log files
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => join(process.cwd(), 'logs/hproclient.log');

// seting the max size of log files(10MB)
log.transports.file.maxSize = 100 * 1024;  // 100KB

// setting log form
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';  // set log form by self

