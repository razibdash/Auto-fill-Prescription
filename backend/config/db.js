// db.js
import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "your_password",
  database: "emr_database",
});
