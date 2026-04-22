/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
// eslint-disable-next-line no-promise-executor-return
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface WithRetryOptions {
  /** 最大重试次数 */
  max?: number;
  /** 初始退避时长，单位 ms */
  backoffBase?: number;
  /** 每次重试时的指数倍数 */
  backoffExponent?: number;
  /** 抖动范围，0~backoffJitter 毫秒 */
  backoffJitter?: number;
  /** 判断是否需要重试的函数 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  needRetry?: (err: any) => boolean;
}

// 通用指数退避重试
export async function withRetry<T>(
  fn: () => Promise<T>,
  {
    max = 15,
    backoffBase = 200,
    backoffExponent = 1.1,
    backoffJitter = 100,
    needRetry = () => true,
    // eslint-disable-next-line @typescript-eslint/comma-dangle
  }: WithRetryOptions = {}
): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      // 超过最大重试次数或不需要重试，抛出错误
      if (!needRetry(err) || ++attempt > max) {
        throw err;
      }

      // 计算指数退避延迟：base * exponent^(attempt-1)
      const exp = backoffExponent ** (attempt - 1);
      const expDelay = backoffBase * exp;
      // 加上随机抖动
      const jitter = Math.random() * backoffJitter;
      const waitTime = Math.floor(expDelay + jitter);

      // 等待后重试
      await sleep(waitTime);
    }
  }
}
