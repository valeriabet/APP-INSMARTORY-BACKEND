import { getConnection, sql } from '../config/db.js';

// Todo el inventario con detalle de producto y sucursal
export const getInventario = async (req, res) => {
  const { producto, sucursal } = req.query;
  try {
    const pool = await getConnection();
    let query = `
      SELECT 
        i.id_inventario,
        i.id_i_sucursal,
        i.id_i_producto,
        i.id_i_lote,
        i.fecha_actualizacion,
        i.cantidad,
        p.nombre_producto,
        p.unidad_medida
      FROM inventario i
      INNER JOIN producto p ON i.id_i_producto = p.id_producto
      WHERE 1=1
    `;
    if (producto) query += ` AND i.id_i_producto = ${producto}`;
    if (sucursal) query += ` AND i.id_i_sucursal = ${sucursal}`;

    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener inventario' });
  }
};

// Consultar productos con stock bajo
export const getBajoStock = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        i.id_inventario,
        p.nombre_producto,
        i.cantidad,
        p.umbral_minimo
      FROM inventario i
      INNER JOIN producto p ON i.id_i_producto = p.id_producto
      WHERE i.cantidad <= p.umbral_minimo
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos con bajo stock:', error);
    res.status(500).json({ error: 'Error al obtener productos con bajo stock' });
  }
};

//Consultar productos próximos a vencer
export const getProximosAVencer = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        i.id_inventario,
        i.id_i_producto,
        p.nombre_producto,
        i.id_i_lote,
        i.fecha_actualizacion
      FROM inventario i
      INNER JOIN producto p ON i.id_i_producto = p.id_producto
      WHERE i.fecha_actualizacion <= DATEADD(day, 7, GETDATE())
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener productos próximos a vencer:', error);
    res.status(500).json({ error: 'Error al obtener productos próximos a vencer' });
  }
};

//Historial de movimientos del inventario
export const getMovimientos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        t.id_transaccion,
        t.tipo,
        t.cantidad,
        t.fecha,
        t.referencia,
        t.id_t_producto AS id_producto,
        p.nombre_producto,
        t.id_trans_lote AS id_lote,
        i.id_i_sucursal AS id_sucursal,
        i.cantidad AS cantidad_actual
      FROM transaccion t
      INNER JOIN inventario i 
        ON t.id_t_producto = i.id_i_producto
        AND t.id_trans_lote = i.id_i_lote
      INNER JOIN producto p 
        ON t.id_t_producto = p.id_producto
      ORDER BY t.fecha DESC
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error('Error al obtener movimientos del inventario:', error);
    res.status(500).json({ error: 'Error al obtener movimientos del inventario' });
  }
};

//Ajuste de inventario (entrada o salida)
export const ajustarInventario = async (req, res) => {
  const { id_producto, id_sucursal, cantidad, tipo, motivo } = req.body;
  if (!id_producto || !id_sucursal || !cantidad || !tipo) {
    return res.status(400).json({ message: 'Faltan datos obligatorios: id_producto, id_sucursal, cantidad, tipo' });
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = transaction.request();

    // Obtener inventario actual
    const invResult = await request
      .input('id_producto', sql.Int, id_producto)
      .input('id_sucursal', sql.Int, id_sucursal)
      .query('SELECT * FROM inventario WHERE id_i_producto=@id_producto AND id_i_sucursal=@id_sucursal');

    if (invResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Producto no encontrado en la sucursal' });
    }

    const inventario = invResult.recordset[0];
    let nuevaCantidad = inventario.cantidad;
    if (tipo === 'entrada') {
      nuevaCantidad += cantidad;
    } else if (tipo === 'salida') {
      nuevaCantidad -= cantidad;
      if (nuevaCantidad < 0) nuevaCantidad = 0;
    } else {
      await transaction.rollback();
      return res.status(400).json({ message: 'Tipo inválido. Debe ser "Entrada" o "Salida"' });
    }

    // Actualizar inventario
    await request
      .input('cantidad', sql.Int, nuevaCantidad)
      .input('id_inventario', sql.Int, inventario.id_inventario)
      .query('UPDATE inventario SET cantidad=@cantidad, fecha_actualizacion=GETDATE() WHERE id_inventario=@id_inventario');

    // Registrar transacción
    await request
      .input('tipo', sql.VarChar(20), tipo)
      .input('cantidad', sql.Int, cantidad)
      .input('referencia', sql.VarChar(255), motivo || '')
      .input('id_producto', sql.Int, id_producto)
      .input('id_lote', sql.Int, inventario.id_i_lote)
      .query(`
        INSERT INTO transaccion (tipo, cantidad, referencia, id_t_producto, id_trans_lote, fecha)
        VALUES (@tipo, @cantidad, @referencia, @id_producto, @id_lote, GETDATE())
      `);

    await transaction.commit();
    res.json({ message: `Inventario ajustado correctamente. Nueva cantidad: ${nuevaCantidad}` });
  } catch (error) {
    await transaction.rollback();
    console.error('Error al ajustar inventario:', error);
    res.status(500).json({ message: 'Error al ajustar inventario', error: error.message });
  }
};

