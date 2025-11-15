import { getConnection, sql } from "../config/db.js";

//Todos los productos
export const getProductos = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        id_producto,
        nombre_producto,
        categoria,
        precio_unitario,
        unidad_medida,
        umbral_minimo
      FROM producto
      ORDER BY nombre_producto
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
};

//Buscar producto por ID
export const getProductoById = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id_producto", sql.Int, id_producto)
      .query(`
        SELECT 
          id_producto,
          nombre_producto,
          categoria,
          precio_unitario,
          unidad_medida,
          umbral_minimo
        FROM producto
        WHERE id_producto = @id_producto
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    res.status(500).json({ error: "Error al obtener producto" });
  }
};

//Crear producto
export const createProducto = async (req, res) => {
  try {
    const { nombre_producto, categoria, precio_unitario, unidad_medida, umbral_minimo } = req.body;

    // Validar campos obligatorios
    if (!nombre_producto || !categoria || !precio_unitario || !unidad_medida || !umbral_minimo) {
      return res.status(400).json({
        error: "Faltan campos obligatorios: nombre_producto, categoria, precio_unitario, unidad_medida, umbral_minimo"
      });
    }

    const pool = await getConnection();

    await pool.request()
      .input("nombre_producto", sql.VarChar, nombre_producto.trim())
      .input("categoria", sql.VarChar, categoria.trim())
      .input("precio_unitario", sql.Decimal(10, 2), precio_unitario)
      .input("unidad_medida", sql.VarChar, unidad_medida.trim())
      .input("umbral_minimo", sql.Int, umbral_minimo)
      .query(`
        INSERT INTO producto (nombre_producto, categoria, precio_unitario, unidad_medida, umbral_minimo)
        VALUES (@nombre_producto, @categoria, @precio_unitario, @unidad_medida, @umbral_minimo)
      `);

    res.status(201).json({ message: "Producto creado correctamente" });
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({ error: "Error al crear producto" });
  }
};

//Actualizar producto
export const updateProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const { nombre_producto, categoria, precio_unitario, unidad_medida, umbral_minimo } = req.body;

    const pool = await getConnection();

    const result = await pool.request()
      .input("id_producto", sql.Int, id_producto)
      .input("nombre_producto", sql.VarChar, nombre_producto)
      .input("categoria", sql.VarChar, categoria)
      .input("precio_unitario", sql.Decimal(10, 2), precio_unitario)
      .input("unidad_medida", sql.VarChar, unidad_medida)
      .input("umbral_minimo", sql.Int, umbral_minimo)
      .query(`
        UPDATE producto
        SET 
          nombre_producto = @nombre_producto,
          categoria = @categoria,
          precio_unitario = @precio_unitario,
          unidad_medida = @unidad_medida,
          umbral_minimo = @umbral_minimo
        WHERE id_producto = @id_producto
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
};

//Desactivar producto
export const deleteProducto = async (req, res) => {
  try {
    const { id_producto } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id_producto", sql.Int, id_producto)
      .query("UPDATE producto SET estado = 'Inactivo' WHERE id_producto = @id_producto");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ message: "Producto desactivado correctamente" });
  } catch (error) {
    console.error("Error al desactivar producto:", error);
    res.status(500).json({ error: "Error al desactivar producto" });
  }
};

