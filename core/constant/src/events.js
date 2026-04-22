export const EVENTS = {
  NOTIFICATION_CREATE: 'notification.create',
  NOTIFICATION_READ: 'notification.read',
  NOTIFICATION_BLOCKLET_READ: 'blocklet.notification.read',
  NOTIFICATION_BLOCKLET_CREATE: 'notification.blockletCreate',
  NOTIFICATION_BLOCKLET_UPDATE: 'notification.blockletUpdate',
  ROUTING_UPDATED: 'routing.updated',
  NODE_UPDATED: 'node.updated',
  NODE_MAINTAIN_PROGRESS: 'node.upgrade.progress',
  NODE_STARTED: 'node.started',
  NODE_STOPPED: 'node.stopped',
  NODE_ADDED_OWNER: 'node.addedOwner',
  NODE_RUNTIME_INFO: 'node.runtimeInfo',
  BLOCKLETS_RUNTIME_INFO: 'node.blockletsRuntimeInfo',
  DOMAIN_STATUS: 'domain.status',
  CERT_ADDED: 'cert.added',
  CERT_ISSUED: 'cert.issued',
  CERT_UPDATED: 'cert.updated',
  CERT_REMOVED: 'cert.removed',
  CERT_ERROR: 'cert.error',
  RELOAD_GATEWAY: 'gateway.reload',
  NOTIFICATION_CREATE_QUEUED: 'notification.create.queued',
  UPDATE_DOMAIN_ALIAS: 'router.domain.alias.updated',

  WEBHOOK_ATTEMPT: 'webhook.attempt',
};

export const EVENT_BUS_EVENT = 'event-bus';
