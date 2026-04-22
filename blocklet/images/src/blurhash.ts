import fs from 'fs';
import { Jimp } from 'jimp';
import { intToRGBA } from '@jimp/utils';
import { encode } from 'blurhash';
import getImageType from 'image-type';
import isSvg from 'is-svg';

export async function getBlurhash(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const type = getImageType(buffer);
  if (!type) {
    // Convert SVG to raster image
    if (isSvg(buffer)) {
      // return empty blurhash
      return '';
    }

    throw new Error(`File is not a valid image: ${filePath}`);
  }

  // Read image using Jimp
  const image = await Jimp.read(buffer);
  const { width, height } = image.bitmap;

  // Convert image data to RGBA array
  const pixels = new Uint8ClampedArray(width * height * 4);

  // Scan through each pixel and add to array
  image.scan(0, 0, width, height, (x, y) => {
    const pixelIndex = (y * width + x) * 4;
    const rgba = intToRGBA(image.getPixelColor(x, y));
    pixels[pixelIndex] = rgba.r;
    pixels[pixelIndex + 1] = rgba.g;
    pixels[pixelIndex + 2] = rgba.b;
    pixels[pixelIndex + 3] = rgba.a;
  });

  const blurhash = encode(pixels, width, height, 4, 4);
  return blurhash;
}
