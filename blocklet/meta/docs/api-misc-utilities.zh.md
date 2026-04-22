# 其他实用工具

本节介绍由 `@blocklet/meta` 提供的一系列专用辅助函数。这些实用工具处理诸如解析和创建通信通道字符串以及从地址生成独特的、视觉上可识别的图标 (Blockies) 等任务。

## 通道实用工具

通道实用工具提供了一种标准化的方法来创建和解析用于 Blocklet 生态系统内实时通信和事件处理的通道字符串。这确保了组件、应用程序和服务能够可靠地识别通信端点。

### `parseChannel(channel)`

解析给定的通道字符串并返回一个包含其类型和相关标识符的结构化对象。

**参数**

<x-field-group>
  <x-field data-name="channel" data-type="string" data-required="true" data-desc="要解析的通道字符串。"></x-field>
</x-field-group>

**返回**

一个包含 `type` 属性以及根据通道格式而定的其他属性（例如 `appDid`、`componentDid`、`topic`）的对象。如果通道字符串为空或格式无效，则会抛出错误。

**示例**

```javascript 解析各种通道 icon=logos:javascript
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

**示例响应**

```json parsedComponent 的响应
{
  "type": "COMPONENT",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "componentDid": "z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h"
}
```

```json parsedRelay 的响应
{
  "type": "RELAY",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "topic": "news"
}
```

```json parsedDid 的响应
{
  "type": "DID"
}
```

### 通道创建函数

这些辅助函数根据提供的标识符生成有效的通道字符串。

| 函数 | 描述 |
|---|---|
| `getAppPublicChannel(appDid)` | 为应用程序创建一个公共通道字符串。 |
| `getComponentChannel(appDid, componentDid)` | 为特定组件创建一个通道字符串。 |
| `getRelayChannel(appDid, topic)` | 为应用程序创建一个基于主题的中继通道字符串。 |
| `getEventBusChannel(appDid)` | 为应用程序创建一个事件总线通道字符串。 |

**示例**

```javascript 创建通道 icon=logos:javascript
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

**示例输出**

```text
App Public: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:public
Component: component:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h
Relay: relay:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:user-updates
Event Bus: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:eventbus
```

### `CHANNEL_TYPE`

一个类似枚举的对象，定义了 `parseChannel` 返回的可能通道类型。

- `DID`：一个原始的 DID 地址。
- `APP`：应用程序的公共通道。
- `COMPONENT`：特定组件的通道。
- `RELAY`：一个基于主题的中继通道。
- `EVENT_BUS`：应用程序的内部事件总线通道。

## Blockies 生成

Blockies 是从种子字符串（通常是 DID 地址）生成的视觉化、像素化的图标。它们为用户和实体提供了一个简单且可识别的视觉标识符。这些实用工具允许您以 SVG 格式生成 Blockies 图标。

### `createBlockiesSvg(address, size, caseSensitive, scale)`

根据输入的地址或种子字符串，为块状图标生成一个完整的 SVG 字符串。

**参数**

| 名称 | 类型 | 描述 | 默认值 |
|---|---|---|---|
| `address` | `string` | **必需。** 用于生成图标的种子字符串（例如，DID 地址）。 | |
| `size` | `number` | 图标网格每边的块数。例如，8 会创建一个 8x8 的网格。 | `8` |
| `caseSensitive` | `boolean` | 决定种子字符串是否应区分大小写。 | `false` |
| `scale` | `number` | 每个独立块的像素大小。最终的 SVG 宽度和高度将是 `size * scale`。 | `10` |

**返回**

一个包含生成的 Blockie 图标的完整 SVG 标记的字符串。

**示例**

```javascript 生成一个 Blockie icon=logos:javascript
import { createBlockiesSvg } from '@blocklet/meta/lib/util';

const didAddress = 'z1S8B6n2E7gGzX2mY3c4V5b6N7m8P9q1A2b';

// Generate a 100x100px icon (10 blocks * 10 scale)
const svgString = createBlockiesSvg(didAddress, 10, false, 10);

console.log(svgString);
```

**示例响应 (SVG 字符串)**

```xml Blockie SVG 输出 icon=mdi:svg
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
                <!-- ... 更多用于点缀色的 rect 元素 ... -->
	</g>
</svg>
```

此 SVG 可以直接嵌入 HTML 或在其他图像上下文中使用。