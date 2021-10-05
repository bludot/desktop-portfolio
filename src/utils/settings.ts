import { blurImage } from "./blurimage";
class Settings {
  desktopImage: {
    original: string;
    blurred60: string;
    blurred30: string;
  } = {
    original: "https://i.imgur.com/DELma5R.jpg",
    blurred60: null,
    blurred30: null
  };
  constructor() {}
  async setDesktopImage(image) {
    this.desktopImage.blurred30 = await blurImage(image, 30);
    this.desktopImage.blurred60 = await blurImage(image, 60);
    this.desktopImage.original = image;
  }
  getDesktopImage() {
    return this.desktopImage;
  }
}

const settings = new Settings()

export default settings;
