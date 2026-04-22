# Core Metadata

Core metadata fields establish the fundamental identity of a Blocklet. They provide essential, at-a-glance information for identification, versioning, and discoverability within the Blocklet ecosystem. Every `blocklet.yml` file must define these foundational properties to be considered valid.

---

## Identity & Versioning

These fields uniquely identify your Blocklet and track its evolution.

### `did` (Decentralized Identifier)

The `did` is the globally unique and immutable identifier for the Blocklet. It serves as its primary key across the entire ArcBlock ecosystem, ensuring that every Blocklet can be securely and unambiguously referenced.

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true">
    <x-field-desc markdown>A valid Decentralized Identifier. The DID's type information must specify `RoleType.ROLE_BLOCKLET`.</x-field-desc>
  </x-field>
</x-field-group>

#### Validation Rules

The system validates that the provided DID is not just syntactically correct but also has the appropriate role type (`ROLE_BLOCKLET`), which is a critical security and integrity feature.

```yaml blocklet.yml icon=mdi:code-tags
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `name`

The `name` is a human-readable identifier for the Blocklet. While the `did` is the canonical identifier for machines, the `name` provides a convenient, memorable alias for developers and users. In legacy configurations, it was also used to derive the Blocklet's DID.

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>A unique name that follows [npm package naming conventions](https://www.npmjs.com/package/validate-npm-package-name) and does not exceed 32 characters.</x-field-desc>
  </x-field>
</x-field-group>

#### Relationship Between `name` and `did`

It's crucial to understand how `name` and `did` interact:

1.  **DID-First (Recommended)**: You provide a valid, pre-registered Blocklet DID. This is the modern and most robust approach.
2.  **Name-First (Legacy Support)**: If you provide a `name`, the system can derive a DID from it. For the metadata to be valid, the `did` field in your `blocklet.yml` **must** match the expected DID generated from the `name`. An inconsistency will result in a validation error.

```yaml blocklet.yml icon=mdi:code-tags
# This name is used for display and can be used to derive the DID
name: 'my-awesome-blocklet'

# This DID must be a valid Blocklet DID. If using the name-first approach,
# it must match the DID derived from 'my-awesome-blocklet'.
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `version`

The `version` field tracks the release version of the Blocklet, enabling proper dependency management and version control for users and other Blocklets.

<x-field-group>
  <x-field data-name="version" data-type="string" data-required="true">
    <x-field-desc markdown>The Blocklet version, which must adhere to the [Semantic Versioning 2.0.0](https://semver.org/) specification (e.g., `1.2.3`, `2.0.0-beta.1`).</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
version: '1.0.0'
```

### `specVersion`

This field specifies the version of the `blocklet.yml` specification that your metadata file adheres to. This allows Blocklet runtimes and tools to correctly parse and interpret the file's contents, ensuring forward compatibility.

<x-field-group>
  <x-field data-name="specVersion" data-type="string" data-required="false">
    <x-field-desc markdown>A valid SemVer string indicating the specification version, which must be `1.0.0` or greater.</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
specVersion: '1.2.0'
```

---

## Presentation & Classification

These fields define how your Blocklet is presented in user interfaces and how it's categorized.

### `title`

The `title` is a display-friendly name for the Blocklet. It is used in user interfaces such as the Blocklet Store, dashboards, and launchpads where a more descriptive or branded name is preferable to the short `name`.

<x-field-group>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown>A short, human-readable title. Its length is calculated with CJK character awareness and must not exceed a predefined limit (`MAX_TITLE_LENGTH`). For more details, see [cjk-length](https://www.npmjs.com/package/cjk-length).</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
title: 'My Awesome Blocklet'
```

### `description`

The `description` provides a concise summary of the Blocklet's purpose and functionality. It is heavily used in search results and UI previews to help users quickly understand what the Blocklet does.

<x-field-group>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>A brief summary of the Blocklet, between 3 and 160 characters long.</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
```

### `logo`

This field specifies the path or URL to the Blocklet's logo. The logo is used for branding in the Blocklet Store, on dashboards, and in other user interfaces.

<x-field-group>
  <x-field data-name="logo" data-type="string" data-required="false">
    <x-field-desc markdown>A relative path or an absolute HTTP(S) URL to the logo image. It should not point to the well-known logo path (`/.well-known/blocklet/logo`) used internally by the system.</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
# Using a relative path within the Blocklet bundle
logo: 'images/logo.png'

# Or using an absolute URL
# logo: 'https://cdn.example.com/blocklet-logo.svg'
```

### `group`

The `group` field categorizes the Blocklet, which helps with organization and discoverability in registries and marketplaces.

<x-field-group>
  <x-field data-name="group" data-type="string" data-required="false">
    <x-field-desc markdown>The category of the Blocklet. Must be one of the predefined values.</x-field-desc>
  </x-field>
</x-field-group>

Valid values for `group` include:

| Value       | Description                                                          |
|-------------|----------------------------------------------------------------------|
| `dapp`      | A decentralized application.                                         |
| `static`    | A static website or single-page application.                         |
| `service`   | A backend service or API.                                            |
| `component` | A reusable component designed to be composed within other Blocklets. |

```yaml blocklet.yml icon=mdi:code-tags
# Categorizes this Blocklet as a decentralized application.
group: 'dapp'
```

---

## Complete Example

Here is a snippet showing all the core metadata fields working together in a `blocklet.yml` file.

```yaml blocklet.yml icon=mdi:code-tags
name: 'data-visualizer'
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ # Corresponds to 'data-visualizer'
version: '1.2.0'
specVersion: '1.2.0'
title: 'Data Visualizer'
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
logo: 'images/logo.svg'
group: 'dapp'
```

Now that you understand the core identity of a Blocklet, the next section will cover how to specify its creators and maintainers.

<x-card data-title="Next: People & Ownership" data-icon="lucide:users" data-href="/spec/people-ownership" data-cta="Read More">
Learn how to specify the author, contributors, and maintainers of your Blocklet.
</x-card>