# 接口与服务

Blocklet 通过 `interfaces` 与外部世界交互，并通过 `services` 增强其功能，提供强大、可复用的功能。`blocklet.yml` 中的 `interfaces` 属性是暴露应用程序网页、API 和其他端点的基石。`services`，例如内置的身份验证服务，可以附加到这些接口上，以提供通用功能，而无需额外的样板代码。

本节详细介绍如何配置这两者，使您能够为您的 blocklet 定义清晰的入口点，并将其无缝集成到更广泛的生态系统中。

---

## 接口

`interfaces` 数组定义了 blocklet 所有面向公众的入口点。数组中的每个对象代表一个接口，指定其类型、位置和行为。

### 接口结构

每个接口对象由以下属性定义：

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>接口的类型。有效值包括 `web`、`well-known`、`api`、`health` 等。一个 blocklet 只能声明一个 `web` 接口。</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="一个唯一的、人类可读的接口名称（例如，`publicUrl`、`adminApi`）。"></x-field>
  <x-field data-name="path" data-type="string" data-default="/" data-desc="blocklet 内部服务于此接口的路径。"></x-field>
  <x-field data-name="prefix" data-type="string" data-default="*">
    <x-field-desc markdown>此接口公开挂载的路径前缀。值 `*` (`BLOCKLET_DYNAMIC_PATH_PREFIX`) 允许用户在任何路径上挂载它。</x-field-desc>
  </x-field>
  <x-field data-name="protocol" data-type="string" data-default="http">
    <x-field-desc markdown>通信协议。有效值为 `http`、`https`、`tcp`、`udp`。</x-field-desc>
  </x-field>
  <x-field data-name="port" data-type="string | object" data-default="PORT">
    <x-field-desc markdown>定义端口映射。可以是一个引用环境变量的字符串（例如，`PORT`），也可以是一个包含 `internal`（环境变量名）和 `external`（端口号）键的对象，用于固定映射。</x-field-desc>
  </x-field>
  <x-field data-name="containerPort" data-type="number" data-required="false" data-desc="容器内部的端口号。"></x-field>
  <x-field data-name="hostIP" data-type="string" data-required="false" data-desc="将接口绑定到主机上的特定 IP。"></x-field>
  <x-field data-name="services" data-type="array" data-default="[]" data-desc="要附加到此接口的服务列表。有关详细信息，请参阅下面的“服务”部分。"></x-field>
  <x-field data-name="endpoints" data-type="array" data-default="[]" data-desc="定义具有元数据的特定 API 端点，以实现可发现性和交互。"></x-field>
  <x-field data-name="cacheable" data-type="array" data-default="[]" data-desc="此接口下可被上游服务缓存的相对路径列表。"></x-field>
  <x-field data-name="proxyBehavior" data-type="string" data-default="service">
    <x-field-desc markdown>定义请求的代理方式。`service` 通过 Blocklet Server 的服务层路由，而 `direct` 则绕过它。</x-field-desc>
  </x-field>
  <x-field data-name="pageGroups" data-type="array" data-default="[]" data-desc="页面组标识符列表。"></x-field>
</x-field-group>

### 特殊接口类型

-   **`web`**：这是 blocklet 主要面向用户的接口。一个 blocklet **最多只能**声明一个 `web` 类型的接口。
-   **`well-known`**：此类型用于标准化资源发现路径（例如，`/.well-known/did.json`）。此类型的任何接口的 `prefix` 都必须以 `/.well-known` 开头。

### 示例：定义接口

以下是一个 `blocklet.yml` 的示例，它定义了一个主 web 接口和一个独立的 API 接口。

```yaml blocklet.yml icon=mdi:code-braces
name: my-awesome-app
did: z8iZpky2Vd3i2bE8z9f6c7g8h9j0k1m2n3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d
version: 1.2.0
description: An awesome app with a web UI and an API.

interfaces:
  # 主 web 接口，用户可以访问
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT

  # 一个专用的 API 接口
  - type: api
    name: dataApi
    path: /api
    prefix: /api
    protocol: http
    port: PORT
```

---

## 服务

