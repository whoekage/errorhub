// packages/api/src/utils/errors.ts
export class ServiceError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = this.constructor.name;
    }
}

export class ResourceNotFoundError extends ServiceError {
    constructor(message: string) {
        super(message);
    }
}

export class ResourceConflictError extends ServiceError {
    constructor(message: string) {
        super(message);
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string, public details?: unknown) {
        super(message);
    }
}