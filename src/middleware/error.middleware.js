import { error } from "console";

export function errorHandler(err, req, res, next) {
  console.error("Error : ", err);

  // default value
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma errors (optional but recommended)
  if (err.code === "P2002") {
    statusCode = 400;
    message = "Duplpicate value already exists";
  }

  if (err.code === "P2025") {
    statusCode = 404;
    message = "Resource not found";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}
