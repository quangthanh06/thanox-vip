export async function fileToIconDataUrl(file: File, size = 512): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("not-image");
  }
  const bmp = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bmp.close();
    throw new Error("no-canvas");
  }
  const scale = Math.max(size / bmp.width, size / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  ctx.fillStyle = "#111113";
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bmp, (size - w) / 2, (size - h) / 2, w, h);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}
