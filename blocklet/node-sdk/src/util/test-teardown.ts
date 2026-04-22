// Setup blocklet environments for test
import os from 'os';
import fs from 'fs-extra';
import path from 'path';
import { parse as getBlockletMeta } from '@blocklet/meta/lib/parse';

export default function testTeardown() {
  try {
    const dir = process.cwd();
    const meta = getBlockletMeta(dir, { ensureComponentStore: false });
    const tmpDir = path.join(os.tmpdir(), meta.did);

    if (fs.existsSync(tmpDir)) {
      fs.rm(tmpDir, { recursive: true });
    }
  } catch (err) {
    console.error('Failed to tear blocklet environment for test', err);
  }
}
