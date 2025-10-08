// medicineService.js
import { db } from "../config/db.js";

export async function checkMedicineInDatabase(name) {
  try {
    if (!name || typeof name !== "string" || name.trim() === "") {
      return { exists: false, error: "Invalid medicine name" };
    }
    // Query the database
    const [rows] = await db.query(
      "SELECT * FROM medicines WHERE name LIKE ? LIMIT 1",
      [`%${name}%`]
    );
    if (rows.length > 0) {
      return { exists: true, medicine: rows[0] };
    } else {
      return { exists: false };
    }
  } catch (err) {
    console.error("❌ Database error:", err);
    return { exists: false, error: "Database error" };
  }
}
