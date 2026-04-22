#!/usr/bin/env node

/**
 * 合并所有子包的 coverage/lcov.info 到根目录的 coverage/lcov.info
 * 并生成交互式 HTML 报告
 *
 * lcov 格式说明:
 * - TN: 测试名称
 * - SF: 源文件路径
 * - FN:行号,函数名
 * - FNF: 函数总数
 * - FNH: 命中函数数
 * - FNDA:命中次数,函数名
 * - DA:行号,命中次数
 * - LF: 总行数
 * - LH: 命中行数
 * - BRF: 分支总数
 * - BRH: 命中分支数
 * - end_of_record: 记录结束标记
 */

const fs = require('node:fs');
const path = require('node:path');
const { SourceMapConsumer } = require('source-map');

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'coverage');
const outputFile = path.join(outputDir, 'lcov.info');
const htmlFile = path.join(outputDir, 'index.html');

// 需要排除的文件模式（从覆盖率统计中排除）
const EXCLUDE_PATTERNS = [
  /^tools\/bun-.*-preload\.js$/,
  /^tools\/bun-browser\.plugin\.js$/,
  /node_modules/,
  /\.d\.ts$/, // 类型定义文件
  /\.spec\.(ts|js|tsx|jsx)$/, // 测试文件
  /\.test\.(ts|js|tsx|jsx)$/,
  /\/(tests|__tests__|__mocks__|fixtures|mocks)\//,
  /\/dist\//,
  /\/build\//,
  /\/coverage\//,
  /\/locales\//, // 自动生成的翻译文件
  /^core\/schema\//, // protobuf 生成的 schema 文件
  /\.(jsx|tsx)$/, // React 组件文件（前端代码）
];

// 判断是否应该排除该文件
function shouldExclude(filePath) {
  return EXCLUDE_PATTERNS.some((pattern) => pattern.test(filePath));
}

// 检查是否是纯类型定义文件（只包含 type/interface，没有运行时代码）
function isTypeOnlyFile(filePath) {
  if (!filePath.endsWith('.ts')) return false;

  try {
    const fullPath = path.join(rootDir, filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');

    // 检查是否有运行时代码导出
    const hasRuntimeExport = /^export\s+(function|class|const|let|var|async|default)/m.test(content);
    if (hasRuntimeExport) return false;

    // 检查是否只有类型导出
    const hasTypeExport = /^export\s+(type|interface)/m.test(content);
    return hasTypeExport;
  } catch {
    return false;
  }
}

// 扫描目录中的所有源文件
function scanSourceFiles(baseDir, subDirs) {
  const sourceFiles = new Set();
  const sourceExtensions = ['.ts', '.js', '.tsx', '.jsx'];

  for (const subDir of subDirs) {
    const dirPath = path.join(baseDir, subDir);
    if (!fs.existsSync(dirPath)) continue;

    const packages = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const pkg of packages) {
      if (!pkg.isDirectory()) continue;

      const pkgPath = path.join(dirPath, pkg.name);
      // 优先扫描 src/，如果没有 src/ 才扫描 lib/（避免重复统计编译后的文件）
      const srcPath = path.join(pkgPath, 'src');
      const libPath = path.join(pkgPath, 'lib');

      if (fs.existsSync(srcPath)) {
        scanDirRecursive(srcPath, baseDir, sourceFiles, sourceExtensions);
      } else if (fs.existsSync(libPath)) {
        scanDirRecursive(libPath, baseDir, sourceFiles, sourceExtensions);
      }
    }
  }

  return sourceFiles;
}

// 递归扫描目录
function scanDirRecursive(dir, baseDir, results, extensions) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    if (entry.isDirectory()) {
      // 跳过特殊目录
      if (['node_modules', 'dist', 'build', 'coverage', '__tests__', '__mocks__'].includes(entry.name)) {
        continue;
      }
      scanDirRecursive(fullPath, baseDir, results, extensions);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (extensions.includes(ext) && !shouldExclude(relativePath) && !isTypeOnlyFile(relativePath)) {
        results.add(relativePath);
      }
    }
  }
}

