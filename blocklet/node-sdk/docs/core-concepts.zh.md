# 核心概念

Blocklet SDK 建立在几个基本概念之上，这些概念构成了您构建的任何应用程序的支柱。理解这些核心支柱——配置、钱包管理和安全——对于利用 SDK 的全部功能来创建健壮、安全和可扩展的 Blocklet 至关重要。

本节对这些关键领域进行了高层次的概述。每个概念都在其专门的子章节中有详细介绍，您可以在下面导航到相应章节。

<!-- DIAGRAM_IMAGE_START:intro:16:9 -->
![Core Concepts](assets/diagram/core-concepts-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

<x-cards data-columns="3">
  <x-card data-title="配置与环境" data-icon="lucide:settings" data-href="/core-concepts/configuration">
    了解 SDK 如何通过 `config` 和 `env` 模块管理配置、环境变量和组件存储。
  </x-card>
  <x-card data-title="钱包管理" data-icon="lucide:wallet" data-href="/core-concepts/wallet">
    探索 `getWallet` 工具，用于从环境变量创建和管理钱包实例，这对于签名和身份验证至关重要。
  </x-card>
  <x-card data-title="安全工具" data-icon="lucide:shield" data-href="/core-concepts/security">
    了解内置的安全功能，包括数据加密/解密、响应签名和签名验证。
  </x-card>
</x-cards>

掌握这些概念将使您能够构建更复杂、更安全的应用程序。我们建议您从[配置与环境](./core-concepts-configuration.md)开始，以了解您的应用程序如何与其周围环境进行交互。