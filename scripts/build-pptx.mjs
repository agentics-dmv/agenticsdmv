#!/usr/bin/env node
// Build an editable .pptx from the Reveal.js deck at public/presentation/index.html.
//
// Strategy:
//   - Parse the HTML with cheerio.
//   - For each <section>, classify the slide and emit a corresponding PPTX slide
//     using pptxgenjs primitives (text frames, images, tables).
//   - Editability is the goal — every text-bearing element becomes a real text
//     frame so Google Slides can edit it after import.
//
// Output:
//   public/presentation/openclaw-talk.pptx
//
// Run:
//   node scripts/build-pptx.mjs

import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";
import PptxGenJS from "pptxgenjs";
import { imageSize } from "image-size";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HTML_PATH = join(ROOT, "public/presentation/index.html");
const ASSET_DIR = join(ROOT, "public/presentation");
const OUT_PATH = join(ROOT, "public/presentation/openclaw-talk.pptx");

// Slide dimensions: 16:9 widescreen, matches Reveal default and Google Slides.
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

// Visual constants — light-mode whiteboard palette, matches the HTML CSS.
// BG is warm off-white (paper feel, not pure white).
const BG_COLOR = "FAFAF7";
const ACT_BG = "FAFAF7";
const ACT_CARD = "F3F1EA";    // tan card behind act-header heading
const TEXT_COLOR = "1A1A1A";
const TEXT_SOFT = "555555";
const MUTED = "888888";
const ACCENT = "1D4ED8";       // marker blue
const WARN = "DC2626";         // marker red
const OK = "16A34A";           // marker green
const RULE = "D4D4D0";
const FONT = "Fira Code";      // Google Slides will substitute if absent
const FONT_FALLBACK = "Courier New";

// --- Helpers ---------------------------------------------------------------

