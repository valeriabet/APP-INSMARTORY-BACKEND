import { getConnection } from '../config/db.js';

// Todas las alertas
export const getAlertas = async (req, res) => {
  try {
    const conn = await getConnection();
    const result = await conn.query(`
      SELECT 
        a.id_alerta,
        a.tipo,
        a.fecha,
        a.estado,
        a.cantidad,
        p.nombre_producto,
        s.nombre,
        u.nombre_usuario AS receptor
      FROM alerta a
      INNER JOIN producto p ON a.id_a_producto = p.id_producto
      INNER JOIN sucursal s ON a.id_a_sucursal = s.id_sucursal
      INNER JOIN usuario u ON a.id_usuario_receptor = u.id_usuario
      ORDER BY a.fecha DESC;
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Alertas filtradas por tipo
export const getAlertasByTipo = async (req, res) => {
  const { tipo } = req.params;
  try {
    const conn = await getConnection();
    const result = await conn.query(`
      SELECT 
        a.id_alerta,
        a.tipo,
        a.fecha,
        a.estado,
        a.cantidad,
        p.nombre_producto,
        s.nombre,
        u.nombre_usuario AS receptor
      FROM alerta a
      INNER JOIN producto p ON a.id_a_producto = p.id_producto
      INNER JOIN sucursal s ON a.id_a_sucursal = s.id_sucursal
      INNER JOIN usuario u ON a.id_usuario_receptor = u.id_usuario
      WHERE a.tipo = '${tipo}'
      ORDER BY a.fecha DESC;
    `);
    res.json(result.recordset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Marcar una alerta como resuelta
export const resolverAlerta = async (req, res) => {
  const { id_alerta } = req.params;
  try {
    const conn = await getConnection();
    await conn.query(`
      UPDATE alerta
      SET estado = 'Resuelta'
      WHERE id_alerta = ${id_alerta} AND estado != 'Resuelta';
    `);
    res.json({ message: ` Alerta #${id_alerta} marcada como resuelta.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
