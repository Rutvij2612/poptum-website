import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "poptum-secret";

export function generateToken(user: { id: string; role: string }) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}

export function generatePasswordResetToken(email: string) {
  return jwt.sign({ email, kind: "password_reset" }, JWT_SECRET, { expiresIn: "30m" });
}

export function verifyPasswordResetToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}