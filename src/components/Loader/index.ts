/**
 * .lds-dual-ring {
  display: inline-block;
  width: 80px;
  height: 80px;
}
.lds-dual-ring:after {
  content: " ";
  display: block;
  width: 64px;
  height: 64px;
  margin: 8px;
  border-radius: 50%;
  border: 6px solid #fff;
  border-color: #fff transparent #fff transparent;
  animation: lds-dual-ring 1.2s linear infinite;
}
@keyframes lds-dual-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

 */

import OSElement from "../../utils/OSElement";
import { v4 as uuidv4 } from 'uuid';

class Loader extends OSElement {
  constructor() {
    super(`Loader_${uuidv4().replace(/-/g, "")}`, "loader");
    this.style = () => ({
      "@keyframes lds-dual-ring": {
        from: {
          transform: "rotate(0deg)",
        },
        to: {
          transform: "rotate(360deg)",
        },
      },
      [this.id]: {
        display: "inline-block",
        width: "80px",
        height: "80px",
        position: "fixed",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        margin: "auto",
        marginTop: "75vh",
        "&:after": {
          content: "''",
          display: "block",
          width: "64px",
          height: "64px",
          margin: "8px",
          borderRadius: "50%",
          border: "6px solid #fff",
          borderColor: "#fff transparent #fff transparent",
          animation: "$lds-dual-ring 1.2s linear infinite",
        },
      },
    });
  }
}

export default Loader;
