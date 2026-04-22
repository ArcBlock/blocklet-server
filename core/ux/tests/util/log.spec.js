import { describe, expect, test } from 'bun:test';
import { printColoredLog } from '../../src/util/log';

describe('log-spec.js', () => {
  describe('printColorLog', () => {
    test('[dd/MMM/yyyy:HH:mm:ss Z] + info type', () => {
      const logMessage = '[10/Oct/2024:08:19:58 +0800] Something happened';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'info');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m[10/Oct/2024:08:19:58 +0800]\x1b[0m');

      // 验证非时间的部分是否为蓝色(info 对应蓝色)
      expect(output).toContain('\x1b[34m');
    });
    test('YYYY-MM-DDTHH:MM:SS: + error type', () => {
      const logMessage = '2024-10-09T13:46:13: An error occurred';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'error');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m2024-10-09T13:46:13:\x1b[0m');

      // 验证非时间部分是否为红色(error 对应红色)
      expect(output).toContain('\x1b[31m');
    });
    test('(YYYY-MM-DD HH:MM:SS): + access type', () => {
      const logMessage = '(2024-10-09 13:46:13): An access log text';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'access');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m(2024-10-09 13:46:13):\x1b[0m');

      // 验证非时间部分是否为红色(access 对应绿色)
      expect(output).toContain('\x1b[32m');
    });
    test('[dd/MMM/yyyy:HH:mm:ss Z] + pm2 type', () => {
      const logMessage = '[10/Oct/2024:08:19:58 +0800] pm2 log message';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'pm2');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m[10/Oct/2024:08:19:58 +0800]\x1b[0m');

      // 验证非时间的部分是否为蓝色(pm2 对应青色)
      expect(output).toContain('\x1b[36m');
    });
    test('[dd/MMM/yyyy:HH:mm:ss Z] + stdout type', () => {
      const logMessage = '[10/Oct/2024:08:19:58 +0800] pm2 log message';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'stdout');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m[10/Oct/2024:08:19:58 +0800]\x1b[0m');

      // 验证非时间的部分是否为蓝色(stdout 对应白色)
      expect(output).toContain('\x1b[37m');
    });
    test('YYYY-MM-DDTHH:MM:SS: + stderr type', () => {
      const logMessage = '2024-10-09T13:46:13: An error occurred';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'error');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m2024-10-09T13:46:13:\x1b[0m');

      // 验证非时间部分是否为红色(stderr 对应红色)
      expect(output).toContain('\x1b[31m');
    });

    test('[YYYY-MM-DD HH:MM:SS] + stderr type', () => {
      const logMessage = '[2024-10-11 10:02:21] An error occurred';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'error');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m[2024-10-11 10:02:21]\x1b[0m');

      // 验证非时间部分是否为红色(stderr 对应红色)
      expect(output).toContain('\x1b[31m');
    });
    test('YYYY-MM-DD HH:MM:SS: + stderr type', () => {
      const logMessage = '2024-10-09 13:46:13 An error occurred';
      // 执行被测试函数
      const output = printColoredLog(logMessage, 'error');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m2024-10-09 13:46:13\x1b[0m');

      // 验证非时间部分是否为红色(stderr 对应红色)
      expect(output).toContain('\x1b[31m');
    });
    test('default type', () => {
      const logMessage = '2023-01-01T00:00:00: Unrecognized log message';

      const output = printColoredLog(logMessage, 'unknown');

      // 验证时间部分是否为黄色高亮
      expect(output).toContain('\x1b[33m2023-01-01T00:00:00:\x1b[0m');

      // 验证默认情况下颜色应为白色
      expect(output).toContain('\x1b[37m');
    });
  });
});
