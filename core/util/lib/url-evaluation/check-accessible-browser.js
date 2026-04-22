// requests returning 4xx/5xx are considered accessible = true
// (script-tag-based detection would treat 404 responses as accessible = false)
// TODO: there is a Mixed Content issue
module.exports = async (url, timeout = 5000) => {
  let timer;
  try {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeout);
    // eslint-disable-next-line no-undef
    await fetch(url, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
    return true;
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
};
