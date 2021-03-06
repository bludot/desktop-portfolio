interface Events {
  [key: string]: Function[];
}

export class EventEmitter {
  public events: Events;
  constructor(events?: Events) {
    this.events = events || {};
  }

  public subscribe(name: string, cb: Function) {
    (this.events[name] || (this.events[name] = [])).push(cb);

    return {
      unsubscribe: () =>
        this.events[name] &&
        this.events[name].splice(this.events[name].indexOf(cb) >>> 0, 1)
    };
  }

  public on(name: string, cb: Function) {
    return this.subscribe(name, cb);
  }

  public emit(name: string, ...args: any[]): void {
    (this.events[name] || []).forEach((fn) => fn(...args));
  }
}
