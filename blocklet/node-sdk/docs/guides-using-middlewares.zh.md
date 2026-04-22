# 使用 Web 服务器中间件

Blocklet SDK 捆绑了一套功能强大、即用型的 Express.js 中间件。这些工具旨在处理常见的 Web 开发挑战，如安全性、SEO 和单页应用程序（SPA）路由，让你可以用更少的样板代码构建更健壮、功能更丰富的 blocklet。

本指南将引导你了解最重要的中间件以及如何将它们集成到你的应用程序中。

## CSRF 保护

跨站请求伪造（CSRF）是一种常见的 Web 安全漏洞。SDK 的 `csrf` 中间件提供了一种简单直接的方法来保护你的应用程序免受此类攻击。

它的工作原理是为每个用户会话创建一个唯一的令牌，并要求在任何改变状态的请求（如 `POST` 或 `PUT`）中发送该令牌。

**用法**

要启用 CSRF 保护，只需将 `csrf` 和 `cookie-parser` 中间件添加到你的 Express 应用程序中即可。

```javascript Express.js Server Setup icon=logos:express
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// cookie-parser is required for the csrf middleware to work
app.use(cookieParser());

// Apply the csrf middleware globally
app.use(csrf());

app.post('/api/data', (req, res) => {
  res.json({ message: 'Data updated successfully!' });
});

// Your other routes...
app.listen(3000);
```

**工作原理**

1.  **令牌生成**：对于 `GET` 请求，中间件会根据用户的 `login_token` 自动生成一个 `x-csrf-token` cookie。
2.  **令牌验证**：对于 `POST`、`PUT`、`PATCH` 和 `DELETE` 请求，它会将 `x-csrf-token` cookie 与 `x-csrf-token` HTTP 标头的值进行比较。如果它们不匹配，请求将被拒绝。
3.  **前端实现**：你的前端客户端负责读取 `x-csrf-token` cookie，并在所有后续的状态变更 API 调用中，在 `x-csrf-token` 标头中发送其值。

## 站点地图生成

站点地图对于 SEO 至关重要，因为它能帮助搜索引擎发现并索引你的应用程序页面。`sitemap` 中间件可以自动创建一个合规的 `sitemap.xml` 文件。

**用法**

你提供一个生成器函数，将应用程序的 URL 写入流中。中间件会处理剩下的事情。

```javascript Sitemap Generation icon=mdi:file-xml-box
import express from 'express';
import { sitemap } from '@blocklet/sdk/middlewares';

const app = express();

// A mock function to get dynamic data
const getBlogPosts = async () => [
  { slug: 'my-first-post', updatedAt: new Date() },
  { slug: 'my-second-post', updatedAt: new Date() },
];

app.get('/sitemap.xml', sitemap(async (stream) => {
  // 1. Add static pages
  stream.write({ url: '/' });
  stream.write({ url: '/about' });
  stream.write({ url: '/contact' });

  // 2. Add dynamic pages from a database or API
  const posts = await getBlogPosts();
  posts.forEach(post => {
    stream.write({ url: `/blog/${post.slug}`, lastmod: post.updatedAt });
  });
}));

app.listen(3000);
```

当用户或搜索引擎爬虫访问 `/sitemap.xml` 时，此端点将返回一个动态生成的 XML 站点地图。

## 针对单页应用的 SPA 回退

单页应用程序（SPA）在客户端处理路由，这可能给 SEO 和直接 URL 访问带来问题。`fallback` 中间件通过确保所有非静态资源请求都返回你的主 `index.html` 文件来解决这个问题，同时允许你为 SEO 和社交分享注入动态元数据。

**用法**

`fallback` 中间件通常应放置在中间件链的末尾，以捕获任何未被其他路由（如 API 端点或静态文件服务器）处理的 GET 请求。

```javascript SPA Fallback Setup icon=logos:react
import express from 'express';
import path from 'path';
import { fallback } from '@blocklet/sdk/middlewares';
import { env } from '@blocklet/sdk/config';

const app = express();
const publicPath = path.join(__dirname, '../dist');

// Serve static assets like CSS, JS, and images
app.use(express.static(publicPath));

// Your API routes go here
app.get('/api/user', (req, res) => res.json({ name: 'John Doe' }));

// The fallback middleware handles all other GET requests
app.use(fallback('index.html', {
  root: publicPath,
  // Dynamically set meta tags based on the request path
  async getPageData(req) {
    if (req.path.startsWith('/posts/')) {
      const postId = req.path.split('/').pop();
      const post = await getPostById(postId); // Fetch post data
      return {
        title: post.title,
        description: post.summary,
        ogImage: post.featuredImage,
      };
    }
    // Default metadata for other pages
    return {
      title: env.appName,
      description: env.appDescription,
    };
  },
}));

app.listen(3000);
```

**主要功能**

*   **动态元数据**：`getPageData` 函数是核心功能，它允许你返回特定页面的 `title`、`description` 和 `ogImage` 标签，这些标签随后会被注入到 HTML 响应中。
*   **自动注入**：中间件会自动将必需的 Blocklet JavaScript (`__blocklet__.js`) 和主题样式注入到 HTML 中，确保与 Blocklet Server 环境无缝集成。
*   **缓存**：它包含一个内存缓存，以提高频繁访问页面的性能。

<x-cards>
  <x-card data-title="身份验证" data-icon="lucide:lock" data-href="/authentication">
    了解如何使用强大的身份验证和授权中间件来保护你的应用程序。
  </x-card>
  <x-card data-title="API 参考" data-icon="lucide:book-open" data-href="/api-reference">
    探索中间件和其他 SDK 实用程序的完整 API，以满足高级用例的需求。
  </x-card>
</x-cards>