# SDK 客户端

SDK 客户端提供了与 `@blocklet/js-sdk` 交互的主要入口点。它提供了一个主要的 `BlockletSDK` 类，该类捆绑了所有可用的服务，以及几个工厂函数（`getBlockletSDK`、`createAxios`、`createFetch`），以便于访问和实例化。

本节提供了这些核心组件的详细参考。有关实际示例，请参阅[发出 API 请求](./guides-making-api-requests.md)指南。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![SDK Client](assets/diagram/client-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## BlockletSDK 类

`BlockletSDK` 类是一个容器，它持有所有不同服务的实例，为 SDK 的功能提供了一个单一的访问点。

虽然您可以直接实例化它，但推荐的获取实例的方法是通过 `getBlockletSDK()` 工厂函数，这能确保在您的整个应用程序中只有一个共享的实例。

### 属性

以下服务可作为 `BlockletSDK` 实例的属性使用：

| 属性      | 服务                                                    | 描述                                                  |
|---------------|------------------------------------------------------------|--------------------------------------------------------------|
| `user`        | [AuthService](./api-services-auth.md)                           | 管理用户个人资料、设置和身份验证操作。 |
| `userSession` | [UserSessionService](./api-services-user-session.md)           | 获取并管理跨设备的用户登录会话。      |
| `token`       | [TokenService](./api-services-token.md)                         | 用于管理会话和刷新令牌的低级服务。   |
| `blocklet`    | [BlockletService](./api-services-blocklet.md)                   | 获取并加载 blocklet 元数据。                         |
| `federated`   | [FederatedService](./api-services-federated.md)                 | 与联合登录组设置进行交互。               |
| `api`         | `Axios`                                                    | **已弃用。** 一个 Axios 实例。请改用 `createAxios()`。 |

## 工厂函数

这些辅助函数为创建 SDK 客户端和 HTTP 请求处理程序提供了便捷的方法。

### getBlockletSDK()

`getBlockletSDK()`

此函数返回 `BlockletSDK` 类的单例实例。使用单例可确保应用程序的所有部分共享相同的 SDK 状态，包括令牌信息和服务配置。

**返回**

一个 `BlockletSDK` 单例实例。

```javascript 使用 getBlockletSDK icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserProfile() {
  try {
    const profile = await sdk.user.getProfile();
    console.log('User Profile:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}

fetchUserProfile();
```

### createAxios()

`createAxios(config, requestParams)`

这是用于创建预配置 [Axios](https://axios-http.com/) 实例的推荐工厂函数。该实例会自动处理向传出请求添加授权标头，并在会话令牌过期时刷新它。

**参数**

<x-field-group>
  <x-field data-name="config" data-type="AxiosRequestConfig" data-required="false" data-desc="可选。一个标准的 Axios 配置对象。任何有效的 Axios 选项都可以传递到这里。"></x-field>
  <x-field data-name="requestParams" data-type="RequestParams" data-required="false" data-desc="可选。用于 SDK 特定请求处理的附加参数。"></x-field>
</x-field-group>

**返回**

一个配置了用于自动令牌管理的拦截器的 `Axios` 实例。

```javascript 创建一个 Axios 客户端 icon=logos:javascript
import { createAxios } from '@blocklet/js-sdk';

// 使用基础 URL 创建一个 API 客户端
const apiClient = createAxios({
  baseURL: '/api/v1',
});

async function getItems() {
  try {
    // Authorization 标头会自动添加
    const response = await apiClient.get('/items');
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}
```

### createFetch()

`createFetch(options, requestParams)`

对于喜欢原生 [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 的开发者，此函数返回一个包装的 `fetch` 函数，该函数提供与 `createAxios` 相同的自动令牌管理功能。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="RequestInit" data-required="false" data-desc="可选。Fetch API 的默认选项，例如标头，如标准 RequestInit 类型中定义。"></x-field>
  <x-field data-name="requestParams" data-type="RequestParams" data-required="false" data-desc="可选。用于 SDK 特定请求处理的附加参数。"></x-field>
</x-field-group>

**返回**

一个自动处理身份验证的与 `fetch` 兼容的函数。

```javascript 创建一个 Fetch 客户端 icon=logos:javascript
import { createFetch } from '@blocklet/js-sdk';

// 创建一个带有默认 JSON 标头的 fetcher
const apiFetcher = createFetch({
  headers: {
    'Content-Type': 'application/json',
  },
});

async function postItem(item) {
  try {
    const response = await apiFetcher('/api/v1/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error posting item:', error);
    throw error;
  }
}
```

---

SDK 客户端初始化后，您现在可以探索它提供的各种服务，以便与 Blocklet 生态系统进行交互。

<x-cards>
  <x-card data-title="身份验证指南" data-icon="lucide:key-round" data-href="/guides/authentication">
    了解 SDK 如何简化用户身份验证和令牌管理。
  </x-card>
  <x-card data-title="服务 API 参考" data-icon="lucide:book-open" data-href="/api/services">
    深入了解每个服务的详细 API 文档。
  </x-card>
</x-cards>