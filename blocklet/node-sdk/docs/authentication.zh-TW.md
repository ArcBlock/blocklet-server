# 身份驗證

在現代 Web 應用程式中，強大的身份驗證和授權對於安全性和使用者管理至關重要。Blocklet SDK 提供了一套全面的工具，可無縫地實現這些功能，並利用去中心化身份（DID）來提供安全且以使用者為中心的體驗。

本節概述了在您的 blocklet 中管理使用者身份、會話和存取控制的關鍵元件。您將學習如何整合 DID Connect 以進行登入，使用強大的中介軟體驗證使用者會話，並透過精細的授權規則保護您應用程式的路由。

身份驗證和授權流程通常遵循以下步驟：

<!-- DIAGRAM_IMAGE_START:flowchart:16:9 -->
![Authentication](assets/diagram/authentication-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

1.  **使用者登入**：使用者透過 DID Connect 發起登入請求。
2.  **建立會話**：成功驗證身份後，系統會建立一個會話並向使用者發放一個權杖。
3.  **驗證會話**：對於後續請求，`sessionMiddleware` 會驗證使用者的權杖。
4.  **存取控制**：`authMiddleware` 會檢查通過身份驗證的使用者是否具備存取所請求資源的必要角色或權限。
5.  **存取資源**：如果會話驗證和授權都成功，使用者將被授予對資源的存取權限。

要實現這些功能，您將主要使用三個關鍵模組。以下子文件為每個元件提供了詳細的指南和 API 參考。

<x-cards data-columns="3">
  <x-card data-title="DID Connect" data-icon="lucide:key-round" data-href="/authentication/did-connect">
    使用 WalletAuthenticator 和 WalletHandler 整合去中心化身份，以實現使用者登入。
  </x-card>
  <x-card data-title="會話中介軟體" data-icon="lucide:shield-check" data-href="/authentication/session-middleware">
    學習使用會話中介軟體，透過登入權杖、存取金鑰或安全的元件呼叫來驗證使用者會話。
  </x-card>
  <x-card data-title="授權中介軟體" data-icon="lucide:lock" data-href="/authentication/auth-middleware">
    透過實作基於角色和權限的存取控制來保護您應用程式的路由。
  </x-card>
</x-cards>

透過結合這些工具，您可以為您的 blocklet 建立一個安全且靈活的身份驗證和授權系統，確保只有經過身份驗證和授權的使用者才能存取受保護的資源。

請前往 [DID Connect](./authentication-did-connect.md) 指南開始實作使用者登入。