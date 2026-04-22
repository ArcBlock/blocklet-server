
# Security Utilities

The Blocklet SDK includes a robust set of security utilities designed to protect your application's data and communications. These tools help you handle sensitive information, ensure the integrity of API calls, and prevent common web vulnerabilities like Cross-Site Request Forgery (CSRF).

Before diving into signing and verification, it's essential to understand how wallets are managed, as they form the cryptographic foundation for these operations. You can learn more in the [Wallet Management](./core-concepts-wallet.md) section.

## Data Encryption & Decryption

For storing sensitive data at rest—such as API keys or personal user information in a database—the SDK provides simple symmetric encryption and decryption functions. These utilities use AES encryption and automatically derive a key from your blocklet's environment variables, simplifying key management.

- `encrypt(message)`: Encrypts a string.
- `decrypt(message)`: Decrypts an encrypted string.

The encryption key is derived from `process.env.BLOCKLET_APP_EK` (as the password) and `process.env.BLOCKLET_DID` (as the salt). Ensure these environment variables are available in your blocklet's runtime.

```javascript Encrypting Data icon=lucide:lock
import { encrypt } from '@blocklet/sdk/security';

const userApiKey = 'sk_live_verySecretValue12345';

// Encrypt the data before saving it to the database
const encryptedApiKey = encrypt(userApiKey);

console.log(encryptedApiKey);
// Output: A long encrypted string
```

To retrieve the original data, use the `decrypt` function.

```javascript Decrypting Data icon=lucide:key-round
import { decrypt } from '@blocklet/sdk/security';

// Assume 'encryptedApiKey' is fetched from your database
const encryptedApiKey = 'U2FsdGVkX1...'; // Example encrypted string

const originalApiKey = decrypt(encryptedApiKey);

console.log(originalApiKey);
// Output: sk_live_verySecretValue12345
```

## Request Signing & Verification

To ensure data integrity and authenticity between services, such as during [Component-to-Component Communication](./guides-component-communication.md), the SDK provides utilities to sign and verify data payloads. This process uses the blocklet's wallet to create a cryptographic signature that the receiving service can validate.

### High-Level Response Signing

The easiest way to secure an entire API response is with `signResponse` and `verifyResponse`. These functions handle the standard data structure for signed responses.

`signResponse(data)`: Takes a JSON object, wraps it in a standard format with a signature and timestamp, and returns the new signed object.

```javascript Signing an API Response icon=lucide:pen-tool
import { signResponse } from '@blocklet/sdk/security';
import express from 'express';

const app = express();

app.get('/api/data', (req, res) => {
  const data = { userId: '123', permissions: ['read'] };
  // signResponse adds signature, pk, and other metadata
  const signedPayload = signResponse(data);
  res.json(signedPayload);
});
```

`verifyResponse(data)`: Takes the signed payload and verifies its signature using the embedded public key.

```javascript Verifying a Signed Response icon=lucide:shield-check
import { verifyResponse } from '@blocklet/sdk/security';

async function fetchAndVerifyData() {
  const response = await fetch('/api/data');
  const signedPayload = await response.json();

  const isValid = verifyResponse(signedPayload);

  if (isValid) {
    console.log('Signature is valid. Data:', signedPayload.data);
  } else {
    console.error('Signature verification failed!');
  }
}
```

### Low-Level Signing

For scenarios requiring more control, such as signing a specific data payload without the wrapper structure provided by `signResponse`, you can use the lower-level `sign` and `verify` utilities. These functions are essential for custom signature implementations.

A key feature of these utilities is that they use a stable JSON stringification process. This ensures that the same data object will always produce the same string representation, which is critical for generating consistent and verifiable signatures.

```javascript Low-Level Signing and Verification icon=lucide:fingerprint
import { sign, verify } from '@blocklet/sdk/util/verify-sign';

// The data payload to be signed
const data = { transactionId: 'xyz-789', amount: 50, currency: 'USD' };

// 1. Generate a signature using the blocklet's wallet
const signature = sign(data);
console.log('Signature:', signature);

// 2. Verify the signature
// The public key is required for verification.
const publicKey = process.env.BLOCKLET_APP_PK;
const isVerified = verify(data, signature, { appPk: publicKey });

console.log('Is Verified:', isVerified);
// Output: Is Verified: true
```

To verify a signature, you must provide the original data, the signature string, and the public key (`appPk`) of the signer. In a real application, this public key would typically be retrieved from the request headers (e.g., `x-component-sig-pk`) sent by the calling service or from a trusted configuration source.

## CSRF Protection

