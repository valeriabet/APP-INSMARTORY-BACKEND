import express from "express";
import { obtenerClientes, obtenerClientePorId, crearCliente, eliminarCliente } from "../controllers/clientes.controlador.js";

const router = express.Router();

router.get("/", obtenerClientes);
router.get("/:id", obtenerClientePorId);
router.post("/", crearCliente);
router.delete("/:id", eliminarCliente);

export default router;
