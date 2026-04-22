# 核心概念

Blocklet SDK 建立在幾個基本概念之上，這些概念構成了您建構的任何應用程式的骨幹。理解這些核心支柱——設定、錢包管理和安全性——對於充分利用 SDK 的強大功能來建立穩健、安全且可擴展的 Blocklet 至關重要。

本節對這些關鍵領域進行了高層次的概述。每個概念都在其專屬的子章節中詳細介紹，您可以透過下方連結前往。

<!-- DIAGRAM_IMAGE_START:intro:16:9 -->
![Core Concepts](assets/diagram/core-concepts-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

<x-cards data-columns="3">
  <x-card data-title="設定與環境" data-icon="lucide:settings" data-href="/core-concepts/configuration">
    了解 SDK 如何透過 `config` 和 `env` 模組管理設定、環境變數和元件儲存。
  </x-card>
  <x-card data-title="錢包管理" data-icon="lucide:wallet" data-href="/core-concepts/wallet">
    探索 `getWallet` 工具，用於從環境變數建立和管理錢包實例，這對於簽署和驗證至關重要。
  </x-card>
  <x-card data-title="安全工具" data-icon="lucide:shield" data-href="/core-concepts/security">
    了解內建的安全功能，包括資料加密/解密、回應簽署和簽章驗證。
  </x-card>
</x-cards>

掌握這些概念將使您能夠建構更複雜、更安全的應用程式。我們建議您從 [設定與環境](./core-concepts-configuration.md) 開始，以了解您的應用程式如何與其周圍環境互動。