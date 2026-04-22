"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleModel = void 0;
const bun_test_1 = require("bun:test");
const sequelize_1 = require("sequelize");
const src_1 = require("../../src");
// eslint-disable-next-line import/prefer-default-export
class SimpleModel extends sequelize_1.Model {
    static initialize(sequelize) {
        this.init({
            id: {
                type: sequelize_1.DataTypes.UUID,
                primaryKey: true,
                defaultValue: sequelize_1.DataTypes.UUIDV4,
            },
            key: {
                type: sequelize_1.DataTypes.STRING,
            },
            value: {
                type: sequelize_1.DataTypes.STRING,
            },
            object: {
                type: (0, src_1.JSONOrJSONB)(),
                defaultValue: {},
            },
            array: {
                type: (0, src_1.JSONOrJSONB)(),
                defaultValue: [],
            },
            createdAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            updatedAt: {
                type: sequelize_1.DataTypes.DATE,
                defaultValue: sequelize_1.DataTypes.NOW,
            },
            startedAt: {
                type: sequelize_1.DataTypes.DATE,
                allowNull: true,
            },
        }, {
            sequelize,
            modelName: 'SimpleModel',
            timestamps: true,
        });
    }
}
exports.SimpleModel = SimpleModel;
(0, bun_test_1.describe)('BaseState', () => {
    let sequelize;
    let baseState;
    (0, bun_test_1.beforeAll)(() => {
        sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        SimpleModel.initialize(sequelize);
    });
    (0, bun_test_1.beforeEach)(async () => {
        await sequelize.sync({ force: true });
        baseState = new src_1.BaseState(SimpleModel);
    });
    (0, bun_test_1.afterAll)(async () => {
        try {
            await sequelize.close();
        }
        catch {
            // Do nothing
        }
    });
    (0, bun_test_1.test)('find', async () => {
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
        const assertDoc = (actual, expected) => {
            (0, bun_test_1.expect)(actual.key).toEqual(expected.key);
            (0, bun_test_1.expect)(actual.value).toEqual(expected.value);
            (0, bun_test_1.expect)(actual.object).toEqual(expected.object);
            (0, bun_test_1.expect)(actual.array).toEqual(expected.array);
        };
        let result = await baseState.find({ key: 'testKey' });
        (0, bun_test_1.expect)(result).toHaveLength(1);
        assertDoc(result[0], doc);
        result = await baseState.find({ object: { key: { [sequelize_1.Op.eq]: 'value2' } } });
        (0, bun_test_1.expect)(result).toHaveLength(1);
        assertDoc(result[0], doc2);
        result = await baseState.find({ object: { key: 'value2' } });
        (0, bun_test_1.expect)(result).toHaveLength(1);
        assertDoc(result[0], doc2);
    });
    (0, bun_test_1.test)('findOne', async () => {
        const doc = { key: 'testKey', value: 'testValue', object: { key: 'value' } };
        await baseState.insert(doc);
        const result = await baseState.findOne({ key: 'testKey' });
        (0, bun_test_1.expect)(result.key).toEqual(doc.key);
        (0, bun_test_1.expect)(result.value).toEqual(doc.value);
        (0, bun_test_1.expect)(result.object).toEqual(doc.object);
    });
    // Add these test cases inside the describe block in BaseState.test.ts
    (0, bun_test_1.test)('count', async () => {
        const doc = { key: 'testKey', value: 'testValue' };
        await baseState.insert(doc);
        const count = await baseState.count({ key: 'testKey' });
        (0, bun_test_1.expect)(count).toEqual(1);
    });
    (0, bun_test_1.test)('insert', async () => {
        const doc = { key: 'testKey', value: 'testValue' };
        const insertedDoc = await baseState.insert(doc);
        (0, bun_test_1.expect)(insertedDoc.key).toEqual(doc.key);
        (0, bun_test_1.expect)(insertedDoc.value).toEqual(doc.value);
    });
    (0, bun_test_1.test)('insertMany', async () => {
        const docs = [
            { key: 'testKey1', value: 'testValue1', object: { key: 'value' } },
            { key: 'testKey2', value: 'testValue2', object: { key: 'value2' } },
        ];
        const insertedDocs = await baseState.insertMany(docs);
        (0, bun_test_1.expect)(insertedDocs).toHaveLength(docs.length);
        (0, bun_test_1.expect)(insertedDocs[0].key).toEqual(docs[0].key);
        (0, bun_test_1.expect)(insertedDocs[0].value).toEqual(docs[0].value);
        (0, bun_test_1.expect)(insertedDocs[0].object).toEqual(docs[0].object);
        (0, bun_test_1.expect)(insertedDocs[1].key).toEqual(docs[1].key);
        (0, bun_test_1.expect)(insertedDocs[1].value).toEqual(docs[1].value);
        (0, bun_test_1.expect)(insertedDocs[1].object).toEqual(docs[1].object);
    });
    (0, bun_test_1.test)('update & upsert', async () => {
        const doc = { key: 'testKey', value: 'testValue', object: { key: 'value' } };
        const insertedDoc = await baseState.insert(doc);
        // @ts-ignore
        (0, bun_test_1.expect)(baseState.update()).rejects.toThrow(/condition and update param are required/);
        let [updateCount, updatedDocs] = await baseState.update({ id: insertedDoc.id }, { $set: { value: 'newValue', 'object.key': 'value2', 'object.key3': 'value3' } }, { returnUpdatedDocs: true });
        (0, bun_test_1.expect)(updateCount).toEqual(1);
        (0, bun_test_1.expect)(updatedDocs[0].id).toEqual(insertedDoc.id);
        (0, bun_test_1.expect)(updatedDocs[0].value).toEqual('newValue');
        (0, bun_test_1.expect)(updatedDocs[0].object.key).toEqual('value2');
        (0, bun_test_1.expect)(updatedDocs[0].object.key3).toEqual('value3');
        [updateCount, updatedDocs] = await baseState.update(insertedDoc.id, { $set: { value: 'newValue2', object: { key: 'value2', newKey: 'value3' } } }, { returnUpdatedDocs: true });
        (0, bun_test_1.expect)(updateCount).toEqual(1);
        (0, bun_test_1.expect)(updatedDocs[0].id).toEqual(insertedDoc.id);
        (0, bun_test_1.expect)(updatedDocs[0].value).toEqual('newValue2');
        (0, bun_test_1.expect)(updatedDocs[0].object.key).toEqual('value2');
        (0, bun_test_1.expect)(updatedDocs[0].object.newKey).toEqual('value3');
        let updatedDoc = await baseState.upsert({ id: insertedDoc.id }, { value: 'newValue3' });
        (0, bun_test_1.expect)(updatedDoc.id).toEqual(insertedDoc.id);
        (0, bun_test_1.expect)(updatedDoc.value).toEqual('newValue3');
        const id = (0, src_1.generateId)();
        updatedDoc = await baseState.upsert({ id }, { key: 'testKey4', value: 'newValue4' });
        (0, bun_test_1.expect)(updatedDoc.id).not.toEqual(insertedDoc.id);
        (0, bun_test_1.expect)(updatedDoc.id).toEqual(id);
        (0, bun_test_1.expect)(updatedDoc.value).toEqual('newValue4');
    });
    (0, bun_test_1.test)('updateById', async () => {
        const doc = { key: 'testKey', value: 'testValue' };
        const insertedDoc = await baseState.insert(doc);
        const [updateCount, updatedDocs] = await baseState.updateById(insertedDoc.id, { $set: { value: 'newValue' } }, { returnUpdatedDocs: true });
        (0, bun_test_1.expect)(updateCount).toEqual(1);
        (0, bun_test_1.expect)(updatedDocs[0].id).toEqual(insertedDoc.id);
        (0, bun_test_1.expect)(updatedDocs[0].value).toEqual('newValue');
    });
    (0, bun_test_1.test)('paginate', async () => {
        const docs = [
            { key: 'testKey1', value: 'testValue1' },
            { key: 'testKey2', value: 'testValue2' },
        ];
        await baseState.insertMany(docs);
        const result = await baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 1, page: 1 });
        (0, bun_test_1.expect)(result.paging.total).toEqual(2);
        (0, bun_test_1.expect)(result.paging.pageSize).toEqual(1);
        (0, bun_test_1.expect)(result.paging.pageCount).toEqual(2);
        (0, bun_test_1.expect)(result.paging.page).toEqual(1);
    });
    (0, bun_test_1.test)('paginate should throw error when paging contains decimal numbers', async () => {
        const docs = [
            { key: 'testKey1', value: 'testValue1' },
            { key: 'testKey2', value: 'testValue2' },
        ];
        await baseState.insertMany(docs);
        await (0, bun_test_1.expect)(baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 1, page: -1.5 })).rejects.toThrow("Invalid paging parameter 'page'");
        await (0, bun_test_1.expect)(baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 2.5, page: 1 })).rejects.toThrow("Invalid paging parameter 'pageSize'");
        await (0, bun_test_1.expect)(baseState.paginate({ key: { $regex: 'testKey' } }, { createdAt: -1 }, { pageSize: 1.5, page: 2.5 })).rejects.toThrow('Invalid paging parameter');
    });
    (0, bun_test_1.test)('remove', async () => {
        const doc = { key: 'testKey', value: 'testValue' };
        await baseState.insert(doc);
        await baseState.remove({ key: 'testKey' });
        const count = await baseState.count({ key: 'testKey' });
        (0, bun_test_1.expect)(count).toEqual(0);
    });
    (0, bun_test_1.test)('max', async () => {
        const docs = [
            { key: 'testKey1', value: '3' },
            { key: 'testKey2', value: '5' },
        ];
        await baseState.insertMany(docs);
        const maxValue = await baseState.max('value');
        (0, bun_test_1.expect)(maxValue).toEqual('5');
    });
    (0, bun_test_1.test)('min', async () => {
        const docs = [
            { key: 'testKey1', value: '3' },
            { key: 'testKey2', value: '5' },
        ];
        await baseState.insertMany(docs);
        const minValue = await baseState.min('value');
        (0, bun_test_1.expect)(minValue).toEqual('3');
    });
    (0, bun_test_1.test)('sum', async () => {
        const docs = [
            { key: 'testKey1', value: '3' },
            { key: 'testKey2', value: '5' },
        ];
        await baseState.insertMany(docs);
        const sumValue = await baseState.sum('value');
        (0, bun_test_1.expect)(sumValue).toEqual(8);
    });
    (0, bun_test_1.test)('reset', async () => {
        const doc = { key: 'testKey', value: 'testValue' };
        await baseState.insert(doc);
        await baseState.reset();
        const count = await baseState.count();
        (0, bun_test_1.expect)(count).toEqual(0);
    });
    (0, bun_test_1.test)('loadDatabase', (done) => {
        (0, bun_test_1.expect)(() => baseState.loadDatabase()).not.toThrow();
        baseState.loadDatabase(done);
    });
    (0, bun_test_1.test)('compactDatafile', (done) => {
        (0, bun_test_1.expect)(() => baseState.compactDatafile()).not.toThrow();
        baseState.compactDatafile(done);
    });
    (0, bun_test_1.test)('onReady', (done) => {
        const mockCallback = (0, bun_test_1.mock)();
        baseState.onReady(mockCallback);
        setImmediate(() => {
            (0, bun_test_1.expect)(mockCallback).toHaveBeenCalled();
            const mockCallback2 = (0, bun_test_1.mock)();
            baseState.onReady(mockCallback2);
            (0, bun_test_1.expect)(mockCallback2).toHaveBeenCalled();
            done();
        });
    });
    (0, bun_test_1.test)('renameIdFiledName', () => {
        (0, bun_test_1.expect)(src_1.BaseState.renameIdFiledName(['a'])).toEqual(['a']);
    });
    (0, bun_test_1.test)('closeDatabase', (done) => {
        baseState.closeDatabase(done);
    });
});
