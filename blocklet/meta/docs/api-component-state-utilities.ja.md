# コンポーネントと状態のユーティリティ

`@blocklet/meta`ライブラリは、`BlockletState`オブジェクトとの対話を簡素化するために設計された、包括的なユーティリティ関数のスイートを提供します。Blocklet、特に複合Blockletは、コンポーネントのツリーとして表現されます。これらのユーティリティは、このツリーを走査し、特定のコンポーネントを見つけ、その状態を確認し、ランタイム操作、UIレンダリング、および管理タスクのための重要な情報を抽出するための強力で効率的な方法を提供します。

このセクションでは、ツリー走査、コンポーネント検索、状態確認、設定管理、および情報抽出のための関数について説明します。

## ツリー走査

これらの関数を使用すると、Blockletアプリケーションのコンポーネントツリーを反復処理できます。これらは、すべてのコンポーネントに操作を適用したり、データを集約したりするための基本です。

### `forEachBlocklet` & `forEachBlockletSync`

中心となる走査関数です。`forEachBlocklet`は非同期で、直列（デフォルト）または並列で実行できます。一方、`forEachBlockletSync`はその同期版です。

```typescript Function Signature icon=logos:typescript
function forEachBlocklet(
  blocklet: TComponentPro,
  cb: (blocklet: TComponentPro, context: object) => any,
  options?: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
  }
): Promise<any> | null;

function forEachBlockletSync(
  blocklet: any,
  cb: Function
): void;
```

コールバック関数 `cb` は、現在のコンポーネントと `{ parent, root, level, ancestors, id }` を含むコンテキストオブジェクトを受け取ります。

**例：すべてのコンポーネントDIDを収集する**

```javascript icon=logos:javascript
import { forEachBlockletSync } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1' },
  children: [
    { meta: { did: 'z2' } },
    {
      meta: { did: 'z3' },
      children: [{ meta: { did: 'z4' } }],
    },
  ],
};

const allDids = [];
forEachBlockletSync(appState, (component) => {
  if (component.meta?.did) {
    allDids.push(component.meta.did);
  }
});

console.log(allDids);
// Output: ['z1', 'z2', 'z3', 'z4']
```

### `forEachChild` & `forEachChildSync`

これらは `forEachBlocklet` のラッパーであり、ルートBlocklet自体（`level > 0` の場合）をスキップして、Blockletのすべての子孫を便利に反復処理します。

## コンポーネントの検索とフィルタリング

状態ツリー内で特定のコンポーネントを見つけることは一般的な要件です。これらの関数は、さまざまな基準に基づいて1つ以上のコンポーネントを見つけるためのさまざまな方法を提供します。

### `findComponent`

コンポーネントツリーを走査し、提供された述語関数を満たす最初のコンポーネントを返す汎用検索関数です。

```typescript Function Signature icon=logos:typescript
function findComponent(
  blocklet: TComponent,
  isEqualFn: (component: TComponent, context: { ancestors: Array<TComponent> }) => boolean
): TComponent | null;
```

**例：`bundleName`でコンポーネントを検索する**

```javascript icon=logos:javascript
import { findComponent } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1', bundleName: 'app' },
  children: [
    { meta: { did: 'z2', bundleName: 'component-a' } },
    { meta: { did: 'z3', bundleName: 'component-b' } },
  ],
};

const componentB = findComponent(
  appState,
  (component) => component.meta?.bundleName === 'component-b'
);

console.log(componentB.meta.did);
// Output: 'z3'
```

### `findComponentById`

`findComponent` の特化版で、一意の複合ID（例： `app-did/component-did`）でコンポーネントを検索します。

```typescript Function Signature icon=logos:typescript
function findComponentById(
  blocklet: TComponent,
  componentId: string | string[]
): TComponent | null;
```

### `filterComponentsV2`

アプリの直接の子を反復処理し、述語関数を満たすすべてのコンポーネントの配列を返します。

## IDと命名

