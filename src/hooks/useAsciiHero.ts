import { useMemo } from "react";

/** Deterministic hash from string → number */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Seeded pseudo-random number generator */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

const GLYPHS = ["·", "░", "▒", "▓", "█", "╱", "╲", "┼", "○", "●", "◦", "─", "│", "┌", "┐", "└", "┘", "△", "▽", "◇"];

export function generateAsciiArt(slug: string, cols = 48, rows = 6): string {
  const seed = hashCode(slug);
  const rand = seededRandom(seed);
  const palette = [
    GLYPHS[seed % GLYPHS.length],
    GLYPHS[(seed * 3 + 7) % GLYPHS.length],
    GLYPHS[(seed * 5 + 13) % GLYPHS.length],
    " ",
  ];

  const lines: string[] = [];
  for (let r = 0; r < rows; r++) {
    let line = "";
    for (let c = 0; c < cols; c++) {
      // Create patterns: waves, diagonals, clusters
      const wave = Math.sin((c + seed) * 0.3) * Math.cos((r + seed) * 0.5);
      const threshold = 0.3 + wave * 0.3;
      const v = rand();
      if (v > threshold) {
        line += palette[Math.floor(rand() * (palette.length - 1))];
      } else {
        line += " ";
      }
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export function useAsciiHero(slug: string) {
  return useMemo(() => generateAsciiArt(slug), [slug]);
}
