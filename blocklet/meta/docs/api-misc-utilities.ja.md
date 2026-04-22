# その他のユーティリティ

このセクションでは、`@blocklet/meta` が提供する特殊なヘルパー関数のコレクションについて説明します。これらのユーティリティは、通信チャネル文字列の解析と作成、アドレスからユニークで視覚的に識別可能なアイコン（Blockies）の生成などのタスクを処理します。

## チャネルユーティリティ

チャネルユーティリティは、Blockletエコシステム内でのリアルタイム通信とイベント処理に使用されるチャネル文字列を作成および解析するための標準化された方法を提供します。これにより、コンポーネント、アプリケーション、およびサービスが通信エンドポイントを確実に識別できるようになります。

### `parseChannel(channel)`

指定されたチャネル文字列を解析し、そのタイプと関連する識別子を含む構造化オブジェクトを返します。

**パラメータ**

<x-field-group>
  <x-field data-name="channel" data-type="string" data-required="true" data-desc="解析されるチャネル文字列。"></x-field>
</x-field-group>

**戻り値**

`type` プロパティと、チャネルの形式に応じたその他のプロパティ（例： `appDid`、`componentDid`、`topic`）を持つオブジェクト。チャネル文字列が空であるか、形式が無効な場合はエラーをスローします。

**例**

```javascript さまざまなチャネルの解析 icon=logos:javascript
import { parseChannel, CHANNEL_TYPE } from '@blocklet/meta/lib/util';

const componentChannel = 'component:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h';
const relayChannel = 'relay:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:news';
const didChannel = 'z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g';

try {
  const parsedComponent = parseChannel(componentChannel);
  console.log(parsedComponent);

  const parsedRelay = parseChannel(relayChannel);
  console.log(parsedRelay);

  const parsedDid = parseChannel(didChannel);
  console.log(parsedDid);
} catch (error) {
  console.error(error.message);
}
```

**レスポンスの例**

```json parsedComponent のレスポンス
{
  "type": "COMPONENT",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "componentDid": "z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h"
}
```

```json parsedRelay のレスポンス
{
  "type": "RELAY",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "topic": "news"
}
```

```json parsedDid のレスポンス
{
  "type": "DID"
}
```

### チャネル作成関数

これらのヘルパー関数は、提供された識別子に基づいて有効なチャネル文字列を生成します。

| Function | Description |
|---|---|
| `getAppPublicChannel(appDid)` | アプリケーションのパブリックチャネル文字列を作成します。 |
| `getComponentChannel(appDid, componentDid)` | 特定のコンポーネントのチャネル文字列を作成します。 |
| `getRelayChannel(appDid, topic)` | アプリケーションのトピックベースのリレーチャネル文字列を作成します。 |
| `getEventBusChannel(appDid)` | アプリケーションのイベントバスチャネル文字列を作成します。 |

**例**

```javascript チャネルの作成 icon=logos:javascript
import {
  getAppPublicChannel,
  getComponentChannel,
  getRelayChannel,
  getEventBusChannel,
} from '@blocklet/meta/lib/util';

const appDid = 'z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g';
const componentDid = 'z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h';
const topic = 'user-updates';

console.log('App Public:', getAppPublicChannel(appDid));
console.log('Component:', getComponentChannel(appDid, componentDid));
console.log('Relay:', getRelayChannel(appDid, topic));
console.log('Event Bus:', getEventBusChannel(appDid));
```

**出力例**

```text
App Public: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:public
Component: component:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h
Relay: relay:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:user-updates
Event Bus: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:eventbus
```

### `CHANNEL_TYPE`

`parseChannel` によって返される可能性のあるチャネルタイプを定義する列挙型のようなオブジェクトです。

- `DID`: 生のDIDアドレス。
- `APP`: アプリケーションのパブリックチャネル。
- `COMPONENT`: 特定のコンポーネントのチャネル。
- `RELAY`: トピックベースのリレーチャネル。
- `EVENT_BUS`: アプリケーションの内部イベントバスチャネル。

## Blockiesの生成

Blockiesは、通常はDIDアドレスなどのシード文字列から生成される、視覚的でピクセル化されたアイコンです。ユーザーやエンティティに対して、シンプルで認識しやすい視覚的識別子を提供します。これらのユーティリティを使用すると、BlockiesアイコンをSVG形式で生成できます。

### `createBlockiesSvg(address, size, caseSensitive, scale)`

入力アドレスまたはシード文字列に基づいて、ブロッキーアイコンの完全なSVG文字列を生成します。

**パラメータ**

| Name | Type | Description | Default |
|---|---|---|---|
| `address` | `string` | **必須。** アイコンの生成に使用されるシード文字列（例：DIDアドレス）。 | |
| `size` | `number` | アイコンのグリッドの片側のブロック数。例えば、8は8x8のグリッドを作成します。 | `8` |
| `caseSensitive` | `boolean` | シード文字列を大文字と小文字を区別して扱うかどうかを決定します。 | `false` |
| `scale` | `number` | 個々のブロックのピクセル単位のサイズ。最終的なSVGの幅と高さは `size * scale` になります。 | `10` |

**戻り値**

生成されたBlockieアイコンの完全なSVGマークアップを含む文字列。

**例**

```javascript Blockieの生成 icon=logos:javascript
import { createBlockiesSvg } from '@blocklet/meta/lib/util';

const didAddress = 'z1S8B6n2E7gGzX2mY3c4V5b6N7m8P9q1A2b';

// Generate a 100x100px icon (10 blocks * 10 scale)
const svgString = createBlockiesSvg(didAddress, 10, false, 10);

console.log(svgString);
```

**レスポンスの例（SVG文字列）**

```xml Blockie SVG出力 icon=mdi:svg
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" fill="hsl(13,67.4%,57.2%)" />
	<g fill="hsl(247,42.4%,53.4%)">
		<rect width="10" height="10" x="20" y="0" />
                <rect width="10" height="10" x="70" y="0" />
                <rect width="10" height="10" x="30" y="10" />
                <!-- ... さらにrect要素 ... -->
	</g>
	<g fill="hsl(22,96.5%,48.6%)">
		<rect width="10" height="10" x="40" y="50" />
                <!-- ... スポットカラー用のさらにrect要素 ... -->
	</g>
</svg>
```

このSVGは、HTMLに直接埋め込んだり、他の画像コンテキストで使用したりできます。