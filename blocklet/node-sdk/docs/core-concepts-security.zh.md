# 安全工具

Blocklet SDK 包含一套强大的安全工具，旨在保护您的应用程序数据和通信。这些工具可帮助您处理敏感信息，确保 API 调用的完整性，并防止跨站请求伪造（CSRF）等常见的 Web 漏洞。

在深入了解签名和验证之前，有必要了解钱包是如何管理的，因为它们是这些操作的加密基础。您可以在 [钱包管理](./core-concepts-wallet.md) 部分了解更多信息。

## 数据加密与解密

为了静态存储敏感数据——例如数据库中的 API 密钥或个人用户信息——SDK 提供了简单的对称加密和解密函数。这些工具使用 AES 加密，并自动从您的 blocklet 的环境变量中派生密钥，从而简化了密钥管理。

- `encrypt(message)`: 加密一个字符串。
- `decrypt(message)`: 解密一个已加密的字符串。

加密密钥由 `process.env.BLOCKLET_APP_EK`（作为密码）和 `process.env.BLOCKLET_DID`（作为盐）派生而来。请确保这些环境变量在您的 blocklet 运行环境中可用。

```javascript 加密数据 icon=lucide:lock
import { encrypt } from '@blocklet/sdk/security';

const userApiKey = 'sk_live_verySecretValue12345';

// 在将数据保存到数据库之前对其进行加密
const encryptedApiKey = encrypt(userApiKey);

console.log(encryptedApiKey);
// 输出：一个长加密字符串
```

要检索原始数据，请使用 `decrypt` 函数。

```javascript 解密数据 icon=lucide:key-round
import { decrypt } from '@blocklet/sdk/security';

// 假设 'encryptedApiKey' 是从数据库中获取的
const encryptedApiKey = 'U2FsdGVkX1...'; // 加密字符串示例

const originalApiKey = decrypt(encryptedApiKey);

console.log(originalApiKey);
// 输出：sk_live_verySecretValue12345
```

## 请求签名与验证

为了确保服务之间数据的完整性和真实性，例如在[组件间通信](./guides-component-communication.md)期间，SDK 提供了对数据负载进行签名和验证的工具。此过程使用 blocklet 的钱包创建一个加密签名，接收方服务可以对此签名进行验证。

### 高级响应签名

保护整个 API 响应的最简单方法是使用 `signResponse` 和 `verifyResponse`。这些函数处理已签名响应的标准数据结构。

`signResponse(data)`: 接收一个 JSON 对象，将其包装在带有签名和时间戳的标准格式中，并返回新的签名对象。

```javascript 签名 API 响应 icon=lucide:pen-tool
import { signResponse } from '@blocklet/sdk/security';
import express from 'express';

const app = express();

app.get('/api/data', (req, res) => {
  const data = { userId: '123', permissions: ['read'] };
  // signResponse 会添加签名、公钥和其他元数据
  const signedPayload = signResponse(data);
  res.json(signedPayload);
});
```

`verifyResponse(data)`: 接收签名后的负载，并使用嵌入的公钥验证其签名。

```javascript 验证已签名的响应 icon=lucide:shield-check
import { verifyResponse } from '@blocklet/sdk/security';

async function fetchAndVerifyData() {
  const response = await fetch('/api/data');
  const signedPayload = await response.json();

  const isValid = verifyResponse(signedPayload);

  if (isValid) {
    console.log('Signature is valid. Data:', signedPayload.data);
  } else {
    console.error('Signature verification failed!');
  }
}
```

### 低级签名

对于需要更多控制的场景，例如在不使用 `signResponse` 提供的包装结构的情况下对特定数据负载进行签名，您可以使用更底层的 `sign` 和 `verify` 工具。这些函数对于自定义签名实现至关重要。

这些工具的一个关键特性是它们使用稳定的 JSON 字符串化过程。这确保了相同的数据对象总是会产生相同的字符串表示，这对于生成一致且可验证的签名至关重要。

```javascript 低级签名与验证 icon=lucide:fingerprint
import { sign, verify } from '@blocklet/sdk/util/verify-sign';

// 待签名的数据负载
const data = { transactionId: 'xyz-789', amount: 50, currency: 'USD' };

// 1. 使用 blocklet 的钱包生成签名
const signature = sign(data);
console.log('Signature:', signature);

// 2. 验证签名
// 验证需要公钥。
const publicKey = process.env.BLOCKLET_APP_PK;
const isVerified = verify(data, signature, { appPk: publicKey });

console.log('Is Verified:', isVerified);
// 输出：Is Verified: true
```

要验证签名，您必须提供原始数据、签名字符串以及签名者的公钥（`appPk`）。在实际应用中，此公钥通常会从调用服务发送的请求头（例如 `x-component-sig-pk`）或受信任的配置源中检索。

## CSRF 保护

