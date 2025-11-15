import { getConnection } from '../config/db.js';

//Registrar auditoría 
export const registrarAuditoria = async (req, res) => {
  const { id_usuario_responsable, id_au_sucursal, tipo, fecha, descripcion } = req.body;

  try {
    // Validación de campos requeridos
    if (!id_usuario_responsable || !id_au_sucursal || !tipo || !fecha || !descripcion) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios.' });
    }

    // Validación del check de sql server
    const tiposValidos = [
      'Inventario fisico',
      'Transacciones',
      'Proximo a vencer',
      'Proveedores',
      'Usuarios',
      'Configuracion'
    ];

    if (!tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: `Tipo inválido. Debe ser tipo: ${tiposValidos.join(', ')}`
      });
    }

    const conn = await getConnection();

    await conn.request()
      .input('id_usuario_responsable', id_usuario_responsable)
      .input('id_au_sucursal', id_au_sucursal)
      .input('tipo', tipo)
      .input('fecha', fecha)
      .input('descripcion', descripcion)
      .query(`
        INSERT INTO auditoria (
          id_usuario_responsable, id_au_sucursal, tipo, fecha, descripcion
        )
        VALUES (
          @id_usuario_responsable, @id_au_sucursal, @tipo, @fecha, @descripcion
        )
      `);

    res.status(201).json({ message: 'Auditoría registrada correctamente.' });
  } catch (error) {
    console.error('Error en registrarAuditoria:', error);
    res.status(500).json({ message: 'Error interno al registrar la auditoría.' });
  }
};

//Listar auditorías 
export const listarAuditorias = async (req, res) => {
  const { id_usuario_responsable, id_au_sucursal, tipo } = req.query;

  try {
    const conn = await getConnection();

    // Tipos válidos segun el check
    const tiposValidos = [
      'Inventario fisico',
      'Transacciones',
      'Proximo a vencer',
      'Proveedores',
      'Usuarios',
      'Configuracion'
    ];

    if (tipo && !tiposValidos.includes(tipo)) {
      return res.status(400).json({
        message: `Tipo inválido. Debe ser tipo: ${tiposValidos.join(', ')}`
      });
    }

    let query = `
      SELECT 
        a.id_auditoria,
        a.id_usuario_responsable,
        a.id_au_sucursal,
        a.tipo,
        a.fecha,
        a.descripcion,
        u.nombre_usuario AS nombre_usuario,
        s.nombre
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario_responsable = u.id_usuario
      LEFT JOIN sucursal s ON a.id_au_sucursal = s.id_sucursal
      WHERE 1=1
    `;

    const request = conn.request();

    if (id_au_sucursal) {
      query += ` AND a.id_au_sucursal = @id_au_sucursal`;
      request.input('id_au_sucursal', id_au_sucursal);
    }

    if (tipo) {
      query += ` AND a.tipo = @tipo`;
      request.input('tipo', tipo);
    }

    if (id_usuario_responsable) {
      query += ` AND a.id_usuario_responsable = @id_usuario_responsable`;
      request.input('id_usuario_responsable', id_usuario_responsable);
    }

    query += ` ORDER BY a.fecha DESC`;

    const result = await request.query(query);
    res.json(result.recordset);

  } catch (error) {
    console.error('Error en listarAuditorias:', error);
    res.status(500).json({ message: 'Error interno al listar auditorías.' });
  }
};


//Detalle de una auditoría
export const getAuditoriaById = async (req, res) => {
  const { id_auditoria } = req.params;

  try {
    const conn = await getConnection();
    const result = await conn.request()
      .input('id_auditoria', id_auditoria)
      .query(`
        SELECT 
          a.id_auditoria,
          a.tipo,
          a.fecha,
          a.descripcion,
          u.nombre_usuario AS nombre_usuario,
          s.nombre
        FROM auditoria a
        LEFT JOIN usuario u ON a.id_usuario_responsable = u.id_usuario
        LEFT JOIN sucursal s ON a.id_au_sucursal = s.id_sucursal
        WHERE a.id_auditoria = @id_auditoria
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Auditoría no encontrada.' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Error en getAuditoriaById:', error);
    res.status(500).json({ message: 'Error interno al obtener auditoría.' });
  }
};
