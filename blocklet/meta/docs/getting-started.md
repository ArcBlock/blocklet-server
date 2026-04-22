# Getting Started

This guide provides a quick introduction to using the `@blocklet/meta` library. You'll learn how to install the package and perform the most common task: parsing a `blocklet.yml` file to access its metadata within your application.

### Prerequisites

Before you begin, ensure you have:

1.  A Node.js development environment.
2.  A Blocklet project directory that contains a `blocklet.yml` file.

For this guide, let's assume you have a project directory named `my-blocklet` with the following `blocklet.yml` file inside:

```yaml title="my-blocklet/blocklet.yml" icon=mdi:language-yaml
name: my-awesome-blocklet
version: 0.1.0
title: My Awesome Blocklet
description: A simple blocklet to demonstrate parsing.
author: 'Jane Doe <jane.doe@example.com>'
```

### Step 1: Installation

Add the `@blocklet/meta` package to your project dependencies using either Yarn or npm.

```shell yarn
yarn add @blocklet/meta
```

Or with npm:

```shell npm
npm install @blocklet/meta
```

### Step 2: Parse Blocklet Metadata

The core function of the library is `parse`. It reads the `blocklet.yml` (or `blocklet.yaml`) from a given directory, validates its contents against the Blocklet Specification, applies necessary fixes (like standardizing person fields), and returns a clean JavaScript object.

Create a file named `index.js` next to your `my-blocklet` directory and add the following code:

```javascript title="index.js" icon=logos:javascript
const path = require('path');
const { parse } = require('@blocklet/meta');

// Define the path to your blocklet's root directory
const blockletDir = path.join(__dirname, 'my-blocklet');

try {
  // Parse the metadata
  const meta = parse(blockletDir);

  // Print the parsed metadata object
  console.log('Successfully parsed blocklet meta:', meta);
} catch (error) {
  console.error('Failed to parse blocklet.yml:', error.message);
}
```

When you run this script (`node index.js`), it will output the parsed metadata object.

### Expected Output

The `parse` function not only reads the YAML file but also camelCases the keys and formats complex fields like `author` into structured objects.

```json Output icon=mdi:code-json
{
  "name": "my-awesome-blocklet",
  "version": "0.1.0",
  "title": "My Awesome Blocklet",
  "description": "A simple blocklet to demonstrate parsing.",
  "author": {
    "name": "Jane Doe",
    "email": "jane.doe@example.com"
  },
  "specVersion": "1.0.0",
  "path": "/path/to/your/project/my-blocklet"
}
```

### What's Next?

You've successfully installed `@blocklet/meta` and parsed your first `blocklet.yml`. Now you can explore more advanced topics.

<x-cards>
  <x-card data-title="Blocklet Specification (blocklet.yml)" data-icon="lucide:file-text" data-href="/spec">
    Learn about all the available fields and their meanings to fully configure your blocklet's behavior and appearance.
  </x-card>
  <x-card data-title="API Reference" data-icon="lucide:book-open" data-href="/api">
    Dive into the full API documentation to discover other utilities for validation, file handling, and security.
  </x-card>
</x-cards>