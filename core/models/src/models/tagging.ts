import { DataTypes, Model } from 'sequelize';
import { DynamicModel } from '../types';

export type TaggingState = {
  tagId: number;
  taggableId: string;
};

export function createTaggingModel(): DynamicModel<TaggingState> {
  return class Tagging extends Model<TaggingState> {
    // CAUTION: do not edit this
    public static readonly GENESIS_ATTRIBUTES = {
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      taggableId: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      taggableType: {
        type: DataTypes.STRING(16),
        allowNull: false,
      },
    };

    public static initialize(sequelize: any): void {
      this.init(
        {
          ...this.GENESIS_ATTRIBUTES,
        },
        {
          sequelize,
          modelName: 'Tagging',
          tableName: 'tagging',
          indexes: [{ fields: ['tagId', 'taggableId'], unique: true }],
          timestamps: false,
        }
      );
    }
  };
}
