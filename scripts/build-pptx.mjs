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

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HTML_PATH = join(ROOT, "public/presentation/index.html");
const ASSET_DIR = join(ROOT, "public/presentation");
const OUT_PATH = join(ROOT, "public/presentation/openclaw-talk.pptx");

// Slide dimensions: 16:9 widescreen, matches Reveal default and Google Slides.
const SLIDE_W = 13.333;
const SLIDE_H = 7.5;

// Visual constants — pulled from the existing CSS so the .pptx feels related
// to the HTML deck without trying to perfectly reproduce it.
const BG_COLOR = "111111";
const ACT_BG = "0d1117";
const TEXT_COLOR = "e8e8e8";
const MUTED = "888888";
const ACCENT = "58a6ff";
const WARN = "f97316";
const OK = "22c55e";
const FONT = "Fira Code"; // Google Slides will substitute if absent
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
      // Center the image, leaving room for title at top and caption at bottom.
      const maxW = SLIDE_W - 1.5;
      const maxH = SLIDE_H - 2.4;
      slide.addImage({
        path,
        // Use a clean alt-text label rather than the absolute path on disk.
        altText: img.src,
        x: (SLIDE_W - maxW) / 2,
        y: 1.4,
        w: maxW,
        h: maxH,
        sizing: { type: "contain", w: maxW, h: maxH },
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
          fill: { color: isHeader ? "1e2430" : "1a1a1a" },
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
      border: { type: "solid", pt: 0.5, color: "2d3340" },
      autoPage: false,
    });
  }

  // Some table slides also have a hr and a title-meta footer; capture it.
  const $meta = $section.find("p.title-meta").first();
  if ($meta.length) {
    addCaption(slide, clean($meta.text()), { y: SLIDE_H - 0.6 });
  }
  addCommonNotes(slide, notesText($, $section));
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
    h: SLIDE_H - 2.6,
    fontFace: FONT,
    fontSize: 14,
    color: TEXT_COLOR,
    fill: { color: "1a1a1a" },
    valign: "top",
    align: "left",
  });

  // Some code slides have follow-up bullet points or a closing line; capture
  // the first non-pre paragraph as a caption.
  const $followups = $section.find("p, li").not("p.caption, p.title-meta, aside *");
  if ($followups.length) {
    const lines = [];
    $followups.each((_, el) => {
      const text = clean($(el).text());
      if (text) lines.push(text);
    });
    if (lines.length) {
      slide.addText(lines.join("\n"), {
        x: 0.7,
        y: SLIDE_H - 1.5,
        w: SLIDE_W - 1.4,
        h: 1.1,
        fontFace: FONT,
        fontSize: 12,
        color: MUTED,
        valign: "top",
      });
    }
  }
  addCommonNotes(slide, notesText($, $section));
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

  $cols.each((i, col) => {
    const $col = $(col);
    const lines = [];
    $col.children().each((_, el) => {
      const $el = $(el);
      const text = clean($el.text());
      if (text) lines.push(text);
    });
    slide.addText(lines.join("\n\n"), {
      x: 0.5 + i * (colW + gap),
      y: 1.5,
      w: colW,
      h: SLIDE_H - 2.4,
      fontFace: FONT,
      fontSize: 13,
      color: TEXT_COLOR,
      valign: "top",
    });
  });

  addCommonNotes(slide, notesText($, $section));
}

function emitBlockquoteSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  addTitle(slide, title);

  const $bq = $section.find("blockquote").first();
  $bq.find("br").replaceWith("\n");
  const quote = clean($bq.text(), { keepNewlines: true });

  slide.addText(quote, {
    x: 0.8,
    y: 1.6,
    w: SLIDE_W - 1.6,
    h: 3.2,
    fontFace: FONT,
    fontSize: 18,
    color: TEXT_COLOR,
    italic: true,
    valign: "middle",
    align: "left",
  });

  // Capture any list items that follow the blockquote.
  const $items = $section.find("ul li, ol li");
  if ($items.length) {
    const lines = [];
    $items.each((_, li) => {
      const text = clean($(li).text());
      if (text) lines.push(`• ${text}`);
    });
    slide.addText(lines.join("\n"), {
      x: 0.8,
      y: 5.0,
      w: SLIDE_W - 1.6,
      h: 1.8,
      fontFace: FONT,
      fontSize: 13,
      color: TEXT_COLOR,
      valign: "top",
    });
  }
  addCommonNotes(slide, notesText($, $section));
}

function emitTextSlide(pptx, $, $section) {
  const slide = pptx.addSlide();
  addBackground(slide);
  const title = clean($section.find("h2").first().text());
  const heading1 = clean($section.find("h1").first().text());
  addTitle(slide, title || heading1);

  // Big quote (used on hook + closer slides)
  const $bq = $section.find("p.big-quote").first();
  if ($bq.length) {
    $bq.find("br").replaceWith("\n");
    const text = clean($bq.text(), { keepNewlines: true });
    slide.addText(text, {
      x: 0.8,
      y: 2.0,
      w: SLIDE_W - 1.6,
      h: 3.0,
      fontFace: FONT,
      fontSize: 22,
      color: TEXT_COLOR,
      bold: true,
      valign: "middle",
      align: "center",
    });
  }

  // Generic body paragraphs / lists
  const blocks = [];
  $section.find("p, ul, ol").each((_, el) => {
    const $el = $(el);
    if ($el.hasClass("big-quote") || $el.hasClass("caption") || $el.hasClass("title-meta")) return;
    if ($el.parents("aside.notes").length) return;
    if ($el.is("ul, ol")) {
      $el.find("li").each((_, li) => {
        const t = clean($(li).text());
        if (t) blocks.push(`• ${t}`);
      });
    } else {
      const t = clean($el.text());
      if (t) blocks.push(t);
    }
  });

  if (blocks.length && !$bq.length) {
    slide.addText(blocks.join("\n\n"), {
      x: 0.8,
      y: 1.6,
      w: SLIDE_W - 1.6,
      h: SLIDE_H - 2.6,
      fontFace: FONT,
      fontSize: 14,
      color: TEXT_COLOR,
      valign: "top",
      align: "left",
    });
  }

  // Title-meta footer (used on closer + Q&A slides)
  const $meta = $section.find("p.title-meta").first();
  if ($meta.length) {
    addCaption(slide, clean($meta.text()), { y: SLIDE_H - 0.6 });
  }
  addCommonNotes(slide, notesText($, $section));
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

  let counts = { "act-header": 0, image: 0, table: 0, code: 0, columns: 0, blockquote: 0, text: 0 };

  sections.forEach((sec, i) => {
    const $section = $(sec);
    const kind = classify($, $section);
    counts[kind]++;
    try {
      switch (kind) {
        case "act-header": emitActHeader(pptx, $, $section); break;
        case "image":      emitImageSlide(pptx, $, $section); break;
        case "table":      emitTableSlide(pptx, $, $section); break;
        case "code":       emitCodeSlide(pptx, $, $section); break;
        case "columns":    emitColumnsSlide(pptx, $, $section); break;
        case "blockquote": emitBlockquoteSlide(pptx, $, $section); break;
        default:           emitTextSlide(pptx, $, $section); break;
      }
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
