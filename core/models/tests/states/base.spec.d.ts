import { Model, Sequelize } from 'sequelize';
type SimpleModelState = {
    id: string;
    key: string;
    value: number;
    object: Record<string, any>;
    array: any[];
    createdAt: Date;
    updatedAt: Date;
    startedAt: Date;
};
export declare class SimpleModel extends Model<SimpleModelState> {
    static initialize(sequelize: Sequelize): void;
}
export {};
