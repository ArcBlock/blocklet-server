# セッションミドルウェア

`session`ミドルウェアは、Blocklet SDKの認証システムの中核をなすコンポーネントです。Express.jsのルートに対するゲートキーパーとして機能し、リクエスターの身元を検証し、認証が成功すると`req.user`プロパティに`SessionUser`オブジェクトをアタッチします。これにより、後続のミドルウェアやルートハンドラは、認証されたユーザー情報に容易にアクセスできます。

このミドルウェアは非常に柔軟で、[DID Connect](./authentication-did-connect.md)からのログイントークン、プログラムによるアクセスキー、安全なコンポーネント間コールなど、複数の認証戦略を標準でサポートしています。

## 仕組み

セッションミドルウェアは、特定の優先順位で受信リクエストの資格情報を検査します。有効な資格情報が見つかると、`req.user`を設定し、次のハンドラに制御を渡します。有効な資格情報が見つからない場合、その動作は`strictMode`が有効かどうかによって異なります。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Session Middleware](assets/diagram/session-middleware-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

blockletの設定で`enableBlacklist`機能が有効になっている場合、追加のセキュリティチェックが実行されます。ログイントークンを検証する前に、ミドルウェアはサービスAPIを呼び出し、トークンが失効またはブロックされていないことを確認します。

## 基本的な使い方

`session`ミドルウェアは、アプリケーション全体、または認証が必要な特定のルートに適用できます。

```javascript セッションミドルウェアの適用 icon=logos:express
import express from 'express';
import session from '@blocklet/sdk/middlewares/session';

const app = express();

// すべてのルートに適用
app.use(session());

// または、保護する必要がある特定のルートに適用
app.get('/api/profile', session({ strictMode: true }), (req, res) => {
  // strictモードでは、req.userが存在しない場合、ミドルウェアはすでに401レスポンスを送信しています。
  if (req.user) {
    res.json(req.user);
  }
});

// ログインしているユーザーで挙動が異なる公開ルート
app.get('/api/info', session(), (req, res) => {
  if (req.user) {
    res.json({ message: `Hello, ${req.user.fullName}`});
  } else {
    // non-strictモードでは、未認証のユーザーに対してreq.userはundefinedです
    res.json({ message: 'Hello, guest.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## 設定オプション

`sessionMiddleware`関数は、その動作を調整するためにオプションの設定オブジェクトを受け入れます。

<x-field data-name="strictMode" data-type="boolean" data-default="false" data-desc="「true」の場合、無効なトークンまたはトークンがない場合は「401 Unauthorized」レスポンスが返されます。「false」の場合、「user」オブジェクトなしで「next()」を呼び出し、リクエストを未認証として扱います。"></x-field>

<x-field data-name="loginToken" data-type="boolean" data-default="true" data-desc="通常はDID Connectから提供され、「login_token」クッキーに含まれる標準JWTログイントークンによる認証を有効にします。"></x-field>

<x-field data-name="accessKey" data-type="boolean" data-default="false" data-desc="長期間有効なアクセスキー（例：CI/CDやスクリプト用）による認証を有効にします。これらも「login_token」クッキーから読み取られます。"></x-field>

<x-field data-name="componentCall" data-type="boolean" data-default="false" data-desc="「x-component-sig」のようなヘッダーを使用して検証される、他のコンポーネントからの安全な署名付きリクエストの認証を有効にします。"></x-field>

<x-field data-name="signedToken" data-type="boolean" data-default="false" data-desc="クエリパラメータとして渡される一時的な署名付きJWTによる認証を有効にします。"></x-field>

<x-field data-name="signedTokenKey" data-type="string" data-default="__jwt" data-desc="「signedToken」認証に使用されるクエリパラメータの名前。"></x-field>

### 設定例

<x-cards>
  <x-card data-title="厳格なAPIエンドポイント" data-icon="lucide:shield-check">
    保護する必要があるエンドポイントの場合、「strictMode」は未認証のリクエストが即座に拒否されることを保証します。

    ```javascript
    app.use('/api/admin', session({ strictMode: true }));
    ```
  </x-card>
  <x-card data-title="アクセスキーを有効にする" data-icon="lucide:key-round">
    ユーザーセッションと並行してスクリプトやサービスからのプログラムによるアクセスを許可するには、「accessKey」検証を有効にします。

    ```javascript
    app.use('/api/data', session({ accessKey: true }));
    ```
  </x-card>
</x-cards>

## SessionUserオブジェクト

認証が成功すると、`req.user`オブジェクトは以下の構造で設定されます。このオブジェクトは、認証されたユーザーまたはコンポーネントに関する重要な情報を提供します。

<x-field data-name="user" data-type="object" data-desc="認証成功時に「req.user」にアタッチされるSessionUserオブジェクト。">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="ユーザーの分散型識別子（DID）。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="ユーザーに割り当てられたロール（例：「owner」、「admin」、「guest」）。"></x-field>
  <x-field data-name="provider" data-type="string" data-required="true" data-desc="使用された認証プロバイダー（例：「wallet」、「accessKey」）。"></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="ユーザーのフルネーム、または資格情報に関連付けられた備考。"></x-field>
  <x-field data-name="method" data-type="AuthMethod" data-required="true" data-desc="このセッションで使用された特定の認証方法（例：「loginToken」、「accessKey」、「componentCall」）。"></x-field>
  <x-field data-name="walletOS" data-type="string" data-required="true" data-desc="該当する場合、使用されたウォレットのオペレーティングシステム。"></x-field>
  <x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="ユーザーのメールアドレスが検証済みかどうかを示します。"></x-field>
  <x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="ユーザーの電話番号が検証済みかどうかを示します。"></x-field>
</x-field>


以下は、ログイン成功後の`req.user`オブジェクトの例です。

```json req.userオブジェクトの例 icon=lucide:user-check
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

## 次のステップ

`session`ミドルウェアでユーザーが認証されると、そのロールと権限に基づいて、よりきめ細かいアクセス制御を実行できます。次のセクションに進み、[認証ミドルウェア](./authentication-auth-middleware.md)を使用してユーザーロールに基づいてルートを保護する方法を学んでください。