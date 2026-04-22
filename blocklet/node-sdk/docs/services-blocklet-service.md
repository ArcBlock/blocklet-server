# Blocklet Service

The `BlockletService` is a powerful client that acts as the primary interface for your blocklet to interact with the underlying ABT Node services. It simplifies tasks like user management, session handling, role-based access control (RBAC), and retrieving blocklet metadata by wrapping complex GraphQL queries and HTTP requests into a clean, promise-based JavaScript API.

This service is essential for building secure and feature-rich applications that leverage the full power of the Blocklet platform. Before diving into this service, it's helpful to understand the concepts covered in our [Authentication](./authentication.md) guide.

### How It Works

The `BlockletService` client within your application communicates with the `blocklet-service` running on the ABT Node. All requests are automatically authenticated using the blocklet's credentials, ensuring secure access to core functionalities.

The following diagram illustrates the communication flow between your blocklet, the Blocklet Service API, and the core services on the ABT Node:

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Blocklet Service](assets/diagram/blocklet-service-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## Getting Started

To use the service, simply import and instantiate it. The client will automatically configure itself based on the environment variables provided by the Blocklet Server.

```javascript Getting Started icon=logos:javascript
import BlockletService from '@blocklet/sdk/service/blocklet';

const client = new BlockletService();

async function main() {
  const { user } = await client.getOwner();
  console.log('Blocklet owner:', user.fullName);
}

main();
```

## Session Management

### login

Authenticates a user and starts a session.

**Parameters**

<x-field data-name="params" data-type="object" data-required="true" data-desc="Login credentials or data."></x-field>

**Returns**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="An object containing the session and user info.">
  <x-field data-name="user" data-type="object" data-desc="The authenticated user's profile."></x-field>
  <x-field data-name="token" data-type="string" data-desc="The access token for the session."></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="The refresh token to extend the session."></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="A unique identifier for the visitor/device."></x-field>
</x-field>

### refreshSession

Refreshes an expired session using a refresh token.

**Parameters**

<x-field-group>
  <x-field data-name="refreshToken" data-type="string" data-required="true" data-desc="The refresh token from a previous session."></x-field>
  <x-field data-name="visitorId" data-type="string" data-required="false" data-desc="The unique identifier for the visitor/device."></x-field>
</x-field-group>

**Returns**

<x-field data-name="Promise<object>" data-type="Promise<object>" data-desc="An object containing the new session and user info.">
  <x-field data-name="user" data-type="object" data-desc="The authenticated user's profile."></x-field>
  <x-field data-name="token" data-type="string" data-desc="The new access token."></x-field>
  <x-field data-name="refreshToken" data-type="string" data-desc="The new refresh token."></x-field>
  <x-field data-name="provider" data-type="string" data-desc="The login provider (e.g., 'wallet')."></x-field>
</x-field>

### switchProfile

Updates a user's profile information.

**Parameters**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user to update."></x-field>
  <x-field data-name="profile" data-type="object" data-required="true" data-desc="An object with the profile fields to update.">
    <x-field data-name="avatar" data-type="string" data-required="false" data-desc="New avatar URL."></x-field>
    <x-field data-name="email" data-type="string" data-required="false" data-desc="New email address."></x-field>
    <x-field data-name="fullName" data-type="string" data-required="false" data-desc="New full name."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

## User Management

### getUser

Retrieves a single user's profile by their DID.

**Parameters**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The unique DID of the user to retrieve."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Optional configuration for the query.">
    <x-field data-name="enableConnectedAccount" data-type="boolean" data-required="false" data-desc="If true, includes details about the user's connected accounts (e.g., OAuth providers)."></x-field>
    <x-field data-name="includeTags" data-type="boolean" data-required="false" data-desc="If true, includes any tags associated with the user."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the user's profile.">
  <x-field data-name="user" data-type="object" data-desc="The user profile object."></x-field>
</x-field>

### getUsers

Retrieves a paginated list of users, with support for filtering and sorting.

**Parameters**

<x-field data-name="args" data-type="object" data-required="false" data-desc="An object containing query, sorting, and pagination options.">
  <x-field data-name="paging" data-type="object" data-desc="Pagination options.">
    <x-field data-name="page" data-type="number" data-desc="The page number to retrieve."></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="The number of users per page."></x-field>
  </x-field>
  <x-field data-name="query" data-type="object" data-desc="Filtering criteria.">
    <x-field data-name="role" data-type="string" data-desc="Filter by user role."></x-field>
    <x-field data-name="approved" data-type="boolean" data-desc="Filter by approval status."></x-field>
    <x-field data-name="search" data-type="string" data-desc="A search string to match against user fields."></x-field>
  </x-field>
  <x-field data-name="sort" data-type="object" data-desc="Sorting criteria.">
    <x-field data-name="updatedAt" data-type="number" data-desc="Sort by update timestamp. `1` for ascending, `-1` for descending."></x-field>
    <x-field data-name="createdAt" data-type="number" data-desc="Sort by creation timestamp. `1` for ascending, `-1` for descending."></x-field>
    <x-field data-name="lastLoginAt" data-type="number" data-desc="Sort by last login timestamp. `1` for ascending, `-1` for descending."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="A paginated list of user objects.">
  <x-field data-name="users" data-type="TUserInfo[]" data-desc="An array of user profile objects."></x-field>
  <x-field data-name="paging" data-type="object" data-desc="Pagination information.">
    <x-field data-name="total" data-type="number" data-desc="Total number of users."></x-field>
    <x-field data-name="pageSize" data-type="number" data-desc="Number of users per page."></x-field>
    <x-field data-name="page" data-type="number" data-desc="Current page number."></x-field>
  </x-field>
</x-field>

### getUsersCount

Gets the total number of users.

**Returns**

<x-field data-name="ResponseGetUsersCount" data-type="Promise<object>" data-desc="An object containing the total user count.">
  <x-field data-name="count" data-type="number" data-desc="The total number of users."></x-field>
</x-field>

### getUsersCountPerRole

Gets the count of users for each role.

**Returns**

<x-field data-name="ResponseGetUsersCountPerRole" data-type="Promise<object>" data-desc="An object containing user counts per role.">
  <x-field data-name="counts" data-type="TKeyValue[]" data-desc="An array of objects, where each object has a `key` (role name) and `value` (user count)."></x-field>
</x-field>

### getOwner

Retrieves the profile of the blocklet owner.

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the owner's user profile."></x-field>

### updateUserApproval

Approves or revokes a user's access to the blocklet.

**Parameters**

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user to update."></x-field>
  <x-field data-name="approved" data-type="boolean" data-required="true" data-desc="Set to `true` to approve, `false` to revoke."></x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### updateUserTags

Updates the tags associated with a user.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
  <x-field data-name="tags" data-type="number[]" data-required="true" data-desc="An array of tag IDs to associate with the user."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### updateUserExtra

Updates the extra metadata for a user.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="A remark or note about the user."></x-field>
  <x-field data-name="extra" data-type="string" data-required="false" data-desc="A JSON string for storing custom data."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### updateUserInfo

Updates a user's general information. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="userInfo" data-type="object" data-required="true" data-desc="An object with the user fields to update. Must include the user's `did`."></x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### updateUserAddress

Updates a user's physical address. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="An object with the user's DID and address details.">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
    <x-field data-name="address" data-type="object" data-required="false" data-desc="The user's address.">
      <x-field data-name="country" data-type="string" data-desc="Country"></x-field>
      <x-field data-name="province" data-type="string" data-desc="State/Province"></x-field>
      <x-field data-name="city" data-type="string" data-desc="City"></x-field>
      <x-field data-name="postalCode" data-type="string" data-desc="Postal Code"></x-field>
      <x-field data-name="line1" data-type="string" data-desc="Address line 1"></x-field>
      <x-field data-name="line2" data-type="string" data-desc="Address line 2"></x-field>
    </x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

## User Sessions

### getUserSessions

Retrieves a list of active sessions for a user.

**Parameters**

<x-field data-name="args" data-type="object" data-required="false" data-desc="An object containing query and pagination options.">
  <x-field data-name="paging" data-type="object" data-desc="Pagination options."></x-field>
  <x-field data-name="query" data-type="object" data-desc="Filtering criteria.">
    <x-field data-name="userDid" data-type="string" data-desc="Filter by user DID."></x-field>
    <x-field data-name="status" data-type="string" data-desc="Filter by session status."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUserSessions" data-type="Promise<object>" data-desc="A paginated list of user sessions.">
  <x-field data-name="list" data-type="TUserSession[]" data-desc="An array of session objects."></x-field>
  <x-field data-name="paging" data-type="object" data-desc="Pagination information."></x-field>
</x-field>

### getUserSessionsCount

Gets the total count of user sessions, with optional filtering.

**Parameters**

<x-field data-name="args" data-type="object" data-required="false" data-desc="An object containing query options.">
  <x-field data-name="query" data-type="object" data-desc="Filtering criteria.">
    <x-field data-name="userDid" data-type="string" data-desc="Filter by user DID."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUserSessionsCount" data-type="Promise<object>" data-desc="An object containing the session count.">
  <x-field data-name="count" data-type="number" data-desc="The total number of sessions."></x-field>
</x-field>

## Social & Community

### getUserFollowers

Retrieves a list of users who are following a specific user. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="Query options.">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user whose followers are to be retrieved."></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="Pagination options."></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="A paginated list of follower users."></x-field>

### getUserFollowing

Retrieves a list of users that a specific user is following. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="Query options.">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user whose following list is to be retrieved."></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="Pagination options."></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUserFollows" data-type="Promise<object>" data-desc="A paginated list of users being followed."></x-field>

### getUserFollowStats

Gets the number of followers and following for a user. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="Query options.">
    <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="An array of user DIDs."></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUserRelationCount" data-type="Promise<object>" data-desc="An object with follower and following counts."></x-field>

### checkFollowing

Checks if a user is following one or more other users.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="The DID of the potential follower."></x-field>
  <x-field data-name="userDids" data-type="string[]" data-required="true" data-desc="An array of user DIDs to check against."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseCheckFollowing" data-type="Promise<object>" data-desc="An object where keys are user DIDs and values are booleans indicating the follow status."></x-field>

### followUser

Makes one user follow another.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="The DID of the user who is following."></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user to be followed."></x-field>
</x-field>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### unfollowUser

Makes one user unfollow another.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="followerDid" data-type="string" data-required="true" data-desc="The DID of the user who is unfollowing."></x-field>
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user to be unfollowed."></x-field>
</x-field>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### getUserInvites

Retrieves a list of users invited by a specific user. Requires a valid user session cookie.

**Parameters**

<x-field-group>
  <x-field data-name="args" data-type="object" data-required="true" data-desc="Query options.">
    <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the inviter."></x-field>
    <x-field data-name="paging" data-type="object" data-required="false" data-desc="Pagination options."></x-field>
  </x-field>
  <x-field data-name="options" data-type="object" data-required="true" data-desc="Request options including headers.">
    <x-field data-name="headers" data-type="object" data-required="true">
      <x-field data-name="cookie" data-type="string" data-required="true" data-desc="The user's session cookie."></x-field>
    </x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseUsers" data-type="Promise<object>" data-desc="A paginated list of invited users."></x-field>

## Tag Management

### getTags

Retrieves a list of all available user tags.

**Parameters**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="Pagination options."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseTags" data-type="Promise<object>" data-desc="A paginated list of tag objects.">
  <x-field data-name="tags" data-type="TTag[]" data-desc="An array of tag objects."></x-field>
  <x-field data-name="paging" data-type="object" data-desc="Pagination information."></x-field>
</x-field>

### createTag

Creates a new user tag.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="title" data-type="string" data-required="true" data-desc="The title of the tag."></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="A description for the tag."></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="A hex color code for the tag."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="An object containing the newly created tag."></x-field>

### updateTag

Updates an existing user tag.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="The ID of the tag to update."></x-field>
    <x-field data-name="title" data-type="string" data-required="false" data-desc="The new title."></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="The new description."></x-field>
    <x-field data-name="color" data-type="string" data-required="false" data-desc="The new color."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="An object containing the updated tag."></x-field>

### deleteTag

Deletes a user tag.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="tag" data-type="object" data-required="true">
    <x-field data-name="id" data-type="number" data-required="true" data-desc="The ID of the tag to delete."></x-field>
  </x-field>
</x-field>

**Returns**

<x-field data-name="ResponseTag" data-type="Promise<object>" data-desc="An object containing the deleted tag."></x-field>

## Role-Based Access Control (RBAC)

### getRoles

Retrieves a list of all available roles.

**Returns**

<x-field data-name="ResponseRoles" data-type="Promise<object>" data-desc="An object containing a list of roles.">
  <x-field data-name="roles" data-type="TRole[]" data-desc="An array of role objects."></x-field>
</x-field>

### getRole

Retrieves a single role by its name.

**Parameters**

<x-field data-name="name" data-type="string" data-required="true" data-desc="The unique name of the role."></x-field>

**Returns**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="An object containing the role details."></x-field>

### createRole

Creates a new role.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="A unique identifier for the role (e.g., `editor`)."></x-field>
  <x-field data-name="title" data-type="string" data-required="true" data-desc="A human-readable title (e.g., `Content Editor`)."></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="A brief description of the role's purpose."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="An object containing the newly created role."></x-field>

### updateRole

Updates an existing role.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the role to update."></x-field>
  <x-field data-name="updates" data-type="object" data-required="true" data-desc="An object with the fields to update.">
    <x-field data-name="title" data-type="string" data-required="false" data-desc="The new title."></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="The new description."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="An object containing the updated role."></x-field>

### deleteRole

Deletes a role.

**Parameters**

<x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the role to delete."></x-field>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### getPermissions

Retrieves a list of all available permissions.

**Returns**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="An object containing a list of permissions.">
  <x-field data-name="permissions" data-type="TPermission[]" data-desc="An array of permission objects."></x-field>
</x-field>

### getPermissionsByRole

Retrieves all permissions granted to a specific role.

**Parameters**

<x-field data-name="role" data-type="string" data-required="true" data-desc="The name of the role."></x-field>

**Returns**

<x-field data-name="ResponsePermissions" data-type="Promise<object>" data-desc="An object containing the list of permissions for the role."></x-field>

### createPermission

Creates a new permission.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="name" data-type="string" data-required="true" data-desc="A unique name for the permission (e.g., `post:create`)."></x-field>
  <x-field data-name="description" data-type="string" data-required="false" data-desc="A description of what the permission allows."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="An object containing the newly created permission."></x-field>

### updatePermission

Updates an existing permission.

**Parameters**

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the permission to update."></x-field>
  <x-field data-name="updates" data-type="object" data-required="true">
    <x-field data-name="description" data-type="string" data-required="false" data-desc="The new description for the permission."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponsePermission" data-type="Promise<object>" data-desc="An object containing the updated permission."></x-field>

### deletePermission

Deletes a permission.

**Parameters**

<x-field data-name="name" data-type="string" data-required="true" data-desc="The name of the permission to delete."></x-field>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### grantPermissionForRole

Assigns a permission to a role.

**Parameters**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The name of the role."></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="The name of the permission to grant."></x-field>
</x-field-group>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### revokePermissionFromRole

Revokes a permission from a role.

**Parameters**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The name of the role."></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="The name of the permission to revoke."></x-field>
</x-field-group>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

### updatePermissionsForRole

Replaces all existing permissions for a role with a new set.

**Parameters**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The name of the role."></x-field>
  <x-field data-name="permissions" data-type="string[]" data-required="true" data-desc="An array of permission names to set for the role."></x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseRole" data-type="Promise<object>" data-desc="An object containing the updated role."></x-field>

### hasPermission

Checks if a role has a specific permission.

**Parameters**

<x-field-group>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The name of the role to check."></x-field>
  <x-field data-name="permission" data-type="string" data-required="true" data-desc="The name of the permission to verify."></x-field>
</x-field-group>

**Returns**

<x-field data-name="BooleanResponse" data-type="Promise<object>" data-desc="An object with a boolean `result` property.">
  <x-field data-name="result" data-type="boolean" data-desc="`true` if the role has the permission, otherwise `false`."></x-field>
</x-field>

## Passport Management

### issuePassportToUser

Issues a new passport to a user, assigning them a role.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user receiving the passport."></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The role to assign with this passport."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile, including the new passport."></x-field>

### enableUserPassport

Enables a previously revoked passport for a user.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="The ID of the passport to enable."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### revokeUserPassport

Revokes a user's passport.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="The ID of the passport to revoke."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseUser" data-type="Promise<object>" data-desc="An object containing the updated user profile."></x-field>

### removeUserPassport

Permanently removes a user's passport.

**Parameters**

<x-field data-name="args" data-type="object" data-required="true">
  <x-field data-name="userDid" data-type="string" data-required="true" data-desc="The DID of the user."></x-field>
  <x-field data-name="passportId" data-type="string" data-required="true" data-desc="The ID of the passport to remove."></x-field>
</x-field>

**Returns**

<x-field data-name="GeneralResponse" data-type="Promise<object>" data-desc="A general response object indicating success or failure."></x-field>

## Blocklet & Component Info

### getBlocklet

Retrieves the metadata and state for the current blocklet.

**Parameters**

<x-field-group>
  <x-field data-name="attachRuntimeInfo" data-type="boolean" data-default="false" data-required="false" data-desc="If `true`, includes runtime information like CPU and memory usage."></x-field>
  <x-field data-name="useCache" data-type="boolean" data-default="true" data-required="false" data-desc="If `false`, bypasses the cache to fetch the latest data."></x-field>
</x-field-group>

**Returns**

<x-field data-name="ResponseBlocklet" data-type="Promise<object>" data-desc="An object containing the blocklet's state and metadata."></x-field>

### getComponent

Retrieves the state of a specific component within the current blocklet by its DID.

**Parameters**

<x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the component to retrieve."></x-field>

**Returns**

<x-field data-name="ComponentState" data-type="Promise<object>" data-desc="An object containing the component's state and metadata."></x-field>

### getTrustedDomains

Retrieves a list of trusted domains for federated login.

**Returns**

<x-field data-name="string[]" data-type="Promise<string[]>" data-desc="An array of trusted domain URLs."></x-field>

### getVault

Retrieves and verifies the blocklet's vault information.

**Returns**

<x-field data-name="vault" data-type="Promise<string>" data-desc="The vault string if verification is successful."></x-field>

### clearCache

Clears cached data on the node based on a pattern.

**Parameters**

<x-field data-name="args" data-type="object" data-required="false">
  <x-field data-name="pattern" data-type="string" data-required="false" data-desc="A pattern to match cache keys for removal."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseClearCache" data-type="Promise<object>" data-desc="An object containing a list of removed cache keys.">
  <x-field data-name="removed" data-type="string[]" data-desc="An array of keys that were removed from the cache."></x-field>
</x-field>

## Access Key Management

### createAccessKey

Creates a new access key for programmatic access.

**Parameters**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="remark" data-type="string" data-required="false" data-desc="A description for the access key."></x-field>
  <x-field data-name="passport" data-type="string" data-required="false" data-desc="The role/passport to associate with the key. Defaults to 'guest'."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseCreateAccessKey" data-type="Promise<object>" data-desc="An object containing the newly created access key and secret."></x-field>

### getAccessKey

Retrieves details for a single access key.

**Parameters**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="The ID of the access key to retrieve."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="An object containing the access key details."></x-field>

### getAccessKeys

Retrieves a list of access keys.

**Parameters**

<x-field data-name="params" data-type="object" data-required="false">
  <x-field data-name="paging" data-type="object" data-required="false" data-desc="Pagination options."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseAccessKeys" data-type="Promise<object>" data-desc="A paginated list of access key objects."></x-field>

### verifyAccessKey

Verifies if an access key is valid.

**Parameters**

<x-field data-name="params" data-type="object" data-required="true">
  <x-field data-name="accessKeyId" data-type="string" data-required="true" data-desc="The ID of the access key to verify."></x-field>
</x-field>

**Returns**

<x-field data-name="ResponseAccessKey" data-type="Promise<object>" data-desc="An object containing the access key details if valid."></x-field>

---

After mastering the `BlockletService`, you might want to explore how to send messages to your users. Head over to the [Notification Service](./services-notification-service.md) guide to learn more.
