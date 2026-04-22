# Overview

`@blocklet/meta` is a foundational library within the Blocklet ecosystem, serving as the definitive toolkit for managing blocklet metadata. It establishes the formal specification for the `blocklet.yml` manifest file and provides a comprehensive suite of utility functions to parse, validate, fix, and interact with this metadata programmatically.

At its core, the library ensures that every blocklet is described in a consistent, reliable, and machine-readable way. This standardization is what powers the entire Blocklet ecosystem, from the Blocklet Server that runs your application to the developer tools that help you build it.

The following diagram illustrates the core workflow within the Blocklet ecosystem:

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Overview](assets/diagram/overview-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

This documentation is divided into two main parts, mirroring the dual purpose of the library itself.

## The Blocklet Specification: `blocklet.yml`

The `blocklet.yml` file is the blueprint of a blocklet. It's a declarative manifest where you define every aspect of your application. The `@blocklet/meta` library contains the formal schema that validates this file, ensuring that the Blocklet platform can correctly install, configure, run, and manage your application. Key aspects you can define include:

- **Core Identity**: `name`, `version`, and the blocklet's unique Decentralized ID (`did`).
- **Presentation**: `title`, `description`, `logo`, and screenshots for display in app stores.
- **Execution Environment**: The runtime `engine` (e.g., Node.js), lifecycle `scripts` (like `pre-start`), and required `environments` variables.
- **Networking & Services**: Exposed web `interfaces`, internal services, and required ports.
- **Composition**: A list of other blocklets to be included as `components`, enabling modular application design.
- **User Interface**: `navigation` links to integrate with a dashboard and `theme` settings for visual consistency.
- **Monetization**: `payment` details for setting prices and revenue sharing.
- **Security**: Cryptographic `signatures` to verify the integrity and authorship of the metadata.

## The Utility Toolkit: Programmatic Access

Beyond just defining a specification, `@blocklet/meta` provides a rich set of JavaScript/TypeScript functions for developers to work with blocklet metadata and state. This toolkit is essential for building custom tooling, plugins, or complex applications that interact with the Blocklet ecosystem.

The utilities can be grouped into several key categories:

- **Parsing & Validation**: Functions like `parse` and `validateMeta` allow you to read a `blocklet.yml` file from the disk and verify its contents against the official schema.
- **Metadata Helpers**: A collection of functions to automatically fix common formatting issues, format person objects, resolve repository URLs, and more.
- **Component & State Utilities**: A powerful set of helpers (`forEachBlocklet`, `findComponent`, `getAppUrl`, etc.) for traversing the state of a running blocklet and its components, which is crucial for building admin dashboards and dynamic applications.
- **DID & Wallet Utilities**: Functions for handling Decentralized Identifiers (DIDs) and cryptographic wallets associated with a blocklet, such as `toBlockletDid` and `getBlockletWallet`.
- **Security**: Tools like `signResponse` and `verifyResponse` for signing and verifying data to ensure integrity and authenticity.

## What's Next?

<x-cards data-columns="3">
  <x-card data-title="Getting Started" data-href="/getting-started" data-icon="lucide:rocket">
    Install the library and parse your first `blocklet.yml` file in minutes.
  </x-card>
  <x-card data-title="Blocklet Specification (blocklet.yml)" data-href="/spec" data-icon="lucide:book-marked">
    Dive deep into the comprehensive reference for every field in the `blocklet.yml` manifest.
  </x-card>
  <x-card data-title="API Reference" data-href="/api" data-icon="lucide:code-2">
    Explore the detailed documentation for all the utility functions available in the library.
  </x-card>
</x-cards>