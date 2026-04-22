const { describe, test, expect, beforeAll, afterAll } = require('bun:test');
const SessionState = require('../../lib/states/session');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('SessionState', () => {
  let state = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new SessionState(models.Session, {});
  });

  test('should work as expected', async () => {
    let doc = await state.start({ key: 'value' });
    expect(doc.id).toBeTruthy();
    expect(doc.key).toEqual('value');
    expect(doc.challenge).toBeTruthy();

    doc = await state.update(doc.id, { key: 'value2', key2: 'value' });
    expect(doc.key).toEqual('value2');
    expect(doc.key2).toEqual('value');

    doc = await state.update(doc.challenge, { key: 'value3', key2: 'value' });
    expect(doc.key).toEqual('value3');
    expect(doc.key2).toEqual('value');

    doc = await state.end(doc.id);
    expect(doc.key).toEqual('value3');
    expect(doc.key2).toEqual('value');

    let missing = await state.read(doc.id);
    expect(missing).toBeFalsy();

    missing = await state.read(doc.challenge);
    expect(missing).toBeFalsy();
  });

  afterAll(async () => {
    await state.reset();
  });
});
