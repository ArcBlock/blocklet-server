# Blocklet Specification (blocklet.yml)

The `blocklet.yml` file is the heart of every Blocklet. It's a YAML manifest that defines all the essential metadata about your application, serving as the single source of truth for the Blocklet Server and other tools in the ecosystem.

Think of it as the equivalent of `package.json` in the Node.js world, but expanded to encompass the full lifecycle and configuration of a decentralized application. It details everything from the Blocklet's identity and version to how it runs, what web interfaces it exposes, its dependencies on other Blocklets, and how it integrates with the user interface.

This specification is the definitive reference for every field available in `blocklet.yml`. Whether you are building a simple static website or a complex, multi-service application, a well-formed `blocklet.yml` is the first step to ensuring it runs correctly and predictably.

### Basic Example

Here is a minimal `blocklet.yml` file to illustrate its basic structure. Each field is explained in detail in the sections below.

```yaml blocklet.yml icon=logos:yaml
# Core identity of the Blocklet
did: z8iZpA63mBCy9j82Vf9aL3a8u9b5c7d9e1f2
name: my-awesome-blocklet
version: 1.0.0

# Human-readable metadata
title: My Awesome Blocklet
description: A simple Blocklet to demonstrate the core concepts.

# How the Blocklet is executed
main: api/index.js

# How the Blocklet is exposed to the web
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: '*'
    port: BLOCKLET_PORT
    protocol: http

# System requirements
requirements:
  server: ">=1.16.0"
  os: "*"
  cpu: "*"
```

### Specification Sections

The `blocklet.yml` specification is organized into logical groups of properties. Explore the sections below for a comprehensive guide to each field, its purpose, and valid values.

<x-cards data-columns="3">
  <x-card data-title="Core Metadata" data-href="/spec/core-metadata" data-icon="lucide:package">
    Fundamental properties like name, DID, version, and description that define your blocklet's identity.
  </x-card>
  <x-card data-title="People & Ownership" data-href="/spec/people-ownership" data-icon="lucide:users">
    Specify the author, contributors, and maintainers of the blocklet.
  </x-card>
  <x-card data-title="Distribution & Links" data-href="/spec/distribution-links" data-icon="lucide:link">
    Fields for the distribution package, source code repository, homepage, and documentation links.
  </x-card>
  <x-card data-title="Execution & Environment" data-href="/spec/execution-environment" data-icon="lucide:terminal">
    Configure the runtime engine, system requirements, environment variables, and lifecycle scripts.
  </x-card>
  <x-card data-title="Interfaces & Services" data-href="/spec/interfaces-services" data-icon="lucide:network">
    Define how your blocklet exposes web pages, APIs, and other endpoints to the outside world.
  </x-card>
  <x-card data-title="Composition (Components)" data-href="/spec/composition" data-icon="lucide:boxes">
    Build complex applications by composing your blocklet from other blocklets as components.
  </x-card>
  <x-card data-title="UI & Theming" data-href="/spec/ui-theming" data-icon="lucide:palette">
    Define navigation items and theme settings to integrate your blocklet's UI seamlessly.
  </x-card>
  <x-card data-title="Monetization" data-href="/spec/monetization" data-icon="lucide:dollar-sign">
    Configure pricing, revenue sharing, and NFT-based purchases for your blocklet.
  </x-card>
  <x-card data-title="Security & Resources" data-href="/spec/security-resources" data-icon="lucide:shield">
    Ensure metadata integrity with signatures and define shared assets using the resource field.
  </x-card>
</x-cards>

---

Now that you have an overview of the `blocklet.yml` structure, dive into the specific sections above to find the details you need. For programmatic interaction with this metadata, see the [API Reference](./api.md).