Cross-Site Request Forgery (CSRF) is an attack that tricks a user into submitting a malicious request. The SDK's `csrf` middleware provides a robust and easy-to-use solution to mitigate this risk by implementing the Synchronizer Token Pattern.

It works by creating a unique, secret-based token for each user session and requiring that token to be present in any state-changing requests (like `POST`, `PUT`, `DELETE`).

### Basic Usage

To enable CSRF protection, add the `csrf` and `cookie-parser` middlewares to your Express application. The `cookie-parser` middleware is a prerequisite.

```javascript Basic CSRF Protection icon=lucide:shield
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrf } from '@blocklet/sdk/middlewares';

const app = express();

// The cookie-parser middleware is required for the csrf middleware to work
app.use(cookieParser());

// Apply the csrf middleware to all routes
app.use(csrf());

app.post('/api/update-profile', (req, res) => {
  res.json({ message: 'Profile updated successfully!' });
});

// ... your other routes
app.listen(3000);
```

#### How It Works

1.  **Token Generation**: For `GET` requests, the middleware automatically generates an `x-csrf-token` cookie based on the user's `login_token` cookie (which is typically set after a user logs in).
2.  **Token Verification**: For state-changing methods (`POST`, `PUT`, `PATCH`, `DELETE`), the middleware compares the value of the `x-csrf-token` cookie with the value of the `x-csrf-token` HTTP header. If they don't match, or if one is missing, the request is rejected with a 403 Forbidden error.
3.  **Frontend Implementation**: Your frontend application is responsible for reading the `x-csrf-token` cookie and sending its value in the `x-csrf-token` header for all state-changing API calls. Most modern HTTP clients (like Axios) can be configured to do this automatically.

### Advanced Usage

For more complex scenarios, you can customize the token generation and verification logic by passing an options object to the `csrf` middleware. This is useful if you need to handle tokens differently, such as storing them in the session or using custom request headers.

The example below demonstrates overriding the default behavior to:
1.  Generate a token based on a `userId` stored in the session.
2.  Pass the token to the frontend via `res.locals` instead of a cookie.
3.  Verify the token from a custom `x-custom-csrf-token` header.

```javascript Advanced CSRF Protection icon=lucide:shield-alert
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { csrf } from '@blocklet/sdk/middlewares';
import { sign, verify, getCsrfSecret } from '@blocklet/sdk/util/csrf';

const app = express();

app.use(cookieParser());
app.use(session({ secret: 'custom-session-secret', resave: false, saveUninitialized: true }));

// Advanced usage with custom token handling
app.use(csrf({
  // Custom logic to generate and provide the token
  generateToken: (req, res) => {
    if (req.session.userId) {
      const token = sign(getCsrfSecret(), req.session.userId);
      // Make the token available to the template engine
      res.locals.csrfToken = token;
    }
  },
  // Custom logic to verify the token from a custom header
  verifyToken: (req) => {
    const token = req.headers['x-custom-csrf-token'];
    const userId = req.session.userId;

    if (!token || !userId) {
      throw new Error('CSRF token or user session not found.');
    }

    if (!verify(getCsrfSecret(), token, userId)) {
      throw new Error('Invalid CSRF token.');
    }
  }
}));

// A route that renders a form with the custom token
app.get('/form', (req, res, next) => {
  // Simulate a user session for demonstration
  req.session.userId = `user_${Date.now()}`;
  
  // The generateToken function needs to be called to set the token
  // In a real app, this might be part of a broader middleware
  const generate = res.locals.generateToken;
  generate(req, res);

  res.send(`
    <h3>Advanced CSRF Example</h3>
    <form id="myForm">
      <input type="text" name="data" value="some-data">
      <button type="submit">Submit</button>
    </form>
    <script>
      const form = document.getElementById('myForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
          const response = await fetch('/submit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-custom-csrf-token': '${res.locals.csrfToken}'
            },
            body: JSON.stringify({ data: 'some-data' })
          });
          const result = await response.text();
          alert('Response: ' + result);
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    </script>
  `);
});

// A route that handles the submission
app.post('/submit', (req, res) => {
  // If we get here, the custom verifyToken logic passed.
  res.send('Form submitted successfully!');
});

// Error handler to catch and display CSRF errors
app.use((err, req, res, next) => {
  if (err.message.includes('CSRF')) {
    res.status(403).send(err.message);
  } else {
    next(err);
  }
});

app.listen(3000);
```

Now that you understand these core security concepts, you are better equipped to build secure and reliable applications. To see how these tools are used in practice, proceed to the [Authentication](./authentication.md) guides.

