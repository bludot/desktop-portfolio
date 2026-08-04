import OSWindow from "./../components/Window";
import { DoublyLinkedList, LNode } from "./linkedList";
import type { IWindow } from "./../components/Window/interfaces";

const between = (initial: number, first: number, second: number) => {
  return initial >= first && initial <= second;
};

interface IManagedWindow {
  window: OSWindow;
  index: number;
  setIndex: (index: number) => void;
}

class WindowManager {
  windows: DoublyLinkedList<IManagedWindow>;
  constructor() {
    this.windows = new DoublyLinkedList<IManagedWindow>();
  }
  new(windowOptions: Partial<IWindow>) {
    const fullWindowOptions: IWindow = {
      ...windowOptions,
      onActive: this.onActive.bind(this),
      onClose: this.remove.bind(this)
    } as IWindow;
    const oswindowInstance = new OSWindow(fullWindowOptions);
    const oswindow = {
      window: oswindowInstance,
      index: this.windows.length + 1,
      setIndex: oswindowInstance.setIndex.bind(oswindowInstance)
    };
    oswindow.window.load(null as unknown as HTMLElement);
    oswindow.setIndex(oswindow.index);
    const list: DoublyLinkedList<IManagedWindow> = this.windows.push(oswindow);
    this.onActive(list.tail!.value.window);
  }
  getNodeByWindow(window: OSWindow) {
    if (this.windows.head) {
      let current = this.windows.head;
      while (current.next && current.value.window !== window) {
        current = current.next;
      }
      return current;
    } else {
      return null;
    }
  }
  onActive(window: OSWindow) {
    const node = this.getNodeByWindow(window)!;
    const oldWindow = this.windows.getLNodeAtIndex(0)!;
    if (node !== oldWindow) {
      oldWindow.value.window.unfocus();
      node.value.window.focus();
    } else {
      node.value.window.focus();
    }
    this.windows.removeByNode(node);
    this.windows.insertAtIndex(0, node.value);
    this.setIndexes();
  }
  setIndexes() {
    if (this.windows.tail) {
      let current: LNode<IManagedWindow> | null = this.windows.tail;
      let index = 1;
      while (current) {
        current.value.index = index;
        current.value.setIndex(index);
        current = current.prev;
        index += 1;
      }
    }
  }
  remove(oswindow: OSWindow): void {
    oswindow.unload();
    const node = this.getNodeByWindow(oswindow)!;
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
    }
    //this.windows.
    // this.windows.removeAtIndex()
    */
  }
}

const windowManager = new WindowManager();
export default windowManager;
