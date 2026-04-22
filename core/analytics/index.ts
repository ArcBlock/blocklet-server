/* eslint-disable @typescript-eslint/comma-dangle */
import fs from 'fs-extra';
import path from 'path';
import tar from 'tar';
import shell from 'shelljs';
import Debug from 'debug';
import { exec } from 'child_process';
import runScript from '@abtnode/util/lib/run-script';

type LogGroup = {
  did: string;
  hosts: string[];
  type: string;
  log?: string;
  result?: Record<string, number>;
};

const GOACCESS_CONFIG = path.join(__dirname, 'goaccess.conf');
const ANALYTICS_DIR = '.analytics';

const debug = Debug('@abtnode/analytics');

const runAsync = (command: string, options: Record<string, any> = {}) =>
  new Promise((resolve, reject) => {
    const startedAt = Date.now();
    exec(command, { windowsHide: true, ...options }, (err, stdout, stderr) => {
      debug('executed command', { command, time: Date.now() - startedAt, stderr });
      if (err) {
        reject(err);
      } else {
        resolve(stdout);
      }
    });
  });

export function getGoAccessBinary(): string {
  const { stdout } = shell.which('goaccess') || { stdout: '' };
  return stdout.trim();
}

export async function decompressLog(source: string, tmpDir: string): Promise<string> {
  fs.ensureDirSync(tmpDir);
  const dest = path.join(tmpDir, path.basename(source, '.gz'));
  if (fs.existsSync(dest)) {
    fs.removeSync(dest);
  }

  await tar.x({ file: source, C: tmpDir });
  return dest;
}

export function splitLogByGroup(
  filePath: string,
  dataDir: string,
  date: string,
  groups: LogGroup[]
): Promise<LogGroup[]> {
  return Promise.all(
    groups.map(async (group) => {
      if (group.type === 'server') {
        group.log = filePath;
        return group;
      }

      const groupDir = path.join(dataDir, group.did, ANALYTICS_DIR);
      fs.ensureDirSync(groupDir);

      const dest = path.join(groupDir, `${date}.log`);
      if (fs.existsSync(dest)) {
        fs.removeSync(dest);
      }

      const host = group.hosts.join('|');
      const command = `grep -E "${host}" ${filePath} | sed 's/\\/\\.well-known\\/analytics//g' > ${dest}`;
      try {
        await runAsync(command);
        group.log = dest;
      } catch (err) {
        console.error('Failed to split log', { command, group, err });
      }
      return group;
    })
  );
}

export async function processLogForGroup(dataDir: string, date: string, group: LogGroup): Promise<LogGroup> {
  try {
    const groupDir = path.join(dataDir, group.did, ANALYTICS_DIR);
    fs.ensureDirSync(groupDir);

    if (!group.log) {
      return group;
    }

    if (!fs.existsSync(group.log)) {
      return group;
    }

    if (fs.statSync(group.log).size === 0) {
      fs.removeSync(group.log);
      return group;
    }

    // FIXME: does `LANG` work on any location
    const env = { ...process.env, LANG: 'en_US.UTF-8' };
    const command = `goaccess --no-query-string --no-html-last-updated --html-prefs='{"theme":"bright","perPage":10}' --log-file ${group.log} --config-file ${GOACCESS_CONFIG}`;

    await Promise.all([
      runScript(`${command} --output ${date}.json`, 'goaccess', { cwd: groupDir, env, silent: true }),
      runScript(`${command} --output ${date}.html`, 'goaccess', { cwd: groupDir, env, silent: true }),
    ]);

    fs.removeSync(group.log);

    const result = fs.readJSONSync(path.join(groupDir, `${date}.json`));
    group.result = result.general;
  } catch {
    console.error('Failed to analyze log for group', { group, date });
  }

  return group;
}

export function hasLogByDate(logDir: string, date: string): boolean {
  const compressed = path.join(logDir, `access-${date}.log.gz`);
  return fs.existsSync(compressed);
}

export async function processLogByDate(
  logDir: string,
  tmpDir: string,
  dataDir: string,
  date: string,
  groups: LogGroup[]
): Promise<LogGroup[]> {
  const binary = getGoAccessBinary();
  if (!binary) {
    throw new Error('goaccess binary not found');
  }

  const compressed = path.join(logDir, `access-${date}.log.gz`);
  if (fs.existsSync(compressed) === false) {
    return groups;
  }

  const decompressed = await decompressLog(compressed, tmpDir);
  debug('decompressed', decompressed);

  const splitted = await splitLogByGroup(decompressed, dataDir, date, groups);
  debug('splitted', splitted);
  const results = await Promise.all(splitted.map((group) => processLogForGroup(dataDir, date, group)));

  fs.removeSync(decompressed);

  return results;
}

export function getHtmlResultPath(dataDir: string, date: string, did: string): string {
  return path.join(dataDir, did, ANALYTICS_DIR, `${date}.html`);
}

export function getJsonResultPath(dataDir: string, date: string, did: string): string {
  return path.join(dataDir, did, ANALYTICS_DIR, `${date}.json`);
}
