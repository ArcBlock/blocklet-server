export function baseWrapSpinner(_: string, waiting: () => Promise<unknown>) {
  return Promise.resolve(waiting());
}
