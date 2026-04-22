# 營利

Blocklet 開發者可以透過由 OCAP (Open Capability Access Protocol) 和 NFT 驅動的內建支付系統來將其工作營利。當使用者購買一個 blocklet 時，他們會收到一個獨特的 NFT（一個 `BlockletPurchaseCredential`），作為所有權的證明。整個過程在 `blocklet.yml` 元資料中定義，主要透過 `payment` 物件。

本節詳細介紹了讓您能夠設定價格、定義收益共享模型以及了解底層 NFT 工廠如何運作的設定欄位。

## `payment` 物件

`payment` 物件是所有營利設定的中心。它允許您指定價格、收益應如何共享，以及當您的 blocklet 被其他 blocklet 作為元件使用時要收取多少費用。

以下是 `payment` 物件的高階結構：

```yaml blocklet.yml
payment:
  price: []
  share: []
  componentPrice: []
```

### `payment.price`

此屬性定義使用者購買 blocklet 的成本。價格以特定的代幣指定。目前僅支援單一代幣價格。

<x-field-group>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="Blocklet 的成本。必須大於 0。"></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="用於支付的代幣的 DID 位址。"></x-field>
</x-field-group>

```yaml 範例：設定價格 icon=mdi:currency-usd
# blocklet.yml
payment:
  price:
    - value: 10
      address: 'z2de...'
```

### `payment.share`

此屬性啟用自動收益共享。當 blocklet 被購買時，資金可以根據預先定義的份額在多個受益人之間分配。這對於開發者團隊或支付版稅很有用。

**限制：**
- 最多可以指定 4 位受益人。
- `share` 陣列中所有 `value` 欄位的總和必須等於 `1`（代表 100%）。

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="受益人的人類可讀名稱（例如，「首席開發者」、「設計師」）。"></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="將接收資金的受益人的 DID 位址。"></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="該受益人收到的收益部分。必須是 0 到 1 之間的值。"></x-field>
</x-field-group>

```yaml 範例：70/30 收益分割 icon=mdi:chart-pie
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

在此範例中，每次 10 代幣的購買，開發者會自動收到 7 個代幣，設計師會收到 3 個代幣。

### `payment.componentPrice`

此屬性定義您的 blocklet 在被其他更大的 blocklet 作為元件使用時的定價模型。這讓您在您的工作成為更大應用程式的一部分時可以賺取收益。

<x-field-group>
  <x-field data-name="parentPriceRange" data-type="[number, number]" data-required="false" data-desc="選填。一個包含兩個元素的陣列，指定此規則適用的父 blocklet 的價格範圍。例如，[0, 100] 適用於成本最高為 100 的父級。"></x-field>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="定價類型。可以是「fixed」或「percentage」。"></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="價格值。對於「fixed」，它是一個特定金額。對於「percentage」，它是一個 0 到 1 之間的值（例如，0.1 代表 10%）。"></x-field>
</x-field-group>

```yaml 範例：元件定價 icon=mdi:puzzle-outline
# blocklet.yml
payment:
  componentPrice:
    # 對於價格在 0 到 50 代幣之間的父 blocklet，收取 5 代幣的固定費用。
    - parentPriceRange: [0, 50]
      type: 'fixed'
      value: 5

    # 對於價格高於 50 代幣的父 blocklet，收取父級價格的 10%。
    - parentPriceRange: [50.01, 99999]
      type: 'percentage'
      value: 0.1
```

## `nftFactory` 欄位

`nftFactory` 欄位持有負責在使用者購買您的 blocklet 時鑄造 `BlockletPurchaseCredential` 的 OCAP NFT Factory 的 DID 位址。

**重要：** 您不需要手動設定此欄位。當您將 blocklet 發布到 Blocklet Store 時，它會由 `blocklet publish` 命令自動產生和填入。商店會使用您的 `payment` 設定來建立一個獨特、安全的 NFT 工廠，並將其位址寫入最終元資料中的此欄位。

## 支付流程如何運作

了解營利流程有助於闡明這些欄位如何協同工作。此過程被設計為安全、透明且自動化。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Monetization](assets/diagram/monetization-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

此圖表說明了端到端的流程：

1.  使用者從 Blocklet Store 發起購買。
2.  商店向使用者的 DID Wallet 呈現一筆交易。
3.  使用者核准後，錢包會與 blocklet 元資料中指定的 `nftFactory` 互動。
4.  工廠執行其 `mint` 函數，這會觸發內部共享合約。
5.  資金會自動分配給 `payment.share` 陣列中定義的受益人。
6.  一個購買 NFT 會被鑄造並發送到使用者的錢包，作為永久的收據和授權。
7.  Blocklet Store 會驗證 NFT 的所有權，並授予使用者安裝和使用 blocklet 的權限。

### 進階：複合 Blocklet 支付

當一個 blocklet 由其他付費元件組成時，支付系統會確保依賴鏈中的所有創作者都得到公平且安全的補償。這是透過 `paymentIntegrity` 雜湊和跨商店簽名來實現的。

在發布複合 blocklet 之前，開發者的 CLI 工具會分析整個元件樹，計算最終的收益共享合約，並產生此支付邏輯的唯一雜湊（`paymentIntegrity`）。然後，它會向樹中託管付費元件的每個 Blocklet Store 請求此雜湊的加密簽名。這些簽名會被綑綁到最終的 NFT Factory 中，建立一個防竄改的信任鏈，保證支付邏輯已由所有參與的商店驗證和核准。

```d2 複合 Blocklet 發布與支付完整性
shape: sequence_diagram

Developer-CLI: "開發者 CLI"
Store-A: "商店 A"
Store-B: "商店 B"

Developer-CLI -> Developer-CLI: "1. 分析複合 blocklet 與元件"
Developer-CLI -> Store-A: "2. 取得元件 A 的元資料"
Store-A -> Developer-CLI: "3. 回傳元資料"
Developer-CLI -> Store-B: "4. 取得元件 B 的元資料"
Store-B -> Developer-CLI: "5. 回傳元資料"
Developer-CLI -> Developer-CLI: "6. 計算最終共享合約與 paymentIntegrity 雜湊"
Developer-CLI -> Store-A: "7. 請求 paymentIntegrity 的簽名"
Store-A -> Store-A: "8. 驗證完整性"
Store-A -> Developer-CLI: "9. 回傳簽名"
Developer-CLI -> Store-B: "10. 請求 paymentIntegrity 的簽名"
Store-B -> Store-B: "11. 驗證完整性"
Store-B -> Developer-CLI: "12. 回傳簽名"
Developer-CLI -> Developer-CLI: "13. 將簽名打包進 NFT Factory"
Developer-CLI -> Store-A: "14. 發布最終複合 blocklet 元資料"

```

---

設定好營利後，下一步是確保您的 blocklet 元資料是安全的，且其資源有被正確定義。請繼續閱讀 [安全與資源](./spec-security-resources.md) 章節，以了解如何簽署您的元資料和管理綑綁的資產。