// 解析单个 lcov 记录
function parseLcovRecord(record) {
  const lines = record.split('\n');
  const result = {
    file: '',
    lines: { found: 0, hit: 0, details: new Map() }, // 使用 Map 便于合并
    functions: { found: 0, hit: 0, details: new Map() },
    branches: { found: 0, hit: 0 },
  };

  for (const line of lines) {
    if (line.startsWith('SF:')) {
      result.file = line.slice(3);
    } else if (line.startsWith('DA:')) {
      const [lineNum, hits] = line.slice(3).split(',').map(Number);
      // 保留最大的命中次数
      const existing = result.lines.details.get(lineNum) || 0;
      result.lines.details.set(lineNum, Math.max(existing, hits));
    } else if (line.startsWith('FN:')) {
      const [lineNum, name] = line.slice(3).split(',');
      if (!result.functions.details.has(name)) {
        result.functions.details.set(name, { line: parseInt(lineNum, 10), hits: 0 });
      }
    } else if (line.startsWith('FNDA:')) {
      const [hits, name] = line.slice(5).split(',');
      const fn = result.functions.details.get(name);
      if (fn) {
        fn.hits = Math.max(fn.hits, parseInt(hits, 10));
      }
    } else if (line.startsWith('LF:')) {
      result.lines.found = Math.max(result.lines.found, parseInt(line.slice(3), 10));
    } else if (line.startsWith('LH:')) {
      // 保留原始 LH 值，用于没有详细信息时
      result.lines.hit = Math.max(result.lines.hit, parseInt(line.slice(3), 10));
    } else if (line.startsWith('FNF:')) {
      result.functions.found = Math.max(result.functions.found, parseInt(line.slice(4), 10));
    } else if (line.startsWith('FNH:')) {
      // 保留原始 FNH 值，bun 不生成详细函数信息
      result.functions.hit = Math.max(result.functions.hit, parseInt(line.slice(4), 10));
    } else if (line.startsWith('BRF:')) {
      result.branches.found = Math.max(result.branches.found, parseInt(line.slice(4), 10));
    } else if (line.startsWith('BRH:')) {
      result.branches.hit = Math.max(result.branches.hit, parseInt(line.slice(4), 10));
    }
  }

  return result;
}

// 尝试使用 source map 重映射覆盖率数据
// 如果文件路径包含 /dist/，尝试找到对应的 source map 并映射回 src/
// 返回一个数组，因为一个 bundle 文件可能映射到多个源文件
async function remapCoverageRecord(record) {
  const filePath = record.file;

  // 只处理 dist/ 目录下的文件
  if (!filePath.includes('/dist/')) {
    return [record];
  }

  // 构建 source map 文件路径
  const fullFilePath = path.join(rootDir, filePath);
  const mapPath = fullFilePath + '.map';

  // 检查 source map 是否存在
  if (!fs.existsSync(mapPath)) {
    return [record];
  }

  try {
    // 读取并解析 source map
    const rawMap = fs.readFileSync(mapPath, 'utf-8');
    const mapData = JSON.parse(rawMap);
    const consumer = await new SourceMapConsumer(mapData);

    // 获取原始源文件路径
    const sources = consumer.sources;
    if (!sources || sources.length === 0) {
      consumer.destroy();
      return [record];
    }

    const distDir = path.dirname(fullFilePath);

    // 按源文件分组的覆盖率数据
    // key: 源文件相对路径, value: { lines: Map, functions: Map }
    const sourceFileCoverage = new Map();

    // 初始化所有源文件的覆盖率数据结构
    for (const source of sources) {
      const srcFile = path.normalize(path.join(distDir, source));
      const relativeSrcFile = path.relative(rootDir, srcFile);
      if (fs.existsSync(srcFile) && !shouldExclude(relativeSrcFile)) {
        sourceFileCoverage.set(relativeSrcFile, {
          lines: new Map(),
          functions: new Map(),
        });
      }
    }

    // 如果没有有效的源文件，返回原记录
    if (sourceFileCoverage.size === 0) {
      consumer.destroy();
      return [record];
    }

    // 构建从生成行到原始行的映射表（因为 column: 0 可能没有映射）
    const lineMapping = new Map(); // generatedLine -> { source, line }
    consumer.eachMapping((mapping) => {
      if (mapping.source && mapping.originalLine > 0) {
        // 每个生成行只保留第一个有效映射
        if (!lineMapping.has(mapping.generatedLine)) {
          lineMapping.set(mapping.generatedLine, {
            source: mapping.source,
            line: mapping.originalLine,
          });
        }
      }
    });

    // 重映射行覆盖数据
    for (const [lineNum, hits] of record.lines.details) {
      const mapping = lineMapping.get(lineNum);
      if (mapping) {
        // 计算原始文件的相对路径
        const srcFile = path.normalize(path.join(distDir, mapping.source));
        const relativeSrcFile = path.relative(rootDir, srcFile);

        const fileCov = sourceFileCoverage.get(relativeSrcFile);
        if (fileCov) {
          // 累加同一行的命中次数
          const existing = fileCov.lines.get(mapping.line) || 0;
          fileCov.lines.set(mapping.line, Math.max(existing, hits));
        }
      }
    }

    // 重映射函数覆盖数据
    for (const [name, fn] of record.functions.details) {
      const mapping = lineMapping.get(fn.line);
      if (mapping) {
        const srcFile = path.normalize(path.join(distDir, mapping.source));
        const relativeSrcFile = path.relative(rootDir, srcFile);

        const fileCov = sourceFileCoverage.get(relativeSrcFile);
        if (fileCov) {
          fileCov.functions.set(name, { line: mapping.line, hits: fn.hits });
        }
      }
    }

    consumer.destroy();

    // 将分组的覆盖率数据转换为记录数组
    const results = [];
    for (const [srcFile, coverage] of sourceFileCoverage) {
      // 只添加有覆盖数据的文件
      if (coverage.lines.size > 0 || coverage.functions.size > 0) {
        results.push({
          file: srcFile,
          lines: {
            found: coverage.lines.size,
            hit: Array.from(coverage.lines.values()).filter((h) => h > 0).length,
            details: coverage.lines,
          },
          functions: {
            found: coverage.functions.size,
            hit: Array.from(coverage.functions.values()).filter((f) => f.hits > 0).length,
            details: coverage.functions,
          },
          branches: { found: 0, hit: 0 },
        });
      }
    }

    // 如果没有成功映射任何数据，返回原记录
    return results.length > 0 ? results : [record];
  } catch (err) {
    // 如果 source map 解析失败，返回原记录
    console.warn(`Warning: Failed to parse source map for ${filePath}: ${err.message}`);
    return [record];
  }
}

