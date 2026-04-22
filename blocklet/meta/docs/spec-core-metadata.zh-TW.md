# 核心元資料

核心元資料欄位確立了 Blocklet 的基本身份。它們提供了用於在 Blocklet 生態系中進行識別、版本控制和可發現性的基本、一目瞭然的資訊。每個 `blocklet.yml` 檔案都必須定義這些基礎屬性，才能被視為有效。

---

## 身份與版本控制

這些欄位唯一識別您的 Blocklet 並追蹤其演進。

### `did` (去中心化識別碼)

`did` 是 Blocklet 的全域唯一且不可變的識別碼。它在整個 ArcBlock 生態系中作為其主鍵，確保每個 Blocklet 都能被安全且無歧義地引用。

<x-field-group>
  <x-field data-name="did" data-type="string" data-required="true">
    <x-field-desc markdown>一個有效的去中心化識別碼。DID 的類型資訊必須指定為 `RoleType.ROLE_BLOCKLET`。</x-field-desc>
  </x-field>
</x-field-group>

#### 驗證規則

系統會驗證所提供的 DID 不僅語法正確，而且具有適當的角色類型 (`ROLE_BLOCKLET`)，這是一項關鍵的安全性和完整性功能。

```yaml blocklet.yml icon=mdi:code-tags
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `name`

`name` 是 Blocklet 的一個人類可讀的識別碼。雖然 `did` 是機器的標準識別碼，但 `name` 為開發者和使用者提供了一個方便、易於記憶的別名。在舊版設定中，它也曾被用來衍生 Blocklet 的 DID。

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>一個唯一的名稱，遵循 [npm 套件命名慣例](https://www.npmjs.com/package/validate-npm-package-name) 且不超過 32 個字元。</x-field-desc>
  </x-field>
</x-field-group>

#### `name` 與 `did` 之間的關係

了解 `name` 和 `did` 如何互動至關重要：

1.  **DID 優先 (建議)**：您提供一個有效的、預先註冊的 Blocklet DID。這是現代且最穩健的方法。
2.  **名稱優先 (舊版支援)**：如果您提供一個 `name`，系統可以從中衍生出一個 DID。為使元資料有效，您的 `blocklet.yml` 中的 `did` 欄位**必須**與從 `name` 生成的預期 DID 相符。不一致將導致驗證錯誤。

```yaml blocklet.yml icon=mdi:code-tags
# 此名稱用於顯示，並可用於衍生 DID
name: 'my-awesome-blocklet'

# 此 DID 必須是一個有效的 Blocklet DID。如果使用名稱優先的方法，
# 它必須與從 'my-awesome-blocklet' 衍生的 DID 相符。
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ
```

### `version`

`version` 欄位追蹤 Blocklet 的發行版本，為使用者和其他 Blocklet 提供適當的依賴管理和版本控制。

<x-field-group>
  <x-field data-name="version" data-type="string" data-required="true">
    <x-field-desc markdown>Blocklet 的版本，必須遵循 [語意化版本 2.0.0](https://semver.org/) 規範 (例如 `1.2.3`, `2.0.0-beta.1`)。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
version: '1.0.0'
```

### `specVersion`

此欄位指定您的元資料檔案所遵循的 `blocklet.yml` 規範版本。這使得 Blocklet 執行環境和工具能夠正確解析和解讀檔案內容，確保向前相容性。

<x-field-group>
  <x-field data-name="specVersion" data-type="string" data-required="false">
    <x-field-desc markdown>一個有效的 SemVer 字串，表示規範版本，必須為 `1.0.0` 或更高版本。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
specVersion: '1.2.0'
```

---

## 展示與分類

這些欄位定義了您的 Blocklet 如何在使用者介面中呈現以及如何被分類。

### `title`

`title` 是 Blocklet 的一個方便顯示的名稱。它用於 Blocklet 商店、儀表板和啟動面板等使用者介面中，在這些地方，一個更具描述性或品牌化的名稱比簡短的 `name` 更受歡迎。

<x-field-group>
  <x-field data-name="title" data-type="string" data-required="false">
    <x-field-desc markdown>一個簡短、人類可讀的標題。其長度計算會考慮 CJK 字元，且不得超過預定義的限制 (`MAX_TITLE_LENGTH`)。更多詳情請參閱 [cjk-length](https://www.npmjs.com/package/cjk-length)。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
title: 'My Awesome Blocklet'
```

### `description`

`description` 提供了 Blocklet 目的和功能的簡潔摘要。它在搜尋結果和 UI 預覽中被大量使用，以幫助使用者快速了解該 Blocklet 的作用。

<x-field-group>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>Blocklet 的簡要摘要，長度介於 3 到 160 個字元之間。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
```

### `logo`

此欄位指定 Blocklet 標誌的路徑或 URL。該標誌用於 Blocklet 商店、儀表板和其他使用者介面中的品牌展示。

<x-field-group>
  <x-field data-name="logo" data-type="string" data-required="false">
    <x-field-desc markdown>指向標誌圖片的相對路徑或絕對 HTTP(S) URL。它不應指向系統內部使用的知名標誌路徑 (`/.well-known/blocklet/logo`)。</x-field-desc>
  </x-field>
</x-field-group>

```yaml blocklet.yml icon=mdi:code-tags
# 使用 Blocklet 套件包內的相對路徑
logo: 'images/logo.png'

# 或使用絕對 URL
# logo: 'https://cdn.example.com/blocklet-logo.svg'
```

### `group`

`group` 欄位對 Blocklet 進行分類，這有助於在註冊中心和市集中的組織和可發現性。

<x-field-group>
  <x-field data-name="group" data-type="string" data-required="false">
    <x-field-desc markdown>Blocklet 的類別。必須是預定義值之一。</x-field-desc>
  </x-field>
</x-field-group>

`group` 的有效值包括：

| Value       | Description                                                          |
|-------------|----------------------------------------------------------------------|
| `dapp`      | 一個去中心化應用程式。                                         |
| `static`    | 一個靜態網站或單頁應用程式。                         |
| `service`   | 一個後端服務或 API。                                            |
| `component` | 一個可重複使用的元件，設計用於在其他 Blocklet 中組合。 |

```yaml blocklet.yml icon=mdi:code-tags
# 將此 Blocklet 分類為去中心化應用程式。
group: 'dapp'
```

---

## 完整範例

這是一個展示所有核心元資料欄位在 `blocklet.yml` 檔案中協同工作的片段。

```yaml blocklet.yml icon=mdi:code-tags
name: 'data-visualizer'
did: z8ia29UsENBg6tLZUKi2HABj38Cw1LmHZocbQ # 對應於 'data-visualizer'
version: '1.2.0'
specVersion: '1.2.0'
title: 'Data Visualizer'
description: 'A Blocklet that provides amazing data visualization tools for your DID Space.'
logo: 'images/logo.svg'
group: 'dapp'
```

現在您已經了解了 Blocklet 的核心身份，下一節將介紹如何指定其創作者和維護者。

<x-card data-title="下一步：人員與所有權" data-icon="lucide:users" data-href="/spec/people-ownership" data-cta="閱讀更多">
了解如何指定 Blocklet 的作者、貢獻者和維護者。
</x-card>