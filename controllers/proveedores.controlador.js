import { getConnection } from '../config/db.js';
import sql from "mssql";

//Todos los proveedores
export const getProveedores = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        p.id_proveedor, 
        per.id_persona,
        per.nombre, 
        per.correo, 
        per.telefono,
        p.direccion, 
        p.condiciones_pago, 
        p.representante, 
        p.representante_tlf
      FROM proveedor p
      INNER JOIN persona per ON p.id_p_persona = per.id_persona
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
};

//buscar proveedor por ID
export const getProveedorById = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input('id_proveedor', sql.Int, id_proveedor)
      .query(`
        SELECT 
          p.id_proveedor, 
          per.id_persona,
          per.nombre, 
          per.correo, 
          per.telefono,
          p.direccion, 
          p.condiciones_pago, 
          p.representante, 
          p.representante_tlf
        FROM proveedor p
        INNER JOIN persona per ON p.id_p_persona = per.id_persona
        WHERE p.id_proveedor = @id_proveedor
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }
    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener proveedor:", error);
    res.status(500).json({ error: "Error al obtener proveedor" });
  }
};

// Crear proveedor
export const createProveedor = async (req, res) => {
  try {
    const { 
      id_persona,    // NIT o cédula
      nombre, 
      correo, 
      telefono, 
      direccion, 
      condiciones_pago, 
      representante, 
      representante_tlf 
    } = req.body;

    if (!id_persona || !nombre || !correo || !telefono || !direccion) {
      return res.status(400).json({ 
        error: "Faltan campos obligatorios: id_persona, nombre, correo, telefono, direccion" 
      });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Insertar persona
    const requestPersona = new sql.Request(transaction);
    await requestPersona
      .input("id_persona", sql.Int, id_persona)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("telefono", sql.VarChar, telefono)
      .query(`
        INSERT INTO persona (id_persona, nombre, correo, telefono)
        VALUES (@id_persona, @nombre, @correo, @telefono)
      `);

    // Insertar proveedor
    const requestProveedor = new sql.Request(transaction);
    await requestProveedor
      .input("id_p_persona", sql.Int, id_persona)
      .input("direccion", sql.VarChar, direccion)
      .input("condiciones_pago", sql.VarChar, condiciones_pago)
      .input("representante", sql.VarChar, representante)
      .input("representante_tlf", sql.VarChar, representante_tlf)
      .query(`
        INSERT INTO proveedor (id_p_persona, direccion, condiciones_pago, representante, representante_tlf)
        VALUES (@id_p_persona, @direccion, @condiciones_pago, @representante, @representante_tlf)
      `);

    await transaction.commit();
    res.status(201).json({ message: "Proveedor creado correctamente", id_persona });

  } catch (error) {
    console.error("Error al crear proveedor:", error);
    // Revertir la transacción si algo falla
    if (error instanceof sql.RequestError && error.transaction) {
      await error.transaction.rollback();
    }
    res.status(500).json({ error: `Error al crear proveedor: ${error.message}` });
  }
};



//Actualizar proveedor
export const updateProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const { nombre, correo, telefono, direccion, condiciones_pago, representante, representante_tlf } = req.body;

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Obtener id_persona asociado
    const result = await new sql.Request(transaction)
      .input("id_proveedor", sql.Int, id_proveedor)
      .query("SELECT id_p_persona FROM proveedor WHERE id_proveedor = @id_proveedor");

    if (result.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    const id_p_persona = result.recordset[0].id_p_persona;

    // Actualizar persona
    await new sql.Request(transaction)
      .input("id_persona", sql.Int, id_p_persona)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("telefono", sql.VarChar, telefono)
      .query(`
        UPDATE persona 
        SET nombre=@nombre, correo=@correo, telefono=@telefono 
        WHERE id_persona=@id_persona
      `);

    // Actualizar proveedor
    await new sql.Request(transaction)
      .input("id_proveedor", sql.Int, id_proveedor)
      .input("direccion", sql.VarChar, direccion)
      .input("condiciones_pago", sql.VarChar, condiciones_pago)
      .input("representante", sql.VarChar, representante)
      .input("representante_tlf", sql.VarChar, representante_tlf)
      .query(`
        UPDATE proveedor 
        SET direccion=@direccion, condiciones_pago=@condiciones_pago,
            representante=@representante, representante_tlf=@representante_tlf
        WHERE id_proveedor=@id_proveedor
      `);

    await transaction.commit();
    res.json({ message: "Proveedor actualizado correctamente" });

  } catch (error) {
    console.error("Error al actualizar proveedor:", error);
    res.status(500).json({ error: "Error al actualizar proveedor" });
  }
};

// Eliminar proveedor y su persona asociada
export const deleteProveedor = async (req, res) => {
  try {
    const { id_proveedor } = req.params;
    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    // Obtener id_persona asociado
    const result = await new sql.Request(transaction)
      .input("id_proveedor", sql.Int, id_proveedor)
      .query("SELECT id_p_persona FROM proveedor WHERE id_proveedor = @id_proveedor");

    if (result.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Proveedor no encontrado" });
    }

    const id_p_persona = result.recordset[0].id_p_persona;

    // Eliminar proveedor
    await new sql.Request(transaction)
      .input("id_proveedor", sql.Int, id_proveedor)
      .query("DELETE FROM proveedor WHERE id_proveedor=@id_proveedor");

    // Eliminar persona
    await new sql.Request(transaction)
      .input("id_persona", sql.Int, id_p_persona)
      .query("DELETE FROM persona WHERE id_persona=@id_persona");

    await transaction.commit();
    res.json({ message: "Proveedor eliminado correctamente" });

  } catch (error) {
    console.error("Error al eliminar proveedor:", error);
    res.status(500).json({ error: "Error al eliminar proveedor" });
  }
};
