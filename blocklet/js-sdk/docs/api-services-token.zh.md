# TokenService

`TokenService` 提供了一个低级 API，用于直接与会话令牌和刷新令牌进行交互。它处理从各自的浏览器存储位置存储和检索这些令牌的逻辑：会话令牌存储在 cookie 中，刷新令牌存储在 `localStorage` 中。

虽然此服务可用于特定的用例，但大多数开发者不需要直接使用它。更高级别的抽象，如 `AuthService` 和 `createAxios`/`createFetch` 辅助函数，会自动管理令牌处理。对于典型的身份验证和会话管理，请参阅[身份验证指南](./guides-authentication.md)。

## 方法

### getSessionToken

检索当前的会话令牌。该服务首先尝试从浏览器 cookie 中获取令牌。作为备用方案，如果在配置中提供了特定的键，它可以检查 `localStorage`。

**参数**

<x-field data-name="config" data-type="object">
  <x-field-desc markdown>一个可选的配置对象。</x-field-desc>
  <x-field data-name="sessionTokenKey" data-type="string">
    <x-field-desc markdown>如果在 cookie 中找不到会话令牌，则用于在 `window.localStorage` 中查找该令牌的键。</x-field-desc>
  </x-field>
</x-field>

**返回值**

<x-field data-name="" data-type="string" data-desc="会话令牌，如果未找到则为空字符串。"></x-field>

**示例**

```javascript icon=logos:javascript
// 主要检查 cookie
const sessionToken = sdk.token.getSessionToken();

// 先检查 cookie，然后使用特定的键检查 localStorage
const sessionTokenWithFallback = sdk.token.getSessionToken({
  sessionTokenKey: 'my-app-session-key',
});
```

### setSessionToken

在浏览器的 cookie 中设置或更新会话令牌。

**参数**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要存储的会话令牌值。"></x-field>

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法无返回值。"></x-field>

**示例**

```javascript icon=logos:javascript
sdk.token.setSessionToken('new-session-token-value-from-server');
```

### removeSessionToken

从浏览器的 cookie 中移除会话令牌。

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法无返回值。"></x-field>

**示例**

```javascript icon=logos:javascript
sdk.token.removeSessionToken();
```

### getRefreshToken

从浏览器的 `localStorage` 中检索刷新令牌。

**返回值**

<x-field data-name="" data-type="string | null" data-desc="刷新令牌，如果不存在则为 null。"></x-field>

**示例**

```javascript icon=logos:javascript
const refreshToken = sdk.token.getRefreshToken();
if (refreshToken) {
  console.log('刷新令牌可用。');
}
```

### setRefreshToken

在浏览器的 `localStorage` 中设置或更新刷新令牌。

**参数**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要存储的刷新令牌值。"></x-field>

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法无返回值。"></x-field>

**示例**

```javascript icon=logos:javascript
sdk.token.setRefreshToken('new-refresh-token-value-from-server');
```

### removeRefreshToken

从浏览器的 `localStorage` 中移除刷新令牌。

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法无返回值。"></x-field>

**示例**

```javascript icon=logos:javascript
sdk.token.removeRefreshToken();
```