import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  console.log("HEADERS:", req.headers);

  // Correctly read header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Missing Authorization header",
    });
  }

  // Expect: "Bearer <token>"
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Invalid Authorization format",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); //  allow request to continue
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
}
