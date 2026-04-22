# BlockletService

The `BlockletService` provides methods to access the metadata of a blocklet. This metadata, represented by the `Blocklet` object, contains essential information such as the application's name, URL prefix, version, and component mount points.

The service can retrieve this information in two primary ways:

1.  **Client-Side:** By reading the global `window.blocklet` object, which is automatically available when your code is running inside a blocklet's frontend.
2.  **Remote Fetch:** By fetching the blocklet's metadata from a specified base URL. This is useful for server-side contexts or when interacting with a blocklet from an external application.

To improve performance, the service implements an in-memory cache for remotely fetched blocklet data, which lasts for 60 seconds.

---

## Methods

### getBlocklet()

Fetches the blocklet's metadata object. The behavior of this method changes based on the provided arguments.

-   When called without arguments on the client-side, it synchronously returns `window.blocklet`.
-   When called with a `baseUrl`, it asynchronously fetches the metadata from the remote URL.

**Parameters**

<x-field-group>
  <x-field data-name="baseUrl" data-type="string" data-required="false" data-desc="The base URL of the blocklet to fetch metadata from. Required for server-side usage."></x-field>
  <x-field data-name="force" data-type="boolean" data-default="false" data-required="false" data-desc="If true, it will bypass the cache and fetch fresh data from the remote URL."></x-field>
</x-field-group>

**Returns**

<x-field data-name="Promise<Blocklet> | Blocklet" data-type="Promise<Blocklet> | Blocklet" data-desc="Returns a Promise that resolves with the blocklet metadata object when fetching remotely, or the object directly in a client-side context."></x-field>

**Examples**

```javascript Get Blocklet on Client-Side icon=logos:javascript
// This code assumes it's running in a blocklet's frontend environment

async function logBlockletName() {
  try {
    // On the client, getBlocklet() can be synchronous if data is preloaded
    const blocklet = await sdk.blocklet.getBlocklet();
    console.log('Blocklet Name:', blocklet.appName);
  } catch (error) {
    console.error('Failed to get blocklet info:', error);
  }
}

logBlockletName();
```

```javascript Fetch Blocklet from a URL icon=logos:javascript
async function fetchRemoteBlocklet(url) {
  try {
    console.log(`Fetching blocklet info from ${url}...`);
    const blocklet = await sdk.blocklet.getBlocklet(url);
    console.log(`Successfully fetched: ${blocklet.appName} v${blocklet.version}`);

    // Fetch again, this time it should be from cache
    const cachedBlocklet = await sdk.blocklet.getBlocklet(url);
    console.log('Fetched from cache:', cachedBlocklet.appName);

    // Force a refetch, bypassing the cache
    const freshBlocklet = await sdk.blocklet.getBlocklet(url, true);
    console.log('Force-refetched:', freshBlocklet.appName);
  } catch (error) {
    console.error('Failed to fetch remote blocklet:', error);
  }
}

fetchRemoteBlocklet('https://store.blocklet.dev');
```

### loadBlocklet()

This is a client-side utility method that dynamically injects the `__blocklet__.js` script into the document's `<head>`. This script populates the `window.blocklet` object, making the metadata available globally. This is particularly useful for applications that are not blocklets themselves but need to interact with one.

> Note: This method will fail if called in a server-side (Node.js) environment.

**Returns**

<x-field data-name="Promise<void>" data-type="Promise<void>" data-desc="A Promise that resolves when the script has been successfully loaded and rejects if there is an error."></x-field>

**Example**

```javascript Dynamically Load Blocklet Script icon=logos:javascript
async function initializeBlockletData() {
  try {
    await sdk.blocklet.loadBlocklet();
    console.log('Blocklet script loaded successfully.');
    // Now window.blocklet is available
    console.log('Blocklet Name:', window.blocklet.appName);
  } catch (error) {
    console.error('Failed to load the blocklet script:', error);
  }
}

// Run this function in a browser environment
initializeBlockletData();
```

