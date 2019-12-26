export interface ICmResult<T> {
  result?: T;
  error?: Error | undefined;
  success: boolean;
}
