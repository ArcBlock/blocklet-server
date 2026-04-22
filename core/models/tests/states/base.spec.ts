import { test, expect, describe, beforeAll, beforeEach, afterAll, mock } from 'bun:test';
import { DataTypes, Model, Op, Sequelize } from 'sequelize';
import { BaseState, generateId, JSONOrJSONB } from '../../src';

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

// eslint-disable-next-line import/prefer-default-export
export class SimpleModel extends Model<SimpleModelState> {
  static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.UUID,
          primaryKey: true,
          defaultValue: DataTypes.UUIDV4,
        },
        key: {
          type: DataTypes.STRING,
        },
        value: {
          type: DataTypes.STRING,
        },
        object: {
          type: JSONOrJSONB(),
          defaultValue: {},
        },
        array: {
          type: JSONOrJSONB(),
          defaultValue: [],
        },
        createdAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
        },
        startedAt: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'SimpleModel',
        timestamps: true,
      }
    );
  }
}

describe('BaseState', () => {
  let sequelize: Sequelize;
  let baseState: BaseState<SimpleModelState>;

  beforeAll(() => {
    sequelize = new Sequelize('sqlite::memory:', { logging: false });
    SimpleModel.initialize(sequelize);
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    baseState = new BaseState(SimpleModel);
  });

  afterAll(async () => {
    try {
      await sequelize.close();
    } catch {
      // Do nothing
    }
  });

  test('find', async () => {
    const doc = {
      key: 'testKey',
      value: 'testValue',
      object: { key: 'value' },
      array: [{ name: 'wang' }, { name: 'shijun' }],
    };
    const doc2 = {
      key: 'testKey2',
      value: 'testValue2',
      object: { key: 'value2' },
      array: [{ name: 'robert' }],
    };
    await baseState.insert(doc);
    await baseState.insert(doc2);

    const assertDoc = (actual: any, expected: any) => {
      expect(actual.key).toEqual(expected.key);
      expect(actual.value).toEqual(expected.value);
      expect(actual.object).toEqual(expected.object);
      expect(actual.array).toEqual(expected.array);
    };

    let result = await baseState.find({ key: 'testKey' });
    expect(result).toHaveLength(1);
    assertDoc(result[0], doc);

    result = await baseState.find({ object: { key: { [Op.eq]: 'value2' } } });
    expect(result).toHaveLength(1);
    assertDoc(result[0], doc2);

    result = await baseState.find({ object: { key: 'value2' } });
    expect(result).toHaveLength(1);
    assertDoc(result[0], doc2);
  });

  test('findOne', async () => {
    const doc = { key: 'testKey', value: 'testValue', object: { key: 'value' } };
    await baseState.insert(doc);

    const result = await baseState.findOne({ key: 'testKey' });
    expect(result.key).toEqual(doc.key);
    expect(result.value as unknown as string).toEqual(doc.value);
    expect(result.object).toEqual(doc.object);
  });

  // Add these test cases inside the describe block in BaseState.test.ts

  test('count', async () => {
    const doc = { key: 'testKey', value: 'testValue' };
    await baseState.insert(doc);

    const count = await baseState.count({ key: 'testKey' });
    expect(count).toEqual(1);
  });

  test('insert', async () => {
    const doc = { key: 'testKey', value: 'testValue' };

    const insertedDoc = await baseState.insert(doc);
    expect(insertedDoc.key).toEqual(doc.key);
    expect(insertedDoc.value as unknown as string).toEqual(doc.value);
  });

  test('insertMany', async () => {
    const docs = [
      { key: 'testKey1', value: 'testValue1', object: { key: 'value' } },
      { key: 'testKey2', value: 'testValue2', object: { key: 'value2' } },
    ];

    const insertedDocs = await baseState.insertMany(docs);
    expect(insertedDocs).toHaveLength(docs.length);
    expect(insertedDocs[0].key).toEqual(docs[0].key);
    expect(insertedDocs[0].value as unknown as string).toEqual(docs[0].value);
    expect(insertedDocs[0].object).toEqual(docs[0].object);
    expect(insertedDocs[1].key).toEqual(docs[1].key);
    expect(insertedDocs[1].value as unknown as string).toEqual(docs[1].value);
    expect(insertedDocs[1].object).toEqual(docs[1].object);
  });

  test('update & upsert', async () => {
    const doc = { key: 'testKey', value: 'testValue', object: { key: 'value' } };
    const insertedDoc = await baseState.insert(doc);

    // @ts-ignore
    expect(baseState.update()).rejects.toThrow(/condition and update param are required/);

    let [updateCount, updatedDocs] = await baseState.update(
      { id: insertedDoc.id },
      { $set: { value: 'newValue', 'object.key': 'value2', 'object.key3': 'value3' } },
      { returnUpdatedDocs: true }
    );
    expect(updateCount).toEqual(1);
    expect(updatedDocs[0].id).toEqual(insertedDoc.id);
    expect(updatedDocs[0].value as unknown as string).toEqual('newValue');
    expect(updatedDocs[0].object.key).toEqual('value2');
    expect(updatedDocs[0].object.key3).toEqual('value3');

    [updateCount, updatedDocs] = await baseState.update(
      insertedDoc.id,
      { $set: { value: 'newValue2', object: { key: 'value2', newKey: 'value3' } } },
      { returnUpdatedDocs: true }
    );
    expect(updateCount).toEqual(1);
    expect(updatedDocs[0].id).toEqual(insertedDoc.id);
    expect(updatedDocs[0].value as unknown as string).toEqual('newValue2');
    expect(updatedDocs[0].object.key as unknown as string).toEqual('value2');
    expect(updatedDocs[0].object.newKey as unknown as string).toEqual('value3');

    let updatedDoc = await baseState.upsert({ id: insertedDoc.id }, { value: 'newValue3' });
    expect(updatedDoc.id).toEqual(insertedDoc.id);
    expect(updatedDoc.value as unknown as string).toEqual('newValue3');

    const id = generateId();
    updatedDoc = await baseState.upsert({ id }, { key: 'testKey4', value: 'newValue4' });
    expect(updatedDoc.id).not.toEqual(insertedDoc.id);
    expect(updatedDoc.id).toEqual(id);
    expect(updatedDoc.value as unknown as string).toEqual('newValue4');
  });

  test('updateById', async () => {
    const doc = { key: 'testKey', value: 'testValue' };
    const insertedDoc = await baseState.insert(doc);

    const [updateCount, updatedDocs] = await baseState.updateById(
      insertedDoc.id,
      { $set: { value: 'newValue' } },
      { returnUpdatedDocs: true }
    );
    expect(updateCount).toEqual(1);
    expect(updatedDocs[0].id).toEqual(insertedDoc.id);
    expect(updatedDocs[0].value).toEqual('newValue' as unknown as number);
  });

  test('paginate', async () => {
    const docs = [
      { key: 'testKey1', value: 'testValue1' },
      { key: 'testKey2', value: 'testValue2' },
    ];

    await baseState.insertMany(docs);
    const result = await baseState.paginate(
      { key: { $regex: 'testKey' } },
      { createdAt: -1 },
      { pageSize: 1, page: 1 }
    );

    expect(result.paging.total).toEqual(2);
    expect(result.paging.pageSize).toEqual(1);
    expect(result.paging.pageCount).toEqual(2);
    expect(result.paging.page).toEqual(1);
  });

  test('paginate should throw error when paging contains decimal numbers', async () => {
    const docs = [
      { key: 'testKey1', value: 'testValue1' },
      { key: 'testKey2', value: 'testValue2' },
    ];

    await baseState.insertMany(docs);

    await expect(
      baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 1, page: -1.5 })
    ).rejects.toThrow("Invalid paging parameter 'page'");
    await expect(
      baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 2.5, page: 1 })
    ).rejects.toThrow("Invalid paging parameter 'pageSize'");
    await expect(
      baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 1.5, page: 2.5 })
    ).rejects.toThrow('Invalid paging parameter');
  });

  test('remove', async () => {
    const doc = { key: 'testKey', value: 'testValue' };
    await baseState.insert(doc);

    await baseState.remove({ key: 'testKey' });
    const count = await baseState.count({ key: 'testKey' });
    expect(count).toEqual(0);
  });

  test('max', async () => {
    const docs = [
      { key: 'testKey1', value: '3' },
      { key: 'testKey2', value: '5' },
    ];

    await baseState.insertMany(docs);

    const maxValue = await baseState.max('value');
    expect(maxValue).toEqual('5');
  });

  test('min', async () => {
    const docs = [
      { key: 'testKey1', value: '3' },
      { key: 'testKey2', value: '5' },
    ];

    await baseState.insertMany(docs);

    const minValue = await baseState.min('value');
    expect(minValue).toEqual('3');
  });

  test('sum', async () => {
    const docs = [
      { key: 'testKey1', value: '3' },
      { key: 'testKey2', value: '5' },
    ];

    await baseState.insertMany(docs);

    const sumValue = await baseState.sum('value');
    expect(sumValue).toEqual(8);
  });

  test('reset', async () => {
    const doc = { key: 'testKey', value: 'testValue' };
    await baseState.insert(doc);

    await baseState.reset();
    const count = await baseState.count();
    expect(count).toEqual(0);
  });

  test('loadDatabase', (done) => {
    expect(() => baseState.loadDatabase()).not.toThrow();
    baseState.loadDatabase(done);
  });

  test('compactDatafile', (done) => {
    expect(() => baseState.compactDatafile()).not.toThrow();
    baseState.compactDatafile(done);
  });

  test('onReady', (done) => {
    const mockCallback = mock();
    baseState.onReady(mockCallback);
    setImmediate(() => {
      expect(mockCallback).toHaveBeenCalled();

      const mockCallback2 = mock();
      baseState.onReady(mockCallback2);
      expect(mockCallback2).toHaveBeenCalled();
      done();
    });
  });

  test('renameIdFiledName', () => {
    expect(BaseState.renameIdFiledName(['a'])).toEqual(['a']);
  });

  test('closeDatabase', (done) => {
    baseState.closeDatabase(done);
  });
});
