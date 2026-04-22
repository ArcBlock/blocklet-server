# 人員與所有權

適當地標示作者身份並為貢獻和維護定義角色，對於一個健康的開源生態系統至關重要。在 `blocklet.yml` 中，您可以使用三個不同的欄位來指定參與專案的人員：`author`、`contributors` 和 `maintainers`。所有這些欄位都使用一個通用的 `person` 結構描述。

## 個人結構描述

參與 Blocklet 的每個人都由一個標準化的物件表示，確保中繼資料中所有與人員相關的欄位都具有一致性。`@blocklet/meta` 函式庫也提供輔助函式來解析和格式化這些資訊。

以下是個人物件的正式定義：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="此人的全名或暱稱。"></x-field>
  <x-field data-name="email" data-type="string" data-required="false" data-desc="此人的電子郵件地址。"></x-field>
  <x-field data-name="url" data-type="string" data-required="false" data-desc="此人網站、部落格或社交媒體個人資料的 URL。"></x-field>
</x-field-group>

### 字串簡寫

為方便起見，您也可以將個人指定為 `"Name <email@example.com> (http://example.com)"` 格式的單一字串。`@blocklet/meta` 函式庫會自動將此字串解析為結構化的物件格式。電子郵件和 URL 部分是可選的。

```yaml 字串簡寫範例 icon=lucide:file-text
author: 'Satoshi Nakamoto <satoshi@gmx.com> (https://bitcoin.org)'
```

## `author`

`author` 欄位指定了 Blocklet 的主要創建者或所有者。它應該是一個單一的個人物件或可以解析為該物件的字串。

**結構描述：** `personSchema`

**範例：**

```yaml blocklet.yml icon=lucide:file-code
author:
  name: Jane Doe
  email: jane.doe@example.com
  url: https://github.com/janedoe
```

## `contributors`

`contributors` 欄位是一個陣列，列出對 Blocklet 開發有所貢獻的人員。陣列中的每個項目可以是個人物件或字串。

**結構描述：** `Joi.array().items(personSchema)`

**範例：**

```yaml blocklet.yml icon=lucide:file-code
contributors:
  - name: John Smith
    email: john.smith@example.com
  - name: Alice Johnson
    url: https://alicej.dev
  - 'Bob Williams <bob@williams.io>'
```

## `maintainers`

`maintainers` 欄位是一個陣列，列出目前負責維護 Blocklet 的人員，包括回應問題和審查貢獻。

**結構描述：** `Joi.array().items(personSchema)`

**範例：**

```yaml blocklet.yml icon=lucide:file-code
maintainers:
  - name: Jane Doe
    email: jane.doe@example.com
  - name: Admin Team
    email: admin@example.com
    url: https://example.com/team
```

透過清楚地定義這些角色，您提供了透明度，並讓使用者和其他開發人員更容易知道為了不同目的該聯繫誰。

---

接下來，讓我們看看如何指定您的 Blocklet 可以在哪裡找到和下載。

<x-card data-title="下一步：分發與連結" data-icon="lucide:package" data-href="/spec/distribution-links" data-cta="Read More">
  了解 `dist`、`repository` 和各種 URL 欄位，以將您的 Blocklet 連結到其套件和原始碼。
</x-card>