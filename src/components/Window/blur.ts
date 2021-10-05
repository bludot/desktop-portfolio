import OSElement from "../../utils/OSElement";
import { getSupport } from "./../../utils/support";
import settings from "../../utils/settings";

const support = getSupport();
class WindowBlur extends OSElement {
  blurredImage: string;
  blur: number = 30;
  radius: number = 8;
  constructor(blur, radius) {
    super("Windowblur", "window-blur");
    this.blur = blur;
    this.radius = radius;
    this.style = () => ({
      [this.id]: {
        ...(!support.css.backdropFilter && {
          /*overflow: "hidden",
          "&::before": {
            content: "''",
            position: "absolute",
            top: "-100px",
            left: "-500px",
            right: "-100px",
            bottom: "-100px",
            
            backgroundImage: `url(${settings.getDesktopImage().original})`,
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            
            // background: "-moz-element(#desktop) no-repeat",
            filter: "blur(60px)",
            zIndex: "-1"
          }*/
          "&:before": {
            content: "''",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundPosition: "center",
            backgroundImage: `url('${
              this.blur === 30
                ? settings.getDesktopImage().blurred30
                : settings.getDesktopImage().blurred60
            }')`,
            backgroundAttachment: "fixed",
            backgroundSize: "cover",
            borderRadius: `${this.radius}px`
          },
          "&:after": {
            content: "''",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(200,200,200, .5)",
            borderRadius: `${this.radius}px`
          }
        }),
        position: "absolute",
        borderRadius: `${this.radius}px`,
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backdropFilter: "blur(35px)"
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
