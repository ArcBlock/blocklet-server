# Blocklet 服务

`BlockletService` 是一个功能强大的客户端，作为您的 blocklet 与底层 ABT Node 服务交互的主要接口。它将复杂的 GraphQL 查询和 HTTP 请求封装成一个简洁的、基于 promise 的 JavaScript API，从而简化了用户管理、会话处理、基于角色的访问控制 (RBAC) 和检索 blocklet 元数据等任务。

该服务对于构建利用 Blocklet 平台全部功能的、安全且功能丰富的应用程序至关重要。在深入了解此服务之前，建议先理解我们的[身份验证](./authentication.md)指南中涵盖的概念。

### 工作原理

您应用程序中的 `BlockletService` 客户端与在 ABT Node 上运行的 `blocklet-service` 进行通信。所有请求都使用 blocklet 的凭据自动进行身份验证，以确保对核心功能的安全访问。

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Blocklet Service](assets/diagram/blocklet-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 开始使用

要使用该服务，只需导入并实例化它即可。客户端将根据 Blocklet Server 提供的环境变量自动配置。

```javascript Getting Started icon=logos:javascript
import BlockletService from '@blocklet/sdk/service/blocklet';

const client = new BlockletService();

async function main() {
  const { user } = await client.getOwner();
  console.log('Blocklet 所有者:', user.fullName);
}

main();
```

## 会话管理

### login

验证用户身份并发起一个会话。

**参数**

<x-field data-name="params" data-type="object" data-required="true" data-desc="登录凭据或数据。"></x-field>

**返回**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="一个包含会话和用户信息对象。">
  <x-field data-name="user" data-type="object" data-desc="已验证用户的个人资料。"></x-field>
  <x-field data-name="token" data-type="string" data-desc="会话的访问令牌。"></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="用于延长会话的刷新令牌。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="访问者/设备的唯一标识符。"></x-field>
</x-field>

### refreshSession

使用刷新令牌刷新已过期的会话。

**参数**

<x-field-group>
  <x-field data-name="refreshToken" data-type="string" data-required="true" data-desc="先前会话中的刷新令牌。"></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="访问者/设备的唯一标识符。"></x-field>
</x-field-group>

**返回**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="一个包含新会话和用户信息对象。">
  <x-field data-name="user" data-type="object" data-desc="已验证用户的个人资料。"></x-field>
  <x-field data-name="token" data-type="string" data-desc="新的访问令牌。"></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="新的刷新令牌。"></x-field>
  <x-field data-name="provider" data-type="string" data-desc="登录提供商（例如，'wallet'）。"></x-field>
</x-field>

### switchProfile

更新用户的个人资料信息。

**参数**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要更新的用户的 DID。"></x-field>
  <x-field data-name="profile" data-type="object" data-required="true" data-desc="一个包含要更新的个人资料字段的对象。">
    <x-field data-name="avatar" data-type="string" data-required="false" data-desc="新的头像 URL。"></x-field>
    <x-field data-name="email" data-type="string" data-required="false" data-desc="新的电子邮件地址。"></x-field>
    <x-field data-name="fullName" data-type="string" data-required="false" data-desc="新的全名。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

## 用户管理

### getUser

通过用户的 DID 检索单个用户的个人资料。

**参数**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要检索的用户的唯一 DID。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="查询的可选配置。">
    <x-field data-name="enableConnectedAccount" data-type="boolean" data-required="false" data-desc="如果为 true，则包含用户关联账户的详细信息（例如，OAuth 提供商）。"></x-field>
    <x-field data-name="includeTags" data-type="boolean" data-required="false" data-desc="如果为 true，则包含与用户关联的任何标签。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含用户个人资料的对象。">
  <x-field data-name="user" data-type="object" data-desc="用户个人资料对象。"></x-field>
</x-field>

### getUsers

检索分页的用户列表，支持筛选和排序。

**参数**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一个包含查询、排序和分页选项的对象。">
  <x-field data-name="paging" data-type="object" data-desc="分页选项。">
    <x-field data-name="page" data-type="number" data-desc="要检索的页码。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每页的用户数。"></x-field>
  </x-field>
  <x-field data-name="query" data-type="object" data-desc="筛选条件。">
    <x-field data-name="role" data-type="string" data-desc="按用户角色筛选。"></x-field>
    <x-field data-name="approved" data-type="boolean" data-desc="按批准状态筛选。"></x-field>
    <x-field data-name="search" data-type="string" data-desc="用于匹配用户字段的搜索字符串。"></x-field>
  </x-field>
  <x-field data-name="sort" data-type="object" data-desc="排序条件。">
    <x-field data-name="updatedAt" data-type="number" data-desc="按更新时间戳排序。`1` 代表升序，`-1` 代表降序。"></x-field>
    <x-field data-name="createdAt" data-type="number" data-desc="按创建时间戳排序。`1` 代表升序，`-1` 代表降序。"></x-field>
    <x-field data-name="lastLoginAt" data-type="number" data-desc="按最后登录时间戳排序。`1` 代表升序，`-1` 代表降序。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="一个分页的用户对象列表。">
  <x-field data-name="users" data-type="TUserInfo[]" data-desc="一个用户个人资料对象数组。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分页信息。">
    <x-field data-name="total" data-type="number" data-desc="用户总数。"></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="每页的用户数。"></x-field>
    <x-field data-name="page" data-type="number" data-desc="当前页码。"></x-field>
  </x-field>
</x-field>

### getUsersCount

获取用户总数。

**返回**

<x-field data-name="ResponseGetUsersCount" data-type="Promise<object>" data-desc="一个包含用户总数的对象。">
  <x-field data-name="count" data-type="number" data-desc="用户总数。"></x-field>
</x-field>

### getUsersCountPerRole

获取每个角色的用户数。

**返回**

<x-field data-name="ResponseGetUsersCountPerRole" data-type="Promise<object>" data-desc="一个包含每个角色用户数的对象。">
  <x-field data-name="counts" data-type="TKeyValue[]" data-desc="一个对象数组，其中每个对象都有一个 `key`（角色名）和 `value`（用户数）。"></x-field>
</x-field>

### getOwner

检索 blocklet 所有者的个人资料。

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含所有者用户个人资料的对象。"></x-field>

### updateUserApproval

批准或撤销用户对 blocklet 的访问权限。

**参数**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="要更新的用户的 DID。"></x-field>
  <x-field data-name="approved" data-type="boolean" data-required="true" data-desc="设置为 `true` 表示批准，`false` 表示撤销。"></x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### updateUserTags

更新与用户关联的标签。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
  <x-field data-name="tags" data-type="number[]" data-required="true" data-desc="要与用户关联的标签 ID 数组。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### updateUserExtra

更新用户的额外元数据。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="关于用户的备注或注释。"></x-field>
  <x-field data-name="extra" data-type="string" data-required="false" data-desc="用于存储自定义数据的 JSON 字符串。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### updateUserInfo

更新用户的一般信息。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="userInfo" data-type="object" data-required="true" data-desc="一个包含要更新的用户字段的对象。必须包含用户的 `did`。"></x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### updateUserAddress

更新用户的物理地址。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="一个包含用户 DID 和地址详细信息的对象。">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
    <x-field data-name="address" data-type="object" data-required="false" data-desc="用户的地址。">
      <x-field data-name="country" data-type="string" data-desc="国家"></x-field>
      <x-field data-name="province" data-type="string" data-desc="州/省"></x-field>
      <x-field data-name="city" data-type="string" data-desc="城市"></x-field>
      <x-field data-name="postalCode" data-type="string" data-desc="邮政编码"></x-field>
      <x-field data-name="line1" data-type="string" data-desc="地址行 1"></x-field>
      <x-field data-name="line2" data-type="string" data-desc="地址行 2"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

## 用户会话

### getUserSessions

检索用户的活动会话列表。

**参数**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一个包含查询和分页选项的对象。">
  <x-field data-name="paging" data-type="object" data-desc="分页选项。"></x-field>
  <x-field data-name="query" data-type="object" data-desc="筛选条件。">
    <x-field data-name="userDid" data-type="string" data-desc="按用户 DID 筛选。"></x-field>
    <x-field data-name="status" data-type="string" data-desc="按会话状态筛选。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseUserSessions" data-type="Promise<object>" data-desc="一个分页的用户会话列表。">
  <x-field data-name="list" data-type="TUserSession[]" data-desc="一个会话对象数组。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分页信息。"></x-field>
</x-field>

### getUserSessionsCount

获取用户会话的总数，支持可选筛选。

**参数**

<x-field data-name="args" data-type="object" data-required="false" data-desc="一个包含查询选项的对象。">
  <x-field data-name="query" data-type="object" data-desc="筛选条件。">
    <x-field data-name="userDid" data-type="string" data-desc="按用户 DID 筛选。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseUserSessionsCount" data-type="Promise<object>" data-desc="一个包含会话总数的对象。">
  <x-field data-name="count" data-type="number" data-desc="会话总数。"></x-field>
</x-field>

## 社交与社区

### getUserFollowers

检索关注特定用户的用户列表。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查询选项。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要检索其关注者列表的用户的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分页选项。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="一个分页的关注者用户列表。"></x-field>

### getUserFollowing

检索特定用户正在关注的用户列表。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查询选项。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要检索其关注列表的用户的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分页选项。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="一个分页的被关注用户列表。"></x-field>

### getUserFollowStats

获取用户的关注者和正在关注的数量。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查询选项。">
    <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="一个用户 DID 数组。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUserRelationCount" data-type="Promise<object>" data-desc="一个包含关注者和关注数量的对象。"></x-field>

### checkFollowing

检查一个用户是否正在关注一个或多个其他用户。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="潜在关注者的 DID。"></x-field>
  <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="要检查的用户 DID 数组。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseCheckFollowing" data-type="Promise<object>" data-desc="一个对象，其中键是用户 DID，值是表示关注状态的布尔值。"></x-field>

### followUser

使一个用户关注另一个用户。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="正在关注的用户的 DID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要被关注的用户的 DID。"></x-field>
</x-field>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### unfollowUser

使一个用户取消关注另一个用户。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="正在取消关注的用户的 DID。"></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="要被取消关注的用户的 DID。"></x-field>
</x-field>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### getUserInvites

检索由特定用户邀请的用户列表。需要有效的用户会话 cookie。

**参数**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="查询选项。">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="邀请者的 DID。"></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="分页选项。"></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="请求选项，包括头信息。">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="用户的会话 cookie。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="一个分页的受邀用户列表。"></x-field>

## 标签管理

### getTags

检索所有可用的用户标签列表。

**参数**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="分页选项。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseTags" data-type="Promise<object>" data-desc="一个分页的标签对象列表。">
  <x-field data-name="tags" data-type="TTag[]" data-desc="一个标签对象数组。"></x-field>
  <x-field data-name="paging" data-type="object" data-desc="分页信息。"></x-field>
</x-field>

### createTag

创建一个新的用户标签。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="title" data-type="string" data-required="true" data-desc="标签的标题。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="标签的描述。"></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="标签的十六进制颜色代码。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一个包含新创建标签的对象。"></x-field>

### updateTag

更新一个已有的用户标签。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="要更新的标签的 ID。"></x-field>
    <x-field data-name="title" data-type="string" data-required="false" data-desc="新的标题。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="新的描述。"></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="新的颜色。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一个包含更新后标签的对象。"></x-field>

### deleteTag

删除一个用户标签。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="要删除的标签的 ID。"></x-field>
  </x-field>
</x-field>

**返回**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="一个包含已删除标签的对象。"></x-field>

## 基于角色的访问控制 (RBAC)

### getRoles

检索所有可用角色的列表。

**返回**

<x-field data-name="ResponseRoles" data-type="Promise<object>" data-desc="一个包含角色列表的对象。">
  <x-field data-name="roles" data-type="TRole[]" data-desc="一个角色对象数组。"></x-field>
</x-field>

### getRole

通过名称检索单个角色。

**参数**

<x-field data-name="name" data-type="string" data-required="true" data-desc="角色的唯一名称。"></x-field>

**返回**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一个包含角色详细信息的对象。"></x-field>

### createRole

创建一个新角色。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="角色的唯一标识符（例如，`editor`）。"></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="一个人类可读的标题（例如，`Content Editor`）。"></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="对角色用途的简要描述。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一个包含新创建角色的对象。"></x-field>

### updateRole

更新一个已有的角色。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要更新的角色的名称。"></x-field>
  <x-field data-name="updates" data-type="object" data-required="true" data-desc="一个包含要更新字段的对象。">
    <x-field data-name="title" data-type="string" data-required="false" data-desc="新的标题。"></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="新的描述。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一个包含更新后角色的对象。"></x-field>

### deleteRole

删除一个角色。

**参数**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要删除的角色的名称。"></x-field>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### getPermissions

检索所有可用权限的列表。

**返回**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="一个包含权限列表的对象。">
  <x-field data-name="permissions" data-type="TPermission[]" data-desc="一个权限对象数组。"></x-field>
</x-field>

### getPermissionsByRole

检索授予特定角色的所有权限。

**参数**

<x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名称。"></x-field>

**返回**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="一个包含该角色权限列表的对象。"></x-field>

### createPermission

创建一个新权限。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="权限的唯一名称（例如，`post:create`）。"></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="描述该权限允许的操作。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="一个包含新创建权限的对象。"></x-field>

### updatePermission

更新一个已有的权限。

**参数**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要更新的权限的名称。"></x-field>
  <x-field data-name="updates" data-type="object" data-required="true">
    <x-field data-name="description" data-type="string" data-required="false" data-desc="权限的新描述。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="一个包含更新后权限的对象。"></x-field>

### deletePermission

删除一个权限。

**参数**

<x-field data-name="name" data-type="string" data-required="true" data-desc="要删除的权限的名称。"></x-field>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### grantPermissionForRole

为角色分配一个权限。

**参数**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名称。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要授予的权限的名称。"></x-field>
</x-field-group>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### revokePermissionFromRole

从角色中撤销一个权限。

**参数**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名称。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要撤销的权限的名称。"></x-field>
</x-field-group>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

### updatePermissionsForRole

用一组新的权限替换角色的所有现有权限。

**参数**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="角色的名称。"></x-field>
  <x-field data-name="permissions" data-type="string[]" data-required="true" data-desc="要为该角色设置的权限名称数组。"></x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="一个包含更新后角色的对象。"></x-field>

### hasPermission

检查角色是否具有特定权限。

**参数**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="要检查的角色的名称。"></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="要验证的权限的名称。"></x-field>
</x-field-group>

**返回**

<x-field data-name="BooleanResponse" data-type="Promise<object>" data-desc="一个带有布尔 `result` 属性的对象。">
  <x-field data-name="result" data-type="boolean" data-desc="如果角色拥有该权限，则为 `true`，否则为 `false`。"></x-field>
</x-field>

## 通行证管理

### issuePassportToUser

向用户颁发一个新的通行证，并为其分配一个角色。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="接收通行证的用户的 DID。"></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="通过此通行证分配的角色。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象，包括新的通行证。"></x-field>

### enableUserPassport

为用户启用先前已撤销的通行证。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要启用的通行证的 ID。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### revokeUserPassport

撤销用户的通行证。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要撤销的通行证的 ID。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="一个包含更新后用户个人资料的对象。"></x-field>

### removeUserPassport

永久移除用户的通行证。

**参数**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="用户的 DID。"></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="要移除的通行证的 ID。"></x-field>
</x-field>

**返回**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="一个表示成功或失败的通用响应对象。"></x-field>

## Blocklet 与组件信息

### getBlocklet

检索当前 blocklet 的元数据和状态。

**参数**

<x-field-group>
  <x-field data-name="attachRuntimeInfo" data-type="boolean" data-default="false" data-required="false" data-desc="如果为 `true`，则包含 CPU 和内存使用情况等运行时信息。"></x-field>
  <x-field data-name="useCache" data-type="boolean" data-default="true" data-required="false" data-desc="如果为 `false`，则绕过缓存以获取最新数据。"></x-field>
</x-field-group>

**返回**

<x-field data-name="ResponseBlocklet" data-type="Promise<object>" data-desc="一个包含 blocklet 状态和元数据的对象。"></x-field>

### getComponent

通过其 DID 检索当前 blocklet 中特定组件的状态。

**参数**

<x-field data-name="did" data-type="string" data-required="true" data-desc="要检索的组件的 DID。"></x-field>

**返回**

<x-field data-name="ComponentState" data-type="Promise<object>" data-desc="一个包含组件状态和元数据的对象。"></x-field>

### getTrustedDomains

检索用于联合登录的受信任域列表。

**返回**

<x-field data-name="string[]" data-type="Promise<string[]>" data-desc="一个受信任的域 URL 数组。"></x-field>

### getVault

检索并验证 blocklet 的保险库信息。

**返回**

<x-field data-name="vault" data-type="Promise<string>" data-desc="验证成功后的保险库字符串。"></x-field>

### clearCache

根据模式清除节点上的缓存数据。

**参数**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="pattern" data-type="string" data-required="false" data-desc="用于匹配要删除的缓存键的模式。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseClearCache" data-type="Promise<object>" data-desc="一个包含已删除缓存键列表的对象。">
  <x-field data-name="removed" data-type="string[]" data-desc="从缓存中删除的键的数组。"></x-field>
</x-field>

## 访问密钥管理

### createAccessKey

为程序化访问创建一个新的访问密钥。

**参数**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="访问密钥的描述。"></x-field>
  <x-field data-name="passport" data-type="string" data-required="false" data-desc="与密钥关联的角色/通行证。默认为 'guest'。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseCreateAccessKey" data-type="Promise<object>" data-desc="一个包含新创建的访问密钥和密钥机密的对象。"></x-field>

### getAccessKey

检索单个访问密钥的详细信息。

**参数**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="要检索的访问密钥的 ID。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="一个包含访问密钥详细信息的对象。"></x-field>

### getAccessKeys

检索访问密钥列表。

**参数**

<x-field data-name="params" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="分页选项。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseAccessKeys" data-type="Promise<object>" data-desc="一个分页的访问密钥对象列表。"></x-field>

### verifyAccessKey

验证访问密钥是否有效。

**参数**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="要验证的访问密钥的 ID。"></x-field>
</x-field>

**返回**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="如果有效，则返回一个包含访问密钥详细信息的对象。"></x-field>

---

掌握 `BlockletService` 后，您可能想探索如何向用户发送消息。请前往[通知服务](./services-notification-service.md)指南了解更多信息。
