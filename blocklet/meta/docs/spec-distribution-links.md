# Distribution & Links

This section covers the fields in `blocklet.yml` that define how your blocklet is packaged for distribution and provide essential links to its source code, homepage, documentation, and other resources. Properly configuring these fields is crucial for discoverability, user trust, and integration into the Blocklet ecosystem.

## Distribution Package (`dist`)

The `dist` object contains information about the blocklet's bundled package. This data is typically generated and added automatically by the `blocklet publish` command and is used by the Blocklet Store to download and verify the blocklet.

It ensures the integrity and authenticity of the blocklet package that users install.

### Schema

<x-field-group>
  <x-field data-name="dist" data-type="object" data-required="false" data-desc="Contains information about the blocklet's bundled package.">
    <x-field data-name="tarball" data-type="string" data-required="true" data-desc="The URL where the compressed blocklet bundle (.tar.gz) can be downloaded."></x-field>
    <x-field data-name="integrity" data-type="string" data-required="true" data-desc="A subresource integrity string (e.g., a SHA-512 hash) to verify the downloaded package's contents."></x-field>
    <x-field data-name="size" data-type="number" data-required="false" data-desc="The size of the tarball in bytes."></x-field>
  </x-field>
</x-field-group>

### Example

```yaml blocklet.yml icon=mdi:package-variant
# This field is usually auto-generated during the publish process
dist:
  tarball: https://store.blocklet.dev/uploads/z123abc.tar.gz
  integrity: sha512-Vbf...Q==
  size: 1234567
```

## Source Code Repository (`repository`)

The `repository` field specifies the location of your blocklet's source code. This is highly recommended as it allows users and contributors to review the code, report issues, and contribute.

You can provide a simple URL string or a more detailed object.

### Schema

<x-field data-name="repository" data-type="string | object" data-required="false" data-desc="Specifies the location of the blocklet's source code.">
  <x-field-desc markdown>Can be a simple URL string or an object with detailed properties. The system can often parse the type from a standard URL string.</x-field-desc>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="The version control system type (e.g., 'git', 'https', 'svn')."></x-field>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="The URL of the repository."></x-field>
  <x-field data-name="directory" data-type="string" data-required="false" data-desc="The path to the blocklet's package within a monorepo."></x-field>
</x-field>

### Example: Simple URL

If you provide a string, it will be automatically parsed to determine the repository type.

```yaml blocklet.yml icon=mdi:git
repository: https://github.com/arcblock/blocklet-spec.git
```

### Example: Object Format

Using the object format is useful for monorepos or when you need to be more explicit.

```yaml blocklet.yml icon=mdi:git
repository:
  type: git
  url: https://github.com/arcblock/blocklet-framework.git
  directory: packages/blocklet-spec
```

## Web Links & Support

These fields provide direct links to important external resources, enhancing user support and community engagement.

<x-field-group>
  <x-field data-name="homepage" data-type="string" data-required="false" data-desc="The official homepage or marketing page for the blocklet."></x-field>
  <x-field data-name="documentation" data-type="string" data-required="false" data-desc="A link to the blocklet's detailed documentation site."></x-field>
  <x-field data-name="community" data-type="string" data-required="false" data-desc="A link to a community forum, Discord server, or other discussion platforms."></x-field>
  <x-field data-name="support" data-type="string" data-required="false" data-desc="A URL or email address for users to get help."></x-field>
</x-field-group>

### Example

```yaml blocklet.yml icon=mdi:web
homepage: https://www.arcblock.io/
documentation: https://docs.arcblock.io/
community: https://community.arcblock.io/
support: support@arcblock.io
```

## Promotional Assets

These fields are used to showcase your blocklet in the Blocklet Store, providing users with a visual preview of its features and functionality.

<x-field-group>
  <x-field data-name="screenshots" data-type="string[]" data-required="false" data-desc="An array of URLs pointing to images that showcase the blocklet's UI or features."></x-field>
  <x-field data-name="videos" data-type="string[]" data-required="false">
    <x-field-desc markdown>An array of up to 3 URLs for promotional videos. Only YouTube and Vimeo links are supported.</x-field-desc>
  </x-field>
  <x-field data-name="logoUrl" data-type="string" data-required="false" data-desc="A direct URL to the blocklet's logo. This is often generated and uploaded by the publishing process."></x-field>
</x-field-group>

### Example

```yaml blocklet.yml icon=mdi:image-multiple
screenshots:
  - https://meta.blocklet.dev/screenshots/1.png
  - https://meta.blocklet.dev/screenshots/2.png
videos:
  - https://www.youtube.com/watch?v=xxxxxxxx
logoUrl: https://meta.blocklet.dev/logo.png
```

## Usage Statistics (`stats`)

The `stats` object contains usage metrics for the blocklet. Like the `dist` field, this is typically managed by the Blocklet Store and should not be set manually.

### Schema

<x-field-group>
  <x-field data-name="stats" data-type="object" data-required="false" data-desc="Contains usage metrics for the blocklet, managed by the Blocklet Store.">
    <x-field data-name="downloads" data-type="number" data-required="false" data-desc="The total number of times the blocklet has been downloaded."></x-field>
    <x-field data-name="star" data-type="number" data-default="0" data-required="false" data-desc="The number of stars or upvotes the blocklet has received."></x-field>
    <x-field data-name="purchases" data-type="number" data-default="0" data-required="false" data-desc="The number of times the blocklet has been purchased."></x-field>
  </x-field>
</x-field-group>

### Example

```yaml blocklet.yml icon=mdi:chart-bar
# This field is managed by the Blocklet Store
stats:
  downloads: 10500
  star: 250
  purchases: 120
```

---

With these fields configured, your blocklet is ready for distribution. The next step is to define how it runs.

<x-card data-title="Next: Execution & Environment" data-icon="lucide:terminal" data-cta="Read More" data-href="/spec/execution-environment">
Learn how to configure the blocklet's engine, runtime requirements, environment variables, and startup scripts.
</x-card>