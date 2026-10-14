# Pincel

A small Photoshop-style image editor whose every tool is also an API an AI can call.
Open the editor in your browser, connect an AI over MCP (or plain REST), and watch it
build an image layer by layer while you edit the same document.

## Run it

```sh
pnpm install
pnpm dev
```

- Editor: http://localhost:5300
- API: http://localhost:4300 (MCP at `/mcp`, REST at `/api/tools`)

## Connect an AI

**Claude Code** (or any client that speaks MCP Streamable HTTP):

```sh
claude mcp add --transport http pincel http://localhost:4300/mcp
```

Then ask something like *"open pincel and make a retro sunset poster with the title
SYNTHWAVE"*. The AI can call `render_image` to look at its own work (with a coordinate
grid when it needs to place things), plan text with `measure_text`, and send a whole
layout in one `batch` call.

**Any other AI or framework** — the same tools over REST:

```sh
# Tool list in Claude API tool format: [{ name, description, input_schema }]
curl localhost:4300/api/tools

# Call a tool
curl -X POST localhost:4300/api/tools/draw_ellipse \
  -H 'content-type: application/json' \
  -d '{"center":[400,300],"radiusX":120,"radiusY":120,"fill":"#fde047"}'
```

**Built-in agent (bring your own key)** — Pincel stays local and drives the model itself.
Any OpenAI-compatible API with a vision model works (OpenAI, Gemini, OpenRouter, Ollama):

```sh
pnpm dev   # in one terminal
pnpm agent --key sk-... --model gpt-6.1-sol      # saved in api/.data/agent.json
pnpm agent "make a retro sunset poster with the title SYNTHWAVE"
pnpm agent --base-url https://openrouter.ai/api/v1 --key sk-or-... --model google/gemini-2.5-flash
pnpm agent --reset "start over: a flyer for a June festival"
```

OpenAI (`api.openai.com`) goes through the Responses API, so reasoning models can call tools;
other providers use chat completions. `--reasoning low|medium|high` sets the reasoning effort.
The key never leaves your machine except to the provider you chose.

### Presets

A preset is a recipe for one kind of piece (a promo post, an event story...): canvas size,
fonts, brand colors, files used every time (the logo) and layout instructions. They live in
`api/.data/presets/<name>.json`, editable by hand:

```json
{
  "description": "Square product promo post",
  "canvas": { "width": 1080, "height": 1080, "background": "#ffe8d6" },
  "fonts": ["Anton", "Inter"],
  "colors": { "primary": "#e63946", "text": "#1d3557" },
  "assets": { "logo": "~/brand/logo.png" },
  "instructions": "Product photo centered with its white background removed, ~55% of the height. Logo top right, 40px margin. OFERTA in Anton at the top in primary..."
}
```

Or make one from the chat: build a piece you like and ask *"save this as preset story-evento"*
(`save_preset`, optionally keeping the current document as the template to start from).
Pick a preset in the agent panel, pass `--preset <name>`, or just mention it in the request.

### Batch

Same request on every image of a folder, each in a fresh conversation, results saved to `--out`:

```sh
pnpm agent --each ~/fotos --out ~/saida "remove the white background"
pnpm agent --preset promo-post --each "~/fotos/*.jpg" --out ~/posts --format jpg "Preço: R$ 49,90"
```

## Edit your own photos

- **In the editor:** click the open-image button in the top bar, or drop a photo on the
  window. The canvas takes the photo's size (huge photos are scaled to 4096 px) and the
  photo lands on a "Photo" layer.
- **With Claude:** ask *"open ~/Pictures/me.jpg in pincel and give it a warm film look"*.
  The `open_image` tool takes a local path or a URL, and Claude builds the edit as
  separate layers on top, so you can tweak or hide each step afterwards.

Blemish removal works too: *"remove the acne from this photo"* makes Claude select the
skin, detect the spots, heal them on a copy of the photo, and zoom in to check.

JPEG, PNG, WebP, GIF and AVIF work. iPhone HEIC photos don't: export them as JPEG, or
convert on macOS with `sips -s format jpeg IMG.heic --out IMG.jpg`.

## Tools

