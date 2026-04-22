# 元数据助手

这些实用函数是您从远程源获取、处理和验证 Blocklet 元数据的工具包。无论您是从商店 URL 还是本地文件路径解析 Blocklet，这些助手对于任何需要与本地不可用的 Blocklet 交互的工具或应用程序（如启动器、开发工具或注册表服务）都至关重要。

它们旨在处理网络请求、缓存、验证的复杂性，甚至在有多个可用源时提供容错能力。

## 核心获取函数

这些函数是从一个或多个 URL 检索 Blocklet 元数据的核心。

### getBlockletMetaByUrl

这是一个基础函数，用于从单个 URL 获取原始的 `blocklet.json` 内容。它支持 `http(s)://` 和 `file://` 协议。为提高性能，成功获取的结果会使用 LRU 缓存在内存中。

**参数**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="指向 blocklet.json 文件的 URL（http、https 或 file）。"></x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="Promise<TBlockletMeta>" data-desc="一个解析为已解析的 Blocklet 元数据对象（TBlockletMeta）的 Promise。如果 URL 无法访问或内容不是有效的 JSON，则会抛出错误。"></x-field>

**示例**

```javascript 获取原始元数据 icon=logos:javascript
import { getBlockletMetaByUrl } from '@blocklet/meta';

async function fetchMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaByUrl(metaUrl);
    console.log(`成功获取元数据：${meta.name}`);
    return meta;
  } catch (error) {
    console.error('获取元数据失败：', error.message);
  }
}

fetchMeta();
```

### getBlockletMetaFromUrl

这是一个更高级、更健壮的实用程序，它建立在 `getBlockletMetaByUrl` 的基础上。它不仅获取元数据，还执行验证、清理数据（例如，移除 `htmlAst`），并可选地确保关联的 `dist.tarball` URL 有效且可访问。这是大多数用例的推荐函数。

**参数**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="blocklet.json 文件的 URL。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="一个可选的配置对象。">
    <x-field data-name="validateFn" data-type="Function" data-default="validateBlockletMeta" data-required="false" data-desc="一个用于验证所获取元数据的自定义函数。"></x-field>
    <x-field data-name="returnUrl" data-type="boolean" data-default="false" data-required="false" data-desc="如果为 true，函数返回一个对象 { meta, url }。"></x-field>
    <x-field data-name="ensureTarball" data-type="boolean" data-default="true" data-required="false" data-desc="如果为 true，函数通过发出 HEAD 请求来验证 dist.tarball URL。"></x-field>
    <x-field data-name="logger" data-type="object" data-required="false" data-desc="一个用于调试的日志记录器实例（例如 console）。"></x-field>
  </x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="Promise<any>" data-desc="一个解析为已验证的 TBlockletMeta 对象的 Promise。如果 returnUrl 为 true，它将解析为 { meta: TBlockletMeta, url: string }。"></x-field>

**示例**

```javascript 获取并验证元数据 icon=logos:javascript
import { getBlockletMetaFromUrl } from '@blocklet/meta';

async function fetchAndValidateMeta() {
  const metaUrl = 'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json';
  try {
    const meta = await getBlockletMetaFromUrl(metaUrl, { ensureTarball: true });
    console.log(`成功验证元数据：${meta.name}`);
    console.log(`Tarball URL 有效：${meta.dist.tarball}`);
  } catch (error) {
    console.error('获取或验证元数据失败：', error.message);
  }
}

fetchAndValidateMeta();
```

### getBlockletMetaFromUrls

此函数通过接受一个 URL 数组来提供容错能力。它尝试并发地从每个 URL 获取元数据，并返回第一个成功的结果，利用了 `Promise.any`。当一个 Blocklet 的元数据可能托管在多个位置时（例如一个主注册表和一个备份注册表），这非常有用。

**参数**

