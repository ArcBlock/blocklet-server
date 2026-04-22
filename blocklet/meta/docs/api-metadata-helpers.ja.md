# メタデータヘルパー

これらのユーティリティ関数は、リモートソースからBlockletメタデータを取得、処理、検証するためのツールキットです。ストアURLやローカルファイルパスからBlockletを解決する場合でも、これらのヘルパーは、ランチャー、開発ツール、レジストリサービスなど、ローカルで利用できないBlockletとやり取りする必要があるツールやアプリケーションにとって不可欠です。

これらは、ネットワークリクエスト、キャッシング、検証の複雑さを処理するように設計されており、複数のソースが利用可能な場合にはフォールトトレランスも提供します。

## コア取得関数

これらの関数は、1つ以上のURLからBlockletメタデータを取得するための中核となります。

### getBlockletMetaByUrl

これは、単一のURLから生の`blocklet.json`コンテンツを取得するための基本的な関数です。`http(s)://`と`file://`の両方のプロトコルをサポートしています。パフォーマンス向上のため、取得に成功した結果はLRUキャッシュを使用してメモリにキャッシュされます。

**パラメーター**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="blocklet.jsonファイルを指すURL（http、https、またはfile）。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="Promise<TBlockletMeta>" data-desc="解析されたBlockletメタデータオブジェクト（TBlockletMeta）に解決されるPromise。URLにアクセスできない場合や、コンテンツが有効なJSONでない場合にエラーをスローします。"></x-field>

**例**

```javascript 生のメタデータの取得 icon=logos:javascript
import { getBlockletMetaByUrl } from '@blocklet/meta';

async function fetchMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaByUrl(metaUrl);
    console.log(`Successfully fetched metadata for: ${meta.name}`);
    return meta;
  } catch (error) {
    console.error('Failed to fetch metadata:', error.message);
  }
}

fetchMeta();
```

### getBlockletMetaFromUrl

これは`getBlockletMetaByUrl`を基に構築された、より高レベルで堅牢なユーティリティです。メタデータの取得だけでなく、検証、データクリーンアップ（例：`htmlAst`の削除）、そしてオプションで関連する`dist.tarball` URLが有効でアクセス可能であることの確認も行います。これは、ほとんどのユースケースで推奨される関数です。

**パラメーター**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="blocklet.jsonファイルのURL。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="オプションの設定オブジェクト。">
    <x-field data-name="validateFn" data-type="Function" data-default="validateBlockletMeta" data-required="false" data-desc="取得したメタデータを検証するためのカスタム関数。"></x-field>
    <x-field data-name="returnUrl" data-type="boolean" data-default="false" data-required="false" data-desc="trueの場合、関数はオブジェクト { meta, url } を返します。"></x-field>
    <x-field data-name="ensureTarball" data-type="boolean" data-default="true" data-required="false" data-desc="trueの場合、関数はHEADリクエストを送信してdist.tarballのURLを検証します。"></x-field>
    <x-field data-name="logger" data-type="object" data-required="false" data-desc="デバッグ目的のロガーインスタンス（例：console）。"></x-field>
  </x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="Promise<any>" data-desc="検証済みのTBlockletMetaオブジェクトに解決されるPromise。returnUrlがtrueの場合、{ meta: TBlockletMeta, url: string } に解決されます。"></x-field>

**例**

```javascript メタデータの取得と検証 icon=logos:javascript
import { getBlockletMetaFromUrl } from '@blocklet/meta';

async function fetchAndValidateMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaFromUrl(metaUrl, { ensureTarball: true });
    console.log(`Successfully validated metadata for: ${meta.name}`);
    console.log(`Tarball URL is valid: ${meta.dist.tarball}`);
  } catch (error) {
    console.error('Failed to fetch or validate metadata:', error.message);
  }
}

fetchAndValidateMeta();
```

### getBlockletMetaFromUrls

この関数はURLの配列を受け取ることでフォールトトレランスを提供します。`Promise.any`を利用して、各URLから同時にメタデータの取得を試み、最初に成功した結果を返します。これは、Blockletのメタデータがプライマリレジストリとバックアップレジストリのように複数の場所にホストされている場合に便利です。

