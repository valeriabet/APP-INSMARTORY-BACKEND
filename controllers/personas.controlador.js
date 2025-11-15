import { getConnection } from "../config/db.js";

//Todas las personas
export const obtenerPersonas = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query("SELECT * FROM persona");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Buscar persona por ID
export const obtenerPersonaPorId = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input("id", id)
      .query("SELECT * FROM persona WHERE id_persona = @id");
    res.json(result.recordset[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Crar persona
export const crearPersona = async (req, res) => {
  const { nombre, correo, telefono } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("nombre", nombre)
      .input("correo", correo)
      .input("telefono", telefono)
      .query("INSERT INTO persona (nombre, correo, telefono) VALUES (@nombre, @correo, @telefono)");
    res.json({ message: "Persona creada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Actualizar persona
export const actualizarPersona = async (req, res) => {
  const { id } = req.params;
  const { nombre, correo, telefono } = req.body;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", id)
      .input("nombre", nombre)
      .input("correo", correo)
      .input("telefono", telefono)
      .query("UPDATE persona SET nombre=@nombre, correo=@correo, telefono=@telefono WHERE id_persona=@id");
    res.json({ message: "Persona actualizada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Eliminar persona
export const eliminarPersona = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await getConnection();
    await pool.request()
      .input("id", id)
      .query("DELETE FROM persona WHERE id_persona=@id");
    res.json({ message: "Persona eliminada exitosamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
