// packages/api/src/utils/errors.ts

// Define ErrorOptions if not globally available
interface ErrorOptions {
    cause?: unknown;
}

export class ServiceError extends Error {
    public statusCode?: number;
    public cause?: unknown;

    constructor(message: string, options?: ErrorOptions & { statusCode?: number }) { 
        super(message);
        this.name = this.constructor.name;
        if (options?.statusCode) {
            this.statusCode = options.statusCode;
        }
        if (options?.cause) {
            this.cause = options.cause;
        }
    }
}

export class ResourceNotFoundError extends ServiceError {
    constructor(message: string) {
        super(message, { statusCode: 404 });
    }
}

export class ResourceConflictError extends ServiceError {
    constructor(message: string) {
        super(message, { statusCode: 409 });
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string, public details?: unknown, statusCode: number = 400) {
        super(message, { statusCode });
    }
}