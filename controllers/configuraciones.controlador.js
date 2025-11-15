import { getConnection } from "../config/db.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

// Lista de usuarios con sus roles

export const obtenerUsuariosConfigurables = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT *
      FROM usuario
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener usuarios configurables:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};


// Cambiar rol de un usuario
export const cambiarRol = async (req, res) => {
  const { id_usuario, nuevoRol } = req.body;

  // Roles válidos
  const rolesPermitidos = [
    "Administrador",
    "Gerente de operaciones",
    "Encargado de inventario",
  ];

  try {
    if (!rolesPermitidos.includes(nuevoRol)) {
      return res.status(400).json({ message: "Rol no válido." });
    }

    const conn = await getConnection();
    await conn.request()
      .input("id_usuario", id_usuario)
      .input("nuevoRol", nuevoRol)
      .query(`
        UPDATE usuario
        SET rol = @nuevoRol
        WHERE id_usuario = @id_usuario
      `);

    res.status(200).json({ message: "Rol actualizado correctamente." });
  } catch (error) {
    console.error("Error en cambiarRol:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Activar o desactivar usuario
export const cambiarEstadoUsuario = async (req, res) => {
  const { id_usuario, estado } = req.body;

  try {
    if (!["Activo", "Inactivo"].includes(estado)) {
      return res.status(400).json({ message: "Estado no válido." });
    }

    const conn = await getConnection();
    await conn.request()
      .input("id_usuario", id_usuario)
      .input("estado", estado)
      .query(`
        UPDATE usuario
        SET estado = @estado
        WHERE id_usuario = @id_usuario
      `);

    res.status(200).json({ message: `Usuario marcado como ${estado}.` });
  } catch (error) {
    console.error("❌ Error en cambiarEstadoUsuario:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Restablecer contraseña de un usuario

export const restablecerContrasena = async (req, res) => {
  const { id_usuario, nuevaContrasena } = req.body;

  try {
    if (!nuevaContrasena || nuevaContrasena.trim() === "") {
      return res.status(400).json({ message: "Debe ingresar una nueva contraseña." });
    }

    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
    const conn = await getConnection();

    await conn.request()
      .input("id_usuario", id_usuario)
      .input("nuevaContrasena", hashedPassword)
      .query(`
        UPDATE usuario
        SET contrasena = @nuevaContrasena
        WHERE id_usuario = @id_usuario
      `);

    res.status(200).json({ message: "Contraseña restablecida correctamente." });
  } catch (error) {
    console.error("Error en restablecerContrasena:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

//Listar usuarios y configuraciones actuales
export const listarUsuariosConfiguraciones = async (req, res) => {
  try {
    const conn = await getConnection();
    const result = await conn.request().query(`
      SELECT *
      FROM usuario
      ORDER BY rol, nombre_usuario
    `);
    res.status(200).json(result.recordset);
  } catch (error) {
    console.error("Error en listarUsuariosConfiguraciones:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};


