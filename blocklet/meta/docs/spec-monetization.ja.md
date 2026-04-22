# 収益化

Blocklet 開発者は、OCAP (Open Capability Access Protocol) と NFT を利用した組み込みの支払いシステムを通じて、自身の作品を収益化できます。ユーザーが Blocklet を購入すると、所有権の証明として一意の NFT (`BlockletPurchaseCredential`) を受け取ります。このプロセス全体は、主に `payment` オブジェクトを通じて `blocklet.yml` メタデータ内で定義されます。

このセクションでは、価格の設定、収益分配モデルの定義、および基盤となる NFT ファクトリの仕組みを理解するための設定フィールドについて詳しく説明します。

## `payment` オブジェクト

`payment` オブジェクトは、すべての収益化設定の中心的なハブです。これにより、価格、収益の分配方法、およびあなたの Blocklet が他の Blocklet のコンポーネントとして使用された場合の請求額を指定できます。

以下は `payment` オブジェクトの全体的な構造です。

```yaml blocklet.yml
payment:
  price: []
  share: []
  componentPrice: []
```

### `payment.price`

このプロパティは、ユーザーが Blocklet を購入するためのコストを定義します。価格は特定のトークンで指定されます。現在、単一のトークン価格のみがサポートされています。

<x-field-group>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="Blocklet のコスト。0より大きい必要があります。"></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="支払いに使用されるトークンの DID アドレス。"></x-field>
</x-field-group>

```yaml 例: 価格の設定 icon=mdi:currency-usd
# blocklet.yml
payment:
  price:
    - value: 10
      address: 'z2de...'
```

### `payment.share`

このプロパティは、自動的な収益分配を可能にします。Blocklet が購入されると、資金は事前に定義されたシェアに従って複数の受益者に分配されます。これは、開発者チームやロイヤリティの支払いに役立ちます。

**制約:**
- 最大4人の受益者を指定できます。
- `share` 配列内のすべての `value` フィールドの合計は `1` (100%を表す) に等しくなければなりません。

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="受益者の人間が読める名前 (例: 'Lead Developer', 'Designer')。"></x-field>
  <x-field data-name="address" data-type="string" data-required="true" data-desc="資金を受け取る受益者の DID アドレス。"></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="この受益者が受け取る収益の割合。0から1の間の値でなければなりません。"></x-field>
</x-field-group>

```yaml 例: 70/30 の収益分割 icon=mdi:chart-pie
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

この例では、10トークンの購入ごとに、開発者は7トークン、デザイナーは3トークンを自動的に受け取ります。

### `payment.componentPrice`

このプロパティは、あなたの Blocklet が別のより大きな Blocklet 内のコンポーネントとして使用される場合の価格設定モデルを定義します。これにより、あなたの作品がより大きなアプリケーションの一部である場合に収益を得ることができます。

<x-field-group>
  <x-field data-name="parentPriceRange" data-type="[number, number]" data-required="false" data-desc="オプション。このルールを適用する親 Blocklet の価格範囲を指定する2要素の配列。例: [0, 100] は最大100コストの親に適用されます。"></x-field>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="価格設定タイプ。「fixed」または「percentage」が可能です。"></x-field>
  <x-field data-name="value" data-type="number" data-required="true" data-desc="価格の値。「fixed」の場合は特定の金額。「percentage」の場合は0から1の間の値 (例: 10%の場合は0.1)。"></x-field>
</x-field-group>

```yaml 例: コンポーネント価格設定 icon=mdi:puzzle-outline
# blocklet.yml
payment:
  componentPrice:
    # 0から50トークンの価格の親 Blocklet には、5トークンの固定料金を請求します。
    - parentPriceRange: [0, 50]
      type: 'fixed'
      value: 5

    # 50トークンを超える価格の親 Blocklet には、親の価格の10%を請求します。
    - parentPriceRange: [50.01, 99999]
      type: 'percentage'
      value: 0.1
