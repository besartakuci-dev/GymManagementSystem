import { pool } from '../config/db.js';

export async function getDashboardClasses() {
  const [rows] = await pool.execute(`
    SELECT
      c.ClassID,
      c.ClassName,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status,
      COUNT(b.BookingID) AS BookedSpots
    FROM Classes c
    LEFT JOIN Bookings b ON c.ClassID = b.ClassID
    GROUP BY c.ClassID
    ORDER BY c.StartDateTime ASC
  `);

  return rows;
}