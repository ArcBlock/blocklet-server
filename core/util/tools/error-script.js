async function errorScript(timeout = 500) {
  // eslint-disable-next-line no-promise-executor-return
  await new Promise((res) => setTimeout(res, timeout));
  throw new Error('error script');
}

errorScript();
