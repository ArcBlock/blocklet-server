# 介面與服務

Blocklet 透過 `interfaces` 與外部世界互動，並透過 `services` 增強其強大、可重用的功能。`blocklet.yml` 中的 `interfaces` 屬性是公開應用程式網頁、API 和其他端點的基石。然後，可以將 `services`（例如內建的身份驗證服務）附加到這些介面上，以提供通用功能，而無需額外的樣板程式碼。

本節詳細介紹如何配置這兩者，讓您能夠為您的 Blocklet 定義清晰的入口點，並將其無縫整合到更廣泛的生態系統中。

---

## 介面

`interfaces` 陣列定義了 Blocklet 所有面向公眾的入口點。陣列中的每個物件都代表一個介面，指定其類型、位置和行為。

### 介面結構

每個介面物件由以下屬性定義：

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>介面的類型。有效值包括 `web`、`well-known`、`api`、`health` 等。一個 Blocklet 只能宣告一個 `web` 介面。</x-field-desc>
  </x-field>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="介面的唯一、人類可讀的名稱（例如，`publicUrl`、`adminApi`）。"></x-field>
  <x-field data-name="path" data-type="string" data-default="/" data-desc="Blocklet 內服務此介面的內部路徑。"></x-field>
  <x-field data-name="prefix" data-type="string" data-default="*">
    <x-field-desc markdown>此介面公開掛載的路徑前綴。值為 `*` (`BLOCKLET_DYNAMIC_PATH_PREFIX`) 允許使用者將其掛載在任何路徑上。</x-field-desc>
  </x-field>
  <x-field data-name="protocol" data-type="string" data-default="http">
    <x-field-desc markdown>通訊協定。有效值為 `http`、`https`、`tcp`、`udp`。</x-field-desc>
  </x-field>
  <x-field data-name="port" data-type="string | object" data-default="PORT">
    <x-field-desc markdown>定義埠對應。可以是一個引用環境變數的字串（例如 `PORT`），或是一個包含 `internal`（環境變數名稱）和 `external`（埠號）鍵的物件，用於固定對應。</x-field-desc>
  </x-field>
  <x-field data-name="containerPort" data-type="number" data-required="false" data-desc="容器內的埠號。"></x-field>
  <x-field data-name="hostIP" data-type="string" data-required="false" data-desc="將介面綁定到主機上的特定 IP。"></x-field>
  <x-field data-name="services" data-type="array" data-default="[]" data-desc="要附加到此介面的服務列表。詳情請參閱下方的「服務」部分。"></x-field>
  <x-field data-name="endpoints" data-type="array" data-default="[]" data-desc="定義帶有元資料的特定 API 端點，以實現可發現性和互動。"></x-field>
  <x-field data-name="cacheable" data-type="array" data-default="[]" data-desc="此介面下可被上游服務快取的相對路徑列表。"></x-field>
  <x-field data-name="proxyBehavior" data-type="string" data-default="service">
    <x-field-desc markdown>定義請求如何被代理。`service` 會透過 Blocklet Server 的服務層路由，而 `direct` 則會繞過它。</x-field-desc>
  </x-field>
  <x-field data-name="pageGroups" data-type="array" data-default="[]" data-desc="頁面群組識別碼的列表。"></x-field>
</x-field-group>

### 特殊介面類型

-   **`web`**：這是 Blocklet 主要面向使用者的介面。一個 Blocklet 最多只能宣告一個 `web` 類型的介面。
-   **`well-known`**：此類型用於標準化的資源發現路徑（例如，`/.well-known/did.json`）。任何此類型的介面都必須有一個以 `/.well-known` 開頭的 `prefix`。

### 範例：定義介面

以下是一個 `blocklet.yml` 的範例，定義了一個主 Web 介面和一個獨立的 API 介面。

```yaml blocklet.yml icon=mdi:code-braces
name: my-awesome-app
did: z8iZpky2Vd3i2bE8z9f6c7g8h9j0k1m2n3p4q5r6s7t8u9v0w1x2y3z4a5b6c7d
version: 1.2.0
description: An awesome app with a web UI and an API.

interfaces:
  # 主要的 Web 介面，供使用者存取
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT

  # 一個專用的 API 介面
  - type: api
    name: dataApi
    path: /api
    prefix: /api
    protocol: http
    port: PORT
```

---

## 服務

服務是由 Blocklet Server 環境提供的預先建置、可配置的功能。您可以將它們附加到介面上，只需在介面的 `services` 陣列中宣告它們，即可新增身份驗證、授權等功能。

