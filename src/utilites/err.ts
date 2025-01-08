export function throwCustomError(message: string, error?: unknown): never {
  if (error instanceof Error) {
    throw new Error(`${message}: ${error.message}`);
  }
  throw new Error(message);
}
