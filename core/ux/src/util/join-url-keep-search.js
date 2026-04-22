import { joinURL } from 'ufo';

const joinUrlKeepSearch = (originalUrl, path) => {
  if (!originalUrl) {
    return '';
  }
  if (!path) {
    return originalUrl;
  }
  const url = new URL(originalUrl);
  const searchParams = new URLSearchParams(url.searchParams);
  const newPath = new URL(joinURL(url.origin, path));
  newPath.search = searchParams.toString();
  return newPath.toString();
};

export default joinUrlKeepSearch;
