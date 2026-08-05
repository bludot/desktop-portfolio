import OSElement from "../../utils/OSElement";
import { getSupport } from "./../../utils/support";

const support = getSupport();
class WindowBlur extends OSElement {
  blurredImage?: string;
  blur: number = 30;
  radius: number = 8;
  constructor(blur: number, radius: number) {
    super("Windowblur", "window-blur");
    this.blur = blur;
    this.radius = radius;
    this.style = () => ({
      [this.id]: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        borderRadius: `${this.radius}px`,
        backdropFilter: "blur(30px) saturate(1.45)",
        WebkitBackdropFilter: "blur(30px) saturate(1.45)",
        // Where backdrop-filter is unsupported, a flat translucent fill is
        // enough now that the desktop behind it is a soft gradient rather than
        // a photograph. The old fallback painted a pre-blurred copy of the
        // wallpaper, which is why the wallpaper had to be stack-blurred on a
        // canvas twice during boot.
        ...(support.css.backdropFilter
          ? {}
          : { background: "rgba(255,255,255,.62)" })
      }
    });
  }
}

/*
class WindowBlur extends OSElement {
  constructor() {
    super("Windowblur", "window-blur");
    this.style = () => ({
      [this.id]: {
        ...(!support.css.backdropFilter && {
          "&:before": {
            content: "''",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            filter: "blur(35px)",
            backgroundPosition: "center",
            background:
              "url(https://images.pexels.com/photos/15382/pexels-photo.jpg?auto=compress&cs=tinysrgb&h=750&w=1260) fixed",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            margin: "-999px"
          }
        }),
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backdropFilter: "blur(35px)"
      }
    });
  }
}
*/
export default WindowBlur;
