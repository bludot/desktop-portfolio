class Settings {
  bootScreenImage: string = "/assets/boot_screen.png";

  async setBootScreenImage(image: string) {
    this.bootScreenImage = image;
  }

  getSetting(name: string) {}
}

const settings = new Settings()

export default settings;
