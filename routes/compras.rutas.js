import express from 'express';
import {
  getOrdenesCompra,
  createOrdenCompra,
  updateEstadoOrdenCompra
} from '../controllers/compras.controlador.js';

const router = express.Router();

// Ordenes de Compra 
router.get('/orden', getOrdenesCompra);
router.post('/orden', createOrdenCompra);
router.put('/orden/estado', updateEstadoOrdenCompra);

export default router;
