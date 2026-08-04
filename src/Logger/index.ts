import EventEmitter from "eventemitter3";
import { LOG_TYPE, type BrowserTransportOptions, type ITransport } from "./interfaces";
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
  // Returns a handle rather than the emitter: callers unsubscribe on teardown,
  // and eventemitter3's `on` returns the emitter itself, which has no
  // unsubscribe method.
  public subscribe(name: string, cb: (...args: any[]) => void) {
    this.event.on(name, cb);
    return {
      unsubscribe: () => {
        this.event.off(name, cb);
      },
    };
  }
}

class Transport {
  event: EventEmitter;
  constructor() {
    this.event = new EventEmitter();
  }

  public log(log: Log): void {
    this.event.emit("log", log);
  }

  public subscribe(name: string, cb: (...args: any[]) => void): any {
    return this.event.on(name, cb);
  }

  public emit(type: LOG_TYPE, log: Log): void {
    this.event.emit(type, log);
  }
  public unsubscribe(name: string, cb: (...args: any[]) => void): any {
    return this.event.off(name, cb);
  }
}

class DefaultTransport extends Transport implements ITransport {
  constructor(opts: BrowserTransportOptions) {
    super()
    if (opts.console) {
      this.event.on("*", (log: Log) => {
        console.log(log.toString());
      });
    }
    this.event.on("*", (log: Log) => {
      GlobalLogger.getInstance().log(log);
    });
  }
  public log(log: Log): void {
    this.event.emit("log", log);
  } 
}

class Logger {
  logs: Log[] = [];
  transport: ITransport = new DefaultTransport({});
  serviceName: string;
  constructor(serviceName: string) {
    this.logs = [];
    this.serviceName = serviceName;
  }
  log(log: Log) {
    this.logs.push(log);
    GlobalLogger.getInstance().log(log);

    this.transport.log(log);
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

  getLastLogs(n: number) {
    return this.logs.slice(-n);
  }

  info(...messages: any[]) {
    const type = LOG_TYPE.INFO;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      // this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      // this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  warn(...messages: any[]) {
    const type = LOG_TYPE.WARNING;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      // this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      // this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  error(...messages: any[]) {
    const type = LOG_TYPE.ERROR;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      // this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      // this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
  debug(...messages: any[]) {
    const type = LOG_TYPE.DEBUG;
    const logs = messages.map(
      (message) => new Log(type, message, this.serviceName)
    );
    if (messages.length > 1) {
      // this.transport.group(messages[0]);
      logs.forEach((log) => this.log(log));
      // this.transport.groupEnd(messages[0]);
    } else {
      logs.forEach((log) => this.log(log));
    }
  }
}

export { Logger as default, GlobalLogger };