服务是由 Blocklet Server 环境提供的预构建、可配置的功能。您可以将它们附加到接口上，以添加身份验证、授权等功能，只需在接口的 `services` 数组中声明它们即可。

### 服务结构

一个服务对象有两个主要属性：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要附加的服务的名称（例如，`auth`）。"></x-field>
  <x-field data-name="config" data-type="object" data-default="{}" data-desc="特定于该服务的配置对象。"></x-field>
</x-field-group>

### 内置服务：`auth`

`auth` 服务为您的 blocklet 提供了一套完整的用户身份验证和授权解决方案。它处理用户登录、个人资料管理和访问控制。

#### `auth` 服务配置

当您添加 `auth` 服务时，可以使用 `config` 对象自定义其行为。以下是可用选项：

<x-field-group>
  <x-field data-name="whoCanAccess" data-type="string" data-default="all">
    <x-field-desc markdown>定义谁可以访问该接口。有效值：`owner`（仅 DID Space 所有者）、`invited`（所有者和受邀用户）或 `all`（任何经过身份验证的用户）。</x-field-desc>
  </x-field>
  <x-field data-name="profileFields" data-type="array" data-default='["fullName", "email", "avatar"]'>
    <x-field-desc markdown>您的应用在登录时请求的用户个人资料信息。有效字段为 `fullName`、`email`、`avatar` 和 `phone`。</x-field-desc>
  </x-field>
  <x-field data-name="allowSwitchProfile" data-type="boolean" data-default="true" data-desc="确定用户是否可以在您的应用程序中切换不同的个人资料。"></x-field>
  <x-field data-name="blockUnauthenticated" data-type="boolean" data-default="false" data-desc="如果为 `true`，服务会自动阻止任何未经身份验证的请求。"></x-field>
  <x-field data-name="blockUnauthorized" data-type="boolean" data-default="false">
    <x-field-desc markdown>如果为 `true`，服务会阻止不满足 `whoCanAccess` 条件的已认证用户。</x-field-desc>
  </x-field>
  <x-field data-name="ignoreUrls" data-type="array" data-default="[]">
    <x-field-desc markdown>应从身份验证检查中排除的 URL 路径或模式列表（例如，`/public/**`）。</x-field-desc>
  </x-field>
</x-field-group>

### 示例：附加 `auth` 服务

此示例展示了如何使用 `auth` 服务来保护前一个示例中的 `web` 接口。

```yaml blocklet.yml icon=mdi:code-braces
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT
    services:
      - name: auth
        config:
          whoCanAccess: invited
          blockUnauthenticated: true
          profileFields:
            - fullName
            - email
          ignoreUrls:
            - /assets/**
            - /login
```

在此配置中，web 接口下的所有路径都受到保护，但 `/assets/**` 和 `/login` 除外。只有 DID Space 所有者和受邀用户在登录后才能访问受保护的页面，并且系统会提示他们分享其全名和电子邮件。

---

## 端点

接口中的 `endpoints` 数组允许显式定义 API 端点，从而增强可发现性并实现自动化交互。

### 端点结构

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="端点类型的唯一标识符。"></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="端点的路径，相对于接口的路径。"></x-field>
  <x-field data-name="meta" data-type="object" data-required="false" data-desc="包含有关端点元数据的对象。">
    <x-field data-name="vcType" data-type="string" data-desc="与端点关联的可验证凭证的类型。"></x-field>
    <x-field data-name="payable" data-type="boolean" data-desc="指示端点是否涉及支付。"></x-field>
    <x-field data-name="params" data-type="array" data-desc="描述端点接受的参数的数组。">
      <x-field data-name="name" data-type="string" data-required="true" data-desc="参数的名称。"></x-field>
      <x-field data-name="description" data-type="string" data-required="true" data-desc="参数的描述。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

---

通过结合接口和服务，您可以清晰地定义您的 blocklet 如何暴露，并使用强大的内置功能来保护它。要了解如何通过组合多个 blocklet 来构建更复杂的应用程序，请参阅下一节关于组合的内容。

[下一步：组合 (组件)](./spec-composition.md)