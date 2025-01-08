export function throwCustomError(message, error) {
    if (error instanceof Error) {
        throw new Error(`${message}: ${error.message}`);
    }
    throw new Error(message);
}
