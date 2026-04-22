import { TTag } from '@abtnode/types';
import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type TagState = TTag;

export function createTagModel(): DynamicModel<TagState> {
  return class Tag extends Model<TagState> {
    // CAUTION: do not edit this
    public static readonly GENESIS_ATTRIBUTES = {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      color: {
        type: DataTypes.STRING(8),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
          slug: {
            type: DataTypes.STRING(128),
            allowNull: true,
          },
          type: {
            type: DataTypes.STRING(128),
            allowNull: true,
          },
          componentDid: {
            type: DataTypes.STRING(120),
            allowNull: true,
          },
          parentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
          },
          createdBy: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
          updatedBy: {
            type: DataTypes.STRING(80),
            allowNull: true,
          },
        },
        {
          sequelize,
          modelName: 'Tag',
          tableName: 'tags',
          indexes: [{ fields: ['title'], unique: true }],
          timestamps: true,
        }
      );
    }

    public static associate(models) {
      Tag.belongsToMany(models.User, {
        through: {
          model: models.Tagging,
          scope: {
            taggableType: 'user',
          },
        },
        constraints: false,
        foreignKey: 'tagId',
        otherKey: 'taggableId',
        as: 'users',
      });
    }
  };
}
