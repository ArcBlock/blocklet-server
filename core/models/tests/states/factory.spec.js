"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const src_1 = require("../../src");
(0, bun_test_1.describe)('StateFactory', () => {
    const modelsMock = {
        testModel: 'TestModel',
    };
    const initializerMock = (arg1, arg2) => {
        return {
            state1: arg1,
            state2: arg2,
        };
    };
    (0, bun_test_1.it)('should call the initializer and assign its result to states', () => {
        const stateFactory = (0, src_1.createStateFactory)(initializerMock, modelsMock);
        stateFactory.init('test', 123);
        (0, bun_test_1.expect)(stateFactory.state1).toBe('test');
        (0, bun_test_1.expect)(stateFactory.state2).toBe(123);
    });
    (0, bun_test_1.it)('should return the models object when accessing "models" property', () => {
        const stateFactory = (0, src_1.createStateFactory)(initializerMock, modelsMock);
        (0, bun_test_1.expect)(stateFactory.models).toBe(modelsMock);
    });
    (0, bun_test_1.it)('should throw an error when accessing uninitialized state', () => {
        const stateFactory = (0, src_1.createStateFactory)(initializerMock, modelsMock);
        (0, bun_test_1.expect)(() => stateFactory.state1).toThrow('State state1 initializer may not be initialized');
    });
    (0, bun_test_1.it)('should async initializer', async () => {
        const initializerAsync = (arg1, arg2) => {
            return {
                state1: arg1,
                state2: arg2,
            };
        };
        const stateFactory = (0, src_1.createStateFactory)(initializerAsync, modelsMock);
        await stateFactory.initAsync('testaa', 123);
        (0, bun_test_1.expect)(stateFactory.state1).toBe('testaa');
        (0, bun_test_1.expect)(stateFactory.models.testModel).toBe('TestModel');
    });
});
