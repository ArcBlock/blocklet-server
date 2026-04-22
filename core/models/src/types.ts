import { ModelDefined } from 'sequelize';

export type DynamicModel<T> = ModelDefined<T, T> & {
  initialize: (sequelize: any) => void;
  GENESIS_ATTRIBUTES: {
    [key: string]: any;
  };
};

export type UpdateOptions = {
  returnUpdatedDocs?: boolean;
  returnBeforeUpdatedDocs?: boolean; // 返回受影响的条目，更新前的数据。默认为false
};

export type AnyObject = { [x: string]: any };
export type SortOptions<T> = { [x in keyof T]?: 1 | -1 };
export type SelectOptions<T> = { [x in keyof T]?: 0 | 1 };
export type PagingOptions = {
  pageSize?: number;
  page?: number;
};

export type QuerySelector<T> = {
  $lt?: T;
  $lte?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $nin?: T[];
  $ne?: T;

  $exists?: boolean;

  $regex?: T extends string ? RegExp | string : never;
};

export type ApplyBasicQueryCasting<T> = T | T[] | (T extends (infer U)[] ? U : any) | any;
export type Condition<T> = ApplyBasicQueryCasting<T> | QuerySelector<ApplyBasicQueryCasting<T>>;
// eslint-disable-next-line no-use-before-define
export type ConditionOptions<T> = { [P in keyof T]?: Condition<T[P]> } & RootQuerySelector<T>;
export type RootQuerySelector<T> = {
  $and?: Array<ConditionOptions<T>>;
  $or?: Array<ConditionOptions<T>>;
  $not?: Array<ConditionOptions<T>>;

  // we could not find a proper TypeScript generic to support nested queries e.g. 'user.friends.name'
  // this will mark all unrecognized properties as any (including nested queries)
  [key: string]: any;
};
