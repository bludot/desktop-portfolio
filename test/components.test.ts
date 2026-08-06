import { describe, it, expect, beforeEach, vi } from 'vitest'
import jss from 'jss'
import preset from 'jss-preset-default'
import nested from 'jss-plugin-nested'

import Button from '../src/components/Button'
import SwitchToggle from '../src/components/SwitchToggle'
import Loader from '../src/components/Loader'
import Bootscreen from '../src/components/Bootscreen'
import Bootlogo from '../src/components/Bootscreen/bootlogo'
import Taskbar from '../src/components/Taskbar'
import TaskbarButtons from '../src/components/Taskbar/button'
import Desktop from '../src/components/Desktop'
import StartMenu from '../src/components/StartMenu'
import MenuGrid from '../src/components/StartMenu/menuGrid'
import MenuItem from '../src/components/StartMenu/menuItem'
import ProfileImg from '../src/components/StartMenu/profileImg'
import User from '../src/components/StartMenu/user'
import TitleBar from '../src/components/Window/titlebar'
import TopBar from '../src/components/Window/topbar'
import WindowBlur from '../src/components/Window/blur'
import AboutContent from '../src/contents/about'
import AlertContent from '../src/contents/alert'
import LoggerWindow from '../src/contents/logger'
import ExperienceContent from '../src/contents/experience'
import ExperiencesContent, { duration } from '../src/contents/experience/experiences'
import { GlobalLogger } from '../src/Logger'
import { Log } from '../src/Logger/Log'
import { LOG_TYPE } from '../src/Logger/interfaces'

jss.setup(preset())
jss.use(nested())

let host: HTMLElement

const makeDesktop = () =>
  ({
    getElement: () => host,
    getTaskbar: () => ({ getElement: () => document.createElement('div') }),
  }) as any

beforeEach(() => {
  host = document.createElement('div')
  host.id = 'app'
  document.body.appendChild(host)
})

describe('Button', () => {
  it('renders its text and wires the click handler', () => {
    const onClick = vi.fn()
    const button = Button({ onClick, text: 'Press me' })
    expect(button.tagName).toBe('BUTTON')
    expect(button.textContent).toBe('Press me')
    button.click()
    expect(onClick).toHaveBeenCalled()
  })
})

describe('SwitchToggle', () => {
  it('renders an unchecked checkbox by default', async () => {
    const toggle = new SwitchToggle()
    await toggle.load(host)
    const input = toggle.getElement().querySelector('input')!
    expect(input.type).toBe('checkbox')
    expect(input.checked).toBe(false)
  })

  it('renders checked when constructed with a truthy value', async () => {
    const toggle = new SwitchToggle(10, undefined, undefined, true)
    await toggle.load(host)
    expect(toggle.getElement().querySelector('input')!.checked).toBe(true)
  })

  // Defaults are theme tokens, not literals: a switch belongs to whichever
  // theme is in force. They used to be a stray Material blue and a #ccc that
  // disappeared entirely against a dark window.
  it('falls back to theme tokens when passed no colours', () => {
    const toggle = new SwitchToggle(10, undefined, undefined, false)
    expect(toggle.onColor).toBe('var(--accent)')
    expect(toggle.offColor).toBe('var(--line)')
  })

  it('honours explicit colours and size', () => {
    const toggle = new SwitchToggle(40, '#000', '#fff', false)
    expect(toggle.size).toBe(40)
    expect(toggle.offColor).toBe('#000')
    expect(toggle.onColor).toBe('#fff')
  })

  it('setOnClick binds the handler to the component', async () => {
    const toggle = new SwitchToggle()
    await toggle.load(host)
    let seen: unknown
    toggle.setOnClick(function (this: SwitchToggle) {
      seen = this
    })
    toggle.getElement().click()
    expect(seen).toBe(toggle)
  })
})

describe('Loader', () => {
  it('gets a unique id per instance', async () => {
    const a = new Loader()
    const b = new Loader()
    expect(a.id).not.toBe(b.id)
    expect(a.id).toMatch(/^Loader_[0-9a-f]+$/)
    await a.load(host)
    expect(host.contains(a.getElement())).toBe(true)
  })
})

describe('Bootlogo', () => {
  it('loads an svg logo', async () => {
    const logo = new Bootlogo()
    await logo.load(host)
    expect(host.contains(logo.getElement())).toBe(true)
  })
})

