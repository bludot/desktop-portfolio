import type { Layer, Scheme } from "./engine";

/**
 * Wallpapers, drawn rather than photographed.
 *
 * A photograph competes with every window placed on it and has to be loaded;
 * these cost nothing, scale to any viewport, and stay quiet behind content.
 * Each carries its own dark variant, because dimming a light sky gives grey
 * sludge rather than a night sky.
 */

interface WallpaperVariant {
  /** The sky itself. */
  sky: string;
  /** Three soft bands over it, back to front. */
  ridges: [string, string, string];
  /** The glow, or "none" for a flat sky. */
  sun: string;
}

export interface Wallpaper {
  name: string;
  light: WallpaperVariant;
  dark: WallpaperVariant;
}

export const wallpapers: Record<string, Wallpaper> = {
  dawn: {
    name: "Dawn",
    light: {
      sky: "linear-gradient(180deg, #f7c6d2 0%, #f9d5cd 26%, #fae3d4 44%, #f2ddda 58%, #e6dced 100%)",
      ridges: [
        "rgba(158, 142, 184, .22)",
        "rgba(136, 118, 166, .24)",
        "rgba(116, 100, 144, .26)"
      ],
      sun: "radial-gradient(circle, rgba(255,244,232,.85), rgba(255,228,214,0) 68%)"
    },
    dark: {
      sky: "linear-gradient(180deg, #2a1f33 0%, #35243a 30%, #3d2a3c 52%, #2b2032 74%, #1b1724 100%)",
      ridges: [
        "rgba(120, 96, 152, .30)",
        "rgba(96, 76, 128, .34)",
        "rgba(72, 58, 100, .40)"
      ],
      sun: "radial-gradient(circle, rgba(255,206,180,.20), rgba(255,206,180,0) 68%)"
    }
  },
  dusk: {
    name: "Dusk",
    light: {
      sky: "linear-gradient(180deg, #cfd6ee 0%, #dcd6ea 28%, #e8d8e2 52%, #efdcd9 74%, #e4dced 100%)",
      ridges: [
        "rgba(126, 132, 176, .22)",
        "rgba(104, 108, 158, .24)",
        "rgba(84, 88, 136, .26)"
      ],
      sun: "radial-gradient(circle, rgba(255,238,226,.75), rgba(255,238,226,0) 68%)"
    },
    dark: {
      sky: "linear-gradient(180deg, #1d2338 0%, #262a44 32%, #2e2b46 56%, #241f34 78%, #171423 100%)",
      ridges: [
        "rgba(88, 100, 160, .30)",
        "rgba(70, 80, 136, .34)",
        "rgba(52, 60, 108, .40)"
      ],
      sun: "radial-gradient(circle, rgba(190,206,255,.16), rgba(190,206,255,0) 68%)"
    }
  },
  fog: {
    name: "Fog",
    light: {
      sky: "linear-gradient(180deg, #e4e7e3 0%, #dfe3e0 34%, #d9dfdd 60%, #d3dad9 100%)",
      ridges: [
        "rgba(126, 138, 134, .18)",
        "rgba(104, 118, 114, .20)",
        "rgba(84, 98, 96, .22)"
      ],
      sun: "none"
    },
    dark: {
      sky: "linear-gradient(180deg, #23262a 0%, #1f2226 34%, #1b1e21 62%, #16191c 100%)",
      ridges: [
        "rgba(96, 112, 108, .24)",
        "rgba(76, 92, 90, .28)",
        "rgba(58, 72, 70, .34)"
      ],
      sun: "none"
    }
  },
  ember: {
    name: "Ember",
    light: {
      sky: "linear-gradient(180deg, #f6ddc6 0%, #f3d2bd 30%, #eec7ba 56%, #e6c3c0 80%, #ddc3cd 100%)",
      ridges: [
        "rgba(178, 128, 116, .20)",
        "rgba(154, 106, 100, .22)",
        "rgba(128, 86, 84, .24)"
      ],
      sun: "radial-gradient(circle, rgba(255,232,198,.9), rgba(255,214,178,0) 68%)"
    },
    dark: {
      sky: "linear-gradient(180deg, #33221c 0%, #3b2620 32%, #38231f 58%, #2a1a1a 80%, #1c1416 100%)",
      ridges: [
        "rgba(160, 96, 76, .28)",
        "rgba(132, 76, 62, .32)",
        "rgba(104, 58, 50, .38)"
      ],
      sun: "radial-gradient(circle, rgba(255,178,120,.22), rgba(255,178,120,0) 68%)"
    }
  }
};

export const DEFAULT_WALLPAPER = "dawn";

/** Falls back rather than throwing: a stored wallpaper may no longer exist. */
export const wallpaperLayer = (id: string): Layer => {
  const key = wallpapers[id] ? id : DEFAULT_WALLPAPER;
  const paper = wallpapers[key];
  return {
    id: key,
    name: paper.name,
    tokens: (scheme: Scheme) => {
      const variant = paper[scheme];
      return {
        "--wallpaper-sky": variant.sky,
        "--wallpaper-sun": variant.sun,
        "--wallpaper-ridge-0": variant.ridges[0],
        "--wallpaper-ridge-1": variant.ridges[1],
        "--wallpaper-ridge-2": variant.ridges[2]
      };
    }
  };
};

/**
 * A picture of your own, in place of a drawn sky.
 *
 * The bands and the glow are switched off rather than left to sit on top: they
 * are there to give a flat gradient some depth, and over a photograph they just
 * read as smears.
 */
export const customWallpaperLayer = (image: string): Layer => ({
  id: "custom",
  name: "Custom",
  tokens: () => ({
    "--wallpaper-sky": `url("${image}") center / cover no-repeat`,
    "--wallpaper-sun": "none",
    "--wallpaper-ridge-0": "transparent",
    "--wallpaper-ridge-1": "transparent",
    "--wallpaper-ridge-2": "transparent"
  })
});

export const CUSTOM_WALLPAPER = "custom";
