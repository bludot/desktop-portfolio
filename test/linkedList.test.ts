import { describe, it, expect } from 'vitest'
import { DoublyLinkedList, LNode } from '../src/utils/linkedList'

const toArray = <T>(list: DoublyLinkedList<T>): T[] => {
  const out: T[] = []
  let node = list.head
  while (node) {
    out.push(node.value)
    node = node.next
  }
  return out
}

const toArrayReverse = <T>(list: DoublyLinkedList<T>): T[] => {
  const out: T[] = []
  let node = list.tail
  while (node) {
    out.push(node.value)
    node = node.prev
  }
  return out
}

const listOf = (...vals: string[]) => {
  const list = new DoublyLinkedList<string>()
  vals.forEach((v) => list.push(v))
  return list
}

describe('LNode', () => {
  it('starts detached', () => {
    const node = new LNode('a')
    expect(node.value).toBe('a')
    expect(node.next).toBeNull()
    expect(node.prev).toBeNull()
  })
})

describe('push', () => {
  it('sets head and tail to the same node on the first push', () => {
    const list = listOf('a')
    expect(list.head).toBe(list.tail)
    expect(list.length).toBe(1)
  })

  it('links nodes in both directions', () => {
    const list = listOf('a', 'b', 'c')
    expect(toArray(list)).toEqual(['a', 'b', 'c'])
    expect(toArrayReverse(list)).toEqual(['c', 'b', 'a'])
    expect(list.length).toBe(3)
  })

  it('returns the list so calls can chain', () => {
    const list = new DoublyLinkedList<string>()
    expect(list.push('a')).toBe(list)
  })
})

describe('pop', () => {
  it('returns null on an empty list', () => {
    expect(new DoublyLinkedList<string>().pop()).toBeNull()
  })

  it('empties the list when popping the only node', () => {
    const list = listOf('a')
    expect(list.pop().value).toBe('a')
    expect(list.head).toBeNull()
    expect(list.tail).toBeNull()
    expect(list.length).toBe(0)
  })

  it('detaches the popped node from the list', () => {
    const list = listOf('a', 'b')
    const popped = list.pop()
    expect(popped.value).toBe('b')
    expect(popped.prev).toBeNull()
    expect(list.tail.value).toBe('a')
    expect(list.tail.next).toBeNull()
    expect(toArray(list)).toEqual(['a'])
  })
})

describe('shift', () => {
  it('returns null on an empty list', () => {
    expect(new DoublyLinkedList<string>().shift()).toBeNull()
  })

  it('empties the list when shifting the only node', () => {
    const list = listOf('a')
    expect(list.shift().value).toBe('a')
    expect(list.head).toBeNull()
    expect(list.tail).toBeNull()
    expect(list.length).toBe(0)
  })

  it('detaches the shifted node and promotes the next head', () => {
    const list = listOf('a', 'b', 'c')
    const shifted = list.shift()
    expect(shifted.value).toBe('a')
    expect(shifted.next).toBeNull()
    expect(list.head.value).toBe('b')
    expect(list.head.prev).toBeNull()
    expect(toArray(list)).toEqual(['b', 'c'])
  })
})

describe('unshift', () => {
  it('seeds head and tail on an empty list', () => {
    const list = new DoublyLinkedList<string>()
    list.unshift('a')
    expect(list.head).toBe(list.tail)
    expect(list.length).toBe(1)
  })

  it('prepends and keeps both directions linked', () => {
    const list = listOf('b', 'c')
    list.unshift('a')
    expect(toArray(list)).toEqual(['a', 'b', 'c'])
    expect(toArrayReverse(list)).toEqual(['c', 'b', 'a'])
  })
})

describe('insertAtIndex', () => {
  it('rejects an index past the end', () => {
    expect(listOf('a').insertAtIndex(5, 'x')).toBeNull()
  })

  it('inserts at the front via unshift', () => {
    const list = listOf('b', 'c')
    list.insertAtIndex(0, 'a')
    expect(toArray(list)).toEqual(['a', 'b', 'c'])
  })

  it('appends when the index equals the length', () => {
    const list = listOf('a', 'b')
    list.insertAtIndex(2, 'c')
    expect(toArray(list)).toEqual(['a', 'b', 'c'])
  })

  it('splices into the middle and relinks both neighbours', () => {
    const list = listOf('a', 'c')
    list.insertAtIndex(1, 'b')
    expect(toArray(list)).toEqual(['a', 'b', 'c'])
    expect(toArrayReverse(list)).toEqual(['c', 'b', 'a'])
    expect(list.length).toBe(3)
  })
})

