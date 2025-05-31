import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

let connection;

export const connectToDatabase = async () => {
  if (!connection) {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    console.log("Database connected successfully to Aiven!");
  }
  return connection;
};
