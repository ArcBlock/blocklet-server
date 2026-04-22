# セキュリティユーティリティ

Blocklet SDK には、アプリケーションのデータと通信を保護するために設計された堅牢なセキュリティユーティリティのセットが含まれています。これらのツールは、機密情報の取り扱い、API コールの整合性の確保、クロスサイトリクエストフォージェリ（CSRF）などの一般的な Web の脆弱性の防止に役立ちます。

署名と検証について詳しく説明する前に、ウォレットがどのように管理されるかを理解することが不可欠です。ウォレットはこれらの操作の暗号基盤を形成するためです。詳細については、[ウォレット管理](./core-concepts-wallet.md)セクションをご覧ください。

## データの暗号化と復号

データベース内の API キーや個人ユーザー情報などの機密データを保管（at rest）するために、SDK はシンプルな対称暗号化および復号関数を提供します。これらのユーティリティは AES 暗号化を使用し、Blocklet の環境変数から自動的にキーを導出するため、キー管理が簡素化されます。

- `encrypt(message)`: 文字列を暗号化します。
- `decrypt(message)`: 暗号化された文字列を復号します。

暗号化キーは `process.env.BLOCKLET_APP_EK`（パスワードとして）と `process.env.BLOCKLET_DID`（ソルトとして）から導出されます。これらの環境変数が Blocklet のランタイムで利用可能であることを確認してください。

```javascript データの暗号化 icon=lucide:lock
import { encrypt } from '@blocklet/sdk/security';

const userApiKey = 'sk_live_verySecretValue12345';

// データベースに保存する前にデータを暗号化する
const encryptedApiKey = encrypt(userApiKey);

console.log(encryptedApiKey);
// 出力: 長い暗号化された文字列
```

元のデータを取得するには、`decrypt` 関数を使用します。

```javascript データの復号 icon=lucide:key-round
import { decrypt } from '@blocklet/sdk/security';

// 'encryptedApiKey' がデータベースから取得されたと仮定します
const encryptedApiKey = 'U2FsdGVkX1...'; // 暗号化された文字列の例

const originalApiKey = decrypt(encryptedApiKey);

console.log(originalApiKey);
// 出力: sk_live_verySecretValue12345
```

## リクエストの署名と検証

[コンポーネント間通信](./guides-component-communication.md)などのサービス間でデータの整合性と信頼性を確保するために、SDK はデータペイロードに署名し、検証するユーティリティを提供します。このプロセスでは、Blocklet のウォレットを使用して、受信側のサービスが検証できる暗号署名を作成します。

### 高レベルのレスポンス署名

API レスポンス全体を保護する最も簡単な方法は、`signResponse` と `verifyResponse` を使用することです。これらの関数は、署名付きレスポンスの標準データ構造を処理します。

`signResponse(data)`: JSON オブジェクトを受け取り、署名とタイムスタンプを含む標準形式でラップし、新しい署名付きオブジェクトを返します。

```javascript API レスポンスへの署名 icon=lucide:pen-tool
import { signResponse } from '@blocklet/sdk/security';
import express from 'express';

const app = express();

app.get('/api/data', (req, res) => {
  const data = { userId: '123', permissions: ['read'] };
  // signResponse は署名、pk、およびその他のメタデータを追加します
  const signedPayload = signResponse(data);
  res.json(signedPayload);
});
```

`verifyResponse(data)`: 署名付きペイロードを受け取り、埋め込まれた公開鍵を使用してその署名を検証します。

```javascript 署名付きレスポンスの検証 icon=lucide:shield-check
import { verifyResponse } from '@blocklet/sdk/security';

async function fetchAndVerifyData() {
  const response = await fetch('/api/data');
  const signedPayload = await response.json();

  const isValid = verifyResponse(signedPayload);

  if (isValid) {
    console.log('署名は有効です。データ:', signedPayload.data);
  } else {
    console.error('署名の検証に失敗しました！');
  }
}
```

### 低レベルの署名

`signResponse` によって提供されるラッパー構造なしで特定のデータペイロードに署名するなど、より多くの制御が必要なシナリオでは、低レベルの `sign` および `verify` ユーティリティを使用できます。これらの関数は、カスタム署名の実装に不可欠です。

これらのユーティリティの重要な特徴は、安定した JSON 文字列化プロセスを使用することです。これにより、同じデータオブジェクトが常に同じ文字列表現を生成することが保証され、一貫性のある検証可能な署名を生成するために重要です。

```javascript 低レベルの署名と検証 icon=lucide:fingerprint
import { sign, verify } from '@blocklet/sdk/util/verify-sign';

// 署名されるデータペイロード
const data = { transactionId: 'xyz-789', amount: 50, currency: 'USD' };

// 1. Blocklet のウォレットを使用して署名を生成する
const signature = sign(data);
console.log('Signature:', signature);

// 2. 署名を検証する
// 検証には公開鍵が必要です。
const publicKey = process.env.BLOCKLET_APP_PK;
const isVerified = verify(data, signature, { appPk: publicKey });

console.log('Is Verified:', isVerified);
// 出力: Is Verified: true
```

