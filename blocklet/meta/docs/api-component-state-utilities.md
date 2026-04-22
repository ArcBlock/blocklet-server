# Component & State Utilities

The `@blocklet/meta` library provides a comprehensive suite of utility functions designed to simplify interaction with the `BlockletState` object. Blocklets, especially composite ones, are represented as a tree of components. These utilities offer powerful and efficient ways to traverse this tree, find specific components, check their status, and extract critical information for runtime operations, UI rendering, and administrative tasks.

This section covers functions for tree traversal, component searching, status checking, configuration management, and information extraction.

## Tree Traversal

These functions allow you to iterate over the component tree of a blocklet application. They are fundamental for applying operations to every component or for aggregating data.

### `forEachBlocklet` & `forEachBlockletSync`

The core traversal functions. `forEachBlocklet` is asynchronous and can run in serial (default) or parallel, while `forEachBlockletSync` is its synchronous counterpart.

```typescript Function Signature icon=logos:typescript
function forEachBlocklet(
  blocklet: TComponentPro,
  cb: (blocklet: TComponentPro, context: object) => any,
  options?: {
    parallel?: boolean;
    concurrencyLimit?: number;
    sync?: boolean;
  }
): Promise<any> | null;

function forEachBlockletSync(
  blocklet: any,
  cb: Function
): void;
```

The callback function `cb` receives the current component and a context object containing `{ parent, root, level, ancestors, id }`.

**Example: Collecting all component DIDs**

```javascript icon=logos:javascript
import { forEachBlockletSync } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1' },
  children: [
    { meta: { did: 'z2' } },
    {
      meta: { did: 'z3' },
      children: [{ meta: { did: 'z4' } }],
    },
  ],
};

const allDids = [];
forEachBlockletSync(appState, (component) => {
  if (component.meta?.did) {
    allDids.push(component.meta.did);
  }
});

console.log(allDids);
// Output: ['z1', 'z2', 'z3', 'z4']
```

### `forEachChild` & `forEachChildSync`

These are wrappers around `forEachBlocklet` that conveniently iterate over all descendants of a blocklet, skipping the root blocklet itself (where `level > 0`).

## Finding & Filtering Components

Locating specific components within the state tree is a common requirement. These functions provide various ways to find one or more components based on different criteria.

### `findComponent`

A generic search function that traverses the component tree and returns the first component that satisfies the provided predicate function.

```typescript Function Signature icon=logos:typescript
function findComponent(
  blocklet: TComponent,
  isEqualFn: (component: TComponent, context: { ancestors: Array<TComponent> }) => boolean
): TComponent | null;
```

**Example: Find a component by its `bundleName`**

```javascript icon=logos:javascript
import { findComponent } from '@blocklet/meta/lib/util';

const appState = {
  meta: { did: 'z1', bundleName: 'app' },
  children: [
    { meta: { did: 'z2', bundleName: 'component-a' } },
    { meta: { did: 'z3', bundleName: 'component-b' } },
  ],
};

const componentB = findComponent(
  appState,
  (component) => component.meta?.bundleName === 'component-b'
);

console.log(componentB.meta.did);
// Output: 'z3'
```

### `findComponentById`

A specialized version of `findComponent` that finds a component by its unique composite ID (e.g., `app-did/component-did`).

```typescript Function Signature icon=logos:typescript
function findComponentById(
  blocklet: TComponent,
  componentId: string | string[]
): TComponent | null;
```

### `filterComponentsV2`

Iterates over the direct children of an app and returns an array of all components that satisfy the predicate function.

## Identity & Naming

These utilities help in generating and retrieving various identifiers and names for components within the application state.

| Function | Description |
|---|---|
| `getComponentId` | Constructs a unique, path-based ID for a component using its ancestors' DIDs (e.g., `root_did/child_did`). |
| `getComponentName` | Constructs a unique, path-based name for a component using its ancestors' names. |
| `getParentComponentName` | Extracts the parent component's name from a given component name path. |
| `getAppName` | Retrieves the display name of a blocklet, prioritizing the `BLOCKLET_APP_NAME` environment variable over metadata. |
| `getAppDescription` | Retrieves the description of a blocklet, prioritizing `BLOCKLET_APP_DESCRIPTION`. |
| `getComponentProcessId` | Generates a filesystem-safe process ID for a component, using MD5 hashing for long names to prevent filesystem errors. |

## Configuration & State Management

Managing configuration, especially in composite blocklets where settings can be shared, is crucial. These helpers simplify the process.

### `getSharedConfigObj`

Calculates the shared configuration object for a specific component within an application. It intelligently merges configurations from the parent application and sibling components that are marked as `shared: true`.

### `getAppMissingConfigs` & `getComponentMissingConfigs`

These functions are vital for validation. They scan an application or a single component and return a list of all configurations that are marked as `required: true` but have not been assigned a value, either directly or through the shared configuration mechanism.

**Example: Checking for missing configurations**

