# 服務

Blocklet SDK 透過提供一套功能強大的服務用戶端，簡化了直接 API 呼叫的複雜性。這些用戶端提供了一個乾淨、程式化的介面，用於與核心 Blocklet 功能互動，例如使用者管理、即時通知和元件間事件處理。透過使用這些服務，您可以用更少的程式碼建構更穩健、功能更豐富的應用程式。

這些服務充當您的應用程式與底層 Blocklet 伺服器之間的橋樑，為您處理驗證、請求格式化和錯誤處理。

<!-- DIAGRAM_IMAGE_START:architecture:4:3 -->
![Services](assets/diagram/services-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

探索 SDK 提供的核心服務：

<x-cards data-columns="3">
  <x-card data-title="Blocklet 服務" data-icon="lucide:user-cog" data-href="/services/blocklet-service">
    以程式化方式管理使用者、角色、權限和存取金鑰。它還提供擷取 blocklet 元資料和元件資訊的方法。
  </x-card>
  <x-card data-title="通知服務" data-icon="lucide:bell-ring" data-href="/services/notification-service">
    透過傳送即時通知和處理傳入訊息與使用者互動。支援直接傳送訊息給使用者和公共頻道廣播。
  </x-card>
  <x-card data-title="事件匯流排" data-icon="lucide:bus-front" data-href="/services/event-bus">
    實現事件驅動架構。發布自訂事件並訂閱來自其他元件的事件，從而實現解耦、可擴展的通訊。
  </x-card>
</x-cards>

這些服務是建構互動式和整合式 Blocklet 應用程式的支柱。深入了解每個服務的專屬部分，以了解其全部功能並查看實際範例。

---

接下來，讓我們探索如何使用 [Blocklet 服務](./services-blocklet-service.md) 來管理您應用程式的使用者和設定。