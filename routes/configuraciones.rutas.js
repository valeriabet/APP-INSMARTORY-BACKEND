import express from "express";
import {
  cambiarRol,
  cambiarEstadoUsuario,
  restablecerContrasena,
  listarUsuariosConfiguraciones,
  obtenerUsuariosConfigurables,
} from "../controllers/configuraciones.controlador.js";
import { autenticarToken } from "../middlewares/autenticacionToken.js";
import { verificarRol } from "../middlewares/autenticacionRol.js";

const router = express.Router();

// Obtener todos los usuarios configurables
router.get(
  "/usuarios",
  autenticarToken,
  verificarRol(["Administrador"]),
  obtenerUsuariosConfigurables
);

// Listar usuarios con sus configuraciones
router.get(
  "/usuarios/configuraciones",
  autenticarToken,
  verificarRol(["Administrador"]),
  listarUsuariosConfiguraciones
);

// Cambiar rol de usuario
router.put(
  "/cambiar-rol",
  autenticarToken,
  verificarRol(["Administrador"]),
  cambiarRol
);

// Activar o desactivar usuario
router.put(
  "/cambiar-estado",
  autenticarToken,
  verificarRol(["Administrador"]),
  cambiarEstadoUsuario
);

// Restablecer contraseña
router.put(
  "/restablecer-contrasena",
  autenticarToken,
  verificarRol(["Administrador"]),
  restablecerContrasena
);

export default router;