describe('Bootscreen', () => {
  it('mounts the logo and loader on load', async () => {
    const boot = new Bootscreen()
    await boot.load(host)
    expect(host.contains(boot.getElement())).toBe(true)
    expect(boot.getElement().children.length).toBeGreaterThan(0)
  })

  // A floor, not a duration: a start-up that has already taken longer than the
  // sequence would have has waited enough, and the screen gets out of the way.
  it('adds nothing to a start-up that has already outrun it', async () => {
    vi.useFakeTimers()
    const boot = new Bootscreen()
    await boot.load(host)

    vi.setSystemTime(Date.now() + 3000)

    let done = false
    const running = boot.complete().then(() => { done = true })
    await vi.advanceTimersByTimeAsync(0)
    await running
    expect(done).toBe(true)
    vi.useRealTimers()
  })

  // Regression: the boot sequence used to be visible only because startup
  // awaited two canvas stack blurs of the wallpaper. With that work gone it
  // flashed past, so the duration is now stated rather than incidental.
  it('runs a determinate bar and holds the screen while it does', async () => {
    vi.useFakeTimers()
    const boot = new Bootscreen()
    await boot.load(host)

    const fill = boot.getElement().querySelector<HTMLElement>('.boot-bar > i')!
    expect(fill).toBeTruthy()
    expect(boot.getElement().textContent).toContain('Starting up')

    let done = false
    const running = boot.complete().then(() => { done = true })

    // Not finished before the sequence has had its time.
    await vi.advanceTimersByTimeAsync(600)
    expect(done).toBe(false)

    await vi.advanceTimersByTimeAsync(600)
    await running
    expect(done).toBe(true)
    expect(fill.style.width).toBe('100%')
    vi.useRealTimers()
  })

  it('fades out before unloading', async () => {
    vi.useFakeTimers()
    const boot = new Bootscreen()
    await boot.load(host)

    const unloading = boot.unload()
    await vi.advanceTimersByTimeAsync(250)
    await unloading

    expect(boot.getElement().style.opacity).toBe('0')
    expect(host.contains(boot.getElement())).toBe(false)
    vi.useRealTimers()
  })

  /*
   * The desktop is built behind the boot screen, so the sequence shows it
   * through a blur rather than hiding it behind a flat colour. The flat sky
   * only sits there until there is something worth looking at.
   */
  it('drops the flat sky once the sequence starts, and comes back into focus on the way out', async () => {
    vi.useFakeTimers()
    const boot = new Bootscreen()
    await boot.load(host)

    expect(boot.getElement().classList.contains('boot-revealed')).toBe(false)

    const running = boot.complete()
    expect(boot.getElement().classList.contains('boot-revealed')).toBe(true)
    await vi.advanceTimersByTimeAsync(1100)
    await running

    const unloading = boot.unload()
    await vi.advanceTimersByTimeAsync(250)
    await unloading
    expect(boot.getElement().style.backdropFilter).toBe('blur(0px)')
    vi.useRealTimers()
  })

  describe('with the log showing', () => {
    it('replays what has already been said and follows the rest', async () => {
      const logger = GlobalLogger.getInstance()
      logger.log(new Log(LOG_TYPE.DEBUG, 'Before the screen was up', 'Early'))

      const boot = new Bootscreen({ log: true })
      await boot.load(host)

      const panel = boot.getElement().querySelector('.boot-log')!
      expect(panel.textContent).toContain('Before the screen was up')
      expect(panel.textContent).toContain('Early')

      logger.log(new Log(LOG_TYPE.ERROR, 'And this one after', 'Later'))
      expect(panel.textContent).toContain('And this one after')
      // Errors are the only lines that get to shout.
      expect(panel.querySelector('span.is-loud')?.textContent).toContain(
        'And this one after'
      )

      // Nothing is written to a screen that has been taken down.
      await boot.unload()
      logger.log(new Log(LOG_TYPE.DEBUG, 'Long after', 'Later'))
      expect(panel.textContent).not.toContain('Long after')
    })

    /*
     * Every component says half a dozen of these on its way up, which buries
     * the lines that say what start-up is actually doing. One line per
     * component is the part worth watching.
     */
    it('drops the lifecycle chatter but never a warning', async () => {
      const boot = new Bootscreen({ log: true })
      await boot.load(host)
      const panel = boot.getElement().querySelector('.boot-log')!

      const logger = GlobalLogger.getInstance()
      logger.log(new Log(LOG_TYPE.DEBUG, 'Finished afterLoad hook', 'Taskbar'))
      logger.log(new Log(LOG_TYPE.DEBUG, 'Applying styles', 'Taskbar'))
      expect(panel.textContent).not.toContain('afterLoad')
      expect(panel.textContent).not.toContain('Applying styles')

      logger.log(new Log(LOG_TYPE.DEBUG, 'Loaded Instance', 'Taskbar'))
      expect(panel.textContent).toContain('Loaded Instance')

      // A warning saying the same thing is still a warning.
      logger.log(new Log(LOG_TYPE.WARNING, 'Applying styles', 'Taskbar'))
      const loud = panel.querySelectorAll('span.is-loud')
      expect(loud[loud.length - 1].textContent).toContain('Applying styles')
      await boot.unload()
    })

    it('keeps the panel to a readable length', async () => {
      const boot = new Bootscreen({ log: true })
      await boot.load(host)
      const panel = boot.getElement().querySelector('.boot-log')!

      const logger = GlobalLogger.getInstance()
      for (let i = 0; i < 80; i++) {
        logger.log(new Log(LOG_TYPE.DEBUG, `line ${i}`, 'Spam'))
      }

      expect(panel.childElementCount).toBeLessThanOrEqual(60)
      expect(panel.textContent).toContain('line 79')
      await boot.unload()
    })
  })
})

