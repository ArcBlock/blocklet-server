/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'fs';
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Database } from '../src/database/index';
import { setEnvironment } from '../tools/environment';

describe('Database', () => {
  let db: $TSFixMe;
  beforeEach((done) => {
    setEnvironment();

    db = new Database('database');
    // make sure db is empty
    db.loadDatabase(() => {
      expect(db.getAllData().length).toBe(0);
      done();
    });
  });
  afterEach((done) => {
    // clean db
    try {
      fs.existsSync(db.filename);
      fs.unlinkSync(db.filename);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('err', err);
    } finally {
      done();
    }
  });
  test('Can insert data', async () => {
    const time = +new Date();
    await db.insert({ time });
    const data = await db.exists({ time });
    expect(data).toBe(true);
  });
  test('Can find data', async () => {
    await db.insert({ index: 1 });
    await db.insert({ index: 2 });
    await db.insert({ index: 3 });
    const data = await db.find();
    const filterData = data.map((item: $TSFixMe) => item.index);
    expect(filterData).toEqual([1, 2, 3]);
  });
  test('Can find projection data', async () => {
    await db.insert({ index: 1, random: Math.random() });
    await db.insert({ index: 2, random: Math.random() });
    await db.insert({ index: 3, random: Math.random() });
    const data = await db.cursor().projection({ index: 1, _id: 0 }).exec();
    expect(data).toEqual([{ index: 1 }, { index: 2 }, { index: 3 }]);
  });
  test('Can remove data', async () => {
    await db.insert({ index: 1 });
    await db.insert({ index: 2 });
    await db.insert({ index: 3 });
    await db.remove(
      {
        $where() {
          return this.index > 1;
        },
      },
      { multi: true }
    );
    const data = await db.cursor().projection({ index: 1, _id: 0 }).exec();
    expect(data).toEqual([{ index: 1 }]);
  });
  test('Can findOne data', async () => {
    const time = +new Date();
    const { _id } = await db.insert({ time });
    const data = await db.findOne({ _id });
    expect(data.time).toBe(time);
  });
  test('Can update data', async () => {
    const time = +new Date();
    const { _id } = await db.insert({ time });
    await db.update({ _id }, { $set: { time: time + 1000 } });
    const data = await db.findOne({ _id });
    expect(data.time).toBe(time + 1000);
  });
  test('Can find skip & limit data', async () => {
    await db.insert({ index: 1 });
    await db.insert({ index: 2 });
    await db.insert({ index: 3 });
    const [data] = await db.cursor().skip(1).limit(1).projection({ index: 1, _id: 0 }).exec();
    expect(data.index).toBe(2);
  });
  test('Can find paginate data', async () => {
    await db.insert({ index: 1 });
    await db.insert({ index: 2 });
    await db.insert({ index: 3 });
    await db.insert({ index: 4 });
    await db.insert({ index: 5 });
    const data = await db.paginate({ query: {}, size: 2, page: 2, projection: { index: 1, _id: 0 } });
    expect(data).toEqual([{ index: 3 }, { index: 4 }]);
  });
  test('Can find sort data', async () => {
    await db.insert({ index: 1 });
    await db.insert({ index: 2 });
    await db.insert({ index: 3 });
    const data = await db.cursor().sort({ index: -1 }).projection({ index: 1, _id: 0 }).exec();
    expect(data).toEqual([{ index: 3 }, { index: 2 }, { index: 1 }]);
  });
  test('Can use with class', async () => {
    class Db extends Database {
      constructor() {
        super('database');
      }

      testFn() {
        return 'Extends class function';
      }
    }
    const classDb = new Db() as any;
    await classDb.insert({ index: 1 });
    const { _id } = await classDb.insert({ index: 2 });
    await classDb.insert({ index: 3 });
    await classDb.insert({ index: 4 });
    await classDb.insert({ index: 5 });
    const shouldExists = await classDb.exists({ index: 5 });
    await classDb.remove(
      {
        $where() {
          return this.index > 3;
        },
      },
      { multi: true }
    );
    const shouldNotExists = await classDb.exists({ index: 5 });
    await classDb.update({ _id }, { $set: { index: 20 } });
    const data = await classDb.cursor().projection({ index: 1, _id: 0 }).skip(1).limit(2).sort({ index: 1 }).exec();
    expect(classDb.testFn()).toEqual('Extends class function');
    expect(shouldExists).toBe(true);
    expect(shouldNotExists).toBe(false);
    expect(data).toEqual([{ index: 3 }, { index: 20 }]);
  });
});
