# 概要

Blocklet SDK (`@blocklet/sdk`) は、ArcBlock プラットフォーム上でアプリケーションを構築するための必須ツールキットです。Blocklet のコア機能を処理するユーティリティ、サービス、ミドルウェアの包括的なセットを提供することで開発を簡素化し、アプリケーション独自の機能に集中できるようにします。

シンプルな静的サイト、複雑なウェブサービス、または別のアプリケーションを拡張するコンポーネントを構築する場合でも、Blocklet SDK は、基盤となる Blocklet Server 環境とシームレスに対話するために必要な抽象化を提供します。

## 主な機能

この SDK は、強力でありながら使いやすいように設計されており、開発プロセスを加速するためのさまざまな機能を提供します。

<x-cards data-columns="2">
  <x-card data-title="設定と環境" data-icon="lucide:settings">
    統一された `env` オブジェクトと `config` モジュールを通じて、環境変数、アプリケーション設定、および他の実行中のコンポーネントに関する情報に簡単にアクセスできます。
  </x-card>
  <x-card data-title="認証と認可" data-icon="lucide:lock">
    DID Connect の組み込みサポートにより分散型アイデンティティを統合します。強力なセッションおよび認可ミドルウェアでルートを保護します。
  </x-card>
  <x-card data-title="サービスクライアント" data-icon="lucide:server">
    Blocklet Server とプログラムで対話します。`BlockletService` を使用してユーザー、ロール、権限を管理したり、`NotificationService` を使用してメッセージを送信したりできます。
  </x-card>
  <x-card data-title="Webサーバーミドルウェア" data-icon="lucide:shield-check">
    CSRF 保護、セッション管理、サイトマップ生成、SPA フォールバックなどの一般的なタスクに対応する、すぐに使える Express.js ミドルウェアのスイートです。
  </x-card>
</x-cards>

## コアモジュール

Blocklet SDK は、それぞれが特定の目的を果たすいくつかの主要なモジュールに編成されています。

*   **`BlockletService`**: Blocklet Server の API と対話するためのクライアントです。ユーザー、ロール、権限、アクセスキーを管理し、blocklet のメタデータを取得できます。
*   **`config` & `env`**: 環境変数、コンポーネントのマウントポイント、アプリケーション設定など、blocklet の実行時設定にアクセスできます。
*   **`middlewares`**: 認証（`auth`）、セッション（`session`）、CSRF 保護（`csrf`）などを処理するための Express.js ミドルウェアのコレクションです。
*   **`WalletAuthenticator` & `WalletHandlers`**: DID Connect を実装するためのコアユーティリティで、ユーザーが分散型アイデンティティで安全にログインできるようにします。詳細については、[DID Connect SDK ドキュメント](https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview)も参照してください。
*   **`getWallet`**: blocklet のウォレットインスタンスを取得するためのユーティリティ関数で、トランザクションやメッセージの署名に不可欠です。
*   **`Security`**: データの暗号化、復号化、署名検証のためのヘルパー関数を提供し、アプリケーション内での安全なデータ処理を保証します。

## はじめに

最初の Blocklet を構築する準備はできましたか？[はじめに](./getting-started.md) ガイドに進んで、数分で起動して実行できるステップバイステップのチュートリアルをご覧ください。