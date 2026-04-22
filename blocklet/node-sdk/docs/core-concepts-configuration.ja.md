# 設定と環境

Blocklet SDKは、アプリケーションの設定と環境変数を管理するための堅牢で統一された方法を提供します。複数のソースからの設定を単一の使いやすいインターフェースに集約し、Blockletが必要なすべての情報（アプリケーションのメタデータからコンポーネント固有の設定まで）にアクセスできるようにします。

このセクションでは、この情報にアクセスするための2つの主要なエクスポート、`env`オブジェクトと`components`ストアについて説明します。

## `env`オブジェクト

`env`オブジェクトは、実行時にコンポーネントで利用可能なすべての設定変数を格納する、中央集権的で読み取り専用のコンテナです。SDKは、デフォルト値、アプリケーションレベルの設定、コンポーネント固有の環境ファイルなど、複数のソースからの設定をマージして、このオブジェクトを自動的に作成します。

SDKから`env`をインポートするだけで、任意の設定プロパティにアクセスできます。

```javascript icon=logos:javascript
import { env } from '@blocklet/sdk';

console.log(`Running in app: ${env.appName}`);
console.log(`My data directory is at: ${env.dataDir}`);

// Blockletの設定ページからユーザー定義の設定にアクセス
const userApiKey = env.preferences.apiKey;
```

### 主要な環境プロパティ

`env`オブジェクトには多くのプロパティが含まれていますが、ここでは最も一般的に使用されるものをいくつか紹介します。

<x-field data-name="appName" data-type="string" data-desc="親アプリケーションの名前。"></x-field>
<x-field data-name="appUrl" data-type="string" data-desc="アプリケーションの完全な公開URL。"></x-field>
<x-field data-name="componentDid" data-type="string" data-desc="現在のコンポーネントの分散型ID（DID）。"></x-field>
<x-field data-name="isComponent" data-type="boolean" data-desc="コードがコンポーネントのコンテキスト内で実行されている場合に`true`になるフラグ。"></x-field>
<x-field data-name="dataDir" data-type="string" data-desc="コンポーネント専用のデータストレージディレクトリへの絶対パス。"></x-field>
<x-field data-name="cacheDir" data-type="string" data-desc="コンポーネント専用のキャッシュディレクトリへの絶対パス。"></x-field>
<x-field data-name="serverVersion" data-type="string" data-desc="アプリケーションが実行されているBlocklet Serverのバージョン。"></x-field>
<x-field data-name="preferences" data-type="Record<string, any>" data-desc="Blockletの設定ページからユーザーが設定したカスタム設定値を含むオブジェクト。"></x-field>


## `components`ストア

`components`ストアは、同じアプリケーションインスタンス内で実行されている他のすべてのコンポーネントに関するリアルタイム情報を提供する配列です。これはコンポーネント間の通信に不可欠であり、あるコンポーネントが別のコンポーネントのエンドポイントとステータスを発見できるようにします。

```javascript icon=logos:javascript
import { components } from '@blocklet/sdk';

// リクエストを行うために実行中のAPIサービスコンポーネントを検索
const apiService = components.find(c => c.name === 'api-service' && c.status === 1);

if (apiService) {
  const apiUrl = apiService.webEndpoint;
  console.log(`Found API service at: ${apiUrl}`);
  // これで、このURLにリクエストを送信できます
}
```

### コンポーネントのプロパティ

`components`配列内の各オブジェクトには、コンポーネントに関する詳細情報が含まれています。

<x-field data-name="did" data-type="string" data-desc="コンポーネントの分散型ID（DID）。"></x-field>
<x-field data-name="name" data-type="string" data-desc="`blocklet.yml`で定義されたコンポーネントの名前。"></x-field>
<x-field data-name="mountPoint" data-type="string" data-desc="コンポーネントがマウントされているURLパス（例：`/admin`、`/api`）。"></x-field>
<x-field data-name="webEndpoint" data-type="string" data-desc="コンポーネントの完全な公開アクセス可能なURL。"></x-field>
<x-field data-name="status" data-type="number" data-desc="コンポーネントの現在のステータス（例：実行中は`1`、停止中は`0`）。"></x-field>


## 設定の読み込みフロー

SDKは、さまざまなソースからの設定を階層化して`env`オブジェクトを構築します。後続の各ソースは前のソースの値を上書きでき、明確で予測可能な優先順位を提供します。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Configuration & Environment](assets/diagram/configuration-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

この階層化されたアプローチは柔軟性を提供し、開発者や管理者がさまざまなレベルでBlockletを設定できるようにします。

## 動的更新

設定は静的なだけではありません。Blocklet SDKは、Blocklet Serverからプッシュされるランタイムの変更をリッスンします。たとえば、ユーザーがBlockletの設定ページで設定を更新すると、SDKは自動的に`env`オブジェクトを更新し、イベントを発行します。

エクスポートされた`events`エミッターを使用して、これらの変更をリッスンできます。

```javascript icon=logos:javascript
import { events, Events } from '@blocklet/sdk';

// 環境や設定の更新をリッスン
events.on(Events.envUpdate, (updatedValues) => {
  console.log('Configuration was updated:', updatedValues);
  // これで変更に対応できます。例：サービスを再初期化する
});
```

これにより、再起動を必要とせずに設定の変更に対応できるアプリケーションを構築できます。

---

設定と環境変数へのアクセス方法を理解したところで、より具体的なタスクにそれらを使用する方法を探求できます。一般的なユースケースは、暗号キーとウォレットの管理であり、これについては次のセクションで説明します。

<x-card data-title="次へ：ウォレット管理" data-icon="lucide:wallet" data-href="/core-concepts/wallet" data-cta="続きを読む">
  署名と認証のためのウォレットインスタンスを作成および管理する方法を学びます。
</x-card>