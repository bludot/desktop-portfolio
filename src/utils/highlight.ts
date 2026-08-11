import { job } from "../processes/jobs";

/**
 * Syntax highlighting for the file viewer — the half that needs a document.
 *
 * Which language a file is in, and how to turn a token tree into elements. The
 * grammars and the walk over the source are not here: they live in the
 * `highlight` job, on the thread that runs it, which is where the 73KB of
 * highlight.js goes too.
 *
 * Every node is built with `createElement` and `textContent`, so highlighted
 * source never reaches `innerHTML` — the file being displayed is somebody's
 * repository, and the safest way to render text as text is to never turn it
 * into markup at all.
 */

/** Extension to language. Anything unlisted is shown as plain text. */
const BY_EXTENSION: Record<string, string> = {
  bash: "bash",
  css: "css",
  go: "go",
  htm: "xml",
  html: "xml",
  ini: "ini",
  js: "javascript",
  json: "json",
  jsx: "javascript",
  cjs: "javascript",
  mjs: "javascript",
  md: "markdown",
  mdx: "markdown",
  py: "python",
  rs: "rust",
  scss: "css",
  sh: "bash",
  sql: "sql",
  svg: "xml",
  toml: "ini",
  ts: "typescript",
  tsx: "typescript",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  zsh: "bash"
};

/** Files whose name is the whole clue, with no extension to read. */
const BY_NAME: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  ".gitignore": "bash",
  ".dockerignore": "bash",
  ".env": "bash"
};

export function languageFor(fileName: string): string | undefined {
  const name = fileName.toLowerCase();
  if (BY_NAME[name]) return BY_NAME[name];

  const dot = name.lastIndexOf(".");
  if (dot <= 0) return undefined;
  return BY_EXTENSION[name.slice(dot + 1)];
}

/**
 * highlight.js emits many token names; they are grouped here into the seven
 * the theme actually defines. Anything not listed is left in the body colour,
 * which is the right default — most of a file is not a keyword.
 */
const GROUPS: Record<string, string> = {
  comment: "comment",
  quote: "comment",
  string: "string",
  regexp: "string",
  "meta-string": "string",
  subst: "string",
  char: "string",
  keyword: "keyword",
  literal: "keyword",
  built_in: "keyword",
  operator: "keyword",
  number: "number",
  title: "name",
  "title.function": "name",
  "title.class": "name",
  name: "name",
  attr: "name",
  attribute: "name",
  property: "name",
  variable: "name",
  selector_tag: "name",
  tag: "type",
  type: "type",
  "class.title": "type",
  params: "type",
  meta: "meta",
  doctag: "meta",
  symbol: "meta",
  "meta.keyword": "meta"
};

interface HastNode {
  type: string;
  value?: string;
  tagName?: string;
  properties?: { className?: string[] };
  children?: HastNode[];
}

/** The token group a node belongs to, or nothing. */
function groupOf(node: HastNode): string | undefined {
  const names = node.properties?.className ?? [];
  for (const raw of names) {
    const name = raw.startsWith("hljs-") ? raw.slice(5) : raw;
    if (GROUPS[name]) return GROUPS[name];
  }
  return undefined;
}

function build(nodes: HastNode[], into: Node, inherited?: string) {
  nodes.forEach((node) => {
    if (node.type === "text") {
      // textContent, never innerHTML: source is displayed, not interpreted.
      into.appendChild(document.createTextNode(node.value ?? ""));
      return;
    }
    if (node.type !== "element") return;

    const group = groupOf(node) ?? inherited;
    const span = document.createElement("span");
    if (group) span.className = `tok-${group}`;

    build(node.children ?? [], span, group);
    into.appendChild(span);
  });
}

/**
 * A token tree, as DOM nodes — the half of highlighting that needs a document.
 *
 * Takes the tree rather than the source because the walk that produces it lives
 * on the jobs thread now; this side only ever turns objects into elements. No
 * tree, for an unknown language or a grammar that threw, means plain text:
 * unhighlighted code is a small loss, a broken window is not.
 */
export function fromTokens(
  tree: HastNode | undefined,
  code: string
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  if (!tree) {
    fragment.appendChild(document.createTextNode(code));
    return fragment;
  }
  build(tree.children ?? [], fragment);
  return fragment;
}

/**
 * Highlighted source, with the tokenising done on another thread.
 *
 * Only the walk over the source travels. The nodes are built here, because
 * building them needs `document`; what comes back is a hast tree, which is
 * plain objects and strings and so crosses the boundary unchanged. That it
 * clones for nothing is the reason this split is worth making.
 *
 * The grammars live on that side only. They are 73KB of the download, they are
 * needed the moment somebody opens a file and never before, and keeping a copy
 * here for a synchronous fallback would have meant shipping them twice — which
 * is exactly what the first version of this did.
 *
 * Every failure ends in plain text: no `Worker` in this environment, a language
 * nobody registered, a grammar that threw, a process somebody killed from the
 * table mid-call. The file opens either way. The thread is a way of not
 * stalling, not a dependency.
 */
export async function highlighted(
  code: string,
  fileName: string,
  signal?: AbortSignal
): Promise<DocumentFragment> {
  const language = languageFor(fileName);
  if (!language) return fromTokens(undefined, code);

  try {
    const tree = await job("highlight").call<HastNode | undefined>(
      "tokens",
      [language, code],
      { signal }
    );
    return fromTokens(tree, code);
  } catch (error) {
    // A cancelled call is the caller's own doing and belongs to them.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    return fromTokens(undefined, code);
  }
}

export default highlighted;
