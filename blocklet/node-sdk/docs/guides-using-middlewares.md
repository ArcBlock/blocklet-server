# Using Web Server Middlewares

The Blocklet SDK comes bundled with a suite of powerful, ready-to-use middlewares for Express.js. These tools are designed to handle common web development challenges like security, SEO, and single-page application (SPA) routing, allowing you to build more robust and feature-rich blocklets with less boilerplate code.

This guide will walk you through the most essential middlewares and how to integrate them into your application.

## CSRF Protection

Cross-Site Request Forgery (CSRF) is a common web security vulnerability. The SDK's `csrf` middleware provides a straightforward way to protect your application against such attacks.

It works by creating a unique token for each user session and requiring that token to be sent with any state-changing request (like `POST` or `PUT`).

**Usage**

To enable CSRF protection, simply add the `csrf` and `cookie-parser` middlewares to your Express application.

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

**How It Works**

1.  **Token Generation**: For `GET` requests, the middleware automatically generates a `x-csrf-token` cookie based on the user's `login_token`.
2.  **Token Verification**: For `POST`, `PUT`, `PATCH`, and `DELETE` requests, it compares the `x-csrf-token` cookie with the value of the `x-csrf-token` HTTP header. If they don't match, the request is rejected.
3.  **Frontend Implementation**: Your frontend client is responsible for reading the `x-csrf-token` cookie and sending its value in the `x-csrf-token` header for all subsequent state-changing API calls.

## Sitemap Generation

A sitemap is crucial for SEO, as it helps search engines discover and index your application's pages. The `sitemap` middleware automates the creation of a compliant `sitemap.xml` file.

**Usage**

You provide a generator function that writes your application's URLs to a stream. The middleware handles the rest.

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

When a user or search engine crawler visits `/sitemap.xml`, this endpoint will return a dynamically generated XML sitemap.

## SPA Fallback for Single-Page Applications

Single-Page Applications (SPAs) handle routing on the client side, which can be problematic for SEO and direct URL access. The `fallback` middleware solves this by ensuring that all non-asset requests serve your main `index.html` file while allowing you to inject dynamic metadata for SEO and social sharing.

**Usage**

The `fallback` middleware should typically be placed at the end of your middleware chain to catch any GET requests that haven't been handled by other routes (like API endpoints or static file servers).

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

**Key Features**

*   **Dynamic Metadata**: The `getPageData` function is the core feature, allowing you to return page-specific `title`, `description`, and `ogImage` tags, which are then injected into the HTML response.
*   **Automatic Injections**: The middleware automatically injects the necessary Blocklet JavaScript (`__blocklet__.js`) and theme styles into the HTML, ensuring seamless integration with the Blocklet Server environment.
*   **Caching**: It includes an in-memory cache to improve performance for frequently accessed pages.

<x-cards>
  <x-card data-title="Authentication" data-icon="lucide:lock" data-href="/authentication">
    Learn how to secure your application with robust authentication and authorization middlewares.
  </x-card>
  <x-card data-title="API Reference" data-icon="lucide:book-open" data-href="/api-reference">
    Explore the full API for middlewares and other SDK utilities for advanced use cases.
  </x-card>
</x-cards>