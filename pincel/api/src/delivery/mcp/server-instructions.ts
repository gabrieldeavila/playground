/** Sent to MCP clients on connect so the model knows how the editor thinks. */
export const SERVER_INSTRUCTIONS = `Pincel is a layer-based image editor (like a small Photoshop).
- To edit someone's photo, open_image it (local path or URL); it becomes the "Photo" layer of a new document.
- One document is open. Coordinates are canvas pixels, origin top-left. Call get_document first to learn its size, its layers and where each layer's content is (bounds).
- Layers are listed bottom to top. Drawing tools target the active layer unless you pass layerId; add_layer creates a layer and makes it active.
- Put separate elements (background, shapes, text, photos) on separate layers so they can be adjusted later with update_layer, transform_layer and apply_filter.
- Prefer batch: send a whole group of edits (e.g. one element or a full layout) in a single call. It is all-or-nothing and one undo step.
- Selections (select_rect, select_ellipse, select_lasso, select_color = magic wand, select_layer_pixels) limit every edit to the selected area until you deselect with modify_selection. get_document shows the current selection.
- To cut a shape out of something, prefer layer masks over erasing: add_layer_mask (from a selection or reveal_all), then paint on it with target:"mask" (black hides, white shows). copy_selection_to_layer lifts a selected object onto its own layer.
- Plan text with measure_text before drawing it, so it is centered and fits. For headlines, prefer draw_text with a box and fit:"shrink": it wraps and sizes the text to fill the area.
- Typography makes or breaks posters and flyers: load_font a Google Fonts display face for headlines (e.g. "Bebas Neue", "Anton", "Playfair Display") and a clean family for body text (e.g. "Montserrat", "Inter"); 2-3 families at most. Use letterSpacing on small caps lines, lineHeight ~0.9 for stacked headlines, and an outline (stroke) or a dark shape behind text that sits on a busy image. draw_text warns when a font isn't installed.
- Call render_image to see the result; check your work after each batch. Use grid=true when you need coordinates, and region to zoom in.
- Photo edits: keep the Photo layer intact and build on top (duplicate it before filtering, gradient/fill layers in overlay, soft-light or color modes for grading, masks to limit an effect to part of the image).
- Skin retouching (acne, blemishes, dust): duplicate the photo layer, select the skin (lasso around it, subtract lips/eyes), run find_spots with preview to check what it found, then heal_spots. Zoom in with render_image region to fix leftovers by hand.
- Reshaping (a subtle smile, slimming): liquify with small pushes on a duplicate layer (stamp_visible first when the look is built from several layers), checking zoomed renders between passes. It only moves pixels; say so if a request needs new detail (an open smile with teeth).
- A person may be editing the same document in the browser at the same time. undo reverts the latest edit by anyone.`;
