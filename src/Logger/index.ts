import { EventEmitter } from "../EventEmitter";
import { LOG_TYPE } from "./interfaces";
import { Log } from "./Log";

class GlobalLogger {
  private static instance: GlobalLogger;
  private logs: Log[];
  private event: EventEmitter;
  private constructor() {
    this.logs = [];
    this.event = new EventEmitter();
  }

  public static getInstance(): GlobalLogger {
    if (!GlobalLogger.instance) {
      GlobalLogger.instance = new GlobalLogger();
    }
    return GlobalLogger.instance;
  }

  public log(log: Log): void {
    this.event.emit("log", log);
    this.logs.push(log);
  }

  public getLogs(): Log[] {
    return this.logs;
  }
  public subscribe(...args): any {
    return this.event.subscribe.apply(this.event, args);
  }
}

class Logger {
  logs: Log[] = [];
  transport: any = console;
  serviceName: string;
  constructor(serviceName) {
    this.logs = [];
    this.serviceName = serviceName;
  }
  log(log: Log) {
    this.logs.push(log);
    GlobalLogger.getInstance().log(log);

    switch (log.type) {
      case LOG_TYPE.INFO:
        this.transport.info(log.formattedMessage);
        break;
      case LOG_TYPE.WARNING:
        this.transport.warn(log.formattedMessage);
        break;
      case LOG_TYPE.ERROR:
        this.transport.error(log.formattedMessage);
        break;
      case LOG_TYPE.DEBUG:
        this.transport.debug(log.formattedMessage);
        break;
      default:
        throw new Error(`Invalid Log Type,  ${log.type}`);
    }
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  getLastLog() {
    return this.logs[this.logs.length - 1];
  }

  getLastLogs(n) {
    return this.logs.slice(-n);
  }

  info(...messages) {
    const type = LOG_TYPE.INFO;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  warn(...messages) {
    const type = LOG_TYPE.WARNING;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  error(...messages) {
    const type = LOG_TYPE.ERROR;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  debug(...messages) {
    const type = LOG_TYPE.DEBUG;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
}

export { Logger as default, GlobalLogger };
