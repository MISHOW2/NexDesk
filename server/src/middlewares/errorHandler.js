export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const errorStatus = error.statusCode || error.status;
  const statusCode = Number.isInteger(errorStatus) && errorStatus >= 400 && errorStatus < 500
    ? errorStatus
    : 500;

  if (statusCode === 500) {
    console.error("Unhandled API error:", error);
  }

  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : error.message,
  });
}
