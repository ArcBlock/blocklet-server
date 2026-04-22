# 執行與環境

`blocklet.yml` 中的執行與環境設定是您 Blocklet 運作的藍圖。它指定了必要的執行環境、定義了系統需求、向使用者揭露設定選項，並與 Blocklet 的生命週期掛鉤。正確設定此部分對於建立一個可攜、穩健且使用者友善的應用程式至關重要。

本節涵蓋五個關鍵領域：`engine`、`docker`、`requirements`、`environments`、`scripts` 和 `timeout`。

## 引擎 (`engine`)

此屬性指定了您 blocklet 的執行引擎，定義了執行環境及其啟動方式。對於大多數基於 JavaScript 的 blocklet，您將指定 `node` 作為直譯器，而 `main` 屬性（定義於 `blocklet.yml` 的根層級）將作為進入點。

```yaml A Simple Node.js Engine icon=mdi:language-yaml
name: my-node-blocklet
main: build/index.js
engine:
  interpreter: node
```

您也可以提供一個引擎設定陣列以支援多個平台，這對於二進位發行版來說是理想的選擇。

```yaml Multi-Platform Engine Configuration icon=mdi:language-yaml
# ... other properties
engine:
  - platform: linux
    interpreter: binary
    source: ./bin/server-linux
  - platform: darwin
    interpreter: binary
    source: ./bin/server-macos
  - platform: win32
    interpreter: binary
    source: ./bin/server-win.exe
```

### 引擎屬性

<x-field-group>
  <x-field data-name="interpreter" data-type="string" data-default="node">
    <x-field-desc markdown>執行 blocklet 的執行環境。有效值：`node`、`blocklet`、`binary`、`bun`。</x-field-desc>
  </x-field>
  <x-field data-name="platform" data-type="string" data-required="false">
    <x-field-desc markdown>可選的作業系統平台。當 `engine` 是一個陣列時使用，用於為不同作業系統（例如 `linux`、`darwin`、`win32`）指定設定。</x-field-desc>
  </x-field>
  <x-field data-name="source" data-type="string | object" data-required="false">
    <x-field-desc markdown>如果直譯器是 `blocklet`，則為引擎的來源。可以是一個 URL 字串，或是一個參照 URL 或 Blocklet Store 的物件。</x-field-desc>
  </x-field>
  <x-field data-name="args" data-type="string[]" data-default="[]" data-required="false">
    <x-field-desc markdown>一個要傳遞給執行檔的命令列參數陣列。</x-field-desc>
  </x-field>
</x-field-group>

## Docker (`docker`)

作為 `engine` 屬性的替代方案，您可以使用 `docker` 在容器化環境中執行您的 blocklet。這對於具有複雜相依性或非 JavaScript 執行環境的應用程式來說是理想的選擇。您必須提供 `image` 或 `dockerfile` 其中之一。

```yaml Using a Pre-built Docker Image icon=mdi:docker
docker:
  image: 'nginx:latest'
  egress: true
```

使用 `dockerfile` 時，您還必須將其路徑包含在根層級的 `files` 陣列中。

```yaml Building from a Dockerfile icon=mdi:docker
docker:
  dockerfile: 'Dockerfile.prod'
files:
  - 'Dockerfile.prod'
```

### Docker 屬性

<x-field-group>
  <x-field data-name="image" data-type="string" data-required="false">
    <x-field-desc markdown>要使用的 Docker 映像檔名稱。</x-field-desc>
  </x-field>
  <x-field data-name="dockerfile" data-type="string" data-required="false">
    <x-field-desc markdown>用於建構映像檔的 Dockerfile 路徑。您不能同時使用 `image` 和 `dockerfile`。</x-field-desc>
  </x-field>
  <x-field data-name="egress" data-type="boolean" data-default="true" data-required="false">
    <x-field-desc markdown>blocklet 是否可以存取外部網路。</x-field-desc>
  </x-field>
</x-field-group>

## 執行環境需求 (`requirements`)

此物件定義了 blocklet 正確執行所必需的環境限制。系統會在安裝前檢查這些需求以確保相容性。

```yaml Example Requirements icon=mdi:language-yaml
requirements:
  server: '>=1.16.0'
  os: '*'
  cpu: 'x64'
  nodejs: '>=18.0.0'
```

### 需求屬性

<x-field-group>
  <x-field data-name="server" data-type="string">
    <x-field-desc markdown>所需的 Blocklet Server 版本的有效 SemVer 範圍。預設為最新的穩定版本。</x-field-desc>
  </x-field>
  <x-field data-name="os" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>相容的作業系統。使用 `*` 表示任何系統。可以是一個單一字串或一個陣列（例如 `['linux', 'darwin']`）。有效平台包括 `aix`、`darwin`、`freebsd`、`linux`、`openbsd`、`sunos`、`win32`。</x-field-desc>
  </x-field>
  <x-field data-name="cpu" data-type="string | string[]" data-default="*">
    <x-field-desc markdown>相容的 CPU 架構。使用 `*` 表示任何架構。可以是一個單一字串或一個陣列（例如 `['x64', 'arm64']`）。有效架構包括 `arm`、`arm64`、`ia32`、`mips`、`mipsel`、`ppc`、`ppc64`、`s390`、`s390x`、`x32`、`x64`。</x-field-desc>
  </x-field>
  <x-field data-name="nodejs" data-type="string" data-default="*">
    <x-field-desc markdown>所需的 Node.js 版本的有效 SemVer 範圍。</x-field-desc>
  </x-field>
  <x-field data-name="fuels" data-type="array" data-required="false">
    <x-field-desc markdown>指定在已連接的錢包中，執行某些操作所需的資產（代幣）列表。</x-field-desc>
  </x-field>
  <x-field data-name="aigne" data-type="boolean" data-required="false">
    <x-field-desc markdown>如果為 `true`，表示該 blocklet 需要有可用的 AI 引擎。</x-field-desc>
  </x-field>