// 合并两个文件的覆盖率数据
function mergeFileData(existing, newData) {
  // 合并行覆盖详情
  for (const [lineNum, hits] of newData.lines.details) {
    const existingHits = existing.lines.details.get(lineNum) || 0;
    existing.lines.details.set(lineNum, Math.max(existingHits, hits));
  }
  existing.lines.found = Math.max(existing.lines.found, newData.lines.found);
  existing.lines.hit = Math.max(existing.lines.hit, newData.lines.hit);

  // 合并函数覆盖
  for (const [name, fn] of newData.functions.details) {
    const existingFn = existing.functions.details.get(name);
    if (existingFn) {
      existingFn.hits = Math.max(existingFn.hits, fn.hits);
    } else {
      existing.functions.details.set(name, { ...fn });
    }
  }
  existing.functions.found = Math.max(existing.functions.found, newData.functions.found);
  existing.functions.hit = Math.max(existing.functions.hit, newData.functions.hit);

  // 合并分支覆盖
  existing.branches.found = Math.max(existing.branches.found, newData.branches.found);
  existing.branches.hit = Math.max(existing.branches.hit, newData.branches.hit);

  return existing;
}

// 计算实际的 hit 数量
function calculateHits(fileData) {
  // 如果有详细信息，从详情计算；否则使用原始值
  if (fileData.lines.details.size > 0) {
    const calculatedHit = Array.from(fileData.lines.details.values()).filter((h) => h > 0).length;
    fileData.lines.hit = Math.max(fileData.lines.hit, calculatedHit);
  }

  if (fileData.functions.details.size > 0) {
    const calculatedHit = Array.from(fileData.functions.details.values()).filter((f) => f.hits > 0).length;
    fileData.functions.hit = Math.max(fileData.functions.hit, calculatedHit);
  }

  // 如果 found 为 0，使用 details 的长度
  if (fileData.lines.found === 0 && fileData.lines.details.size > 0) {
    fileData.lines.found = fileData.lines.details.size;
  }
  if (fileData.functions.found === 0 && fileData.functions.details.size > 0) {
    fileData.functions.found = fileData.functions.details.size;
  }

  return fileData;
}

// 解析整个 lcov 文件并去重
async function parseLcov(content) {
  const records = content.split('end_of_record').filter((r) => r.trim());
  const fileMap = new Map();

  for (const record of records) {
    const parsed = parseLcovRecord(record);
    if (!parsed.file) continue;

    // 尝试使用 source map 重映射 dist/ 文件到 src/
    // 返回数组，因为一个 bundle 可能映射到多个源文件
    const remappedRecords = await remapCoverageRecord(parsed);

    for (const remapped of remappedRecords) {
      // 重映射后再检查是否应该排除
      if (shouldExclude(remapped.file)) continue;

      if (fileMap.has(remapped.file)) {
        mergeFileData(fileMap.get(remapped.file), remapped);
      } else {
        fileMap.set(remapped.file, remapped);
      }
    }
  }

  // 计算最终的 hit 数量
  return Array.from(fileMap.values()).map(calculateHits);
}

