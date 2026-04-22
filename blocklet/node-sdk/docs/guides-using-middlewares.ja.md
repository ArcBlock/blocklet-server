# Webサーバーミドルウェアの使用

Blocklet SDKには、Express.js用の強力ですぐに使えるミドルウェア群がバンドルされています。これらのツールは、セキュリティ、SEO、シングルページアプリケーション（SPA）ルーティングといった一般的なWeb開発の課題に対処するために設計されており、より少ない定型コードで、より堅牢で機能豊富なブロックレットを構築することができます。

このガイドでは、最も重要なミドルウェアと、それらをアプリケーションに統合する方法について説明します。

## CSRF保護

クロスサイトリクエストフォージェリ（CSRF）は、一般的なWebセキュリティの脆弱性です。SDKの`csrf`ミドルウェアは、このような攻撃からアプリケーションを保護する簡単な方法を提供します。

これは、各ユーザーセッションに一意のトークンを作成し、状態を変更するリクエスト（`POST`や`PUT`など）でそのトークンの送信を要求することで機能します。

**使用方法**

CSRF保護を有効にするには、`csrf`および`cookie-parser`ミドルウェアをExpressアプリケーションに追加するだけです。

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

**仕組み**

1.  **トークン生成**: `GET`リクエストに対して、ミドルウェアはユーザーの`login_token`を基に`x-csrf-token`クッキーを自動的に生成します。
2.  **トークン検証**: `POST`、`PUT`、`PATCH`、および`DELETE`リクエストに対して、`x-csrf-token`クッキーと`x-csrf-token` HTTPヘッダーの値を比較します。一致しない場合、リクエストは拒否されます。
3.  **フロントエンド実装**: フロントエンドクライアントは、`x-csrf-token`クッキーを読み取り、その後のすべての状態を変更するAPI呼び出しで、その値を`x-csrf-token`ヘッダーで送信する責任があります。

## サイトマップ生成

サイトマップは、検索エンジンがアプリケーションのページを発見しインデックス付けするのに役立つため、SEOにとって非常に重要です。`sitemap`ミドルウェアは、準拠した`sitemap.xml`ファイルの作成を自動化します。

**使用方法**

アプリケーションのURLをストリームに書き込むジェネレーター関数を提供します。残りの処理はミドルウェアが担当します。

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

ユーザーまたは検索エンジンのクローラーが`/sitemap.xml`にアクセスすると、このエンドポイントは動的に生成されたXMLサイトマップを返します。

## シングルページアプリケーションのSPAフォールバック

シングルページアプリケーション（SPA）はクライアント側でルーティングを処理するため、SEOやURLへの直接アクセスで問題が生じることがあります。`fallback`ミドルウェアは、アセット以外のすべてのリクエストに対してメインの`index.html`ファイルを提供し、SEOやソーシャルシェアリングのための動的メタデータを注入できるようにすることで、この問題を解決します。

**使用方法**

`fallback`ミドルウェアは通常、ミドルウェアチェーンの最後に配置し、他のルート（APIエンドポイントや静的ファイルサーバーなど）で処理されなかったGETリクエストを捕捉するようにします。

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

**主な機能**

*   **動的メタデータ**: `getPageData`関数が中心的な機能であり、ページ固有の`title`、`description`、`ogImage`タグを返すことができます。これらのタグはHTMLレスポンスに注入されます。
*   **自動注入**: ミドルウェアは、必要なBlocklet JavaScript（`__blocklet__.js`）とテーマスタイルをHTMLに自動的に注入し、Blocklet Server環境とのシームレスな統合を実現します。
*   **キャッシング**: 頻繁にアクセスされるページのパフォーマンスを向上させるためのインメモリキャッシュが含まれています。

<x-cards>
  <x-card data-title="認証" data-icon="lucide:lock" data-href="/authentication">
    堅牢な認証および認可ミドルウェアを使用してアプリケーションを保護する方法を学びます。
  </x-card>
  <x-card data-title="APIリファレンス" data-icon="lucide:book-open" data-href="/api-reference">
    高度なユースケース向けに、ミドルウェアやその他のSDKユーティリティの完全なAPIを探索します。
  </x-card>
</x-cards>