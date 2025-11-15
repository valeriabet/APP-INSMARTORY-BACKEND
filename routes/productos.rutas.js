import express from "express";
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto
} from "../controllers/productos.controlador.js";

const router = express.Router();

router.get("/", getProductos);
router.get("/:id_producto", getProductoById);
router.post("/", createProducto);
router.put("/:id_producto", updateProducto);
router.delete("/:id_producto", deleteProducto);

export default router;

