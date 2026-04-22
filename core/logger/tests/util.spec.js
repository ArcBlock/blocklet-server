const util = require('../lib/util');

describe('util', () => {
  describe('getPreDate', () => {
    test('should return 2022-04-27, current date is 2022-04-28', () => {
      expect(util.getPreDate(new Date('2022-04-28'))).toEqual({ year: '2022', month: '04', day: '27' });
    });

    test('should return 2022-03-31, current date is 2022-04-01', () => {
      expect(util.getPreDate(new Date('2022-04-01'))).toEqual({ year: '2022', month: '03', day: '31' });
    });
  });

  describe('getAccessLogFilenameGenerator', () => {
    test('should access.log if time is empty', () => {
      expect(util.getAccessLogFilenameGenerator()()).toEqual('access.log');
      expect(util.getAccessLogFilenameGenerator()()).toEqual('access.log');
    });

    test('should result contains the index if index > 1', () => {
      expect(util.getAccessLogFilenameGenerator()(new Date('2022-04-27'), 2)).toEqual('access-2022-04-26-2.log.gz');
    });

    test('should result not contains index if index <= 1', () => {
      expect(util.getAccessLogFilenameGenerator()(new Date('2022-04-27'), 0)).toEqual('access-2022-04-26.log.gz');
      expect(util.getAccessLogFilenameGenerator()(new Date('2022-04-27'), 1)).toEqual('access-2022-04-26.log.gz');
    });
  });
});
