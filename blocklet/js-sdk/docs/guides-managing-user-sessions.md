# Managing User Sessions

The `@blocklet/js-sdk` provides a `UserSessionService` to help you fetch and manage user login sessions across different devices. This is particularly useful for building features like a "Security" or "Devices" page where users can see all their active sessions and understand where their account is being used.

This guide will walk you through the common use cases for managing user sessions.

### Accessing the UserSessionService

First, get an instance of the Blocklet SDK. The `UserSessionService` is available under the `userSession` property.

```javascript SDK Initialization icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();
const userSessionService = sdk.userSession;
```

## Fetching Your Own Login Sessions

The most common task is to retrieve the list of sessions for the currently authenticated user. The `getMyLoginSessions` method allows you to do this with support for pagination and filtering.

```javascript Fetching the current user's sessions icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchMySessions() {
  try {
    const sdk = getBlockletSDK();
    // Fetch the first page of 10 online sessions
    const result = await sdk.userSession.getMyLoginSessions({}, {
      page: 1,
      pageSize: 10,
      status: 'online', // Optional filter: 'online' | 'expired' | 'offline'
    });

    console.log(`Total online sessions: ${result.paging.total}`);
    result.list.forEach(session => {
      console.log(`- Session on ${session.ua} last active at ${session.updatedAt}`);
    });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

fetchMySessions();
```

### Parameters

The method signature is `getMyLoginSessions({ appUrl?: string }, params: UserSessionQuery)`. The second argument is a query object with the following parameters:

<x-field-group>
  <x-field data-name="page" data-type="number" data-default="1" data-desc="The page number to retrieve."></x-field>
  <x-field data-name="pageSize" data-type="number" data-default="10" data-desc="The number of sessions per page."></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="Filter sessions by their current status."></x-field>
</x-field-group>

### Response

The method returns a promise that resolves to a `UserSessionList` object.

<x-field data-name="" data-type="object" data-desc="The response object containing the session list and pagination details.">
  <x-field data-name="list" data-type="UserSession[]" data-desc="An array of user session objects.">
    <x-field data-name="" data-type="object" data-desc="A single user session object.">
      <x-field data-name="id" data-type="string" data-desc="Unique identifier for the session."></x-field>
      <x-field data-name="appName" data-type="string" data-desc="Name of the application where the session was created."></x-field>
      <x-field data-name="appPid" data-type="string" data-desc="Blocklet PID of the application."></x-field>
      <x-field data-name="lastLoginIp" data-type="string" data-desc="The last known IP address for this session."></x-field>
      <x-field data-name="ua" data-type="string" data-desc="The User-Agent string of the client device."></x-field>
      <x-field data-name="updatedAt" data-type="string" data-desc="Timestamp of the last activity."></x-field>
      <x-field data-name="status" data-type="string" data-desc="The current status of the session (e.g., 'online')."></x-field>
      <x-field data-name="userDid" data-type="string" data-desc="The DID of the user associated with the session."></x-field>
    </x-field>
  </x-field>
  <x-field data-name="paging" data-type="object" data-desc="Pagination information.">
    <x-field data-name="page" data-type="number" data-desc="The current page number."></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="The number of items per page."></x-field>
    <x-field data-name="total" data-type="number" data-desc="The total number of sessions matching the query."></x-field>
  </x-field>
</x-field>


## Fetching Sessions for a Specific User

In some cases, like an admin dashboard, you might need to fetch login sessions for a user other than the one who is currently logged in. The `getUserSessions` method allows you to do this by providing a user's DID.

```javascript Fetching sessions for a specific DID icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

async function fetchUserSessions(userDid) {
  try {
    const sdk = getBlockletSDK();
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });

    console.log(`Found ${sessions.length} sessions for user ${userDid}:`);
    sessions.forEach(session => {
      console.log(`- Session ID: ${session.id}, App: ${session.appName}`);
    });
  } catch (error) {
    console.error(`Failed to fetch sessions for user ${userDid}:`, error);
  }
}

// Replace with the target user's DID
fetchUserSessions('zNK...some...user...did');
```

### Parameters

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user whose sessions to fetch."></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="The base URL of the application. Defaults to the current Blocklet's service URL."></x-field>
</x-field-group>

### Response

The method returns a promise that resolves to an array of `UserSession` objects.

<x-field data-name="" data-type="UserSession[]" data-desc="An array of user session objects for the specified user.">
  <x-field data-name="" data-type="object" data-desc="A single user session object.">
    <x-field data-name="id" data-type="string" data-desc="Unique identifier for the session."></x-field>
    <x-field data-name="appName" data-type="string" data-desc="Name of the application where the session was created."></x-field>
    <x-field data-name="appPid" data-type="string" data-desc="Blocklet PID of the application."></x-field>
    <x-field data-name="ua" data-type="string" data-desc="The User-Agent string of the client device."></x-field>
    <x-field data-name="updatedAt" data-type="string" data-desc="Timestamp of the last activity."></x-field>
    <x-field data-name="status" data-type="string" data-desc="The current status of the session."></x-field>
    <x-field data-name="userDid" data-type="string" data-desc="The DID of the user associated with the session."></x-field>
  </x-field>
</x-field>

---

This guide has covered the primary ways to retrieve user session information using the SDK. For a complete list of all available methods and detailed type definitions, please refer to the [UserSessionService API Reference](./api-services-user-session.md).
