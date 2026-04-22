# 使用 Web Server 中介軟體

Blocklet SDK 隨附一套功能強大、立即可用的 Express.js 中介軟體。這些工具旨在處理常見的 Web 開發挑戰，如安全性、SEO 和單頁應用程式（SPA）路由，讓您可以用更少的樣板程式碼建構更穩健、功能更豐富的 blocklet。

本指南將引導您了解最重要的中介軟體，以及如何將它們整合到您的應用程式中。

## CSRF 保護

跨站請求偽造（Cross-Site Request Forgery, CSRF）是一種常見的 Web 安全漏洞。SDK 的 `csrf` 中介軟體提供了一種簡單直接的方法來保護您的應用程式免受此類攻擊。

其運作方式是為每個使用者會話建立一個唯一的權杖，並要求在任何會改變狀態的請求（如 `POST` 或 `PUT`）中傳送該權杖。

**用法**

若要啟用 CSRF 保護，只需將 `csrf` 和 `cookie-parser` 中介軟體新增至您的 Express 應用程式即可。

```javascript Express.js Server Setup icon=logos:express
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// csrf 中介軟體需要 cookie-parser 才能運作
app.use(cookieParser());

// 全域套用 csrf 中介軟體
app.use(csrf());

app.post('/api/data', (req, res) => {
  res.json({ message: '資料更新成功！' });
});

// 您的其他路由...
app.listen(3000);
```

**運作方式**

1.  **權杖生成**：對於 `GET` 請求，中介軟體會根據使用者的 `login_token` 自動產生一個 `x-csrf-token` cookie。
2.  **權杖驗證**：對於 `POST`、`PUT`、`PATCH` 和 `DELETE` 請求，它會比較 `x-csrf-token` cookie 與 `x-csrf-token` HTTP 標頭的值。如果不匹配，請求將被拒絕。
3.  **前端實作**：您的前端客戶端負責讀取 `x-csrf-token` cookie，並在所有後續會改變狀態的 API 呼叫中，將其值在 `x-csrf-token` 標頭中傳送。

## Sitemap 產生

Sitemap 對於 SEO 至關重要，因為它能幫助搜尋引擎發現並索引您應用程式的頁面。`sitemap` 中介軟體會自動建立一個符合規範的 `sitemap.xml` 檔案。

**用法**

您需要提供一個產生器函式，將您應用程式的 URL 寫入一個資料流中。剩下的工作由中介軟體處理。

```javascript Sitemap Generation icon=mdi:file-xml-box
import express from 'express';
import { sitemap } from '@blocklet/sdk/middlewares';

const app = express();

// 一個用於取得動態資料的模擬函式
const getBlogPosts = async () => [
  { slug: 'my-first-post', updatedAt: new Date() },
  { slug: 'my-second-post', updatedAt: new Date() },
];

app.get('/sitemap.xml', sitemap(async (stream) => {
  // 1. 新增靜態頁面
  stream.write({ url: '/' });
  stream.write({ url: '/about' });
  stream.write({ url: '/contact' });

  // 2. 從資料庫或 API 新增動態頁面
  const posts = await getBlogPosts();
  posts.forEach(post => {
    stream.write({ url: `/blog/${post.slug}`, lastmod: post.updatedAt });
  });
}));

app.listen(3000);
```

當使用者或搜尋引擎爬蟲造訪 `/sitemap.xml` 時，此端點將回傳一個動態產生的 XML sitemap。

## 為單頁應用程式提供 SPA Fallback

單頁應用程式（SPA）在客戶端處理路由，這可能對 SEO 和直接 URL 存取造成問題。`fallback` 中介軟體透過確保所有非資產請求都提供您的主 `index.html` 檔案來解決此問題，同時允許您為 SEO 和社群分享注入動態元資料。

**用法**

`fallback` 中介軟體通常應放置在中介軟體鏈的末端，以攔截任何未被其他路由（如 API 端點或靜態檔案伺服器）處理的 GET 請求。

```javascript SPA Fallback Setup icon=logos:react
import express from 'express';
import path from 'path';
import { fallback } from '@blocklet/sdk/middlewares';
import { env } from '@blocklet/sdk/config';

const app = express();
const publicPath = path.join(__dirname, '../dist');

// 提供 CSS、JS 和圖片等靜態資產
app.use(express.static(publicPath));

// 您的 API 路由放在這裡
app.get('/api/user', (req, res) => res.json({ name: 'John Doe' }));

// fallback 中介軟體處理所有其他的 GET 請求
app.use(fallback('index.html', {
  root: publicPath,
  // 根據請求路徑動態設定 meta 標籤
  async getPageData(req) {
    if (req.path.startsWith('/posts/')) {
      const postId = req.path.split('/').pop();
      const post = await getPostById(postId); // 取得貼文資料
      return {
        title: post.title,
        description: post.summary,
        ogImage: post.featuredImage,
      };
    }
    // 其他頁面的預設元資料
    return {
      title: env.appName,
      description: env.appDescription,
    };
  },
}));

app.listen(3000);
```

**主要功能**

*   **動態元資料**：`getPageData` 函式是核心功能，讓您能夠回傳特定頁面的 `title`、`description` 和 `ogImage` 標籤，這些標籤隨後會被注入到 HTML 回應中。
*   **自動注入**：中介軟體會自動將必要的 Blocklet JavaScript (`__blocklet__.js`) 和主題樣式注入到 HTML 中，確保與 Blocklet Server 環境無縫整合。
*   **快取**：它包含一個記憶體內快取，以提高頻繁存取頁面的效能。

<x-cards>
  <x-card data-title="身份驗證" data-icon="lucide:lock" data-href="/authentication">
    了解如何使用強大的身份驗證和授權中介軟體來保護您的應用程式。
  </x-card>
  <x-card data-title="API 參考" data-icon="lucide:book-open" data-href="/api-reference">
    探索中介軟體和其他 SDK 工具的完整 API，以應對進階使用案例。
  </x-card>
</x-cards>