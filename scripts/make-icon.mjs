import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, t, data, crc]);
}

function png(width, height, getPixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
      raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function pixel(size, x, y) {
  const cx = (size - 1) / 2;
  const cy = size * 0.4;
  const r = size * 0.22;
  const tipY = size * 0.84;
  const dx = x - cx;
  const dy = y - cy;
  const inHead = dx * dx + dy * dy <= r * r;
  const t = (y - cy) / (tipY - cy);
  let inBody = false;
  if (t > 0 && t <= 1) {
    const half = r * (1 - t) * 1.02 + size * 0.01;
    inBody = Math.abs(dx) <= half;
  }
  const innerR = r * 0.42;
  const inEye = dx * dx + dy * dy <= innerR * innerR;
  const vignette = Math.min(
    1,
    Math.hypot((x - cx) / cx, (y - cx) / cx) * 0.35,
  );
  const bgR = Math.round(11 * (1 - vignette) + 6 * vignette);
  const bgG = Math.round(14 * (1 - vignette) + 8 * vignette);
  const bgB = Math.round(20 * (1 - vignette) + 12 * vignette);

  if (inEye) return [10, 132, 255, 255];
  if (inHead || inBody) {
    const shine = Math.max(0, 1 - (dy + r) / (r * 2.4));
    const v = Math.round(232 + shine * 20);
    return [v, v + 1, v + 2, 255];
  }
  return [bgR, bgG, bgB, 255];
}

const size = 180;
const buf = png(size, size, (x, y) => pixel(size, x, y));
mkdirSync("/workspace/public", { recursive: true });
writeFileSync("/workspace/public/app-icon.png", buf);
writeFileSync(
  "/workspace/src/lib/app-icon-b64.ts",
  `export const APP_ICON_PNG_BASE64 =\n  "${buf.toString("base64")}";\n`,
);
console.log("wrote public/app-icon.png", buf.length, "bytes");
