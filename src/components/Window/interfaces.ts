import Desktop from "./../Desktop";
import OSWindow from "./index";

export interface IWindow {
  title: string;
  content: any;
  desktop: Desktop;
  center: boolean;
  dimensions: {
    width: number;
    height: number;
  };
  onActive: (window: OSWindow) => void;
  onClose: (window: OSWindow) => void;
}

export interface TopbarButtonContruct {
  action: () => void;
  icon: HTMLElement;
  color: string;
}
