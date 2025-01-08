"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwCustomError = throwCustomError;
function throwCustomError(message, error) {
    if (error instanceof Error) {
        throw new Error(`${message}: ${error.message}`);
    }
    throw new Error(message);
}
