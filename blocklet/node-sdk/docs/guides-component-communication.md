# Component-to-Component Communication

In a Blocklet application composed of multiple components, enabling them to communicate with each other securely and reliably is essential. The Blocklet SDK provides a high-level utility, `component.call`, designed specifically for this purpose. This method simplifies inter-component API calls by handling service discovery, request signing, and automatic retries.

This approach is more robust than making direct HTTP requests because it abstracts away the complexities of the underlying environment, such as dynamic ports and Docker networking, while ensuring that all communication is authenticated.

## Making a Secure API Call

The primary method for inter-component communication is `component.call`. It acts as a wrapper around an HTTP client (`axios`) but automatically injects the necessary authentication headers to verify the calling component's identity.

### Basic Usage

Here is a basic example of one component calling an API endpoint on another component named 'user-service'.

```javascript Calling another component icon=logos:javascript
import component from '@blocklet/sdk/component';

async function getUserProfile(userId) {
  try {
    const response = await component.call({
      name: 'user-service', // Name, DID, or title of the target component
      method: 'GET',
      path: `/api/users/${userId}`,
    });

    console.log('User Profile:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to call user-service:', error.message);
  }
}
```

### How It Works

The `component.call` function streamlines the communication process through several key steps:

1.  **Service Discovery**: It looks up the target component (e.g., 'user-service') in the application's component registry to find its current location and metadata.
2.  **Endpoint Resolution**: It constructs the correct internal URL to reach the component, automatically handling complexities like Docker container networking.
3.  **Request Signing**: Before sending the request, it automatically adds special `x-component-*` headers. These headers contain a signature generated using the calling component's secret key, proving its identity.
4.  **API Call**: It executes the HTTP request using the configured method, path, and data.
5.  **Automatic Retries**: If the request fails due to a transient server error (e.g., a 5xx status code), it will automatically retry the request a few times with an increasing delay (exponential backoff).

This flow ensures that the communication is both reliable and secure. The receiving component can use the [session middleware](./authentication-session-middleware.md) to verify the signature and authorize the request.

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Component-to-Component Communication](assets/diagram/component-communication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### `call` Parameters

The `component.call` function accepts an options object with the following properties:

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The name, title, or DID of the target component to call."></x-field>
  <x-field data-name="method" data-type="string" data-default="POST" data-required="false" data-desc="The HTTP method for the request (e.g., 'GET', 'POST', 'PUT', 'DELETE')."></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="The API path on the target component (e.g., '/api/v1/resource')."></x-field>
  <x-field data-name="data" data-type="any" data-required="false">
    <x-field-desc markdown>The request body, typically used with `POST`, `PUT`, or `PATCH` methods.</x-field-desc>
  </x-field>
  <x-field data-name="params" data-type="any" data-required="false" data-desc="URL query parameters to be appended to the request URL."></x-field>
  <x-field data-name="headers" data-type="object" data-required="false" data-desc="An object of custom headers to be sent with the request."></x-field>
  <x-field data-name="timeout" data-type="number" data-required="false" data-desc="Request timeout in milliseconds."></x-field>
  <x-field data-name="responseType" data-type="string" data-required="false" data-desc="The type of data that the server will respond with. For example, 'stream'."></x-field>
</x-field-group>

### Return Value

The function returns a `Promise` that resolves to an `AxiosResponse` object, which contains properties like `data`, `status`, and `headers`.

## Advanced Usage

### Customizing Retry Behavior

You can customize the automatic retry logic by passing a second argument to `component.call`. This is useful for adjusting to the specific reliability needs of an endpoint.

```javascript Custom Retry Options icon=lucide:refresh-cw
import component from '@blocklet/sdk/component';

const callOptions = {
  name: 'data-processor',
  method: 'POST',
  path: '/api/process',
  data: { job: 'some-long-job' },
};

const retryOptions = {
  retries: 5,       // Attempt 5 times in total
  minTimeout: 1000, // Wait at least 1 second between retries
  factor: 2,        // Double the wait time after each failed attempt
};

async function processData() {
  const response = await component.call(callOptions, retryOptions);
  return response.data;
}
```

The `retryOptions` object can have the following properties:

<x-field-group>
  <x-field data-name="retries" data-type="number" data-default="3" data-desc="The total number of attempts to make."></x-field>
  <x-field data-name="factor" data-type="number" data-default="2" data-desc="The exponential factor to use for backoff."></x-field>
  <x-field data-name="minTimeout" data-type="number" data-default="500" data-desc="The minimum timeout between retries in milliseconds."></x-field>
  <x-field data-name="maxTimeout" data-type="number" data-default="5000" data-desc="The maximum timeout between retries in milliseconds."></x-field>
  <x-field data-name="randomize" data-type="boolean" data-default="true" data-desc="Whether to randomize the timeout."></x-field>
  <x-field data-name="onFailedAttempt" data-type="function" data-required="false" data-desc="A callback function that is invoked on each failed attempt."></x-field>
</x-field-group>

### Handling Stream Responses

For endpoints that return a stream (e.g., downloading a large file), you can set `responseType: 'stream'`. This allows you to process the data as it arrives without buffering the entire response in memory.

```javascript Streaming a File icon=lucide:file-down
import fs from 'fs';
import component from '@blocklet/sdk/component';

async function downloadBackup() {
  const response = await component.call({
    name: 'backup-service',
    method: 'GET',
    path: '/api/export',
    responseType: 'stream',
  });

  const writer = fs.createWriteStream('backup.zip');
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
```

---

By using `component.call`, you can build robust and secure multi-component applications with ease. The next logical step is to learn how to protect your component's API endpoints by verifying these incoming calls. See the [Session Middleware](./authentication-session-middleware.md) guide for details.
