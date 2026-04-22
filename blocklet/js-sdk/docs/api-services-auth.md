# AuthService

The `AuthService` provides a comprehensive API for managing all aspects of a user's account. It handles user profiles, privacy and notification settings, social interactions like following other users, and critical authentication actions such as logging out and deleting an account. You can access it through the SDK instance at `sdk.auth`.

This service works closely with the [`TokenService`](./api-services-token.md) to manage authentication states, but abstracts away the low-level token handling for most operations.

## User Profile Management

These methods allow you to fetch, update, and manage user profile data.

### getProfile

Retrieves the complete profile for the currently authenticated user.

```javascript icon=logos:javascript
const profile = await sdk.auth.getProfile();
console.log(profile);
```

**Returns**

<x-field data-name="profile" data-type="Promise<object>" data-desc="A promise that resolves to the user's profile object."></x-field>

**Example Response**

```json
{
  "did": "z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "avatar": "https://example.com/avatar.png",
  "bio": "Developer and enthusiast.",
  "metadata": {}
}
```

### saveProfile

Updates the profile of the currently authenticated user. You can update fields like `locale`, `metadata`, and more.

**Parameters**

<x-field-group>
  <x-field data-name="profileData" data-type="object" data-required="true" data-desc="An object containing the profile fields to update.">
    <x-field data-name="locale" data-type="string" data-required="false" data-desc="The user's preferred language locale (e.g., 'en')."></x-field>
    <x-field data-name="inviter" data-type="string" data-required="false" data-desc="The DID of the user who invited the current user."></x-field>
    <x-field data-name="metadata" data-type="any" data-required="false" data-desc="An object for storing custom user data."></x-field>
    <x-field data-name="address" data-type="any" data-required="false" data-desc="The user's address information."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const updatedProfile = await sdk.auth.saveProfile({
  metadata: { twitter: '@johndoe' },
  locale: 'en-US'
});
console.log('Profile saved:', updatedProfile);
```

**Returns**

<x-field data-name="updatedProfile" data-type="Promise<object>" data-desc="A promise that resolves to the updated profile object."></x-field>

### getUserPublicInfo

Fetches publicly available information for any user, identified by their DID.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="The Decentralized Identifier (DID) of the user."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const publicInfo = await sdk.auth.getUserPublicInfo({ did: 'z8ia...' });
console.log(publicInfo.fullName);
```

**Returns**

<x-field data-name="UserPublicInfo" data-type="Promise<object>" data-desc="A promise that resolves to a UserPublicInfo object.">
  <x-field data-name="avatar" data-type="string" data-desc="URL of the user's avatar."></x-field>
  <x-field data-name="did" data-type="string" data-desc="The user's DID."></x-field>
  <x-field data-name="fullName" data-type="string" data-desc="The user's full name."></x-field>
  <x-field data-name="sourceAppPid" data-type="string | null" data-desc="The PID of the source application."></x-field>
</x-field>

### refreshProfile

Forces a synchronization of the user's profile from its original source, ensuring the data is up-to-date.

```javascript icon=logos:javascript
await sdk.auth.refreshProfile();
console.log('Profile refresh initiated.');
```

**Returns**

<x-field data-name="void" data-type="Promise<void>" data-desc="A promise that resolves when the refresh request has been sent."></x-field>

### updateDidSpace

Updates the user's DID Space configuration, which determines where their data is stored.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="spaceGateway" data-type="object" data-required="true" data-desc="An object containing the new DID Space gateway details.">
      <x-field data-name="did" data-type="string" data-required="true" data-desc="DID of the space."></x-field>
      <x-field data-name="name" data-type="string" data-required="true" data-desc="Name of the space."></x-field>
      <x-field data-name="url" data-type="string" data-required="true" data-desc="URL of the space."></x-field>
      <x-field data-name="endpoint" data-type="string" data-required="true" data-desc="API endpoint of the space."></x-field>
    </x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const spaceGateway = {
  did: 'zNK...',
  name: 'My Personal Space',
  url: 'https://space.example.com',
  endpoint: 'https://space.example.com/api'
};

