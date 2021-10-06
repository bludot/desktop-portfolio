var LNode = /** @class */ (function () {
    function LNode(value) {
        this.value = value;
        this.next = null;
        this.prev = null;
    }
    return LNode;
}());
export { LNode };
var DoublyLinkedList = /** @class */ (function () {
    function DoublyLinkedList() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
    DoublyLinkedList.prototype.push = function (val) {
        var newLNode = new LNode(val);
        if (!this.head) {
            this.head = this.tail = newLNode;
        }
        else {
            var temp = this.tail;
            this.tail = newLNode;
            newLNode.prev = temp;
            temp.next = newLNode;
        }
        this.length++;
        return this;
    };
    DoublyLinkedList.prototype.pop = function () {
        //in case of empty list
        if (this.length === 0) {
            return null;
        }
        //get popped LNode
        var popped = this.tail;
        //save newTail to a variable (could be null)
        var newTail = this.tail.prev;
        //if newTail is not null
        if (newTail) {
            //sever connection to popped LNode
            newTail.next = null;
            //sever connection from popped LNode
            this.tail.prev = null;
            //in case of 1 length list
        }
        else {
            //make sure to edit head in case newTail is null
            this.head = null;
        }
        //assign new tail (could be null)
        this.tail = newTail;
        // subtract length
        this.length--;
        return popped;
    };
    DoublyLinkedList.prototype.shift = function () {
        //in case list is empty
        if (!this.head) {
            return null;
        }
        //save shifted LNode to variable
        var shiftedLNode = this.head;
        //make the new head the next (might be null)
        var newHead = this.head.next; //might be null
        //if list is more than 1
        if (this.head !== this.tail) {
            newHead.prev = null;
            shiftedLNode.next = null;
        }
        else {
            this.tail = null;
        }
        this.head = newHead;
        this.length--;
        return shiftedLNode;
    };
    DoublyLinkedList.prototype.unshift = function (val) {
        var newLNode = new LNode(val);
        if (!this.head) {
            this.head = newLNode;
            this.tail = newLNode;
        }
        else {
            this.head.prev = newLNode;
            newLNode.next = this.head;
            this.head = newLNode;
        }
        this.length++;
        return this;
    };
    DoublyLinkedList.prototype.insertAtIndex = function (index, val) {
        //if index doesn't exist
        if (index > this.length) {
            return null;
        }
        if (index === 0) {
            this.unshift(val);
        }
        else if (index === this.length) {
            this.push(val);
        }
        else {
            var newLNode = new LNode(val);
            var after = this.getLNodeAtIndex(index);
            var before = after.prev;
            after.prev = newLNode;
            before.next = newLNode;
            newLNode.next = after;
            newLNode.prev = before;
            this.length++;
        }
        return this;
    };
    DoublyLinkedList.prototype.removeAtIndex = function (index) {
        var removedLNode;
        if (index >= this.length) {
            return null;
        }
        if (index == 0) {
            removedLNode = this.shift();
        }
        else if (index == this.length - 1) {
            removedLNode = this.pop();
        }
        else {
            removedLNode = this.getLNodeAtIndex(index);
            var after = removedLNode.next;
            var before = removedLNode.prev;
            removedLNode.next = null;
            removedLNode.prev = null;
            before.next = after;
            after.prev = before;
            this.length--;
        }
        return removedLNode;
    };
    DoublyLinkedList.prototype.getLNodeAtIndex = function (index) {
        if (index >= this.length || index < 0) {
            return null;
        }
        var currentIndex = 0;
        var currentLNode = this.head;
        while (currentIndex !== index) {
            currentLNode = currentLNode.next;
            currentIndex++;
        }
        return currentLNode;
    };
    DoublyLinkedList.prototype.getLNodeByValue = function (val) {
        if (this.head) {
            var current = this.head;
            while (current.next && current.value !== val) {
                current = current.next;
            }
            return current;
        }
        else {
            return null;
        }
    };
    DoublyLinkedList.prototype.setLNodeAtIndex = function (index, val) {
        var foundLNode = this.getLNodeAtIndex(index);
        if (foundLNode === this.head) {
            var head = new LNode(val);
            head.next = this.head;
            head.prev = this.tail;
            this.head = head;
            return head;
        }
        if (foundLNode) {
            var node = new LNode(val);
            node.prev = foundLNode.prev;
            node.next = foundLNode;
            foundLNode.prev.next = node;
            foundLNode.prev = node;
            return node;
        }
        // this.push(val);
        return null;
    };
    DoublyLinkedList.prototype.removeByNode = function (node) {
        if (this.head === null) {
            return null;
        }
        var temp = this.head;
        var next;
        var prev;
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
                return node;
            }
            temp = temp.next;
        }
        return null;
    };
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
    DoublyLinkedList.prototype.printList = function () {
        console.log(this);
        if (this.head) {
            var current = this.head;
            while (current.next) {
                console.log(current);
                current = current.next;
            }
            console.log(current);
        }
        else {
            console.log("empty list");
        }
    };
    return DoublyLinkedList;
}());
export { DoublyLinkedList };
//# sourceMappingURL=linkedList.js.map