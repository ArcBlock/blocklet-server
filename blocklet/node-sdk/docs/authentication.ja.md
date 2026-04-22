# 認証

現代のウェブアプリケーションにおいて、堅牢な認証と認可はセキュリティとユーザー管理にとって不可欠です。Blocklet SDKは、分散型アイデンティティ（DID）を活用し、安全でユーザー中心のエクスペリエンスを実現しながら、これらの機能をシームレスに実装するための包括的なツールスイートを提供します。

このセクションでは、blockletでユーザーアイデンティティ、セッション、アクセス制御を管理するための主要なコンポーネントの概要を説明します。ログインのためのDID Connectの統合方法、強力なミドルウェアを使用したユーザーセッションの検証方法、そしてきめ細やかな認可ルールでアプリケーションのルートを保護する方法を学びます。

認証と認可のフローは、通常、以下の手順に従います：

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Authentication](assets/diagram/authentication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

1.  **ユーザーログイン**：ユーザーは DID Connect を介してログインリクエストを開始します。
2.  **セッション作成**：認証が成功すると、セッションが作成され、トークンがユーザーに発行されます。
3.  **セッション検証**：後続のリクエストに対して、`sessionMiddleware` がユーザートークンを検証します。
4.  **アクセス制御**：`authMiddleware` は、認証されたユーザーが要求されたリソースにアクセスするために必要なロールや権限を持っているかを確認します。
5.  **リソースアクセス**：セッション検証と認可の両方が成功した場合、ユーザーはリソースへのアクセスを許可されます。

これらの機能を実装するために、主に3つの主要なモジュールを扱います。以下のサブドキュメントでは、これらの各コンポーネントに関する詳細なガイドとAPIリファレンスを提供します。

<x-cards data-columns="3">
  <x-card data-title="DID Connect" data-icon="lucide:key-round" data-href="/authentication/did-connect">
    WalletAuthenticatorとWalletHandlerを使用して、ユーザーログインのために分散型アイデンティティを統合します。
  </x-card>
  <x-card data-title="セッションミドルウェア" data-icon="lucide:shield-check" data-href="/authentication/session-middleware">
    セッションミドルウェアを使用して、ログイントークン、アクセスキー、またはセキュアなコンポーネント呼び出しからユーザーセッションを検証する方法を学びます。
  </x-card>
  <x-card data-title="認可ミドルウェア" data-icon="lucide:lock" data-href="/authentication/auth-middleware">
    ロールベースおよび権限ベースのアクセス制御を実装して、アプリケーションのルートを保護します。
  </x-card>
</x-cards>

これらのツールを組み合わせることで、blocklet 用の安全で柔軟な認証・認可システムを構築し、認証され、認可されたユーザーのみが保護されたリソースにアクセスできるように保証します。

ユーザーログインの実装を開始するには、[DID Connect](./authentication-did-connect.md) ガイドに進んでください。