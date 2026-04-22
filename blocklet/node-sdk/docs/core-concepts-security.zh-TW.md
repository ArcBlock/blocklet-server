# 安全實用工具

Blocklet SDK 包含一套健全的安全實用工具，旨在保護您應用程式的資料和通訊。這些工具有助於您處理敏感資訊、確保 API 呼叫的完整性，並預防常見的 Web 漏洞，如跨站請求偽造 (CSRF)。

在深入了解簽名與驗證之前，了解錢包如何管理至關重要，因為它們是這些操作的密碼學基礎。您可以在 [錢包管理](./core-concepts-wallet.md) 章節中了解更多資訊。

## 資料加密與解密

對於靜態儲存敏感資料——例如資料庫中的 API 金鑰或個人使用者資訊——SDK 提供了簡單的對稱式加密與解密函式。這些實用工具使用 AES 加密，並會自動從您的 blocklet 環境變數中衍生金鑰，從而簡化了金鑰管理。

- `encrypt(message)`：加密一個字串。
- `decrypt(message)`：解密一個已加密的字串。

加密金鑰是從 `process.env.BLOCKLET_APP_EK` (作為密碼) 和 `process.env.BLOCKLET_DID` (作為鹽) 衍生而來。請確保這些環境變數在您的 blocklet 執行環境中可用。

```javascript 加密資料 icon=lucide:lock
import { encrypt } from '@blocklet/sdk/security';

const userApiKey = 'sk_live_verySecretValue12345';

// 將資料存入資料庫前先進行加密
const encryptedApiKey = encrypt(userApiKey);

console.log(encryptedApiKey);
// 輸出：一個長長的加密字串
```

若要取回原始資料，請使用 `decrypt` 函式。

```javascript 解密資料 icon=lucide:key-round
import { decrypt } from '@blocklet/sdk/security';

// 假設 'encryptedApiKey' 是從您的資料庫中取得
const encryptedApiKey = 'U2FsdGVkX1...'; // 範例加密字串

const originalApiKey = decrypt(encryptedApiKey);

console.log(originalApiKey);
// 輸出：sk_live_verySecretValue12345
```

## 請求簽名與驗證

為了確保服務之間的資料完整性與真實性，例如在 [元件間通訊](./guides-component-communication.md) 期間，SDK 提供了簽署與驗證資料負載的實用工具。此過程使用 blocklet 的錢包來建立一個密碼學簽名，接收服務可以用它來進行驗證。

### 高階回應簽名

保護整個 API 回應最簡單的方法是使用 `signResponse` 和 `verifyResponse`。這些函式會處理已簽署回應的標準資料結構。

`signResponse(data)`：接收一個 JSON 物件，將其包裝在帶有簽名和時間戳的標準格式中，並傳回新的已簽署物件。

```javascript 簽署 API 回應 icon=lucide:pen-tool
import { signResponse } from '@blocklet/sdk/security';
import express from 'express';

const app = express();

app.get('/api/data', (req, res) => {
  const data = { userId: '123', permissions: ['read'] };
  // signResponse 會添加簽名、pk 和其他元資料
  const signedPayload = signResponse(data);
  res.json(signedPayload);
});
```

`verifyResponse(data)`：接收已簽署的負載，並使用嵌入的公鑰驗證其簽名。

```javascript 驗證已簽署的回應 icon=lucide:shield-check
import { verifyResponse } from '@blocklet/sdk/security';

async function fetchAndVerifyData() {
  const response = await fetch('/api/data');
  const signedPayload = await response.json();

  const isValid = verifyResponse(signedPayload);

  if (isValid) {
    console.log('簽名有效。資料：', signedPayload.data);
  } else {
    console.error('簽名驗證失敗！');
  }
}
```

### 低階簽名

對於需要更多控制的場景，例如在不使用 `signResponse` 提供的包裝結構下簽署特定的資料負載，您可以使用較低階的 `sign` 和 `verify` 實用工具。這些函式對於自訂簽名實作至關重要。

這些實用工具的一個關鍵特性是它們使用穩定的 JSON 字串化過程。這確保了相同的資料物件總是會產生相同的字串表示，這對於生成一致且可驗證的簽名至關重要。

```javascript 低階簽名與驗證 icon=lucide:fingerprint
import { sign, verify } from '@blocklet/sdk/util/verify-sign';

// 待簽署的資料負載
const data = { transactionId: 'xyz-789', amount: 50, currency: 'USD' };

// 1. 使用 blocklet 的錢包生成簽名
const signature = sign(data);
console.log('Signature:', signature);

// 2. 驗證簽名
// 驗證時需要公鑰。
const publicKey = process.env.BLOCKLET_APP_PK;
const isVerified = verify(data, signature, { appPk: publicKey });

console.log('Is Verified:', isVerified);
// 輸出：Is Verified: true
```

