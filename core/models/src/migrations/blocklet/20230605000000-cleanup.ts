import type { QueryInterface } from 'sequelize';

export const up = async ({ context }: { context: QueryInterface }) => {
  await context.bulkDelete('passports', { id: null });
  await context.bulkDelete('connected_accounts', { did: null });
};

export const down = async () => {
  // Do nothing
};