// Cheerio gives back text with original whitespace; squeeze for layout sanity
// but preserve newlines for blockquotes and code.
function clean(text, { keepNewlines = false } = {}) {
  if (!text) return "";
  if (keepNewlines) {
    return text
      .split("\n")
      .map((line) => line.replace(/\s+/g, " ").trim())
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  return text.replace(/\s+/g, " ").trim();
}

function notesText($, $section) {
  const $notes = $section.find("aside.notes").first();
  if (!$notes.length) return "";
  // Convert <br/> to newlines before extracting text.
  $notes.find("br").replaceWith("\n");
  return clean($notes.text(), { keepNewlines: true });
}

function imageSrc($section) {
  const $img = $section.find("img.diagram, img.screenshot").first();
  if (!$img.length) return null;
  return {
    src: $img.attr("src"),
    isScreenshot: $img.hasClass("screenshot"),
  };
}

function captionText($section) {
  const $cap = $section.find("p.caption").first();
  return $cap.length ? clean($cap.text()) : "";
}

function classify($, $section) {
  if ($section.hasClass("act-header")) return "act-header";
  if ($section.find("img.diagram, img.screenshot").length) return "image";
  if ($section.find("table").length) return "table";
  if ($section.find("pre code").length) return "code";
  if ($section.find("div.cols").length) return "columns";
  if ($section.find("blockquote").length) return "blockquote";
  return "text";
}

// --- Rich-text helpers -----------------------------------------------------
//
// Earlier versions of this file collapsed each block element into a single
// `.text()` call, which destroyed two things at once:
//   1. Line breaks between siblings (so a <ul> with three <li>s rendered as
//      one run-on line in the .pptx).
//   2. Inline color cues — <span class="warn">, <span class="ok">,
//      <span class="accent"> all became plain dark text.
//
// Result: slides that *had* content rendered as visually empty in PowerPoint.
//
// `htmlToRuns` walks a cheerio node and returns an array of pptxgenjs text
// objects — each with its own color/bold/break flags — so paragraphs, lists,
// and inline accents make it through intact.

const COLOR_CLASS = {
  warn: WARN,
  ok: OK,
  accent: ACCENT,
};

// Map a node + inherited style to one or more pptxgenjs text run objects.
// Inline elements pass style down to their children. Block elements (p, li,
// ul, ol, hr, blockquote) emit their own paragraph break via { breakLine: true }.
function nodeToRuns($, node, inheritedStyle = {}) {
  const runs = [];
  const $node = $(node);

  // Text node — emit a run with the inherited style.
  if (node.type === "text") {
    const text = node.data.replace(/\s+/g, " ");
    if (text.trim() === "") return runs;
    runs.push({ text, options: { ...inheritedStyle } });
    return runs;
  }

  if (node.type !== "tag") return runs;

  const tag = node.tagName.toLowerCase();
  const cls = ($node.attr("class") || "").split(/\s+/).filter(Boolean);
  const style = { ...inheritedStyle };

  // Apply inline style hints from class names.
  for (const c of cls) {
    if (COLOR_CLASS[c]) style.color = COLOR_CLASS[c];
  }
  if (tag === "strong" || tag === "b") style.bold = true;
  if (tag === "em" || tag === "i") style.italic = true;
  if (tag === "code") {
    style.fontFace = FONT;
    if (!style.color) style.color = ACCENT;
  }

  // <br/> → soft break inside the same paragraph.
  if (tag === "br") {
    runs.push({ text: "", options: { ...style, breakLine: true } });
    return runs;
  }

  // Walk children.
  $node.contents().each((_, child) => {
    runs.push(...nodeToRuns($, child, style));
  });

  // Block-level tags: append a hard line break after their content so the
  // next sibling starts on a new line in the PPTX.
  const blockTags = new Set(["p", "li", "div", "blockquote", "hr"]);
  if (blockTags.has(tag) && runs.length) {
    const last = runs[runs.length - 1];
    last.options = { ...last.options, breakLine: true };
  }

  return runs;
}

// Convert a cheerio selection into pptxgenjs text runs, ignoring elements
// that should never appear on the slide body (notes, captions, footers).
function elementsToRuns($, $elements, baseStyle = {}) {
  const runs = [];
  const skipSelector = "aside.notes, p.caption, p.title-meta";
  $elements.each((_, el) => {
    const $el = $(el);
    if ($el.is(skipSelector) || $el.parents("aside.notes").length) return;
    runs.push(...nodeToRuns($, el, baseStyle));
  });
  // Trim trailing breakLine on the very last run for cleaner layout.
  if (runs.length) {
    const last = runs[runs.length - 1];
    if (last.options.breakLine && !last.text) runs.pop();
    else if (last.options.breakLine) {
      last.options = { ...last.options };
      delete last.options.breakLine;
    }
  }
  return runs;
}

// --- Slide emitters --------------------------------------------------------

function addCommonNotes(slide, notes) {
  if (notes) slide.addNotes(notes);
}

function addBackground(slide, color = BG_COLOR) {
  slide.background = { color };
}

function addTitle(slide, title, { y = 0.4, color = TEXT_COLOR, fontSize = 28 } = {}) {
  if (!title) return;
  slide.addText(title, {
    x: 0.5,
    y,
    w: SLIDE_W - 1,
    h: 0.7,
    fontFace: FONT,
    fontSize,
    color,
    bold: true,
    align: "left",
  });
}

function addCaption(slide, caption, { y = SLIDE_H - 0.7 } = {}) {
  if (!caption) return;
  slide.addText(caption, {
    x: 0.5,
    y,
    w: SLIDE_W - 1,
    h: 0.4,
    fontFace: FONT,
    fontSize: 11,
    color: MUTED,
    italic: true,
    align: "center",
  });
}

function emitActHeader(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide, ACT_BG);
  const heading = clean($section.find("h2").first().text());
  const subhead = clean($section.find("h1").first().text());
  slide.addText(heading, {
    x: 0.5,
    y: 2.8,
    w: SLIDE_W - 1,
    h: 0.8,
    fontFace: FONT,
    fontSize: 22,
    color: ACCENT,
    align: "center",
  });
  slide.addText(subhead, {
    x: 0.5,
    y: 3.6,
    w: SLIDE_W - 1,
    h: 1.2,
    fontFace: FONT,
    fontSize: 44,
    color: TEXT_COLOR,
    bold: true,
    align: "center",
  });
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

// Compute a contain-fit: largest box of (imgW, imgH) that fits inside
// (slotW, slotH) preserving aspect ratio. Returns { x, y, w, h } centered
// inside the slot. This is what CSS object-fit: contain does — pptxgenjs's
// own `sizing: "contain"` was distorting some images, so we precompute.
function fitContain(imgW, imgH, slotX, slotY, slotW, slotH) {
  if (!imgW || !imgH) {
    return { x: slotX, y: slotY, w: slotW, h: slotH };
  }
  const imgRatio = imgW / imgH;
  const slotRatio = slotW / slotH;
  let w, h;
  if (imgRatio >= slotRatio) {
    // Image is wider relative to slot — fit by width, letterbox top/bottom.
    w = slotW;
    h = slotW / imgRatio;
  } else {
    // Image is taller relative to slot — fit by height, letterbox sides.
    h = slotH;
    w = slotH * imgRatio;
  }
  return {
    x: slotX + (slotW - w) / 2,
    y: slotY + (slotH - h) / 2,
    w,
    h,
  };
}

function emitImageSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const img = imageSrc($section);
  if (img && img.src) {
    const path = join(ASSET_DIR, img.src);
    if (existsSync(path)) {
      // Slot: leave 1.4" at top for title, 0.7" at bottom for caption.
      const slotX = 0.5;
      const slotY = 1.4;
      const slotW = SLIDE_W - 1.0;
      const slotH = SLIDE_H - 2.1;

      // Read native dimensions so we can fit by aspect ratio rather than
      // letting pptxgenjs's "contain" sizing stretch portrait images into
      // a horizontal slot. Falls back to filling the slot if the read fails.
      let dims = null;
      try {
        const buf = readFileSync(path);
        dims = imageSize(buf);
      } catch (err) {
        console.warn(`Could not read dimensions for ${img.src}: ${err.message}`);
      }

      const fit = fitContain(dims?.width, dims?.height, slotX, slotY, slotW, slotH);
      slide.addImage({
        path,
        altText: img.src,
        x: fit.x,
        y: fit.y,
        w: fit.w,
        h: fit.h,
      });
    } else {
      slide.addText(`[missing image: ${img.src}]`, {
        x: 1, y: 3, w: SLIDE_W - 2, h: 1,
        fontFace: FONT, fontSize: 14, color: WARN, italic: true, align: "center",
      });
    }
  }

  addCaption(slide, captionText($section));
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

function emitTableSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const $table = $section.find("table").first();
  const rows = [];
  $table.find("tr").each((_, tr) => {
    const cells = [];
    $(tr).find("th, td").each((_, cell) => {
      const $cell = $(cell);
      const isHeader = cell.tagName === "th";
      cells.push({
        text: clean($cell.text()),
        options: {
          fontFace: FONT,
          fontSize: 12,
          color: isHeader ? ACCENT : TEXT_COLOR,
          bold: isHeader,
          fill: { color: isHeader ? ACT_CARD : BG_COLOR },
          valign: "middle",
        },
      });
    });
    if (cells.length) rows.push(cells);
  });

  if (rows.length) {
    slide.addTable(rows, {
      x: 0.5,
      y: 1.5,
      w: SLIDE_W - 1,
      colW: rows[0].map(() => (SLIDE_W - 1) / rows[0].length),
      border: { type: "solid", pt: 0.5, color: RULE },
      autoPage: false,
    });
  }

  // Some table slides also have a hr and a title-meta footer; capture it.
  const $meta = $section.find("p.title-meta").first();
  if ($meta.length) {
    addCaption(slide, clean($meta.text()), { y: SLIDE_H - 0.6 });
  }
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

function emitCodeSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const $pre = $section.find("pre").first();
  // Preserve inner text including newlines.
  const code = clean($pre.text(), { keepNewlines: true });
  slide.addText(code, {
    x: 0.7,
    y: 1.5,
    w: SLIDE_W - 1.4,
    h: 3.6,
    fontFace: FONT,
    fontSize: 14,
    color: TEXT_COLOR,
    fill: { color: ACT_CARD },
    valign: "top",
    align: "left",
  });

  // Followup prose: every <p> and every <li> in the section that isn't the
  // <pre>'s code, isn't a caption/footer, and isn't inside <aside.notes>.
  // Use rich-text runs so inline accent colors survive.
  const followupSelector = "section > p, section > ul, section > ol";
  const $followups = $section
    .children("p, ul, ol, hr")
    .not("p.caption, p.title-meta");
  if ($followups.length) {
    const runs = elementsToRuns($, $followups, { fontFace: FONT, fontSize: 12, color: TEXT_SOFT });
    if (runs.length) {
      slide.addText(runs, {
        x: 0.7,
        y: 5.3,
        w: SLIDE_W - 1.4,
        h: 1.5,
        valign: "top",
        align: "left",
      });
    }
  }
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

function emitColumnsSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const $cols = $section.find("div.cols div.col");
  const colCount = $cols.length || 1;
  const gap = 0.4;
  const colW = (SLIDE_W - 1 - gap * (colCount - 1)) / colCount;
  // Reserve room at the bottom for any trailing prose outside .cols.
  const colH = SLIDE_H - 3.0;

  $cols.each((i, col) => {
    const $col = $(col);
    const runs = elementsToRuns($, $col.children(), {
      fontFace: FONT,
      fontSize: 13,
      color: TEXT_COLOR,
    });
    if (runs.length) {
      slide.addText(runs, {
        x: 0.5 + i * (colW + gap),
        y: 1.5,
        w: colW,
        h: colH,
        valign: "top",
        align: "left",
      });
    }
  });

  // Capture any siblings of <div class="cols"> — typically a closing
  // <p> tagline beneath the columns. Without this, slides like
  // "Work With the Platform" lost their punchline entirely.
  const $tail = $section.children("p, hr").not("p.caption, p.title-meta");
  if ($tail.length) {
    const runs = elementsToRuns($, $tail, {
      fontFace: FONT,
      fontSize: 12,
      color: TEXT_SOFT,
      italic: true,
    });
    if (runs.length) {
      slide.addText(runs, {
        x: 0.8,
        y: SLIDE_H - 1.4,
        w: SLIDE_W - 1.6,
        h: 1.0,
        valign: "top",
        align: "center",
      });
    }
  }

  addCommonNotes(slide, notesText($, $section));
  return slide;
}

function emitBlockquoteSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const $bq = $section.find("blockquote").first();
  const quoteRuns = elementsToRuns($, $bq.contents(), {
    fontFace: FONT,
    fontSize: 18,
    color: TEXT_COLOR,
    italic: true,
  });
  if (quoteRuns.length) {
    slide.addText(quoteRuns, {
      x: 0.8,
      y: 1.4,
      w: SLIDE_W - 1.6,
      h: 3.2,
      valign: "top",
      align: "left",
    });
  }

  // Everything that follows the blockquote at section level: <p>, <ul>, <ol>.
  // The previous version only captured list items, which left the SOUL.md
  // explanatory paragraph entirely missing in the .pptx.
  const $tail = $section
    .children("p, ul, ol, hr")
    .not("p.caption, p.title-meta");
  if ($tail.length) {
    const runs = elementsToRuns($, $tail, {
      fontFace: FONT,
      fontSize: 13,
      color: TEXT_SOFT,
    });
    if (runs.length) {
      slide.addText(runs, {
        x: 0.8,
        y: 4.8,
        w: SLIDE_W - 1.6,
        h: 2.0,
        valign: "top",
        align: "left",
      });
    }
  }
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

function emitTextSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  const heading1 = clean($section.find("h1").first().text());
  addTitle(slide, title || heading1);

  // Big quote (used on hook + closer slides) — accent spans inside need
  // their colors preserved, so we use rich runs.
  const $bq = $section.children("p.big-quote").first();
  if ($bq.length) {
    const runs = elementsToRuns($, $bq.contents(), {
      fontFace: FONT,
      fontSize: 22,
      color: TEXT_COLOR,
      bold: true,
    });
    slide.addText(runs, {
      x: 0.8,
      y: 2.0,
      w: SLIDE_W - 1.6,
      h: 3.4,
      valign: "middle",
      align: "center",
    });
  } else {
    // Generic body content: every direct-child p/ul/ol that isn't a
    // caption/footer/big-quote/note.
    const $body = $section
      .children("p, ul, ol, hr")
      .not("p.big-quote, p.caption, p.title-meta");
    if ($body.length) {
      const runs = elementsToRuns($, $body, {
        fontFace: FONT,
        fontSize: 14,
        color: TEXT_COLOR,
      });
      if (runs.length) {
        slide.addText(runs, {
          x: 0.8,
          y: 1.6,
          w: SLIDE_W - 1.6,
          h: SLIDE_H - 2.8,
          valign: "top",
          align: "left",
        });
      }
    }
  }

  // Title-meta footer (used on closer + Q&A slides)
  const $meta = $section.children("p.title-meta").first();
  if ($meta.length) {
    addCaption(slide, clean($meta.text()), { y: SLIDE_H - 0.6 });
  }
  addCommonNotes(slide, notesText($, $section));
  return slide;
}

