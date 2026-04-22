# 组件间通信

在一个由多个组件组成的 Blocklet 应用中，使它们能够安全可靠地相互通信至关重要。Blocklet SDK 提供了一个高级实用工具 `component.call`，专为此目的而设计。该方法通过处理服务发现、请求签名和自动重试，简化了组件间的 API 调用。

这种方法比直接发起 HTTP 请求更健壮，因为它抽象了底层环境的复杂性，例如动态端口和 Docker 网络，同时确保所有通信都经过身份验证。

## 发起安全 API 调用

组件间通信的主要方法是 `component.call`。它作为 HTTP 客户端（`axios`）的包装器，但会自动注入必要的身份验证标头，以验证调用组件的身份。

### 基本用法

这是一个基本示例，演示一个组件如何调用名为“user-service”的另一个组件上的 API 端点。

```javascript Calling another component icon=logos:javascript
import component from '@blocklet/sdk/component';

async function getUserProfile(userId) {
  try {
    const response = await component.call({
      name: 'user-service', // 目标组件的名称、DID 或标题
      method: 'GET',
      path: `/api/users/${userId}`,
    });

    console.log('用户个人资料：', response.data);
    return response.data;
  } catch (error) {
    console.error('调用 user-service 失败：', error.message);
  }
}
```

### 工作原理

`component.call` 函数通过几个关键步骤简化了通信过程：

1.  **服务发现**：它在应用程序的组件注册表中查找目标组件（例如，“user-service”），以找到其当前位置和元数据。
2.  **端点解析**：它构造正确的内部 URL 以访问该组件，自动处理 Docker 容器网络等复杂性。
3.  **请求签名**：在发送请求之前，它会自动添加特殊的 `x-component-*` 标头。这些标头包含使用调用组件的密钥生成的签名，以证明其身份。
4.  **API 调用**：它使用配置的方法、路径和数据执行 HTTP 请求。
5.  **自动重试**：如果请求因暂时的服务器错误（例如，5xx 状态码）而失败，它将自动以递增的延迟（指数退避）重试几次请求。

此流程确保通信既可靠又安全。接收组件可以使用 [session 中间件](./authentication-session-middleware.md) 来验证签名并授权请求。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Component-to-Component Communication](assets/diagram/component-communication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### `call` 参数

`component.call` 函数接受一个包含以下属性的选项对象：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要调用的目标组件的名称、标题或 DID。"></x-field>
  <x-field data-name="method" data-type="string" data-default="POST" data-required="false" data-desc="请求的 HTTP 方法（例如，'GET'、'POST'、'PUT'、'DELETE'）。"></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="目标组件上的 API 路径（例如，'/api/v1/resource'）。"></x-field>
  <x-field data-name="data" data-type="any" data-required="false">
    <x-field-desc markdown>请求体，通常与 `POST`、`PUT` 或 `PATCH` 方法一起使用。</x-field-desc>
  </x-field>
  <x-field data-name="params" data-type="any" data-required="false" data-desc="要附加到请求 URL 的 URL 查询参数。"></x-field>
  <x-field data-name="headers" data-type="object" data-required="false" data-desc="要与请求一起发送的自定义标头对象。"></x-field>
  <x-field data-name="timeout" data-type="number" data-required="false" data-desc="请求超时时间，单位为毫秒。"></x-field>
  <x-field data-name="responseType" data-type="string" data-required="false" data-desc="服务器将响应的数据类型。例如，'stream'。"></x-field>
</x-field-group>

### 返回值

该函数返回一个 `Promise`，它会解析为一个 `AxiosResponse` 对象，其中包含 `data`、`status` 和 `headers` 等属性。

## 高级用法

### 自定义重试行为

你可以通过向 `component.call` 传递第二个参数来自定义自动重试逻辑。这对于适应端点的特定可靠性需求非常有用。

```javascript Custom Retry Options icon=lucide:refresh-cw
import component from '@blocklet/sdk/component';

const callOptions = {
  name: 'data-processor',
  method: 'POST',
  path: '/api/process',
  data: { job: 'some-long-job' },
};

const retryOptions = {
  retries: 5,       // 总共尝试 5 次
  minTimeout: 1000, // 两次重试之间至少等待 1 秒
  factor: 2,        // 每次失败后等待时间加倍
};

async function processData() {
  const response = await component.call(callOptions, retryOptions);
  return response.data;
}
```

`retryOptions` 对象可以具有以下属性：

<x-field-group>
  <x-field data-name="retries" data-type="number" data-default="3" data-desc="要进行的总尝试次数。"></x-field>
  <x-field data-name="factor" data-type="number" data-default="2" data-desc="用于退避的指数因子。"></x-field>
  <x-field data-name="minTimeout" data-type="number" data-default="500" data-desc="两次重试之间的最小超时时间，单位为毫秒。"></x-field>
  <x-field data-name="maxTimeout" data-type="number" data-default="5000" data-desc="两次重试之间的最大超时时间，单位为毫秒。"></x-field>
  <x-field data-name="randomize" data-type="boolean" data-default="true" data-desc="是否随机化超时时间。"></x-field>
  <x-field data-name="onFailedAttempt" data-type="function" data-required="false" data-desc="每次失败尝试时调用的回调函数。"></x-field>
</x-field-group>

### 处理流式响应

对于返回流的端点（例如，下载大文件），你可以设置 `responseType: 'stream'`。这允许你在数据到达时进行处理，而无需将整个响应缓冲在内存中。

```javascript Streaming a File icon=lucide:file-down
import fs from 'fs';
import component from '@blocklet/sdk/component';

async function downloadBackup() {
  const response = await component.call({
    name: 'backup-service',
    method: 'GET',
    path: '/api/export',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream('backup.zip');
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

---

通过使用 `component.call`，你可以轻松构建健壮且安全的多组件应用程序。接下来，你需要学习如何通过验证这些传入的调用来保护你的组件的 API 端点。详情请参阅 [Session 中间件](./authentication-session-middleware.md) 指南。