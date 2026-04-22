# 事件总线

事件总线提供了一种强大的发布-订阅机制，允许您的 blocklet 内部的不同组件，甚至不同 blocklet 之间（在同一个 ABT Node 实例内）以解耦的方式相互通信。这对于广播系统范围的状态变化或事件非常理想，而无需组件之间有直接的依赖关系。

虽然[通知服务](./services-notification-service.md)旨在向用户发送有针对性的消息，但事件总线专为内部、组件到组件的通信而设计。

### 工作原理

事件总线促进了异步通信流程：

1.  **发布者**组件发送一个带有特定名称和负载的事件。
2.  Blocklet SDK 将此事件发送到在 ABT Node 中运行的中央事件总线服务。
3.  然后，事件总线服务将此事件广播到所有正在监听该事件类型的**订阅者**组件。

此过程在下图中进行了可视化：

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Event Bus](assets/diagram/event-bus-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## API 参考

### publish

向事件总线发布一个事件，使其对所有已订阅的监听器可用。这是一个异步操作。

#### 参数

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>事件的名称，例如 `user.created` 或 `order.shipped`。</x-field-desc>
  </x-field>
  <x-field data-name="event" data-type="object" data-required="true">
    <x-field-desc markdown>包含事件详细信息的对象。</x-field-desc>
    <x-field data-name="id" data-type="string" data-required="false">
        <x-field-desc markdown>事件的唯一 ID。如果未提供，将自动生成一个。</x-field-desc>
    </x-field>
    <x-field data-name="time" data-type="string" data-required="false">
        <x-field-desc markdown>事件发生时的 ISO 8601 时间戳。默认为当前时间。</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object" data-required="true">
        <x-field-desc markdown>事件的主要负载。它可以包含任何可 JSON 序列化的数据。此对象中的 `object_type` 和 `object_id` 字段将被提升到顶层事件对象，以便于过滤。</x-field-desc>
    </x-field>
  </x-field>
</x-field-group>

#### 示例

```javascript 发布用户创建事件 icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

async function createUser(userData) {
  // ... 在数据库中创建用户的逻辑
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
    console.log('用户创建事件发布成功。');
  } catch (error) {
    console.error('发布事件失败：', error);
  }

  return newUser;
}
```

### subscribe

注册一个回调函数，每当从事件总线接收到事件时执行。请注意，组件不会接收到它自己发布的事件。

#### 参数

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>一个回调函数，当接收到事件时，将使用事件对象调用该函数。</x-field-desc>
  </x-field>
</x-field-group>


#### 事件对象结构 (`TEvent`)

回调函数接收一个参数：事件对象。该对象具有基于 CloudEvents 规范的标准化结构。

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="事件实例的唯一标识符。"></x-field>
  <x-field data-name="source" data-type="string" data-required="true">
    <x-field-desc markdown>发布事件的组件的 DID。</x-field-desc>
  </x-field>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>事件的名称（例如 `user.created`）。</x-field-desc>
  </x-field>
  <x-field data-name="time" data-type="string" data-required="true">
    <x-field-desc markdown>事件创建时的 ISO 8601 时间戳。</x-field-desc>
  </x-field>
  <x-field data-name="spec_version" data-type="string" data-required="true" data-desc="CloudEvents 规范版本，例如 '1.0.0'。"></x-field>
  <x-field data-name="object_type" data-type="string" data-required="false">
    <x-field-desc markdown>事件数据中主要对象的类型（例如 `User`）。</x-field-desc>
  </x-field>
  <x-field data-name="object_id" data-type="string" data-required="false">
    <x-field-desc markdown>事件数据中主要对象的 ID。</x-field-desc>
  </x-field>
  <x-field data-name="data" data-type="object" data-required="true">
    <x-field-desc markdown>事件的详细负载。</x-field-desc>
      <x-field data-name="type" data-type="string" data-desc="数据的内容类型，默认为 'application/json'。"></x-field>
      <x-field data-name="object" data-type="any" data-desc="实际的数据负载。"></x-field>
      <x-field data-name="previous_attributes" data-type="any" data-desc="对于更新事件，这可能包含更改前对象的状态。"></x-field>
  </x-field>
</x-field-group>

#### 示例

```javascript 订阅事件 icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

const handleEvent = (event) => {
  console.log(`接收到类型为 ${event.type} 的事件`);
  console.log('事件详情：', event);

  if (event.type === 'user.created') {
    console.log(`创建了一个新用户，ID 为：${event.object_id}`);
    // 更新 UI 或执行其他操作
  }
};

eventbus.subscribe(handleEvent);

console.log('正在监听来自事件总线的事件...');
```

### unsubscribe

移除先前注册的事件监听器。在组件卸载或不再需要监听事件时调用此函数至关重要，以防止内存泄漏。

#### 参数

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>传递给 `subscribe` 的**完全相同**的回调函数引用。</x-field-desc>
  </x-field>
</x-field-group>

#### 示例

要正确取消订阅，您必须保留对原始回调函数的引用。

```javascript 完整的订阅生命周期 icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

// 1. 定义处理函数
const onUserEvent = (event) => {
  console.log(`接收到用户事件：${event.type}`);
};

// 2. 订阅事件总线
eventbus.subscribe(onUserEvent);
console.log('已订阅用户事件。');

// ... 在应用程序生命周期的后期（例如，组件卸载时）

// 3. 使用相同的函数引用取消订阅
eventbus.unsubscribe(onUserEvent);
console.log('已取消订阅用户事件。');
```