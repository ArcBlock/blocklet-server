# 發行版和連結

本節介紹 `blocklet.yml` 中的欄位，這些欄位定義了您的 blocklet 如何打包以供發行，並提供了指向其原始碼、首頁、文件和其他資源的重要連結。正確設定這些欄位對於可發現性、使用者信任以及整合到 Blocklet 生態系統中至關重要。

## 發行套件 (`dist`)

`dist` 物件包含有關 blocklet 捆綁套件的資訊。此資料通常由 `blocklet publish` 命令自動產生和新增，並由 Blocklet Store 用於下載和驗證 blocklet。

它確保了使用者安裝的 blocklet 套件的完整性和真實性。

### 結構

<x-field-group>
  <x-field data-name="dist" data-type="object" data-required="false" data-desc="包含有關 blocklet 捆綁套件的資訊。">
    <x-field data-name="tarball" data-type="string" data-required="true" data-desc="可下載壓縮的 blocklet 捆綁包 (.tar.gz) 的 URL。"></x-field>
    <x-field data-name="integrity" data-type="string" data-required="true" data-desc="一個子資源完整性字串（例如，SHA-512 雜湊），用於驗證下載的套件內容。"></x-field>
    <x-field data-name="size" data-type="number" data-required="false" data-desc="tarball 的大小（以位元組為單位）。"></x-field>
  </x-field>
</x-field-group>

### 範例

```yaml blocklet.yml icon=mdi:package-variant
# 此欄位通常在發行過程中自動產生
dist:
  tarball: https://store.blocklet.dev/uploads/z123abc.tar.gz
  integrity: sha512-Vbf...Q==
  size: 1234567
```

## 原始碼儲存庫 (`repository`)

`repository` 欄位指定了您的 blocklet 原始碼的位置。強烈建議使用此欄位，因為它允許使用者和貢獻者檢視程式碼、回報問題和做出貢獻。

您可以提供一個簡單的 URL 字串或一個更詳細的物件。

### 結構

<x-field data-name="repository" data-type="string | object" data-required="false" data-desc="指定 blocklet 原始碼的位置。">
  <x-field-desc markdown>可以是一個簡單的 URL 字串或一個具有詳細屬性的物件。系統通常可以從標準 URL 字串中解析出類型。</x-field-desc>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="版本控制系統的類型（例如，'git'、'https'、'svn'）。"></x-field>
  <x-field data-name="url" data-type="string" data-required="true" data-desc="儲存庫的 URL。"></x-field>
  <x-field data-name="directory" data-type="string" data-required="false" data-desc="在 monorepo 中 blocklet 套件的路徑。"></x-field>
</x-field>

### 範例：簡單 URL

如果您提供一個字串，它將被自動解析以確定儲存庫類型。

```yaml blocklet.yml icon=mdi:git
repository: https://github.com/arcblock/blocklet-spec.git
```

### 範例：物件格式

當您需要更明確地說明時，或者在 monorepo 中使用物件格式非常有用。

```yaml blocklet.yml icon=mdi:git
repository:
  type: git
  url: https://github.com/arcblock/blocklet-framework.git
  directory: packages/blocklet-spec
```

## 網站連結與支援

這些欄位提供了指向重要外部資源的直接連結，以增強使用者支援和社群參與。

<x-field-group>
  <x-field data-name="homepage" data-type="string" data-required="false" data-desc="blocklet 的官方首頁或行銷頁面。"></x-field>
  <x-field data-name="documentation" data-type="string" data-required="false" data-desc="連結至 blocklet 詳細文件網站的連結。"></x-field>
  <x-field data-name="community" data-type="string" data-required="false" data-desc="連結至社群論壇、Discord 伺服器或其他討論平台的連結。"></x-field>
  <x-field data-name="support" data-type="string" data-required="false" data-desc="供使用者尋求幫助的 URL 或電子郵件地址。"></x-field>
</x-field-group>

### 範例

```yaml blocklet.yml icon=mdi:web
homepage: https://www.arcblock.io/
documentation: https://docs.arcblock.io/
community: https://community.arcblock.io/
support: support@arcblock.io
```

## 推廣素材

這些欄位用於在 Blocklet Store 中展示您的 blocklet，為使用者提供其功能和特性的視覺預覽。

<x-field-group>
  <x-field data-name="screenshots" data-type="string[]" data-required="false" data-desc="一個 URL 陣列，指向展示 blocklet UI 或功能的圖片。"></x-field>
  <x-field data-name="videos" data-type="string[]" data-required="false">
    <x-field-desc markdown>一個最多包含 3 個 URL 的陣列，用於推廣影片。僅支援 YouTube 和 Vimeo 連結。</x-field-desc>
  </x-field>
  <x-field data-name="logoUrl" data-type="string" data-required="false" data-desc="blocklet 標誌的直接 URL。這通常由發行過程產生和上傳。"></x-field>
</x-field-group>

### 範例

```yaml blocklet.yml icon=mdi:image-multiple
screenshots:
  - https://meta.blocklet.dev/screenshots/1.png
  - https://meta.blocklet.dev/screenshots/2.png
videos:
  - https://www.youtube.com/watch?v=xxxxxxxx
logoUrl: https://meta.blocklet.dev/logo.png
```

## 使用統計 (`stats`)

`stats` 物件包含 blocklet 的使用指標。與 `dist` 欄位一樣，這通常由 Blocklet Store 管理，不應手動設定。

### 結構

<x-field-group>
  <x-field data-name="stats" data-type="object" data-required="false" data-desc="包含由 Blocklet Store 管理的 blocklet 使用指標。">
    <x-field data-name="downloads" data-type="number" data-required="false" data-desc="blocklet 被下載的總次數。"></x-field>
    <x-field data-name="star" data-type="number" data-default="0" data-required="false" data-desc="blocklet 收到的星星或讚數。"></x-field>
    <x-field data-name="purchases" data-type="number" data-default="0" data-required="false" data-desc="blocklet 被購買的次數。"></x-field>
  </x-field>
</x-field-group>

### 範例

```yaml blocklet.yml icon=mdi:chart-bar
# 此欄位由 Blocklet Store 管理
stats:
  downloads: 10500
  star: 250
  purchases: 120
```

---

設定好這些欄位後，您的 blocklet 就準備好發行了。下一步是定義它的執行方式。

<x-card data-title="下一步：執行與環境" data-icon="lucide:terminal" data-cta="閱讀更多" data-href="/spec/execution-environment">
了解如何設定 blocklet 的引擎、執行環境要求、環境變數和啟動腳本。
</x-card>