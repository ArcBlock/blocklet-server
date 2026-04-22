# TokenService

`TokenService` 提供了一個低階 API，用於直接與工作階段權杖和重新整理權杖進行互動。它處理從各自的瀏覽器儲存位置（工作階段權杖儲存在 cookies，重新整理權杖儲存在 `localStorage`）儲存和檢索這些權杖的邏輯。

雖然此服務可用於特定的使用案例，但大多數開發者不需要直接使用它。像 `AuthService` 和 `createAxios`/`createFetch` 輔助工具這樣更高階的抽象層會自動管理權杖的處理。有關典型的身份驗證和工作階段管理，請參閱 [驗證指南](./guides-authentication.md)。

## 方法

### getSessionToken

檢索目前的工作階段權杖。此服務會先嘗試從瀏覽器的 cookies 中取得權杖。作為備用方案，如果在設定中提供了特定的金鑰，它會接著檢查 `localStorage`。

**參數**

<x-field data-name="config" data-type="object">
  <x-field-desc markdown>一個可選的設定物件。</x-field-desc>
  <x-field data-name="sessionTokenKey" data-type="string">
    <x-field-desc markdown>如果在 cookies 中找不到工作階段權杖，則用於在 `window.localStorage` 中尋找該權杖的金鑰。</x-field-desc>
  </x-field>
</x-field>

**返回值**

<x-field data-name="" data-type="string" data-desc="工作階段權杖，如果未找到則為空字串。"></x-field>

**範例**

```javascript icon=logos:javascript
// 主要檢查 cookies
const sessionToken = sdk.token.getSessionToken();

// 先檢查 cookies，然後使用指定的金鑰檢查 localStorage
const sessionTokenWithFallback = sdk.token.getSessionToken({
  sessionTokenKey: 'my-app-session-key',
});
```

### setSessionToken

在瀏覽器的 cookies 中設定或更新工作階段權杖。

**參數**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要儲存的工作階段權杖值。"></x-field>

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法沒有返回值。"></x-field>

**範例**

```javascript icon=logos:javascript
sdk.token.setSessionToken('new-session-token-value-from-server');
```

### removeSessionToken

從瀏覽器的 cookies 中移除工作階段權杖。

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法沒有返回值。"></x-field>

**範例**

```javascript icon=logos:javascript
sdk.token.removeSessionToken();
```

### getRefreshToken

從瀏覽器的 `localStorage` 中檢索重新整理權杖。

**返回值**

<x-field data-name="" data-type="string | null" data-desc="重新整理權杖，如果不存在則為 null。"></x-field>

**範例**

```javascript icon=logos:javascript
const refreshToken = sdk.token.getRefreshToken();
if (refreshToken) {
  console.log('重新整理權杖可用。');
}
```

### setRefreshToken

在瀏覽器的 `localStorage` 中設定或更新重新整理權杖。

**參數**

<x-field data-name="value" data-type="string" data-required="true" data-desc="要儲存的重新整理權杖值。"></x-field>

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法沒有返回值。"></x-field>

**範例**

```javascript icon=logos:javascript
sdk.token.setRefreshToken('new-refresh-token-value-from-server');
```

### removeRefreshToken

從瀏覽器的 `localStorage` 中移除重新整理權杖。

**返回值**

<x-field data-name="" data-type="void" data-desc="此方法沒有返回值。"></x-field>

**範例**

```javascript icon=logos:javascript
sdk.token.removeRefreshToken();
```