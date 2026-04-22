/**
 * Deprecated: use ./url-path-friendly.ts instead
 */

import toLower from 'lodash/toLower';
import slugify from 'slugify';

const isValidUrl = (name: string) => {
  const regex = /[\s$*_+~.()'"!:@\\]+/g;
  return !regex.test(name);
};

const urlFriendly = (name: string, { keepSlash = true }: { keepSlash: boolean } = { keepSlash: true }): string => {
  if (!keepSlash) {
    return toLower(slugify(name.replace(/^[@./-]/, '').replace(/[@./_]/g, '-')));
  }

  return toLower(slugify(name.replace(/^[@.-]/, '').replace(/[@._]/g, '-'), { remove: /[^\w\s$*_+~.()'"!:@^/]+/g }));
};

export { isValidUrl };

export default urlFriendly;
