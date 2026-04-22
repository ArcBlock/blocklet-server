# File Utilities

This module provides a set of low-level functions for interacting with `blocklet.yml` files on the filesystem. It includes utilities for locating, reading, and writing metadata files, as well as custom [Joi](https://joi.dev/) extensions to streamline validation for file paths and DIDs.

## `blocklet.yml` File Handlers

These functions are the core building blocks for any tool that needs to programmatically read or modify a blocklet's metadata file.

### select(dir, options?)

The `select` function intelligently locates the correct `blocklet.yml` or `blocklet.yaml` file within a specified directory.

**Parameters**

<x-field-group>
  <x-field data-name="dir" data-type="string" data-required="true" data-desc="The absolute path to the directory where the blocklet metadata file is located."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Configuration options for the select function.">
    <x-field data-name="throwOnError" data-type="boolean" data-default="true" data-required="false" data-desc="If true, an error will be thrown if no metadata file is found. If false, it returns an empty string."></x-field>
  </x-field>
</x-field-group>

**Returns**

<x-field data-name="metaFilePath" data-type="string" data-desc="The full, absolute path to the found metadata file, or an empty string if not found and `throwOnError` is false."></x-field>

**Example**

```javascript Locating the metadata file icon=logos:javascript
import { select } from '@blocklet/meta';

const blockletDir = '/path/to/your/blocklet';

try {
  const metaFile = select(blockletDir);
  console.log(`Found metadata file at: ${metaFile}`);
} catch (error) {
  console.error(error.message); // e.g., 'blocklet.yml not found...'
}
```

### read(file)

Once you have the file path, the `read` function parses the YAML content into a JavaScript object.

**Parameters**

<x-field data-name="file" data-type="string" data-required="true" data-desc="The path to the blocklet.yml file to be read."></x-field>

**Returns**

<x-field data-name="meta" data-type="object" data-desc="The parsed content of the YAML file as a JavaScript object."></x-field>

**Example**

```javascript Reading the metadata file icon=logos:javascript
import { select, read } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
const meta = read(metaFile);
console.log(`Blocklet name: ${meta.name}`);
```

### update(file, meta, options?)

The `update` function serializes a metadata object back into a YAML file. By default, it cleans the metadata by removing properties that are only relevant at runtime (e.g., `path`, `stats`, `signatures`) before writing.

**Parameters**

<x-field-group>
  <x-field data-name="file" data-type="string" data-required="true" data-desc="The path to the blocklet.yml file to be updated."></x-field>
  <x-field data-name="meta" data-type="TBlockletMeta" data-required="true" data-desc="The metadata object to write to the file."></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="Configuration options for the update function.">
    <x-field data-name="fix" data-type="boolean" data-default="true" data-required="false" data-desc="If true, cleans the metadata object before writing (e.g., removes `path`, `stats`, `signatures`). If false, writes the object as-is."></x-field>
  </x-field>
</x-field-group>

**Returns**

This function does not return a value (`void`).

**Example**

```javascript Updating the metadata file icon=logos:javascript
import { select, read, update } from '@blocklet/meta';

const metaFile = select('/path/to/your/blocklet');
let meta = read(metaFile);

// Modify the description
meta.description = 'An updated description for my blocklet.';

// Write the changes back to the file with cleanup
update(metaFile, meta);
console.log('blocklet.yml has been updated.');
```

### list

A simple constant array that contains the potential names for the blocklet metadata file, which `select` uses internally.

**Example**

```javascript icon=logos:javascript
import { list } from '@blocklet/meta';

console.log(list); // Outputs: ['blocklet.yml', 'blocklet.yaml']
```

## Custom Joi Extensions

These extensions integrate with the Joi validation library to provide custom validation types for common Blocklet-related data, such as file paths and DIDs.

### fileExtension

Provides a custom `file()` type for Joi schemas, enabling powerful file-system-aware validations.

**Usage**

First, extend a Joi instance with the `fileExtension`. Then, you can use the `file()` type and its rules in your schemas.

```javascript Joi Schema with fileExtension icon=logos:javascript
import Joi from 'joi';
import path from 'path';
import { fileExtension } from '@blocklet/meta';

// Create a Joi instance extended with our custom types
const customJoi = Joi.extend(fileExtension);

const schema = customJoi.object({
  // Validates that 'logo.png' exists within the project directory
  logoPath: customJoi.file().exists({ baseDir: __dirname }),
});

const { error } = schema.validate({ logoPath: 'logo.png' });
if (error) {
  console.log(error.message); // e.g., 'file "logo.png" does not exist'
}
```

### didExtension

Provides a custom `DID()` type for Joi to validate ArcBlock Decentralized Identifiers.

**Usage**

Extend Joi with `didExtension` to add the `DID()` validation type.

```javascript Joi Schema with didExtension icon=logos:javascript
import Joi from 'joi';
import { didExtension } from '@blocklet/meta';

const customJoi = Joi.extend(didExtension);

const schema = customJoi.object({
  author: customJoi.DID().required(),
});

// Example with an invalid DID
const { error } = schema.validate({ author: 'z123...invalid_did' });
if (error) {
  console.log(error.message); // 'did "z123...invalid_did" is not valid'
}

// Example with a valid DID
const { value } = schema.validate({ author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' });
console.log(value); // { author: 'z8iZpbpJ4Yy2LzG1cqK9rC9pZ8r1Yq2Z3t4a' }
```

---

These file utilities form the foundation for many higher-level operations within the Blocklet ecosystem. For more advanced metadata handling, proceed to the [Parsing & Validation](./api-parsing-validation.md) documentation.
