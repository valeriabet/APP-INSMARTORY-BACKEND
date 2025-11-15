import { getConnection } from '../config/db.js';
import sql from 'mssql';


export const getOrdenesCompra = async (req, res) => {
  const { id_sucursal, id_proveedor, estado } = req.query;
  try {
    const pool = await getConnection();
    let query = 'SELECT * FROM orden_compra WHERE 1=1';
    if (id_sucursal) query += ` AND id_o_sucursal = ${id_sucursal}`;
    if (id_proveedor) query += ` AND id_o_proveedor = ${id_proveedor}`;
    if (estado) query += ` AND estado = '${estado}'`;
    query += ' ORDER BY fecha_orden DESC';
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error getOrdenesCompra:', error);
    res.status(500).send(error.message);
  }
};

export const createOrdenCompra = async (req, res) => {
  const {
    id_o_proveedor,
    id_o_sucursal,
    id_gerente_responsable,
    productos 
  } = req.body;

  if (!id_o_proveedor || !id_o_sucursal || !id_gerente_responsable || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({ message: 'Faltan datos obligatorios: id_o_proveedor, id_o_sucursal, id_gerente_responsable, productos' });
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Insertar orden_compra y obtener id_orden
    const trRequest = new sql.Request(transaction);
    const fecha_orden = new Date();
    const insertOrden = await trRequest
      .input('id_o_proveedor', sql.Int, id_o_proveedor)
      .input('id_o_sucursal', sql.Int, id_o_sucursal)
      .input('id_gerente_responsable', sql.Int, id_gerente_responsable)
      .input('estado', sql.VarChar(20), 'pendiente')
      .input('fecha_orden', sql.DateTime, fecha_orden)
      .input('subtotal', sql.Decimal(18,2), 0)
      .input('iva', sql.Decimal(18,2), 0)
      .input('total', sql.Decimal(18,2), 0)
      .query(`
        INSERT INTO orden_compra
          (id_o_proveedor, id_o_sucursal, id_gerente_responsable, estado, fecha_orden, subtotal, iva, total)
        OUTPUT INSERTED.id_orden
        VALUES (@id_o_proveedor, @id_o_sucursal, @id_gerente_responsable, @estado, @fecha_orden, @subtotal, @iva, @total)
      `);

    const id_orden = insertOrden.recordset[0].id_orden;

    // Procesar cada producto del detalle
    let subtotal = 0;

    for (const p of productos) {
      if (!p.id_d_producto || !p.cantidad || !p.precio_unitario) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Cada producto debe tener id_d_producto, cantidad y precio_unitario' });
      }

      const cantidad = parseInt(p.cantidad, 10);
      const precio_unitario = parseFloat(p.precio_unitario);
      const subtotalProducto = Number((cantidad * precio_unitario).toFixed(2));
      subtotal += subtotalProducto;

      // Insertar detalle_compra
      const detalleRequest = new sql.Request(transaction);
      await detalleRequest
        .input('id_d_compra', sql.Int, id_orden)
        .input('id_d_producto', sql.Int, p.id_d_producto)
        .input('cantidad', sql.Int, cantidad)
        .input('precio_unitario', sql.Decimal(18,2), precio_unitario)
        .input('subtotal', sql.Decimal(18,2), subtotalProducto)
        .input('total', sql.Decimal(18,2), subtotalProducto)
        .input('id_dc_lote', sql.Int, null)
        .query(`
          INSERT INTO detalle_compra
            (id_d_compra, id_d_producto, cantidad, precio_unitario, subtotal, total, id_dc_lote)
          VALUES (@id_d_compra, @id_d_producto, @cantidad, @precio_unitario, @subtotal, @total, @id_dc_lote)
        `);

      // Crear lote automáticamente
      const loteRequest = new sql.Request(transaction);
      const noLoteResult = await loteRequest
        .input('id_l_producto', sql.Int, p.id_d_producto)
        .query(`SELECT ISNULL(MAX(no_lote), 0) + 1 AS next_no FROM lote WHERE id_l_producto = @id_l_producto`);

      const next_no_lote = noLoteResult.recordset[0].next_no;
      const recepcion = new Date();
      const vencimiento = p.vencimiento ? new Date(p.vencimiento) : null;

      const insertLoteRequest = new sql.Request(transaction);
const insertLote = await insertLoteRequest
  .input('id_l_producto', sql.Int, p.id_d_producto)
  .input('id_l_sucursal', sql.Int, id_o_sucursal)
  .input('no_lote', sql.Int, next_no_lote)
  .input('cantidad_lote', sql.Int, cantidad)
  .input('vencimiento', sql.Date, vencimiento)
  .input('recepcion', sql.DateTime, recepcion)
  .query(`
    INSERT INTO lote (id_l_producto, id_l_sucursal, no_lote, cantidad_lote, vencimiento, recepcion)
    OUTPUT INSERTED.id_lote
    VALUES (@id_l_producto, @id_l_sucursal, @no_lote, @cantidad_lote, @vencimiento, @recepcion)
  `);

const id_l_lote = insertLote.recordset[0].id_lote;


      //Actualizar el detalle_compra con id_dc_lote
      const updateDetalleRequest = new sql.Request(transaction);
      await updateDetalleRequest
        .input('id_dc_lote', sql.Int, id_l_lote)
        .input('id_d_compra_update', sql.Int, id_orden)
        .input('id_d_producto_update', sql.Int, p.id_d_producto)
        .query(`
          UPDATE detalle_compra
          SET id_dc_lote = @id_dc_lote
          WHERE id_d_compra = @id_d_compra_update AND id_d_producto = @id_d_producto_update
          AND id_dc_lote IS NULL
  `);

    }

    //Calcular y actualizar totales de la orden con un Request separado
    const iva = Number((subtotal * 0.19).toFixed(2));
    const total = Number((subtotal + iva).toFixed(2));

    const updateOrdenRequest = new sql.Request(transaction);
    await updateOrdenRequest
      .input('id_orden_update', sql.Int, id_orden)
      .input('subtotal', sql.Decimal(18,2), subtotal)
      .input('iva', sql.Decimal(18,2), iva)
      .input('total', sql.Decimal(18,2), total)
      .query(`
        UPDATE orden_compra
        SET subtotal = @subtotal, iva = @iva, total = @total
        WHERE id_orden = @id_orden_update
      `);

    await transaction.commit();
    res.status(201).json({
      message: 'Orden de compra creada',
      id_orden,
      subtotal,
      iva,
      total
    });

  } catch (error) {
    console.error('Error createOrdenCompra:', error);
    try { await transaction.rollback(); } catch (e) { console.error('Rollback error:', e); }
    res.status(500).json({ message: error.message });
  }
};


// Actualizar estado de la orden
export const updateEstadoOrdenCompra = async (req, res) => {
  const { id_orden, estado } = req.body;
  if (!id_orden || !estado) return res.status(400).json({ message: 'id_orden y estado son requeridos' });
  try {
    const pool = await getConnection();
    await pool.request()
      .input('id_orden', sql.Int, id_orden)
      .input('estado', sql.VarChar(20), estado)
      .query('UPDATE orden_compra SET estado=@estado WHERE id_orden=@id_orden');
    res.json({ message: `Orden #${id_orden} actualizada a estado '${estado}'` });
  } catch (error) {
    console.error('Error updateEstadoOrdenCompra:', error);
    res.status(500).send(error.message);
  }
};
