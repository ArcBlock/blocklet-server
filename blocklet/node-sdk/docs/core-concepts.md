# Core Concepts

The Blocklet SDK is built upon a few fundamental concepts that form the backbone of any application you build. Understanding these core pillars—Configuration, Wallet Management, and Security—is essential for leveraging the full power of the SDK to create robust, secure, and scalable Blocklets.

This section provides a high-level overview of these key areas. The following diagram illustrates how these core components interact within a Blocklet Application:

<!-- DIAGRAM_IMAGE_START:intro:16:9 -->
![Core Concepts](assets/diagram/core-concepts-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

Each concept is detailed in its own dedicated sub-section, which you can navigate to below.

<x-cards data-columns="3">
  <x-card data-title="Configuration & Environment" data-icon="lucide:settings" data-href="/core-concepts/configuration">
    Learn how the SDK manages configuration, environment variables, and the component store through the `config` and `env` modules.
  </x-card>
  <x-card data-title="Wallet Management" data-icon="lucide:wallet" data-href="/core-concepts/wallet">
    Explore the `getWallet` utility for creating and managing wallet instances from environment variables, essential for signing and authentication.
  </x-card>
  <x-card data-title="Security Utilities" data-icon="lucide:shield" data-href="/core-concepts/security">
    Understand the built-in security features, including data encryption/decryption, response signing, and signature verification.
  </x-card>
</x-cards>

Mastering these concepts will enable you to build more complex and secure applications. We recommend you start with [Configuration & Environment](./core-concepts-configuration.md) to understand how your application interacts with its surroundings.