# 認可ミドルウェア

`auth`ミドルウェアは、blocklet のルートに認可レイヤーを追加するための強力なツールです。[セッションミドルウェア](./authentication-session-middleware.md)と連携して動作し、ユーザーのロール、特定の権限、KYC (本人確認) ステータス、および使用された認証方式を検証することでエンドポイントを保護します。これにより、認可されたユーザーのみが機密情報や制限されたリソースにアクセスできるようになります。

## 使用方法

`auth`ミドルウェアを使用するには、`@blocklet/sdk/middlewares`からインポートし、保護が必要な任意の Express.js のルートまたはルーターに適用します。設定オブジェクトを渡して認可ルールを指定できます。

以下は、管理者専用ルートを保護する基本的な例です。

```javascript icon=lucide:shield-check title="routes/admin.js"
const auth = require('@blocklet/sdk/middlewares/auth');
const router = require('express').Router();

// このルートは 'admin' ロールを持つユーザーのみがアクセスできます。
router.get('/dashboard', auth({ roles: ['admin'] }), (req, res) => {
  res.json({
    message: 'Welcome to the admin dashboard!',
    user: req.user,
  });
});

module.exports = router;
```

認可されていないユーザーがこのルートにアクセスしようとすると、ミドルウェアは自動的に `403 Forbidden` エラーで応答します。ユーザーが全くログインしていない場合は、`401 Unauthorized` エラーで応答します。

## 認可フロー

ミドルウェアは特定の順序で認可ルールを評価します。いずれかの時点でチェックが失敗すると、リクエストは即座に適切な HTTP エラーコードで拒否されます。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Authorization Middleware](assets/diagram/auth-middleware-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 設定オプション

`auth`ミドルウェアは、きめ細かなアクセス制御ルールを定義するために、以下のプロパティを持つ設定オブジェクトを受け入れます。

<x-field-group>
  <x-field data-name="roles" data-type="string[]" data-required="false">
    <x-field-desc markdown>ロール名の配列。ユーザーはアクセスを許可されるために、これらのロールの**少なくとも1つ**を持っている必要があります。ユーザーのロールがこのリストにない場合、ミドルウェアは `403 Forbidden` エラーを返します。</x-field-desc>
  </x-field>
  <x-field data-name="permissions" data-type="string[]" data-required="false">
    <x-field-desc markdown>権限名の配列。ミドルウェアはユーザーのロールに関連付けられた権限をチェックします。ユーザーのロールは、指定された権限の**少なくとも1つ**を持っている必要があります。そうでない場合、`403 Forbidden` エラーが返されます。このチェックには [Blocklet Service](./services-blocklet-service.md) が実行されている必要があります。</x-field-desc>
  </x-field>
  <x-field data-name="kyc" data-type="('email' | 'phone')[]" data-required="false">
    <x-field-desc markdown>必要なKYC (Know Your Customer) 検証方法を指定する配列。`email` 検証、`phone` 検証、またはその両方を要求できます。ユーザーが必要な検証ステップを完了していない場合、ミドルウェアはメッセージ "kyc required" を伴う `403 Forbidden` エラーを返します。</x-field-desc>
  </x-field>
  <x-field data-name="methods" data-type="AuthMethod[]" data-required="false">
    <x-field-desc markdown>許可される認証方式の配列。`SessionUser` オブジェクトには、セッションがどのように確立されたかを示す `method` プロパティが含まれています (例: `loginToken`、`accessKey`、`componentCall`)。ユーザーの認証方式がこのリストにない場合、ミドルウェアは `403 Forbidden` エラーを返します。</x-field-desc>
  </x-field>
</x-field-group>

### 例: 複数の条件を要求する

これらのオプションを組み合わせて、複雑な認可ルールを作成できます。例えば、メールアドレスを検証済みで、一時的なアクセスキーを使用していない有料購読者のみがアクセスできるルートを保護する場合：

```javascript icon=lucide:shield-check title="routes/billing.js"
const auth = require('@blocklet/sdk/middlewares/auth');
const router = require('express').Router();

router.post(
  '/update-subscription',
  auth({
    roles: ['subscriber'],
    kyc: ['email'],
    methods: ['loginToken', 'signedToken'], // accessKey経由のアクセスを不許可にする
  }),
  (req, res) => {
    // 購読を更新するロジック
    res.json({ success: true, message: 'Subscription updated.' });
  }
);

module.exports = router;
```

この例では、ユーザーは以下の3つの条件をすべて満たす必要があります：
1.  `subscriber` ロールを持っていること。
2.  メールアドレスが検証済みであること。
3.  単純なアクセスキーではなく、標準のログイントークンまたは署名済みトークンを使用して認証していること。

## まとめ

`auth`ミドルウェアは、blockletのエンドポイントを保護するための不可欠なユーティリティです。ロール、権限、KYC、認証方式のチェックを組み合わせることで、最小限のコードで堅牢かつ詳細なアクセス制御を実装できます。

ユーザーとセッションの管理に関する詳細については、以下のセクションを参照してください：
- [セッションミドルウェア](./authentication-session-middleware.md): この認可ミドルウェアの前提条件であるユーザーセッションの確立方法を学びます。
- [Blocklet Service](./services-blocklet-service.md): このミドルウェアが依存するロールと権限をプログラムで管理する方法を理解します。