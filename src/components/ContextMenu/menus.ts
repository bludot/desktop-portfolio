import type { MenuItem } from "./index";

/**
 * What each surface's menu contains.
 *
 * Kept apart from the component and from the surfaces themselves so the part
 * that is easy to get wrong — which items appear, what they are called, and
 * which of them are unavailable right now — can be checked directly, without
 * a desktop to right-click on.
 *
 * The rule throughout: an item that cannot be used is disabled, not removed.
 * A menu whose length changes with the state of the window teaches you nothing,
 * because you never see the same menu twice.
 */

export interface WindowMenuState {
  /** Hidden, but still open. */
  minimized: boolean;
  maximized: boolean;
  /** How many other windows are open. */
  others: number;
}

export interface WindowMenuActions {
  show: () => void;
  minimize: () => void;
  toggleMaximize: () => void;
  close: () => void;
  closeOthers: () => void;
}

/**
 * The menu on a titlebar and on a taskbar chip.
 *
 * One builder for both: they describe the same window, and the only difference
 * between them is that a chip can be pointed at a window that is currently
 * hidden — which the first item already accounts for.
 */
export function windowMenuItems(
  state: WindowMenuState,
  actions: WindowMenuActions
): MenuItem[] {
  return [
    state.minimized
      ? { label: "Show", onPress: actions.show }
      : { label: "Minimize", onPress: actions.minimize },
    {
      label: state.maximized ? "Restore" : "Maximize",
      onPress: actions.toggleMaximize,
      // Nothing to fill or to put back while it is off screen.
      disabled: state.minimized
    },
    { label: "Close", onPress: actions.close, separated: true },
    {
      label: state.others === 1 ? "Close other window" : "Close other windows",
      onPress: actions.closeOthers,
      disabled: state.others === 0
    }
  ];
}

export interface DesktopMenuState {
  /** True when the desktop is currently showing the dark scheme. */
  dark: boolean;
  /** How many windows are open. */
  open: number;
  /** How many of those are on screen. */
  onScreen: number;
}

export interface DesktopMenuActions {
  toggleTheme: () => void;
  showAll: () => void;
  minimizeAll: () => void;
  settings: () => void;
}

/** The menu on the wallpaper. */
export function desktopMenuItems(
  state: DesktopMenuState,
  actions: DesktopMenuActions
): MenuItem[] {
  return [
    // Checkable rather than a pair of "Light mode"/"Dark mode" items: this is
    // one setting with two values, and a tick says which one is in force.
    { label: "Dark mode", checked: state.dark, onPress: actions.toggleTheme },
    {
      label: "Show all windows",
      onPress: actions.showAll,
      disabled: state.open === 0,
      separated: true
    },
    {
      label: "Minimize all windows",
      onPress: actions.minimizeAll,
      disabled: state.onScreen === 0
    },
    { label: "Change wallpaper…", onPress: actions.settings, separated: true },
    { label: "Settings…", onPress: actions.settings }
  ];
}
