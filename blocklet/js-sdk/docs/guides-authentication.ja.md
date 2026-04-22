# 認証

`@blocklet/js-sdk` は、トークンベースのセキュリティの複雑さを自動的に処理することで、認証をシームレスにするように設計されています。セッショントークンとリフレッシュトークンをバックグラウンドで管理するため、アプリケーションの機能構築に集中できます。

このガイドでは、自動トークン更新プロセスについて説明し、`AuthService` を使用してユーザーのプロファイルの取得やログアウトなどのユーザー認証状態を管理する方法を示します。利用可能なすべてのメソッドの詳細なリストについては、[AuthService APIリファレンス](./api-services-auth.md)を参照してください。

## セッショントークンの自動更新

SDKは、短命のセッショントークンと長命のリフレッシュトークンを使用する、標準的で安全な認証フローを採用しています。SDKのリクエストヘルパーを使用してAPIコールを行うと（[APIリクエストの作成](./guides-making-api-requests.md)を参照）、プロセスは完全に自動化されます：

1.  **リクエストの開始**：SDKは現在の `sessionToken` をAPIリクエストの認証ヘッダーに添付します。
2.  **トークンの有効期限切れ**：`sessionToken` の有効期限が切れている場合、サーバーは `401 Unauthorized` エラーで応答します。
3.  **自動更新**：SDKのリクエストインターセプターがこの `401` エラーをキャッチします。その後、保存されている `refreshToken` を認証エンドポイントに自動的に送信し、新しい `sessionToken` と `refreshToken` を取得します。
4.  **リクエストの再試行**：新しいトークンが受信されて保存されると、SDKは失敗した元のAPIリクエストを透過的に再試行します。今回は、新しい有効な `sessionToken` が使用されます。
5.  **成功応答**：サーバーは新しいトークンを検証し、成功応答を返します。この応答はアプリケーションコードに渡されます。

このプロセス全体はアプリケーションロジックからは見えず、ユーザーエクスペリエンスを中断することなくユーザーセッションがアクティブなままであることを保証します。

以下の図は、このフローを示しています：

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Authentication](assets/diagram/authentication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## AuthServiceによるユーザー状態の管理

`AuthService` は、一般的な認証およびユーザー管理タスクのための高レベルAPIを提供します。メインのSDKインスタンスを介してアクセスできます。

### 現在のユーザープロファイルの取得

現在ログインしているユーザーのプロファイル情報を取得するには、`getProfile` メソッドを使用します。

```javascript ユーザープロファイルの取得 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const profile = await sdk.auth.getProfile();
    console.log('ユーザープロファイル:', profile);
    return profile;
  } catch (error) {
    console.error('プロファイルの取得に失敗しました:', error);
  }
}

fetchUserProfile();
```

### ログアウト

`logout` メソッドは、サーバー上のユーザーの現在のセッションを無効にします。引数なしで呼び出して現在のデバイスをログアウトさせるか、`visitorId` を渡して特定のセッションをログアウトさせることができます。これは複数のデバイスにわたるセッションを管理するのに便利です。

```javascript ユーザーのログアウト icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function handleLogout() {
  try {
    // 現在のセッションをログアウトします
    await sdk.auth.logout();
    console.log('正常にログアウトしました。');
    // ログインページにリダイレクトするか、UIの状態を更新します
  } catch (error) {
    console.error('ログアウトに失敗しました:', error);
  }
}
```

### ユーザーアカウントの削除

アカウントの削除を希望するユーザーのために、SDKは `destroyMyself` メソッドを提供します。これは、ユーザーのデータを永久に削除する、破壊的で元に戻せないアクションです。

```javascript 現在のユーザーアカウントの削除 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function deleteAccount() {
  // この操作はユーザーに確認することが重要です
  if (window.confirm('アカウントを削除してもよろしいですか？この操作は元に戻せません。')) {
    try {
      const result = await sdk.auth.destroyMyself();
      console.log(`DID ${result.did} のアカウントが削除されました。`);
      // クリーンアップを実行し、ユーザーをリダイレクトします
    } catch (error) {
      console.error('アカウントの削除に失敗しました:', error);
    }
  }
}
```

## 次のステップ

`@blocklet/js-sdk` での認証の仕組みを理解したので、次はユーザーのすべてのアクティブなセッションを管理する方法を探ってみましょう。

<x-card data-title="ユーザーセッションの管理" data-icon="lucide:user-cog" data-href="/guides/managing-user-sessions" data-cta="ガイドを読む">
UserSessionServiceを使用して、異なるデバイス間でユーザーのログインセッションを取得および管理する方法を学びます。
</x-card>