署名を検証するには、元のデータ、署名文字列、および署名者の公開鍵（`appPk`）を提供する必要があります。実際のアプリケーションでは、この公開鍵は通常、呼び出し元のサービスから送信されたリクエストヘッダー（例: `x-component-sig-pk`）または信頼できる設定ソースから取得されます。

## CSRF 保護

クロスサイトリクエストフォージェリ（CSRF）は、ユーザーをだまして悪意のあるリクエストを送信させる攻撃です。SDK の `csrf` ミドルウェアは、シンクロナイザートークンパターンを実装することにより、このリスクを軽減するための堅牢で使いやすいソリューションを提供します。

これは、ユーザーセッションごとに一意のシークレットベースのトークンを作成し、状態を変更するリクエスト（`POST`、`PUT`、`DELETE` など）にそのトークンが存在することを要求することで機能します。

### 基本的な使用法

CSRF 保護を有効にするには、`csrf` および `cookie-parser` ミドルウェアを Express アプリケーションに追加します。`cookie-parser` ミドルウェアは前提条件です。

```javascript 基本的な CSRF 保護 icon=lucide:shield
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// csrf ミドルウェアが機能するには cookie-parser ミドルウェアが必要です
app.use(cookieParser());

// すべてのルートに csrf ミドルウェアを適用する
app.use(csrf());

app.post('/api/update-profile', (req, res) => {
  res.json({ message: 'Profile updated successfully!' });
});

// ... その他のルート
app.listen(3000);
```

#### 仕組み

1.  **トークンの生成**: `GET` リクエストの場合、ミドルウェアはユーザーの `login_token` クッキー（通常はユーザーがログインした後に設定されます）に基づいて `x-csrf-token` クッキーを自動的に生成します。
2.  **トークンの検証**: 状態を変更するメソッド（`POST`、`PUT`、`PATCH`、`DELETE`）の場合、ミドルウェアは `x-csrf-token` クッキーの値と `x-csrf-token` HTTP ヘッダーの値を比較します。それらが一致しない場合、または一方が欠落している場合、リクエストは 403 Forbidden エラーで拒否されます。
3.  **フロントエンドの実装**: フロントエンドアプリケーションは、`x-csrf-token` クッキーを読み取り、状態を変更するすべての API コールでその値を `x-csrf-token` ヘッダーで送信する責任があります。ほとんどの最新の HTTP クライアント（Axios など）は、これを自動的に行うように設定できます。

### 高度な使用法

より複雑なシナリオでは、`csrf` ミドルウェアにオプションオブジェクトを渡すことで、トークンの生成と検証ロジックをカスタマイズできます。これは、セッションにトークンを保存したり、カスタムリクエストヘッダーを使用したりするなど、トークンを異なる方法で処理する必要がある場合に役立ちます。

以下の例は、デフォルトの動作を上書きして次のことを行う方法を示しています:
1.  セッションに保存されている `userId` に基づいてトークンを生成する。
2.  クッキーの代わりに `res.locals` を介してトークンをフロントエンドに渡す。
3.  カスタムの `x-custom-csrf-token` ヘッダーからトークンを検証する。

```javascript 高度な CSRF 保護 icon=lucide:shield-alert
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { csrf } from '@blocklet/sdk/middlewares';
import { sign, verify, getCsrfSecret } from '@blocklet/sdk/util/csrf';

const app = express();

app.use(cookieParser());
app.use(session({ secret: 'custom-session-secret', resave: false, saveUninitialized: true }));

// カスタムトークン処理による高度な使用法
app.use(csrf({
  // トークンを生成して提供するカスタムロジック
  generateToken: (req, res) => {
    if (req.session.userId) {
      const token = sign(getCsrfSecret(), req.session.userId);
      // トークンをテンプレートエンジンで利用できるようにする
      res.locals.csrfToken = token;
    }
  },
  // カスタムヘッダーからトークンを検証するカスタムロジック
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

// カスタムトークンを使用してフォームをレンダリングするルート
app.get('/form', (req, res, next) => {
  // デモンストレーションのためにユーザーセッションをシミュレートする
  req.session.userId = `user_${Date.now()}`;
  
  // トークンを設定するには generateToken 関数を呼び出す必要があります
  // 実際のアプリでは、これはより広範なミドルウェアの一部になる可能性があります
  const generate = res.locals.generateToken;
  generate(req, res);

  res.send(`
    <h3>高度な CSRF の例</h3>
    <form id="myForm">
      <input type="text" name="data" value="some-data">
      <button type="submit">送信</button>
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
          alert('レスポンス: ' + result);
        } catch (err) {
          alert('エラー: ' + err.message);
        }
      });
    </script>
  `);
});

// 送信を処理するルート
app.post('/submit', (req, res) => {
  // ここまで到達した場合、カスタムの verifyToken ロジックは合格しています。
  res.send('フォームは正常に送信されました！');
});

// CSRF エラーをキャッチして表示するエラーハンドラー
app.use((err, req, res, next) => {
  if (err.message.includes('CSRF')) {
    res.status(403).send(err.message);
  } else {
    next(err);
  }
});

app.listen(3000);
```

これらのコアセキュリティの概念を理解したことで、安全で信頼性の高いアプリケーションを構築するための準備が整いました。これらのツールが実際にどのように使用されるかを確認するには、[認証](./authentication.md)ガイドに進んでください。