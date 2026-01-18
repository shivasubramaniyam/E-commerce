import { error } from "node:console";
import { registerUser, loginUser } from "./auth.service.js";

export async function register(req, res) {
  try {
    const { email, password } = req.body;
    // console.log("body", req.body);
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await registerUser(email, password);
    res.status(201).json({
      message: "User Registered Successfully",
      userId: user.id,
    });
  } catch (e) {
    res.status(400).json({ message: error.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and Passwrod required " });
    }
    const token = await loginUser(email, password);
    res.json({ token });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
}
