import { registerUser, loginUser } from "./auth.service.js";

export async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await registerUser(email, password);
    res.status(201).json({
      message: "User Registered Successfully",
      userId: user.id,
    });
  } catch (e) {
    next(e); // ✅ propagate to global error handler
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (e) {
    next(e); // ✅ propagate to global error handler
  }
}