跨站请求伪造（CSRF）是一种诱骗用户提交恶意请求的攻击。SDK 的 `csrf` 中间件通过实现同步器令牌模式，提供了一个强大且易于使用的解决方案来降低此风险。

它的工作原理是为每个用户会话创建唯一的、基于密钥的令牌，并要求在任何改变状态的请求（如 `POST`、`PUT`、`DELETE`）中都必须包含该令牌。

### 基本用法

要启用 CSRF 保护，请将 `csrf` 和 `cookie-parser` 中间件添加到您的 Express 应用程序中。`cookie-parser` 中间件是必需的。

```javascript 基本 CSRF 保护 icon=lucide:shield
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// csrf 中间件需要 cookie-parser 中间件才能工作
app.use(cookieParser());

// 将 csrf 中间件应用于所有路由
app.use(csrf());

app.post('/api/update-profile', (req, res) => {
  res.json({ message: 'Profile updated successfully!' });
});

// ... 您的其他路由
app.listen(3000);
```

#### 工作原理

1.  **令牌生成**：对于 `GET` 请求，中间件会根据用户的 `login_token` Cookie（通常在用户登录后设置）自动生成一个 `x-csrf-token` Cookie。
2.  **令牌验证**：对于改变状态的方法（`POST`、`PUT`、`PATCH`、`DELETE`），中间件会比较 `x-csrf-token` Cookie 的值与 `x-csrf-token` HTTP 头的值。如果它们不匹配或其中一个缺失，请求将被拒绝，并返回 403 Forbidden 错误。
3.  **前端实现**：您的前端应用程序负责读取 `x-csrf-token` Cookie，并在所有改变状态的 API 调用中将其值放在 `x-csrf-token` 请求头中发送。大多数现代 HTTP 客户端（如 Axios）可以配置为自动执行此操作。

### 高级用法

对于更复杂的场景，您可以通过向 `csrf` 中间件传递一个选项对象来自定义令牌生成和验证逻辑。如果您需要以不同方式处理令牌，例如将其存储在会话中或使用自定义请求头，这将非常有用。

下面的示例演示了如何覆盖默认行为以实现：
1.  根据会话中存储的 `userId` 生成令牌。
2.  通过 `res.locals` 而不是 Cookie 将令牌传递给前端。
3.  从自定义的 `x-custom-csrf-token` 请求头中验证令牌。

```javascript 高级 CSRF 保护 icon=lucide:shield-alert
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { csrf } from '@blocklet/sdk/middlewares';
import { sign, verify, getCsrfSecret } from '@blocklet/sdk/util/csrf';

const app = express();

app.use(cookieParser());
app.use(session({ secret: 'custom-session-secret', resave: false, saveUninitialized: true }));

// 带有自定义令牌处理的高级用法
app.use(csrf({
  // 自定义生成和提供令牌的逻辑
  generateToken: (req, res) => {
    if (req.session.userId) {
      const token = sign(getCsrfSecret(), req.session.userId);
      // 使令牌可用于模板引擎
      res.locals.csrfToken = token;
    }
  },
  // 自定义从自定义请求头验证令牌的逻辑
  verifyToken: (req) => {
    const token = req.headers['x-custom-csrf-token'];
    const userId = req.session.userId;

    if (!token || !userId) {
      throw new Error('CSRF token or user session not found.');
    }

    if (!verify(getCsrfSecret(), token, userId)) {
      throw new Error('Invalid CSRF token.');
    }
  }
}));

// 一个使用自定义令牌渲染表单的路由
app.get('/form', (req, res, next) => {
  // 模拟用户会话以进行演示
  req.session.userId = `user_${Date.now()}`;
  
  // 需要调用 generateToken 函数来设置令牌
  // 在实际应用中，这可能是更广泛的中间件的一部分
  const generate = res.locals.generateToken;
  generate(req, res);

  res.send(`
    <h3>Advanced CSRF Example</h3>
    <form id="myForm">
      <input type="text" name="data" value="some-data">
      <button type="submit">Submit</button>
    </form>
    <script>
      const form = document.getElementById('myForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const response = await fetch('/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-csrf-token': '${res.locals.csrfToken}'
            },
            body: JSON.stringify({ data: 'some-data' })
          });
          const result = await response.text();
          alert('Response: ' + result);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    </script>
  `);
});

// 处理提交的路由
app.post('/submit', (req, res) => {
  // 如果能执行到这里，说明自定义的 verifyToken 逻辑已通过。
  res.send('Form submitted successfully!');
});

// 错误处理程序，用于捕获和显示 CSRF 错误
app.use((err, req, res, next) => {
  if (err.message.includes('CSRF')) {
    res.status(403).send(err.message);
  } else {
    next(err);
  }
});

app.listen(3000);
```

现在您已经了解了这些核心安全概念，可以更好地构建安全可靠的应用程序。要了解这些工具在实践中的应用，请继续阅读 [身份验证](./authentication.md) 指南。