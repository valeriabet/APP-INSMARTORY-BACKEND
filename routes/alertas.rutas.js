import express from 'express';
import {
  getAlertas,
  getAlertasByTipo,
  resolverAlerta
} from '../controllers/alertas.controlador.js';

const router = express.Router();

// Todas las alertas
router.get('/', getAlertas);

// Obtener alertas por tipo (discrepancia, stock bajo, próximo a vencer)
router.get('/:tipo', getAlertasByTipo);

//Marcar como resuelta
router.put('/:id_alerta/resolver', resolverAlerta);

export default router;