```

## `nftFactory` フィールド

`nftFactory` フィールドには、ユーザーがあなたの Blocklet を購入したときに `BlockletPurchaseCredential` をミントする責任を持つ OCAP NFT ファクトリの DID アドレスが保持されます。

**重要:** このフィールドを手動で設定する必要はありません。これは、Blocklet を Blocklet Store に公開する際に `blocklet publish` コマンドによって自動的に生成され、入力されます。ストアはあなたの `payment` 設定を使用して、一意で安全な NFT ファクトリを作成し、そのアドレスを最終的なメタデータのこのフィールドに書き込みます。

## 支払いフローの仕組み

収益化フローを理解することは、これらのフィールドがどのように連携して機能するかを明確にするのに役立ちます。このプロセスは、安全で、透明性があり、自動化されるように設計されています。

<!-- DIAGRAM_IMAGE_START:sequence:4:3 -->
![Monetization](assets/diagram/monetization-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

この図は、エンドツーエンドのプロセスを示しています。

1.  ユーザーは Blocklet Store から購入を開始します。
2.  ストアはユーザーの DID Wallet にトランザクションを提示します。
3.  ユーザーの承認後、ウォレットは Blocklet のメタデータで指定された `nftFactory` と対話します。
4.  ファクトリは `mint` 関数を実行し、内部の共有コントラクトをトリガーします。
5.  資金は `payment.share` 配列で定義された受益者に自動的に分配されます。
6.  購入 NFT がミントされ、ユーザーのウォレットに送信されます。これは永久的な領収書およびライセンスとして機能します。
7.  Blocklet Store は NFT の所有権を確認し、ユーザーに Blocklet のインストールと使用へのアクセスを許可します。

### 上級: 複合 Blocklet の支払い

Blocklet が他の有料コンポーネントで構成されている場合、支払いシステムは依存関係チェーン内のすべての作成者が公正かつ安全に補償されることを保証します。これは `paymentIntegrity` ハッシュとクロスストア署名を通じて実現されます。

複合 Blocklet を公開する前に、開発者の CLI ツールはコンポーネントツリー全体を分析し、最終的な収益分配契約を計算し、この支払いロジックの一意のハッシュ (`paymentIntegrity`) を生成します。次に、ツリー内の有料コンポーネントをホストするすべての Blocklet Store からこのハッシュに対する暗号署名を要求します。これらの署名は最終的な NFT ファクトリにバンドルされ、支払いロジックがすべての参加ストアによって検証および承認されたことを保証する、改ざん防止の信頼の連鎖を作成します。

```d2 複合 Blocklet の公開と支払いの整合性
shape: sequence_diagram

Developer-CLI: "開発者 CLI"
Store-A: "ストア A"
Store-B: "ストア B"

Developer-CLI -> Developer-CLI: "1. 複合 Blocklet とコンポーネントを分析"
Developer-CLI -> Store-A: "2. コンポーネント A のメタデータを取得"
Store-A -> Developer-CLI: "3. メタデータを返す"
Developer-CLI -> Store-B: "4. コンポーネント B のメタデータを取得"
Store-B -> Developer-CLI: "5. メタデータを返す"
Developer-CLI -> Developer-CLI: "6. 最終的な共有契約と paymentIntegrity ハッシュを計算"
Developer-CLI -> Store-A: "7. paymentIntegrity の署名を要求"
Store-A -> Store-A: "8. 整合性を検証"
Store-A -> Developer-CLI: "9. 署名を返す"
Developer-CLI -> Store-B: "10. paymentIntegrity の署名を要求"
Store-B -> Store-B: "11. 整合性を検証"
Store-B -> Developer-CLI: "12. 署名を返す"
Developer-CLI -> Developer-CLI: "13. 署名を NFT Factory にバンドル"
Developer-CLI -> Store-A: "14. 最終的な複合 Blocklet のメタデータを公開"

```

---

収益化が設定されたら、次のステップは Blocklet のメタデータが安全であり、そのリソースが適切に定義されていることを確認することです。[セキュリティとリソース](./spec-security-resources.md)セクションに進み、メタデータの署名とバンドルされたアセットの管理について学んでください。