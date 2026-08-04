import Desktop from "./../Desktop";
import OSWindow from "./index";

export interface IWindow {
  /** Optional note about what the window holds, shown beside its title. */
  meta?: string;
  isDialog: boolean
  title: string;
  content: any;
  desktop: Desktop;
  center: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  windowPosition: any,
  onActive: (window: OSWindow) => void;
  onClose: (window: OSWindow) => void;
}

export interface TopbarButtonContruct {
  action: () => void;
  icon: HTMLElement;
  color: string;
  /** Only the close control takes the accent on hover. */
  isClose?: boolean;
}

export interface WindowButtonsContruct {
  isDialog?: boolean;
  close: () => void;
  maximize: (() => void) | null;
  minimize: () => void;
}
