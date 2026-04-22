class StateFactory<TInitializer extends (...args: any[]) => Promise<any> | any, TModels extends any> {
  private initialized = false;

  public allStates: Awaited<ReturnType<TInitializer>> = {} as Awaited<ReturnType<TInitializer>>;

  public models: TModels;

  private initializer: TInitializer;

  constructor(initializer: TInitializer, models: TModels) {
    this.initializer = initializer;
    this.models = models;
  }

  init(...args: Parameters<TInitializer>): void {
    if (!this.allStates) {
      this.allStates = {} as Awaited<ReturnType<TInitializer>>;
    }
    const newStates = this.initializer(...args);
    if (typeof newStates.then === 'function') {
      newStates.then((theNewStates) => {
        this.allStates = { ...this.allStates, ...theNewStates };
        this.initialized = true;
      });
      return;
    }
    this.allStates = { ...this.allStates, ...newStates };
    this.initialized = true;
  }

  async initAsync(...args: Parameters<TInitializer>): Promise<void> {
    const newStates = await Promise.resolve(this.initializer(...args));
    if (!this.allStates) {
      this.allStates = {} as Awaited<ReturnType<TInitializer>>;
    }
    this.allStates = { ...this.allStates, ...newStates };
    this.initialized = true;
  }

  getState(name: string) {
    if (!this.initialized) {
      throw new Error(`State ${name} initializer may not be initialized`);
    }
    if (!this.allStates[name]) {
      throw new Error(`State ${String(name)} may not be initialized`);
    }
    return this.allStates[name];
  }
}

// eslint-disable-next-line import/prefer-default-export
export const createStateFactory = <TInitializer extends (...args: any[]) => Promise<any> | any, TModels extends any>(
  initializer: TInitializer,
  models: TModels
) => {
  const store = new StateFactory(initializer, models);

  const ownKeys = Object.getOwnPropertyNames(store);
  const protoKeys = Object.getOwnPropertyNames(Object.getPrototypeOf(store));
  const keySet = new Set<string>([...ownKeys, ...protoKeys]);

  return new Proxy(store, {
    get(target, prop, receiver) {
      if (prop === 'models') {
        return store.models;
      }
      if (keySet.has(prop as string)) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value === 'function') return value.bind(target);
        return value;
      }
      return store.getState(prop as string);
    },
  }) as typeof store & Awaited<ReturnType<TInitializer>>;
};
