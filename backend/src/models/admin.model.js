import { pool } from '../config/db.js';

export async function getDashboardStats() {
  const [[members]] = await pool.execute(`
    SELECT COUNT(*) AS totalMembers
    FROM Users
    WHERE Role = 'member'
  `);

  const [[activeMemberships]] = await pool.execute(`
    SELECT COUNT(*) AS activeMemberships
    FROM Memberships
    WHERE Status = 'active'
  `);

  const [[upcomingClasses]] = await pool.execute(`
    SELECT COUNT(*) AS upcomingClasses
    FROM Classes
    WHERE Status = 'scheduled'
  `);

  const [[bookings]] = await pool.execute(`
    SELECT COUNT(*) AS totalBookings
    FROM Bookings
    WHERE Status = 'booked'
  `);

  return {
    totalMembers: members.totalMembers,
    activeMemberships: activeMemberships.activeMemberships,
    upcomingClasses: upcomingClasses.upcomingClasses,
    totalBookings: bookings.totalBookings,
  };
}

export async function getClassBookingsStats() {
  const [rows] = await pool.execute(`
    SELECT
      c.ClassID,
      c.ClassName,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status,
      COUNT(CASE WHEN b.Status = 'booked' THEN b.BookingID END) AS BookedUsers
    FROM Classes c
    LEFT JOIN Bookings b ON c.ClassID = b.ClassID
    GROUP BY
      c.ClassID,
      c.ClassName,
      c.StartDateTime,
      c.EndDateTime,
      c.MaxCapacity,
      c.Room,
      c.Status
    ORDER BY c.StartDateTime ASC
  `);

  return rows;
}