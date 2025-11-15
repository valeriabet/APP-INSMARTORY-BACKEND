import express from 'express';
import {
  getFacturas,
  getFacturaById,
  createFactura,
  updateFactura
} from '../controllers/facturas.controlador.js';

const router = express.Router();

router.get('/', getFacturas);             
router.get('/:id', getFacturaById);          
router.post('/', createFactura);              
router.put('/:id', updateFactura);          

export default router;