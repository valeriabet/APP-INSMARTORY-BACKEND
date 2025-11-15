import { getConnection } from "../config/db.js";

//Todos los clientes
export const obtenerClientes = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT c.id_cliente, p.id_persona, p.nombre, p.correo, p.telefono
      FROM cliente c
      INNER JOIN persona p ON c.id_persona = p.id_persona
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Buscar cliente por ID
export const obtenerClientePorId = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", id)
      .query(`
        SELECT c.id_cliente, p.id_persona, p.nombre, p.correo, p.telefono
        FROM cliente c
        INNER JOIN persona p ON c.id_persona = p.id_persona
        WHERE c.id_cliente = @id
      `);
    if (!result.recordset[0]) return res.status(404).json({ message: "Cliente no encontrado" });
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Crear cliente
export const crearCliente = async (req, res) => {
  const { id_persona, nombre, correo, telefono } = req.body; 
  try {
    const pool = await getConnection();

    // Insertar persona
    await pool.request()
      .input("id_persona", id_persona)
      .input("nombre", nombre)
      .input("correo", correo)
      .input("telefono", telefono)
      .query("INSERT INTO persona (id_persona, nombre, correo, telefono) VALUES (@id_persona, @nombre, @correo, @telefono)");

    // Insertar cliente
    await pool.request()
      .input("id_persona", id_persona)
      .query("INSERT INTO cliente (id_persona) VALUES (@id_persona)");

    res.status(201).json({ message: "Cliente creado exitosamente", id_persona });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Eliminar cliente
export const eliminarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();

    // Obtener id_persona antes de borrar
    const cliente = await pool.request()
      .input("id", id)
      .query("SELECT id_persona FROM cliente WHERE id_cliente=@id");

    if (cliente.recordset.length === 0)
      return res.status(404).json({ message: "Cliente no encontrado" });

    const idPersona = cliente.recordset[0].id_persona;

    // Eliminar cliente y persona asociada
    await pool.request().input("id", id).query("DELETE FROM cliente WHERE id_cliente=@id");
    await pool.request().input("idPersona", idPersona).query("DELETE FROM persona WHERE id_persona=@idPersona");

    res.json({ message: "Cliente y persona eliminados correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

