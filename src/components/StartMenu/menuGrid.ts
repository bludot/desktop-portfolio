import OSElement from "../../utils/OSElement";

class MenuGrid extends OSElement {
  text: string;
  action: () => void;
  constructor() {
    super("menugrid", "menu-grid");
    this.style = () => ({
      [this.id]: {
        flex: "1 0 auto",
        display: "flex",
        flexFlow: "column nowrap",
        zIndex: "1"
        /*width: "160px",
        height: "52px",
        padding: "10px"
        */
      }
    });
  }
}

export default MenuGrid;
