# Session 中介軟體

`session` 中介軟體是 Blocklet SDK 驗證系統的核心元件。它充當您 Express.js 路由的守門員，驗證請求者的身份，並在成功驗證後，將一個 `SessionUser` 物件附加到 `req.user` 屬性上。這讓後續的中介軟體和路由處理程式可以輕鬆存取已驗證的使用者資訊。

該中介軟體非常靈活，原生支援多種驗證策略，包括來自 [DID Connect](./authentication-did-connect.md) 的登入權杖、程式化存取金鑰以及安全的元件間呼叫。

## 運作方式

Session 中介軟體會按照特定的優先順序檢查傳入請求中的憑證。如果找到有效的憑證，它會填充 `req.user` 並將控制權交給下一個處理程式。如果沒有找到有效的憑證，其行為取決於 `strictMode` 是否啟用。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Session Middleware](assets/diagram/session-middleware-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

如果在您的 blocklet 設定中開啟了 `enableBlacklist` 功能，還會執行額外的安全檢查。在驗證登入權杖之前，中介軟體會呼叫一個服務 API，以確保該權杖未被撤銷或封鎖。

## 基本用法

您可以將 `session` 中介軟體應用於整個應用程式，或應用於需要驗證的特定路由。

```javascript Applying Session Middleware icon=logos:express
import express from 'express';
import session from '@blocklet/sdk/middlewares/session';

const app = express();

// 套用到所有路由
app.use(session());

// 或套用到必須受保護的特定路由
app.get('/api/profile', session({ strictMode: true }), (req, res) => {
  // 在嚴格模式下，如果 req.user 不存在，中介軟體會已送出 401 回應。
  if (req.user) {
    res.json(req.user);
  }
});

// 一個對已登入使用者有不同行為的公開路由
app.get('/api/info', session(), (req, res) => {
  if (req.user) {
    res.json({ message: `Hello, ${req.user.fullName}`});
  } else {
    // 在非嚴格模式下，對於未經驗證的使用者，req.user 是 undefined
    res.json({ message: 'Hello, guest.' });
  }
});

app.listen(3000, () => {
  console.log('伺服器正在 3000 連接埠上執行');
});
```

## 設定選項

`sessionMiddleware` 函式接受一個可選的設定物件，以自訂其行為。

<x-field data-name="strictMode" data-type="boolean" data-default="false" data-desc="若為 `true`，無效或遺失的權杖會導致 `401 Unauthorized` 回應。若為 `false`，它會呼叫 `next()` 但不帶有 `user` 物件，將請求視為未經驗證。"></x-field>

<x-field data-name="loginToken" data-type="boolean" data-default="true" data-desc="啟用透過標準 JWT 登入權杖進行驗證，通常來自 DID Connect，可在 `login_token` cookie 中找到。"></x-field>

<x-field data-name="accessKey" data-type="boolean" data-default="false" data-desc="啟用透過長期有效的存取金鑰（例如，用於 CI/CD 或腳本）進行驗證。這些金鑰也會從 `login_token` cookie 中讀取。"></x-field>

<x-field data-name="componentCall" data-type="boolean" data-default="false" data-desc="為來自其他元件的安全、已簽署的請求啟用驗證，使用像 `x-component-sig` 這樣的標頭進行驗證。"></x-field>

<x-field data-name="signedToken" data-type="boolean" data-default="false" data-desc="啟用透過作為查詢參數傳遞的臨時、已簽署的 JWT 進行驗證。"></x-field>

<x-field data-name="signedTokenKey" data-type="string" data-default="__jwt" data-desc="用於 `signedToken` 驗證的查詢參數名稱。"></x-field>

### 設定範例

<x-cards>
  <x-card data-title="嚴格的 API 端點" data-icon="lucide:shield-check">
    對於必須受保護的端點，`strictMode` 可確保未經驗證的請求立即被拒絕。

    ```javascript
    app.use('/api/admin', session({ strictMode: true }));
    ```
  </x-card>
  <x-card data-title="啟用存取金鑰" data-icon="lucide:key-round">
    若要允許腳本或服務與使用者會話一起進行程式化存取，請啟用 `accessKey` 驗證。

    ```javascript
    app.use('/api/data', session({ accessKey: true }));
    ```
  </x-card>
</x-cards>

## SessionUser 物件

驗證成功後，`req.user` 物件會被填充以下結構。此物件提供有關已驗證使用者或元件的基本資訊。

<x-field data-name="user" data-type="object" data-desc="驗證成功後附加到 `req.user` 的 SessionUser 物件。">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="使用者的去中心化識別碼（DID）。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="分配給使用者的角色（例如 `owner`、`admin`、`guest`）。"></x-field>
  <x-field data-name="provider" data-type="string" data-required="true" data-desc="使用的驗證提供者（例如 `wallet`、`accessKey`）。"></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="使用者的全名或與憑證相關的備註。"></x-field>
  <x-field data-name="method" data-type="AuthMethod" data-required="true" data-desc="此會話使用的具體驗證方法（例如 `loginToken`、`accessKey`、`componentCall`）。"></x-field>
  <x-field data-name="walletOS" data-type="string" data-required="true" data-desc="所用錢包的作業系統（如果適用）。"></x-field>
  <x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="表示使用者的電子郵件是否已驗證。"></x-field>
  <x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="表示使用者的電話是否已驗證。"></x-field>
</x-field>


以下是成功登入後 `req.user` 物件可能樣子的範例：

```json Example req.user Object icon=lucide:user-check
{
  "did": "z8iZgeJjzB6Q1bK2rR1BfA2J8cNEJ8cNEJ8c",
  "role": "owner",
  "fullName": "Alice",
  "provider": "wallet",
  "walletOS": "ios",
  "emailVerified": true,
  "phoneVerified": false,
  "method": "loginToken"
}
```

## 後續步驟

一旦使用者透過 `session` 中介軟體驗證，您可以根據其角色和權限執行更細緻的存取控制。請前往下一節，了解如何使用[授權中介軟體](./authentication-auth-middleware.md)來根據使用者角色保護路由。