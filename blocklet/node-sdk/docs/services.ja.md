# サービス

Blocklet SDKは、強力なサービスクライアントのスイートを提供することで、直接的なAPI呼び出しの複雑さを抽象化します。これらのクライアントは、ユーザー管理、リアルタイム通知、コンポーネント間のイベント処理など、Blockletのコア機能と対話するためのクリーンでプログラム的なインターフェースを提供します。これらのサービスを使用することで、より少ないコードで、より堅牢で機能豊富なアプリケーションを構築できます。

これらのサービスは、アプリケーションと基盤となるBlocklet Serverとの間の架け橋として機能し、認証、リクエストのフォーマット、エラーハンドリングを代行します。

<!-- DIAGRAM_IMAGE_START:architecture:4:3 -->
![Services](assets/diagram/services-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

SDKが提供するコアサービスをご覧ください。

<x-cards data-columns="3">
  <x-card data-title="Blockletサービス" data-icon="lucide:user-cog" data-href="/services/blocklet-service">
    ユーザー、ロール、権限、アクセスキーをプログラムで管理します。また、Blockletのメタデータやコンポーネント情報を取得するメソッドも提供します。
  </x-card>
  <x-card data-title="通知サービス" data-icon="lucide:bell-ring" data-href="/services/notification-service">
    リアルタイム通知の送信や受信メッセージの処理を通じてユーザーと対話します。ユーザーへのダイレクトメッセージやパブリックチャンネルへのブロードキャストをサポートします。
  </x-card>
  <x-card data-title="イベントバス" data-icon="lucide:bus-front" data-href="/services/event-bus">
    イベント駆動型アーキテクチャを実装します。カスタムイベントを公開し、他のコンポーネントからのイベントを購読することで、疎結合でスケーラブルな通信を可能にします。
  </x-card>
</x-cards>

これらのサービスは、インタラクティブで統合されたBlockletアプリケーションを構築するための柱です。各サービスの専用セクションで、その全機能と実践的な例を確認してください。

---

次に、[Blockletサービス](./services-blocklet-service.md)を使用して、アプリケーションのユーザーと設定を管理する方法を探ってみましょう。