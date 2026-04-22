/* eslint-disable no-console */
import '@blocklet/tracker';
import { createRoot } from 'react-dom/client';
import { register } from 'register-service-worker';
// HACK: 使用 @arcblock/graphql-playground 包需要单独导入以下代码
// eslint-disable-next-line import/no-extraneous-dependencies
import 'regenerator-runtime/runtime';

import App from './app';

const root = createRoot(document.getElementById('root'));
root.render(<App />);

const prefix = window.env && window.env.apiPrefix ? window.env.apiPrefix : '/';

const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment) {
  register(`${prefix}/service-worker.js`.replace(/\/+/g, '/'), {
    registrationOptions: { scope: prefix },
    registered() {
      console.info('Service worker has been registered.');
    },
    ready() {
      console.info('Service worker is active.');
    },
    cached() {
      console.info('Content has been cached for offline use.');
    },
    updatefound() {
      console.info('New content is downloading.');
    },
    updated() {
      console.info('New content is available; please refresh.');
    },
    offline() {
      console.info('No internet connection found. App is running in offline mode.');
    },
    error(err) {
      console.error('Error during service worker registration:', err);
    },
  });
}
