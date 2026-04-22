# UserSessionService

The `UserSessionService` provides an API for fetching and managing a user's login sessions across different devices and applications. This service is essential for building features that allow users to view their active login locations, see which devices have accessed their account, and manage those sessions.

For a practical guide on using this service, please refer to the [Managing User Sessions](./guides-managing-user-sessions.md) guide.

## Methods

### getMyLoginSessions()

Retrieves a paginated list of the current user's own login sessions.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="An object containing configuration options.">
    <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="The base URL of the application to query."></x-field>
  </x-field>
  <x-field data-name="params" data-type="UserSessionQuery" data-required="false" data-default="{ page: 1, pageSize: 10 }" data-desc="An object for pagination and filtering.">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="The page number to retrieve."></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="The number of items per page."></x-field>
    <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="Filter sessions by their status."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="Promise<UserSessionList>" data-type="Promise" data-desc="A promise that resolves to an object containing a list of sessions and pagination details."></x-field>

**Example**

```javascript Fetching My Online Sessions icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchMySessions() {
  try {
    const sessionData = await sdk.userSession.getMyLoginSessions(
      {},
      { page: 1, pageSize: 5, status: 'online' }
    );
    console.log('Online Sessions:', sessionData.list);
    console.log('Total online sessions:', sessionData.paging.total);
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
  }
}

fetchMySessions();
```

**Example Response**

```json
{
  "list": [
    {
      "id": "z8V...",
      "appName": "My Blocklet",
      "appPid": "my-blocklet-pid",
      "lastLoginIp": "192.168.1.1",
      "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
      "updatedAt": "2023-10-27T10:00:00.000Z",
      "status": "online",
      "userDid": "zNK..."
    }
  ],
  "paging": {
    "page": 1,
    "pageSize": 5,
    "total": 1
  }
}
```

### getUserSessions()

Retrieves all login sessions for a specific user DID. This method is typically used in administrative contexts.

**Parameters**

<x-field data-name="options" data-type="object" data-required="true" data-desc="An object containing the user's DID and optional app URL.">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user whose sessions are to be fetched."></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="The base URL of the application to query."></x-field>
</x-field>

**Returns**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="A promise that resolves to an array of UserSession objects."></x-field>

**Example**

```javascript Fetching Sessions for a Specific User icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function fetchUserSessions(userDid) {
  try {
    const sessions = await sdk.userSession.getUserSessions({ did: userDid });
    console.log(`Sessions for user ${userDid}:`, sessions);
  } catch (error) {
    console.error('Failed to fetch user sessions:', error);
  }
}

fetchUserSessions('zNK...userDid...'); // Replace with a valid user DID
```

**Example Response**

```json
[
  {
    "id": "z8V...",
    "appName": "My Blocklet",
    "appPid": "my-blocklet-pid",
    "lastLoginIp": "192.168.1.1",
    "ua": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...",
    "updatedAt": "2023-10-27T10:00:00.000Z",
    "status": "online",
    "userDid": "zNK..."
  }
]
```

### loginByUserSession()

Initiates a new login based on an existing user session ID. This can be used for features like seamless sign-in across related applications.

**Parameters**

<x-field data-name="options" data-type="object" data-required="true" data-desc="An object containing the session details required for login.">
  <x-field data-name="id" data-type="string" data-required="true" data-desc="The ID of the existing session to use for login."></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="The PID of the application being logged into."></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user associated with the session."></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="The ID of the user's passport."></x-field>
  <x-field data-name="appUrl" data-type="string" data-required="false" data-desc="The base URL of the application."></x-field>
</x-field>

**Returns**

<x-field data-name="Promise<UserSession[]>" data-type="Promise" data-desc="A promise that resolves to an array containing the new user session."></x-field>

**Example**

