import jpeg from "jpeg-js";
import { PNG } from "pngjs";

export interface DecodedImage {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel. */
  data: Uint8Array;
}

/**
 * Pure-JS decoders (jpeg-js, pngjs) — no native bindings, so no node-gyp
 * build step. Deliberately narrower than the upload validator: webp has no
 * mature pure-JS decoder, so it isn't accepted here even though it's fine
 * for the payment-proof upload path.
 */
export function decodeImage(buffer: Buffer, mimeType: string): DecodedImage {
  if (mimeType === "image/jpeg") {
    const { width, height, data } = jpeg.decode(buffer, { useTArray: true });
    return { width, height, data };
  }
  if (mimeType === "image/png") {
    const png = PNG.sync.read(buffer);
    return { width: png.width, height: png.height, data: png.data };
  }
  throw new Error(`Unsupported image type for local AI detection: ${mimeType}`);
}
