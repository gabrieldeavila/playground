# Pincel roadmap: advanced flyers

Goal: an AI connected to Pincel can make a print-quality flyer/poster, not just
"shapes and text on a background". Ordered by impact.

## Tier 1 — biggest jump

- [ ] **Typography**
  - [x] `load_font`: Google Fonts family, font URL or local .ttf/.otf; saved in `.data/fonts` and registered on startup
  - [x] `list_fonts`
  - [x] warn when `draw_text` uses a font that isn't installed (it silently falls back)
  - [x] `letterSpacing`, `lineHeight`, outline (`stroke`/`strokeWidth`), `rotation` around the anchor
  - [x] text box: `box` wraps text to a width, `fit: "shrink"` picks the biggest size that fits, `verticalAlign`
  - [ ] gradient / image fill for text (or get it via clipping masks)
  - [ ] mixed styles in one block (spans)
  - [ ] text on a curve
- [ ] **Layer effects** (non-destructive, stored on `LayerMeta`, applied in `compositeLayer`): drop shadow, outer glow, stroke, color overlay
- [ ] **Clipping masks**: `clipped: true` shows a layer only inside the layer below (photo inside letters, texture inside shapes)
- [ ] **Editable text/shape layers**: layer keeps its content params, `edit_layer_content` re-rasterizes; double-click to edit text in the UI

## Tier 2 — design vocabulary

- [ ] Bézier paths, stars, regular polygons, arrows, dashed strokes
- [ ] Gradient fills on shapes
- [ ] Patterns/textures: halftone, dots, stripes, noise/grain
- [ ] Filters: gradient map, duotone, levels/curves, vignette, motion blur
- [ ] `place_icon` (Lucide by name, recolorable)
- [ ] `draw_qr_code`

## Tier 3 — help the AI design well

- [ ] `align_layers` / `distribute_layers` (pure math over layer bounds)
- [ ] Document presets (`a4-300dpi`, `letter`, `a5`, `ig-post`, `ig-story`) + bleed/safe-margin overlay in `render_image`
- [ ] `check_design`: text contrast (WCAG), elements outside the safe margin, text too small for print
- [ ] `export_image` to PNG/JPEG/PDF on disk at full resolution
- [ ] Flyer guidance in the MCP server instructions (hierarchy, ≤3 fonts, palette from the photo, CTA placement)

## UI follow-ups

- [ ] Font picker lists loaded fonts (`list_fonts`)
- [ ] Text tool options: letter spacing, outline, box drag

## Built-in agent (bring your own API key)

Pincel stays local and runs the agent loop itself: pick a provider, paste a key, type a request.
Vision models only — the AI must see `render_image` to check its own work.

- [x] `delivery/agent/agent-tools.ts`: `TOOLS` → OpenAI function-calling format
- [x] `domain/agent/next-agent-action.ts`: run tools / done / step limit (+ spec); old renders dropped from history (`drop-old-images.ts`)
- [x] `data/llm/openai-compatible-client.ts`: `openai` SDK with configurable `baseURL` (OpenAI, Gemini, OpenRouter, Ollama vision models)
- [x] Tool images go back as a follow-up user message with `image_url` (tool messages can't carry images)
- [x] `data/agent-settings-store.ts`: provider/model/key in `.data/agent.json`; key never sent to the browser
- [x] `delivery/http/agent-routes.ts`: `POST /api/agent/chat`, streams each step over SSE
- [x] Tested with a real OpenAI key (gpt-6.1-sol, two turns: tools, render_image, reasoning replay)
- [x] `api.openai.com` → Responses API (`openai-responses-client.ts`, stateless: `store: false` + encrypted reasoning replayed); other providers → chat completions
- [ ] Live-test a chat-completions provider (Gemini/OpenRouter/Ollama)
- [x] UI: Agent panel (top bar button): streamed steps, stop, new chat, settings (presets, model, key, reasoning)
- [x] Ctrl+C / closing the stream stops the agent on the server
- [ ] Panel transcript is lost on page reload while the server keeps the conversation (add GET /api/agent/history)
- [ ] Show token usage / cost per request
- [ ] Test `runAgentTurn` with a fake ChatClient
- [ ] One undo step per agent request
- [x] CLI: `pnpm agent "<request>"` (`--key`, `--model`, `--base-url`, `--reset`)
