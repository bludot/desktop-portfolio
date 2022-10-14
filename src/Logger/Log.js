var Log = /** @class */ (function () {
    function Log(type, message, serviceName) {
        this.type = type;
        this.message = message;
        this.timestamp = new Date();
        this.serviceName = serviceName;
        this.formattedMessage = this.formatMessage();
    }
    Log.prototype.formatMessage = function () {
        var formattedMessage = "[" + this.timestamp.toISOString() + "] [" + this.type + "] " + this.message;
        if (this.serviceName) {
            formattedMessage = "[" + this.serviceName + "] " + formattedMessage;
        }
        return formattedMessage;
    };
    Log.prototype.service = function (serviceName) {
        this.serviceName = serviceName;
        return this;
    };
    return Log;
}());
export { Log };
//# sourceMappingURL=Log.js.map