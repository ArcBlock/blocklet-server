# Timemachine

A file system and git based timemachine implementation that allows user to create/manipulate/export snapshots on any data sources.

## Usage

```shell
yarn add @abtnode/timemachine
```

Then:

```javascript
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const readdirp = require('readdirp');
const Timemachine = require('@abtnode/timemachine');

const baseDir = path.join(os.tmpdir(), Math.random().toString());
const targetDir = path.join(baseDir, '.git');

const sourceDir = path.join(baseDir, 'sources');
const sourceFile = path.join(sourceDir, 'random.txt');

// File must exist before we create a snapshot
fs.mkdirpSync(sourceDir);
fs.outputFileSync(sourceFile, `${Math.random()}\n`);

// Create a time machine
const machine = new Timemachine({
  sources: sourceDir,
  sourcesBase: sourceDir,
  targetDir,
});

// Commit
const commitHash = await machine.takeSnapshot('test commit');

// Change content and commit again
const newContent = `${Math.random()}\n`;
fs.outputFileSync(sourceFile, newContent);
const commitHash2 = await machine.takeSnapshot('test commit 2');

const snapshot = await machine.getLastSnapshot();

const tree = await machine.exportSnapshot(commitHash2);

// Test read snapshot
const hasValidCommit1 = await machine.hasSnapshot(commitHash); // true
const hasValidCommit2 = await machine.hasSnapshot(commitHash2); // true
const hasInValidCommit = await machine.hasSnapshot('abcd'); // false

// Test walk the history
const stream = await machine.listSnapshots();
const scanHistory = () =>
  new Promise((resolve) => {
    stream.on('data', (snapshot) => {
      console.log('found snapshot', snapshot);
    });
    stream.on('end', () => {
      resolve();
    });
  });

await scanHistory();

// Cleanup
machine.destroy();
fs.rmSync(sourceDir, { recursive: true });
```

Checkout the [test file](./tests/index.spec.js) for more usage examples.

## Design

Input：

- sources：为哪个目录或文件创建快照，可以指定多个
- snapshotDir：把快照历史存储在哪里

API：

- takeSnapshot(message) => hash
- listSnapshots() => [{ hash, time }] sorted by timestamp
- readSnapshot(hash) => stream? { filePath: fileContent }

Implementation:

- constructor
  - Initialize a typical git repository as `git init` does without any clutter
  - Call takeSnapshot to get first snapshot
- takeSnapshot(message)
  - Parse `sources` to get a list of files to be tracked
  - Calculate all files blob hash and construct a tree
  - Read last commit tree and diff with latest tree to get what's deleted
  - Create new commit with the new tree and last parent
- listSnapshots(limit)
  - Return a stream that emits `data` when found a new commit
