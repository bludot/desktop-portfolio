import OSElement from "../../utils/OSElement";

class ProfileImg extends OSElement {
  constructor() {
    super("menuprofileimg", "menu-profile-img");
    this.style = () => ({
      [this.id]: {
        width: "100px",
        height: "100px",
        background: `url(https://placekitten.com/100/100)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        borderRadius: "100%",
        position: "relative",
        left: 0,
        right: 0,
        margin: "0 auto",
        marginTop: "-50px"
      }
    });
  }
}

export default ProfileImg;