await sdk.auth.updateDidSpace({ spaceGateway });
console.log('DID Space updated successfully.');
```

**Returns**

<x-field data-name="void" data-type="Promise<void>" data-desc="A promise that resolves upon successful update."></x-field>

### getProfileUrl

Constructs the URL for a user's public profile page.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="The user's DID."></x-field>
    <x-field data-name="locale" data-type="string" data-required="true" data-desc="The desired locale for the profile page."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const url = await sdk.auth.getProfileUrl({ did: 'z8ia...', locale: 'en' });
console.log('Profile URL:', url);
```

**Returns**

<x-field data-name="url" data-type="Promise<string>" data-desc="A promise that resolves to the full profile URL string."></x-field>

## Settings Management

Manage user-specific settings for privacy and notifications.

### getUserPrivacyConfig

Retrieves the privacy settings for a specified user.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user whose privacy settings are being requested."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const privacyConfig = await sdk.auth.getUserPrivacyConfig({ did: 'z8ia...' });
console.log('Is email public?', privacyConfig.isEmailPublic);
```

**Returns**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="A promise that resolves to the user's PrivacyConfig object, where keys are setting names and values are booleans."></x-field>

### saveUserPrivacyConfig

Saves the privacy settings for the currently authenticated user.

**Parameters**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="An object with key-value pairs representing the privacy settings."></x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = { isEmailPublic: false, allowFriendRequests: false };
const savedConfig = await sdk.auth.saveUserPrivacyConfig(newConfig);
console.log('Privacy config saved.');
```

**Returns**

<x-field data-name="PrivacyConfig" data-type="Promise<object>" data-desc="A promise that resolves to the saved PrivacyConfig object."></x-field>

### getUserNotificationConfig

Gets the notification configuration for the current user, including webhooks and channel preferences.

```javascript icon=logos:javascript
const notificationConfig = await sdk.auth.getUserNotificationConfig();
console.log('Webhooks:', notificationConfig.webhooks);
```

**Returns**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="A promise that resolves to the NotificationConfig object.">
  <x-field data-name="webhooks" data-type="array" data-required="false">
    <x-field data-name="webhook" data-type="object">
      <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
      <x-field data-name="url" data-type="string" data-required="true"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="notifications" data-type="object" data-required="false">
    <x-field data-name="email" data-type="boolean" data-required="false"></x-field>
    <x-field data-name="wallet" data-type="boolean" data-required="false"></x-field>
    <x-field data-name="phone" data-type="boolean" data-required="false"></x-field>
  </x-field>
</x-field>

### saveUserNotificationConfig

Saves new notification settings for the current user.

**Parameters**

<x-field-group>
  <x-field data-name="config" data-type="object" data-required="true" data-desc="The new notification configuration object.">
    <x-field data-name="webhooks" data-type="array" data-required="false">
      <x-field data-name="webhook" data-type="object">
        <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
        <x-field data-name="url" data-type="string" data-required="true"></x-field>
      </x-field>
    </x-field>
    <x-field data-name="notifications" data-type="object" data-required="false">
      <x-field data-name="email" data-type="boolean" data-required="false"></x-field>
      <x-field data-name="wallet" data-type="boolean" data-required="false"></x-field>
      <x-field data-name="phone" data-type="boolean" data-required="false"></x-field>
    </x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const newConfig = {
  webhooks: [
    { type: 'api', url: 'https://example.com/webhook' }
  ],
  notifications: {
    email: true,
    wallet: false
  }
};
const savedConfig = await sdk.auth.saveUserNotificationConfig(newConfig);
console.log('Notification config saved:', savedConfig);
```

**Returns**

<x-field data-name="NotificationConfig" data-type="Promise<object>" data-desc="A promise that resolves to the saved NotificationConfig object."></x-field>

### testNotificationWebhook

Tests a webhook configuration to ensure it can receive test notifications.

**Parameters**

<x-field-group>
  <x-field data-name="webhook" data-type="object" data-required="true" data-desc="The webhook object to test.">
    <x-field data-name="type" data-type="'slack' | 'api'" data-required="true"></x-field>
    <x-field data-name="url" data-type="string" data-required="true"></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const webhookToTest = {
  type: 'slack',
  url: 'https://hooks.slack.com/services/...'
};
const result = await sdk.auth.testNotificationWebhook(webhookToTest);
console.log('Webhook test successful:', result.success);
```