describe('WindowBlur', () => {
  it('loads and keeps its configured radius', async () => {
    const blur = new WindowBlur(60, 8)
    expect(blur.blur).toBe(60)
    expect(blur.radius).toBe(8)
    await blur.load(host)
    expect(host.contains(blur.getElement())).toBe(true)
  })
})

describe('TitleBar / TopBar', () => {
  it('TitleBar renders the given title', async () => {
    const title = new TitleBar({ title: 'My Window' } as any)
    await title.load(host)
    expect(title.getElement().textContent).toContain('My Window')
  })

  it('TopBar carries the topbar-window class and mounts its children', async () => {
    const close = vi.fn()
    const topbar = new TopBar({ title: 'W', close, isDialog: false })
    await topbar.load(host)
    expect(topbar.getElement().className).toContain('topbar-window')
    // The children are custom-tag OSElements (window buttons + titlebar).
    expect(topbar.getElement().children.length).toBe(2)
    expect(topbar.getElement().textContent).toContain('W')
  })

  it('TopBar in dialog mode still renders', async () => {
    const topbar = new TopBar({ title: 'D', close: vi.fn(), isDialog: true })
    await topbar.load(host)
    expect(host.contains(topbar.getElement())).toBe(true)
  })
})

describe('Taskbar', () => {
  it('loads with its buttons attached', async () => {
    const taskbar = new Taskbar(makeDesktop())
    await taskbar.load(host)
    expect(host.contains(taskbar.getElement())).toBe(true)
    expect(taskbar.taskbarButtons).toBeDefined()
  })

  it('TaskbarButtons renders one button showing the user name', async () => {
    const buttons = new TaskbarButtons(makeDesktop())
    await buttons.load(host)
    expect(buttons.buttons).toHaveLength(1)
    expect(buttons.getElement().textContent).toContain('James')
  })

  it('the taskbar button opens the start menu, and the next click closes it', async () => {
    const buttons = new TaskbarButtons(makeDesktop())
    await buttons.load(host)
    const button = buttons.buttons[0]

    button.getElement().click()
    // load() is async and the click handler does not await it.
    await vi.waitFor(() => expect(host.querySelector('#start-menu')).toBeTruthy())

    window.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await vi.waitFor(() => expect(host.querySelector('#start-menu')).toBeFalsy())
  })

  /*
   * Regression: opening and closing both await, and a close landing inside an
   * open's await broke the launcher permanently. The close unloaded before the
   * load had appended anything, so nothing was removed; the load then finished
   * and appended the menu anyway, leaving it on screen with the state saying it
   * was shut. The next click called load() again, which throws.
   */
  it('survives being hammered, ending in the state the last click asked for', async () => {
    const buttons = new TaskbarButtons(makeDesktop())
    await buttons.load(host)
    const button = buttons.buttons[0].getElement()

    // The signature of the bug is load() being called on a menu that is still
    // mounted, which throws inside a promise nobody awaits.
    const rejections: unknown[] = []
    const onRejection = (reason: unknown) => rejections.push(reason)
    process.on('unhandledRejection', onRejection)

    // Four clicks with no waiting between them: open, close, open, close.
    button.click()
    button.click()
    button.click()
    button.click()

    await vi.waitFor(() => expect(host.querySelector('#start-menu')).toBeFalsy())
    await new Promise((resolve) => setTimeout(resolve, 50))
    process.off('unhandledRejection', onRejection)

    expect(rejections).toEqual([])

    // And it still works afterwards, rather than being wedged.
    button.click()
    await vi.waitFor(() => expect(host.querySelector('#start-menu')).toBeTruthy())
  })

  /*
   * Regression: an open that failed still marked the launcher open, so the
   * next press closed a menu that had never appeared and only the one after
   * it opened anything — the "takes two presses" fault. The menu mounts into
   * #app, so a document without one makes the open throw.
   */
  it('is not wedged by an open that fails', async () => {
    // Earlier tests leave their own #app behind, which would give the menu
    // somewhere to mount and the open would not fail at all.
    const existing = [...document.querySelectorAll('#app')] as HTMLElement[]
    existing.forEach((el) => el.removeAttribute('id'))

    const orphan = document.createElement('div')
    document.body.appendChild(orphan)

    const buttons = new TaskbarButtons({
      getElement: () => orphan,
      getTaskbar: () => ({ getElement: () => document.createElement('div') }),
    } as any)
    await buttons.load(orphan)
    const button = buttons.buttons[0].getElement()

    // No #app anywhere, so opening throws.
    button.click()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(orphan.querySelector('#start-menu')).toBeFalsy()

    // With somewhere to mount, the very next press opens it — not the one after.
    orphan.id = 'app'
    button.click()
    await vi.waitFor(() => expect(orphan.querySelector('#start-menu')).toBeTruthy())
    orphan.remove()
    existing.forEach((el) => (el.id = 'app'))
  })

  it('ends open on an odd number of clicks', async () => {
    const buttons = new TaskbarButtons(makeDesktop())
    await buttons.load(host)
    const button = buttons.buttons[0].getElement()

    button.click()
    button.click()
    button.click()

    await vi.waitFor(() => expect(host.querySelector('#start-menu')).toBeTruthy())
  })
})

