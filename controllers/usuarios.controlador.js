import { getConnection } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();
const SECRET_KEY = process.env.SECRET_KEY;

// Generar token
export const generarToken = (usuario) => {
  return jwt.sign(
    { id_usuario: usuario.id_usuario, rol: usuario.rol, nombre: usuario.nombre },
    SECRET_KEY,
    { expiresIn: "8h" }
  );
};

// Verificar token
export const verificarToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    return null;
  }
};

//Crear nuevo usuario
export const createUsuario = async (req, res) => {
  try {
    const {
      id_persona,
      nombre,
      correo,
      telefono,
      id_empleado,
      rol,
      nombre_usuario,
      contrasena,
      estado
    } = req.body;

    if (!id_persona || !nombre || !correo || !contrasena || !rol || !nombre_usuario) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const pool = await getConnection();

    await pool.request()
      .input("id_persona", sql.Int, id_persona)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("telefono", sql.VarChar, telefono)
      .query(`
        INSERT INTO persona (id_persona, nombre, correo, telefono)
        VALUES (@id_persona, @nombre, @correo, @telefono)
      `);

    await pool.request()
      .input("id_u_persona", sql.Int, id_persona)
      .input("id_empleado", sql.Int, id_empleado)
      .input("contrasena", sql.VarChar, hashedPassword)
      .input("estado", sql.VarChar, estado || "Activo")
      .input("nombre_usuario", sql.VarChar, nombre_usuario)
      .input("rol", sql.VarChar, rol)
      .query(`
        INSERT INTO usuario (id_u_persona, id_empleado, contrasena, estado, nombre_usuario, rol)
        VALUES (@id_u_persona, @id_empleado, @contrasena, @estado, @nombre_usuario, @rol)
      `);

    res.status(201).json({ message: "Usuario creado correctamente" });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: error.message });
  }
};

//Login
export const loginUsuario = async (req, res) => {
  try {
    const { nombre_usuario, contrasena } = req.body;

    if (!nombre_usuario || !contrasena) {
      return res.status(400).json({ error: "Nombre de usuario y contraseña requeridos" });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input("nombre_usuario", sql.VarChar, nombre_usuario)
      .query(`
        SELECT u.*, p.nombre, p.correo, p.telefono
        FROM usuario u
        INNER JOIN persona p ON u.id_u_persona = p.id_persona
        WHERE u.nombre_usuario = @nombre_usuario AND u.estado = 'Activo'
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const user = result.recordset[0];

    // uitar bcrypt para pruebas de texto plano
    if (contrasena !== user.contrasena) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const token = generarToken(user);

    res.json({
      message: "Login exitoso",
      token,
      usuario: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        nombre: user.nombre,
        correo: user.correo,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error("Error en loginUsuario:", error);
    res.status(500).json({ error: "Error al iniciar sesión" });
  }
};

// Mostrar todos los usuarios
export const getUsuarios = async (req, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        u.id_usuario,
        p.id_persona,
        p.nombre,
        p.correo,
        p.telefono,
        u.nombre_usuario,
        u.rol,
        u.estado
      FROM usuario u
      INNER JOIN persona p ON u.id_u_persona = p.id_persona
    `);
    res.json(result.recordset);
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

// Buscar usuario por ID
export const getUsuarioById = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const pool = await getConnection();
    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query(`
        SELECT 
          u.id_usuario,
          p.id_persona,
          p.nombre,
          p.correo,
          p.telefono,
          u.nombre_usuario,
          u.rol,
          u.estado
        FROM usuario u
        INNER JOIN persona p ON u.id_u_persona = p.id_persona
        WHERE u.id_usuario = @id_usuario
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
};

// Actualizar usuario y persona
export const updateUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { nombre, correo, telefono, rol, nombre_usuario, contrasena, estado } = req.body;

    const pool = await getConnection();

    // Obtener id_persona asociado
    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query("SELECT id_u_persona FROM usuario WHERE id_usuario=@id_usuario");

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const id_persona = result.recordset[0].id_u_persona;

    // Actualizar persona
    await pool.request()
      .input("id_persona", sql.Int, id_persona)
      .input("nombre", sql.VarChar, nombre)
      .input("correo", sql.VarChar, correo)
      .input("telefono", sql.VarChar, telefono)
      .query(`
        UPDATE persona 
        SET nombre=@nombre, correo=@correo, telefono=@telefono 
        WHERE id_persona=@id_persona
      `);

    // Actualizar usuario
    let hashedPassword = null;
    if (contrasena) hashedPassword = await bcrypt.hash(contrasena, 10);

    await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("rol", sql.VarChar, rol)
      .input("nombre_usuario", sql.VarChar, nombre_usuario)
      .input("estado", sql.VarChar, estado)
      .input("contrasena", sql.VarChar, hashedPassword)
      .query(`
        UPDATE usuario
        SET rol=@rol,
            nombre_usuario=@nombre_usuario,
            estado=@estado
            ${hashedPassword ? ", contrasena=@contrasena" : ""}
        WHERE id_usuario=@id_usuario
      `);

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// Cambiar rol de usuario
export const cambiarRol = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const { nuevoRol } = req.body;

    if (!nuevoRol) return res.status(400).json({ message: "Debe indicar el nuevo rol" });

    const pool = await getConnection();

    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .input("nuevoRol", sql.VarChar, nuevoRol)
      .query(`UPDATE usuario SET rol = @nuevoRol WHERE id_usuario = @id_usuario`);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Rol actualizado correctamente", id_usuario, nuevoRol });
  } catch (error) {
    console.error("Error al cambiar rol:", error);
    res.status(500).json({ message: "Error al cambiar rol del usuario" });
  }
};


// Desactivar usuario
export const deleteUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    const pool = await getConnection();

    const result = await pool.request()
      .input("id_usuario", sql.Int, id_usuario)
      .query("UPDATE usuario SET estado = 'Inactivo' WHERE id_usuario = @id_usuario");

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ message: "Usuario desactivado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
};
