import express from "express";
import {
  loginUsuario,
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  cambiarRol,
  deleteUsuario
} from "../controllers/usuarios.controlador.js";
import { autenticarToken } from "../middlewares/autenticacionToken.js";
import { verificarRol } from "../middlewares/autenticacionRol.js";

const router = express.Router();

//Login público
router.post("/login", loginUsuario);

//crud protegido
router.get("/", autenticarToken, verificarRol(["Administrador", "Gerente"]), getUsuarios);
router.get("/:id_usuario", autenticarToken, getUsuarioById);
router.post("/", autenticarToken, verificarRol(["Administrador"]), createUsuario);
router.put("/:id_usuario", autenticarToken, verificarRol(["Administrador"]), updateUsuario);
router.delete("/:id_usuario", autenticarToken, verificarRol(["Administrador"]), deleteUsuario);
router.patch("/rol/:id_usuario", autenticarToken, verificarRol(["Administrador"]), cambiarRol);


export default router;