describe('duration', () => {
  const jan = (year: number, month: number) => new Date(year, month - 1, 1)

  /*
   * Counted inclusively, the way a CV counts it: Oct 2023 to Jul 2026 is
   * thirty-four months, not thirty-three. A duration a month shorter than the
   * one on his CV would read as a mistake.
   */
  it('includes both end months', () => {
    expect(duration(jan(2023, 10), jan(2026, 7))).toBe('2 yrs 10 mos')
    expect(duration(jan(2021, 9), jan(2023, 5))).toBe('1 yr 9 mos')
  })

  it('says only the part that applies', () => {
    expect(duration(jan(2020, 1), jan(2020, 8))).toBe('8 mos')
    expect(duration(jan(2020, 1), jan(2020, 11))).toBe('11 mos')
    expect(duration(jan(2020, 1), jan(2020, 1))).toBe('1 mo')
    expect(duration(jan(2020, 1), jan(2020, 2))).toBe('2 mos')
  })

  it('gets the singulars right', () => {
    expect(duration(jan(2020, 1), jan(2021, 1))).toBe('1 yr 1 mo')
    expect(duration(jan(2020, 1), jan(2020, 12))).toBe('1 yr')
  })

  it('drops a zero remainder rather than printing "0 mos"', () => {
    expect(duration(jan(2020, 1), jan(2020, 11))).not.toContain('yr')
    expect(duration(jan(2019, 2), jan(2021, 1))).toBe('2 yrs')
  })

  it('measures an open-ended role up to today', () => {
    expect(duration(jan(2024, 1), 'present', jan(2026, 6))).toBe('2 yrs 6 mos')
  })

  it('says nothing rather than something absurd about a backwards range', () => {
    expect(duration(jan(2026, 1), jan(2020, 1))).toBe('')
  })
})

describe('Desktop', () => {
  it('exposes its taskbar', () => {
    const desktop = new Desktop({ backgroundColor: '#fff', mainElement: host })
    expect(desktop.getTaskbar()).toBe(desktop.taskbar)
    expect(desktop.backgroundColor).toBe('#fff')
  })

  it('startup mounts itself and unloads the bootscreen', async () => {
    const desktop = new Desktop({ backgroundColor: '#fff', mainElement: host })
    const bootscreen = { unload: vi.fn().mockResolvedValue(undefined) }

    await desktop.startup(bootscreen)

    expect(host.contains(desktop.getElement())).toBe(true)
    expect(bootscreen.unload).toHaveBeenCalled()
  })
})

describe('StartMenu pieces', () => {
  it('MenuGrid loads', async () => {
    const grid = new MenuGrid()
    await grid.load(host)
    expect(host.contains(grid.getElement())).toBe(true)
  })

  it('ProfileImg loads', async () => {
    const img = new ProfileImg()
    await img.load(host)
    expect(host.contains(img.getElement())).toBe(true)
  })

  it('User renders the name and role', async () => {
    const user = new User()
    await user.load(host)
    expect(user.getElement().textContent).toContain('James')
    expect(user.getElement().textContent).toContain('Software Engineer')
  })

  it('MenuItem renders its label and fires its action on click', async () => {
    const action = vi.fn()
    const item = new MenuItem({
      icon: document.createElement('i'),
      text: 'Experience',
      action,
    })
    await item.load(host)
    expect(item.getElement().textContent).toContain('Experience')
    item.getElement().click()
    expect(action).toHaveBeenCalled()
  })
})

