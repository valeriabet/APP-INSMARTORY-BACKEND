import express from 'express';
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor
} from '../controllers/proveedores.controlador.js';

const router = express.Router();

router.get('/', getProveedores);
router.get('/:id_proveedor', getProveedorById);
router.post('/', createProveedor);
router.put('/:id_proveedor', updateProveedor);
router.delete('/:id_proveedor', deleteProveedor);

export default router;
