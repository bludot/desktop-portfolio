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
        padding: "20px",
        flex: "0 1 auto",
        "&:after": {
          content: "''",
          display: "block",
          width: "64px",
          height: "64px",
          margin: "8px",
          borderRadius: "50%",
          border: "6px solid #000",
          borderColor: "#ccc transparent #ccc transparent",
          animation: "$lds-dual-ring 1.2s linear infinite",
        },
      },
    });
  }
}

export default Loader;
