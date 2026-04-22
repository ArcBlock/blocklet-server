// This polyfill is required for open-graph generator to work
const fetch = require('node-fetch');

const { Headers, Request, Response } = fetch;

if (!global.fetch) {
  global.fetch = fetch;
  global.Headers = Headers;
  global.Request = Request;
  global.Response = Response;
}
