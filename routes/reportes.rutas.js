import express from 'express';
import { 
    reporteRotacion, 
    reporteMargen, 
    reporteIngresos, 
    reporteAlertas 
} from '../controllers/reportes.controlador.js';

const router = express.Router();

// Rotación de inventario
router.get('/rotacion', reporteRotacion); 

// Margen de ventas
router.get('/margen', reporteMargen);     

// Ingresos por sucursal
router.get('/ingresos', reporteIngresos); 

//Alertas
router.get('/alertas', reporteAlertas);

export default router;
