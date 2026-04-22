# TokenService

The `TokenService` provides a low-level API for direct interaction with session and refresh tokens. It handles the logic of storing and retrieving these tokens from their respective browser storage locations: cookies for session tokens and `localStorage` for refresh tokens.

While this service is available for specific use cases, most developers will not need to use it directly. Higher-level abstractions like the `AuthService` and the `createAxios`/`createFetch` helpers manage token handling automatically. For typical authentication and session management, please refer to the [Authentication Guide](./guides-authentication.md).

## Methods

### getSessionToken

Retrieves the current session token. The service first attempts to get the token from browser cookies. As a fallback, it can check `localStorage` if a specific key is provided in the configuration.

**Parameters**

<x-field data-name="config" data-type="object">
  <x-field-desc markdown>An optional configuration object.</x-field-desc>
  <x-field data-name="sessionTokenKey" data-type="string">
    <x-field-desc markdown>The key used to find the session token in `window.localStorage` if it's not in the cookies.</x-field-desc>
  </x-field>
</x-field>

**Returns**

<x-field data-name="" data-type="string" data-desc="The session token, or an empty string if not found."></x-field>

**Example**

```javascript icon=logos:javascript
// Primarily checks cookies
const sessionToken = sdk.token.getSessionToken();

// Checks cookies, then localStorage with a specific key
const sessionTokenWithFallback = sdk.token.getSessionToken({
  sessionTokenKey: 'my-app-session-key',
});
```

### setSessionToken

Sets or updates the session token in the browser's cookies.

**Parameters**

<x-field data-name="value" data-type="string" data-required="true" data-desc="The session token value to store."></x-field>

**Returns**

<x-field data-name="" data-type="void" data-desc="This method does not return a value."></x-field>

**Example**

```javascript icon=logos:javascript
sdk.token.setSessionToken('new-session-token-value-from-server');
```

### removeSessionToken

Removes the session token from the browser's cookies.

**Returns**

<x-field data-name="" data-type="void" data-desc="This method does not return a value."></x-field>

**Example**

```javascript icon=logos:javascript
sdk.token.removeSessionToken();
```

### getRefreshToken

Retrieves the refresh token from the browser's `localStorage`.

**Returns**

<x-field data-name="" data-type="string | null" data-desc="The refresh token, or null if it does not exist."></x-field>

**Example**

```javascript icon=logos:javascript
const refreshToken = sdk.token.getRefreshToken();
if (refreshToken) {
  console.log('Refresh token is available.');
}
```

### setRefreshToken

Sets or updates the refresh token in the browser's `localStorage`.

**Parameters**

<x-field data-name="value" data-type="string" data-required="true" data-desc="The refresh token value to store."></x-field>

**Returns**

<x-field data-name="" data-type="void" data-desc="This method does not return a value."></x-field>

**Example**

```javascript icon=logos:javascript
sdk.token.setRefreshToken('new-refresh-token-value-from-server');
```

### removeRefreshToken

Removes the refresh token from the browser's `localStorage`.

**Returns**

<x-field data-name="" data-type="void" data-desc="This method does not return a value."></x-field>

**Example**

```javascript icon=logos:javascript
sdk.token.removeRefreshToken();
```