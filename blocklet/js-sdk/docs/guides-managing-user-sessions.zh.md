# 管理用户会话

`@blocklet/js-sdk` 提供了一个 `UserSessionService`，帮助您在不同设备上获取和管理用户登录会话。这对于构建“安全”或“设备”页面等功能特别有用，用户可以在这些页面上查看所有活动会话，了解其帐户在何处被使用。

本指南将引导您了解管理用户会话的常见用例。

### 访问 UserSessionService

首先，获取 Blocklet SDK 的一个实例。`UserSessionService` 可在 `userSession` 属性下找到。

```javascript SDK Initialization icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();
const userSessionService = sdk.userSession;
```

## 获取自己的登录会话

最常见的任务是检索当前已验证用户的会话列表。`getMyLoginSessions` 方法允许您执行此操作，并支持分页和筛选。

```javascript Fetching the current user's sessions icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchMySessions() {
  try {
    const sdk = getBlockletSDK();
    // Fetch the first page of 10 online sessions
    const result = await sdk.userSession.getMyLoginSessions({}, {
      page: 1,
      pageSize: 10,
      status: 'online', // Optional filter: 'online' | 'expired' | 'offline'
    });

    console.log(`Total online sessions: ${result.paging.total}`);
    result.list.forEach(session => {
      console.log(`- Session on ${session.ua} last active at ${session.updatedAt}`);
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

fetchMySessions();
```

### 参数

方法签名为 `getMyLoginSessions({ appUrl?: string }, params: UserSessionQuery)`。第二个参数是一个查询对象，包含以下参数：

<x-field-group>
  <x-field data-name="page" data-type="number" data-default="1" data-desc="要检索的页码。"></x-field>
  <x-field data-name="pageSize" data-type="number" data-default="10" data-desc="每页的会话数。"></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="根据当前状态筛选会话。"></x-field>
</x-field-group>

### 响应

该方法返回一个解析为 `UserSessionList` 对象的 Promise。

<x-field data-name="" data-type="object" data-desc="包含会话列表和分页详细信息的响应对象。">
  <x-field data-name="list" data-type="UserSession[]" data-desc="用户会话对象数组。">
    <x-field data-name="" data-type="object" data-desc="单个用户会话对象。">
      <x-field data-name="id" data-type="string" data-desc="会话的唯一标识符。"></x-field>
      <x-field data-name="appName" data-type="string" data-desc="创建会话的应用程序名称。"></x-field>
      <x-field data-name="appPid" data-type="string" data-desc="应用程序的 Blocklet PID。"></x-field>
      <x-field data-name="lastLoginIp" data-type="string" data-desc="此会话的最后已知 IP 地址。"></x-field>
      <x-field data-name="ua" data-type="string" data-desc="客户端设备的用户代理字符串。"></x-field>
      <x-field data-name="updatedAt" data-type="string" data-desc="最后活动的时间戳。"></x-field>
      <x-field data-name="status" data-type="string" data-desc="会话的当前状态（例如，'online'）。"></x-field>
      <x-field data-name="userDid" data-type="string" data-desc="与会话关联的用户的 DID。"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="paging" data-type="object" data-desc="分页信息。">
    <x-field data-name="page" data-type="number" data-desc="当前页码。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每页的项目数。"></x-field>
    <x-field data-name="total" data-type="number" data-desc="与查询匹配的会话总数。"></x-field>
  </x-field>
</x-field>


## 获取特定用户的会话

在某些情况下，例如管理员仪表板，您可能需要获取非当前登录用户的登录会话。`getUserSessions` 方法允许您通过提供用户的 DID 来实现此功能。

```javascript Fetching sessions for a specific DID icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchUserSessions(userDid) {
  try {
    const sdk = getBlockletSDK();
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });

    console.log(`Found ${sessions.length} sessions for user ${userDid}:`);
    sessions.forEach(session => {
      console.log(`- Session ID: ${session.id}, App: ${session.appName}`);
    });
  } catch (error) {
    console.error(`Failed to fetch sessions for user ${userDid}:`, error);
  }
}

// Replace with the target user's DID
fetchUserSessions('zNK...some...user...did');
```

### 参数

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要获取其会话的用户的 DID。"></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="应用程序的基础 URL。默认为当前 Blocklet 的服务 URL。"></x-field>
</x-field-group>

### 响应

该方法返回一个解析为 `UserSession` 对象数组的 Promise。

<x-field data-name="" data-type="UserSession[]" data-desc="指定用户的用户会话对象数组。">
  <x-field data-name="" data-type="object" data-desc="单个用户会话对象。">
    <x-field data-name="id" data-type="string" data-desc="会话的唯一标识符。"></x-field>
    <x-field data-name="appName" data-type="string" data-desc="创建会话的应用程序名称。"></x-field>
    <x-field data-name="appPid" data-type="string" data-desc="应用程序的 Blocklet PID。"></x-field>
    <x-field data-name="ua" data-type="string" data-desc="客户端设备的用户代理字符串。"></x-field>
    <x-field data-name="updatedAt" data-type="string" data-desc="最后活动的时间戳。"></x-field>
    <x-field data-name="status" data-type="string" data-desc="会话的当前状态。"></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="与会话关联的用户的 DID。"></x-field>
  </x-field>
</x-field>

---

本指南介绍了使用 SDK 检索用户会话信息的主要方法。有关所有可用方法和详细类型定义的完整列表，请参阅 [UserSessionService API 参考](./api-services-user-session.md)。