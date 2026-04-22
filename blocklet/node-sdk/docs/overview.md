# Overview

The Blocklet SDK (`@blocklet/sdk`) is the essential toolkit for building applications on the ArcBlock platform. It simplifies development by providing a comprehensive set of utilities, services, and middlewares that handle the core functionalities of a Blocklet, allowing you to focus on your application's unique features.

Whether you're building a simple static site, a complex web service, or a component that extends another application, the Blocklet SDK provides the necessary abstractions to interact seamlessly with the underlying Blocklet Server environment.

## Key Features

The SDK is designed to be powerful yet easy to use, offering a range of features to accelerate your development process.

<x-cards data-columns="2">
  <x-card data-title="Configuration & Environment" data-icon="lucide:settings">
    Easily access environment variables, application configuration, and information about other running components through a unified `env` object and `config` module.
  </x-card>
  <x-card data-title="Authentication & Authorization" data-icon="lucide:lock">
    Integrate decentralized identity with built-in support for DID Connect. Protect your routes with powerful session and authorization middlewares.
  </x-card>
  <x-card data-title="Service Clients" data-icon="lucide:server">
    Interact programmatically with the Blocklet Server. Use the `BlockletService` to manage users, roles, and permissions, or use the `NotificationService` to send messages.
  </x-card>
  <x-card data-title="Web Server Middlewares" data-icon="lucide:shield-check">
    A suite of ready-to-use Express.js middlewares for common tasks like CSRF protection, session management, sitemap generation, and SPA fallbacks.
  </x-card>
</x-cards>

## Core Modules

The Blocklet SDK is organized into several key modules, each serving a specific purpose:

*   **`BlockletService`**: A client for interacting with the Blocklet Server's API. It allows you to manage users, roles, permissions, access keys, and retrieve blocklet metadata.
*   **`config` & `env`**: Provides access to your blocklet's runtime configuration, including environment variables, component mount points, and application settings.
*   **`middlewares`**: A collection of Express.js middlewares for handling authentication (`auth`), sessions (`session`), CSRF protection (`csrf`), and more.
*   **`WalletAuthenticator` & `WalletHandlers`**: Core utilities for implementing DID Connect, enabling users to log in securely with their decentralized identities. For more details, you can also refer to the [DID Connect SDK documentation](https://www.arcblock.io/docs/did-connect-sdk/en/did-connect-sdk-overview).
*   **`getWallet`**: A utility function to retrieve the blocklet's wallet instance, which is essential for signing transactions or messages.
*   **`Security`**: Provides helper functions for data encryption, decryption, and signature verification, ensuring secure data handling within your application.

## Get Started

Ready to build your first Blocklet? Head over to our [Getting Started](./getting-started.md) guide for a step-by-step tutorial that will have you up and running in minutes.