| Area      | Tools |
|-----------|-------|
| Document  | `open_image` (local path or URL), `export_image` (PNG/JPEG/WebP file at full size), `get_document` (with each layer's content bounds), `render_image` (optional coordinate grid and zoomed region), `sample_color`, `create_document`, `resize_canvas` |
| Text      | `draw_text` (position or wrapping box with `fit: "shrink"`, letter spacing, line height, outline, rotation), `measure_text`, `load_font` (Google Fonts by name, or a font file), `list_fonts` |
| Layers    | `add_layer`, `select_layer`, `update_layer` (name, visibility, opacity, blend mode), `reorder_layer`, `duplicate_layer`, `merge_down`, `stamp_visible` (flattened copy on top), `delete_layer` |
| Selection | `select_rect`, `select_ellipse`, `select_lasso`, `select_color` (magic wand), `select_layer_pixels`, `modify_selection` (all / deselect / invert / feather), `copy_selection_to_layer` (layer via copy/cut) |
| Masks     | `add_layer_mask` (from selection, reveal all, hide all), `remove_layer_mask` (discard or apply), `update_layer` `maskEnabled` |
| Drawing   | `draw_rect`, `draw_ellipse`, `draw_path`, `brush_stroke` (also eraser), `draw_gradient` |
| Filling   | `flood_fill` (paint bucket with tolerance), `fill_layer`, `clear_layer` |
| Retouch   | `find_spots` (detects blemishes, previews them circled), `heal_spots` (spot healing brush), `liquify` (push warp, e.g. a subtle smile) |
| Images    | `place_image` (local path, URL or data URI), `apply_filter`, `transform_layer` |
| Presets   | `list_presets`, `apply_preset`, `save_preset`, `delete_preset` |
| History   | `undo`, `redo` |
| Batch     | `batch`: many tool calls in one request, all-or-nothing, one undo step |

Every drawing tool, filter and clear respects the current selection, and takes
`target: "mask"` to paint on the layer's mask instead (white shows, black hides).

Filters: brightness, contrast, saturation, hue_rotate, blur, sharpen, grayscale, sepia,
invert, threshold, posterize, pixelate. Blend modes: the 16 Photoshop/CSS ones.

## Editor shortcuts

| Key | | Key | |
|-----|-|-----|-|
| `V` | Move | `B` / `E` | Brush / eraser |
| `M` / `K` | Rect / ellipse marquee | `U` / `O` / `N` | Rectangle / ellipse / line |
| `L` | Lasso | `G` / `T` | Gradient / text |
| `W` | Magic wand | `F` / `I` | Paint bucket / eyedropper |
| `⌘A` / `⌘D` / `Esc` | Select all / deselect | `⇧⌘I` | Invert selection |
| `⌘J` / `⇧⌘J` | Layer via copy / cut | `Delete` | Clear selected pixels |
| `⌘Z` / `⇧⌘Z` | Undo / redo | `X` | Swap colors |

With the selection tools, hold Shift to add, Alt to subtract, both to intersect.
Click a layer's mask thumbnail to paint on the mask.

## How it works

- **The API owns the document.** Every edit (from the AI or from the editor) is a
  command appended to a history. The image is `setup + commands`, so undo/redo just
  moves a cursor and replays. It's saved to `api/.data/document.json` and comes back
  on restart (`PINCEL_DATA_FILE` changes where).
- **Fonts** loaded with `load_font` are saved in `api/.data/fonts` (`PINCEL_FONTS_DIR`)
  and registered on startup, before the document is replayed.
- **Batches are atomic.** A `batch` runs as one uninterrupted job: other clients wait,
  it becomes a single history entry, and if any step fails nothing is kept.
- **Selections and masks are grayscale images** (white = selected/visible), so they
  can be soft, feathered, or painted with any tool. Any paint command is clipped to
  the selection by blending the before/after pixels through it.
- **Rendering is server-side** with `@napi-rs/canvas` (the standard Canvas 2D API), so
  an AI gets real pixels from `render_image` without a browser open.
- **The editor is a client of the same tools.** Mouse gestures become the exact tool
  calls an AI would make (`brush_stroke`, `draw_rect`, ...). Server-Sent Events tell
  it to redraw whenever anyone edits.
- **Each tool is defined once** (`api/src/delivery/tools/`) with a zod schema and
  exposed both as MCP and REST.
- The API only listens on 127.0.0.1 and rejects requests addressed to other hosts.

```
api/src/
  domain/    document model, commands, painting, pixel filters, history (pure, tested)
  data/      document engine, rendering, persistence, image download
  delivery/  tools (shared), mcp/, http/
ui/src/editor/
  domain/    gestures → tool calls, coordinates (pure, tested)
  api/       REST + SSE client
  hooks/     state and effects
  components/
```

## Tests

```sh
pnpm test
pnpm typecheck
```