// --- Arc position indicator ------------------------------------------------

// Walks sections in order, finds act-header markers, and returns a map
// { sectionIndex: "Act 1 · 3 / 12" } for every non-header slide inside an act.
// Slides outside any act (the title + destination, before Act 1) get no label.
function computeArcLabels($, sections) {
  const acts = [];
  let current = null;
  sections.forEach((sec, i) => {
    if ($(sec).hasClass("act-header")) {
      if (current) current.endIdx = i - 1;
      const heading = ($(sec).find("h2").first().text() || "").trim();
      current = { name: heading, startIdx: i + 1, endIdx: sections.length - 1 };
      acts.push(current);
    }
  });
  const labels = {};
  sections.forEach((sec, i) => {
    if ($(sec).hasClass("act-header")) return;
    const act = acts.find((a) => i >= a.startIdx && i <= a.endIdx);
    if (!act) return;
    const pos = i - act.startIdx + 1;
    const total = act.endIdx - act.startIdx + 1;
    labels[i] = `${act.name} · ${pos} / ${total}`;
  });
  return labels;
}

function addArcIndicator(slide, label) {
  slide.addText(label, {
    x: SLIDE_W - 2.6,
    y: 0.15,
    w: 2.4,
    h: 0.3,
    fontFace: FONT,
    fontSize: 9,
    color: MUTED,
    align: "right",
  });
}

