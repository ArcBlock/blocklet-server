import { DataTypes, QueryInterface } from 'sequelize';
import { addColumnIfNotExists, removeColumnIfExists } from '../../migrate';

const createOrgMigration = () => ({
  // eslint-disable-next-line import/prefer-default-export
  up: async ({ context }: { context: QueryInterface }) => {
    await addColumnIfNotExists(context, 'orgs', 'avatar', {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  },

  down: async ({ context }: { context: QueryInterface }) => {
    await removeColumnIfExists(context, 'orgs', 'avatar');
  },
});

export default createOrgMigration;
