import { getConnection } from '../config/db.js';

// LISTAR FACTURAS

export const getFacturas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .query('SELECT * FROM factura ORDER BY fecha_emision DESC');
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//DETALLE DE FACTURA
export const getFacturaById = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    const facturaResult = await pool.request()
      .input('id', id)
      .query('SELECT * FROM factura WHERE id_factura=@id');

    if (facturaResult.recordset.length === 0) 
      return res.status(404).send('Factura no encontrada');

    const detalleResult = await pool.request()
      .input('id_d_factura', id)
      .query(`
        SELECT df.*, p.nombre_producto 
        FROM detalle_factura df
        JOIN producto p ON df.id_f_producto = p.id_producto
        WHERE df.id_d_factura=@id_d_factura
      `);

    res.json({
      factura: facturaResult.recordset[0],
      detalle: detalleResult.recordset
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
};

//CREAR FACTURA

export const createFactura = async (req, res) => {
  const { id_f_sucursal, id_f_usuario, id_f_cliente, no_factura, subtotal, iva, total, productos } = req.body;

  const pool = await getConnection();
  const transaction = pool.transaction();

  try {
    await transaction.begin();
    const request = transaction.request();

    // Insertar la factura
    const facturaResult = await request
      .input('id_f_sucursal', id_f_sucursal)
      .input('id_f_usuario', id_f_usuario)
      .input('id_f_cliente', id_f_cliente)
      .input('no_factura', no_factura)
      .input('subtotal', subtotal)
      .input('iva', iva)
      .input('total', total)
      .input('fecha_emision', new Date())
      .query(`
        INSERT INTO factura 
        (id_f_sucursal, id_f_usuario, id_f_cliente, no_factura, fecha_emision, subtotal, iva, total)
        OUTPUT INSERTED.id_factura
        VALUES (@id_f_sucursal, @id_f_usuario, @id_f_cliente, @no_factura, @fecha_emision, @subtotal, @iva, @total)
      `);

    const id_factura = facturaResult.recordset[0].id_factura;

    // Insertar detalle de factura
    for (let p of productos) {
      const detalleReq = transaction.request();
      await detalleReq
        .input('id_d_factura', id_factura)
        .input('id_f_producto', p.id_f_producto)
        .input('cantidad', p.cantidad)
        .input('precio_unitario', p.precio_unitario)
        .input('subtotal', p.cantidad * p.precio_unitario)
        .input('total', p.cantidad * p.precio_unitario)
        .input('id_df_lote', p.id_df_lote)
        .query(`
          INSERT INTO detalle_factura 
          (id_d_factura, id_f_producto, cantidad, precio_unitario, subtotal, total, id_df_lote)
          VALUES (@id_d_factura, @id_f_producto, @cantidad, @precio_unitario, @subtotal, @total, @id_df_lote)
        `);
    }

    //Confirmar transacción
    await transaction.commit();

    res.status(201).json({
      message: 'Factura registrada correctamente (inventario y transacción actualizados automáticamente)',
      id_factura,
    });

  } catch (error) {
    if (transaction._aborted !== true) await transaction.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({
      message: 'Error al registrar la factura. No se realizaron cambios en el inventario.',
      error: error.message,
    });
  }
};

//  ACTUALIZAR FACTURA 

export const updateFactura = async (req, res) => {
  const { id } = req.params;
  const { no_factura, subtotal, iva, total } = req.body;

  try {
    const pool = await getConnection();
    await pool.request()
      .input('id', id)
      .input('no_factura', no_factura)
      .input('subtotal', subtotal)
      .input('iva', iva)
      .input('total', total)
      .query(`
        UPDATE factura
        SET no_factura=@no_factura, subtotal=@subtotal, iva=@iva, total=@total
        WHERE id_factura=@id
      `);
    
    res.json({ message: 'Factura actualizada correctamente' });
  } catch (error) {
    res.status(500).send(error.message);
  }
};
