# イベントバス

イベントバスは、強力なパブリッシュ/サブスクライブメカニズムを提供します。これにより、Blocklet内のさまざまなコンポーネントや、異なるBlocklet間（同じABT Nodeインスタンス内）であっても、疎結合な方法で相互に通信できます。これは、コンポーネント同士が直接的な依存関係を持つことなく、システム全体の状態変化やイベントをブロードキャストするのに理想的です。

[通知サービス](./services-notification-service.md)がユーザーにターゲットを絞ったメッセージを送信するために設計されているのに対し、イベントバスは内部のコンポーネント間通信のために設計されています。

### 仕組み

イベントバスは、非同期な通信フローを促進します：

1.  **パブリッシャー**コンポーネントが、特定の名前とペイロードを持つイベントを送信します。
2.  Blocklet SDKは、このイベントをABT Nodeで実行されている中央のイベントバスサービスに送信します。
3.  イベントバスサービスは、そのイベントタイプをリッスンしているすべての**サブスクライバー**コンポーネントにこのイベントをブロードキャストします。

このプロセスは以下の図で視覚化されています：

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Event Bus](assets/diagram/event-bus-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## APIリファレンス

### publish

イベントをイベントバスにパブリッシュし、サブスクライブしているすべてのリスナーが利用できるようにします。これは非同期操作です。

#### パラメータ

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>イベントの名前。例：`user.created` または `order.shipped`。</x-field-desc>
  </x-field>
  <x-field data-name="event" data-type="object" data-required="true">
    <x-field-desc markdown>イベントの詳細を含むオブジェクト。</x-field-desc>
    <x-field data-name="id" data-type="string" data-required="false">
        <x-field-desc markdown>イベントの一意のID。指定しない場合、自動的に生成されます。</x-field-desc>
    </x-field>
    <x-field data-name="time" data-type="string" data-required="false">
        <x-field-desc markdown>イベントが発生したときのISO 8601タイムスタンプ。デフォルトは現在時刻です。</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object" data-required="true">
        <x-field-desc markdown>イベントのメインペイロード。JSONシリアライズ可能な任意のデータを含めることができます。このオブジェクトの`object_type`および`object_id`フィールドは、フィルタリングを容易にするためにトップレベルのイベントオブジェクトに昇格されます。</x-field-desc>
    </x-field>
  </x-field>
</x-field-group>

#### 例

```javascript ユーザー作成イベントのパブリッシュ icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

async function createUser(userData) {
  // ... ユーザーをデータベースに作成するロジック
  const newUser = { id: 'user_123', name: 'John Doe' };

  try {
    await eventbus.publish('user.created', {
      data: {
        object_type: 'User',
        object_id: newUser.id,
        object: newUser,
        source_system: 'admin_panel',
      },
    });
    console.log('ユーザー作成イベントが正常にパブリッシュされました。');
  } catch (error) {
    console.error('イベントのパブリッシュに失敗しました：', error);
  }

  return newUser;
}
```

### subscribe

イベントバスからイベントを受信するたびに実行されるコールバック関数を登録します。コンポーネントは自身がパブリッシュしたイベントを受信しないことに注意してください。

#### パラメータ

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>イベントが受信されたときにイベントオブジェクトを引数として呼び出されるコールバック関数。</x-field-desc>
  </x-field>
</x-field-group>


#### イベントオブジェクトの構造 (`TEvent`)

コールバック関数は、単一の引数であるイベントオブジェクトを受け取ります。このオブジェクトは、CloudEvents仕様に基づいた標準化された構造を持っています。

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="イベントインスタンスの一意の識別子。"></x-field>
  <x-field data-name="source" data-type="string" data-required="true">
    <x-field-desc markdown>イベントをパブリッシュしたコンポーネントのDID。</x-field-desc>
  </x-field>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>イベントの名前（例：`user.created`）。</x-field-desc>
  </x-field>
  <x-field data-name="time" data-type="string" data-required="true">
    <x-field-desc markdown>イベントが作成されたときのISO 8601タイムスタンプ。</x-field-desc>
  </x-field>
  <x-field data-name="spec_version" data-type="string" data-required="true" data-desc="CloudEvents仕様のバージョン。例：'1.0.0'。"></x-field>
  <x-field data-name="object_type" data-type="string" data-required="false">
    <x-field-desc markdown>イベントデータのプライマリオブジェクトのタイプ（例：`User`）。</x-field-desc>
  </x-field>
  <x-field data-name="object_id" data-type="string" data-required="false">
    <x-field-desc markdown>イベントデータのプライマリオブジェクトのID。</x-field-desc>
  </x-field>
  <x-field data-name="data" data-type="object" data-required="true">
    <x-field-desc markdown>イベントの詳細なペイロード。</x-field-desc>
      <x-field data-name="type" data-type="string" data-desc="データのコンテンツタイプ。デフォルトは'application/json'です。"></x-field>
      <x-field data-name="object" data-type="any" data-desc="実際のデータペイロード。"></x-field>
      <x-field data-name="previous_attributes" data-type="any" data-desc="更新イベントの場合、変更前のオブジェクトの状態が含まれることがあります。"></x-field>
  </x-field>
</x-field-group>

#### 例

```javascript イベントのサブスクライブ icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

const handleEvent = (event) => {
  console.log(`受信したイベントのタイプ： ${event.type}`);
  console.log('イベント詳細：', event);

  if (event.type === 'user.created') {
    console.log(`ID: ${event.object_id} の新しいユーザーが作成されました`);
    // UIを更新するか、他のアクションを実行する
  }
};

eventbus.subscribe(handleEvent);

console.log('イベントバスからのイベントをリッスンしています...');
```

### unsubscribe

以前に登録されたイベントリスナーを削除します。メモリリークを防ぐために、コンポーネントがアンマウントされるときや、イベントのリッスンが不要になったときに、この関数を呼び出すことが重要です。

#### パラメータ

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>`subscribe`に渡されたものと**全く同じ**コールバック関数の参照。</x-field-desc>
  </x-field>
</x-field-group>

#### 例

適切にサブスクライブを解除するには、元のコールバック関数への参照を保持する必要があります。

```javascript 完全なサブスクリプションライフサイクル icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

// 1. ハンドラ関数を定義する
const onUserEvent = (event) => {
  console.log(`ユーザーイベントを受信しました： ${event.type}`);
};

// 2. イベントバスをサブスクライブする
eventbus.subscribe(onUserEvent);
console.log('ユーザーイベントをサブスクライブしました。');

// ... アプリケーションのライフサイクルの後半で（例：コンポーネントのアンマウント時）

// 3. 同じ関数参照を使用してサブスクライブを解除する
eventbus.unsubscribe(onUserEvent);
console.log('ユーザーイベントのサブスクライブを解除しました。');
```