// --- Main ------------------------------------------------------------------

function build() {
  console.log(`Reading ${HTML_PATH}`);
  const html = readFileSync(HTML_PATH, "utf8");
  const $ = load(html);

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = "Building a 24/7 AI Assistant on AWS";
  pptx.author = "Ford Prior";
  pptx.company = "RVA Hacks";

  const sections = $(".reveal .slides > section").toArray();
  console.log(`Found ${sections.length} slides`);

  // Build arc-position labels — mirrors the runtime JS in index.html.
  // Walks sections, tracks act boundaries via class="act-header", then
  // stamps every non-header slide inside an act with "Act N · k / N".
  const arcLabels = computeArcLabels($, sections);

  let counts = { "act-header": 0, image: 0, table: 0, code: 0, columns: 0, blockquote: 0, text: 0 };

  sections.forEach((sec, i) => {
    const $section = $(sec);
    const kind = classify($, $section);
    counts[kind]++;
    try {
      let slide;
      switch (kind) {
        case "act-header": slide = emitActHeader(pptx, $, $section); break;
        case "image":      slide = emitImageSlide(pptx, $, $section); break;
        case "table":      slide = emitTableSlide(pptx, $, $section); break;
        case "code":       slide = emitCodeSlide(pptx, $, $section); break;
        case "columns":    slide = emitColumnsSlide(pptx, $, $section); break;
        case "blockquote": slide = emitBlockquoteSlide(pptx, $, $section); break;
        default:           slide = emitTextSlide(pptx, $, $section); break;
      }
      // Stamp the arc indicator if we have one (slides inside an act, excl. headers).
      if (slide && arcLabels[i]) addArcIndicator(slide, arcLabels[i]);
    } catch (err) {
      console.error(`Slide ${i + 1} (${kind}) failed:`, err.message);
      throw err;
    }
  });

  console.log("Slide type counts:", counts);
  console.log(`Writing ${OUT_PATH}`);
  return pptx.writeFile({ fileName: OUT_PATH }).then((file) => {
    console.log(`Wrote ${file}`);
  });
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
