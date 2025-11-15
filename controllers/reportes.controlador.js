import { getConnection, sql } from '../config/db.js';

//Reporte de rotación de inventario
export const reporteRotacion = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Debe proporcionar fechaInicio y fechaFin.' });
        }

        const conn = await getConnection();

        const result = await conn
            .request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    p.id_producto,
                    p.nombre_producto AS producto,
                    i.id_i_sucursal AS sucursal,
                    SUM(CASE WHEN t.tipo = 'Salida' THEN t.cantidad ELSE 0 END) AS cantidad_vendida,
                    SUM(CASE WHEN t.tipo = 'Entrada' THEN t.cantidad ELSE 0 END) AS cantidad_comprada,
                    i.cantidad AS stock_actual
                FROM transaccion t
                INNER JOIN inventario i 
                    ON t.id_t_producto = i.id_i_producto 
                    AND t.id_trans_lote = i.id_i_lote
                INNER JOIN producto p 
                    ON t.id_t_producto = p.id_producto
                WHERE t.fecha BETWEEN @fechaInicio AND @fechaFin
                GROUP BY p.id_producto, p.nombre_producto, i.id_i_sucursal, i.cantidad
                ORDER BY cantidad_vendida DESC;
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error en reporteRotacion:', error);
        res.status(500).json({ message: 'Error al generar el reporte de rotación.', error: error.message });
    }
};

// Reporte de margen de ventas
export const reporteMargen = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Debe proporcionar fechaInicio y fechaFin.' });
        }

        const conn = await getConnection();

        const result = await conn
            .request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    p.id_producto,
                    p.nombre_producto AS producto,
                    SUM(df.cantidad * (df.total - p.precio_unitario)) AS margen_total,
                    SUM(df.cantidad * df.total) AS ingreso_total
                FROM detalle_factura df
                INNER JOIN producto p ON df.id_f_producto = p.id_producto
                INNER JOIN factura f ON df.id_d_factura = f.id_factura
                WHERE f.fecha_emision BETWEEN @fechaInicio AND @fechaFin
                GROUP BY p.id_producto, p.nombre_producto
                ORDER BY margen_total DESC;
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error en reporteMargen:', error);
        res.status(500).json({ message: 'Error al generar el reporte de margen de ventas.', error: error.message });
    }
};

// Reporte de ingresos por sucursal
export const reporteIngresos = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.query;
        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ message: 'Debe proporcionar fechaInicio y fechaFin.' });
        }

        const conn = await getConnection();

        const result = await conn
            .request()
            .input('fechaInicio', sql.DateTime, fechaInicio)
            .input('fechaFin', sql.DateTime, fechaFin)
            .query(`
                SELECT 
                    f.id_f_sucursal AS sucursal,
                    SUM(df.cantidad * df.total) AS ingresos_totales
                FROM factura f
                INNER JOIN detalle_factura df ON f.id_factura = df.id_d_factura
                WHERE f.fecha_emision BETWEEN @fechaInicio AND @fechaFin
                GROUP BY f.id_f_sucursal
                ORDER BY ingresos_totales DESC;
            `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error en reporteIngresos:', error);
        res.status(500).json({ message: 'Error al generar el reporte de ingresos por sucursal.', error: error.message });
    }
};

//Reporte de alertas
export const reporteAlertas = async (req, res) => {
    try {
        const conn = await getConnection();

        const result = await conn.request().query(`
            SELECT 
                tipo,
                estado,
                COUNT(*) AS total_alertas
            FROM alerta
            GROUP BY tipo, estado
            ORDER BY tipo, estado;
        `);

        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error en reporteAlertas:', error);
        res.status(500).json({ message: 'Error al generar el reporte de alertas.', error: error.message });
    }
};
