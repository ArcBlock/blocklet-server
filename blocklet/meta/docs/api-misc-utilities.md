# Miscellaneous Utilities

This section covers a collection of specialized helper functions provided by `@blocklet/meta`. These utilities handle tasks such as parsing and creating communication channel strings and generating unique, visually identifiable icons (Blockies) from addresses.

## Channel Utilities

Channel utilities provide a standardized way to create and parse channel strings used for real-time communication and event handling within the Blocklet ecosystem. This ensures that components, applications, and services can reliably identify communication endpoints.

### `parseChannel(channel)`

Parses a given channel string and returns a structured object containing its type and relevant identifiers.

**Parameters**

<x-field-group>
  <x-field data-name="channel" data-type="string" data-required="true" data-desc="The channel string to be parsed."></x-field>
</x-field-group>

**Returns**

An object with a `type` property and other properties depending on the channel format (e.g., `appDid`, `componentDid`, `topic`). Throws an error if the channel string is empty or has an invalid format.

**Example**

```javascript Parsing Various Channels icon=logos:javascript
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

**Example Response**

```json Response for parsedComponent
{
  "type": "COMPONENT",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "componentDid": "z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h"
}
```

```json Response for parsedRelay
{
  "type": "RELAY",
  "appDid": "z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g",
  "topic": "news"
}
```

```json Response for parsedDid
{
  "type": "DID"
}
```

### Channel Creation Functions

These helper functions generate valid channel strings based on the provided identifiers.

| Function | Description |
|---|---|
| `getAppPublicChannel(appDid)` | Creates a public channel string for an application. |
| `getComponentChannel(appDid, componentDid)` | Creates a channel string for a specific component. |
| `getRelayChannel(appDid, topic)` | Creates a topic-based relay channel string for an application. |
| `getEventBusChannel(appDid)` | Creates an event bus channel string for an application. |

**Example**

```javascript Creating Channels icon=logos:javascript
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

**Example Output**

```text
App Public: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:public
Component: component:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:z8iX9g5e3ubm5x6iG7xDxwK5N4b2kL1h2h2h
Relay: relay:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:user-updates
Event Bus: app:z2qaVo5e3ubm5x6iG7xDxwK5N4b2kL1g1g1g:eventbus
```

### `CHANNEL_TYPE`

An enum-like object that defines the possible channel types returned by `parseChannel`.

- `DID`: A raw DID address.
- `APP`: A public channel for an application.
- `COMPONENT`: A channel for a specific component.
- `RELAY`: A topic-based relay channel.
- `EVENT_BUS`: An application's internal event bus channel.

## Blockies Generation

Blockies are visual, pixelated icons generated from a seed string, typically a DID address. They provide a simple and recognizable visual identifier for users and entities. These utilities allow you to generate Blockies icons in SVG format.

### `createBlockiesSvg(address, size, caseSensitive, scale)`

Generates a complete SVG string for a blocky icon based on an input address or seed string.

**Parameters**

| Name | Type | Description | Default |
|---|---|---|---|
| `address` | `string` | **Required.** The seed string used to generate the icon (e.g., a DID address). | |
| `size` | `number` | The number of blocks per side for the icon's grid. For example, 8 creates an 8x8 grid. | `8` |
| `caseSensitive` | `boolean` | Determines if the seed string should be treated as case-sensitive. | `false` |
| `scale` | `number` | The size in pixels for each individual block. The final SVG width and height will be `size * scale`. | `10` |

**Returns**

A string containing the complete SVG markup for the generated Blockie icon.

**Example**

```javascript Generating a Blockie icon=logos:javascript
import { createBlockiesSvg } from '@blocklet/meta/lib/util';

const didAddress = 'z1S8B6n2E7gGzX2mY3c4V5b6N7m8P9q1A2b';

// Generate a 100x100px icon (10 blocks * 10 scale)
const svgString = createBlockiesSvg(didAddress, 10, false, 10);

console.log(svgString);
```

**Example Response (SVG String)**

```xml Blockie SVG Output icon=mdi:svg
<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
	<rect width="100" height="100" fill="hsl(13,67.4%,57.2%)" />
	<g fill="hsl(247,42.4%,53.4%)">
		<rect width="10" height="10" x="20" y="0" />
                <rect width="10" height="10" x="70" y="0" />
                <rect width="10" height="10" x="30" y="10" />
                <!-- ... more rect elements ... -->
	</g>
	<g fill="hsl(22,96.5%,48.6%)">
		<rect width="10" height="10" x="40" y="50" />
                <!-- ... more rect elements for spot color ... -->
	</g>
</svg>
```

This SVG can be directly embedded in HTML or used in other image contexts.