export function errorHandler(err, req, res, next) {
  console.error("Error:", err);

  // default value
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma errors
  if (err.code === "P2002") {
    statusCode = 409;
    message = "Duplicate value already exists";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Resource not found";
  }

  // Only send response if headers haven't been sent
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
}
