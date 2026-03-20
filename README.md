# nitro-wrangler

[![npm version](https://img.shields.io/npm/v/nitro-wrangler)](https://www.npmjs.com/package/nitro-wrangler)
[![Test](https://github.com/medz/nitro-wrangler/actions/workflows/test.yml/badge.svg)](https://github.com/medz/nitro-wrangler/actions/workflows/test.yml)
[![License](https://img.shields.io/npm/l/nitro-wrangler)](https://github.com/medz/nitro-wrangler/blob/main/LICENSE)

`nitro-wrangler` is a Nitro module that rewrites Nitro's Cloudflare server output into a builderless-style worker bundle.

It changes the final `.output/server` shape so that:

- user code is emitted as relative imports instead of being bundled into Nitro output
- Nitro runtime chunks stay in `.output/server/_libs`
- generated `wrangler.json` is rewritten with `"main": "index.mjs"` and `"no_bundle": false`

## Install

```bash
npm i nitro-wrangler
```

Also install Nitro in your app:

```bash
npm i nitro
```

## Usage

```ts
import { defineConfig } from "nitro/config";
import nitroWrangler from "nitro-wrangler";

export default defineConfig({
  preset: "cloudflare-module",
  modules: [nitroWrangler],
});
```

After `nitro build`, the worker entry in `.output/server/index.mjs` will import your app code via relative paths, and Wrangler can bundle the user graph from there.

## Local Development

Build the package:

```bash
bun run build
```

Run the example app from the playground package:

```bash
bun run --cwd playground build
bunx wrangler deploy -c playground/.output/server/wrangler.json --dry-run
```
