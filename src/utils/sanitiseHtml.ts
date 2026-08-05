/**
 * Make third-party HTML safe to put in the page.
 *
 * The Projects window shows READMEs, which GitHub renders to HTML for us.
 * GitHub sanitises its own output, but this is still somebody else's markup
 * arriving over the network and being handed to `innerHTML`, so it gets checked
 * here too rather than trusted. An allowlist, not a blocklist: anything not
 * named is removed, so a tag or attribute nobody thought of is safe by default
 * instead of dangerous by default.
 *
 * Relative URLs are resolved as GitHub would resolve them, because a README's
 * images and links are written relative to the repository and would otherwise
 * point at this desktop.
 */

const ALLOWED_TAGS = new Set([
  "a", "b", "blockquote", "br", "code", "dd", "del", "details", "div", "dl",
  "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "kbd",
  "li", "ol", "p", "pre", "samp", "span", "strong", "sub", "summary", "sup",
  "table", "tbody", "td", "th", "thead", "tr", "ul", "var"
]);

/**
 * Dropped with everything inside them. The rest of the unknown tags are
 * unwrapped instead, which keeps their text.
 */
const DROP_ENTIRELY = new Set([
  "script", "style", "iframe", "object", "embed", "form", "input", "button",
  "select", "textarea", "link", "meta", "base", "svg", "math", "template",
  "noscript", "audio", "video", "canvas"
]);

const ALLOWED_ATTRS = new Set([
  "href", "src", "alt", "title", "align", "width", "height", "colspan",
  "rowspan", "start", "dir", "lang"
]);

/** A leading scheme, if the URL has one at all. */
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/**
 * Judged by scheme rather than by prefix. A README's URLs are mostly relative —
 * `resources/logo.png` — and those carry no scheme, so they cannot name a
 * dangerous one; they are resolved against the repository below.
 */
const isSafeUrl = (value: string, forImage: boolean): boolean => {
  const url = value.trim();
  const scheme = SCHEME.exec(url);
  // Relative, #anchor, or //host: no scheme to abuse.
  if (!scheme) return true;

  const name = scheme[1].toLowerCase();
  if (name === "http" || name === "https" || name === "mailto") return true;
  // An image may be inlined; a link may not, or data: becomes a payload.
  return forImage && /^data:image\//i.test(url);
};

export interface SanitiseOptions {
  /** Where relative URLs point, e.g. a repository's raw file root. */
  imageBase?: string;
  /** Where relative links point, e.g. a repository's file browser. */
  linkBase?: string;
}

const resolve = (url: string, base?: string): string => {
  if (!base) return url;
  if (/^[a-z]+:/i.test(url) || url.startsWith("//") || url.startsWith("#")) {
    return url;
  }
  return base.replace(/\/$/, "") + "/" + url.replace(/^\.?\//, "");
};

export function sanitiseHtml(html: string, options: SanitiseOptions = {}): string {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Element) => {
    // Snapshot: the list is edited as we go.
    [...node.children].forEach((child) => {
      const tag = child.tagName.toLowerCase();

      if (DROP_ENTIRELY.has(tag)) {
        child.remove();
        return;
      }

      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap rather than drop, so the words survive a tag we do not know.
        walk(child);
        child.replaceWith(...child.childNodes);
        return;
      }

      [...child.attributes].forEach((attr) => {
        const name = attr.name.toLowerCase();

        // Covers onclick, onerror, and every other handler in one rule.
        if (name.startsWith("on") || !ALLOWED_ATTRS.has(name)) {
          child.removeAttribute(attr.name);
          return;
        }

        if (name === "href" || name === "src") {
          const forImage = tag === "img";
          if (!isSafeUrl(attr.value, forImage)) {
            child.removeAttribute(attr.name);
            return;
          }
          child.setAttribute(
            attr.name,
            resolve(attr.value, forImage ? options.imageBase : options.linkBase)
          );
        }
      });

      // Every link leaves this desktop, and must not be able to reach back.
      if (tag === "a" && child.getAttribute("href")) {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }

      walk(child);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

export default sanitiseHtml;
