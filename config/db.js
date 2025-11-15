import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbSettings = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: Number(process.env.DB_PORT),
  options: {
    encrypt: process.env.DB_ENCRYPT === "true",
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
  },
};

export async function getConnection() {
  try {
    const pool = await sql.connect(dbSettings);
    console.log("Conectado a SQL Server");
    return pool;
  } catch (error) {
    console.error("Error de conexión:", error);
  }
}

export { sql };
