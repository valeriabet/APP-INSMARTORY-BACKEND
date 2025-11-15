import express from "express";
import { autenticarToken } from "../middlewares/autenticacionToken.js";
import { verificarRol } from "../middlewares/autenticacionRol.js";
import { validarLista, crearOrden, listarPendientes } from "../controllers/reabastecimiento.controlador.js";

const router = express.Router();

// Validar lista de productos
router.post(
    "/validar",
    autenticarToken,
    verificarRol(["Administrador", "Gerente de operaciones", "Encargado de inventario"]),
    validarLista
);

// Crear orden de reabastecimiento
router.post(
    "/orden",
    autenticarToken,
    verificarRol(["Administrador", "Gerente de operaciones"]),
    crearOrden
);

// Listar productos que necesitan reabastecimiento
router.get(
    "/pendientes",
    autenticarToken,
    verificarRol(["Administrador", "Gerente de operaciones", "Encargado de inventario"]),
    listarPendientes
);

export default router;
