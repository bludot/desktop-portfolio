import { LOG_TYPE } from "./interfaces";

export class Log {
  type: LOG_TYPE;
  message: string;
  timestamp: Date;
  formattedMessage: string;
  serviceName: string;
  constructor(type: LOG_TYPE, message: any, serviceName?: string) {
    this.type = type;
    this.message = message;
    this.timestamp = new Date();
    this.serviceName = serviceName;
    this.formattedMessage = this.formatMessage();
    
  }

  formatMessage() {
    let formattedMessage = `[${this.timestamp.toISOString()}] [${this.type}] ${this.message}`;
    if (this.serviceName) {
      formattedMessage = `[${this.serviceName}] ${formattedMessage}`;
    }
    return formattedMessage;
  }  

  service(serviceName: string) {
    this.serviceName = serviceName;
    return this;
  }
}