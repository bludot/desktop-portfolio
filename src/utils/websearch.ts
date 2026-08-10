/**
 * Where a web search goes, for everything on the desktop that offers one.
 *
 * DuckDuckGo rather than Google because it does not need to know who asked, and
 * this is a portfolio rather than somebody's daily browser. One constant to
 * change if that is the wrong call — `https://www.google.com/search?q=` is the
 * whole of the alternative.
 *
 * It is always a tab, never a window on this desktop: both DuckDuckGo and
 * Google refuse to be framed — DuckDuckGo says so outright, with
 * `frame-ancestors 'self' https://html.duckduckgo.com` — so there is no version
 * of this that opens in here, however much one would prefer it to.
 */
export const SEARCH_URL = "https://duckduckgo.com/?q=";
export const SEARCH_NAME = "DuckDuckGo";
