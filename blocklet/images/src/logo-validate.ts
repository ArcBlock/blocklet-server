import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import getImageType, { ImageType } from 'image-type';
import isSvg from 'is-svg';

const ASPECT_RATIO = 1 / 1;
const ASPECT_RATIO_THRESHOLD = 0.01;

type ISizeKB = number;
interface ILogoValidateOptions {
  maxSize?: ISizeKB;
  minWidth?: number;
  logoType?: ImageType[];
  extractedFilepath: string;
}
export const validateLogo = (logoName: string, options: ILogoValidateOptions) => {
  const { extractedFilepath, maxSize = 1024, minWidth = 256 } = options;
  const logoType: (ImageType | 'svg')[] = options.logoType || ['png', 'jpg', 'webp', 'svg'];
  const logoPath = path.join(extractedFilepath, logoName);
  const preLogoMessage = `The logo(${logoName})`;
  const errorMessages = [];

  if (!logoName) {
    errorMessages.push('The logo field is required in blocklet.yml.');
    return errorMessages;
  }

  if (!fs.existsSync(logoPath)) {
    errorMessages.push(`${preLogoMessage} file not found.`);
    return errorMessages;
  }

  const logoStats = fs.statSync(logoPath);
  if (maxSize && logoStats.size > maxSize * 1024) {
    errorMessages.push(
      `${preLogoMessage} size exceeds ${maxSize} KB, but got ${(logoStats.size / 1024).toFixed(2)} KB.`
    );
  }

  const isSvgFile = isSvg(fs.readFileSync(logoPath));

  if (!isSvgFile) {
    const imgType = getImageType(fs.readFileSync(logoPath));
    if (!imgType || !logoType.includes(imgType.ext)) {
      errorMessages.push(`${preLogoMessage} format is not supported, expected: [${logoType}].`);
    }

    const logoExt = path.extname(logoPath);
    if (`.${imgType?.ext}` !== logoExt && logoExt !== '.jpeg') {
      errorMessages.push(`${preLogoMessage} extension is not match the real file extension [.${imgType?.ext}].`);
    }

    const logoMeta = sizeOf(logoPath);
    const aspectRatio = logoMeta.width / logoMeta.height;
    if (logoMeta.width < minWidth || logoMeta.height < minWidth) {
      errorMessages.push(
        `${preLogoMessage} minimum size must be ${minWidth}x${minWidth}, but got ${logoMeta.width}x${logoMeta.height}.`
      );
    }
    if (Math.abs(aspectRatio - ASPECT_RATIO) > ASPECT_RATIO_THRESHOLD) {
      errorMessages.push(
        `${preLogoMessage} aspect ratio must be approximately 1:1, but got 1:${parseFloat((logoMeta.height / logoMeta.width).toFixed(2))} (${logoMeta.width}x${logoMeta.height}).`
      );
    }
  }

  return errorMessages;
};
