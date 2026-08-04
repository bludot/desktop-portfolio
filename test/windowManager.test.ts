import { describe, it, expect, beforeEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'
import windowManager from '../src/utils/windowManager'
import db from '../src/Store'

jss.setup(preset())
jss.use(nested())

const makeDesktop = () => {
  const root = document.createElement('div')
  const taskbar = document.createElement('div')
  document.body.appendChild(root)
  return {
    getElement: () => root,
    getTaskbar: () => ({ getElement: () => taskbar }),
  } as any
}

// WindowManager.new() calls window.load() without awaiting it, so settle the
// mount before acting on the window; otherwise unload() can race a load() that
// has not yet assigned `parent`.
const openWindow = async (title: string) => {
  windowManager.new({
    title,
    content: document.createElement('p'),
    desktop: makeDesktop(),
    dimensions: { width: 200, height: 200 },
    windowPosition: { top: 10, left: 10 },
    center: false,
  } as any)
  const win = windowManager.windows.head.value.window
  await vi.waitFor(() => expect(win.parent).toBeTruthy())
  return win
}

// Count by walking the list rather than reading `windows.length`: removeByNode
// does not decrement the counter, so `length` overstates the real size.
// See the "does NOT decrement length" case in linkedList.test.ts.
const titles = () => {
  const out: string[] = []
  let node = windowManager.windows.head
  while (node) {
    out.push(node.value.window.title)
    node = node.next
  }
  return out
}

describe('WindowManager', () => {
  beforeEach(async () => {
    await db.featureFlags.clear()
    // The manager is a module singleton; reset its list between tests.
    windowManager.windows.head = null
    windowManager.windows.tail = null
    windowManager.windows.length = 0
  })

  it('tracks each new window', async () => {
    await openWindow('First')
    expect(titles()).toEqual(['First'])
  })

  it('windows.length overstates the real count (known defect)', async () => {
    await openWindow('First')
    expect(titles()).toHaveLength(1)
    // onActive() removes then re-inserts the node, and removeByNode never
    // decrements, so the counter climbs by two per window.
    expect(windowManager.windows.length).toBe(2)
  })

  it('puts the most recently opened window at the head', async () => {
    await openWindow('First')
    await openWindow('Second')
    expect(titles()).toEqual(['Second', 'First'])
  })

  it('assigns a z-index to every window', async () => {
    await openWindow('First')
    await openWindow('Second')
    const zIndexes: string[] = []
    let node = windowManager.windows.head
    while (node) {
      zIndexes.push(node.value.window.getElement().style.zIndex)
      node = node.next
    }
    // Head is topmost, so it carries the highest index.
    expect(Number(zIndexes[0])).toBeGreaterThan(Number(zIndexes[1]))
  })

  it('getNodeByWindow finds the node holding a window', async () => {
    const first = await openWindow('First')
    await openWindow('Second')
    expect(windowManager.getNodeByWindow(first).value.window).toBe(first)
  })

  it('getNodeByWindow returns null when nothing is open', async () => {
    expect(windowManager.getNodeByWindow({} as any)).toBeNull()
  })

  it('onActive promotes a background window and focuses it', async () => {
    const first = await openWindow('First')
    await openWindow('Second')
    expect(titles()).toEqual(['Second', 'First'])

    windowManager.onActive(first)

    expect(titles()).toEqual(['First', 'Second'])
    expect(first.active).toBe(true)
  })

  it('onActive on the already-active window keeps it focused', async () => {
    await openWindow('First')
    const second = await openWindow('Second')
    windowManager.onActive(second)
    expect(second.active).toBe(true)
    expect(titles()).toEqual(['Second', 'First'])
  })

  it('remove unloads the window and drops it from the list', async () => {
    const first = await openWindow('First')
    const second = await openWindow('Second')
    const unload = vi.spyOn(second, 'unload')

    windowManager.remove(second)

    expect(unload).toHaveBeenCalled()
    expect(titles()).toEqual(['First'])
    expect(first.active).toBe(true)
  })

  it('remove copes with closing the last window', async () => {
    const only = await openWindow('Only')
    windowManager.remove(only)
    expect(windowManager.windows.head).toBeNull()
    expect(titles()).toEqual([])
  })

  it('setIndexes is a no-op on an empty list', async () => {
    expect(() => windowManager.setIndexes()).not.toThrow()
  })
})
