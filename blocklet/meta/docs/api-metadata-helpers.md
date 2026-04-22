# Metadata Helpers

These utility functions are your toolkit for fetching, processing, and validating Blocklet metadata from remote sources. Whether you're resolving a Blocklet from a store URL or a local file path, these helpers are crucial for any tool or application—like launchers, development tools, or registry services—that needs to interact with Blocklets that aren't available locally.

They are designed to handle the complexities of network requests, caching, validation, and even provide fault tolerance when multiple sources are available.

## Core Fetching Functions

These functions are central to retrieving Blocklet metadata from one or more URLs.

### getBlockletMetaByUrl

This is a foundational function for fetching the raw `blocklet.json` content from a single URL. It supports both `http(s)://` and `file://` protocols. To enhance performance, the results of successful fetches are cached in memory using an LRU cache.

**Parameters**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="The URL (http, https, or file) pointing to the blocklet.json file."></x-field>
</x-field-group>

**Returns**

<x-field data-name="" data-type="Promise<TBlockletMeta>" data-desc="A promise that resolves to the parsed Blocklet metadata object (TBlockletMeta). It throws an error if the URL is inaccessible or the content is not valid JSON."></x-field>

**Example**

```javascript Fetching Raw Metadata icon=logos:javascript
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

This is a higher-level, more robust utility that builds upon `getBlockletMetaByUrl`. It not only fetches the metadata but also performs validation, cleans up the data (e.g., removes `htmlAst`), and optionally ensures the associated `dist.tarball` URL is valid and accessible. This is the recommended function for most use cases.

**Parameters**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="The URL of the blocklet.json file."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="An optional configuration object.">
    <x-field data-name="validateFn" data-type="Function" data-default="validateBlockletMeta" data-required="false" data-desc="A custom function to validate the fetched metadata."></x-field>
    <x-field data-name="returnUrl" data-type="boolean" data-default="false" data-required="false" data-desc="If true, the function returns an object { meta, url }."></x-field>
    <x-field data-name="ensureTarball" data-type="boolean" data-default="true" data-required="false" data-desc="If true, the function validates the dist.tarball URL by making a HEAD request."></x-field>
    <x-field data-name="logger" data-type="object" data-required="false" data-desc="A logger instance (e.g., console) for debugging purposes."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="" data-type="Promise<any>" data-desc="A promise that resolves to the validated TBlockletMeta object. If returnUrl is true, it resolves to { meta: TBlockletMeta, url: string }."></x-field>

**Example**

```javascript Fetching and Validating Metadata icon=logos:javascript
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

This function provides fault tolerance by accepting an array of URLs. It attempts to fetch metadata from each URL concurrently and returns the result from the first one that succeeds, leveraging `Promise.any`. This is useful when a Blocklet's metadata might be hosted in multiple locations, such as a primary and a backup registry.

**Parameters**

<x-field-group>
  <x-field data-name="urls" data-type="string[]" data-required="true" data-desc="An array of URLs to attempt fetching from."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="The same options object as getBlockletMetaFromUrl."></x-field>
</x-field-group>

**Returns**

<x-field data-name="" data-type="Promise<any>" data-desc="A promise that resolves with the result from the first successful fetch. If all URLs fail, the promise is rejected with an aggregate error containing the reasons for each failure."></x-field>

**Example**

```javascript Fetching with Redundancy icon=logos:javascript
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

## Composition Helpers

These helpers are used for resolving metadata for child Blocklets within a composite application.

### getSourceUrlsFromConfig

This utility is essential for Blocklet composition. When a Blocklet defines `components`, this function parses a component's configuration to generate a list of potential `blocklet.json` URLs. It can interpret various source declarations, including direct URLs, Blocklet Store identifiers, and resolved URLs.

**Parameters**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="A component configuration object from the components section of a blocklet.yml file."></x-field>
</x-field-group>

**Returns**

<x-field data-name="" data-type="string[]" data-desc="An array of potential metadata URLs for the specified component."></x-field>

**Example**

```javascript Resolving Component Metadata URLs icon=logos:javascript
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

## Validation Utilities

This section includes lower-level utilities used by the core fetching functions.

### validateUrl

This is a general-purpose utility to check if a URL is valid and accessible. It supports `file://` by checking for file existence and `http(s)://` by making a `HEAD` request to verify accessibility and, optionally, the `content-type` header. This function's results are also cached.

**Parameters**

<x-field-group>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="The URL to validate."></x-field>
  <x-field data-name="expectedHttpResTypes" data-type="string[]" data-default="['application/json', 'text/plain']" data-required="false" data-desc="An array of acceptable content-type values for HTTP requests."></x-field>
</x-field-group>

**Returns**

<x-field data-name="" data-type="Promise<boolean>" data-desc="A promise that resolves to true if the URL is valid. It throws an error if validation fails (e.g., file not found, network error, unexpected content type)."></x-field>

**Example**

```javascript Validating a Remote Asset icon=logos:javascript
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