これらのユーティリティは、アプリケーションの状態内のコンポーネントのさまざまな識別子と名前を生成および取得するのに役立ちます。

| Function | Description |
|---|---|
| `getComponentId` | 先祖のDIDを使用して、コンポーネントの一意なパスベースのIDを構築します（例：`root_did/child_did`）。 |
| `getComponentName` | 先祖の名前を使用して、コンポーネントの一意なパスベースの名前を構築します。 |
| `getParentComponentName` | 指定されたコンポーネント名パスから親コンポーネントの名前を抽出します。 |
| `getAppName` | Blockletの表示名を取得します。メタデータよりも `BLOCKLET_APP_NAME` 環境変数を優先します。 |
| `getAppDescription` | Blockletの説明を取得します。`BLOCKLET_APP_DESCRIPTION` を優先します。 |
| `getComponentProcessId` | ファイルシステムエラーを防ぐために長い名前にMD5ハッシュを使用して、コンポーネントのファイルシステムセーフなプロセスIDを生成します。 |

## 設定と状態管理

設定の管理は、特に設定を共有できる複合Blockletにおいて重要です。これらのヘルパーはそのプロセスを簡素化します。

### `getSharedConfigObj`

アプリケーション内の特定のコンポーネントの共有設定オブジェクトを計算します。親アプリケーションと `shared: true` とマークされた兄弟コンポーネントからの設定をインテリジェントにマージします。

### `getAppMissingConfigs` & `getComponentMissingConfigs`

これらの関数は検証に不可欠です。アプリケーションまたは単一のコンポーネントをスキャンし、`required: true` とマークされているが、直接または共有設定メカニズムを介して値が割り当てられていないすべての設定のリストを返します。

**例：不足している設定の確認**

```javascript icon=logos:javascript
import { getAppMissingConfigs } from '@blocklet/meta/lib/util';

const appWithMissingConfig = {
  meta: { did: 'z1' },
  children: [
    {
      meta: { did: 'z2' },
      configs: [
        { key: 'API_KEY', required: true, value: null, description: 'Service API Key' },
      ],
    },
  ],
};

const missing = getAppMissingConfigs(appWithMissingConfig);

console.log(missing);
// Output: [{ did: 'z2', key: 'API_KEY', description: 'Service API Key' }]
```

### `wipeSensitiveData`

Blockletの状態オブジェクトのディープクローンを作成し、すべての機密情報を編集するセキュリティ重視のユーティリティです。`secure: true` とマークされたフィールドの値と、特定の機密環境変数（`BLOCKLET_APP_SK`など）の値を `__encrypted__` に置き換えます。

## 状態チェック

これらのブール関数は、生のステータスコードを直接処理することなく、Blockletまたはコンポーネントの現在の状態を確認する簡単な方法を提供します。

| Function | Description | Corresponding Statuses |
|---|---|---|
| `isRunning` | コンポーネントが安定した実行状態にあるかどうかを確認します。 | `running` |
| `isInProgress` | コンポーネントが移行状態にあるかどうかを確認します。 | `downloading`、`installing`、`starting`、`stopping`、`upgrading`など。 |
| `isBeforeInstalled` | コンポーネントが最初のインストールをまだ完了していないかどうかを確認します。 | `added`、`waiting`、`downloading`、`installing` |
| `isAccessible` | コンポーネントのWebインターフェースがアクセス可能である可能性があるかどうかを確認します。 | `running`、`waiting`、`downloading` |

## インターフェースとサービスの検出

Blockletのメタデータで定義されたインターフェースとサービスを見つけるためのユーティリティです。

| Function | Description |
|---|---|
| `findWebInterface` | コンポーネントのメタデータ内で最初の `web` タイプのインターフェースを見つけます。 |
| `findDockerInterface` | コンポーネントのメタデータ内で最初の `docker` タイプのインターフェースを見つけます。 |
| `findWebInterfacePort` | コンポーネントのWebインターフェースにマッピングされたホストポートを取得します。 |
| `getBlockletServices` | Blocklet内のすべてのコンポーネントで定義されているすべてのサービスのフラットなリストを返します。これには、名前、プロトコル、ポートの詳細が含まれます。 |

