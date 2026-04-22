import { safeAddIndex } from '../../migrate';

/**
 * Add index on status column for blocklet_children table
 * This improves performance for GROUP BY COUNT queries used in heartbeat
 * Without this index, queries scanning 10K+ children are inefficient
 */
export const up = async ({ context }: any) => {
  // Add index on status for efficient GROUP BY aggregation
  await safeAddIndex(context, 'blocklet_children', ['status']);

  // Add composite index for common query patterns
  // This helps with queries that filter by parentBlockletId and group by status
  await safeAddIndex(context, 'blocklet_children', ['parentBlockletId', 'status']);
};

export const down = async ({ context }: any) => {
  try {
    await context.removeIndex('blocklet_children', 'blocklet_children_status_index');
  } catch {
    // Index may not exist
  }
  try {
    await context.removeIndex('blocklet_children', 'blocklet_children_parentBlockletId_status_index');
  } catch {
    // Index may not exist
  }
};
