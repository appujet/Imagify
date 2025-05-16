// deno-lint-ignore-file
import sharp from 'sharp';
import { Buffer } from "node:buffer";

type ProcessImageOptions = {
  buffer: ArrayBuffer;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
  transformations?: ((sharpInstance: sharp.Sharp) => sharp.Sharp)[];
  withMetadata?: boolean;
};

export async function processImage({
  buffer,
  format = 'jpeg',
  quality = 80,
  transformations = [],
  withMetadata = false
}: ProcessImageOptions): Promise<Buffer> {
  let sharpInstance = sharp(Buffer.from(buffer), { failOnError: false });

  // Apply all transformations
  for (const transform of transformations) {
    sharpInstance = transform(sharpInstance);
  }

  // Convert to requested format
  switch (format) {
    case 'png':
      return withMetadata
        ? sharpInstance.png({ quality, force: true }).withMetadata().toBuffer()
        : sharpInstance.png({ quality, force: true }).toBuffer();
    case 'webp':
      return withMetadata
        ? sharpInstance.webp({ quality, force: true }).withMetadata().toBuffer()
        : sharpInstance.webp({ quality, force: true }).toBuffer();
    case 'jpeg':
    default:
      return withMetadata
        ? sharpInstance.jpeg({ quality, force: true }).withMetadata().toBuffer()
        : sharpInstance.jpeg({ quality, force: true }).toBuffer();
  }
}

export async function extractMetadata(buffer: ArrayBuffer): Promise<sharp.Metadata> {
  return sharp(Buffer.from(buffer)).metadata();
}

export async function createThumbnail(
  buffer: ArrayBuffer,
  size: number = 200,
  format: 'jpeg' | 'png' | 'webp' = 'jpeg'
): Promise<Buffer> {
  return sharp(Buffer.from(buffer))
    .resize(size, size, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toFormat(format)
    .toBuffer();
}