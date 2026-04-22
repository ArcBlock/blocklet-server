import fs from 'fs';
import path from 'path';
import sizeOf from 'image-size';
import getImageType from 'image-type';
import isSvg from 'is-svg';
import { ordinalSuffix } from './ordinal-suffix';

const ASPECT_RATIO = 16 / 9;
const ASPECT_RATIO_THRESHOLD = 0.05;

type ISizeMB = number;

interface IScreenshotValidateOptions {
  extractedFilepath: string;
  minCount?: number;
  maxCount?: number;
  maxSize?: ISizeMB;
  minWidth?: number;
  minHeight?: number;
}
export const validateScreenshots = (screenshots: string[], options: IScreenshotValidateOptions) => {
  const { extractedFilepath, minCount, maxCount, maxSize, minWidth, minHeight } = options;
  const errorMessages = [];
  const screenshotList: string[] = [];

  screenshots.forEach((screenshot, index) => {
    if (screenshotList.includes(screenshot)) {
      errorMessages.push(
        `The ${ordinalSuffix(index + 1)} screenshot(${screenshot}) is duplicated with the ${ordinalSuffix(screenshotList.indexOf(screenshot) + 1)} screenshot.`
      );
    } else {
      screenshotList.push(screenshot);
    }
  });

  if (minCount && screenshotList.length < minCount) {
    errorMessages.unshift(`At least ${minCount} screenshots are required, but just got ${screenshotList.length}.`);
  } else if (maxCount && screenshotList.length > maxCount) {
    errorMessages.unshift(`At most ${maxCount} screenshots are supported, but just got ${screenshotList.length}.`);
  }

  const asyncErrors: Record<string, string[]> = {};
  screenshotList.forEach((screenshot, index) => {
    const screenshotsPath = path.join(extractedFilepath, 'screenshots', screenshot);
    const preMessage = `The ${ordinalSuffix(index + 1)}[${screenshot}] screenshot`;
    asyncErrors[screenshot] = [];
    if (!fs.existsSync(screenshotsPath)) {
      asyncErrors[screenshot].push(`${preMessage} file not found.`);
      return;
    }
    const screenshotsStats = fs.statSync(screenshotsPath);
    if (maxSize && screenshotsStats.size > maxSize * 1024 * 1024) {
      asyncErrors[screenshot].push(
        `${preMessage} size exceeds ${maxSize} MB, but got ${(screenshotsStats.size / 1024 / 1024).toFixed(2)} MB.`
      );
    }

    const isSvgFile = isSvg(fs.readFileSync(screenshotsPath));
    if (!isSvgFile) {
      const imgType = getImageType(fs.readFileSync(screenshotsPath));
      if (!imgType) {
        asyncErrors[screenshot].push(`${preMessage} is not a valid image file.`);
        return;
      }

      const screenshotExt = path.extname(screenshotsPath);
      if (`.${imgType.ext}` !== screenshotExt && screenshotExt !== '.jpeg') {
        asyncErrors[screenshot].push(`${preMessage} extension is not match the real file extension [.${imgType.ext}].`);
      }

      const imageMeta = sizeOf(screenshotsPath);
      const aspectRatio = imageMeta.width / imageMeta.height;
      const width = minWidth || (minHeight && Math.round(minHeight * ASPECT_RATIO));
      const height = minHeight || (width && Math.round(width / ASPECT_RATIO));
      if (imageMeta.width < width || imageMeta.height < height) {
        asyncErrors[screenshot].push(
          `${preMessage} minimum size must be ${width}x${height}, but got ${imageMeta.width}x${imageMeta.height}.`
        );
      }
      if (Math.abs(aspectRatio - ASPECT_RATIO) > ASPECT_RATIO_THRESHOLD) {
        asyncErrors[screenshot].push(
          `${preMessage} aspect ratio must be approximately 16:9, but got 16:${parseFloat((imageMeta.height / (imageMeta.width / 16)).toFixed(2))} (${imageMeta.width}x${imageMeta.height}).`
        );
      }
    }
  });

  screenshotList.forEach((screenshot) => {
    if (asyncErrors[screenshot].length) {
      errorMessages.push(...asyncErrors[screenshot]);
    }
  });
  return errorMessages;
};
