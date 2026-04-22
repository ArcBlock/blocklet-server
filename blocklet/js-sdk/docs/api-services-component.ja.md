# ComponentService

`ComponentService`は、メインアプリケーション内にマウントされているコンポーネントBlockletと対話するための便利なAPIを提供します。これにより、これらのコンポーネントに関するメタデータを取得し、そのページやAPIエンドポイントへの絶対URLを構築できます。

このサービスは、Blockletのメタデータに依存しています。このメタデータの読み込み方法については、[BlockletServiceのドキュメント](./api-services-blocklet.md)を参照してください。

## インスタンス化

他のサービスとは異なり、`ComponentService`は手動でインスタンス化する必要があります。これは、非同期で読み込まれる可能性のある`window.blocklet`オブジェクトに依存するためです。サービスが完全なBlockletメタデータにアクセスできるように、`blocklet`オブジェクトが利用可能になった後にインスタンスを作成する必要があります。

```javascript ComponentServiceのインスタンス化 icon=logos:javascript
import { ComponentService } from '@blocklet/js-sdk';

// window.blocklet が読み込まれ、利用可能であると仮定
const componentService = new ComponentService();
```

## メソッド

### getComponent()

特定のマウントされたコンポーネントの完全なメタデータオブジェクトを取得します。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="コンポーネントの識別子。名前、タイトル、またはdidを指定できます。"></x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="BlockletComponent | undefined" data-type="object" data-desc="見つかった場合は BlockletComponent オブジェクト、それ以外の場合は undefined。"></x-field>
</x-field-group>

**例**

```javascript コンポーネントメタデータの取得 icon=logos:javascript
// デモンストレーション用の window.blocklet オブジェクトのモック
window.blocklet = {
  componentMountPoints: [
    {
      did: 'z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b',
      name: 'my-first-component',
      title: 'My First Component',
      mountPoint: '/components/my-first-component',
      status: 'started'
    },
    {
      did: 'z8iZzbF9tkyG27AQs5Ynawxbh2LBe4c4q7d8c',
      name: 'my-second-component',
      title: 'My Second Component',
      mountPoint: '/components/my-second-component',
      status: 'started'
    }
  ],
  // ... その他のblockletプロパティ
};

const componentService = new ComponentService();

// 名前でコンポーネントを検索
const component = componentService.getComponent('my-first-component');
console.log(component);
```

**レスポンス例**

```json レスポンス icon=mdi:code-json
{
  "did": "z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b",
  "name": "my-first-component",
  "title": "My First Component",
  "mountPoint": "/components/my-first-component",
  "status": "started"
}
```

### getComponentMountPoint()

コンポーネントの`mountPoint`を迅速に取得するためのヘルパーメソッドです。マウントポイントは、メインアプリケーションのドメインからコンポーネントが提供される相対URLパスです。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="コンポーネントの識別子（名前、タイトル、またはdid）。"></x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="mountPoint" data-type="string" data-desc="コンポーネントの mountPoint を文字列として（例：/components/my-component）。コンポーネントが見つからない場合は空文字列を返します。"></x-field>
</x-field-group>

**例**

```javascript マウントポイントの取得 icon=logos:javascript
// 前の例と同じ componentService インスタンスを使用
const mountPoint = componentService.getComponentMountPoint('my-first-component');

console.log(mountPoint);
// 期待される出力: /components/my-first-component
```

### getUrl()

コンポーネント内のリソースへの完全な絶対URLを構築します。これは、アプリケーションのベースURLとコンポーネント固有のマウントポイントを正しく処理するため、他のコンポーネントへのリンクを作成する推奨される方法です。

**パラメータ**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="コンポーネントの識別子（名前、タイトル、またはdid）。"></x-field>
  <x-field data-name="...parts" data-type="string[]" data-required="false" data-desc="コンポーネントのURLに追加する1つ以上のパスセグメント。"></x-field>
</x-field-group>

**戻り値**

<x-field-group>
  <x-field data-name="url" data-type="string" data-desc="完全な絶対URLを文字列として。"></x-field>
</x-field-group>

**例**

```javascript コンポーネントURLの構築 icon=logos:javascript
// window.blocklet オブジェクトのモック
window.blocklet = {
  appUrl: 'https://myapp.did.abtnet.io',
  componentMountPoints: [
    {
      name: 'api-component',
      title: 'API Component',
      mountPoint: '/api/v1',
      // ... その他のプロパティ
    }
  ],
  // ... その他のプロパティ
};

const componentService = new ComponentService();

// コンポーネント内のAPIエンドポイントへのURLを構築
const userApiUrl = componentService.getUrl('api-component', 'users', '123');
console.log(userApiUrl);
// 期待される出力: https://myapp.did.abtnet.io/api/v1/users/123

// コンポーネント内のページへのURLを構築
const settingsPageUrl = componentService.getUrl('api-component', 'settings');
console.log(settingsPageUrl);
// 期待される出力: https://myapp.did.abtnet.io/api/v1/settings
```

## 型

### BlockletComponent

この型は、単一のマウントされたコンポーネントのメタデータを表します。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="コンポーネントの分散型識別子（DID）。"></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="コンポーネントの名前。blocklet.ymlで定義されます。"></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="コンポーネントの人間が読みやすいタイトル。"></x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="true" data-desc="メインアプリのURLに対してコンポーネントがマウントされるURLパス。"></x-field>
  <x-field data-name="status" data-type="string" data-required="true" data-desc="コンポーネントの現在のステータス（例：'started'、'stopped'）。"></x-field>
</x-field-group>

---

コンポーネントとの対話方法を理解したところで、次にフェデレーションログイン設定の管理方法を学びたいかもしれません。[FederatedServiceのドキュメント](./api-services-federated.md)で詳細をご覧ください。