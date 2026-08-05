/**
 * The theme engine.
 *
 * A theme is a bag of CSS custom properties and the browser scheme it belongs
 * to. Layers — an accent, a wallpaper — contribute more properties on top,
 * given the scheme in force. The engine composes them and writes the result to
 * the root element.
 *
 * It is built this way so that adding a look is data, not code: register
 * another token set and it appears everywhere at once, because every component
 * already styles against the token names rather than against values.
 *
 * Nothing here re-styles anything. Components build their stylesheets once, in
 * their constructors, and the cascade does the rest.
 */

export type Scheme = "light" | "dark";

export type Tokens = Record<string, string>;

export interface Theme {
  id: string;
  name: string;
  scheme: Scheme;
  tokens: Tokens;
}

/**
 * A set of tokens layered over a theme. Given the scheme so that one accent can
 * carry both the rose that reads on paper and the lifted rose that reads on
 * near-black.
 */
export interface Layer {
  id: string;
  name: string;
  tokens: (scheme: Scheme) => Tokens;
}

type Listener = (theme: Theme) => void;

export class ThemeEngine {
  private registry = new Map<string, Theme>();
  private listeners: Listener[] = [];
  /** What is currently on the root element, so writes can be a diff. */
  private applied: Tokens = {};
  private current?: Theme;

  register(...themes: Theme[]): this {
    themes.forEach((theme) => this.registry.set(theme.id, theme));
    return this;
  }

  get(id: string): Theme | undefined {
    return this.registry.get(id);
  }

  list(): Theme[] {
    return [...this.registry.values()];
  }

  active(): Theme | undefined {
    return this.current;
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      }
    };
  }

  /** Compose a theme with its layers. Pure, so it can be checked directly. */
  compose(theme: Theme, layers: Layer[] = []): Tokens {
    return layers.reduce<Tokens>(
      (tokens, layer) => ({ ...tokens, ...layer.tokens(theme.scheme) }),
      { ...theme.tokens }
    );
  }

  /**
   * Put a theme on screen. Unknown ids are ignored rather than throwing: a
   * stored preference for a theme that no longer exists should fall back, not
   * take the desktop down with it.
   */
  apply(id: string, layers: Layer[] = []): Theme | undefined {
    const theme = this.registry.get(id);
    if (!theme) return undefined;

    const tokens = this.compose(theme, layers);
    this.write(tokens, theme.scheme);
    this.current = theme;
    this.listeners.forEach((l) => l(theme));
    return theme;
  }

  private write(tokens: Tokens, scheme: Scheme) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    // Only what actually changed. A theme swap touches every token; an accent
    // change touches two, and there is no reason for it to cost more.
    Object.entries(tokens).forEach(([name, value]) => {
      if (this.applied[name] !== value) root.style.setProperty(name, value);
    });
    Object.keys(this.applied).forEach((name) => {
      if (!(name in tokens)) root.style.removeProperty(name);
    });

    this.applied = tokens;
    // Lets the browser theme its own furniture: scrollbars, form controls.
    root.style.colorScheme = scheme;
    root.dataset.theme = scheme;
  }
}

const engine = new ThemeEngine();
export default engine;