// 查找所有 lcov.info 文件
function findLcovFiles(baseDir) {
  const results = [];
  const searchDirs = ['blocklet', 'core'];

  for (const dir of searchDirs) {
    const fullPath = path.join(baseDir, dir);
    if (!fs.existsSync(fullPath)) continue;

    const packages = fs.readdirSync(fullPath, { withFileTypes: true });
    for (const pkg of packages) {
      if (!pkg.isDirectory()) continue;

      const lcovPath = path.join(fullPath, pkg.name, 'coverage', 'lcov.info');
      if (fs.existsSync(lcovPath)) {
        results.push({
          lcovPath,
          packageDir: path.join(dir, pkg.name),
        });
      }
    }
  }

  return results;
}

// 转换 lcov 文件中的路径
function transformLcov(content, packageDir) {
  const lines = content.split('\n');
  const transformed = [];

  for (const line of lines) {
    if (line.startsWith('SF:')) {
      const relativePath = line.slice(3);
      // 如果路径不以 packageDir 开头，添加前缀
      if (!relativePath.startsWith(packageDir) && !relativePath.startsWith('tools/')) {
        const newPath = path.join(packageDir, relativePath);
        transformed.push(`SF:${newPath}`);
      } else {
        transformed.push(line);
      }
    } else {
      transformed.push(line);
    }
  }

  return transformed.join('\n');
}

// 计算覆盖率百分比
function calcPercent(hit, found) {
  if (found === 0) return 100;
  return ((hit / found) * 100).toFixed(1);
}

// 获取覆盖率颜色
function getCoverageColor(percent) {
  if (percent >= 80) return '#4caf50';
  if (percent >= 60) return '#ff9800';
  return '#f44336';
}

// 从文件路径提取包名
function getPackageName(filePath) {
  const parts = filePath.split('/');
  if (parts.length >= 2 && (parts[0] === 'blocklet' || parts[0] === 'core')) {
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0];
}

// 生成合并后的 lcov 内容
function generateMergedLcov(files) {
  const lines = [];
  for (const file of files) {
    lines.push('TN:');
    lines.push(`SF:${file.file}`);

    // 函数信息
    for (const [name, fn] of file.functions.details) {
      lines.push(`FN:${fn.line},${name}`);
    }
    lines.push(`FNF:${file.functions.found}`);
    lines.push(`FNH:${file.functions.hit}`);
    for (const [name, fn] of file.functions.details) {
      lines.push(`FNDA:${fn.hits},${name}`);
    }

    // 行信息
    for (const [lineNum, hits] of file.lines.details) {
      lines.push(`DA:${lineNum},${hits}`);
    }
    lines.push(`LF:${file.lines.found}`);
    lines.push(`LH:${file.lines.hit}`);

    // 分支信息
    if (file.branches.found > 0) {
      lines.push(`BRF:${file.branches.found}`);
      lines.push(`BRH:${file.branches.hit}`);
    }

    lines.push('end_of_record');
  }
  return lines.join('\n');
}

