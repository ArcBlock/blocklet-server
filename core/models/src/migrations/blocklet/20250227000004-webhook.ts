import type { QueryInterface } from 'sequelize';
import { getBlockletModels } from '../../models';
import { createTableIfNotExists, dropTableIfExists, safeAddIndex } from '../../migrate';

const models = getBlockletModels();

export const up = async ({ context }: { context: QueryInterface }) => {
  await createTableIfNotExists(context, 'webhook_endpoints', models.WebhookEndpoint.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'webhook_attempts', models.WebhookAttempt.GENESIS_ATTRIBUTES);
  await createTableIfNotExists(context, 'webhook_events', models.WebhookEvent.GENESIS_ATTRIBUTES);

  await safeAddIndex(context, 'webhook_events', ['source']);
  await safeAddIndex(context, 'webhook_events', ['type']);
  await safeAddIndex(context, 'webhook_events', ['createdAt']);
  await safeAddIndex(context, 'webhook_events', ['updatedAt']);

  await safeAddIndex(context, 'webhook_attempts', ['webhookId']);
  await safeAddIndex(context, 'webhook_attempts', ['eventId']);
  await safeAddIndex(context, 'webhook_attempts', ['eventId', 'webhookId', 'responseStatus']);

  await safeAddIndex(context, 'webhook_endpoints', ['url']);
};

export const down = async ({ context }: { context: QueryInterface }) => {
  await context.removeIndex('webhook_events', ['source']);
  await context.removeIndex('webhook_events', ['type']);
  await context.removeIndex('webhook_events', ['createdAt']);
  await context.removeIndex('webhook_events', ['updatedAt']);

  await context.removeIndex('webhook_attempts', ['webhookId']);
  await context.removeIndex('webhook_attempts', ['eventId']);
  await context.removeIndex('webhook_attempts', ['eventId', 'webhookId', 'responseStatus']);

  await context.removeIndex('webhook_endpoints', ['url']);

  await dropTableIfExists(context, 'webhook_endpoints');
  await dropTableIfExists(context, 'webhook_attempts');
  await dropTableIfExists(context, 'webhook_events');
};
