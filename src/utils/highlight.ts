import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import go from "highlight.js/lib/languages/go";
import ini from "highlight.js/lib/languages/ini";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import makefile from "highlight.js/lib/languages/makefile";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";

/**
 * Syntax highlighting for the file viewer.
 *
 * lowlight is used rather than highlight.js directly because it returns a tree
 * of tokens instead of a string of HTML. Every node is then built with
 * `createElement` and `textContent`, so highlighted source never reaches
 * `innerHTML` — the file being displayed is somebody's repository, and the
 * safest way to render text as text is to never turn it into markup at all.
 *
 * Languages are registered one by one rather than pulling the whole of
 * highlight.js: this is the set that actually appears across the accounts.
 */
const lowlight = createLowlight({
  bash,
  css,
  dockerfile,
  go,
  ini,
  javascript,
  json,
  makefile,
  markdown,
  python,
  rust,
  sql,
  typescript,
  xml,
  yaml
});

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
 * Highlighted source, as DOM nodes.
 *
 * Falls back to plain text for an unknown language or a grammar that throws —
 * unhighlighted code is a small loss, a broken window is not.
 */
export function highlight(code: string, fileName: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const language = languageFor(fileName);

  if (!language || !lowlight.registered(language)) {
    fragment.appendChild(document.createTextNode(code));
    return fragment;
  }

  try {
    const tree = lowlight.highlight(language, code) as unknown as HastNode;
    build(tree.children ?? [], fragment);
  } catch {
    fragment.textContent = code;
  }

  return fragment;
}

export default highlight;
