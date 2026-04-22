# Monetization

Blocklet developers can monetize their work through a built-in payment system powered by OCAP (Open Capability Access Protocol) and NFTs. When a user purchases a blocklet, they receive a unique NFT (a `BlockletPurchaseCredential`) that serves as proof of ownership. This entire process is defined within the `blocklet.yml` metadata, primarily through the `payment` object.

This section details the configuration fields that enable you to set prices, define revenue-sharing models, and understand how the underlying NFT factory works.

## The `payment` Object

The `payment` object is the central hub for all monetization configurations. It allows you to specify the price, how the revenue should be shared, and how much to charge when your blocklet is used as a component by other blocklets.

Here is the high-level structure of the `payment` object:

```yaml blocklet.yml
payment:
  price: []
  share: []
  componentPrice: []
```

### `payment.price`

This property defines the cost for a user to purchase the blocklet. The price is specified in a specific token. Currently, only a single token price is supported.

<x-field-group>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="The cost of the blocklet. Must be greater than 0."></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="The DID address of the token used for payment."></x-field>
</x-field-group>

```yaml Example: Setting a Price icon=mdi:currency-usd
# blocklet.yml
payment:
  price:
    - value: 10
      address: 'z2de...'
```

### `payment.share`

This property enables automatic revenue sharing. When a blocklet is purchased, the funds can be distributed among multiple beneficiaries according to predefined shares. This is useful for teams of developers or for paying royalties.

**Constraints:**
- A maximum of 4 beneficiaries can be specified.
- The sum of all `value` fields in the `share` array must equal `1` (representing 100%).

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="A human-readable name for the beneficiary (e.g., 'Lead Developer', 'Designer')."></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="The DID address of the beneficiary who will receive the funds."></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="The portion of the revenue this beneficiary receives. Must be a value between 0 and 1."></x-field>
</x-field-group>

```yaml Example: 70/30 Revenue Split icon=mdi:chart-pie
# blocklet.yml
payment:
  price:
    - value: 10
      address: 'z2de...'
  share:
    - name: 'Developer'
      address: 'z1dev...'
      value: 0.7
    - name: 'Designer'
      address: 'z1design...'
      value: 0.3
```

In this example, for every 10-token purchase, the developer receives 7 tokens and the designer receives 3 tokens automatically.

### `payment.componentPrice`

This property defines the pricing model for your blocklet when it is used as a component within another, larger blocklet. This allows you to earn revenue when your work is part of a bigger application.

<x-field-group>
  <x-field data-name="parentPriceRange" data-type="[number, number]" data-required="false" data-desc="Optional. A two-element array specifying the price range of the parent blocklet for this rule to apply. e.g., [0, 100] applies to parents costing up to 100."></x-field>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="The pricing type. Can be 'fixed' or 'percentage'."></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="The price value. For 'fixed', it's a specific amount. For 'percentage', it's a value between 0 and 1 (e.g., 0.1 for 10%)."></x-field>
</x-field-group>

```yaml Example: Component Pricing icon=mdi:puzzle-outline
# blocklet.yml
payment:
  componentPrice:
    # For parent blocklets priced between 0 and 50 tokens, charge a fixed fee of 5 tokens.
    - parentPriceRange: [0, 50]
      type: 'fixed'
      value: 5

    # For parent blocklets priced above 50 tokens, charge 10% of the parent's price.
    - parentPriceRange: [50.01, 99999]
      type: 'percentage'
      value: 0.1
```

## `nftFactory` Field

The `nftFactory` field holds the DID address of the OCAP NFT Factory responsible for minting the `BlockletPurchaseCredential` when a user buys your blocklet.

**Important:** You do not need to set this field manually. It is automatically generated and populated by the `blocklet publish` command when you publish your blocklet to a Blocklet Store. The store uses your `payment` configuration to create a unique, secure NFT factory and writes its address to this field in the final metadata.

## How the Payment Flow Works

Understanding the monetization flow helps clarify how these fields work together. The process is designed to be secure, transparent, and automated.

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Monetization](assets/diagram/monetization-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

This diagram illustrates the end-to-end process:

1.  The user initiates a purchase from a Blocklet Store.
2.  The store presents a transaction to the user's DID Wallet.
3.  Upon user approval, the wallet interacts with the `nftFactory` specified in the blocklet's metadata.
4.  The factory executes its `mint` function, which triggers the internal share contract.
5.  Funds are automatically distributed to the beneficiaries defined in the `payment.share` array.
6.  A purchase NFT is minted and sent to the user's wallet, serving as a perpetual receipt and license.
7.  The Blocklet Store verifies the NFT ownership and grants the user access to install and use the blocklet.

### Advanced: Composite Blocklet Payments

When a blocklet is composed of other paid components, the payment system ensures that all creators in the dependency chain are compensated fairly and securely. This is achieved through a `paymentIntegrity` hash and cross-store signatures.

Before publishing a composite blocklet, the developer's CLI tool analyzes the entire component tree, calculates the final revenue sharing contract, and generates a unique hash of this payment logic (`paymentIntegrity`). It then requests a cryptographic signature for this hash from every Blocklet Store that hosts a paid component in the tree. These signatures are bundled into the final NFT Factory, creating a tamper-proof chain of trust that guarantees the payment logic has been verified and approved by all participating stores.

```d2 Composite Blocklet Publish & Payment Integrity
shape: sequence_diagram

Developer-CLI: "Developer CLI"
Store-A: "Store A"
Store-B: "Store B"

Developer-CLI -> Developer-CLI: "1. Analyze composite blocklet & components"
Developer-CLI -> Store-A: "2. Fetch meta for Component A"
Store-A -> Developer-CLI: "3. Return meta"
Developer-CLI -> Store-B: "4. Fetch meta for Component B"
Store-B -> Developer-CLI: "5. Return meta"
Developer-CLI -> Developer-CLI: "6. Calculate final share contract & paymentIntegrity hash"
Developer-CLI -> Store-A: "7. Request signature for paymentIntegrity"
Store-A -> Store-A: "8. Verify integrity"
Store-A -> Developer-CLI: "9. Return signature"
Developer-CLI -> Store-B: "10. Request signature for paymentIntegrity"
Store-B -> Store-B: "11. Verify integrity"
Store-B -> Developer-CLI: "12. Return signature"
Developer-CLI -> Developer-CLI: "13. Bundle signatures into NFT Factory"
Developer-CLI -> Store-A: "14. Publish final composite blocklet metadata"

```

---

With monetization configured, the next step is to ensure your blocklet's metadata is secure and its resources are properly defined. Continue to the [Security & Resources](./spec-security-resources.md) section to learn about signing your metadata and managing bundled assets.