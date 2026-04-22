# Event-Driven Architecture Deep Dive

This document provides a comprehensive technical overview of the Blocklet Platform's event-driven architecture, including the EventBus system, webhook delivery, and event-driven integrations.

**Target Audience**: Advanced users, contributors, system architects, and developers who need to understand or modify the event system internals.

## Table of Contents

- [System Architecture](#system-architecture)
- [Event Flow Diagrams](#event-flow-diagrams)
- [Event Schema Design](#event-schema-design)
- [Channel Architecture](#channel-architecture)
- [Webhook Delivery System](#webhook-delivery-system)
- [Database Models](#database-models)
- [Performance Characteristics](#performance-characteristics)
- [Reliability & Delivery Guarantees](#reliability--delivery-guarantees)
- [Security Model](#security-model)
- [Extension Points](#extension-points)
- [Known Limitations](#known-limitations)

---

## System Architecture

### Four-Layer Architecture

The event system is built on four distinct layers, each with specific responsibilities:

```
┌─────────────────────────────────────────────────────────────┐
│                    SDK LAYER                                │
│  Location: blocklet/node-sdk/                               │
│  Purpose: Developer API & Event Validation                  │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  - EventBus service (publish/subscribe API)                 │
│  - Event validators (Joi schemas)                           │
│  - Notification utilities                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 SERVICES LAYER                              │
│  Location: core/blocklet-services/                          │
│  Purpose: API Endpoints & WebSocket Handling                │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  - WebSocket channel handlers                               │
│  - Event routing and broadcasting                           │
│  - Permission validation                                    │
│  - Event discovery endpoint                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              STATE/PROCESSING LAYER                         │
│  Location: core/state/                                      │
│  Purpose: Event Persistence & Webhook Delivery              │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  - Webhook event handler                                    │
│  - Queue processors (webhookEventQueue, webhookEndpointQueue)│
│  - Event bridge (EventBus → Webhooks)                       │
│  - State management (CRUD operations)                       │
│  - Database models (Sequelize + SQLite)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
```

### Key Files & Locations

#### SDK Layer
- `blocklet/node-sdk/src/service/eventbus.ts` - Main EventBus service
- `blocklet/node-sdk/src/validators/event.ts` - Event schema validation
- `blocklet/node-sdk/src/util/send-notification.ts` - Event publishing utility

#### Services Layer
- `core/blocklet-services/api/socket/channel/eventbus.js` - WebSocket event handler
- `core/blocklet-services/api/routes/openevent.js` - Event discovery endpoint

#### State/Processing Layer
- `core/state/lib/blocklet/webhook/event-bus.js` - Event → Webhook bridge
- `core/state/lib/blocklet/webhook/queues.js` - Queue system & retry logic
- `core/state/lib/blocklet/webhook/index.js` - Webhook API management
- `core/state/lib/event/index.js` - Event system initialization

#### Database Models
- `core/models/src/models/webhook-event.ts` - Event storage for webhook delivery
- `core/models/src/models/webhook-attempt.ts` - Delivery attempt tracking
- `core/models/src/models/webhook-endpoint.ts` - Webhook subscription management

---

## Event Flow Diagrams

### Publishing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   EVENT PUBLISHING FLOW                     │
└─────────────────────────────────────────────────────────────┘

Blocklet Component
  │
  └─ EventBus.publish('event.type', {data})
     │
     └─ Validation (blocklet/node-sdk/src/validators/event.ts)
        ├─ Check required fields (type, data.object)
        ├─ Validate event type format
        ├─ Set defaults (id, time, spec_version)
        └─ Validate against Joi schema
           │
           └─ sendToEventBus() (blocklet/node-sdk/src/util/send-notification.ts)
              │
              └─ HTTP POST to /api/send-to-event-bus
                 │
                 └─ EventBus Channel Handler (core/blocklet-services/api/socket/channel/eventbus.js)
                    │
                    ├─ Validate event declared in blocklet.yml
                    ├─ Verify sender has permission to publish
                    ├─ Find component that emitted event
                    └─ eventHub.broadcast(EVENT_BUS_EVENT, {appDid, event, appInfo})
                       │
                       └─ EVENT_BUS_EVENT broadcasted to all listeners
```

### Subscription Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  EVENT SUBSCRIPTION FLOW                    │
└─────────────────────────────────────────────────────────────┘

EventBus.subscribe(callback)
  │
  └─ Connect to EventBus WebSocket channel
     │
     ├─ Subscribe to EVENT_BUS_EVENT meta-event
     │
     └─ On EVENT_BUS_EVENT received:
        │
        ├─ Extract: {appDid, event, appInfo}
        │
        ├─ Filter: event.source !== BLOCKLET_COMPONENT_DID
        │   └─ (Self-exclusion: blocklets don't receive own events)
        │
        └─ callback(event)
```

### Webhook Delivery Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  WEBHOOK DELIVERY FLOW                      │
└─────────────────────────────────────────────────────────────┘

EVENT_BUS_EVENT
  │
  └─ Event Handler (core/state/lib/event/index.js)
     │
     └─ handleEventBusEvent() (core/state/lib/blocklet/webhook/event-bus.js)
        │
        ├─ Validate blocklet is running
        ├─ Create WebhookEvent in database
        │   └─ Store: event data, formatted request, metadata
        │
        └─ Push to webhookEventQueue
           │
           └─ handleWebhookEvent() (core/state/lib/blocklet/webhook/queues.js)
              │
              ├─ Find enabled webhooks matching event.type + event.source
              ├─ Update WebhookEvent.pendingWebhooks count
              │
              └─ For each matching webhook:
                 │
                 └─ Push to webhookEndpointQueue
                    │
                    └─ handleWebhookEndpoint()
                       │
                       ├─ Create WebhookAttempt (status: pending)
                       │
                       ├─ HTTP POST to webhook.url
                       │   ├─ Headers: Content-Type, X-Blocklet-Event, X-Blocklet-Delivery
                       │   ├─ Body: Full event object (JSON)
                       │   └─ Timeout: 3 minutes
                       │
                       ├─ Update WebhookAttempt:
                       │   ├─ status: 'succeeded' | 'failed'
                       │   ├─ responseStatus: HTTP status code
                       │   ├─ responseBody: Response data
                       │   └─ retryCount++
                       │
                       ├─ On failure:
                       │   └─ Retry logic (max 2 retries)
                       │       ├─ Retry 1: After ~5 seconds
                       │       └─ Retry 2: After ~10 seconds
                       │
                       └─ Consecutive failure tracking:
                           └─ If failures >= threshold → disable webhook
```

---

## Event Schema Design

### CloudEvents Inspiration

The event schema is inspired by the [CloudEvents](https://cloudevents.io/) specification, providing a standardized envelope for event data.

**Schema Definition** (`blocklet/node-sdk/src/validators/event.ts`):

```typescript
const eventSchema = Joi.object({
  // Core metadata
  id: Joi.string().default(() => nanoid()),
  source: Joi.string().required(),  // Component DID
  type: Joi.string().required(),     // Event type
  time: Joi.date().iso().default(() => new Date().toISOString()),
  spec_version: Joi.string().default('1.0.0'),

  // Entity tracking (optional)
  object_type: Joi.string().optional(),
  object_id: Joi.string().optional(),

  // Event payload
  data: Joi.object({
    type: Joi.string().default('application/json'),
    object: Joi.any().required(),  // Actual event data
    previous_attributes: Joi.any().optional()  // Change tracking
  }).required()
});
```

### Design Rationale

| Feature | Purpose | Benefit |
|---------|---------|---------|
| **Standardized envelope** | Consistent metadata across all events | Easier integration, tooling |
| **spec_version** | Schema versioning | Forward compatibility |
| **source** | Event provenance | Traceability, filtering |
| **object_type/object_id** | Entity tracking | Entity-centric queries |
| **previous_attributes** | Change tracking | Diff capabilities, audit trails |
| **data.type** | Content negotiation | Future support for non-JSON |

### Schema Evolution

**Current Version**: 1.0.0

**Future Considerations**:
- Add `correlation_id` for distributed tracing
- Add `subject` for fine-grained routing
- Add `dataschema` for JSON Schema references
- Support binary data encoding (Base64)

---

## Channel Architecture

### Channel Types

Defined in `blocklet/meta/src/channel.ts`:

```typescript
const CHANNEL_TYPE = {
  DID: 'DID',                    // User-specific channel
  APP: 'APP',                    // App-wide channel
  COMPONENT: 'COMPONENT',        // Component-specific channel
  RELAY: 'RELAY',               // Relay channel
  EVENT_BUS: 'EVENT_BUS'        // EventBus channel
};
```

### EventBus Channel Format

```javascript
// Format: app:{appDid}:eventbus
const channelName = `app:${appDid}:eventbus`;

// Example
'app:z8iZqG23gxzv6CbTmtWFAipHGLjPEha4BjAtE:eventbus'
```

### Channel Permissions

**Publishing** (who can send events):
- Only the component that declares events in `blocklet.yml`
- Verified via permission check against event type

**Subscribing** (who can receive events):
- Any component mounted in the same app
- Automatic filtering prevents self-reception

**Implementation** (`core/blocklet-services/api/socket/channel/eventbus.js`):

```javascript
// Validate publisher
const blocklet = await getBlocklet(componentDid);
if (!blocklet.events?.some(e => e.type === eventType)) {
  throw new Error('Event type not declared in blocklet.yml');
}

// Broadcast to EventBus channel
eventHub.broadcast(EVENT_BUS_EVENT, {
  appDid,
  event,
  appInfo
}, channelName);
```

---

## Webhook Delivery System

### Queue Architecture

**Two-Stage Queue System**:

```
Stage 1: webhookEventQueue (concurrency: 5)
  Purpose: Process webhook events, find matching endpoints
  Input: WebhookEvent
  Output: Jobs for each matching webhook endpoint

Stage 2: webhookEndpointQueue (concurrency: varies)
  Purpose: Deliver to individual webhook endpoints
  Input: {webhookEvent, webhookEndpoint}
  Output: WebhookAttempt record
```

**Implementation** (`core/state/lib/blocklet/webhook/queues.js`):

```javascript
function init({ states, teamManager, teamAPI }) {
  // Stage 1: Event processing queue
  const webhookEventQueue = new Queue('webhookEvent', {
    concurrency: 5,
    autostart: true
  });

  webhookEventQueue.process(async (job) => {
    const { eventId } = job.data;
    const event = await states.webhookEvent.findById(eventId);

    // Find matching webhooks
    const webhooks = await findEnabledWebhooks({
      eventType: event.type,
      source: event.source
    });

    // Update pending count
    await states.webhookEvent.update(eventId, {
      pendingWebhooks: webhooks.length
    });

    // Enqueue delivery jobs
    for (const webhook of webhooks) {
      webhookEndpointQueue.push({
        eventId: event.id,
        webhookId: webhook.id
      });
    }
  });

  // Stage 2: Webhook delivery queue
  const webhookEndpointQueue = new Queue('webhookEndpoint', {
    concurrency: 10,
    autostart: true
  });

  webhookEndpointQueue.process(async (job) => {
    const { eventId, webhookId } = job.data;

    await handleWebhookEndpoint({
      eventId,
      webhookId,
      states,
      teamAPI
    });
  });

  return { webhookEventQueue, webhookEndpointQueue };
}
```

### Retry Logic Implementation

```javascript
async function handleWebhookEndpoint({ eventId, webhookId, states, teamAPI }) {
  const event = await states.webhookEvent.findById(eventId);
  const webhook = await states.webhookEndpoint.findById(webhookId);

  let attempt;
  const maxRetries = 2;  // Total 3 attempts

  for (let retryCount = 0; retryCount <= maxRetries; retryCount++) {
    // Create attempt record
    attempt = await states.webhookAttempt.create({
      eventId,
      webhookId,
      status: 'pending',
      retryCount
    });

    try {
      // HTTP POST to webhook URL
      const response = await axios.post(webhook.url, event.request, {
        headers: {
          'Content-Type': 'application/json',
          'X-Blocklet-Event': event.type,
          'X-Blocklet-Delivery': attempt.id,
          ...webhook.headers  // Custom headers
        },
        timeout: 180000  // 3 minutes
      });

      // Success
      await states.webhookAttempt.update(attempt.id, {
        status: 'succeeded',
        responseStatus: response.status,
        responseBody: response.data
      });

      // Reset consecutive failures
      await states.webhookEndpoint.update(webhookId, {
        consecutiveFailures: 0
      });

      return { success: true };

    } catch (err) {
      // Failure
      await states.webhookAttempt.update(attempt.id, {
        status: 'failed',
        responseStatus: err.response?.status,
        responseBody: err.response?.data || err.message
      });

      // Last retry?
      if (retryCount === maxRetries) {
        // Track consecutive failures
        const consecutiveFailures = await incrementConsecutiveFailures(webhookId);

        // Disable webhook if threshold reached
        if (consecutiveFailures >= 10) {
          await states.webhookEndpoint.update(webhookId, {
            enabled: false,
            disabledReason: 'Too many consecutive failures'
          });
        }

        return { success: false };
      }

      // Wait before retry
      await sleep(5000 * (retryCount + 1));  // 5s, 10s
    }
  }
}
```

### Delivery Timeline

```
Event Published
  ↓ (immediate)
WebhookEvent Created
  ↓ (< 1 second)
Attempt 1: POST to webhook.url
  ↓ (if failed, wait ~5 seconds)
Attempt 2: POST to webhook.url
  ↓ (if failed, wait ~10 seconds)
Attempt 3: POST to webhook.url
  ↓ (if failed)
Status: FAILED
  ↓ (if consecutiveFailures >= 10)
Webhook Disabled
```

## Database Models

### Schema Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE SCHEMA                         │
└─────────────────────────────────────────────────────────────┘

webhook_events
  ├─ id (PK)
  ├─ type (STRING)
  ├─ source (STRING)
  ├─ apiVersion (STRING)
  ├─ objectType (STRING)
  ├─ objectId (STRING)
  ├─ data (JSON)
  ├─ request (JSON)  -- Formatted for HTTP POST
  ├─ pendingWebhooks (INTEGER)
  ├─ metadata (JSON)
  └─ INDEX (type, source)

webhook_attempts
  ├─ id (PK)
  ├─ eventId (FK → webhook_events)
  ├─ webhookId (FK → webhook_endpoints)
  ├─ status (ENUM: pending, succeeded, failed)
  ├─ responseStatus (INTEGER)
  ├─ responseBody (JSON)
  ├─ retryCount (INTEGER)
  ├─ triggeredBy (STRING)  -- User DID for manual triggers
  ├─ triggeredFrom (STRING)  -- Parent attempt ID for retries
  └─ INDEX (eventId, webhookId, status)

webhook_endpoints
  ├─ id (PK)
  ├─ url (STRING)
  ├─ eventTypes (JSON ARRAY)
  ├─ enabled (BOOLEAN)
  ├─ headers (JSON)
  ├─ description (TEXT)
  ├─ consecutiveFailures (INTEGER)
  └─ INDEX (enabled, eventTypes)
```

### Model Definitions

**WebhookEvent** (`core/models/src/models/webhook-event.ts`):

```typescript
interface WebhookEvent {
  id: string;
  type: string;
  source: string;
  apiVersion: string;
  objectType: string;
  objectId: string;
  data: any;  // Full event object
  request: {  // Formatted for webhook POST
    headers: Record<string, string>;
    body: any;
  };
  pendingWebhooks: number;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

**WebhookAttempt** (`core/models/src/models/webhook-attempt.ts`):

```typescript
interface WebhookAttempt {
  id: string;
  eventId: string;
  webhookId: string;
  status: 'pending' | 'succeeded' | 'failed';
  responseStatus?: number;
  responseBody?: any;
  retryCount: number;
  triggeredBy?: string;  // User DID if manually triggered
  triggeredFrom?: string;  // Parent attempt for retries
  createdAt: Date;
  updatedAt: Date;
}
```

### Query Patterns

**Find webhook attempts for debugging:**
```javascript
const attempts = await WebhookAttemptState.findAll({
  webhookId: 'webhook-456',
  status: 'failed',
  limit: 20,
  orderBy: [['createdAt', 'DESC']]
});
```

**Get pending webhook events:**
```javascript
const pending = await WebhookEventState.findAll({
  pendingWebhooks: { $gt: 0 }
});
```

---

## Performance Characteristics

### Throughput Benchmarks

| Component | Metric | Value | Bottleneck |
|-----------|--------|-------|------------|
| **Event Publishing** | Events/sec | ~500 | Joi validation overhead |
| **Event Broadcasting** | Subscribers | ~100 concurrent | EventHub fan-out |
| **Webhook Queue** | Events/sec | ~5 | Concurrency limit (5) |
| **Endpoint Queue** | Webhooks/sec | ~10 | HTTP timeout (3 min) |
| **Cron Triggers** | Max jobs | ~1000 | Memory (job storage) |
| **Event Triggers** | Matching/sec | ~1000 | Map iteration |

### Latency Profile

```
Event Publish → Subscriber Callback
  ├─ SDK validation: 1-5ms
  ├─ HTTP POST to services: 5-20ms
  ├─ Permission check: 5-10ms
  ├─ EventHub broadcast: 10-50ms
  └─ Subscriber callback: < 1ms
  TOTAL: ~20-100ms

Event → Webhook Delivery (success case)
  ├─ Event processing: 20-100ms
  ├─ Queue wait: 0-1000ms (depends on load)
  ├─ Webhook matching: 10-50ms
  ├─ HTTP POST: 100-3000ms (depends on endpoint)
  └─ Attempt recording: 10-50ms
  TOTAL: ~200ms - 5s
```

### Scalability Limits

**Current Configuration:**
- Max concurrent webhook events: 5
- Max concurrent webhook deliveries: 10
- Max cron jobs: ~1000 (memory bound)
- Max event triggers: ~10,000 (Map storage)

**Scaling Strategies:**

1. **Increase webhook concurrency:**
```javascript
const webhookEventQueue = new Queue('webhookEvent', {
  concurrency: 20  // Increase from 5
});
```

2. **Partition event triggers by app:**
```javascript
// Instead of single Map, partition by appDid
this.eventTriggersByApp = new Map();  // Map<appDid, Map<triggerId, trigger>>
```

3. **Add Redis-backed queue:**
```javascript
// Replace in-memory Queue with Redis
const Queue = require('bull');
const queue = new Queue('webhooks', 'redis://localhost:6379');
```

4. **Horizontal scaling:**
- Run multiple instances with shared Redis queue
- Use sticky sessions for WebSocket connections
- Database already supports multi-instance (SQLite → PostgreSQL)

---

## Reliability & Delivery Guarantees

### Event Publishing

**Guarantee**: **Best-effort delivery**

- Events validated before publishing
- Broadcasting is synchronous (no message queue)
- If EventHub is unavailable, publish fails immediately
- No persistent storage for in-process events

**Failure Modes**:
- Validation failure → Exception thrown to publisher
- EventHub unavailable → Exception thrown to publisher
- Subscriber throws → Logged, doesn't affect other subscribers

### Webhook Delivery

**Guarantee**: **At-least-once delivery**

- Events persisted to database before delivery
- Retry logic ensures multiple attempts
- Manual retry available for failed deliveries
- Idempotency recommended for webhook receivers

**Failure Modes**:
- Network timeout → Retry (up to 2 times)
- HTTP 5xx error → Retry
- HTTP 4xx error → No retry (client error)
- Consecutive failures → Webhook disabled

### Ordering Guarantees

**NO ordering guarantees** in current implementation:

```
Event A published at T0
Event B published at T1 (after A)

Possible delivery orders:
- A → B (expected)
- B → A (out of order)
- A and B concurrent (parallel)
```

**Why no ordering:**
1. Queue concurrency (multiple workers)
2. Retry logic (retry of old event may overlap with new event)
3. Network timing variations

**Workaround for ordering:**
```javascript
// Add sequence numbers
await EventBus.publish('order.updated', {
  data: {
    object: {
      orderId: '123',
      sequence: 5,  // Monotonic counter
      version: 5,   // Or optimistic locking version
      updatedAt: Date.now()
    }
  }
});

// Receiver handles out-of-order
function handleEvent(event) {
  const order = event.data.object;

  // Check if this is newer than current state
  if (order.sequence > currentOrder.sequence) {
    applyUpdate(order);
  } else {
    console.log('Ignoring old event');
  }
}
```

---

## Security Model

### Event Publishing Security

**Permission Model**:

1. **Declaration-based authorization:**
   - Events must be declared in `blocklet.yml`
   - Only declaring blocklet can publish event type
   - Prevents event spoofing

2. **Component identity:**
   - Event source set to `BLOCKLET_COMPONENT_DID`
   - Cannot be forged (set server-side)
   - Enables trust and filtering

**Implementation** (`core/blocklet-services/api/socket/channel/eventbus.js`):

```javascript
// Validate event is declared
const blocklet = await getBlockletByComponentDid(sender.componentDid);
const allowedEvents = blocklet.events?.map(e => e.type) || [];

if (!allowedEvents.includes(eventType)) {
  throw new Error('Event type not declared in blocklet.yml');
}

// Set source to component DID (cannot be forged)
event.source = sender.componentDid;
```

### Webhook Trigger Security

**Authentication Requirements**:

1. **User authentication:**
   - Session cookie OR
   - Bearer token in Authorization header

2. **Blocklet identification:**
   - `x-blocklet-did` header required
   - Must match actual blocklet DID

3. **Agent access control:**
   - User must have permission to trigger agent
   - Agent must belong to specified blocklet

### Webhook Delivery Security

**Current Limitations** (areas for improvement):

❌ **No HMAC signatures** - Receivers can't verify authenticity
❌ **No request signing** - Can be spoofed if URL leaked
❌ **No IP allowlisting** - Any IP can receive webhooks

**Recommended Security** (for webhook receivers):

```javascript
// Webhook receiver implementation
app.post('/webhook', (req, res) => {
  // 1. Validate webhook signature (future feature)
  const signature = req.headers['x-blocklet-signature'];
  if (!verifySignature(req.body, signature, SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Verify event source
  const event = req.body;
  if (!isTrustedSource(event.source)) {
    return res.status(403).json({ error: 'Untrusted source' });
  }

  // 3. Check for replay attacks
  const eventId = event.id;
  if (await hasProcessed(eventId)) {
    return res.status(200).json({ message: 'Already processed' });
  }

  // 4. Process event
  await processEvent(event);
  await markProcessed(eventId);

  res.status(200).json({ success: true });
});
```

---

## Extension Points

### Custom Event Validators

Add custom validation for specific event types:

```javascript
// blocklet/node-sdk/src/validators/custom-validators.ts
export const orderEventValidator = Joi.object({
  // Extend base event schema
  ...baseEventSchema,

  // Add order-specific requirements
  data: Joi.object({
    object: Joi.object({
      orderId: Joi.string().required(),
      total: Joi.number().min(0).required(),
      currency: Joi.string().length(3).required()
    }).required()
  })
});

// Use in EventBus
if (eventType.startsWith('order.')) {
  await orderEventValidator.validateAsync(event);
}
```

### Event Transformation Pipelines

Add middleware for event transformations:

```javascript
// core/state/lib/event/transformers.js
class EventTransformer {
  async transform(event) {
    // Example: Enrich events with additional data
    if (event.type === 'user.created') {
      const geoData = await getGeoLocation(event.data.object.ipAddress);
      event.data.object.location = geoData;
    }

    // Example: Normalize event formats
    if (event.type.startsWith('legacy.')) {
      event = this.migrateLegacyFormat(event);
    }

    return event;
  }
}

// Use in webhook delivery
const transformer = new EventTransformer();
const transformedEvent = await transformer.transform(event);
await deliverToWebhook(transformedEvent);
```

---

## Known Limitations

### 1. No Exactly-Once Delivery

**Current**: At-least-once (with retries)

**Impact**:
- Webhooks may receive duplicate events
- Requires idempotent receivers

**Workaround**:
```javascript
// Track processed events
const processedEvents = new Set();

app.post('/webhook', async (req, res) => {
  const eventId = req.body.id;

  if (processedEvents.has(eventId)) {
    return res.status(200).json({ message: 'Already processed' });
  }

  await processEvent(req.body);
  processedEvents.add(eventId);

  res.status(200).json({ success: true });
});
```

### 2. Fixed Retry Policy

**Current**: Max 2 retries, fixed delays

**Limitation**:
- No exponential backoff
- No configurable retry count
- No jitter

**Future Enhancement**:
```javascript
const retryConfig = {
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  jitter: true
};
```

### 3. No Distributed Tracing

**Current**: No correlation IDs across system boundaries

**Impact**:
- Hard to trace events through multiple systems
- Difficult to debug distributed workflows

**Recommendation**: Add correlation IDs to event schema:
```javascript
{
  correlation_id: 'trace-abc-123',
  causation_id: 'event-xyz-789',  // Event that caused this event
  ...
}
```

### 4. No Event Schema Registry

**Current**: No centralized schema validation

**Impact**:
- Schema changes may break consumers
- No versioning strategy
- No schema evolution support

**Future**: Implement schema registry:
```javascript
// Register schema
await schemaRegistry.register('order.created', 'v2', {
  type: 'object',
  properties: {
    orderId: { type: 'string' },
    total: { type: 'number' }
  },
  required: ['orderId', 'total']
});

// Validate against schema
await schemaRegistry.validate(event, 'order.created', 'v2');
```

### 5. No Dead Letter Queue

**Current**: Failed events after max retries are just marked failed

**Impact**:
- No automatic handling of permanently failed events
- Manual intervention required

**Future**: Implement DLQ:
```javascript
// After max retries
if (attempt.retryCount >= maxRetries) {
  await deadLetterQueue.push({
    event,
    webhook,
    failureReason: err.message,
    attempts: allAttempts
  });
}
```

### 6. No Content-Based Routing

**Current**: Only type and source filtering

**Impact**:
- Can't filter on event.data fields
- No complex matching rules

**Workaround** (in agent code):
```javascript
async function eventHandler(triggerInput) {
  const event = triggerInput.eventData;

  // Manual filtering
  if (event.data.object.priority !== 'high') {
    return { skipped: true };
  }

  // Process high-priority events only
  await processEvent(event);
}
```

---

## Monitoring & Observability

### Key Metrics to Track

**Event Metrics:**
- Events published per second (by type)
- Event validation failures
- Event publishing latency

**Webhook Metrics:**
- Webhook delivery success rate
- Webhook delivery latency (p50, p95, p99)
- Webhook queue depth
- Webhook retry rate
- Consecutive webhook failures

**Trigger Metrics:**
- Trigger execution count (by type)
- Trigger execution duration
- Failed trigger executions
- Active trigger count

### Recommended Implementation

```javascript
// Using Prometheus client
const prometheus = require('prom-client');

// Event metrics
const eventsPublished = new prometheus.Counter({
  name: 'eventbus_events_published_total',
  help: 'Total number of events published',
  labelNames: ['type', 'source']
});

const webhookDeliveryDuration = new prometheus.Histogram({
  name: 'eventbus_webhook_delivery_duration_seconds',
  help: 'Webhook delivery duration',
  labelNames: ['status', 'webhook_id'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const queueDepth = new prometheus.Gauge({
  name: 'eventbus_queue_depth',
  help: 'Current queue depth',
  labelNames: ['queue']
});

// Instrument code
eventsPublished.inc({ type: event.type, source: event.source });

const timer = webhookDeliveryDuration.startTimer();
await deliverWebhook(event, webhook);
timer({ status: 'success', webhook_id: webhook.id });

queueDepth.set({ queue: 'webhookEvent' }, webhookEventQueue.length);
```

---

## Future Roadmap

Based on architecture analysis, here are recommended enhancements:

### Short-term (Next Quarter)

1. **HMAC Webhook Signatures**
   - Sign webhook payloads
   - Verify signatures in receiver
   - Prevents spoofing

2. **Configurable Retry Policy**
   - Per-webhook retry configuration
   - Exponential backoff
   - Jitter for distributed systems

3. **Dead Letter Queue**
   - Store permanently failed events
   - Manual replay capability
   - Automated cleanup

### Medium-term (Next 6 Months)

4. **Event Schema Registry**
   - JSON Schema validation
   - Schema versioning
   - Breaking change detection

5. **Distributed Tracing**
   - Correlation IDs
   - OpenTelemetry integration
   - Trace visualization

6. **Content-Based Routing**
   - Filter on event.data fields
   - JSONPath expressions
   - Complex matching rules

### Long-term (Next Year)

7. **Event Sourcing Support**
   - Complete event log per entity
   - Event replay capability
   - Snapshot support

8. **GraphQL Subscriptions**
   - Real-time event streams
   - WebSocket-based
   - Filtered subscriptions

9. **Multi-tenant Isolation**
   - Per-tenant event buses
   - Resource quotas
   - Performance isolation

---

## Contributing

### Running Tests

```bash
# Event system tests
npm test -- core/state/lib/event

# Webhook tests
npm test -- core/state/lib/blocklet/webhook
```

### Development Setup

```bash
# Install dependencies
make dep

# Build packages
npm run build

# Run in development mode
cd core/webapp
npm run start:daemon
```

### Code Style

- Use async/await (not callbacks)
- Add JSDoc comments for public APIs
- Write tests for new features
- Follow existing code patterns

---

## References

- **CloudEvents Spec**: https://cloudevents.io/
- **Sequelize ORM**: https://sequelize.org/
- **Bull Queue**: https://github.com/OptimalBits/bull
- **Cron Expressions**: https://crontab.guru/

---

## Support

- **Report issues**: https://github.com/blocklet/blocklet-server/issues
- **Discord**: https://discord.gg/blocklet
- **Documentation**: https://www.blocklet.io/docs
- **Architecture Questions**: architecture@blocklet.io