要驗證簽名，您必須提供原始資料、簽名字串以及簽署者的公鑰 (`appPk`)。在實際應用中，此公鑰通常會從呼叫服務傳送的請求標頭 (例如 `x-component-sig-pk`) 或從受信任的設定來源中取得。

## CSRF 保護

跨站請求偽造 (CSRF) 是一種誘騙使用者提交惡意請求的攻擊。SDK 的 `csrf` 中介軟體透過實作同步器權杖模式，提供了一個健全且易於使用的解決方案來降低此風險。

它的運作方式是為每個使用者會話建立一個獨特的、基於密鑰的權杖，並要求在任何改變狀態的請求 (如 `POST`、`PUT`、`DELETE`) 中都必須包含該權杖。

### 基本用法

要啟用 CSRF 保護，請將 `csrf` 和 `cookie-parser` 中介軟體加入您的 Express 應用程式中。`cookie-parser` 中介軟體是必要的前置條件。

```javascript 基本 CSRF 保護 icon=lucide:shield
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// csrf 中介軟體需要 cookie-parser 中介軟體才能運作
app.use(cookieParser());

// 將 csrf 中介軟體應用於所有路由
app.use(csrf());

app.post('/api/update-profile', (req, res) => {
  res.json({ message: 'Profile updated successfully!' });
});

// ... 您的其他路由
app.listen(3000);
```

#### 運作方式

1.  **權杖生成**：對於 `GET` 請求，中介軟體會根據使用者的 `login_token` cookie (通常在使用者登入後設定) 自動生成一個 `x-csrf-token` cookie。
2.  **權杖驗證**：對於改變狀態的方法 (`POST`、`PUT`、`PATCH`、`DELETE`)，中介軟體會比較 `x-csrf-token` cookie 的值與 `x-csrf-token` HTTP 標頭的值。如果不匹配，或其中一個缺失，請求將被拒絕並回傳 403 Forbidden 錯誤。
3.  **前端實作**：您的前端應用程式負責讀取 `x-csrf-token` cookie，並在所有改變狀態的 API 呼叫中將其值放在 `x-csrf-token` 標頭中傳送。大多數現代的 HTTP 客戶端 (如 Axios) 都可以設定為自動執行此操作。

### 進階用法

對於更複雜的場景，您可以透過傳遞一個選項物件給 `csrf` 中介軟體來自訂權杖生成和驗證邏輯。這在您需要以不同方式處理權杖時很有用，例如將它們儲存在會話中或使用自訂的請求標頭。

下面的範例示範了如何覆寫預設行為以實現：
1.  根據儲存在會話中的 `userId` 生成權杖。
2.  透過 `res.locals` 將權杖傳遞給前端，而不是透過 cookie。
3.  從自訂的 `x-custom-csrf-token` 標頭中驗證權杖。

```javascript 進階 CSRF 保護 icon=lucide:shield-alert
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { csrf } from '@blocklet/sdk/middlewares';
import { sign, verify, getCsrfSecret } from '@blocklet/sdk/util/csrf';

const app = express();

app.use(cookieParser());
app.use(session({ secret: 'custom-session-secret', resave: false, saveUninitialized: true }));

// 使用自訂權杖處理的進階用法
app.use(csrf({
  // 自訂邏輯以生成並提供權杖
  generateToken: (req, res) => {
    if (req.session.userId) {
      const token = sign(getCsrfSecret(), req.session.userId);
      // 使權杖可供範本引擎使用
      res.locals.csrfToken = token;
    }
  },
  // 自訂邏輯以從自訂標頭驗證權杖
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

// 一個使用自訂權杖呈現表單的路由
app.get('/form', (req, res, next) => {
  // 模擬使用者會話以供示範
  req.session.userId = `user_${Date.now()}`;
  
  // 需要呼叫 generateToken 函式來設定權杖
  // 在實際應用中，這可能是更廣泛的中介軟體的一部分
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

// 一個處理提交的路由
app.post('/submit', (req, res) => {
  // 如果程式執行到這裡，表示自訂的 verifyToken 邏輯已通過。
  res.send('Form submitted successfully!');
});

// 錯誤處理器以捕捉並顯示 CSRF 錯誤
app.use((err, req, res, next) => {
  if (err.message.includes('CSRF')) {
    res.status(403).send(err.message);
  } else {
    next(err);
  }
});

app.listen(3000);
```

現在您已了解這些核心安全概念，您更能建構安全可靠的應用程式。要了解這些工具在實務中的應用，請繼續閱讀 [身份驗證](./authentication.md) 指南。