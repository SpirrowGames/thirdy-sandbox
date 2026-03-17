'use strict';

class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NOT_FOUND';
    this.statusCode = 404;
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'FORBIDDEN';
    this.statusCode = 403;
  }
}

class ValidationError extends Error {
  constructor(message = 'Validation Error') {
    super(message);
    this.name = 'VALIDATION_ERROR';
    this.statusCode = 422;
  }
}

module.exports = { NotFoundError, ForbiddenError, ValidationError };