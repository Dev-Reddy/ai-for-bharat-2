type AsyncFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

export function tracedAsync<TArgs extends unknown[], TResult>(
  _name: string,
  fn: AsyncFn<TArgs, TResult>,
) {
  return fn;
}
