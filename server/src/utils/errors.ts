export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 500, public code?: string) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation error") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT");
  }
}