```javascript icon=logos:javascript
import { getAppMissingConfigs } from '@blocklet/meta/lib/util';

const appWithMissingConfig = {
  meta: { did: 'z1' },
  children: [
    {
      meta: { did: 'z2' },
      configs: [
        { key: 'API_KEY', required: true, value: null, description: 'Service API Key' },
      ],
    },
  ],
};

const missing = getAppMissingConfigs(appWithMissingConfig);

console.log(missing);
// Output: [{ did: 'z2', key: 'API_KEY', description: 'Service API Key' }]
```

### `wipeSensitiveData`

A security-focused utility that creates a deep clone of a blocklet state object and redacts all sensitive information. It replaces values of fields marked `secure: true` and certain sensitive environment variables (like `BLOCKLET_APP_SK`) with `__encrypted__`.

## Status Checks

These boolean functions provide a simple way to check the current status of a blocklet or component without needing to handle the raw status codes directly.

| Function | Description | Corresponding Statuses |
|---|---|---|
| `isRunning` | Checks if the component is in a stable, running state. | `running` |
| `isInProgress` | Checks if the component is in a transitional state. | `downloading`, `installing`, `starting`, `stopping`, `upgrading`, etc. |
| `isBeforeInstalled` | Checks if the component has not yet completed its first installation. | `added`, `waiting`, `downloading`, `installing` |
| `isAccessible` | Checks if the component's web interface might be accessible. | `running`, `waiting`, `downloading` |

## Interface & Service Discovery

Utilities for finding interfaces and services defined in a blocklet's metadata.

| Function | Description |
|---|---|
| `findWebInterface` | Finds the first interface of type `web` in a component's metadata. |
| `findDockerInterface` | Finds the first interface of type `docker` in a component's metadata. |
| `findWebInterfacePort` | Retrieves the host port mapped to the component's web interface. |
| `getBlockletServices` | Returns a flattened list of all services defined across all components in a blocklet, including their name, protocol, and port details. |

## Information Extraction

These functions extract specific, processed information from the raw blocklet state.

### `getComponentsInternalInfo`

This function traverses a blocklet application and returns a structured array containing key internal details for each component. This is extremely useful for system management and inter-service communication.

**Returns**

<x-field-group>
  <x-field data-name="components" data-type="array" data-desc="An array of internal component information objects.">
    <x-field data-name="title" data-type="string" data-desc="The display title of the component."></x-field>
    <x-field data-name="did" data-type="string" data-desc="The unique DID of the component."></x-field>
    <x-field data-name="name" data-type="string" data-desc="The machine-readable name of the component."></x-field>
    <x-field data-name="version" data-type="string" data-desc="The version of the component."></x-field>
    <x-field data-name="mountPoint" data-type="string" data-desc="The URL path where the component is mounted."></x-field>
    <x-field data-name="status" data-type="number" data-desc="The numerical status code of the component."></x-field>
    <x-field data-name="port" data-type="number" data-desc="The host port assigned to the component's web interface."></x-field>
    <x-field data-name="containerPort" data-type="string" data-desc="The internal container port for the web interface."></x-field>
    <x-field data-name="resourcesV2" data-type="array" data-desc="A list of resource assets bundled with the component.">
      <x-field data-name="path" data-type="string" data-desc="The absolute path to the resource."></x-field>
      <x-field data-name="public" data-type="boolean" data-desc="Indicates if the resource is publicly accessible."></x-field>
    </x-field>
    <x-field data-name="group" data-type="string" data-desc="The functional group of the component (e.g., 'gateway', 'dapp')."></x-field>
  </x-field>
</x-field-group>

### `getMountPoints`

Scans the entire component tree and returns a structured list of all components that have a mount point, making it easy to build navigation or routing tables.

### `getAppUrl`

Determines the primary, user-facing URL for a blocklet application by analyzing its `site.domainAliases`. It intelligently sorts the domains to prioritize accessible, non-protected URLs.

## Miscellaneous Utilities

A collection of other useful checks and helpers.

| Function | Description |
|---|---|
| `isFreeBlocklet` | Checks if a blocklet has a payment price of zero. |
| `isDeletableBlocklet` | Checks if a blocklet is allowed to be deleted based on the `BLOCKLET_DELETABLE` environment variable. |
| `hasRunnableComponent` | Determines if the application contains any non-gateway components that can be run. |
| `isExternalBlocklet` | Checks if the blocklet is managed by an external controller. |
| `isGatewayBlocklet` | Checks if the component's group is `gateway`. |
| `isPackBlocklet` | Checks if the component's group is `pack`. |
| `hasStartEngine` | Checks if the component's metadata defines a startable engine (e.g., `main` or `docker.image`). |
| `hasMountPoint` | Determines if a component should have a mount point based on its configuration. |
| `getBlockletChainInfo` | Extracts and consolidates chain configuration (type, id, host) from the blocklet and its children. |
| `checkPublicAccess`| Checks if the blocklet's security configuration allows for public access. |
