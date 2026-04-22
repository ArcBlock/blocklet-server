"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bun_test_1 = require("bun:test");
const sequelize_1 = require("sequelize");
const path_1 = require("path");
const os_1 = require("os");
const src_1 = require("../../src");
(0, bun_test_1.describe)('models', () => {
    (0, bun_test_1.test)('createSequelize#memory', async () => {
        const sequelize = await (0, src_1.createSequelize)('sqlite::memory:', { logging: false });
        const models = (0, src_1.getServerModels)();
        (0, bun_test_1.expect)(models.AccessKey).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
    (0, bun_test_1.test)('createSequelize#file', async () => {
        const dbPath = (0, path_1.join)((0, os_1.tmpdir)(), Math.random().toString(), 'test.db');
        const sequelize = await (0, src_1.createSequelize)(dbPath, { logging: false });
        const models = (0, src_1.getServerModels)();
        (0, bun_test_1.expect)(models.AccessKey).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
        (0, src_1.destroySequelize)(dbPath);
    });
    (0, bun_test_1.test)('getServerModels', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        const models = (0, src_1.getServerModels)();
        (0, bun_test_1.expect)(models.AccessKey).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
    (0, bun_test_1.test)('getServiceModels', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        const models = (0, src_1.getServiceModels)();
        (0, bun_test_1.expect)(models.Message).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
    (0, bun_test_1.test)('getCertificateManagerModels', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        const models = (0, src_1.getCertificateManagerModels)();
        (0, bun_test_1.expect)(models.Certificate).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
    (0, bun_test_1.test)('getBlockletModels', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        const models = (0, src_1.getBlockletModels)();
        (0, bun_test_1.expect)(models.User).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
    (0, bun_test_1.test)('getConnectModels', async () => {
        const sequelize = new sequelize_1.Sequelize('sqlite::memory:', { logging: false });
        const models = (0, src_1.getConnectModels)();
        (0, bun_test_1.expect)(models.Connection).toBeTruthy();
        try {
            (0, src_1.setupModels)(models, sequelize);
            await sequelize.sync({ force: true });
        }
        catch (err) {
            (0, bun_test_1.expect)(err).toBeFalsy();
        }
    });
});
