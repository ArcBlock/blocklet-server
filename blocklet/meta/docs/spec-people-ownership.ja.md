# 人物と所有権

健全なオープンソースエコシステムにとって、作者の帰属を正しく示し、貢献とメンテナンスの役割を定義することは極めて重要です。`blocklet.yml`では、`author`、`contributors`、`maintainers`という3つの異なるフィールドを使用して、プロジェクトに関わる人物を指定できます。これらのフィールドはすべて、共通の`person`スキーマを使用します。

## Person スキーマ

blockletに関わる各人物は、標準化されたオブジェクトで表現され、メタデータ内のすべての人物関連フィールドにわたって一貫性を確保します。`@blocklet/meta`ライブラリは、この情報を解析し、フォーマットするためのヘルパー関数も提供します。

以下は、person オブジェクトの正式な定義です:

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="その人のフルネームまたはニックネーム。"></x-field>
  <x-field data-name="email" data-type="string" data-required="false" data-desc="その人のメールアドレス。"></x-field>
  <x-field data-name="url" data-type="string" data-required="false" data-desc="その人のウェブサイト、ブログ、またはソーシャルメディアプロフィールへのURL。"></x-field>
</x-field-group>

### 文字列による簡易表記

便宜上、「`Name <email@example.com> (http://example.com)`」という形式の単一の文字列で人物を指定することもできます。`@blocklet/meta`ライブラリは、この文字列を自動的に構造化オブジェクト形式に解析します。メールアドレスとURLの部分は省略可能です。

```yaml String Shorthand Example icon=lucide:file-text
author: 'Satoshi Nakamoto <satoshi@gmx.com> (https://bitcoin.org)'
```

## `author`

`author`フィールドは、blockletの主要な作成者または所有者を示します。単一のpersonオブジェクト、またはそれに解析できる文字列でなければなりません。

**スキーマ:** `personSchema`

**例:**

```yaml blocklet.yml icon=lucide:file-code
author:
  name: Jane Doe
  email: jane.doe@example.com
  url: https://github.com/janedoe
```

## `contributors`

`contributors`フィールドは、blockletの開発に貢献した人々の配列です。配列の各項目は、personオブジェクトまたは文字列のいずれかです。

**スキーマ:** `Joi.array().items(personSchema)`

**例:**

```yaml blocklet.yml icon=lucide:file-code
contributors:
  - name: John Smith
    email: john.smith@example.com
  - name: Alice Johnson
    url: https://alicej.dev
  - 'Bob Williams <bob@williams.io>'
```

## `maintainers`

`maintainers`フィールドは、問題への対応や貢献のレビューを含め、現在blockletのメンテナンスを担当している人々の配列です。

**スキーマ:** `Joi.array().items(personSchema)`

**例:**

```yaml blocklet.yml icon=lucide:file-code
maintainers:
  - name: Jane Doe
    email: jane.doe@example.com
  - name: Admin Team
    email: admin@example.com
    url: https://example.com/team
```

これらの役割を明確に定義することで透明性が確保され、ユーザーや他の開発者が目的ごとに誰に連絡すべきかを簡単に知ることができます。

---

次に、blockletの場所とダウンロード方法を指定する方法を見てみましょう。

<x-card data-title="次へ: 配布とリンク" data-icon="lucide:package" data-href="/spec/distribution-links" data-cta="続きを読む">
  blockletをそのパッケージとソースコードにリンクするための`dist`、`repository`、およびさまざまなURLフィールドについて学びます。
</x-card>