# 快速入门

本指南简要介绍了如何使用 `@blocklet/meta` 库。您将学习如何安装该软件包并执行最常见的任务：解析 `blocklet.yml` 文件以在您的应用程序中访问其元数据。

### 前提条件

在开始之前，请确保您具备：

1.  一个 Node.js 开发环境。
2.  一个包含 `blocklet.yml` 文件的 Blocklet 项目目录。

在本指南中，我们假设您有一个名为 `my-blocklet` 的项目目录，其中包含以下 `blocklet.yml` 文件：

```yaml title="my-blocklet/blocklet.yml" icon=mdi:language-yaml
name: my-awesome-blocklet
version: 0.1.0
title: My Awesome Blocklet
description: A simple blocklet to demonstrate parsing.
author: 'Jane Doe <jane.doe@example.com>'
```

### 步骤 1：安装

使用 Yarn 或 npm 将 `@blocklet/meta` 软件包添加到您的项目依赖项中。

```shell yarn
yarn add @blocklet/meta
```

或者使用 npm：

```shell npm
npm install @blocklet/meta
```

### 步骤 2：解析 Blocklet 元数据

该库的核心函数是 `parse`。它从给定目录中读取 `blocklet.yml`（或 `blocklet.yaml`），根据 Blocklet 规范验证其内容，应用必要的修复（如标准化 person 字段），并返回一个干净的 JavaScript 对象。

在 `my-blocklet` 目录旁边创建一个名为 `index.js` 的文件，并添加以下代码：

```javascript title="index.js" icon=logos:javascript
const path = require('path');
const { parse } = require('@blocklet/meta');

// 定义 blocklet 根目录的路径
const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  // 解析元数据
  const meta = parse(blockletDir);

  // 打印解析后的元数据对象
  console.log('Successfully parsed blocklet meta:', meta);
} catch (error) {
  console.error('Failed to parse blocklet.yml:', error.message);
}
```

当您运行此脚本（`node index.js`）时，它将输出解析后的元数据对象。

### 预期输出

`parse` 函数不仅读取 YAML 文件，还会将键名转换为驼峰式命名（camelCase），并将像 `author` 这样的复杂字段格式化为结构化对象。

```json Output icon=mdi:code-json
{
  "name": "my-awesome-blocklet",
  "version": "0.1.0",
  "title": "My Awesome Blocklet",
  "description": "A simple blocklet to demonstrate parsing.",
  "author": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  },
  "specVersion": "1.0.0",
  "path": "/path/to/your/project/my-blocklet"
}
```

### 接下来做什么？

您已成功安装 `@blocklet/meta` 并解析了您的第一个 `blocklet.yml`。现在您可以探索更高级的主题。

<x-cards>
  <x-card data-title="Blocklet 规范 (blocklet.yml)" data-icon="lucide:file-text" data-href="/spec">
    了解所有可用字段及其含义，以完全配置您的 blocklet 的行为和外观。
  </x-card>
  <x-card data-title="API 参考" data-icon="lucide:book-open" data-href="/api">
    深入了解完整的 API 文档，发现用于验证、文件处理和安全的其他实用工具。
  </x-card>
</x-cards>