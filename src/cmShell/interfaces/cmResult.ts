export interface ICmResult<T> {
  result?: T;
  error?: Error;
  success: boolean;
}