describe('removeAtIndex', () => {
  it('rejects an out-of-range index', () => {
    expect(listOf('a').removeAtIndex(1)).toBeNull()
  })

  it('removes the first node via shift', () => {
    const list = listOf('a', 'b', 'c')
    expect(list.removeAtIndex(0).value).toBe('a')
    expect(toArray(list)).toEqual(['b', 'c'])
  })

  it('removes the last node via pop', () => {
    const list = listOf('a', 'b', 'c')
    expect(list.removeAtIndex(2).value).toBe('c')
    expect(toArray(list)).toEqual(['a', 'b'])
  })

  it('removes a middle node and closes the gap', () => {
    const list = listOf('a', 'b', 'c')
    const removed = list.removeAtIndex(1)
    expect(removed.value).toBe('b')
    expect(removed.next).toBeNull()
    expect(removed.prev).toBeNull()
    expect(toArray(list)).toEqual(['a', 'c'])
    expect(toArrayReverse(list)).toEqual(['c', 'a'])
    expect(list.length).toBe(2)
  })
})

describe('getLNodeAtIndex', () => {
  it('returns null for out-of-range indices', () => {
    const list = listOf('a')
    expect(list.getLNodeAtIndex(1)).toBeNull()
    expect(list.getLNodeAtIndex(-1)).toBeNull()
  })

  it('walks to the requested position', () => {
    const list = listOf('a', 'b', 'c')
    expect(list.getLNodeAtIndex(0).value).toBe('a')
    expect(list.getLNodeAtIndex(2).value).toBe('c')
  })
})

describe('getLNodeByValue', () => {
  it('returns null on an empty list', () => {
    expect(new DoublyLinkedList<string>().getLNodeByValue('a')).toBeNull()
  })

  it('finds a matching node', () => {
    const list = listOf('a', 'b', 'c')
    expect(list.getLNodeByValue('b').value).toBe('b')
  })

  it('stops at the tail when nothing matches', () => {
    const list = listOf('a', 'b')
    // Documents current behaviour: the walk ends at the tail rather than
    // reporting "not found".
    expect(list.getLNodeByValue('zzz')).toBe(list.tail)
  })
})

describe('setLNodeAtIndex', () => {
  it('returns null when the index does not exist', () => {
    expect(listOf('a').setLNodeAtIndex(9, 'x')).toBeNull()
  })

  it('replaces the head', () => {
    const list = listOf('a', 'b')
    const node = list.setLNodeAtIndex(0, 'z')
    expect(node.value).toBe('z')
    expect(list.head).toBe(node)
  })

  it('splices a new node in before the target', () => {
    const list = listOf('a', 'b', 'c')
    const node = list.setLNodeAtIndex(1, 'z')
    expect(node.value).toBe('z')
    expect(toArray(list)).toEqual(['a', 'z', 'b', 'c'])
  })
})

describe('removeByNode', () => {
  it('returns null on an empty list', () => {
    expect(new DoublyLinkedList<string>().removeByNode(new LNode('a'))).toBeNull()
  })

  it('returns null when the node is not a member', () => {
    expect(listOf('a', 'b').removeByNode(new LNode('zzz'))).toBeNull()
  })

  it('unlinks a middle node', () => {
    const list = listOf('a', 'b', 'c')
    const middle = list.getLNodeAtIndex(1)
    expect(list.removeByNode(middle)).toBe(middle)
    expect(toArray(list)).toEqual(['a', 'c'])
    expect(toArrayReverse(list)).toEqual(['c', 'a'])
  })

  // Regression: removeByNode was the one remove path that did not decrement
  // `length`, so the counter drifted above the real node count. WindowManager
  // removes then re-inserts on every focus change, which made `windows.length`
  // grow by two per window opened.
  it('decrements length, keeping it in step with the nodes', () => {
    const list = listOf('a', 'b', 'c')

    list.removeByNode(list.getLNodeAtIndex(1))
    expect(list.length).toBe(2)
    expect(toArray(list)).toHaveLength(2)

    list.removeByNode(list.head)
    expect(list.length).toBe(1)

    list.removeByNode(list.head)
    expect(list.length).toBe(0)
    expect(toArray(list)).toEqual([])
  })

  it('leaves length alone when the node is not a member', () => {
    const list = listOf('a', 'b')
    list.removeByNode(new LNode('zzz'))
    expect(list.length).toBe(2)
  })

  it('moves head forward when removing the head', () => {
    const list = listOf('a', 'b')
    list.removeByNode(list.head)
    expect(list.head.value).toBe('b')
    expect(toArray(list)).toEqual(['b'])
  })

  it('moves tail back when removing the tail', () => {
    const list = listOf('a', 'b')
    list.removeByNode(list.tail)
    expect(list.tail.value).toBe('a')
    expect(toArray(list)).toEqual(['a'])
  })
})