**Returns**

<x-field data-name="result" data-type="Promise<object>" data-desc="A promise that resolves to an object with a success property.">
  <x-field data-name="success" data-type="boolean" data-desc="Indicates if the test was successful."></x-field>
</x-field>

## Social Interactions

Manage social connections between users.

### followUser

Follow another user.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user to follow."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToFollow = 'z8ia...';
await sdk.auth.followUser({ userDid: userToFollow });
console.log(`Successfully followed ${userToFollow}.`);
```

**Returns**

<x-field data-name="void" data-type="Promise<void>" data-desc="A promise that resolves when the operation is complete."></x-field>

### unfollowUser

Unfollow a user.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user to unfollow."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToUnfollow = 'z8ia...';
await sdk.auth.unfollowUser({ userDid: userToUnfollow });
console.log(`Successfully unfollowed ${userToUnfollow}.`);
```

**Returns**

<x-field data-name="void" data-type="Promise<void>" data-desc="A promise that resolves when the operation is complete."></x-field>

### isFollowingUser

Check if the current user is following a specific user.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="true">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user to check."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
const userToCheck = 'z8ia...';
const { isFollowing } = await sdk.auth.isFollowingUser({ userDid: userToCheck });
if (isFollowing) {
  console.log(`You are following ${userToCheck}.`);
} else {
  console.log(`You are not following ${userToCheck}.`);
}
```

**Returns**

<x-field data-name="result" data-type="Promise<object>" data-desc="A promise that resolves to an object containing an isFollowing property.">
  <x-field data-name="isFollowing" data-type="boolean" data-desc="True if the current user is following the specified user."></x-field>
</x-field>

## Authentication & Account Actions

Perform critical actions related to the user's session and account lifecycle.

### logout

Logs the current user out. It can be configured to log out from a specific device or all sessions.

**Parameters**

<x-field-group>
  <x-field data-name="options" data-type="object" data-required="false">
    <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="The ID of a specific device/session to log out."></x-field>
    <x-field data-name="status" data-type="string" data-required="false" data-desc="The status of the session to log out."></x-field>
    <x-field data-name="includeFederated" data-type="boolean" data-required="false" data-desc="If true, also logs out from all applications in the Federated Login Group."></x-field>
  </x-field>
</x-field-group>

```javascript icon=logos:javascript
// Simple logout from the current session
await sdk.auth.logout({});
console.log('Logged out successfully.');

// Log out from a specific device and all federated apps
await sdk.auth.logout({ visitorId: 'some-visitor-id', includeFederated: true });
```

**Returns**

<x-field data-name="void" data-type="Promise<void>" data-desc="A promise that resolves when the logout process is complete."></x-field>

### destroyMyself

Permanently deletes the currently authenticated user's account. This action is irreversible and should be used with extreme caution.

```javascript icon=logos:javascript
// This is a destructive action. Usually, you would confirm this with the user.
try {
  const result = await sdk.auth.destroyMyself();
  console.log(`Account ${result.did} has been permanently deleted.`);
} catch (error) {
  console.error('Failed to delete account:', error);
}
```

**Returns**

<x-field data-name="result" data-type="Promise<object>" data-desc="A promise that resolves to an object containing the DID of the deleted user.">
  <x-field data-name="did" data-type="string" data-desc="The DID of the deleted user."></x-field>
</x-field>