// 生成 HTML 报告
function generateHtmlReport(files, outputPath) {
  // 按包分组
  const packages = {};
  for (const file of files) {
    const pkgName = getPackageName(file.file);
    if (!packages[pkgName]) {
      packages[pkgName] = { files: [], lines: { found: 0, hit: 0 }, functions: { found: 0, hit: 0 } };
    }
    packages[pkgName].files.push(file);
    packages[pkgName].lines.found += file.lines.found;
    packages[pkgName].lines.hit += file.lines.hit;
    packages[pkgName].functions.found += file.functions.found;
    packages[pkgName].functions.hit += file.functions.hit;
  }

  // 计算总计
  const totals = {
    files: files.length,
    packages: Object.keys(packages).length,
    lines: { found: 0, hit: 0 },
    functions: { found: 0, hit: 0 },
  };
  for (const file of files) {
    totals.lines.found += file.lines.found;
    totals.lines.hit += file.lines.hit;
    totals.functions.found += file.functions.found;
    totals.functions.hit += file.functions.hit;
  }

  const linePercent = calcPercent(totals.lines.hit, totals.lines.found);
  const funcPercent = calcPercent(totals.functions.hit, totals.functions.found);

  // 生成包列表 HTML
  const packageRows = Object.entries(packages)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, pkg]) => {
      const lp = calcPercent(pkg.lines.hit, pkg.lines.found);
      const fp = calcPercent(pkg.functions.hit, pkg.functions.found);
      const escapedName = name.replace(/"/g, '&quot;');
      return `
        <tr class="package-row" data-package="${escapedName}">
          <td class="expandable"><span class="icon">▶</span> ${name}</td>
          <td><div class="bar"><div class="fill" style="width:${lp}%;background:${getCoverageColor(lp)}"></div></div></td>
          <td class="num">${lp}%</td>
          <td class="num">${pkg.lines.hit.toLocaleString()}/${pkg.lines.found.toLocaleString()}</td>
          <td class="num">${fp}%</td>
          <td class="num">${pkg.functions.hit.toLocaleString()}/${pkg.functions.found.toLocaleString()}</td>
          <td class="num">${pkg.files.length}</td>
        </tr>
        ${pkg.files
          .sort((a, b) => a.file.localeCompare(b.file))
          .map((f) => {
            const flp = calcPercent(f.lines.hit, f.lines.found);
            const ffp = calcPercent(f.functions.hit, f.functions.found);
            // 显示完整的相对路径
            const displayPath = f.file;
            return `
            <tr class="file-row" data-package="${escapedName}" style="display:none">
              <td class="file-name"><span class="indent"></span>${displayPath}</td>
              <td><div class="bar"><div class="fill" style="width:${flp}%;background:${getCoverageColor(flp)}"></div></div></td>
              <td class="num">${flp}%</td>
              <td class="num">${f.lines.hit.toLocaleString()}/${f.lines.found.toLocaleString()}</td>
              <td class="num">${ffp}%</td>
              <td class="num">${f.functions.hit.toLocaleString()}/${f.functions.found.toLocaleString()}</td>
              <td class="num">-</td>
            </tr>`;
          })
          .join('')}
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coverage Report - blocklet-server</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; }
    .container { max-width: 1600px; margin: 0 auto; padding: 20px; }
    h1 { margin-bottom: 20px; color: #1a1a1a; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .card h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
    .card .value { font-size: 32px; font-weight: 600; }
    .card .sub { font-size: 14px; color: #888; margin-top: 4px; }
    table { width: 100%; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-collapse: collapse; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #fafafa; font-weight: 600; position: sticky; top: 0; z-index: 10; }
    .num { text-align: right; font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 13px; white-space: nowrap; }
    .bar { width: 100px; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
    .fill { height: 100%; transition: width 0.3s; }
    .package-row { cursor: pointer; }
    .package-row:hover { background: #f8f8f8; }
    .expandable { font-weight: 500; white-space: nowrap; }
    .expandable .icon { display: inline-block; width: 16px; transition: transform 0.2s; }
    .package-row.expanded .icon { transform: rotate(90deg); }
    .file-row { background: #fafafa; }
    .file-row:hover { background: #f0f0f0; }
    .file-name { font-family: 'SF Mono', Monaco, Consolas, monospace; font-size: 12px; color: #555; }
    .file-name .indent { display: inline-block; width: 24px; }
    .search { margin-bottom: 16px; }
    .search input { width: 100%; padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; }
    .search input:focus { outline: none; border-color: #2196f3; }
    .legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 13px; flex-wrap: wrap; }
    .legend span { display: flex; align-items: center; gap: 4px; }
    .legend .dot { width: 12px; height: 12px; border-radius: 2px; }
    .timestamp { text-align: right; color: #888; font-size: 12px; margin-top: 16px; }
    .stats { display: flex; gap: 24px; margin-bottom: 16px; font-size: 13px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Coverage Report</h1>

    <div class="summary">
      <div class="card">
        <h3>Line Coverage</h3>
        <div class="value" style="color:${getCoverageColor(linePercent)}">${linePercent}%</div>
        <div class="sub">${totals.lines.hit.toLocaleString()} / ${totals.lines.found.toLocaleString()} lines</div>
      </div>
      <div class="card">
        <h3>Function Coverage</h3>
        <div class="value" style="color:${getCoverageColor(funcPercent)}">${funcPercent}%</div>
        <div class="sub">${totals.functions.hit.toLocaleString()} / ${totals.functions.found.toLocaleString()} functions</div>
      </div>
      <div class="card">
        <h3>Files</h3>
        <div class="value">${totals.files.toLocaleString()}</div>
        <div class="sub">across ${totals.packages} packages</div>
      </div>
    </div>

    <div class="legend">
      <span><div class="dot" style="background:#4caf50"></div> ≥80% (Good)</span>
      <span><div class="dot" style="background:#ff9800"></div> 60-80% (Medium)</span>
      <span><div class="dot" style="background:#f44336"></div> &lt;60% (Low)</span>
    </div>

    <div class="search">
      <input type="text" id="search" placeholder="Search files or packages (e.g. 'blocklet/sdk' or 'router')..." />
    </div>

    <table>
      <thead>
        <tr>
          <th style="min-width:400px">Package / File</th>
          <th style="width:120px">Coverage</th>
          <th class="num" style="width:80px">Lines %</th>
          <th class="num" style="width:120px">Lines</th>
          <th class="num" style="width:80px">Funcs %</th>
          <th class="num" style="width:120px">Functions</th>
          <th class="num" style="width:60px">Files</th>
        </tr>
      </thead>
      <tbody id="table-body">
        ${packageRows}
      </tbody>
    </table>

    <div class="timestamp">Generated: ${new Date().toLocaleString()} | blocklet-server</div>
  </div>

  <script>
    // 展开/折叠包
    document.querySelectorAll('.package-row').forEach(row => {
      row.addEventListener('click', () => {
        const pkg = row.dataset.package;
        const fileRows = document.querySelectorAll('.file-row[data-package="' + pkg + '"]');
        const isExpanded = row.classList.contains('expanded');

        row.classList.toggle('expanded');
        fileRows.forEach(r => r.style.display = isExpanded ? 'none' : '');
      });
    });

    // 搜索功能
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();

      document.querySelectorAll('.package-row').forEach(row => {
        const pkg = row.dataset.package;
        const pkgText = row.textContent.toLowerCase();
        const fileRows = document.querySelectorAll('.file-row[data-package="' + pkg + '"]');

        if (query === '') {
          // 重置：显示所有包，隐藏所有文件
          row.style.display = '';
          row.classList.remove('expanded');
          fileRows.forEach(r => r.style.display = 'none');
        } else {
          // 检查包名或文件名是否匹配
          let pkgMatches = pkgText.includes(query);
          let anyFileMatches = false;

          fileRows.forEach(r => {
            const fileText = r.textContent.toLowerCase();
            const matches = fileText.includes(query);
            if (matches) anyFileMatches = true;
            r.style.display = (pkgMatches || matches) ? '' : 'none';
          });

          // 如果包或任何文件匹配，显示包行
          row.style.display = (pkgMatches || anyFileMatches) ? '' : 'none';

          // 如果有匹配，展开包
          if (pkgMatches || anyFileMatches) {
            row.classList.add('expanded');
          }
        }
      });
    });

    // 支持 Escape 清除搜索
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
      }
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(outputPath, html);
}

// 生成 AI 友好的简洁文本报告
function generateTextReport(files, outputPath, untestedCount = 0) {
  const lines = [];

  // 按包分组统计
  const packages = {};
  let totalLF = 0;
  let totalLH = 0;
  let totalFNF = 0;
  let totalFNH = 0;

  for (const file of files) {
    const pkgName = getPackageName(file.file);
    if (!packages[pkgName]) {
      packages[pkgName] = { files: [], lines: { found: 0, hit: 0 }, functions: { found: 0, hit: 0 }, untestedFiles: 0 };
    }
    packages[pkgName].files.push(file);
    packages[pkgName].lines.found += file.lines.found;
    packages[pkgName].lines.hit += file.lines.hit;
    packages[pkgName].functions.found += file.functions.found;
    packages[pkgName].functions.hit += file.functions.hit;
    if (file.lines.hit === 0 && file.lines.found > 0) {
      packages[pkgName].untestedFiles++;
    }

    totalLF += file.lines.found;
    totalLH += file.lines.hit;
    totalFNF += file.functions.found;
    totalFNH += file.functions.hit;
  }

  const linePct = totalLF > 0 ? ((totalLH / totalLF) * 100).toFixed(1) : 0;
  const funcPct = totalFNF > 0 ? ((totalFNH / totalFNF) * 100).toFixed(1) : 0;
  const testedFiles = files.length - untestedCount;

  // 标题
  lines.push(`# Coverage Report - blocklet-server`);
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(`Files:     ${files.length} total (${testedFiles} tested, ${untestedCount} untested)`);
  lines.push(`Packages:  ${Object.keys(packages).length}`);
  lines.push(`Lines:     ${linePct}% (${totalLH.toLocaleString()} / ${totalLF.toLocaleString()})`);
  lines.push(`Functions: ${funcPct}% (${totalFNH.toLocaleString()} / ${totalFNF.toLocaleString()})`);
  lines.push(``);

  // 按包统计（按覆盖率排序）
  lines.push(`## Packages by Coverage`);
  lines.push(`${'Package'.padEnd(30)} ${'Lines'.padStart(14)} ${'Pct'.padStart(7)} ${'Files'.padStart(6)} ${'Untested'.padStart(8)}`);
  lines.push(`${'-'.repeat(30)} ${'-'.repeat(14)} ${'-'.repeat(7)} ${'-'.repeat(6)} ${'-'.repeat(8)}`);

  const sortedPackages = Object.entries(packages).sort((a, b) => {
    const pctA = a[1].lines.found > 0 ? a[1].lines.hit / a[1].lines.found : 0;
    const pctB = b[1].lines.found > 0 ? b[1].lines.hit / b[1].lines.found : 0;
    return pctA - pctB; // 低覆盖率排前面
  });

  for (const [name, pkg] of sortedPackages) {
    const pct = pkg.lines.found > 0 ? ((pkg.lines.hit / pkg.lines.found) * 100).toFixed(1) : '100.0';
    const linesStr = `${pkg.lines.hit}/${pkg.lines.found}`;
    const untestedStr = pkg.untestedFiles > 0 ? String(pkg.untestedFiles) : '-';
    lines.push(
      `${name.padEnd(30)} ${linesStr.padStart(14)} ${(pct + '%').padStart(7)} ${String(pkg.files.length).padStart(6)} ${untestedStr.padStart(8)}`
    );
  }
  lines.push(``);

  // 完全未测试的文件（0%覆盖）
  const untestedFiles = files
    .filter((f) => f.lines.hit === 0 && f.lines.found > 0)
    .sort((a, b) => b.lines.found - a.lines.found); // 大文件排前面

  if (untestedFiles.length > 0) {
    lines.push(`## Untested Files (0% coverage, ${untestedFiles.length} files, ${untestedFiles.reduce((sum, f) => sum + f.lines.found, 0).toLocaleString()} lines total)`);
    lines.push(`${'File'.padEnd(65)} ${'Lines'.padStart(6)}`);
    lines.push(`${'-'.repeat(65)} ${'-'.repeat(6)}`);

    for (const f of untestedFiles.slice(0, 100)) {
      // 最多显示100个
      const displayPath = f.file.length > 63 ? '...' + f.file.slice(-60) : f.file;
      lines.push(`${displayPath.padEnd(65)} ${String(f.lines.found).padStart(6)}`);
    }
    if (untestedFiles.length > 100) {
      lines.push(`  ... and ${untestedFiles.length - 100} more untested files`);
    }
    lines.push(``);
  }

  // 低覆盖率文件 (>0% but <50%)
  const lowCoverageFiles = files
    .filter((f) => {
      const pct = f.lines.found > 0 ? (f.lines.hit / f.lines.found) * 100 : 100;
      return pct > 0 && pct < 50 && f.lines.found > 10; // 忽略小文件
    })
    .sort((a, b) => {
      const pctA = a.lines.found > 0 ? a.lines.hit / a.lines.found : 0;
      const pctB = b.lines.found > 0 ? b.lines.hit / b.lines.found : 0;
      return pctA - pctB;
    })
    .slice(0, 50); // 最多显示50个

  if (lowCoverageFiles.length > 0) {
    lines.push(`## Low Coverage Files (>0% and <50%, ${lowCoverageFiles.length} files)`);
    lines.push(`${'File'.padEnd(60)} ${'Lines'.padStart(12)} ${'Pct'.padStart(7)}`);
    lines.push(`${'-'.repeat(60)} ${'-'.repeat(12)} ${'-'.repeat(7)}`);

    for (const f of lowCoverageFiles) {
      const pct = f.lines.found > 0 ? ((f.lines.hit / f.lines.found) * 100).toFixed(1) : '0.0';
      const linesStr = `${f.lines.hit}/${f.lines.found}`;
      const displayPath = f.file.length > 58 ? '...' + f.file.slice(-55) : f.file;
      lines.push(`${displayPath.padEnd(60)} ${linesStr.padStart(12)} ${(pct + '%').padStart(7)}`);
    }
    lines.push(``);
  }

  // 高覆盖率包（>80%）
  const highCoveragePackages = sortedPackages
    .filter(([, pkg]) => {
      const pct = pkg.lines.found > 0 ? (pkg.lines.hit / pkg.lines.found) * 100 : 0;
      return pct >= 80;
    })
    .reverse(); // 高覆盖率排前面

  if (highCoveragePackages.length > 0) {
    lines.push(`## High Coverage Packages (>=80%, ${highCoveragePackages.length} packages)`);
    for (const [name, pkg] of highCoveragePackages) {
      const pct = ((pkg.lines.hit / pkg.lines.found) * 100).toFixed(1);
      lines.push(`  ${name}: ${pct}%`);
    }
    lines.push(``);
  }

  const content = lines.join('\n');
  fs.writeFileSync(outputPath, content);
  return content;
}

// 统计文件行数（排除空行和注释）
function countFileLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let count = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // 处理块注释
      if (inBlockComment) {
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }

      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }

      // 跳过空行和单行注释
      if (trimmed === '' || trimmed.startsWith('//')) {
        continue;
      }

      count++;
    }

    return Math.max(count, 1); // 至少1行
  } catch {
    return 0;
  }
}

