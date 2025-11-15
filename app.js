import express from "express";
import dotenv from "dotenv";
import { getConnection } from "./config/db.js";

// Importar rutas
import usuariosRoutes from "./routes/usuarios.rutas.js";
import productosRoutes from "./routes/productos.rutas.js";
import proveedoresRoutes from "./routes/proveedor.rutas.js";
import comprasRoutes from "./routes/compras.rutas.js";
import facturasRoutes from "./routes/facturas.rutas.js";
import inventarioRoutes from "./routes/inventario.rutas.js";
import alertasRoutes from "./routes/alertas.rutas.js";
import reportesRoutes from "./routes/reportes.rutas.js";
import reabastecimientoRoutes from "./routes/reabastecimiento.rutas.js";
import auditoriaRoutes from "./routes/auditorias.rutas.js";
import configuracionesRoutes from "./routes/configuraciones.rutas.js";
import personaRoutes from "./routes/personas.rutas.js";
import clienteRoutes from "./routes/clientes.rutas.js";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// Verificar conexión con la base de datos
(async () => {
  try {
    const conn = await getConnection();
    console.log("Conexión exitosa a la base de datos");
    conn.close();
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error.message);
  }
})();

// Rutas api
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/proveedores", proveedoresRoutes);
app.use("/api/compras", comprasRoutes);
app.use("/api/facturas", facturasRoutes);
app.use("/api/inventario", inventarioRoutes);
app.use("/api/alertas", alertasRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/reabastecimiento", reabastecimientoRoutes);
app.use("/api/auditorias", auditoriaRoutes);
app.use("/api/configuraciones", configuracionesRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api/clientes", clienteRoutes);

// Ruta raiz
app.get("/", (req, res) => {
  res.send("Insmartory funcionando correctamente");
});

// Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
