# TokenService

`TokenService`は、セッショントークンとリフレッシュトークンを直接操作するための低レベルAPIを提供します。セッショントークンはCookie、リフレッシュトークンは`localStorage`という、それぞれのブラウザストレージの場所からこれらのトークンを保存・取得するロジックを処理します。

このサービスは特定のユースケースで利用できますが、ほとんどの開発者は直接使用する必要はありません。`AuthService`や`createAxios`/`createFetch`ヘルパーのような、より高レベルの抽象化がトークンハンドリングを自動的に管理します。一般的な認証とセッション管理については、[認証ガイド](./guides-authentication.md)を参照してください。

## メソッド

### getSessionToken

現在のセッショントークンを取得します。サービスはまずブラウザのCookieからトークンの取得を試みます。フォールバックとして、設定で特定のキーが指定されている場合は`localStorage`を確認できます。

**パラメーター**

<x-field data-name="config" data-type="object">
  <x-field-desc markdown>オプションの設定オブジェクト。</x-field-desc>
  <x-field data-name="sessionTokenKey" data-type="string">
    <x-field-desc markdown>Cookieにセッショントークンがない場合に、`window.localStorage`内でセッショントークンを検索するために使用されるキー。</x-field-desc>
  </x-field>
</x-field>

**戻り値**

<x-field data-name="" data-type="string" data-desc="セッショントークン。見つからない場合は空文字列。"></x-field>

**例**

```javascript icon=logos:javascript
// 主にCookieをチェックします
const sessionToken = sdk.token.getSessionToken();

// Cookieをチェックし、次に特定のキーでlocalStorageをチェックします
const sessionTokenWithFallback = sdk.token.getSessionToken({
  sessionTokenKey: 'my-app-session-key',
});
```

### setSessionToken

ブラウザのCookieにセッショントークンを設定または更新します。

**パラメーター**

<x-field data-name="value" data-type="string" data-required="true" data-desc="保存するセッショントークンの値。"></x-field>

**戻り値**

<x-field data-name="" data-type="void" data-desc="このメソッドは値を返しません。"></x-field>

**例**

```javascript icon=logos:javascript
sdk.token.setSessionToken('new-session-token-value-from-server');
```

### removeSessionToken

ブラウザのCookieからセッショントークンを削除します。

**戻り値**

<x-field data-name="" data-type="void" data-desc="このメソッドは値を返しません。"></x-field>

**例**

```javascript icon=logos:javascript
sdk.token.removeSessionToken();
```

### getRefreshToken

ブラウザの`localStorage`からリフレッシュトークンを取得します。

**戻り値**

<x-field data-name="" data-type="string | null" data-desc="リフレッシュトークン。存在しない場合はnull。"></x-field>

**例**

```javascript icon=logos:javascript
const refreshToken = sdk.token.getRefreshToken();
if (refreshToken) {
  console.log('Refresh token is available.');
}
```

### setRefreshToken

ブラウザの`localStorage`にリフレッシュトークンを設定または更新します。

**パラメーター**

<x-field data-name="value" data-type="string" data-required="true" data-desc="保存するリフレッシュトークンの値。"></x-field>

**戻り値**

<x-field data-name="" data-type="void" data-desc="このメソッドは値を返しません。"></x-field>

**例**

```javascript icon=logos:javascript
sdk.token.setRefreshToken('new-refresh-token-value-from-server');
```

### removeRefreshToken

ブラウザの`localStorage`からリフレッシュトークンを削除します。

**戻り値**

<x-field data-name="" data-type="void" data-desc="このメソッドは値を返しません。"></x-field>

**例**

```javascript icon=logos:javascript
sdk.token.removeRefreshToken();
```