**パラメーター**

<x-field-group>
  <x-field data-name="urls" data-type="string[]" data-required="true" data-desc="取得を試みるURLの配列。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="getBlockletMetaFromUrlと同じオプションオブジェクト。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="Promise<any>" data-desc="最初に成功した取得の結果で解決されるPromise。すべてのURLが失敗した場合、Promiseは各失敗の理由を含む集約エラーで拒否されます。"></x-field>

**例**

```javascript 冗長性を持たせた取得 icon=logos:javascript
import { getBlockletMetaFromUrls } from '@blocklet/meta';

async function fetchWithFallback() {
  const metaUrls = [
    'https://invalid-registry.com/blocklet.json', // This will fail
    'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json' // This will succeed
  ];

  try {
    const { meta, url } = await getBlockletMetaFromUrls(metaUrls, { returnUrl: true });
    console.log(`Successfully fetched metadata for ${meta.name} from ${url}`);
  } catch (error) {
    console.error('All URLs failed:', error.message);
  }
}

fetchWithFallback();
```

## コンポジションヘルパー

これらのヘルパーは、複合アプリケーション内の子Blockletのメタデータを解決するために使用されます。

### getSourceUrlsFromConfig

このユーティリティはBlockletのコンポジションに不可欠です。Blockletが`components`を定義している場合、この関数はコンポーネントの設定を解析し、考えられる`blocklet.json` URLのリストを生成します。直接URL、Blocklet Store識別子、解決済みURLなど、様々なソース宣言を解釈できます。

**パラメーター**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="blocklet.ymlファイルのcomponentsセクションにあるコンポーネント設定オブジェクト。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="string[]" data-desc="指定されたコンポーネントの考えられるメタデータURLの配列。"></x-field>

**例**

```javascript コンポーネントメタデータURLの解決 icon=logos:javascript
import { getSourceUrlsFromConfig } from '@blocklet/meta';

// Example component config from a parent blocklet's metadata
const componentConfig = {
  name: 'my-child-blocklet',
  source: {
    store: ['https://store.blocklet.dev/api', 'https://backup-store.com/api'],
    version: '1.2.0'
  }
};

const urls = getSourceUrlsFromConfig(componentConfig);

console.log(urls);
/* Output (DID is derived from the name):
[
  'https://store.blocklet.dev/api/blocklets/z2qa.../1.2.0/blocklet.json',
  'https://backup-store.com/api/blocklets/z2qa.../1.2.0/blocklet.json'
]
*/
```

## 検証ユーティリティ

このセクションには、コア取得関数で使用される、より低レベルなユーティリティが含まれています。

### validateUrl

これは、URLが有効でアクセス可能かを確認するための汎用ユーティリティです。`file://`の場合はファイルの存在を確認し、`http(s)://`の場合は`HEAD`リクエストを送信してアクセシビリティと、オプションで`content-type`ヘッダーを検証することでサポートします。この関数の結果もキャッシュされます。

**パラメーター**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="検証するURL。"></x-field>
  <x-field data-name="expectedHttpResTypes" data-type="string[]" data-default="['application/json', 'text/plain']" data-required="false" data-desc="HTTPリクエストで許容されるcontent-type値の配列。"></x-field>
</x-field-group>

**戻り値**

<x-field data-name="" data-type="Promise<boolean>" data-desc="URLが有効な場合にtrueに解決されるPromise。検証が失敗した場合（例：ファイルが見つからない、ネットワークエラー、予期しないコンテンツタイプ）、エラーをスローします。"></x-field>

**例**

```javascript リモートアセットの検証 icon=logos:javascript
import { validateUrl } from '@blocklet/meta';

async function checkTarball(url) {
  try {
    await validateUrl(url, ['application/octet-stream', 'application/x-gzip']);
    console.log(`Tarball URL is valid and has the correct content type: ${url}`);
    return true;
  } catch (error) {
    console.error(`Tarball URL validation failed: ${error.message}`);
    return false;
  }
}

checkTarball('https://some-cdn.com/blocklet.tar.gz');
```