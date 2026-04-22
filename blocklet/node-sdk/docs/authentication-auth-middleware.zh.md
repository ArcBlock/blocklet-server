# 授权中间件

`auth` 中间件是一个功能强大的工具，可为你的 blocklet 路由添加一个授权层。它与 [会话中间件](./authentication-session-middleware.md) 协同工作，通过验证用户的角色、特定权限、KYC (Know Your Customer) 状态以及所使用的身份验证方法来保护端点。这确保了只有经过授权的用户才能访问敏感或受限的资源。

## 用法

要使用 `auth` 中间件，你需要从 `@blocklet/sdk/middlewares` 导入它，并将其应用于任何需要保护的 Express.js 路由或路由器。你可以传递一个配置对象来指定授权规则。

以下是一个保护仅限管理员访问的路由的基本示例：

```javascript icon=lucide:shield-check title="routes/admin.js"
const auth = require('@blocklet/sdk/middlewares/auth');
const router = require('express').Router();

// 此路由仅对具有 'admin' 角色的用户开放。
router.get('/dashboard', auth({ roles: ['admin'] }), (req, res) => {
  res.json({
    message: 'Welcome to the admin dashboard!',
    user: req.user,
  });
});

module.exports = router;
```

如果未经授权的用户尝试访问此路由，中间件将自动响应一个 `403 Forbidden` 错误。如果用户根本没有登录，它将响应一个 `401 Unauthorized` 错误。

## 授权流程

中间件会按特定顺序评估授权规则。如果任何检查点失败，它会立即以相应的 HTTP 错误代码拒绝请求。

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Authorization Middleware](assets/diagram/auth-middleware-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 配置选项

`auth` 中间件接受一个配置对象，该对象包含以下属性，用于定义细粒度的访问控制规则。

<x-field-group>
  <x-field data-name="roles" data-type="string[]" data-required="false">
    <x-field-desc markdown>一个角色名称数组。用户必须拥有这些角色中的**至少一个**才能获得访问权限。如果用户的角色不在此列表中，中间件将返回一个 `403 Forbidden` 错误。</x-field-desc>
  </x-field>
  <x-field data-name="permissions" data-type="string[]" data-required="false">
    <x-field-desc markdown>一个权限名称数组。中间件会检查与用户角色相关联的权限。用户的角色必须拥有指定的权限中的**至少一个**。否则，它将返回一个 `403 Forbidden` 错误。此检查需要 [Blocklet 服务](./services-blocklet-service.md) 正在运行。</x-field-desc>
  </x-field>
  <x-field data-name="kyc" data-type="('email' | 'phone')[]" data-required="false">
    <x-field-desc markdown>一个指定所需 KYC (Know Your Customer) 验证方法的数组。你可以要求 `email` 验证、`phone` 验证或两者兼有。如果用户未完成所需的验证步骤，中间件将返回一个 `403 Forbidden` 错误，并附带消息 "kyc required"。</x-field-desc>
  </x-field>
  <x-field data-name="methods" data-type="AuthMethod[]" data-required="false">
    <x-field-desc markdown>一个允许的身份验证方法数组。`SessionUser` 对象包含一个 `method` 属性，用于指示会话是如何建立的（例如，`loginToken`、`accessKey`、`componentCall`）。如果用户的身份验证方法不在此列表中，中间件将返回一个 `403 Forbidden` 错误。</x-field-desc>
  </x-field>
</x-field-group>

### 示例：要求多个条件

你可以组合这些选项来创建复杂的授权规则。例如，要保护一个只应允许已验证其电子邮件且未使用临时访问密钥的付费订阅者访问的路由：

```javascript icon=lucide:shield-check title="routes/billing.js"
const auth = require('@blocklet/sdk/middlewares/auth');
const router = require('express').Router();

router.post(
  '/update-subscription',
  auth({
    roles: ['subscriber'],
    kyc: ['email'],
    methods: ['loginToken', 'signedToken'], // 禁止通过 accessKey 访问
  }),
  (req, res) => {
    // 更新订阅的逻辑
    res.json({ success: true, message: 'Subscription updated.' });
  }
);

module.exports = router;
```

在此示例中，用户必须满足所有三个条件：
1.  拥有 `subscriber` 角色。
2.  其电子邮件地址已通过验证。
3.  使用标准的登录令牌或签名令牌进行身份验证，而不是简单的访问密钥。

## 总结

`auth` 中间件是保护你的 blocklet 端点的重要工具。通过结合角色、权限、KYC 和身份验证方法检查，你可以用最少的代码实现强大且细粒度的访问控制。

有关管理用户和会话的更多信息，请参阅以下部分：
- [会话中间件](./authentication-session-middleware.md)：了解如何建立用户会话，这是此授权中间件的先决条件。
- [Blocklet 服务](./services-blocklet-service.md)：了解如何以编程方式管理此中间件所依赖的角色和权限。