### 服務結構

一個服務物件有兩個主要屬性：

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true" data-desc="要附加的服務名稱（例如，`auth`）。"></x-field>
  <x-field data-name="config" data-type="object" data-default="{}" data-desc="特定於該服務的配置物件。"></x-field>
</x-field-group>

### 內建服務：`auth`

`auth` 服務為您的 Blocklet 提供完整的使用者身份驗證和授權解決方案。它處理使用者登入、個人資料管理和存取控制。

#### `auth` 服務配置

當您新增 `auth` 服務時，可以使用 `config` 物件自訂其行為。以下是可用選項：

<x-field-group>
  <x-field data-name="whoCanAccess" data-type="string" data-default="all">
    <x-field-desc markdown>定義誰可以存取介面。有效值：`owner`（僅 DID Space 擁有者）、`invited`（擁有者和受邀使用者）或 `all`（任何已驗證的使用者）。</x-field-desc>
  </x-field>
  <x-field data-name="profileFields" data-type="array" data-default='["fullName", "email", "avatar"]'>
    <x-field-desc markdown>您的應用程式在登入時請求的使用者個人資料資訊。有效欄位為 `fullName`、`email`、`avatar` 和 `phone`。</x-field-desc>
  </x-field>
  <x-field data-name="allowSwitchProfile" data-type="boolean" data-default="true" data-desc="決定使用者是否可以在您的應用程式內切換不同的個人資料。"></x-field>
  <x-field data-name="blockUnauthenticated" data-type="boolean" data-default="false" data-desc="若為 `true`，服務會自動阻止任何未經驗證的請求。"></x-field>
  <x-field data-name="blockUnauthorized" data-type="boolean" data-default="false">
    <x-field-desc markdown>若為 `true`，服務會阻止不符合 `whoCanAccess` 標準的已驗證使用者。</x-field-desc>
  </x-field>
  <x-field data-name="ignoreUrls" data-type="array" data-default="[]">
    <x-field-desc markdown>應從身份驗證檢查中排除的 URL 路徑或模式列表（例如 `/public/**`）。</x-field-desc>
  </x-field>
</x-field-group>

### 範例：附加 `auth` 服務

此範例展示了如何使用 `auth` 服務來保護前一個範例中的 `web` 介面。

```yaml blocklet.yml icon=mdi:code-braces
interfaces:
  - type: web
    name: publicUrl
    path: /
    prefix: /
    protocol: http
    port: PORT
    services:
      - name: auth
        config:
          whoCanAccess: invited
          blockUnauthenticated: true
          profileFields:
            - fullName
            - email
          ignoreUrls:
            - /assets/**
            - /login
```

在此配置中，除了 `/assets/**` 和 `/login` 外，Web 介面下的所有路徑都受到保護。只有 DID Space 的擁有者和受邀使用者在登入後才能存取受保護的頁面，並且系統會提示他們分享其全名和電子郵件。

---

## 端點

介面中的 `endpoints` 陣列允許明確定義 API 端點，從而增強可發現性並實現自動化互動。

### 端點結構

<x-field-group>
  <x-field data-name="type" data-type="string" data-required="true" data-desc="端點類型的唯一識別碼。"></x-field>
  <x-field data-name="path" data-type="string" data-required="true" data-desc="端點的路徑，相對於介面的路徑。"></x-field>
  <x-field data-name="meta" data-type="object" data-required="false" data-desc="包含有關端點元資料的物件。">
    <x-field data-name="vcType" data-type="string" data-desc="與端點關聯的可驗證憑證 (Verifiable Credential) 類型。"></x-field>
    <x-field data-name="payable" data-type="boolean" data-desc="指示端點是否涉及支付。"></x-field>
    <x-field data-name="params" data-type="array" data-desc="描述端點接受的參數的陣列。">
      <x-field data-name="name" data-type="string" data-required="true" data-desc="參數的名稱。"></x-field>
      <x-field data-name="description" data-type="string" data-required="true" data-desc="參數的描述。"></x-field>
    </x-field>
  </x-field>
</x-field-group>

---

透過結合介面和服務，您可以清楚地定義您的 Blocklet 如何公開，並使用強大的內建功能來保護它。要了解如何透過組合多個 Blocklet 來建構更複雜的應用程式，請參閱下一節關於組合的內容。

[下一步：組合 (元件)](./spec-composition.md)