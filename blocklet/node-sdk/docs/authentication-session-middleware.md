# Session Middleware

The `session` middleware is a core component of the Blocklet SDK's authentication system. It acts as a gatekeeper for your Express.js routes, verifying the identity of the requester and, upon successful authentication, attaching a `SessionUser` object to the `req.user` property. This allows subsequent middleware and route handlers to access authenticated user information easily.

The middleware is highly flexible, supporting several authentication strategies out of the box, including login tokens from [DID Connect](./authentication-did-connect.md), programmatic access keys, and secure inter-component calls.

## How It Works

The session middleware inspects incoming requests for credentials in a specific order of priority. If a valid credential is found, it populates `req.user` and passes control to the next handler. If no valid credential is found, its behavior depends on whether `strictMode` is enabled.

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Session Middleware](assets/diagram/session-middleware-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

An additional security check is performed if the `enableBlacklist` feature is turned on in your blocklet's settings. Before validating a login token, the middleware will call a service API to ensure the token has not been revoked or blocked.

## Basic Usage

You can apply the `session` middleware to your entire application or to specific routes that require authentication.

```javascript Applying Session Middleware icon=logos:express
import express from 'express';
import session from '@blocklet/sdk/middlewares/session';

const app = express();

// Apply to all routes
app.use(session());

// Or apply to a specific route that must be protected
app.get('/api/profile', session({ strictMode: true }), (req, res) => {
  // In strict mode, if req.user is not present, the middleware would have already sent a 401 response.
  if (req.user) {
    res.json(req.user);
  }
});

// A public route that behaves differently for logged-in users
app.get('/api/info', session(), (req, res) => {
  if (req.user) {
    res.json({ message: `Hello, ${req.user.fullName}`});
  } else {
    // In non-strict mode, req.user is undefined for unauthenticated users
    res.json({ message: 'Hello, guest.' });
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
```

## Configuration Options

The `sessionMiddleware` function accepts an optional configuration object to tailor its behavior.

<x-field data-name="strictMode" data-type="boolean" data-default="false" data-desc="If `true`, an invalid or missing token results in a `401 Unauthorized` response. If `false`, it calls `next()` without a `user` object, treating the request as unauthenticated."></x-field>

<x-field data-name="loginToken" data-type="boolean" data-default="true" data-desc="Enables authentication via standard JWT login tokens, typically from DID Connect, found in the `login_token` cookie."></x-field>

<x-field data-name="accessKey" data-type="boolean" data-default="false" data-desc="Enables authentication via long-lived access keys (e.g., for CI/CD or scripts). These are also read from the `login_token` cookie."></x-field>

<x-field data-name="componentCall" data-type="boolean" data-default="false" data-desc="Enables authentication for secure, signed requests from other components, verified using headers like `x-component-sig`."></x-field>

<x-field data-name="signedToken" data-type="boolean" data-default="false" data-desc="Enables authentication via a temporary, signed JWT passed as a query parameter."></x-field>

<x-field data-name="signedTokenKey" data-type="string" data-default="__jwt" data-desc="The name of the query parameter used for `signedToken` authentication."></x-field>

### Example Configurations

<x-cards>
  <x-card data-title="Strict API Endpoint" data-icon="lucide:shield-check">
    For endpoints that must be protected, `strictMode` ensures unauthenticated requests are rejected immediately.

    ```javascript
    app.use('/api/admin', session({ strictMode: true }));
    ```
  </x-card>
  <x-card data-title="Enable Access Keys" data-icon="lucide:key-round">
    To allow programmatic access for scripts or services alongside user sessions, enable `accessKey` verification.

    ```javascript
    app.use('/api/data', session({ accessKey: true }));
    ```
  </x-card>
</x-cards>

## The SessionUser Object

When authentication is successful, the `req.user` object is populated with the following structure. This object provides essential information about the authenticated user or component.

<x-field data-name="user" data-type="object" data-desc="The SessionUser object attached to `req.user` upon successful authentication.">
  <x-field data-name="did" data-type="string" data-required="true" data-desc="The Decentralized Identifier (DID) of the user."></x-field>
  <x-field data-name="role" data-type="string" data-required="true" data-desc="The role assigned to the user (e.g., `owner`, `admin`, `guest`)."></x-field>
  <x-field data-name="provider" data-type="string" data-required="true" data-desc="The authentication provider used (e.g., `wallet`, `accessKey`)."></x-field>
  <x-field data-name="fullName" data-type="string" data-required="true" data-desc="The user's full name or a remark associated with the credential."></x-field>
  <x-field data-name="method" data-type="AuthMethod" data-required="true" data-desc="The specific authentication method used for this session (e.g., `loginToken`, `accessKey`, `componentCall`)."></x-field>
  <x-field data-name="walletOS" data-type="string" data-required="true" data-desc="The operating system of the wallet used, if applicable."></x-field>
  <x-field data-name="emailVerified" data-type="boolean" data-required="false" data-desc="Indicates if the user's email has been verified."></x-field>
  <x-field data-name="phoneVerified" data-type="boolean" data-required="false" data-desc="Indicates if the user's phone has been verified."></x-field>
</x-field>


Here is an example of what the `req.user` object might look like after a successful login:

```json Example req.user Object icon=lucide:user-check
{
  "did": "z8iZgeJjzB6Q1bK2rR1BfA2J8cNEJ8cNEJ8c",
  "role": "owner",
  "fullName": "Alice",
  "provider": "wallet",
  "walletOS": "ios",
  "emailVerified": true,
  "phoneVerified": false,
  "method": "loginToken"
}
```

## Next Steps

Once a user is authenticated with the `session` middleware, you can perform more granular access control based on their role and permissions. Proceed to the next section to learn how to use the [Authorization Middleware](./authentication-auth-middleware.md) to protect routes based on user roles.