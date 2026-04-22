# UserSessionService

`UserSessionService` 提供了一个 API，用于获取和管理用户在不同设备和应用程序中的登录会话。该服务对于构建功能至关重要，这些功能允许用户查看其活跃的登录位置、了解哪些设备访问了他们的账户以及管理这些会话。

有关使用此服务的实用指南，请参阅[管理用户会话](./guides-managing-user-sessions.md)指南。

## 方法

### getMyLoginSessions()

检索当前用户自己的登录会话的分页列表。

**参数**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="一个包含配置选项的对象。">
    <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="要查询的应用程序的基础 URL。">
    </x-field>
  </x-field>
  <x-field data-name="params" data-type="UserSessionQuery" data-required="false" data-default="{ page: 1, pageSize: 10 }" data-desc="一个用于分页和筛选的对象。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="要检索的页码。">
    </x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每页的项目数。">
    </x-field>
    <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="按会话状态筛选。">
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="Promise<UserSessionList>" data-type="Promise" data-desc="一个解析为包含会话列表和分页详细信息的对象的 Promise。">
</x-field>

**示例**

```javascript 获取我的在线会话 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchMySessions() {
  try {
    const sessionData = await sdk.userSession.getMyLoginSessions(
      {},
      { page: 1, pageSize: 5, status: 'online' }
    );
    console.log('在线会话：', sessionData.list);
    console.log('在线会话总数：', sessionData.paging.total);
  } catch (error) {
    console.error('获取会话失败：', error);
  }
}

fetchMySessions();
```

**响应示例**

```json
{
  "list": [
    {
      "id": "z8V...",
      "appName": "My Blocklet",
      "appPid": "my-blocklet-pid",
      "lastLoginIp": "192.168.1.1",
      "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "status": "online",
      "userDid": "zNK..."
    }
  ],
  "paging": {
    "page": 1,
    "pageSize": 5,
    "total": 1
  }
}
```

### getUserSessions()

检索特定用户 DID 的所有登录会话。此方法通常用于管理场景。

**参数**

<x-field data-name="options" data-type="object" data-required="true" data-desc="一个包含用户 DID 和可选应用 URL 的对象。">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要获取其会话的用户的 DID。">
  </x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="要查询的应用程序的基础 URL。">
  </x-field>
</x-field>

**返回**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="一个解析为 UserSession 对象数组的 Promise。">
</x-field>

**示例**

```javascript 获取特定用户的会话 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserSessions(userDid) {
  try {
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });
    console.log(`用户 ${userDid} 的会话：`, sessions);
  } catch (error) {
    console.error('获取用户会话失败：', error);
  }
}

fetchUserSessions('zNK...userDid...'); // 替换为有效的用户 DID
```

**响应示例**

```json
[
  {
    "id": "z8V...",
    "appName": "My Blocklet",
    "appPid": "my-blocklet-pid",
    "lastLoginIp": "192.168.1.1",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "status": "online",
    "userDid": "zNK..."
  }
]
```

### loginByUserSession()

基于现有用户会话 ID 发起新登录。此功能可用于实现跨相关应用程序的无缝登录等功能。

**参数**

<x-field data-name="options" data-type="object" data-required="true" data-desc="一个包含登录所需会话详细信息的对象。">
  <x-field data-name="id" data-type="string" data-required="true" data-desc="用于登录的现有会话的 ID。">
  </x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="要登录的应用程序的 PID。">
  </x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="与会话关联的用户的 DID。">
  </x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="用户 Passport 的 ID。">
  </x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="应用程序的基础 URL。">
  </x-field>
</x-field>

**返回**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="一个解析为包含新用户会话的数组的 Promise。">
</x-field>

**示例**

```javascript 使用现有会话登录 icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function loginWithSession(sessionDetails) {
  try {
    const newSessions = await sdk.userSession.loginByUserSession(sessionDetails);
    console.log('使用新会话成功登录：', newSessions[0]);
  } catch (error) {
    console.error('通过会话登录失败：', error);
  }
}

const existingSession = {
  id: 'session_id_to_use',
  appPid: 'target_app_pid',
  userDid: 'zNK...userDid...',
  passportId: 'passport_id_string'
};

loginWithSession(existingSession);
```

## 数据结构

`UserSessionService` 使用的主要数据结构如下。

### UserSession

表示用户在特定应用程序中的单个登录会话。

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="会话的唯一标识符。">
  </x-field>
  <x-field data-name="appName" data-type="string" data-required="true" data-desc="会话来源的应用程序名称。">
  </x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="应用程序的 PID。">
  </x-field>
  <x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="此会话的最后已知 IP 地址。">
  </x-field>
  <x-field data-name="ua" data-type="string" data-required="true" data-desc="客户端设备的用户代理（User-Agent）字符串。">
  </x-field>
  <x-field data-name="createdAt" data-type="string" data-required="false" data-desc="会话创建时的时间戳。">
  </x-field>
  <x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="此会话最后活动的时间戳。">
  </x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="会话的当前状态。">
  </x-field>
  <x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="用户的详细信息。">
  </x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="拥有该会话的用户的 DID。">
  </x-field>
  <x-field data-name="visitorId" data-type="string" data-required="true" data-desc="访问者/设备的标识符。">
  </x-field>
  <x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="用户 Passport 的 ID。">
  </x-field>
  <x-field data-name="extra" data-type="object" data-required="true" data-desc="附加元数据。">
    <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="所用钱包的操作系统。">
    </x-field>
  </x-field>
</x-field-group>

### UserSessionUser

包含与会话关联的用户的详细信息。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的去中心化标识符（DID）。">
  </x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="用户的全名。">
  </x-field>
  <x-field data-name="email" data-type="string" data-required="true" data-desc="用户的电子邮件地址。">
  </x-field>
  <x-field data-name="avatar" data-type="string" data-required="true" data-desc="用户头像图片的 URL。">
  </x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="用户的公钥。">
  </x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="用户在应用程序中的角色（例如，'owner'、'admin'）。">
  </x-field>
  <x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="用户角色的显示标题。">
  </x-field>
  <x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="用于身份验证的提供商。">
  </x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="提供用户数据的应用程序的 PID。">
  </x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="关于用户的任何备注或注释。">
  </x-field>
</x-field-group>

### UserSessionList

用户会话的分页列表。

<x-field-group>
  <x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="一个用户会话对象的数组。">
  </x-field>
  <x-field data-name="paging" data-type="object" data-required="true" data-desc="一个包含分页详细信息的对象。">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="当前页码。">
    </x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每页的项目数。">
    </x-field>
    <x-field data-name="total" data-type="number" data-required="true" data-desc="项目总数。">
    </x-field>
  </x-field>
</x-field-group>

### UserSessionQuery

用于筛选和分页会话查询的对象。

<x-field-group>
  <x-field data-name="page" data-type="number" data-required="true" data-desc="要检索的页码。">
  </x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="每页的会话数。">
  </x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="按会话状态筛选。">
  </x-field>
</x-field-group>