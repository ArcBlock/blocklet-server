import { it, expect, describe } from 'bun:test';
import { createStateFactory } from '../../src';

describe('StateFactory', () => {
  const modelsMock = {
    testModel: 'TestModel',
  };

  const initializerMock = (arg1: string, arg2: number) => {
    return {
      state1: arg1,
      state2: arg2,
    };
  };

  it('should call the initializer and assign its result to states', () => {
    const stateFactory = createStateFactory(initializerMock, modelsMock);
    stateFactory.init('test', 123);
    expect(stateFactory.state1).toBe('test');
    expect(stateFactory.state2).toBe(123);
  });

  it('should return the models object when accessing "models" property', () => {
    const stateFactory = createStateFactory(initializerMock, modelsMock);
    expect(stateFactory.models).toBe(modelsMock);
  });

  it('should throw an error when accessing uninitialized state', () => {
    const stateFactory = createStateFactory(initializerMock, modelsMock);
    expect(() => stateFactory.state1).toThrow('State state1 initializer may not be initialized');
  });

  it('should async initializer', async () => {
    const initializerAsync = (arg1: string, arg2: number) => {
      return {
        state1: arg1,
        state2: arg2,
      };
    };
    const stateFactory = createStateFactory(initializerAsync, modelsMock);
    await stateFactory.initAsync('testaa', 123);

    expect(stateFactory.state1).toBe('testaa');
    expect(stateFactory.models.testModel).toBe('TestModel');
  });
});
