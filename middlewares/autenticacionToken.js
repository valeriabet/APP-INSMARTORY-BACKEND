import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const SECRET_KEY = process.env.SECRET_KEY;

export const autenticarToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  try {
    const usuario = jwt.verify(token, SECRET_KEY);
    req.usuario = usuario;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error.message);
    return res.status(403).json({ message: "Token inválido o expirado" });
  }
};
