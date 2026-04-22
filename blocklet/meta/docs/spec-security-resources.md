# Security & Resources

Security and resource management are crucial for creating trustworthy and interoperable Blocklets. The `blocklet.yml` specification provides two key fields for this purpose: `signatures` to ensure the integrity and authenticity of the metadata, and `resource` to define and bundle shared assets for composition with other Blocklets.

This section covers the specification for these fields and introduces the utility functions provided by `@blocklet/meta` to work with them.

## Signatures

The `signatures` field contains an array of digital signatures that create a verifiable chain of trust for the Blocklet's metadata. This mechanism prevents unauthorized modifications and confirms the identity of the publishers, such as the developer and the Blocklet Store. Each signature in the chain cryptographically signs the core metadata along with any subsequent signatures, ensuring that the entire history of modifications is tamper-proof.

### Multi-Signature Process Flow

The typical multi-signature workflow during the publishing process involves the developer signing the initial metadata, followed by the Blocklet Store verifying it, adding distribution information, and appending its own signature.

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Security & Resources](assets/diagram/security-resources-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

### Specification

The `signatures` field is an array of signature objects. Each object has the following structure:

```yaml blocklet.yml icon=lucide:shield-check
signatures:
  - type: 'ED25519'
    name: 'dev'
    signer: 'z8qa...'
    pk: 'z28n...'
    created: '2023-10-27T10:00:00.000Z'
    sig: 'z24e...'
    excludes: []
  - type: 'ED25519'
    name: 'store'
    signer: 'z8qR...'
    pk: 'z29c...'
    created: '2023-10-27T10:05:00.000Z'
    sig: 'z25a...'
    appended:
      - 'dist'
      - 'stats'
```

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="The cryptographic algorithm used for the signature (e.g., 'ED25519')."></x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="A human-readable name for the signature's role (e.g., 'dev', 'store')."></x-field>
  <x-field data-name="signer" data-type="string" data-required="true" data-desc="The DID of the entity that created the signature."></x-field>
  <x-field data-name="pk" data-type="string" data-required="true" data-desc="The public key corresponding to the signer's DID."></x-field>
  <x-field data-name="created" data-type="string" data-required="true" data-desc="The ISO 8601 timestamp when the signature was created."></x-field>
  <x-field data-name="sig" data-type="string" data-required="true" data-desc="The base58-encoded signature string."></x-field>
  <x-field data-name="excludes" data-type="string[]" data-required="false" data-desc="An array of top-level field names to exclude from the metadata before signing."></x-field>
  <x-field data-name="appended" data-type="string[]" data-required="false" data-desc="An array of top-level field names that were added to the metadata by this signer. This is used by the next signer to correctly verify the previous signature."></x-field>
  <x-field data-name="delegatee" data-type="string" data-required="false" data-desc="The DID of the delegatee if the signature was made through delegation."></x-field>
  <x-field data-name="delegateePk" data-type="string" data-required="false" data-desc="The public key of the delegatee."></x-field>
  <x-field data-name="delegation" data-type="string" data-required="false" data-desc="The delegation token (JWT) authorizing the `delegatee` to sign on behalf of the `signer`."></x-field>
</x-field-group>

## Resource Management

The `resource` field allows a Blocklet to declare shared data types it can export and to bundle resources from other Blocklets. This is fundamental to enabling a composable and interoperable ecosystem where Blocklets can share data and functionality seamlessly.

### Specification

```yaml blocklet.yml icon=lucide:boxes
resource:
  exportApi: '/api/resources'
  types:
    - type: 'posts'
      description: 'A collection of blog posts.'
    - type: 'images'
      description: 'A gallery of images.'
  bundles:
    - did: 'z2qa...'
      type: 'user-profiles'
      public: true
```

<x-field data-name="resource" data-type="object">
  <x-field-desc markdown>Contains properties for defining exportable types and bundled resources.</x-field-desc>
  <x-field data-name="exportApi" data-type="string" data-required="false" data-desc="A path to an API endpoint that other Blocklets can call to fetch exported resources."></x-field>
  <x-field data-name="types" data-type="object[]" data-required="false" data-desc="An array of resource types that this Blocklet can export. Limited to a maximum of 10 types.">
    <x-field data-name="type" data-type="string" data-required="true" data-desc="The unique identifier for the resource type (e.g., 'posts', 'products')."></x-field>
    <x-field data-name="description" data-type="string" data-required="false" data-desc="A human-readable description of the resource type."></x-field>
  </x-field>
  <x-field data-name="bundles" data-type="object[]" data-required="false" data-desc="An array of resource bundles imported from other Blocklets.">
    <x-field data-name="did" data-type="string" data-required="true" data-desc="The DID of the resource bundle to include."></x-field>
    <x-field data-name="type" data-type="string" data-required="true" data-desc="The specific resource type to bundle from the source."></x-field>
    <x-field data-name="public" data-type="boolean" data-required="false" data-desc="If `true`, indicates that the bundled resource is publicly accessible."></x-field>
  </x-field>
</x-field>

## Related API Utilities

The `@blocklet/meta` library provides a suite of functions to handle the security aspects of a Blocklet's metadata and communications. For full details, see the [Security Utilities API Reference](./api-security-utilities.md).

### Verifying Metadata Signatures

The `verifyMultiSig` function is the primary tool for ensuring the integrity of a `blocklet.yml` file. It processes the `signatures` array, verifying each signature in the chain to confirm that the metadata has not been tampered with and was signed by the declared entities.

```javascript verifyMultiSig Example icon=lucide:shield-check
import verifyMultiSig from '@blocklet/meta/lib/verify-multi-sig';
import { TBlockletMeta } from '@blocklet/meta/lib/types';

async function checkMetadata(meta: TBlockletMeta) {
  const isValid = await verifyMultiSig(meta);
  if (isValid) {
    console.log('Blocklet metadata is authentic and untampered.');
  } else {
    console.error('WARNING: Blocklet metadata verification failed!');
  }
}
```

### Signing and Verifying API Responses

For securing communications between Blocklets or between a Blocklet and a client, you can use the `signResponse` and `verifyResponse` functions. These helpers use a wallet object to cryptographically sign and verify any JSON-serializable data, ensuring data integrity and sender authenticity.

```javascript signResponse Example icon=lucide:pen-tool
import { signResponse, verifyResponse } from '@blocklet/meta/lib/security';
import { fromRandom } from '@ocap/wallet';

async function secureCommunicate() {
  const wallet = fromRandom(); // Your Blocklet's wallet
  const data = { message: 'hello world', timestamp: Date.now() };

  // Signing
  const signedData = signResponse(data, wallet);
  console.log('Signed Data:', signedData);

  // Verifying
  const isVerified = await verifyResponse(signedData, wallet);
  console.log('Verification result:', isVerified); // true
}
```