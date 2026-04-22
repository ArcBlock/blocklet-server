#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Find large JS/TS/JSX/TSX files in the project
 * - Respects .gitignore (uses git ls-files)
 * - Concurrent file reading
 * - Lists files exceeding threshold lines
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;

const THRESHOLD = 700;
const EXTENSIONS = ['.js', '.ts', '.jsx', '.tsx'];
const CONCURRENCY = 50;

function getGitFiles() {
  const output = execSync('git ls-files --cached --others --exclude-standard', {
    encoding: 'utf-8',
    maxBuffer: 50 * 1024 * 1024,
  });
  return output.trim().split('\n').filter(Boolean);
}

function filterByExtension(files) {
  return files.filter((file) => EXTENSIONS.some((ext) => file.endsWith(ext)));
}

async function countLines(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').length;
    return { filePath, lines };
  } catch {
    return { filePath, lines: 0, error: true };
  }
}

async function processInBatches(files, batchSize) {
  const results = [];
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const batchResults = await Promise.all(batch.map(countLines));
    results.push(...batchResults);
  }
  return results;
}

function categorizeFile(filePath) {
  if (filePath.includes('.spec.') || filePath.includes('.test.')) return 'test';
  if (filePath.includes('/locales/')) return 'i18n';
  if (filePath.endsWith('.d.ts')) return 'type-definition';
  if (filePath.includes('_pb.')) return 'protobuf';
  if (filePath.includes('/types') && filePath.endsWith('.js')) return 'generated-types';
  return 'source';
}

function shouldSplit(filePath, category) {
  return !(
    category === 'test' ||
    category === 'i18n' ||
    category === 'type-definition' ||
    category === 'protobuf' ||
    category === 'generated-types' ||
    filePath.includes('languages.ts') ||
    filePath.includes('core/schema') ||
    filePath.endsWith('disk.js') ||
    filePath.includes('core/models/src/migrations') ||
    filePath.includes('core/models/lib')
  );
}

async function main() {
  console.log(`Scanning for large files (>${THRESHOLD} lines)...\n`);

  const allFiles = getGitFiles();
  const targetFiles = filterByExtension(allFiles);

  console.log(`Found ${targetFiles.length} JS/TS/JSX/TSX files to analyze\n`);

  const results = await processInBatches(targetFiles, CONCURRENCY);

  const largeFiles = results.filter((r) => !r.error && r.lines > THRESHOLD).sort((a, b) => b.lines - a.lines);

  console.log(`\n${'='.repeat(80)}`);
  console.log(`LARGE FILES (>${THRESHOLD} lines): ${largeFiles.length} files found`);
  console.log(`${'='.repeat(80)}\n`);

  const categorized = {
    source: [],
    test: [],
    i18n: [],
    'type-definition': [],
    protobuf: [],
    'generated-types': [],
  };

  for (const file of largeFiles) {
    const category = categorizeFile(file.filePath);
    categorized[category].push(file);
  }

  // Source files that need splitting
  console.log('\n## FILES TO SPLIT (Source Code)\n');
  console.log('| Lines | File Path |');
  console.log('|-------|-----------|');
  for (const file of categorized.source) {
    if (shouldSplit(file.filePath, 'source')) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // Test files (keep as is)
  if (categorized.test.length > 0) {
    console.log('\n## TEST FILES (No split needed)\n');
    console.log('| Lines | File Path |');
    console.log('|-------|-----------|');
    for (const file of categorized.test) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // I18n files
  if (categorized.i18n.length > 0) {
    console.log('\n## I18N FILES (No split needed)\n');
    console.log('| Lines | File Path |');
    console.log('|-------|-----------|');
    for (const file of categorized.i18n) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // Type definitions
  if (categorized['type-definition'].length > 0) {
    console.log('\n## TYPE DEFINITIONS (Auto-generated, no split)\n');
    console.log('| Lines | File Path |');
    console.log('|-------|-----------|');
    for (const file of categorized['type-definition']) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // Protobuf
  if (categorized.protobuf.length > 0) {
    console.log('\n## PROTOBUF FILES (Auto-generated, no split)\n');
    console.log('| Lines | File Path |');
    console.log('|-------|-----------|');
    for (const file of categorized.protobuf) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // Generated types
  if (categorized['generated-types'].length > 0) {
    console.log('\n## GENERATED TYPE FILES (Auto-generated, no split)\n');
    console.log('| Lines | File Path |');
    console.log('|-------|-----------|');
    for (const file of categorized['generated-types']) {
      console.log(`| ${file.lines} | ${file.filePath} |`);
    }
  }

  // Summary
  const toSplit = categorized.source.filter((f) => shouldSplit(f.filePath, 'source'));
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total large files: ${largeFiles.length}`);
  console.log(`Files to split: ${toSplit.length}`);
  console.log(`Test files (keep): ${categorized.test.length}`);
  console.log(`I18n files (keep): ${categorized.i18n.length}`);
  console.log(`Type definitions (auto-generated): ${categorized['type-definition'].length}`);
  console.log(`Protobuf files (auto-generated): ${categorized.protobuf.length}`);
  console.log(`Generated types (auto-generated): ${categorized['generated-types'].length}`);

  return { largeFiles, toSplit };
}

main().catch(console.error);
