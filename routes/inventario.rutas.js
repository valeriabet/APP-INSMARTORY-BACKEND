import express from 'express';
import {
  getInventario,
  getBajoStock,
  getProximosAVencer,
  getMovimientos,
  ajustarInventario
} from '../controllers/inventario.controlador.js';

const router = express.Router();

//Inventario principal
router.get('/', getInventario);

//Bajo stock
router.get('/bajo-stock', getBajoStock);

//Próximos a vencer
router.get('/proximos-a-vencer', getProximosAVencer);

//Movimientos (historial)
router.get('/movimientos', getMovimientos);

router.post('/ajuste', ajustarInventario);
export default router;
