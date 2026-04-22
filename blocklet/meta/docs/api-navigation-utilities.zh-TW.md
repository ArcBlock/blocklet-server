# 導覽工具函式

這些函式是在基於 Blocklet 的應用程式中建構動態使用者介面的引擎。它們解析並處理來自 blocklet 元資料（`blocklet.yml`）及其目前狀態的 `navigation` 屬性，將主 blocklet 及其所有子元件的導覽項目匯總成一個統一、可供渲染的結構。

這些工具函式解決的核心挑戰是複雜性管理。在一個複合應用程式中，每個元件都可以宣告自己的導覽項目。這些工具函式能智慧地合併這些宣告，根據每個元件的掛載點解析路徑前綴，處理國際化（i18n），過濾掉重複或無法存取的項目，並將所有內容組織成邏輯區塊（如 `header`、`footer`、`userCenter`）。

## 核心處理流程

下圖說明了來自不同來源的原始導覽元資料如何被轉換為使用者介面的最終結構化列表的高階流程。

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Navigation Utilities](assets/diagram/navigation-utilities-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## 主要函式

### `parseNavigation(blocklet, options)`

這是處理導覽資料的主要函式。它負責整個工作流程，從解析 `blocklet.yml` 檔案中的內建導覽，到將其與儲存在資料庫中的使用者自訂設定合併。

**參數**

<x-field-group>
  <x-field data-name="blocklet" data-type="object" data-required="true" data-desc="完整的 blocklet 狀態物件，包含 `meta`、`children` 和 `settings.navigations`。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="用於解析過程的可選設定。">
    <x-field data-name="beforeProcess" data-type="(data: any) => any" data-required="false" data-desc="一個可選的函式，用於在壓縮和修補內建導覽列表之前對其進行預處理。"></x-field>
  </x-field>
</x-field-group>

**傳回值**

一個包含已處理導覽資料的物件：

<x-field-group>
  <x-field data-name="navigationList" data-type="NavigationItem[]" data-desc="最終合併、清理後的導覽項目列表，可供渲染。這是主要輸出。"></x-field>
  <x-field data-name="components" data-type="ComponentItem[]" data-desc="所有宣告了導覽的子元件的陣列，包含它們的名稱、連結和標題。"></x-field>
  <x-field data-name="builtinList" data-type="NavigationItem[]" data-desc="純粹從 `blocklet.yml` 檔案衍生的已處理導覽項目列表，在與來自設定的自訂導覽合併之前。"></x-field>
</x-field-group>

**使用範例**

```javascript Basic Usage icon=logos:javascript
import { parseNavigation } from '@blocklet/meta/lib/navigation';

// 一個簡化的 blocklet 狀態物件
const blockletState = {
  did: 'z1...',
  meta: {
    name: 'my-app',
    title: 'My App',
    navigation: [
      { id: 'home', title: 'Home', link: '/' },
      { id: 'dashboard', title: 'Dashboard', component: 'dashboard-blocklet' },
    ],
  },
  children: [
    {
      did: 'z2...',
      mountPoint: '/dashboard',
      meta: {
        name: 'dashboard-blocklet',
        title: 'Dashboard',
        navigation: [
          { id: 'overview', title: 'Overview', link: '/overview' },
        ],
      },
    },
  ],
  settings: {
    // 來自資料庫的自訂導覽項目
    navigations: [
      {
        id: 'external-link',
        title: 'External Site',
        link: 'https://example.com',
        section: 'header',
        from: 'db',
        visible: true,
      },
    ],
  },
};

const { navigationList, components } = parseNavigation(blockletState);

console.log(navigationList);
/*
輸出一個類似這樣的結構化陣列：
[
  { id: '/home', title: 'Home', link: '/', ... },
  {
    id: '/dashboard/overview',
    title: 'Overview',
    link: '/dashboard/overview',
    component: 'dashboard-blocklet',
    ...
  },
  { id: 'external-link', title: 'External Site', ... }
]
*/
console.log(components);
/*
輸出元件資訊：
[
  {
    did: 'z2...',
    name: 'dashboard-blocklet',
    link: '/dashboard',
    title: 'Dashboard',
    ...
  }
]
*/
```

## 輔助函式

雖然 `parseNavigation` 是一個全方位的解決方案，但該函式庫也匯出了幾個底層的輔助函式。這些函式對於您可能需要對導覽資料執行自訂操作的進階使用案例非常有用。

<x-cards data-columns="2">
  <x-card data-title="deepWalk" data-icon="lucide:git-commit">
    一個通用的工具函式，用於遞迴遍歷樹狀物件，並對每個節點應用一個回呼函式。
  </x-card>
  <x-card data-title="flattenNavigation" data-icon="lucide:merge">
    將巢狀的導覽樹轉換為扁平陣列，可選擇性地指定深度。
  </x-card>
  <x-card data-title="nestNavigationList" data-icon="lucide:git-branch-plus">
    根據項目中的 `parent` ID 屬性，從扁平陣列重構出巢狀的導覽樹。
  </x-card>
  <x-card data-title="splitNavigationBySection" data-icon="lucide:columns">
    將屬於多個區塊的導覽項目分解為每個區塊的獨立項目。
  </x-card>
  <x-card data-title="filterNavigation" data-icon="lucide:filter">
    透過移除標記為 `visible: false` 的項目或其元件遺失的項目來過濾導覽列表。
  </x-card>
  <x-card data-title="joinLink" data-icon="lucide:link">
    智慧地將父項目的連結與子項目的連結結合，正確處理前綴和絕對 URL。
  </x-card>
</x-cards>

### `flattenNavigation(list, options)`

此函式接收一個樹狀結構的導覽項目，並將其扁平化為單層陣列。這對於準備導覽資料以在不支援深度巢狀結構的選單中顯示，或為了更容易處理時特別有用。

**參數**

<x-field-group>
  <x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="樹狀結構的導覽列表。"></x-field>
  <x-field data-name="options" data-type="object" data-required="false" data-desc="扁平化操作的設定選項。">
    <x-field data-name="depth" data-type="number" data-default="1" data-required="false" data-desc="樹應被扁平化的深度。深度為 1 表示完全扁平化。"></x-field>
    <x-field data-name="transform" data-type="(current, parent) => any" data-required="false" data-desc="一個在扁平化過程中轉換每個項目的函式。"></x-field>
  </x-field>
</x-field-group>

**範例**

```javascript Flattening a Navigation Tree icon=logos:javascript
const nestedNav = [
  {
    id: 'parent1',
    title: 'Parent 1',
    items: [
      { id: 'child1a', title: 'Child 1a' },
      { id: 'child1b', title: 'Child 1b' },
    ],
  },
];

const flatNav = flattenNavigation(nestedNav, { depth: 2 }); // 扁平化至多 2 層

console.log(flatNav);
/*
[
  { id: 'parent1', title: 'Parent 1' },
  { id: 'child1a', title: 'Child 1a' },
  { id: 'child1b', title: 'Child 1b' }
]
*/
```

### `nestNavigationList(list)`

`flattenNavigation` 的反向操作。此函式接收一個扁平的導覽項目陣列，其中子項目透過 `parent` ID 參考其父項目，並重構出原始的樹狀結構。

**參數**

<x-field data-name="list" data-type="NavigationItem[]" data-required="true" data-desc="一個包含 `id` 和 `parent` 屬性的扁平導覽項目陣列。"></x-field>

**範例**

```javascript Building a Tree from a Flat List icon=logos:javascript
const flatNav = [
  { id: 'parent1', title: 'Parent 1', section: 'header' },
  { id: 'child1a', title: 'Child 1a', parent: 'parent1', section: 'header' },
  { id: 'root2', title: 'Root 2', section: 'header' },
];

const nestedNav = nestNavigationList(flatNav);

console.log(nestedNav);
/*
[
  {
    id: 'parent1',
    title: 'Parent 1',
    section: 'header',
    items: [ { id: 'child1a', title: 'Child 1a', ... } ],
  },
  { id: 'root2', title: 'Root 2', section: 'header' },
]
*/
```

---

這些工具函式為管理複雜、基於元件的應用程式中的導覽提供了一套全面的工具包。要了解如何格式化這些導覽項目中使用的 URL 和路徑，請參閱 [URL 與路徑工具函式](./api-url-path-utilities.md) 文件。