import { Log } from "./Log";

export enum LOG_TYPE {
    INFO = 'INFO',
    ERROR = 'ERROR',
    WARNING = 'WARNING',
    DEBUG = 'DEBUG',
    TRACE = 'TRACE',
}

export interface BrowserTransportOptions {
    console?: boolean;
}

export interface ITransport {
    log(log: Log): void;
    subscribe(...args: any[]): any;
    emit(type: LOG_TYPE, log: Log): void;
    unsubscribe(...args: any[]): any;
}