describe('StartMenu', () => {
  it('builds its menu items and loads', async () => {
    const menu = new StartMenu(makeDesktop())
    await menu.load(host)
    expect(host.contains(menu.getElement())).toBe(true)
    expect(menu.getElement().textContent).toContain('James')
  })
})

describe('contents', () => {
  it('AboutContent renders the about copy', async () => {
    const about = new AboutContent()
    await about.load(host)
    expect(about.getElement().textContent).toContain('James')
    expect(about.getElement().querySelector('a')).toBeTruthy()
  })

  it('AlertContent interpolates its title and text', async () => {
    const alert = new AlertContent({ title: 'Oops', text: 'Something broke' })
    await alert.load(host)
    expect(alert.getElement().textContent).toContain('Oops')
    expect(alert.getElement().textContent).toContain('Something broke')
  })

  // date-fns `format` works in local time. Build the fixtures with the
  // local-time constructor so the assertions do not depend on the runner's
  // timezone. (The app itself uses `new Date("2021-08-01")`, which is parsed as
  // UTC and therefore renders a month early west of Greenwich.)
  it('ExperiencesContent renders one role, formatting its dates', async () => {
    const entry = new ExperiencesContent({
      position: 'Backend Engineer',
      company: 'Honest',
      location: 'Bangkok, Thailand',
      description: ['Built things', 'Fixed things'],
      start: new Date(2021, 7, 1),
      end: 'present',
    })
    await entry.load(host)

    const text = entry.getElement().textContent!
    expect(text).toContain('Backend Engineer')
    expect(text).toContain('Honest')
    expect(text).toContain('Bangkok, Thailand')
    expect(text).toContain('08/2021')
    expect(text).toContain('present')
    expect(entry.getElement().querySelectorAll('li')).toHaveLength(2)
  })

  it('ExperiencesContent formats a Date end as a month/year range', async () => {
    const entry = new ExperiencesContent({
      position: 'Full-Stack Engineer',
      company: 'Taskworld',
      location: 'Bangkok, Thailand',
      description: ['Led backend'],
      start: new Date(2020, 6, 1),
      end: new Date(2021, 7, 1),
    })
    await entry.load(host)
    expect(entry.getElement().textContent).toContain('07/2020')
    expect(entry.getElement().textContent).toContain('08/2021')
  })

  // Regression: the roles were declared as new Date("2021-08-01"), parsed as
  // UTC midnight and then formatted in local time, so every start date rendered
  // a month early for viewers west of Greenwich. This suite runs in whatever
  // timezone CI provides, so the assertion is meaningful either way.
  it('ExperienceContent renders start dates in the declared month', async () => {
    const content = new ExperienceContent()
    await content.load(host)
    const text = content.getElement().textContent!

    // The window's titlebar names it now, so the content no longer repeats it.
    expect(text).not.toContain('Experience')
    expect(text).toContain('Backend Engineer')
    expect(text).toContain('08/2021') // not 07/2021
    expect(text).toContain('07/2020')
    expect(text).toContain('11/2012')
    expect(text).not.toContain('07/2021 - present')
  })

  it('LoggerWindow appends a line for each new global log', async () => {
    const logger = new LoggerWindow()
    await logger.load(host)

    const before = logger.getElement().querySelectorAll('span').length
    GlobalLogger.getInstance().log(new Log(LOG_TYPE.INFO, 'streamed line'))

    const spans = logger.getElement().querySelectorAll('span')
    expect(spans.length).toBe(before + 1)
    expect(spans[spans.length - 1].textContent).toContain('streamed line')
  })

  // Regression: GlobalLogger.subscribe() used to return the eventemitter3
  // instance, which has no unsubscribe method, so closing the debugger window
  // threw and left the subscription (and the detached DOM) alive.
  it('LoggerWindow unloads cleanly and stops listening', async () => {
    const logger = new LoggerWindow()
    await logger.load(host)

    await expect(logger.unload()).resolves.not.toThrow()
    expect(host.contains(logger.getElement())).toBe(false)

    const after = logger.getElement().querySelectorAll('span').length
    GlobalLogger.getInstance().log(new Log(LOG_TYPE.INFO, 'post-unload line'))
    expect(logger.getElement().querySelectorAll('span').length).toBe(after)
  })
})
