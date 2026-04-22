# Event Bus

The Event Bus provides a powerful publish-subscribe mechanism that allows different components within your blocklet and even across different blocklets (within the same ABT Node instance) to communicate with each other in a decoupled manner. This is ideal for broadcasting system-wide state changes or events without components having direct dependencies on one another.

While the [Notification Service](./services-notification-service.md) is designed for sending targeted messages to users, the Event Bus is designed for internal, component-to-component communication.

### How It Works

The Event Bus facilitates an asynchronous communication flow:

1.  A **Publisher** component sends an event with a specific name and payload.
2.  The Blocklet SDK sends this event to the central Event Bus service running in ABT Node.
3.  The Event Bus service then broadcasts this event to all **Subscriber** components that are listening for that event type.

This process is visualized in the diagram below:

<!-- DIAGRAM_IMAGE_START:architecture:16:9 -->
![Event Bus](assets/diagram/event-bus-diagram-0.jpg)
<!-- DIAGRAM_IMAGE_END -->

## API Reference

### publish

Publishes an event to the event bus, making it available to all subscribed listeners. This is an asynchronous operation.

#### Parameters

<x-field-group>
  <x-field data-name="name" data-type="string" data-required="true">
    <x-field-desc markdown>The name of the event, e.g., `user.created` or `order.shipped`.</x-field-desc>
  </x-field>
  <x-field data-name="event" data-type="object" data-required="true">
    <x-field-desc markdown>An object containing the event details.</x-field-desc>
    <x-field data-name="id" data-type="string" data-required="false">
        <x-field-desc markdown>A unique ID for the event. If not provided, one will be generated automatically.</x-field-desc>
    </x-field>
    <x-field data-name="time" data-type="string" data-required="false">
        <x-field-desc markdown>An ISO 8601 timestamp for when the event occurred. Defaults to the current time.</x-field-desc>
    </x-field>
    <x-field data-name="data" data-type="object" data-required="true">
        <x-field-desc markdown>The main payload of the event. It can contain any JSON-serializable data. The `object_type` and `object_id` fields from this object will be promoted to the top-level event object for easier filtering.</x-field-desc>
    </x-field>
  </x-field>
</x-field-group>

#### Example

```javascript Publishing a user creation event icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

async function createUser(userData) {
  // ... logic to create the user in the database
  const newUser = { id: 'user_123', name: 'John Doe' };

  try {
    await eventbus.publish('user.created', {
      data: {
        object_type: 'User',
        object_id: newUser.id,
        object: newUser,
        source_system: 'admin_panel',
      },
    });
    console.log('User creation event published successfully.');
  } catch (error) {
    console.error('Failed to publish event:', error);
  }

  return newUser;
}
```

### subscribe

Registers a callback function to be executed whenever an event is received from the event bus. Note that a component will not receive events that it published itself.

#### Parameters

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>A callback function that will be invoked with the event object when an event is received.</x-field-desc>
  </x-field>
</x-field-group>


#### Event Object Structure (`TEvent`)

The callback function receives a single argument: the event object. This object has a standardized structure based on the CloudEvents specification.

<x-field-group>
  <x-field data-name="id" data-type="string" data-required="true" data-desc="Unique identifier for the event instance."></x-field>
  <x-field data-name="source" data-type="string" data-required="true">
    <x-field-desc markdown>The DID of the component that published the event.</x-field-desc>
  </x-field>
  <x-field data-name="type" data-type="string" data-required="true">
    <x-field-desc markdown>The name of the event (e.g., `user.created`).</x-field-desc>
  </x-field>
  <x-field data-name="time" data-type="string" data-required="true">
    <x-field-desc markdown>ISO 8601 timestamp of when the event was created.</x-field-desc>
  </x-field>
  <x-field data-name="spec_version" data-type="string" data-required="true" data-desc="The CloudEvents specification version, e.g., '1.0.0'."></x-field>
  <x-field data-name="object_type" data-type="string" data-required="false">
    <x-field-desc markdown>The type of the primary object in the event data (e.g., `User`).</x-field-desc>
  </x-field>
  <x-field data-name="object_id" data-type="string" data-required="false">
    <x-field-desc markdown>The ID of the primary object in the event data.</x-field-desc>
  </x-field>
  <x-field data-name="data" data-type="object" data-required="true">
    <x-field-desc markdown>The detailed payload of the event.</x-field-desc>
      <x-field data-name="type" data-type="string" data-desc="Content type of the data, defaults to 'application/json'."></x-field>
      <x-field data-name="object" data-type="any" data-desc="The actual data payload."></x-field>
      <x-field data-name="previous_attributes" data-type="any" data-desc="For update events, this may contain the state of the object before the change."></x-field>
  </x-field>
</x-field-group>

#### Example

```javascript Subscribing to events icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

const handleEvent = (event) => {
  console.log(`Received event of type: ${event.type}`);
  console.log('Event details:', event);

  if (event.type === 'user.created') {
    console.log(`A new user was created with ID: ${event.object_id}`);
    // Update UI or perform other actions
  }
};

eventbus.subscribe(handleEvent);

console.log('Listening for events from the event bus...');
```

### unsubscribe

Removes a previously registered event listener. It's crucial to call this function when a component unmounts or no longer needs to listen for events to prevent memory leaks.

#### Parameters

<x-field-group>
  <x-field data-name="cb" data-type="(event: TEvent) => void" data-required="true">
    <x-field-desc markdown>The **exact same** callback function reference that was passed to `subscribe`.</x-field-desc>
  </x-field>
</x-field-group>

#### Example

To properly unsubscribe, you must keep a reference to the original callback function.

```javascript Full subscription lifecycle icon=logos:javascript
import eventbus from '@blocklet/sdk/service/eventbus';

// 1. Define the handler function
const onUserEvent = (event) => {
  console.log(`User event received: ${event.type}`);
};

// 2. Subscribe to the event bus
eventbus.subscribe(onUserEvent);
console.log('Subscribed to user events.');

// ... later in your application's lifecycle (e.g., component unmount)

// 3. Unsubscribe using the same function reference
eventbus.unsubscribe(onUserEvent);
console.log('Unsubscribed from user events.');
```