```javascript Logging In with an Existing Session icon=logos:javascript
import { getBlockletSDK } from '@blocklet/js-sdk';

const sdk = getBlockletSDK();

async function loginWithSession(sessionDetails) {
  try {
    const newSessions = await sdk.userSession.loginByUserSession(sessionDetails);
    console.log('Successfully logged in with new session:', newSessions[0]);
  } catch (error) {
    console.error('Login by session failed:', error);
  }
}

const existingSession = {
  id: 'session_id_to_use',
  appPid: 'target_app_pid',
  userDid: 'zNK...userDid...',
  passportId: 'passport_id_string'
};

loginWithSession(existingSession);
```

## Data Structures

The following are the primary data structures used by the `UserSessionService`.

### UserSession

Represents a single login session for a user in a specific application.

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="Unique identifier for the session."></x-field>
  <x-field data-name="appName" data-type="string" data-required="true" data-desc="The name of the application where the session originated."></x-field>
  <x-field data-name="appPid" data-type="string" data-required="true" data-desc="The PID of the application."></x-field>
  <x-field data-name="lastLoginIp" data-type="string" data-required="true" data-desc="The last known IP address for this session."></x-field>
  <x-field data-name="ua" data-type="string" data-required="true" data-desc="The User-Agent string of the client device."></x-field>
  <x-field data-name="createdAt" data-type="string" data-required="false" data-desc="The timestamp when the session was created."></x-field>
  <x-field data-name="updatedAt" data-type="string" data-required="true" data-desc="The timestamp of the last activity for this session."></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="The current status of the session."></x-field>
  <x-field data-name="user" data-type="UserSessionUser" data-required="false" data-desc="Detailed information about the user."></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user who owns the session."></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="true" data-desc="An identifier for the visitor/device."></x-field>
  <x-field data-name="passportId" data-type="string | null" data-required="true" data-desc="The ID of the user's passport."></x-field>
  <x-field data-name="extra" data-type="object" data-required="true" data-desc="Additional metadata.">
    <x-field data-name="walletOS" data-type="'android' | 'ios' | 'web'" data-required="true" data-desc="The operating system of the wallet used."></x-field>
  </x-field>
</x-field-group>

### UserSessionUser

Contains detailed information about the user associated with a session.

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The user's Decentralized Identifier (DID)."></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="The full name of the user."></x-field>
  <x-field data-name="email" data-type="string" data-required="true" data-desc="The user's email address."></x-field>
  <x-field data-name="avatar" data-type="string" data-required="true" data-desc="URL to the user's avatar image."></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="The user's public key."></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The user's role within the application (e.g., 'owner', 'admin')."></x-field>
  <x-field data-name="roleTitle" data-type="string" data-required="true" data-desc="The display title for the user's role."></x-field>
  <x-field data-name="sourceProvider" data-type="'wallet' | 'auth0' | 'nft'" data-required="true" data-desc="The provider used for authentication."></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-required="true" data-desc="The PID of the application that sourced the user data."></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="Any remarks or notes about the user."></x-field>
</x-field-group>

### UserSessionList

A paginated list of user sessions.

<x-field-group>
  <x-field data-name="list" data-type="UserSession[]" data-required="true" data-desc="An array of user session objects."></x-field>
  <x-field data-name="paging" data-type="object" data-required="true" data-desc="An object containing pagination details.">
    <x-field data-name="page" data-type="number" data-required="true" data-desc="The current page number."></x-field>
    <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="The number of items per page."></x-field>
    <x-field data-name="total" data-type="number" data-required="true" data-desc="The total number of items."></x-field>
  </x-field>
</x-field-group>

### UserSessionQuery

An object used to filter and paginate session queries.

<x-field-group>
  <x-field data-name="page" data-type="number" data-required="true" data-desc="The page number to retrieve."></x-field>
  <x-field data-name="pageSize" data-type="number" data-required="true" data-desc="The number of sessions per page."></x-field>
  <x-field data-name="status" data-type="'online' | 'expired' | 'offline'" data-required="false" data-desc="Filter sessions by their status."></x-field>
</x-field-group>