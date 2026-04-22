# API Reference

The `@blocklet/meta` library provides a comprehensive suite of utility functions for programmatically interacting with `blocklet.yml` metadata. These helpers streamline common tasks such as parsing, validation, data manipulation, and security operations. Whether you are building development tools, custom blocklet runtimes, or applications that interact with the Blocklet ecosystem, these APIs provide the necessary building blocks.

This section serves as a detailed reference for all exported functions, grouped by their core functionality. For a complete understanding of the metadata structure these functions operate on, please refer to the [Blocklet Specification (blocklet.yml)](./spec.md).

Explore the categories below to find the specific functions you need. Each section provides detailed explanations, parameters, and usage examples to help you get started quickly.

<x-cards data-columns="2">
  <x-card data-title="Parsing & Validation" data-icon="lucide:scan-line" data-href="/api/parsing-validation">
    Functions for reading, parsing, and validating `blocklet.yml` files. Includes `parse`, `validateMeta`, `fixAndValidateService`, and other validation helpers.
  </x-card>
  <x-card data-title="Metadata Helpers" data-icon="lucide:file-cog" data-href="/api/metadata-helpers">
    Utilities for fetching and processing blocklet metadata from remote URLs. Includes `getBlockletMetaByUrl` and `getSourceUrlsFromConfig`.
  </x-card>
  <x-card data-title="Component & State Utilities" data-icon="lucide:cuboid" data-href="/api/component-state-utilities">
    A collection of helper functions for working with blocklet state objects, such as traversing component trees, finding specific components, and extracting information.
  </x-card>
  <x-card data-title="DID & Wallet Utilities" data-icon="lucide:wallet" data-href="/api/did-wallet-utilities">
    Functions for handling DIDs and wallets within the blocklet context, including creating blocklet-specific DIDs, generating wallets, and extracting user information.
  </x-card>
  <x-card data-title="Security Utilities" data-icon="lucide:shield-check" data-href="/api/security-utilities">
    Functions for cryptographic operations, such as signing responses, verifying signatures, and managing multi-signature verification for metadata.
  </x-card>
  <x-card data-title="Navigation Utilities" data-icon="lucide:navigation" data-href="/api/navigation-utilities">
    Functions for parsing and processing the `navigation` property from a blocklet's metadata and state to build dynamic user interfaces.
  </x-card>
  <x-card data-title="URL & Path Utilities" data-icon="lucide:link" data-href="/api/url-path-utilities">
    Helpers for creating URL-friendly strings and validating URL paths, useful for generating clean and valid routes.
  </x-card>
  <x-card data-title="File Utilities" data-icon="lucide:files" data-href="/api/file-utilities">
    Low-level functions for reading, writing, and locating `blocklet.yml` files on the filesystem, and custom Joi extensions for file validation.
  </x-card>
  <x-card data-title="Miscellaneous Utilities" data-icon="lucide:box" data-href="/api/misc-utilities">
    A collection of other useful utilities, including communication channel helpers and identity icon (Blockies) generation.
  </x-card>
</x-cards>