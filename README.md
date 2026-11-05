# Inspiration Lib

Personal inspiration library. Save a screenshot or a page link, get an aesthetic family, keywords, an image prompt, and a site brief, then browse by family. Agents read the same library over HTTP.

## Run

Node 22.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. `npm run build` makes a production build.

## What you can do

- **Library** (`/`) is a masonry grid. The pill row filters by aesthetic family. A tile opens the detail rail.
- **Add** (`/add`) takes a dropped or chosen image, or **Webpage** to paste a URL and an optional note.
- Detail has the summary, tags, prompt, and settings, plus **Copy image prompt** and **Copy brief**. A saved link also has **Open source**.

Seed references ship with the repo, so the grid is not empty on first load.

## AI mode

The default is a deterministic heuristic. It reads the filename, your note, and any title or description it can fetch. No key is required. Treat that as `AI_MODE=stub`.

Set one of these to sort with a model instead. Keys stay in the host environment. Do not commit them.

- `OPENAI_API_KEY` calls OpenAI through the AI SDK (`gpt-4o-mini`).
- `AI_GATEWAY_API_KEY` calls the [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) OpenAI-compatible endpoint. Optional `AI_GATEWAY_BASE_URL` overrides the default `https://ai-gateway.vercel.sh/v1`. The gateway model id is `openai/gpt-4o-mini`.

If a live call fails, the item is still saved with the heuristic. The detail rail shows `Heuristic` or `GPT-4o mini` under settings.

The heuristic does not look at pixels. A descriptive filename or the note on a pasted link is what steers the family.

## Where files go

- Seed copy lives in `data/seed.json` and `public/seed`.
- New items are appended to `data/user-items.json`, and their images are stored under `data/uploads`, when that directory is writable.
- On Vercel the project disk is read-only except `/tmp`, so uploads last for the life of that instance unless `BLOB_READ_WRITE_TOKEN` is set.
- With a Blob token, images and the user index are stored in Vercel Blob.

## Agents

REST, no auth:

| Tool | Request |
| --- | --- |
| `list_items` | `GET /api/library` |
| `get_item` | `GET /api/library/:id` |
| `search_by_family` | `GET /api/library?family=editorial-fashion` |

Family slugs: `cinematic-lighting`, `hero-food`, `quiet-luxury`, `energy-movement`, `editorial-fashion`, `organic-modern`. Labels work too (`Editorial fashion`).

A tool descriptor is served at `GET /.well-known/mcp.json`, `GET /mcp`, and `GET /api/mcp`.

`POST /mcp` (and `POST /api/mcp`) speaks a small JSON-RPC subset: `initialize`, `tools/list`, `tools/call`.

```bash
curl -s http://localhost:3000/api/library?family=organic-modern
```

```bash
curl -s http://localhost:3000/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_item","arguments":{"id":"seed-vessel"}}}'
```

Point a client that can POST JSON-RPC at `https://<your-host>/mcp`, or call the REST URLs directly.

## Deploy

Import this repo on Vercel as `inspiration-lib`. Leave it public. Add `OPENAI_API_KEY` or `AI_GATEWAY_API_KEY`, and `BLOB_READ_WRITE_TOKEN`, only if you want live sorting and durable uploads.
