// eslint-disable-next-line import/no-unresolved
import { plugin } from 'bun';
import path from 'path';
import fs from 'node:fs';

plugin({
  name: 'did-motif-resolver-patch',
  setup(build) {
    // 解析出浏览器版本文件的绝对路径
    // __dirname 是 bun.plugin.ts 所在的目录
    const browserModulePath = path.resolve(__dirname, '../node_modules/@arcblock/did-motif/dist/did-motif.es.js');
    // 将 @arcblock/did-motif 强制指向 esm 斑斑
    build.module('@arcblock/did-motif', () => {
      return {
        contents: fs.readFileSync(browserModulePath, 'utf8'),
        loader: 'js',
      };
    });
  },
});
