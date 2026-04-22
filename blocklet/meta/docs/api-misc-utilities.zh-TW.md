# 其他公用程式

本節介紹由 `@blocklet/meta` 提供的一系列專業輔助函數。這些公用程式處理諸如解析和建立通訊通道字串，以及從地址產生獨特且視覺上可識別的圖示（Blockies）等任務。

## 通道公用程式

通道公用程式提供了一種標準化方法，用於建立和解析 Blocklet 生態系統內即時通訊和事件處理所使用的通道字串。這確保了元件、應用程式和服務能夠可靠地識別通訊端點。

### `parseChannel(channel)`

解析給定的通道字串，並傳回一個包含其類型和相關識別碼的結構化物件。

**參數**

<x-field-group>
  <x-field data-name="channel" data-type="string" data-required="true" data-desc="要解析的通道字串。"></x-field>
</x-field-group>

**傳回值**

一個包含 `type` 屬性的物件，其他屬性取決於通道格式（例如 `appDid`、`componentDid`、`topic`）。如果通道字串為空或格式無效，則會拋出錯誤。

**範例**

```javascript 解析各種通道 icon=logos:javascript
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

**範例回應**

```json parsedComponent 的回應
{
  "type": "COMPONENT",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "componentDid": "z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h"
}
```

```json parsedRelay 的回應
{
  "type": "RELAY",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "topic": "news"
}
```

```json parsedDid 的回應
{
  "type": "DID"
}
```

### 通道建立函數

這些輔助函數根據提供的識別碼產生有效的通道字串。

| 函數 | 說明 |
|---|---|
| `getAppPublicChannel(appDid)` | 為應用程式建立一個公開通道字串。 |
| `getComponentChannel(appDid, componentDid)` | 為特定元件建立一個通道字串。 |
| `getRelayChannel(appDid, topic)` | 為應用程式建立一個基於主題的中繼通道字串。 |
| `getEventBusChannel(appDid)` | 為應用程式建立一個事件匯流排通道字串。 |

**範例**

```javascript 建立通道 icon=logos:javascript
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

**範例輸出**

```text
App Public: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:public
Component: component:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h
Relay: relay:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:user-updates
Event Bus: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:eventbus
```

### `CHANNEL_TYPE`

一個類枚舉物件，定義了 `parseChannel` 可能傳回的通道類型。

- `DID`：原始的 DID 地址。
- `APP`：應用程式的公開通道。
- `COMPONENT`：特定元件的通道。
- `RELAY`：基於主題的中繼通道。
- `EVENT_BUS`：應用程式的內部事件匯流排通道。

## Blockies 產生

Blockies 是從種子字串（通常是 DID 地址）產生的視覺化、像素化圖示。它們為使用者和實體提供了一個簡單且可識別的視覺識別碼。這些公用程式可讓您以 SVG 格式產生 Blockies 圖示。

### `createBlockiesSvg(address, size, caseSensitive, scale)`

根據輸入的地址或種子字串，產生一個完整的塊狀圖示 SVG 字串。

**參數**

| 名稱 | 類型 | 說明 | 預設值 |
|---|---|---|---|
| `address` | `string` | **必要。** 用於產生圖示的種子字串（例如，DID 地址）。 | |
| `size` | `number` | 圖示網格每邊的區塊數量。例如，8 會建立一個 8x8 的網格。 | `8` |
| `caseSensitive` | `boolean` | 決定種子字串是否應區分大小寫。 | `false` |
| `scale` | `number` | 每個獨立區塊的大小（以像素為單位）。最終的 SVG 寬度和高度將是 `size * scale`。 | `10` |

**傳回值**

一個包含所產生 Blockie 圖示的完整 SVG 標記的字串。

**範例**

```javascript 產生一個 Blockie icon=logos:javascript
import { createBlockiesSvg } from '@blocklet/meta/lib/util';

const didAddress = 'z1S8B6n2E7gGzX2mY3c4V5b6N7m8P9q1A2b';

// Generate a 100x100px icon (10 blocks * 10 scale)
const svgString = createBlockiesSvg(didAddress, 10, false, 10);

console.log(svgString);
```

**範例回應 (SVG 字串)**

```xml Blockie SVG 輸出 icon=mdi:svg
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" fill="hsl(13,67.4%,57.2%)" />
	<g fill="hsl(247,42.4%,53.4%)">
		<rect width="10" height="10" x="20" y="0" />
                <rect width="10" height="10" x="70" y="0" />
                <rect width="10" height="10" x="30" y="10" />
                <!-- ... 更多 rect 元素 ... -->
	</g>
	<g fill="hsl(22,96.5%,48.6%)">
		<rect width="10" height="10" x="40" y="50" />
                <!-- ... 更多用於點綴色的 rect 元素 ... -->
	</g>
</svg>
```

此 SVG 可直接嵌入 HTML 或用於其他圖片情境中。