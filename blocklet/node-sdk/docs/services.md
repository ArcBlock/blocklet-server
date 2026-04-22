# Services

The Blocklet SDK abstracts away the complexity of direct API calls by providing a suite of powerful service clients. These clients offer a clean, programmatic interface to interact with core Blocklet functionalities, such as user management, real-time notifications, and inter-component event handling. By using these services, you can build more robust and feature-rich applications with less code.

These services act as the bridge between your application and the underlying Blocklet Server, handling authentication, request formatting, and error handling for you.

<!-- DIAGRAM_IMAGE_START:architecture:4:3 -->
![Services](assets/diagram/services-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

Explore the core services provided by the SDK:

<x-cards data-columns="3">
  <x-card data-title="Blocklet Service" data-icon="lucide:user-cog" data-href="/services/blocklet-service">
    Programmatically manage users, roles, permissions, and access keys. It also provides methods to retrieve blocklet metadata and component information.
  </x-card>
  <x-card data-title="Notification Service" data-icon="lucide:bell-ring" data-href="/services/notification-service">
    Engage with your users by sending real-time notifications and handling incoming messages. Supports direct-to-user messages and public channel broadcasts.
  </x-card>
  <x-card data-title="Event Bus" data-icon="lucide:bus-front" data-href="/services/event-bus">
    Implement an event-driven architecture. Publish custom events and subscribe to events from other components, enabling decoupled, scalable communication.
  </x-card>
</x-cards>

These services are the pillars for building interactive and integrated Blocklet applications. Dive into each service's dedicated section to understand its full capabilities and see practical examples.

---

Next, let's explore how to manage your application's users and settings with the [Blocklet Service](./services-blocklet-service.md).