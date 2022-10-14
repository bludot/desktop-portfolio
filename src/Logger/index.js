var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import EventEmitter from "eventemitter3";
import { LOG_TYPE } from "./interfaces";
import { Log } from "./Log";
var GlobalLogger = /** @class */ (function () {
    function GlobalLogger() {
        this.logs = [];
        this.event = new EventEmitter();
    }
    GlobalLogger.getInstance = function () {
        if (!GlobalLogger.instance) {
            GlobalLogger.instance = new GlobalLogger();
        }
        return GlobalLogger.instance;
    };
    GlobalLogger.prototype.log = function (log) {
        this.event.emit("log", log);
        this.logs.push(log);
    };
    GlobalLogger.prototype.getLogs = function () {
        return this.logs;
    };
    GlobalLogger.prototype.subscribe = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.event.on.apply(this.event, args);
        //return this.event.subscribe.apply(this.event, args);
    };
    return GlobalLogger;
}());
var Transport = /** @class */ (function () {
    function Transport() {
        this.event = new EventEmitter();
    }
    Transport.prototype.log = function (log) {
        this.event.emit("log", log);
    };
    Transport.prototype.subscribe = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.event.on.apply(this.event, args);
    };
    Transport.prototype.emit = function (type, log) {
        this.event.emit(type, log);
    };
    Transport.prototype.unsubscribe = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return this.event.off.apply(this.event, args);
    };
    return Transport;
}());
var DefaultTransport = /** @class */ (function (_super) {
    __extends(DefaultTransport, _super);
    function DefaultTransport(opts) {
        var _this = _super.call(this) || this;
        if (opts.console) {
            _this.event.on("*", function (log) {
                console.log(log.toString());
            });
        }
        _this.event.on("*", function (log) {
            GlobalLogger.getInstance().log(log);
        });
        return _this;
    }
    DefaultTransport.prototype.log = function (log) {
        this.event.emit("log", log);
    };
    return DefaultTransport;
}(Transport));
var Logger = /** @class */ (function () {
    function Logger(serviceName) {
        this.logs = [];
        this.transport = new DefaultTransport({});
        this.logs = [];
        this.serviceName = serviceName;
    }
    Logger.prototype.log = function (log) {
        this.logs.push(log);
        GlobalLogger.getInstance().log(log);
        this.transport.log(log);
    };
    Logger.prototype.getLogs = function () {
        return this.logs;
    };
    Logger.prototype.clearLogs = function () {
        this.logs = [];
    };
    Logger.prototype.getLastLog = function () {
        return this.logs[this.logs.length - 1];
    };
    Logger.prototype.getLastLogs = function (n) {
        return this.logs.slice(-n);
    };
    Logger.prototype.info = function () {
        var _this = this;
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        var type = LOG_TYPE.INFO;
        var logs = messages.map(function (message) { return new Log(type, message, _this.serviceName); });
        if (messages.length > 1) {
            // this.transport.group(messages[0]);
            logs.forEach(function (log) { return _this.log(log); });
            // this.transport.groupEnd(messages[0]);
        }
        else {
            logs.forEach(function (log) { return _this.log(log); });
        }
    };
    Logger.prototype.warn = function () {
        var _this = this;
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        var type = LOG_TYPE.WARNING;
        var logs = messages.map(function (message) { return new Log(type, message, _this.serviceName); });
        if (messages.length > 1) {
            // this.transport.group(messages[0]);
            logs.forEach(function (log) { return _this.log(log); });
            // this.transport.groupEnd(messages[0]);
        }
        else {
            logs.forEach(function (log) { return _this.log(log); });
        }
    };
    Logger.prototype.error = function () {
        var _this = this;
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        var type = LOG_TYPE.ERROR;
        var logs = messages.map(function (message) { return new Log(type, message, _this.serviceName); });
        if (messages.length > 1) {
            // this.transport.group(messages[0]);
            logs.forEach(function (log) { return _this.log(log); });
            // this.transport.groupEnd(messages[0]);
        }
        else {
            logs.forEach(function (log) { return _this.log(log); });
        }
    };
    Logger.prototype.debug = function () {
        var _this = this;
        var messages = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            messages[_i] = arguments[_i];
        }
        var type = LOG_TYPE.DEBUG;
        var logs = messages.map(function (message) { return new Log(type, message, _this.serviceName); });
        if (messages.length > 1) {
            // this.transport.group(messages[0]);
            logs.forEach(function (log) { return _this.log(log); });
            // this.transport.groupEnd(messages[0]);
        }
        else {
            logs.forEach(function (log) { return _this.log(log); });
        }
    };
    return Logger;
}());
export { Logger as default, GlobalLogger };
//# sourceMappingURL=index.js.map