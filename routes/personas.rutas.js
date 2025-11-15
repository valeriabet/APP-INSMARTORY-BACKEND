import express from "express";
import { obtenerPersonas, obtenerPersonaPorId, crearPersona, actualizarPersona, eliminarPersona } from "../controllers/personas.controlador.js";

const router = express.Router();

router.get("/", obtenerPersonas);
router.get("/:id", obtenerPersonaPorId);
router.post("/", crearPersona);
router.put("/:id", actualizarPersona);
router.delete("/:id", eliminarPersona);

export default router;
