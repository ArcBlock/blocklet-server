# Getting Started

This guide will walk you through the essential steps to install the Blocklet SDK and get a minimal application up and running. Our goal is to help you go from zero to a working example in just a few minutes.

## Prerequisites

Before you begin, ensure you have a Blocklet project set up. If you don't have one, please follow the [Blocklet Development Documentation](https://www.arcblock.io/docs/createblocklet/create-single-blocklet) to create one.

## Step 1: Install the SDK

Navigate to your Blocklet project's directory and add the `@blocklet/sdk` package as a dependency.

```bash Terminal icon=lucide:terminal
npm install @blocklet/sdk

# Or using yarn
yarn add @blocklet/sdk
```

## Step 2: Understand the Environment

The Blocklet SDK relies on environment variables that are automatically injected by the Blocklet Server when your application runs. These variables provide your application with context about its environment, such as its App ID, name, and secret keys.

The SDK includes a utility to verify that all necessary environment variables are present. While you typically don't need to set these manually, it's good to be aware of them.

Here are some of the key environment variables the SDK uses:

| Variable Name | Description |
| :--- | :--- |
| `BLOCKLET_APP_ID` | The unique identifier for your Blocklet. |
| `BLOCKLET_APP_SK` | The secret key for your Blocklet, used for signing requests. |
| `BLOCKLET_APP_NAME` | The name of your Blocklet. |
| `BLOCKLET_APP_URL` | The public URL of your Blocklet. |
| `BLOCKLET_DATA_DIR` | The directory where your Blocklet can store persistent data. |
| `ABT_NODE_DID` | The DID of the node where the Blocklet is running. |

For a more detailed look at configuration, see the [Configuration & Environment](./core-concepts-configuration.md) guide.

## Step 3: Create a Minimal Server

Now, let's create a simple Express.js server to see the SDK in action. Create a file named `app.js` (or your project's main entry point) and add the following code.

This example demonstrates how to:
1.  Import the `env` object from the SDK to access environment information.
2.  Set up a basic Express server.
3.  Create a root endpoint that returns the Blocklet's App Name.

```javascript app.js icon=logos:javascript
const express = require('express');
const { env } = require('@blocklet/sdk');

// A global error handler is a good practice for production applications.
process
  .on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err.message);
    process.exit(1);
  })
  .on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', (reason)?.message || reason);
    process.exit(1);
  });

const app = express();
const port = process.env.BLOCKLET_PORT || 3000;

app.get('/', (req, res) => {
  // The `env` object provides typed access to all Blocklet environment variables.
  res.send(`Hello from ${env.appName}!`);
});

app.listen(port, () => {
  console.log(`Blocklet listening on port ${port}`);
  console.log(`Visit your Blocklet at: ${env.appUrl}`);
});
```

## Step 4: Run Your Blocklet

With the server code in place, you can now run your Blocklet. Use the Blocklet CLI to start the development server:

```bash Terminal icon=lucide:terminal
blocklet dev
```

Once the server starts, you'll see a message with the URL to access your application. Open that URL in your browser, and you should see the message: `Hello from [Your Blocklet Name]!`

## Next Steps

Congratulations! You've successfully set up the Blocklet SDK and built a minimal application.

To continue learning, we recommend exploring the fundamental concepts that power the SDK.

<x-card data-title="Core Concepts" data-icon="lucide:graduation-cap" data-href="/core-concepts" data-cta="Read More">
Understand the fundamental concepts that power the Blocklet SDK, from configuration management to wallet handling and security.
</x-card>
