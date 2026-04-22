# 概要

`@blocklet/js-sdk` は、Blockletサービスとのインタラクションを効率化するために設計された包括的なJavaScriptライブラリです。フロントエンドアプリケーションを構築している場合でも、バックエンドサービスを構築している場合でも、このSDKは認証、セッション管理、API通信を処理するための堅牢なツールセットを提供し、低レベルの詳細に取り組むのではなく、機能の構築に集中できるようにします。

トークン管理の複雑さを抽象化し、一般的なタスクに対して直感的で高レベルのサービスを提供することで、プロセス全体を簡素化します。

## 主な機能

このSDKは、開発体験をできるだけスムーズにするために、いくつかの主要な原則に基づいて構築されています。

<x-cards data-columns="3">
  <x-card data-title="簡素化されたAPIリクエスト" data-icon="lucide:send">
    ベースURLやインターセプターなど、認証済みAPI呼び出しに必要なすべてが事前設定された `createAxios` と `createFetch` ヘルパーを提供します。
  </x-card>
  <x-card data-title="自動トークン管理" data-icon="lucide:key-round">
    セッショントークンとリフレッシュトークンのライフサイクルを自動的に処理します。期限切れのトークンを透過的に更新し、手動の介入なしにアプリケーションの認証状態を維持します。
  </x-card>
  <x-card data-title="モジュラーサービスアーキテクチャ" data-icon="lucide:blocks">
    機能を `AuthService`、`UserSessionService`、`BlockletService` などの個別のサービスに整理し、クリーンで整理されたAPIサーフェスを提供します。
  </x-card>
</x-cards>

## 仕組み

あなたのアプリケーションはSDKのサービスとリクエストヘルパーと対話します。SDKは、Blocklet APIとのすべての通信を管理し、認証とトークン更新の複雑さを内部で処理します。このアーキテクチャにより、アプリケーションコードはクリーンでビジネスロジックに集中したままになります。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## はじめに

SDKをプロジェクトに統合する準備はできましたか？私たちの「はじめに」ガイドでは、インストールプロセスを案内し、数分で最初のAPI呼び出しを行うのに役立ちます。

<x-card data-title="はじめに" data-icon="lucide:rocket" data-href="/getting-started" data-cta="ビルドを開始">
  ステップバイステップのガイドに従ってSDKをインストールし、アプリケーションを設定してください。
</x-card>