<x-field-group>
  <x-field data-name="urls" data-type="string[]" data-required="true" data-desc="一个尝试从中获取的 URL 数组。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="与 getBlockletMetaFromUrl 相同的选项对象。"></x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="Promise<any>" data-desc="一个使用首次成功获取的结果进行解析的 Promise。如果所有 URL 都失败，则该 Promise 将被拒绝，并带有一个包含每次失败原因的聚合错误。"></x-field>

**示例**

```javascript 使用冗余获取 icon=logos:javascript
import { getBlockletMetaFromUrls } from '@blocklet/meta';

async function fetchWithFallback() {
  const metaUrls = [
    'https://invalid-registry.com/blocklet.json', // 这将失败
    'https://store.blocklet.dev/api/blocklets/z8ia2vL3A9ACu4p2f2iF9yQWc9BvCzaWwx57p/blocklet.json' // 这将成功
  ];

  try {
    const { meta, url } = await getBlockletMetaFromUrls(metaUrls, { returnUrl: true });
    console.log(`成功从 ${url} 获取 ${meta.name} 的元数据`);
  } catch (error) {
    console.error('所有 URL 都失败了：', error.message);
  }
}

fetchWithFallback();
```

## 组合助手

这些助手用于在组合应用程序中解析子 Blocklet 的元数据。

### getSourceUrlsFromConfig

这个实用程序对于 Blocklet 组合至关重要。当一个 Blocklet 定义了 `components` 时，此函数会解析组件的配置，以生成一个潜在的 `blocklet.json` URL 列表。它可以解释各种源声明，包括直接 URL、Blocklet Store 标识符和已解析的 URL。

**参数**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="来自 blocklet.yml 文件中 components 部分的组件配置对象。"></x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="string[]" data-desc="指定组件的潜在元数据 URL 数组。"></x-field>

**示例**

```javascript 解析组件元数据 URL icon=logos:javascript
import { getSourceUrlsFromConfig } from '@blocklet/meta';

// 来自父 Blocklet 元数据的示例组件配置
const componentConfig = {
  name: 'my-child-blocklet',
  source: {
    store: ['https://store.blocklet.dev/api', 'https://backup-store.com/api'],
    version: '1.2.0'
  }
};

const urls = getSourceUrlsFromConfig(componentConfig);

console.log(urls);
/* 输出 (DID 是从名称派生的):
[
  'https://store.blocklet.dev/api/blocklets/z2qa.../1.2.0/blocklet.json',
  'https://backup-store.com/api/blocklets/z2qa.../1.2.0/blocklet.json'
]
*/
```

## 验证实用程序

本节包含核心获取函数所使用的底层实用程序。

### validateUrl

这是一个通用实用程序，用于检查 URL 是否有效且可访问。它通过检查文件是否存在来支持 `file://`，并通过发出 `HEAD` 请求来验证可访问性以及（可选地）`content-type` 头部来支持 `http(s)://`。此函数的结果也会被缓存。

**参数**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="要验证的 URL。"></x-field>
  <x-field data-name="expectedHttpResTypes" data-type="string[]" data-default="['application/json', 'text/plain']" data-required="false" data-desc="一个可接受的 HTTP 请求 content-type 值数组。"></x-field>
</x-field-group>

**返回**

<x-field data-name="" data-type="Promise<boolean>" data-desc="一个在 URL 有效时解析为 true 的 Promise。如果验证失败（例如，文件未找到、网络错误、意外的内容类型），则会抛出错误。"></x-field>

**示例**

```javascript 验证远程资产 icon=logos:javascript
import { validateUrl } from '@blocklet/meta';

async function checkTarball(url) {
  try {
    await validateUrl(url, ['application/octet-stream', 'application/x-gzip']);
    console.log(`Tarball URL 有效且内容类型正确: ${url}`);
    return true;
  } catch (error) {
    console.error(`Tarball URL 验证失败: ${error.message}`);
    return false;
  }
}

checkTarball('https://some-cdn.com/blocklet.tar.gz');
```