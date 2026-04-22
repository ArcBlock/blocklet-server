import { AnyObject, DataStore } from '@nedb/core';

declare function Factory(initializer: Function): {
  init(...args: any[]): void;
  [key: string]: DataStore<AnyObject>;
};

export { Factory };
