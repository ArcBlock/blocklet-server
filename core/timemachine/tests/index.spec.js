/* eslint-disable no-console */
const { test, expect, describe } = require('bun:test');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const readdirp = require('readdirp');

const Timemachine = require('../lib/index');

describe('Timemachine', () => {
  test('should be a function', () => {
    expect(typeof Timemachine).toEqual('function');
  });

  test('should init repo and git skeleton as expected', async () => {
    const targetDir = path.join(os.tmpdir(), Date.now().toString());
    const machine = new Timemachine({
      sources: () => 'Some string',
      targetDir,
    });

    const files = await readdirp.promise(targetDir);
    expect(files.find((x) => x.path === 'HEAD')).toBeTruthy();
    expect(files.find((x) => x.path === 'config')).toBeTruthy();
    expect(files.find((x) => x.path === 'description')).toBeTruthy();
    expect(files.find((x) => x.path === 'info/exclude')).toBeTruthy();

    machine.destroy();
  });

  test('should takeSnapshot for function sources correctly', async () => {
    const targetDir = path.join(os.tmpdir(), Math.random().toString(), '.git');
    let newContent = null;
    const machine = new Timemachine({
      sources: () => {
        newContent = `${Math.random()}\n`;
        return newContent;
      },
      targetDir,
    });

    const commitHash = await machine.takeSnapshot('test commit');
    expect(commitHash).toBeTruthy();

    const commitHash2 = await machine.takeSnapshot('test commit 2');
    expect(commitHash2).toBeTruthy();

    const commit = await machine.getLastSnapshot();
    expect(commit.commitHash).toEqual(commitHash2);
    expect(commit.message).toEqual('test commit 2');
    expect(commit.parents.includes(commitHash)).toEqual(true);

    const tree = await machine.exportSnapshot(commitHash2);
    expect(tree).toEqual(newContent);

    machine.destroy();
  });

  test('should takeSnapshot for single file sources correctly', async () => {
    const baseDir = path.join(os.tmpdir(), Math.random().toString());
    const targetDir = path.join(baseDir, '.git');

    const sourceDir = path.join(baseDir, 'sources');
    const sourceFile = path.join(sourceDir, 'random.txt');

    // File must exist before we create a snapshot
    fs.mkdirpSync(sourceDir);
    fs.outputFileSync(sourceFile, `${Math.random()}\n`);

    const machine = new Timemachine({
      sources: sourceFile,
      sourcesBase: sourceDir,
      targetDir,
    });

    const commitHash = await machine.takeSnapshot('test commit');
    expect(commitHash).toBeTruthy();

    fs.outputFileSync(sourceFile, `${Math.random()}\n`);
    const commitHash2 = await machine.takeSnapshot('test commit 2');
    expect(commitHash2).toBeTruthy();

    const commit = await machine.getLastSnapshot();
    expect(commit.commitHash).toEqual(commitHash2);
    expect(commit.message).toEqual('test commit 2');
    expect(commit.parents.includes(commitHash)).toEqual(true);

    machine.destroy();
    fs.removeSync(sourceDir, { recursive: true });
  });

  test('should work for single dir sources correctly: takeSnapshot/listSnapshots', async () => {
    const baseDir = path.join(os.tmpdir(), Math.random().toString());
    const targetDir = path.join(baseDir, '.git');

    const sourceDir = path.join(baseDir, 'sources');
    const sourceFile = path.join(sourceDir, 'random.txt');

    // File must exist before we create a snapshot
    fs.mkdirpSync(sourceDir);
    fs.outputFileSync(sourceFile, `${Math.random()}\n`);

    const machine = new Timemachine({
      sources: sourceDir,
      sourcesBase: sourceDir,
      targetDir,
    });

    const commitHash = await machine.takeSnapshot('test commit');
    expect(commitHash).toBeTruthy();

    const newContent = `${Math.random()}\n`;
    fs.outputFileSync(sourceFile, newContent);
    const commitHash2 = await machine.takeSnapshot('test commit 2');
    expect(commitHash2).toBeTruthy();

    const commit = await machine.getLastSnapshot();
    expect(commit.commitHash).toEqual(commitHash2);
    expect(commit.message).toEqual('test commit 2');
    expect(commit.parents.includes(commitHash)).toEqual(true);

    const tree = await machine.exportSnapshot(commitHash2);
    expect(tree['random.txt']).toEqual(newContent);

    // Test read snapshot
    const hasValidCommit1 = await machine.hasSnapshot(commitHash);
    const hasValidCommit2 = await machine.hasSnapshot(commitHash2);
    const hasInValidCommit = await machine.hasSnapshot('abcd');
    expect(hasValidCommit1).toEqual(true);
    expect(hasValidCommit2).toEqual(true);
    expect(hasInValidCommit).toEqual(false);

    // Test walk the history
    const stream = await machine.listSnapshots();
    const scanHistory = () =>
      new Promise((resolve) => {
        let snapshotCount = 1;
        stream.on('data', (snapshot) => {
          expect(snapshot.hash).toEqual(snapshotCount === 1 ? commitHash2 : commitHash);
          snapshotCount += 1;
        });
        stream.on('end', () => {
          resolve();
        });
      });

    await scanHistory();

    // Cleanup
    machine.destroy();
    fs.removeSync(sourceDir, { recursive: true });
  });
});
