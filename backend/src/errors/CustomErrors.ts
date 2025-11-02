export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);

    Error.captureStackTrace(this, this.constructor);
  }
  public getErrorResponse() {
    return {
      error: this.constructor.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}



// Validation Error
export class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details: any = {}) {
    super(message, 400); // 400 = Bad Request
    this.details = details;
  }
}

// Authentication Error
export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication failed") {
    super(message, 401); // 401 = Unauthorized
  }
}

// Database Error
export class DatabaseError extends AppError {
  public dbDetails: any;

  constructor(
    message: string = "Database error occurred",
    dbDetails: any = {}
  ) {
    super(message, 500); // 500 = Internal Server Error
    this.dbDetails = dbDetails;
  }
}

// Not Found Error
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404); // 404 = Not Found
  }
}

// Forbidden Error
export class ForbiddenError extends AppError {
  constructor(message: string = "Access forbidden") {
    super(message, 403); // 403 = Forbidden
  }
}