// 主函数
async function main() {
  console.log('Merging coverage reports...\n');

  const lcovFiles = findLcovFiles(rootDir);

  if (lcovFiles.length === 0) {
    console.log('No coverage files found.');
    process.exit(0);
  }

  console.log(`Found ${lcovFiles.length} coverage files:`);
  for (const { packageDir } of lcovFiles) {
    console.log(`  - ${packageDir}`);
  }

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 扫描所有源文件
  console.log('\nScanning source files...');
  const allSourceFiles = scanSourceFiles(rootDir, ['blocklet', 'core']);
  console.log(`Found ${allSourceFiles.size} source files`);

  // 合并所有 lcov 文件
  let allContent = '';

  for (const { lcovPath, packageDir } of lcovFiles) {
    const content = fs.readFileSync(lcovPath, 'utf-8');
    const transformed = transformLcov(content, packageDir);
    allContent += transformed + '\n';
  }

  // 解析并去重（包含 source map 重映射）
  const allFiles = await parseLcov(allContent);

  // 找出完全没有测试覆盖的文件
  const coveredFiles = new Set(allFiles.map((f) => f.file));
  const untouchedFiles = [];

  for (const sourceFile of allSourceFiles) {
    if (!coveredFiles.has(sourceFile)) {
      const lineCount = countFileLines(path.join(rootDir, sourceFile));
      if (lineCount > 0) {
        untouchedFiles.push({
          file: sourceFile,
          lines: { found: lineCount, hit: 0, details: new Map() },
          functions: { found: 0, hit: 0, details: new Map() },
          branches: { found: 0, hit: 0 },
        });
      }
    }
  }

  console.log(`Found ${untouchedFiles.length} untested files`);

  // 合并已覆盖和未覆盖的文件
  const allFilesWithUntested = [...allFiles, ...untouchedFiles];

  // 生成合并后的 lcov 文件（只包含有覆盖数据的文件）
  const mergedLcov = generateMergedLcov(allFiles);
  fs.writeFileSync(outputFile, mergedLcov);

  // 生成 HTML 报告（包含未测试文件）
  generateHtmlReport(allFilesWithUntested, htmlFile);

  // 生成 AI 友好的文本报告（包含未测试文件）
  const textFile = path.join(outputDir, 'summary.txt');
  generateTextReport(allFilesWithUntested, textFile, untouchedFiles.length);

  // 输出统计
  let totalLF = 0;
  let totalLH = 0;
  let totalFNF = 0;
  let totalFNH = 0;
  for (const file of allFilesWithUntested) {
    totalLF += file.lines.found;
    totalLH += file.lines.hit;
    totalFNF += file.functions.found;
    totalFNH += file.functions.hit;
  }

  const lineCoverage = totalLF > 0 ? ((totalLH / totalLF) * 100).toFixed(2) : 0;
  const funcCoverage = totalFNF > 0 ? ((totalFNH / totalFNF) * 100).toFixed(2) : 0;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Coverage Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Files:     ${allFilesWithUntested.length.toLocaleString()} (${allFiles.length} tested, ${untouchedFiles.length} untested)`);
  console.log(`  Lines:     ${totalLH.toLocaleString()} / ${totalLF.toLocaleString()} (${lineCoverage}%)`);
  console.log(`  Functions: ${totalFNH.toLocaleString()} / ${totalFNF.toLocaleString()} (${funcCoverage}%)`);
  console.log(`${'='.repeat(60)}`);
  console.log(`\nOutput:`);
  console.log(`  - ${path.relative(rootDir, outputFile)}`);
  console.log(`  - ${path.relative(rootDir, htmlFile)}`);
  console.log(`  - ${path.relative(rootDir, textFile)}`);
}

main().catch((err) => {
  console.error('Error merging coverage:', err);
  process.exit(1);
});
