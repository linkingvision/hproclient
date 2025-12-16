import log from 'electron-log';
import { join } from 'path';

// 设置日志文件的级别和路径
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => join(process.cwd(), 'logs/hproclient.log');

// 设置日志文件的最大大小（10MB
log.transports.file.maxSize = 10 * 1024 * 1024;  // 10MB

// 设置日志格式
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';  // 自定义日志格式

