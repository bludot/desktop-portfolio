export class LNode<T> {
  value: T;
  next: LNode<T> | null;
  prev: LNode<T> | null;
  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

export class DoublyLinkedList<T> {
  head: LNode<T> | null;
  tail: LNode<T> | null;
  length: number;
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  push(val: T) {
    const newLNode = new LNode<T>(val);
    if (!this.head) {
      this.head = this.tail = newLNode;
    } else {
      const temp = this.tail!;
      this.tail = newLNode;
      newLNode.prev = temp;
      temp.next = newLNode;
    }
    this.length++;
    return this;
  }

  pop(): LNode<T> | null {
    //in case of empty list
    if (this.length === 0) {
      return null;
    }
    //get popped LNode
    const popped = this.tail!;
    //save newTail to a variable (could be null)
    const newTail = popped.prev;
    //if newTail is not null
    if (newTail) {
      //sever connection to popped LNode
      newTail.next = null;
      //sever connection from popped LNode
      popped.prev = null;
      //in case of 1 length list
    } else {
      //make sure to edit head in case newTail is null
      this.head = null;
    }
    //assign new tail (could be null)
    this.tail = newTail;
    // subtract length
    this.length--;

    return popped;
  }

  shift(): LNode<T> | null {
    //in case list is empty
    if (!this.head) {
      return null;
    }
    //save shifted LNode to variable
    const shiftedLNode = this.head;
    //make the new head the next (might be null)
    const newHead = this.head.next; //might be null
    //if list is more than 1
    if (this.head !== this.tail) {
      newHead!.prev = null;
      shiftedLNode.next = null;
    } else {
      this.tail = null;
    }
    this.head = newHead;
    this.length--;
    return shiftedLNode;
  }

  unshift(val: T): DoublyLinkedList<T> {
    const newLNode = new LNode<T>(val);
    if (!this.head) {
      this.head = newLNode;
      this.tail = newLNode;
    } else {
      this.head.prev = newLNode;
      newLNode.next = this.head;
      this.head = newLNode;
    }
    this.length++;
    return this;
  }

  insertAtIndex(index: number, val: T): DoublyLinkedList<T> | null {
    //if index doesn't exist
    if (index > this.length) {
      return null;
    }
    if (index === 0) {
      this.unshift(val);
    } else if (index === this.length) {
      this.push(val);
    } else {
      const newLNode = new LNode(val);
      const after = this.getLNodeAtIndex(index)!;
      const before = after.prev!;
      after.prev = newLNode;
      before.next = newLNode;
      newLNode.next = after;
      newLNode.prev = before;
      this.length++;
    }
    return this;
  }

  removeAtIndex(index: number): LNode<T> | null {
    let removedLNode: LNode<T> | null;
    if (index >= this.length) {
      return null;
    }
    if (index == 0) {
      removedLNode = this.shift();
    } else if (index == this.length - 1) {
      removedLNode = this.pop();
    } else {
      removedLNode = this.getLNodeAtIndex(index)!;
      const after = removedLNode.next!;
      const before = removedLNode.prev!;
      removedLNode.next = null;
      removedLNode.prev = null;
      before.next = after;
      after.prev = before;
      this.length--;
    }
    return removedLNode;
  }

  getLNodeAtIndex(index: number): LNode<T> | null {
    if (index >= this.length || index < 0) {
      return null;
    }
    let currentIndex = 0;
    let currentLNode = this.head;
    while (currentIndex !== index) {
      currentLNode = currentLNode!.next;
      currentIndex++;
    }
    return currentLNode;
  }
  getLNodeByValue(val: T): LNode<T> | null {
    if (this.head) {
      let current = this.head;
      while (current.next && current.value !== val) {
        current = current.next;
      }
      return current;
    } else {
      return null;
    }
  }

  setLNodeAtIndex(index: number, val: T): LNode<T> | null {
    const foundLNode = this.getLNodeAtIndex(index);
    if (foundLNode === this.head) {
      const head = new LNode<T>(val);
      head.next = this.head;
      head.prev = this.tail;
      this.head = head;
      return head;
    }
    if (foundLNode) {
      const node = new LNode<T>(val);
      node.prev = foundLNode.prev;
      node.next = foundLNode;
      foundLNode.prev!.next = node;
      foundLNode.prev = node;
      return node;
    }
    // this.push(val);
    return null;
  }
  removeByNode(node: LNode<T>): LNode<T> | null {
    if (this.head === null) {
      return null;
    }

    let temp: LNode<T> | null = this.head;
    let next: LNode<T> | null;
    let prev: LNode<T> | null;

    while (temp) {
      if (temp === node) {
        next = temp.next;

        prev = temp.prev;

        if (next) {
          next.prev = prev;
        }

        if (prev) {
          prev.next = next;
        }

        if (temp === this.head) {
          this.head = next;
        }

        if (temp === this.tail) {
          this.tail = prev;
        }

        this.length--;

        return node;
      }

      temp = temp.next;
    }

    return null;
  }
  /*
  removeByNode(node: LNode<T>): LNode<T> {
    if (this.tail) {
      let current = this.tail;
      while (current.prev && current !== node) {
        current = current.prev;
      }
      const after = current.next;
      const before = current.prev;
      current.next = null;
      current.prev = null;
      if (before) {
        before.next = after;
      }
      if (after) {
        after.prev = before;
      }
      this.length--;
    } else {
      return null;
    }
  }
  */
}
