import { blurImage } from "./blurimage";
class Settings {
  desktopImage: {
    original: string;
    blurred60: string | null;
    blurred30: string | null;
  } = {
    original: "/assets/desktop_background.png",
    blurred60: null,
    blurred30: null
  };
  bootScreenImage: string = "/assets/boot_screen.png";
  constructor() {}
  async setDesktopImage(image: string) {
    this.desktopImage.original = image;
    this.desktopImage.blurred30 = await blurImage(image, 30);
    this.desktopImage.blurred60 = await blurImage(image, 60);
  }
  async setBootScreenImage(image: string) {
    this.bootScreenImage = image;
  }
  getDesktopImage() {
    return this.desktopImage;
  }
  getSetting(name: string) {

  }
}

const settings = new Settings()

export default settings;
