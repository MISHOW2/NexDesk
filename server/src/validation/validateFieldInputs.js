export function createValidationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function validateFieldInputs(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== "string" || !value.trim()) {
      throw createValidationError(`${key} is required`);
    }
  }
}
