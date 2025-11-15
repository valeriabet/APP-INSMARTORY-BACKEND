import express from 'express';
import { 
  registrarAuditoria, 
  listarAuditorias, 
  getAuditoriaById 
} from '../controllers/auditoria.controlador.js';

const router = express.Router();

// Registrar nueva auditoría
router.post('/registrar', registrarAuditoria);

// Listar auditorías con filtros opcionales
router.get('/listar', listarAuditorias);

// Obtener detalle de una auditoría específica
router.get('/:id_auditoria', getAuditoriaById);

export default router;
