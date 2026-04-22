# 快速入门

本指南将引导您完成安装 Blocklet SDK 并启动一个最小化应用程序的基本步骤。我们的目标是帮助您在短短几分钟内从零开始，得到一个可以正常工作的示例。

## 先决条件

在开始之前，请确保您已设置好一个 Blocklet 项目。如果您还没有，请按照 [Blocklet 开发文档](https://www.arcblock.io/docs/createblocklet/create-single-blocklet) 创建一个。

## 第一步：安装 SDK

导航至您的 Blocklet 项目目录，并将 `@blocklet/sdk` 包添加为依赖项。

```bash Terminal icon=lucide:terminal
npm install @blocklet/sdk

# 或者使用 yarn
yarn add @blocklet/sdk
```

## 第二步：了解环境

Blocklet SDK 依赖于 Blocklet Server 在您的应用程序运行时自动注入的环境变量。这些变量为您的应用程序提供有关其环境的上下文，例如其应用 ID、名称和密钥。

SDK 包含一个实用工具，用于验证所有必要的环境变量都已存在。虽然您通常不需要手动设置这些变量，但了解它们是很有好处的。

以下是 SDK 使用的一些关键环境变量：

| 变量名 | 描述 |
| :--- | :--- |
| `BLOCKLET_APP_ID` | 您的 Blocklet 的唯一标识符。 |
| `BLOCKLET_APP_SK` | 您的 Blocklet 的密钥，用于签名请求。 |
| `BLOCKLET_APP_NAME` | 您的 Blocklet 的名称。 |
| `BLOCKLET_APP_URL` | 您的 Blocklet 的公共 URL。 |
| `BLOCKLET_DATA_DIR` | 您的 Blocklet 可用于存储持久数据的目录。 |
| `ABT_NODE_DID` | Blocklet 运行所在节点的 DID。 |

有关配置的更详细信息，请参阅 [配置与环境](./core-concepts-configuration.md) 指南。

## 第三步：创建一个最小化的服务器

现在，让我们创建一个简单的 Express.js 服务器来实际体验 SDK。创建一个名为 `app.js` 的文件（或您项目的主入口文件），并添加以下代码。

此示例演示了如何：
1.  从 SDK 导入 `env` 对象以访问环境信息。
2.  设置一个基本的 Express 服务器。
3.  创建一个返回 Blocklet 应用名称的根端点。

```javascript app.js icon=logos:javascript
const express = require('express');
const { env } = require('@blocklet/sdk');

// 全局错误处理程序是生产应用程序的一个良好实践。
process
  .on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', (reason)?.message || reason);
    process.exit(1);
  });

const app = express();
const port = process.env.BLOCKLET_PORT || 3000;

app.get('/', (req, res) => {
  // `env` 对象提供了对所有 Blocklet 环境变量的类型化访问。
  res.send(`Hello from ${env.appName}!`);
});

app.listen(port, () => {
  console.log(`Blocklet listening on port ${port}`);
  console.log(`Visit your Blocklet at: ${env.appUrl}`);
});
```

## 第四步：运行您的 Blocklet

服务器代码准备就绪后，您现在可以运行您的 Blocklet。使用 Blocklet CLI 启动开发服务器：

```bash Terminal icon=lucide:terminal
blocklet dev
```

服务器启动后，您将看到一条包含访问您应用程序 URL 的消息。在浏览器中打开该 URL，您应该会看到消息：`Hello from [Your Blocklet Name]!`

## 后续步骤

恭喜！您已成功设置 Blocklet SDK 并构建了一个最小化的应用程序。

为了继续学习，我们建议您探索支撑 SDK 的基本概念。

<x-card data-title="核心概念" data-icon="lucide:graduation-cap" data-href="/core-concepts" data-cta="阅读更多">
了解支撑 Blocklet SDK 的基本概念，从配置管理到钱包处理和安全性。
</x-card>