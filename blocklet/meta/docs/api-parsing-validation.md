# Parsing & Validation

This section provides a detailed reference for the functions used to read, parse, and validate `blocklet.yml` files. These utilities are the programmatic interface for working with the [Blocklet Specification](./spec.md), ensuring that your blocklet's metadata is correct, complete, and ready for use by Blocklet Server and other tooling.

These functions are essential for building tools that interact with blocklets, validating configurations in CI/CD pipelines, or programmatically reading blocklet metadata.

## `parse`

The `parse` function is the primary utility for reading a blocklet's metadata from the filesystem. It locates the `blocklet.yml` (or `blocklet.yaml`) file in a given directory, reads its content, applies a series of compatibility fixes, and validates the final object against the official schema.

### Workflow

The parsing process follows several key steps to ensure a valid and consistent metadata object is produced. The following diagram illustrates this workflow:

<!-- DIAGRAM_IMAGE_START:flowchart:4:3 -->
![Parsing & Validation](assets/diagram/parsing-validation-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### Signature

```typescript
function parse(
  dir: string,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    extraRawAttrs?: any;
    schemaOptions?: any;
    defaultStoreUrl?: string | ((component: TComponent) => string);
    fix?: boolean;
  }
): TBlockletMeta;
```

### Parameters

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="The path to the blocklet directory containing the blocklet.yml file."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="An optional configuration object.">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="If true, verifies that files listed in the `logo` and `files` fields actually exist on the filesystem."></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="If true, requires the `dist` field to be present and valid in the metadata."></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="If true, ensures that any components sourced from a store have a `source.store` URL defined."></x-field>
    <x-field data-name="extraRawAttrs" data-type="object" data-desc="An object with extra attributes to be merged into the metadata before validation. Useful for augmenting metadata, for example in a registry."></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="Additional options to pass to the underlying Joi schema validator."></x-field>
    <x-field data-name="defaultStoreUrl" data-type="string | function" data-desc="A URL to be used as the default store for components that don't specify one. Can be a static string or a function that returns a string."></x-field>
    <x-field data-name="fix" data-type="boolean" data-default="true" data-desc="If true, applies automatic fixes to the metadata (e.g., for `person`, `repository`, `keywords`)."></x-field>
  </x-field>
</x-field-group>

### Returns

Returns a validated `TBlockletMeta` object. If the `blocklet.yml` file is not found, is invalid YAML, or fails schema validation, the function will throw an `Error` with a descriptive message.

### Example Usage

```javascript parse-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';

const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  const meta = parse(blockletDir, {
    ensureFiles: true, // Make sure the logo exists
  });
  console.log('Successfully parsed blocklet:', meta.name, meta.version);
} catch (error) {
  console.error('Failed to parse blocklet.yml:', error.message);
}
```

---

## `validateMeta`

Use `validateMeta` when you already have a blocklet metadata object (e.g., from a database or an API response) and need to validate it against the blocklet schema without reading from the filesystem.

### Signature

```typescript
function validateMeta(
  meta: any,
  options?: {
    ensureFiles?: boolean;
    ensureDist?: boolean;
    ensureComponentStore?: boolean;
    ensureName?: boolean;
    skipValidateDidName?: boolean;
    schemaOptions?: any;
  }
): TBlockletMeta;
```

### Parameters

<x-field-group>
  <x-field data-name="meta" data-type="any" data-required="true" data-desc="The raw blocklet metadata object to validate."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="An optional configuration object, similar to parse.">
    <x-field data-name="ensureFiles" data-type="boolean" data-default="false" data-desc="If true, verifies that files listed in the `logo` and `files` fields actually exist on the filesystem."></x-field>
    <x-field data-name="ensureDist" data-type="boolean" data-default="false" data-desc="If true, requires the `dist` field to be present and valid in the metadata."></x-field>
    <x-field data-name="ensureComponentStore" data-type="boolean" data-default="true" data-desc="If true, ensures that any components sourced from a store have a `source.store` URL defined."></x-field>
    <x-field data-name="ensureName" data-type="boolean" data-default="false" data-desc="If true, requires the `name` field to be present."></x-field>
    <x-field data-name="skipValidateDidName" data-type="boolean" data-default="false" data-desc="If true, and the blocklet name is in a DID format, it will skip the DID type validation."></x-field>
    <x-field data-name="schemaOptions" data-type="object" data-desc="Additional options to pass to the underlying Joi schema validator."></x-field>
  </x-field>
</x-field-group>

### Returns

Returns the validated and cleaned `TBlockletMeta` object. It throws an `Error` if the metadata object fails validation.

### Example Usage

```javascript validate-example.js icon=logos:javascript
import validateMeta from '@blocklet/meta/lib/validate';

const rawMeta = {
  name: 'my-first-blocklet',
  version: '1.0.0',
  description: 'A simple blocklet.',
  did: 'z8iZpA529j4Jk1iA...',
  // ... other properties
};

try {
  const validatedMeta = validateMeta(rawMeta, { ensureName: true });
  console.log('Metadata is valid:', validatedMeta.title);
} catch (error) {
  console.error('Invalid blocklet meta:', error.message);
}
```

---

## `fixAndValidateService`

This is a specialized helper function for validating the `services` configuration within each entry of the `interfaces` array in the metadata. The main `parse` and `validateMeta` functions call this internally, but it's exported for cases where you might need to process service configurations in isolation.

### Signature

```typescript
function fixAndValidateService(meta: TBlockletMeta): TBlockletMeta;
```

### Parameters

<x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="The blocklet metadata object containing the service configurations to validate."></x-field>

### Returns

Returns the input `TBlockletMeta` object with its service configurations validated and potentially modified with default values. It throws an `Error` if any service configuration is invalid.

### Example Usage

```javascript service-validate-example.js icon=logos:javascript
import { fixAndValidateService } from '@blocklet/meta/lib/validate';

const meta = {
  // ... other meta properties
  interfaces: [
    {
      type: 'web',
      name: 'publicUrl',
      path: '/',
      services: [
        {
          name: '@blocklet/service-auth',
          config: {
            // auth service config
          },
        },
      ],
    },
  ],
};

try {
  const metaWithValidatedServices = fixAndValidateService(meta);
  console.log('Service configuration is valid.');
} catch (error) {
  console.error('Invalid service config:', error.message);
}
```

---

## `validateBlockletEntry`

This utility function validates a blocklet's entry point (`main` property) to ensure it's correctly configured for its group type (`dapp` or `static`). For `dapp`s, it checks for the existence of required files or a valid `engine` configuration. For `static` blocklets, it ensures the `main` directory exists. This is a crucial check to perform after parsing to confirm a blocklet is executable.

### Signature

```typescript
function validateBlockletEntry(dir: string, meta: TBlockletMeta): void;
```

### Parameters

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="The root directory of the blocklet bundle."></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="The parsed and validated blocklet metadata object."></x-field>
</x-field-group>

### Returns

This function does not return a value. It will throw an `Error` if the entry point validation fails, with a message explaining the issue.

### Example Usage

```javascript entry-validate-example.js icon=logos:javascript
import path from 'path';
import parse from '@blocklet/meta/lib/parse';
import validateBlockletEntry from '@blocklet/meta/lib/entry';

const blockletDir = path.join(__dirname, 'my-dapp');

try {
  const meta = parse(blockletDir);
  validateBlockletEntry(blockletDir, meta);
  console.log('Blocklet entry point is valid.');
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

Now that you understand how to parse and validate metadata, you may want to explore helpers for fetching metadata from remote sources. Proceed to the [Metadata Helpers](./api-metadata-helpers.md) section to learn more.
