export class SereneError extends Error {
  readonly level = 'violation';
  constructor(readonly code: string, message: string, readonly offset?: number) {
    super(message);
    this.name = 'SereneError';
  }
}
