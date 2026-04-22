import { spawn } from 'child_process';
import { describe, it } from 'bun:test';
import path from 'path';
import os from 'os';
import { ulid } from '../tools/ulid';

describe('DBCache', () => {
  it('should be able to set and get a value (or hit SQLITE_BUSY)', async () => {
    // Use unique identifiers to prevent race conditions when tests run concurrently
    const uniqueId = `${ulid()}-${process.pid}`;
    const uniquePrefix = `test-${uniqueId}`;
    const uniqueDbPath = path.join(os.tmpdir(), `test_busy-${uniqueId}.db`);
    const proms = [];

    for (let i = 0; i < 50; i++) {
      proms.push(
        new Promise<void>((resolve, reject) => {
          const child = spawn('node', [path.join(__dirname, '../tools/db-cache-busy-task.js')], {
            stdio: 'inherit',
            env: {
              ...process.env,
              TEST_DB_PREFIX: uniquePrefix,
              TEST_DB_PATH: uniqueDbPath,
            },
          });

          child.on('error', (err) => {
            if (err.message.includes('SQLITE_BUSY')) {
              reject(new Error(`Find SQLITE_BUSY: ${err.message}`));
              return;
            }
            reject(err);
          });

          child.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Child exited with code ${code}`));
              return;
            }
            resolve();
          });
        })
      );
    }

    await Promise.all(proms);
  });
});
