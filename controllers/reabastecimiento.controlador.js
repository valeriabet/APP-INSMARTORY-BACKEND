import { getConnection } from "../config/db.js";
import sql from "mssql";

// Validar lista de productos
export const validarLista = async (req, res) => {
    const { lista } = req.body; 
    try {
        const conn = await getConnection();
        const resultados = [];

        for (const item of lista) {
            const { id_producto, cantidad, id_sucursal } = item;

            const result = await conn.request()
                .input("id_producto", sql.Int, id_producto)
                .input("id_sucursal", sql.Int, id_sucursal)
                .query(`
                    SELECT i.cantidad AS stock_actual, p.nombre_producto
                    FROM inventario i
                    INNER JOIN producto p ON i.id_i_producto = p.id_producto
                    WHERE i.id_i_producto = @id_producto
                      AND i.id_i_sucursal = @id_sucursal
                `);

            if (result.recordset.length === 0) {
                resultados.push({ id_producto, estado: "No existe en inventario" });
            } else {
                const stock_actual = result.recordset[0].stock_actual;
                resultados.push({
                    id_producto,
                    producto: result.recordset[0].nombre_producto,
                    stock_actual,
                    cantidad_requerida: cantidad,
                    estado: stock_actual >= cantidad ? "Suficiente" : "Reabastecer",
                });
            }
        }

        res.json(resultados);
    } catch (error) {
        console.error("Error validarLista:", error);
        res.status(500).json({ message: error.message });
    }
};

// Crear orden de reabastecimiento
export const crearOrden = async (req, res) => {
    const { productos, id_sucursal, id_proveedor, id_gerente_responsable } = req.body;

    try {
        const conn = await getConnection();

        // Insertar orden de compra y obtener el id
        const resultOrden = await conn.request()
            .input("id_proveedor", sql.Int, id_proveedor)
            .input("id_gerente_responsable", sql.Int, id_gerente_responsable)
            .input("id_sucursal", sql.Int, id_sucursal)
            .query(`
                INSERT INTO orden_compra
                    (id_o_proveedor, id_gerente_responsable, id_o_sucursal, estado, fecha_orden, subtotal, iva, total)
                OUTPUT INSERTED.id_orden
                VALUES (@id_proveedor, @id_gerente_responsable, @id_sucursal, 'Pendiente', GETDATE(), 0, 0, 0)
            `);

        const idOrden = resultOrden.recordset[0].id_orden;

        let subtotalOrden = 0;

        for (const item of productos) {
            const subtotalProducto = item.cantidad_solicitada * item.precio_unitario;
            subtotalOrden += subtotalProducto;

            await conn.request()
                .input("id_orden", sql.Int, idOrden)
                .input("id_producto", sql.Int, item.id_producto)
                .input("cantidad", sql.Int, item.cantidad_solicitada)
                .input("subtotal", sql.Decimal(18,2), subtotalProducto)
                .input("total", sql.Decimal(18,2), subtotalProducto)
                .input("id_lote", sql.Int, item.id_dc_lote || null)
                .query(`
                    INSERT INTO detalle_compra
                        (id_d_compra, id_d_producto, cantidad, subtotal, total, id_dc_lote)
                    VALUES (@id_orden, @id_producto, @cantidad, @subtotal, @total, @id_lote)
                `);
        }

        const iva = subtotalOrden * 0.19;
        const total = subtotalOrden + iva;

        await conn.request()
            .input("id_orden", sql.Int, idOrden)
            .input("subtotal", sql.Decimal(18,2), subtotalOrden)
            .input("iva", sql.Decimal(18,2), iva)
            .input("total", sql.Decimal(18,2), total)
            .query(`
                UPDATE orden_compra
                SET subtotal = @subtotal, iva = @iva, total = @total
                WHERE id_orden = @id_orden
            `);

        res.status(201).json({
            message: "Orden de reabastecimiento creada",
            idOrden,
            subtotal: subtotalOrden,
            iva,
            total
        });

    } catch (error) {
        console.error("Error crearOrden:", error);
        res.status(500).json({ message: error.message });
    }
};

// Listar productos que necesitan reabastecimiento
export const listarPendientes = async (req, res) => {
    try {
        const conn = await getConnection();
        const result = await conn.request().query(`
            SELECT i.id_i_producto, p.nombre_producto, i.id_i_sucursal, i.cantidad, p.umbral_minimo
            FROM inventario i
            INNER JOIN producto p ON i.id_i_producto = p.id_producto
            WHERE i.cantidad <= p.umbral_minimo
            ORDER BY i.id_i_sucursal, i.id_i_producto
        `);
        res.json(result.recordset);
    } catch (error) {
        console.error("Error listarPendientes:", error);
        res.status(500).json({ message: error.message });
    }
};
