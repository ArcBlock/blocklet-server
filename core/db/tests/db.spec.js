const { test, describe, expect, beforeAll, afterAll } = require('bun:test');
const os = require('os');
const fs = require('fs');
const path = require('path');
const DB = require('../lib/db');

describe('DB', () => {
  let db = null;
  const dataDir = path.join(os.tmpdir(), 'core-db', Date.now().toString());

  beforeAll((done) => {
    db = new DB(dataDir, { filename: 'test.db' });
    db.onReady(() => done());
  });

  afterAll(() => {
    if (fs.existsSync(dataDir)) {
      fs.rmSync(dataDir, { recursive: true, force: true });
    }
  });

  test('should async functions work', async () => {
    expect(typeof db.compactDatafile).toEqual('function');
    expect(typeof db.reset).toEqual('function');

    await db.insert({ name: 1 });
    await db.insert({ name: 2 });

    // count
    const totalCount = await db.count();
    const count1 = await db.count({ name: 1 });
    expect(totalCount).toEqual(2);
    expect(count1).toEqual(1);

    // find
    const one = await db.findOne({ name: 2 });
    expect(one.name).toEqual(2);
    const all = await db.find();
    expect(all.length).toEqual(2);

    // pagination
    const pag1 = await db.paginate({}, { name: -1 }, { pageSize: 1 });
    expect(pag1.list.length).toEqual(1);
    expect(pag1.list[0].name).toEqual(2);
    expect(pag1.paging).toEqual({
      total: 2,
      pageSize: 1,
      pageCount: 2,
      page: 1,
    });

    // update
    const [update1, result1] = await db.update({ name: 2 }, { $set: { name: 3 } });
    expect(update1).toEqual(1);
    expect(result1.name).toEqual(3);
    const updateByIdRes = await db.updateById(result1._id, { $set: { name: 2 } });
    expect(updateByIdRes.name).toEqual(2);

    // remove
    const removeRes = await db.remove({ name: 2 });
    const afterRemoved = await db.find();
    expect(removeRes).toEqual(1);
    expect(afterRemoved.length).toEqual(1);
    expect(afterRemoved[0].name).toEqual(1);
  });

  describe('renameIdFiledName', () => {
    test('should rename _id to id function work', () => {
      const data = { _id: 1, name: 1 };
      const originalId = data._id;
      const renamed = DB.renameIdFiledName(data);
      expect(renamed.id).toEqual(originalId);
      expect(typeof renamed._id).toEqual('undefined');
    });

    test('should rename id to _id function work', () => {
      const data = { id: 1, name: 1 };
      const originalId = data.id;
      const renamed = DB.renameIdFiledName(data, 'id', '_id');
      expect(renamed._id).toEqual(originalId);
      expect(typeof renamed.id).toEqual('undefined');
    });

    test('should array entity work', () => {
      const data = [
        { _id: 1, name: 1 },
        { _id: 2, name: 2 },
      ];
      const renamed = DB.renameIdFiledName(data);
      expect(renamed[0].id).toEqual(1);
      expect(typeof renamed[0]._id).toEqual('undefined');
      expect(renamed[1].id).toEqual(2);
      expect(typeof renamed[1]._id).toEqual('undefined');
    });

    test('should return if the entity is empty', () => {
      expect(DB.renameIdFiledName(null)).toEqual(null);
      expect(typeof DB.renameIdFiledName(undefined)).toEqual('undefined');
    });
  });
});
