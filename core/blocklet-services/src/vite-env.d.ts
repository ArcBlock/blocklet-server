/// <reference types="vite/client" />

declare module 'ua-parser-js' {
  interface IResult {
    ua: string;
    browser: IBrowser;
    cpu: ICPU;
    device: IDevice;
    engine: IEngine;
    os: IOS;
  }

  interface IBrowser {
    name?: string;
    version?: string;
    major?: string;
  }

  interface ICPU {
    architecture?: string;
  }

  interface IDevice {
    vendor?: string;
    model?: string;
    type?: string;
  }

  interface IEngine {
    name?: string;
    version?: string;
  }

  interface IOS {
    name?: string;
    version?: string;
  }

  class UAParser {
    constructor(ua?: string);
    getBrowser(): IBrowser;
    getCPU(): ICPU;
    getDevice(): IDevice;
    getEngine(): IEngine;
    getOS(): IOS;
    getResult(): IResult;
    getUA(): string;
    setUA(ua: string): UAParser;
  }

  export = UAParser;
}
