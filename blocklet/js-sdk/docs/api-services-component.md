# ComponentService

The `ComponentService` provides a convenient API for interacting with component blocklets that are mounted within your main application. It allows you to retrieve metadata about these components and construct absolute URLs to their pages or API endpoints.

This service relies on the blocklet's metadata. To learn how to load this metadata, please refer to the [BlockletService documentation](./api-services-blocklet.md).

## Instantiation

Unlike other services, `ComponentService` must be instantiated manually. This is because it depends on the `window.blocklet` object, which may be loaded asynchronously. To ensure the service has access to the complete blocklet metadata, you should create an instance after the `blocklet` object is available.

```javascript Instantiating ComponentService icon=logos:javascript
import { ComponentService } from '@blocklet/js-sdk';

// Assuming window.blocklet is loaded and available
const componentService = new ComponentService();
```

## Methods

### getComponent()

Retrieves the full metadata object for a specific mounted component.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The identifier of the component. Can be its name, title, or did."></x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="BlockletComponent | undefined" data-type="object" data-desc="The BlockletComponent object if found, otherwise undefined."></x-field>
</x-field-group>

**Example**

```javascript Get Component Metadata icon=logos:javascript
// Mock window.blocklet object for demonstration
window.blocklet = {
  componentMountPoints: [
    {
      did: 'z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b',
      name: 'my-first-component',
      title: 'My First Component',
      mountPoint: '/components/my-first-component',
      status: 'started'
    },
    {
      did: 'z8iZzbF9tkyG27AQs5Ynawxbh2LBe4c4q7d8c',
      name: 'my-second-component',
      title: 'My Second Component',
      mountPoint: '/components/my-second-component',
      status: 'started'
    }
  ],
  // ... other blocklet properties
};

const componentService = new ComponentService();

// Find component by its name
const component = componentService.getComponent('my-first-component');
console.log(component);
```

**Example Response**

```json Response icon=mdi:code-json
{
  "did": "z8iZzaC3ukTM81BCs4Ynawxbg1KAd3b3p6c7b",
  "name": "my-first-component",
  "title": "My First Component",
  "mountPoint": "/components/my-first-component",
  "status": "started"
}
```

### getComponentMountPoint()

A helper method to quickly retrieve the `mountPoint` for a component. The mount point is the relative URL path where the component is served from the main application's domain.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The identifier of the component (name, title, or did)."></x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="mountPoint" data-type="string" data-desc="The component's mountPoint as a string (e.g., /components/my-component). Returns an empty string if the component is not found."></x-field>
</x-field-group>

**Example**

```javascript Get Mount Point icon=logos:javascript
// Using the same componentService instance from the previous example
const mountPoint = componentService.getComponentMountPoint('my-first-component');

console.log(mountPoint);
// Expected output: /components/my-first-component
```

### getUrl()

Constructs a full, absolute URL to a resource within a component. This is the recommended way to create links to other components, as it correctly handles the application's base URL and the component's specific mount point.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The identifier of the component (name, title, or did)."></x-field>
  <x-field data-name="...parts" data-type="string[]" data-required="false" data-desc="One or more path segments to append to the component's URL."></x-field>
</x-field-group>

**Returns**

<x-field-group>
  <x-field data-name="url" data-type="string" data-desc="A complete, absolute URL as a string."></x-field>
</x-field-group>

**Example**

```javascript Construct Component URL icon=logos:javascript
// Mock window.blocklet object
window.blocklet = {
  appUrl: 'https://myapp.did.abtnet.io',
  componentMountPoints: [
    {
      name: 'api-component',
      title: 'API Component',
      mountPoint: '/api/v1',
      // ... other properties
    }
  ],
  // ... other properties
};

const componentService = new ComponentService();

// Construct a URL to an API endpoint within the component
const userApiUrl = componentService.getUrl('api-component', 'users', '123');
console.log(userApiUrl);
// Expected output: https://myapp.did.abtnet.io/api/v1/users/123

// Construct a URL to a page within the component
const settingsPageUrl = componentService.getUrl('api-component', 'settings');
console.log(settingsPageUrl);
// Expected output: https://myapp.did.abtnet.io/api/v1/settings
```

## Types

### BlockletComponent

This type represents the metadata for a single mounted component.

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The decentralized identifier (DID) of the component."></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the component, as defined in its blocklet.yml."></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="The human-readable title of the component."></x-field>
  <x-field data-name="mountPoint" data-type="string" data-required="true" data-desc="The URL path where the component is mounted relative to the main app's URL."></x-field>
  <x-field data-name="status" data-type="string" data-required="true" data-desc="The current status of the component (e.g., 'started', 'stopped')."></x-field>
</x-field-group>

---

Now that you know how to interact with components, you might want to learn how to manage federated login settings. See the [FederatedService documentation](./api-services-federated.md) for more details.