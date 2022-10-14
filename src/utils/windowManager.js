var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import OSWindow from "./../components/Window";
import { DoublyLinkedList } from "./linkedList";
var between = function (initial, first, second) {
    return initial >= first && initial <= second;
};
var IManagedWindow = /** @class */ (function () {
    function IManagedWindow() {
    }
    return IManagedWindow;
}());
var WindowManager = /** @class */ (function () {
    function WindowManager() {
        this.windows = new DoublyLinkedList();
    }
    WindowManager.prototype["new"] = function (windowOptions) {
        var fullWindowOptions = __assign(__assign({}, windowOptions), { onActive: this.onActive.bind(this), onClose: this.remove.bind(this) });
        var oswindowInstance = new OSWindow(fullWindowOptions);
        var oswindow = {
            window: oswindowInstance,
            index: this.windows.length + 1,
            setIndex: oswindowInstance.setIndex.bind(oswindowInstance)
        };
        oswindow.window.load(null);
        oswindow.setIndex(oswindow.index);
        var list = this.windows.push(oswindow);
        this.onActive(list.tail.value.window);
    };
    WindowManager.prototype.getNodeByWindow = function (window) {
        if (this.windows.head) {
            var current = this.windows.head;
            while (current.next && current.value.window !== window) {
                current = current.next;
            }
            return current;
        }
        else {
            return null;
        }
    };
    WindowManager.prototype.onActive = function (window) {
        // console.log("THIS", this);
        var node = this.getNodeByWindow(window);
        var oldWindow = this.windows.getLNodeAtIndex(0);
        if (node !== oldWindow) {
            oldWindow.value.window.unfocus();
            node.value.window.focus();
        }
        else {
            node.value.window.focus();
        }
        this.windows.removeByNode(node);
        this.windows.insertAtIndex(0, node.value);
        this.setIndexes();
    };
    WindowManager.prototype.setIndexes = function () {
        if (this.windows.tail) {
            var current = this.windows.tail;
            var index = 1;
            while (current) {
                current.value.index = index;
                current.value.setIndex(index);
                current = current.prev;
                index += 1;
            }
        }
        else {
            console.log("empty list");
        }
    };
    WindowManager.prototype.remove = function (oswindow) {
        //console.log(oswindow.unload);
        oswindow.unload();
        var node = this.getNodeByWindow(oswindow);
        this.windows.removeByNode(node);
        if (this.windows.head) {
            this.onActive(this.windows.head.value.window);
        }
        /*
        if (this.windows.head) {
          let current = this.windows.head;
          while (current.next && current.value.window !== oswindow) {
            current = current.next;
          }
        } else {
          console.log("empty list");
        }
        //this.windows.
        // this.windows.removeAtIndex()
        */
    };
    return WindowManager;
}());
var windowManager = new WindowManager();
export default windowManager;
//# sourceMappingURL=windowManager.js.map