### getPrefix()

A convenience method to get the URL prefix for a blocklet. The prefix is the base path where the blocklet is served (e.g., `/` or `/my-blocklet`).

**Parameters**

<x-field data-name="blocklet" data-type="Blocklet" data-required="false" data-desc="An optional Blocklet object. If provided, its prefix property will be returned."></x-field>

**Returns**

<x-field data-name="string | null" data-type="string | null" data-desc="The string prefix (e.g., '/app') or '/' as a default. In a server-side environment where window is not available and no blocklet object is passed, it returns null."></x-field>

**Example**

```javascript Get URL Prefix icon=logos:javascript
// Assuming this runs on the client-side inside a blocklet
const prefix = sdk.blocklet.getPrefix();
console.log('Current blocklet prefix:', prefix);

// Or, you can pass a Blocklet object you've already fetched
async function logPrefixForRemoteBlocklet(url) {
  const remoteBlocklet = await sdk.blocklet.getBlocklet(url);
  const remotePrefix = sdk.blocklet.getPrefix(remoteBlocklet);
  console.log(`Prefix for ${remoteBlocklet.appName} is:`, remotePrefix);
}

logPrefixForRemoteBlocklet('https://store.blocklet.dev');
```

---

## The Blocklet Object

The `getBlocklet()` method returns a `Blocklet` object, which contains comprehensive metadata about the application. Below are some of the most commonly used properties.

<x-field-group>
  <x-field data-name="did" data-type="string" data-desc="The decentralized identifier (DID) of the blocklet."></x-field>
  <x-field data-name="appName" data-type="string" data-desc="The human-readable name of the application."></x-field>
  <x-field data-name="appUrl" data-type="string" data-desc="The full public URL of the application."></x-field>
  <x-field data-name="prefix" data-type="string" data-desc="The URL prefix where the blocklet is mounted."></x-field>
  <x-field data-name="version" data-type="string" data-desc="The version of the blocklet (e.g., '1.2.3')."></x-field>
  <x-field data-name="isComponent" data-type="boolean" data-desc="Indicates if the blocklet is a component."></x-field>
  <x-field data-name="componentMountPoints" data-type="BlockletComponent[]" data-desc="An array of components mounted by this blocklet."></x-field>
  <x-field data-name="theme" data-type="BlockletTheme" data-desc="An object containing theme configuration like colors and logos."></x-field>
  <x-field data-name="navigation" data-type="BlockletNavigation[]" data-desc="An array of navigation items for the blocklet's UI."></x-field>
  <x-field data-name="serverDid" data-type="string" data-desc="The DID of the Blocklet Server instance running the blocklet."></x-field>
</x-field-group>

**Example Response**

```json Blocklet Object Example icon=mdi:code-json
{
  "did": "z8iZz...",
  "appId": "z1s...",
  "appName": "Blocklet Store",
  "appDescription": "A marketplace for blocklets",
  "appUrl": "https://store.blocklet.dev",
  "prefix": "/",
  "version": "1.16.29",
  "isComponent": false,
  "theme": {
    "logo": "logo.png",
    "colors": {
      "primary": "#4F6AF6"
    }
  },
  "navigation": [
    {
      "id": "home",
      "title": "Home",
      "link": "/"
    }
  ],
  "componentMountPoints": [],
  "serverDid": "z2qaD...",
  "webWalletUrl": "https://web.abtwallet.io"
}
```

For a complete list of all properties, please refer to the [Types](./api-types.md) reference page.

---

## Next Steps

Now that you know how to retrieve blocklet metadata, you might want to learn how to get information about its mounted components. Continue to the next section to learn about the `ComponentService`.

<x-card data-title="ComponentService" data-icon="lucide:box" data-cta="Read More" data-href="/api/services/component">
  API for getting information about mounted components and constructing URLs for them.
</x-card>