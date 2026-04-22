export function replaceOrigin(originalUrl: string, newUrl: string) {
  try {
    const originalUrlObj = new URL(originalUrl);
    const newUrlObj = new URL(newUrl, originalUrlObj.origin);
    return originalUrl.replace(originalUrlObj.origin, newUrlObj.origin);
  } catch (error) {
    console.error('Invalid URL provided:', error);
    return originalUrl;
  }
}