</x-field-group>

## 環境變數 (`environments`)

`environments` 陣列允許您定義自訂設定變數。這些變數會在安裝過程中或在 blocklet 的設定頁面上呈現給使用者，讓他們可以安全地輸入 API 金鑰、設定功能旗標或自訂行為。

```yaml Environment Variable Definitions icon=mdi:language-yaml
environments:
  - name: 'API_KEY'
    description: 'Your secret API key for the external service.'
    required: true
    secure: true
  - name: 'FEATURE_FLAG_BETA'
    description: 'Enable the beta feature for this blocklet.'
    required: false
    default: 'false'
    validation: '^(true|false)$'
```

**鍵命名規則：**
- 名稱不得以保留的前綴 `BLOCKLET_`、`COMPONENT_` 或 `ABTNODE_` 開頭。
- 名稱只能包含字母、數字和底線 (`_`)。

### 環境屬性

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>環境變數的名稱。</x-field-desc>
  </x-field>
  <x-field data-name="description" data-type="string" data-required="true">
    <x-field-desc markdown>關於此變數用途的使用者友善描述。</x-field-desc>
  </x-field>
  <x-field data-name="default" data-type="string" data-required="false">
    <x-field-desc markdown>可選的預設值。如果 `secure` 為 `true`，則不能使用。</x-field-desc>
  </x-field>
  <x-field data-name="required" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>使用者是否必須為此變數提供值。</x-field-desc>
  </x-field>
  <x-field data-name="secure" data-type="boolean" data-default="false" data-required="false">
    <x-field-desc markdown>如果為 true，該值將被視為敏感資料（例如密碼、API 金鑰），以加密方式儲存並在 UI 中隱藏。</x-field-desc>
  </x-field>
  <x-field data-name="validation" data-type="string" data-required="false">
    <x-field-desc markdown>一個可選的正規表示式字串，用於驗證使用者的輸入。</x-field-desc>
  </x-field>
  <x-field data-name="shared" data-type="boolean" data-required="false">
    <x-field-desc markdown>如果為 true，此變數可以在元件之間共享。如果 `secure` 為 `true`，則預設為 `false`。</x-field-desc>
  </x-field>
</x-field-group>

## 生命週期腳本 (`scripts`)

腳本是掛鉤到 blocklet 生命週期的 shell 命令，允許您在特定階段（如安裝、啟動或解除安裝）執行自動化任務。下圖說明了安裝和啟動掛鉤的執行時機：

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Execution & Environment](assets/diagram/execution-environment-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

```yaml Script Hook Examples icon=mdi:language-yaml
scripts:
  pre-install: 'npm install --production'
  post-start: 'node ./scripts/post-start.js'
  pre-stop: 'echo "Shutting down..."'
```

### 可用掛鉤

| Hook (`kebab-case`) | When It Runs                                                              |
|---------------------|---------------------------------------------------------------------------|
| `dev`               | 在開發模式下執行 blocklet 的命令。                                            |
| `e2eDev`            | 在開發環境中執行端對端測試的命令。                                            |
| `pre-flight`        | 在安裝過程開始前，用於初始檢查。                                              |
| `pre-install`       | 在 blocklet 檔案被複製到最終目標位置之前。                                    |
| `post-install`      | 在 blocklet 成功安裝之後。                                                  |
| `pre-start`         | 在 blocklet 的主程序啟動之前。                                              |
| `post-start`        | 在 blocklet 成功啟動之後。                                                  |
| `pre-stop`          | 在 blocklet 被停止之前。                                                    |
| `pre-uninstall`     | 在 blocklet 被解除安裝之前。                                                |
| `pre-config`        | 在設定使用者介面顯示給使用者之前。                                            |

## 逾時 (`timeout`)

此物件允許您為關鍵的生命週期操作設定最大等待時間，以防止程序無限期掛起。

```yaml Timeout Configuration icon=mdi:language-yaml
timeout:
  start: 120  # 等待 blocklet 啟動最多 120 秒
  script: 600 # 允許腳本執行最多 10 分鐘
```

### 逾時屬性

<x-field-group>
  <x-field data-name="start" data-type="number" data-default="60">
    <x-field-desc markdown>等待 blocklet 啟動的最大秒數。必須介於 10 和 600 之間。</x-field-desc>
  </x-field>
  <x-field data-name="script" data-type="number">
    <x-field-desc markdown>任何生命週期腳本執行的最大秒數。必須介於 1 和 1800 之間。</x-field-desc>
  </x-field>
</x-field-group>

---

執行環境設定完成後，下一步是定義您的 blocklet 如何與外部世界通訊。請前往 [介面與服務](./spec-interfaces-services.md) 部分，了解如何公開網頁和 API 端點。