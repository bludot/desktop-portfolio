# desktop-portfolio
Created with CodeSandbox

## Development

Requires [Bun](https://bun.sh) 1.3.14 or later. No Node.js install is needed.

```sh
bun install     # install dependencies
bun run dev     # dev server on http://localhost:5173
bun run build   # type-check and build to dist/
bun run serve   # preview the production build
```

## Deployment

Deployed on Netlify. Build settings live in `netlify.toml`; `dist/` is generated
at build time and is not committed.
