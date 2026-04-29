# PPTX export

The deck is authored in Reveal.js (`public/presentation/index.html`). To produce
an editable `.pptx` for upload to Google Drive / Google Slides, run:

```bash
npm run build:pptx
```

This reads `public/presentation/index.html`, parses each `<section>`, and emits
`public/presentation/openclaw-talk.pptx` with one slide per section.

## What ends up editable

- All slide titles, body text, captions, and table cells become real PowerPoint
  text frames (open the file, double-click any text, type — it edits).
- Speaker notes (`<aside class="notes">`) become PowerPoint speaker notes; they
  appear in Google Slides' speaker-notes panel after import.
- Embedded PNGs (chalkboard infographics, screenshots, diagrams) are placed as
  resizable images.

## Known limitations

- **Code blocks** lose syntax highlighting (Reveal uses Highlight.js / Monokai;
  Google Slides has no native equivalent). Code renders as monospace text in a
  dark-fill box.
- **Two-column layouts** (`.cols`/`.col`) are emitted as side-by-side text
  frames. Editable, but spacing may need a manual nudge per slide.
- **Fira Code** is specified as the font; Google Slides will substitute if the
  font isn't installed in your Drive account. This does not break layout.
- **File size** is dominated by the 21 embedded PNGs (~75MB total). Drive
  accepts up to 100MB for Slides import. If a future image set pushes it over,
  pre-resize the PNGs to ~1920px wide max before re-running.

## Importing to Google Slides

1. Upload `openclaw-talk.pptx` to Google Drive.
2. Right-click → Open with → Google Slides.
3. Drive auto-converts to native Google Slides format; the original `.pptx`
   stays intact.

## Iterating

Edit slides in `index.html`, then re-run `npm run build:pptx`. The script is
idempotent — same input always produces the same output. The HTML deck remains
the source of truth.
