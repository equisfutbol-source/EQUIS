// Normalizes every image in /public: fixes non-standard color profiles and
// caps oversized dimensions, so nothing in the app ever ships a multi-tens-
// of-megabytes source photo that stalls on first load.
//
// Color: photos exported from phones (especially iPhone HDR shots) are often
// tagged with a Display P3 / HDR (SMPTE ST 2084 PQ) profile instead of plain
// sRGB. Browsers and image pipelines that don't fully color-manage that tag
// can render the photo washed-out, dull, or "smokey" compared to how it
// actually looks.
//
// Size: phone photos commonly come in at 3000-4000px per side and tens of
// megabytes. Next.js's image optimizer still has to decode the full source
// on first request before it can produce a smaller derivative, so an
// oversized source can visibly stall the very first load of a page even
// though every subsequent request is served from cache. Nothing in this app
// ever displays an image wider than ~1920px, so any source larger than that
// is pure waste — it gets capped down here instead.
//
// This runs automatically before `dev` and `build` so any new file dropped
// into /public gets normalized without anyone having to remember to do it.

import { readdir, stat, rename } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const PUBLIC_DIR = path.resolve(process.cwd(), "public");
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);
const NON_SRGB_MARKERS = ["P3", "2084", "PQ", "REC2020", "ADOBERGB", "HDR"];
const MAX_DIMENSION = 2000;

async function listImageFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listImageFiles(fullPath)));
    } else if (IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

// Strip everything except plain letters/digits, keeping only characters at or
// above "0" (charCode 48) in the printable ASCII range. ICC "mluc" text tags
// are UTF-16BE, which decodes via latin1 as a control byte before every real
// character (e.g. a null byte before "D", another before "i", and so on), so
// a simple whitespace-only regex strip misses them — this filters by charCode
// directly instead of relying on a regex escape for those control bytes.
function stripToAlphanumeric(text) {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const isDigit = code >= 48 && code <= 57;
    const isUpperLetter = code >= 65 && code <= 90;
    if (isDigit || isUpperLetter) {
      result += text[i];
    }
  }
  return result;
}

function hasNonStandardProfile(iccBuffer) {
  if (!iccBuffer) return false;
  const text = stripToAlphanumeric(iccBuffer.toString("latin1").toUpperCase());
  return NON_SRGB_MARKERS.some((marker) => text.includes(marker));
}

async function normalizeImage(filePath) {
  const metadata = await sharp(filePath).metadata();
  const isPng = path.extname(filePath).toLowerCase() === ".png";

  const needsColorFix = hasNonStandardProfile(metadata.icc);
  const needsResize =
    (metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION;

  if (!needsColorFix && !needsResize) {
    return { filePath, converted: false };
  }

  const beforeSize = (await stat(filePath)).size;
  let pipeline = sharp(filePath).toColorspace("srgb").withMetadata({ icc: "srgb" });

  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const output = isPng
    ? await pipeline.png({ compressionLevel: 9 }).toBuffer()
    : await pipeline.jpeg({ quality: 90, mozjpeg: true }).toBuffer();

  const tmpPath = `${filePath}.tmp`;
  await sharp(output).toFile(tmpPath);
  await rename(tmpPath, filePath);

  const afterSize = (await stat(filePath)).size;
  const reasons = [needsColorFix && "color", needsResize && "size"].filter(Boolean).join("+");
  return { filePath, converted: true, beforeSize, afterSize, reasons };
}

async function main() {
  let files;
  try {
    files = await listImageFiles(PUBLIC_DIR);
  } catch {
    return; // no public dir yet, nothing to do
  }

  const results = await Promise.all(files.map(normalizeImage));
  const converted = results.filter((r) => r.converted);

  if (converted.length > 0) {
    console.log(`[normalize-image-colors] Normalized ${converted.length} image(s):`);
    for (const r of converted) {
      const before = (r.beforeSize / 1024 / 1024).toFixed(1);
      const after = (r.afterSize / 1024 / 1024).toFixed(1);
      console.log(
        `  - ${path.relative(PUBLIC_DIR, r.filePath)} [${r.reasons}] ${before}MB → ${after}MB`
      );
    }
  }
}

main().catch((error) => {
  console.error("[normalize-image-colors] Failed:", error);
  process.exitCode = 1;
});