## 情報抽出

これらの関数は、生のBlocklet状態から特定の処理済み情報を抽出します。

### `getComponentsInternalInfo`

この関数はBlockletアプリケーションを走査し、各コンポーネントの主要な内部詳細を含む構造化された配列を返します。これはシステム管理やサービス間通信に非常に便利です。

**戻り値**

<x-field-group>
  <x-field data-name="components" data-type="array" data-desc="内部コンポーネント情報オブジェクトの配列。">
    <x-field data-name="title" data-type="string" data-desc="コンポーネントの表示タイトル。"></x-field>
    <x-field data-name="did" data-type="string" data-desc="コンポーネントの一意のDID。"></x-field>
    <x-field data-name="name" data-type="string" data-desc="コンポーネントの機械可読名。"></x-field>
    <x-field data-name="version" data-type="string" data-desc="コンポーネントのバージョン。"></x-field>
    <x-field data-name="mountPoint" data-type="string" data-desc="コンポーネントがマウントされているURLパス。"></x-field>
    <x-field data-name="status" data-type="number" data-desc="コンポーネントの数値ステータスコード。"></x-field>
    <x-field data-name="port" data-type="number" data-desc="コンポーネントのWebインターフェースに割り当てられたホストポート。"></x-field>
    <x-field data-name="containerPort" data-type="string" data-desc="Webインターフェースの内部コンテナポート。"></x-field>
    <x-field data-name="resourcesV2" data-type="array" data-desc="コンポーネントにバンドルされているリソースアセットのリスト。">
      <x-field data-name="path" data-type="string" data-desc="リソースへの絶対パス。"></x-field>
      <x-field data-name="public" data-type="boolean" data-desc="リソースが公開アクセス可能かどうかを示します。"></x-field>
    </x-field>
    <x-field data-name="group" data-type="string" data-desc="コンポーネントの機能グループ（例：'gateway'、'dapp'）。"></x-field>
  </x-field>
</x-field-group>

### `getMountPoints`

コンポーネントツリー全体をスキャンし、マウントポイントを持つすべてのコンポーネントの構造化されたリストを返します。これにより、ナビゲーションやルーティングテーブルの構築が容易になります。

### `getAppUrl`

`site.domainAliases` を分析して、Blockletアプリケーションのプライマリなユーザー向けURLを決定します。アクセス可能で保護されていないURLを優先するようにドメインをインテリジェントにソートします。

## その他のユーティリティ

その他の便利なチェックとヘルパーのコレクション。

| Function | Description |
|---|---|
| `isFreeBlocklet` | Blockletの支払い価格がゼロであるかどうかを確認します。 |
| `isDeletableBlocklet` | `BLOCKLET_DELETABLE` 環境変数に基づいてBlockletの削除が許可されているかどうかを確認します。 |
| `hasRunnableComponent` | アプリケーションに実行可能な非ゲートウェイコンポーネントが含まれているかどうかを判断します。 |
| `isExternalBlocklet` | Blockletが外部コントローラーによって管理されているかどうかを確認します。 |
| `isGatewayBlocklet` | コンポーネントのグループが `gateway` であるかどうかを確認します。 |
| `isPackBlocklet` | コンポーネントのグループが `pack` であるかどうかを確認します。 |
| `hasStartEngine` | コンポーネントのメタデータが起動可能なエンジン（例：`main` または `docker.image`）を定義しているかどうかを確認します。 |
| `hasMountPoint` | コンポーネントがその設定に基づいてマウントポイントを持つべきかどうかを判断します。 |
| `getBlockletChainInfo` | Blockletとその子からチェーン設定（タイプ、ID、ホスト）を抽出し、統合します。 |
| `checkPublicAccess`| Blockletのセキュリティ設定がパブリックアクセスを許可しているかどうかを確認します。 |
