# ガイド

`@blocklet/js-sdk`の実践的なガイドへようこそ。このセクションは、一般的なタスクを迅速に開始し、実行できるように設計されています。各ガイドでは、安全なAPI呼び出しの実行、ユーザー認証の処理、Blockletアプリケーションでのセッション管理といった主要な機能を統合するための、ステップバイステップの説明とコード例を提供します。

これらのガイドは、現実世界のユースケースに焦点を当てており、自信を持って堅牢な機能を構築するのに役立ちます。

<x-cards data-columns="3">
  <x-card data-title="APIリクエストの作成" data-href="/guides/making-api-requests" data-icon="lucide:network">
    組み込みの `createAxios` および `createFetch` ヘルパーを使用して、Blockletサービスへの認証済みおよび自動更新されるAPI呼び出しを行う方法を学びます。
  </x-card>
  <x-card data-title="認証" data-href="/guides/authentication" data-icon="lucide:key-round">
    SDKがセッショントークンを自動的に処理する方法と、`AuthService` を使用してユーザープロファイル、プライバシー、およびログアウトアクションを管理する方法を理解します。
  </x-card>
  <x-card data-title="ユーザーセッションの管理" data-href="/guides/managing-user-sessions" data-icon="lucide:smartphone">
    `UserSessionService` を使用して、さまざまなデバイスやアプリケーションにわたるユーザーのログインセッションを取得および管理する方法を発見します。
  </x-card>
</x-cards>

## 次のステップ

達成する必要のあるタスクのガイドを確認した後、SDKで利用可能なすべてのクラス、メソッド、およびタイプの詳細な内訳については、完全な[APIリファレンス](./api.md)をさらに深く掘り下げたいと思うかもしれません。