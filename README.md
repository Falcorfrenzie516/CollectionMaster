# Collection Master — Build 5.6 Theme CSS Art Fix

The screenshot from Build 5.5 confirmed that the animation layer was working,
but the realistic biome images were still not being rendered.

## What changed

Build 5.6 removes JavaScript-based background URL assignment.

Dinosaur region art is now loaded through:

`css/themes/dinosaurs.css`

That stylesheet contains direct relative URLs such as:

`../../assets/images/themes/dinosaurs/ancient-forest.jpg`

This makes the asset resolution explicit and reliable on GitHub Pages.

## Architecture stays reusable

The universal Path engine only sets:

`data-theme="dinosaurs"`

on the Path board.

A future theme can add:

- `css/themes/christmas.css`
- `css/themes/void.css`
- `css/themes/ice-age.css`

with its own assets while using the same Path engine.

## Existing behavior retained

- 54 nodes
- continuous serpentine layout
- current node auto-scroll
- future nodes locked / non-clickable
- generic node popup removed
- fog, light, particles, water, and parallax remain dynamic

## Important upload note

Upload the ENTIRE package, including:

- `css/themes/dinosaurs.css`
- `assets/images/themes/dinosaurs/`

If either folder is missing, the procedural fallback will appear again.

BUILD 5.6 confirms deployment.
