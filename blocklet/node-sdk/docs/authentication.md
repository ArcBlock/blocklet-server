# Authentication

In modern web applications, robust authentication and authorization are critical for security and user management. The Blocklet SDK provides a comprehensive suite of tools to implement these features seamlessly, leveraging decentralized identity (DID) for a secure and user-centric experience.

This section provides an overview of the key components for managing user identity, sessions, and access control in your blocklet. You will learn how to integrate DID Connect for login, verify user sessions with powerful middleware, and protect your application's routes with fine-grained authorization rules.

The authentication and authorization flow typically follows these steps, as illustrated in the diagram below:

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Authentication](assets/diagram/authentication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

1.  **User Login**: The user initiates a login request via DID Connect.
2.  **Session Creation**: Upon successful authentication, a session is created and a token is issued to the user.
3.  **Session Verification**: For subsequent requests, the `sessionMiddleware` validates the user's token.
4.  **Access Control**: The `authMiddleware` checks if the authenticated user has the necessary roles or permissions to access the requested resource.
5.  **Resource Access**: If both session verification and authorization succeed, the user is granted access to the resource.

To implement these features, you will primarily work with three key modules. The following sub-documents provide detailed guides and API references for each of these components.

<x-cards data-columns="3">
  <x-card data-title="DID Connect" data-icon="lucide:key-round" data-href="/authentication/did-connect">
    Integrate decentralized identity for user login using WalletAuthenticator and WalletHandler.
  </x-card>
  <x-card data-title="Session Middleware" data-icon="lucide:shield-check" data-href="/authentication/session-middleware">
    Learn to use the session middleware to verify user sessions from login tokens, access keys, or secure component calls.
  </x-card>
  <x-card data-title="Authorization Middleware" data-icon="lucide:lock" data-href="/authentication/auth-middleware">
    Protect your application's routes by implementing role-based and permission-based access control.
  </x-card>
</x-cards>

By combining these tools, you can build a secure and flexible authentication and authorization system for your blocklet, ensuring that only authenticated and authorized users can access protected resources.

Proceed to the [DID Connect](./authentication-did-connect.md) guide to begin implementing user login.