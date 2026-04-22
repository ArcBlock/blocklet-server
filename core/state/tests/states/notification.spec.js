const { describe, test, expect, beforeAll, afterEach } = require('bun:test');
const { fromRandom } = require('@ocap/wallet');
const { ROLES } = require('@abtnode/constant');

const NotificationState = require('../../lib/states/notification');
const UserState = require('../../lib/states/user');
const ConnectedAccountState = require('../../lib/states/connect-account');
const { setupInMemoryModels } = require('../../tools/fixture');

describe('NotificationState', () => {
  let state = null;
  let userState = null;
  let connectedAccountState = null;
  let models = null;

  beforeAll(async () => {
    models = await setupInMemoryModels();
    state = new NotificationState(models.Notification, {}, models);
    userState = new UserState(models.User, {}, models);
    connectedAccountState = new ConnectedAccountState(models.ConnectedAccount, {});
  });

  afterEach(async () => {
    await state.reset();
    await connectedAccountState.reset();
  });

  test('should pagination work as expected', async () => {
    const sender = 'a';
    const wallet1 = fromRandom();
    const receiver1 = wallet1.address;
    const pk1 = wallet1.publicKey;
    const wallet2 = fromRandom();
    const receiver2 = wallet2.address;
    const pk2 = wallet2.publicKey;
    const componentDid = 'test-component';
    const testPayload = {
      sender,
      receiver: [receiver1, receiver2], // 模拟第一个创建通知的接收者
      title: 'Test Notification Title',
      description: 'This is a test notification description.',
      actions: [{ name: 'ActionName', link: 'https://example.com/action' }],
      entityType: 'test-entity',
      entityId: 'test-id',
      componentDid,
    };

    await userState.addUser({
      fullName: 'Bob',
      did: receiver1,
      pk: pk1,
    });
    await userState.addUser({
      fullName: 'Alice',
      did: receiver2,
      pk: pk2,
    });
    const createNotifications = Array.from({ length: 25 }, async (_, i) => {
      const r = await state.create({
        ...testPayload,
        componentDid: `${componentDid}_${i % 2}`,
      });

      const receiverPromises = testPayload.receiver.map((receiver) =>
        state.createNotificationReceiver({
          receiverInstance: {
            notificationId: r.id,
            receiver,
          },
        })
      );

      return Promise.all(receiverPromises);
    });

    await Promise.all(createNotifications);

    const context = { user: { did: receiver1 } };

    const r1 = await state.findPaginated({ receiver: receiver1 }, context);
    expect(r1.list.length).toBe(10);
    expect(r1.paging.page).toBe(1);
    expect(r1.paging.total).toBe(25);
    expect(r1.paging.pageSize).toBe(10);
    expect(r1.paging.pageCount).toBe(3);

    // 在这里添加一个用例测试分页参数传入异常情况
    await expect(
      state.findPaginated({ receiver: receiver1, paging: { page: -1, pageSize: 10 } }, context)
    ).rejects.toThrow("Invalid paging parameter 'page'");
    await expect(
      state.findPaginated({ receiver: receiver1, paging: { page: 0.3, pageSize: 11.3 } }, context)
    ).rejects.toThrow('Invalid paging parameter');
    await expect(
      state.findPaginated({ receiver: receiver1, paging: { page: 1, pageSize: -10 } }, context)
    ).rejects.toThrow("Invalid paging parameter 'pageSize'");

    const componentDid0Result = await state.findPaginated(
      { receiver: receiver1, componentDid: [`${componentDid}_0`] },
      context
    );
    expect(componentDid0Result.list.length).toBe(10);
    expect(componentDid0Result.paging.page).toBe(1);
    expect(componentDid0Result.paging.total).toBe(13);
    expect(componentDid0Result.paging.pageSize).toBe(10);
    expect(componentDid0Result.paging.pageCount).toBe(2);

    const r2 = await state.findPaginated({ receiver: receiver1, paging: { page: 3 } }, context);
    expect(r2.list.length).toBe(5);
    expect(r2.paging.page).toBe(3);
    expect(r2.paging.total).toBe(25);
    expect(r2.paging.pageSize).toBe(10);
    expect(r2.paging.pageCount).toBe(3);

    const r3 = await state.findPaginated({ receiver: receiver1, paging: { page: 4 } }, context);
    expect(r3.list.length).toBe(0);
    expect(r3.paging.page).toBe(4);
    expect(r3.paging.total).toBe(25);
    expect(r3.paging.pageSize).toBe(10);
    expect(r3.paging.pageCount).toBe(3);

    const unReadCount = await state.getUnreadCount({ receiver: receiver1 }, context);
    expect(unReadCount).toBe(25);

    // 将第一条消息标记为已读
    const readNotification = r1.list[1];
    const { numAffected } = await state.read({ notificationIds: [readNotification.id], receiver: receiver1 }, context);
    expect(numAffected).toBe(1);
    const unReadCount1 = await state.getUnreadCount({ receiver: receiver1 }, context);
    expect(unReadCount1).toBe(24);

    // 将所有消息标记为已读
    const { numAffected: readCount } = await state.makeAllAsRead({ receiver: receiver1 }, context);
    expect(readCount).toBe(24);
    const unReadCount2 = await state.getUnreadCount({ receiver: receiver1 }, context);
    expect(unReadCount2).toBe(0);
  });

  describe('Check if the connected accounts query works correctly', () => {
    test('should pagination work with connected accounts', async () => {
      const sender = 'a';
      const wallet1 = fromRandom();
      const receiver1 = wallet1.address; // 主用户的 DID
      const pk1 = wallet1.publicKey;

      const wallet2 = fromRandom();
      const receiver2 = wallet2.address;
      const pk2 = wallet2.publicKey;

      // 创建关联账户的 DID（这些将作为通知的 receiver）
      const connectedWallet1 = fromRandom();
      const connectedDid1 = connectedWallet1.address;
      const connectedPk1 = connectedWallet1.publicKey;

      const connectedWallet2 = fromRandom();
      const connectedDid2 = connectedWallet2.address;
      const connectedPk2 = connectedWallet2.publicKey;

      const componentDid = 'test-component';
      const testPayload = {
        sender,
        receiver: [connectedDid1, connectedDid2], // 使用关联账户作为接收者
        title: 'Test Notification Title',
        description: 'This is a test notification description.',
        actions: [{ name: 'ActionName', link: 'https://example.com/action' }],
        entityType: 'test-entity',
        entityId: 'test-id',
        componentDid,
      };

      // 创建主用户
      await userState.addUser({
        fullName: 'Bob',
        did: receiver1,
        pk: pk1,
      });
      await userState.addUser({
        fullName: 'Alice',
        did: receiver2,
        pk: pk2,
      });

      // 创建主用户
      await userState.addUser({
        fullName: 'Bob',
        did: connectedDid1,
        pk: connectedPk1,
      });
      await userState.addUser({
        fullName: 'Alice',
        did: connectedDid2,
        pk: connectedPk2,
      });

      // 直接创建关联账户记录（映射关联账户 DID 到主用户 DID）
      await connectedAccountState.insert({
        did: connectedDid1,
        pk: connectedPk1,
        provider: 'wallet',
        userDid: receiver1, // 关键：关联到主用户
        firstLoginAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });
      await connectedAccountState.insert({
        did: connectedDid2,
        pk: connectedPk2,
        provider: 'wallet',
        userDid: receiver2, // 关键：关联到主用户
        firstLoginAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      });

      // 创建 5 个通知，接收者是关联账户
      const createNotifications = Array.from({ length: 25 }, async (_, i) => {
        const r = await state.create({
          ...testPayload,
          componentDid: `${componentDid}_${i % 2}`,
        });

        const receiverPromises = testPayload.receiver.map((receiver) =>
          state.createNotificationReceiver({
            receiverInstance: {
              notificationId: r.id,
              receiver,
            },
          })
        );

        return Promise.all(receiverPromises);
      });

      await Promise.all(createNotifications);

      // 使用主用户的 DID 进行查询，应该能查询到关联账户收到的通知
      const context = { user: { did: receiver1 } };

      const r1 = await state.findPaginated({ receiver: receiver1 }, context);
      expect(r1.list.length).toBe(10);
      expect(r1.paging.page).toBe(1);
      expect(r1.paging.total).toBe(25);
      expect(r1.paging.pageSize).toBe(10);
      expect(r1.paging.pageCount).toBe(3);

      // 测试未读消息数量
      const unReadCount = await state.getUnreadCount({ receiver: receiver1 }, context);
      expect(unReadCount).toBe(25);

      // 验证通过关联账户查询功能正常工作
      expect(r1.list.length).toBeGreaterThan(0);

      // 将第一条消息标记为已读
      const readNotification = r1.list[0];
      const { numAffected } = await state.read(
        { notificationIds: [readNotification.id], receiver: receiver1 },
        context
      );
      expect(numAffected).toBe(1);
      const unReadCount1 = await state.getUnreadCount({ receiver: receiver1 }, context);
      expect(unReadCount1).toBe(24);

      // 将所有消息标记为已读
      const { numAffected: readCount } = await state.makeAllAsRead({ receiver: receiver1 }, context);
      expect(readCount).toBe(24);
      const unReadCount2 = await state.getUnreadCount({ receiver: receiver1 }, context);
      expect(unReadCount2).toBe(0);
    });
  });

  describe('Check if the notification service health query works correctly', () => {
    test('should return notification receivers within specified time range', async () => {
      const sender = 'test-sender';
      const wallet = fromRandom();
      const receiver = wallet.address;
      const pk = wallet.publicKey;

      // 添加用户
      await userState.addUser({
        fullName: 'Test User',
        did: receiver,
        pk,
      });

      // 创建 3 条通知和接收者记录
      await Promise.all(
        Array.from({ length: 3 }, async (_, i) => {
          const notification = await state.create({
            sender,
            receiver: [receiver],
            title: `Test Notification ${i + 1}`,
            description: `This is test notification ${i + 1}`,
            entityType: 'test-entity',
            entityId: `test-id-${i}`,
            componentDid: 'test-component',
          });

          await state.createNotificationReceiver({
            receiverInstance: {
              notificationId: notification.id,
              receiver,
            },
          });

          return notification;
        })
      );

      // 查询 1 小时内的通知接收者
      const result = await state.getNotificationsBySince({ since: '1h' });

      expect(result.length).toBe(3);

      // 0h 会 fallback 到 1h，应该查到相同的结果
      const result1 = await state.getNotificationsBySince({ since: '0h' });
      expect(result1.length).toBe(3);

      // 25h 会 fallback 到 24h，应该查到相同的结果
      const result2 = await state.getNotificationsBySince({ since: '25h' });
      expect(result2.length).toBe(3);
    });

    test('should return empty array when no notifications in time range', async () => {
      const result = await state.getNotificationsBySince({ since: '1h' });
      expect(result.length).toBe(0);
    });

    test('should throw error for invalid since format', async () => {
      await expect(state.getNotificationsBySince({ since: 'invalid' })).rejects.toThrow(
        'Invalid since format. Expected format: "1h", "2h", "24h", etc.'
      );
    });
  });

  describe('Role-based notification filtering', () => {
    test('should filter system notifications based on user role', async () => {
      const wallet = fromRandom();
      const receiver = wallet.address;

      await userState.addUser({ fullName: 'Test User', did: receiver, pk: wallet.publicKey });

      // 创建 1 条系统通知和 2 条组件通知
      const systemNotification = await state.create({
        sender: 'test',
        title: 'System',
        description: 'system',
        source: 'system',
      });
      await state.createNotificationReceiver({
        receiverInstance: { notificationId: systemNotification.id, receiver },
      });

      const componentNotification = await state.create({
        sender: 'test',
        title: 'Component',
        description: 'component',
        componentDid: 'test-did',
        source: 'component',
      });
      await state.createNotificationReceiver({
        receiverInstance: { notificationId: componentNotification.id, receiver },
      });

      const allIds = [systemNotification.id, componentNotification.id];
      const memberContext = { user: { did: receiver, role: 'member' } };
      const adminContext = { user: { did: receiver, role: ROLES.ADMIN } };

      // 非管理员：只能看到组件通知
      const memberResult = await state.findPaginated({ receiver }, memberContext);
      expect(memberResult.paging.total).toBe(1);
      expect(memberResult.list[0].source).toBe('component');

      // 非管理员：read 只影响组件通知
      const memberReadResult = await state.read({ notificationIds: allIds, receiver }, memberContext);
      expect(memberReadResult.numAffected).toBe(1);

      // 重置已读状态
      await state.notificationReceivers.update({ receiver }, { $set: { read: false } });

      // 管理员：能看到所有通知
      const adminResult = await state.findPaginated({ receiver }, adminContext);
      expect(adminResult.paging.total).toBe(2);

      // 管理员：makeAllAsRead 影响所有通知
      const adminMakeAllResult = await state.makeAllAsRead({ receiver }, adminContext);
      expect(adminMakeAllResult.numAffected).toBe(2);
    });
  });
});
