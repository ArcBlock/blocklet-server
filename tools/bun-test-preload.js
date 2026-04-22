import path from 'path';
import os from 'os';
import fs from 'fs';
import { mock } from 'bun:test';

import { ReadableStream, WritableStream } from 'stream/web';

import './bun-dom-preload';

// 修复 Bun 的 stream 不兼容的问题
// 修复 core/blocklet-services/api/libs/email.js 文件中 render 函数报错问题
// ReadableStream pipeTo requires a WritableStream
globalThis.ReadableStream = ReadableStream;
globalThis.WritableStream = WritableStream;

globalThis.mockRestore = () => {
  mock.restore();
  Object.keys(require.cache).forEach((key) => delete require.cache[key]);
};

/* eslint no-console: "off" */
// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'test';
process.env.NODE_ENV = 'test';
process.env.PUBLIC_URL = '';
process.env.DEBUG = '@arcblock/*,-@arcblock/did,-@ocap/proto';
// process.env.DEBUG = '@abtnode/*,@arcblock/*,-@arcblock/did,-@abtnode/timemachine,-@ocap/proto';
process.env.ABT_NODE_HOME = path.join(os.homedir(), '.arcblock');
process.env.ABT_NODE_CONFIG_FILE = path.join(process.env.ABT_NODE_HOME, 'blocklet.ini');
process.env.PM2_HOME = path.join(process.env.ABT_NODE_HOME, 'abtnode-test');
process.env.ABT_NODE_UPDATER_PORT = 40405;
process.env.ABT_NODE_SERVICE_PORT = 40406;
process.env.ABT_NODE_VERSION = '1.16.33';
process.env.WITH_SK = '';
process.env.BLOCKLET_DID = 'blocklet-did';
process.env.BLOCKLET_REAL_DID = 'blocklet-component-did';
process.env.BLOCKLET_APP_SK =
  '0xf72e5f50c09378cb91e25a49d67bedfad43e2cab986ef0ec1d73910d2e8892935b6d41bf06eaedee4d281ce6e318d745fe559cc17da4363bdf9ea1b88579c9fe';
// 将 ABT_NODE_HOST 置为空，避免本地的环境变量污染测试
process.env.ABT_NODE_HOST = '';

try {
  fs.rmSync(path.join(process.env.PM2_HOME, 'server-preferred-ports.json'), { recursive: true });
} catch {
  //
}

process.env.BLOCKLET_DATA_DIR = 'tmp';

// // 捕获未处理的 Promise 拒绝，抛出错误堆栈
process.on('unhandledRejection', (reason, promise) => {
  console.error('未捕获的 Promise 拒绝:', reason);
  console.error('Promise:', promise);
  if (reason instanceof Error) {
    console.error('错误堆栈:', reason.stack);
  }
  // 在测试环境中，让进程退出以便测试框架能够捕获错误
  process.exit(1);
});

globalThis.processEnv = { ...process.env };

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  console.error('错误堆栈:', error.stack);
  process.exit(1);
});
