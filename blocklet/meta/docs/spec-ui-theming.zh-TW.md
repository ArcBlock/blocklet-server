# UI 與主題

本節詳細介紹 `blocklet.yml` 檔案中的 `navigation` 和 `theme` 屬性。這些屬性對於定義 blocklet 對使用者介面的貢獻至關重要，它們控制 blocklet 在選單中的顯示方式，並指定其外觀和風格，以確保一致的使用者體驗。

正確設定這些欄位能讓 blocklet 無縫整合到一個更大的應用程式中，為使用者提供清晰的導覽路徑，並遵循既定的視覺指南。

## 導覽

`navigation` 屬性是一個物件陣列，用於定義 blocklet 面向使用者的選單結構。它允許您指定導覽連結，這些連結將被合併到父應用程式的導覽中，例如頁首、頁腳或儀表板。此系統是可組合的，這意味著父 blocklet 可以參考子元件，而子元件的導覽項目將被智慧地整合到父層的結構中。

### 導覽項目屬性

`navigation` 陣列中的每個項目都是一個物件，可以包含以下欄位：

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="false">
    <x-field-desc markdown>導覽項目的唯一識別碼。雖然是選填的，但提供一個 `id` 是最佳實踐，特別是對於可能被其他 blocklet 參考或擴充的項目。ID 必須符合 JavaScript 變數命名規則。</x-field-desc>
  </x-field>
  <x-field data-name="title" data-type="string | object" data-required="true">
    <x-field-desc markdown>導覽項目顯示的文字。可以是一個簡單的字串，或是一個用於國際化 (i18n) 的物件，其中鍵是語系代碼（例如 `en`、`zh`）。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string | object" data-required="false">
    <x-field-desc markdown>導覽項目的工具提示或補充文字。它也以與 `title` 相同的方式支援 i18n。</x-field-desc>
  </x-field>
  <x-field data-name="link" data-type="string | object" data-required="false">
    <x-field-desc markdown>導覽項目的目標 URL。可以是一個相對路徑（例如 `/profile`），它將根據 blocklet 的掛載點進行解析，也可以是一個絕對 URL（例如 `https://www.arcblock.io`）。它也支援 i18n。</x-field-desc>
  </x-field>
  <x-field data-name="component" data-type="string" data-required="false">
    <x-field-desc markdown>子元件 blocklet 的名稱或 DID。指定後，此導覽項目將作為其子元件自身導覽條目的容器，這些條目將被巢狀放置在其下方。</x-field-desc>
  </x-field>
  <x-field data-name="section" data-type="string | array" data-required="false">
    <x-field-desc markdown>指定導覽項目應出現在 UI 的哪個位置。單個項目可以屬於多個區塊。有效值包括：`header`、`footer`、`bottom`、`social`、`dashboard`、`sessionManager`、`userCenter` 和 `bottomNavigation`。</x-field-desc>
  </x-field>
  <x-field data-name="role" data-type="string | array" data-required="false">
    <x-field-desc markdown>定義允許看到此導覽項目的角色，從而為 UI 啟用基於角色的存取控制 (RBAC)。</x-field-desc>
  </x-field>
  <x-field data-name="icon" data-type="string" data-required="false">
    <x-field-desc markdown>用於在導覽項目標題旁顯示圖示的識別碼。</x-field-desc>
  </x-field>
  <x-field data-name="visible" data-type="boolean" data-required="false" data-default="true">
    <x-field-desc markdown>控制導覽項目的預設可見性。</x-field-desc>
  </x-field>
  <x-field data-name="private" data-type="boolean" data-required="false" data-default="false">
    <x-field-desc markdown>如果為 `true`，此項目僅在使用者檢視自己的個人資料或使用者中心時可見，檢視他人時則不可見。</x-field-desc>
  </x-field>
  <x-field data-name="items" data-type="array" data-required="false">
    <x-field-desc markdown>一個巢狀的導覽項目物件陣列，允許建立下拉式選單或子選單。</x-field-desc>
  </x-field>
</x-field-group>

### 範例：基本導覽

這是一個 `navigation` 設定範例，它定義了一個指向 blocklet 首頁的主連結和一個在頁腳的外部連結。

```yaml blocklet.yml
name: 'my-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: 'My Blocklet'

interfaces:
  - type: 'web'
    name: 'publicUrl'
    path: '/'
    prefix: '*'
    port: 'BLOCKLET_PORT'

navigation:
  - title: 'Home'
    link: '/'
    section: 'header'
  - title:
      en: 'My Account'
      zh: '我的账户'
    link: '/profile'
    section: 'userCenter'
    role: ['guest', 'user']
    private: true
  - title: 'About Us'
    link: 'https://www.arcblock.io'
    section: 'footer'
    icon: 'mdi:info-outline'
```

### 範例：可組合導覽

此範例展示了父 blocklet 如何將其導覽與子元件組合。「Dashboard」條目將自動引入並巢狀化 `my-dashboard-component` 中定義的導覽項目。

```yaml 父 Blocklet (blocklet.yml) icon=mdi:file-document
# ... (父 blocklet 元資料)

components:
  - name: 'my-dashboard-component'
    source:
      store: 'https://store.arcblock.io/api'
      name: 'my-dashboard-component'

navigation:
  - title: 'Home'
    link: '/'
    section: 'header'
  - title: 'Dashboard'
    component: 'my-dashboard-component' # 參考子元件
    section: 'dashboard'
```

```yaml 子元件 (my-dashboard-component/blocklet.yml) icon=mdi:file-document
# ... (子元件元資料)

navigation:
  - title: 'Overview'
    link: '/overview'
  - title: 'Settings'
    link: '/settings'
```

最終合併的導覽結構將產生一個「Dashboard」選單，其中包含「Overview」和「Settings」作為子項目。

## 主題設定

`theme` 屬性允許 blocklet 定義基本的視覺樣式，例如背景顏色或圖片，這些樣式可由主機應用程式套用。這能確保 blocklet 的 UI 與整體美學保持一致。

### 主題屬性

<x-field-group>
  <x-field data-name="background" data-type="string | object" data-required="false">
    <x-field-desc markdown>指定不同 UI 區域的背景。它可以是單一字串（URL 或顏色值）作為預設值，也可以是一個物件來為特定區塊定義背景。</x-field-desc>
    <x-field data-name="header" data-type="string" data-required="false" data-desc="頁首區塊的背景。"></x-field>
    <x-field data-name="footer" data-type="string" data-required="false" data-desc="頁腳區塊的背景。"></x-field>
    <x-field data-name="default" data-type="string" data-required="false" data-desc="其他區域的預設背景。"></x-field>
  </x-field>
</x-field-group>

### 範例：主題設定

此範例設定了預設背景顏色和一個用於頁首的特定圖片。

```yaml blocklet.yml
name: 'my-themed-blocklet'
did: 'z8iZuf...s92'
version: '1.0.0'
title: 'My Themed Blocklet'

theme:
  background:
    default: '#F5F5F5'
    header: 'url(/assets/header-background.png)'
    footer: '#333333'
```

---

透過利用 `navigation` 和 `theme` 屬性，開發者可以建立不僅功能強大，而且能深度整合到終端使用者應用程式環境中的 blocklet，從而提供一致且直觀的體驗。