USE gym_db;

-- ═══════════════════════════════════════════════════════════════════════════════
--  SCHEDULE GENERATOR
--  How to use:
--    1. Edit the SCHEDULE CONFIGURATION section below
--    2. Run the whole file in MySQL Workbench or via CLI
--    3. Re-run any time you want to regenerate the schedule
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- SETTINGS  ← change these two values before running
-- ─────────────────────────────────────────────────────────────────────────────

SET @start_date = '2026-06-08';   -- first Monday of the schedule
SET @weeks      = 4;              -- how many weeks to generate


-- ─────────────────────────────────────────────────────────────────────────────
-- RESET  (removes old scheduled classes + their bookings)
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM Bookings WHERE ClassID IN (
  SELECT ClassID FROM Classes WHERE Status = 'scheduled'
);
DELETE FROM Classes WHERE Status = 'scheduled';


-- ─────────────────────────────────────────────────────────────────────────────
-- PROCEDURE  (do not edit — just run)
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS add_schedule;

DELIMITER //

CREATE PROCEDURE add_schedule (
  IN p_type_id    INT,          -- ClassTypeID
  IN p_trainer_id INT,          -- TrainerID
  IN p_day        VARCHAR(10),  -- 'Monday' / 'Tuesday' / ... / 'Sunday'
  IN p_start      TIME,         -- e.g. '18:00:00'
  IN p_end        TIME,         -- e.g. '19:00:00'
  IN p_capacity   INT,          -- max spots
  IN p_room       VARCHAR(50)   -- room name
)
BEGIN
  DECLARE i       INT  DEFAULT 0;
  DECLARE day_num INT;
  DECLARE diff    INT;
  DECLARE base    DATE;

  -- Map day name → MySQL DAYOFWEEK (1=Sun … 7=Sat)
  SET day_num = CASE LOWER(p_day)
    WHEN 'sunday'    THEN 1
    WHEN 'monday'    THEN 2
    WHEN 'tuesday'   THEN 3
    WHEN 'wednesday' THEN 4
    WHEN 'thursday'  THEN 5
    WHEN 'friday'    THEN 6
    WHEN 'saturday'  THEN 7
    ELSE 2  -- fallback: Monday
  END;

  -- Find first occurrence of that day on or after @start_date
  SET diff = MOD(day_num - DAYOFWEEK(@start_date) + 7, 7);
  SET base = DATE_ADD(@start_date, INTERVAL diff DAY);

  -- Insert one row per week
  WHILE i < @weeks DO
    INSERT INTO Classes (ClassTypeID, TrainerID, StartDateTime, EndDateTime, MaxCapacity, Room, Status)
    VALUES (
      p_type_id,
      p_trainer_id,
      TIMESTAMP(DATE_ADD(base, INTERVAL i WEEK), p_start),
      TIMESTAMP(DATE_ADD(base, INTERVAL i WEEK), p_end),
      p_capacity,
      p_room,
      'scheduled'
    );
    SET i = i + 1;
  END WHILE;
END //

DELIMITER ;


-- ═══════════════════════════════════════════════════════════════════════════════
--  SCHEDULE CONFIGURATION
--
--  Syntax:
--    CALL add_schedule(ClassTypeID, TrainerID, 'Day', 'HH:MM:SS', 'HH:MM:SS', Capacity, 'Room');
--
--  Class Types:
--    1 = Yoga          2 = Pilates    3 = Boxing
--    4 = Strength      5 = HIIT       6 = Zumba
--    7 = Fitness       8 = CrossFit
--
--  Trainers:
--    1 = Petrit Maliqi  (Bodybuilding & Strength)
--    2 = Saranda Krasniqi (Yoga & Pilates)
--    3 = Valbona Gashi  (HIIT & Cardio)
--
--  ↓↓↓  EDIT BELOW  ↓↓↓
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── YOGA (ClassTypeID = 1) ───────────────────────────────────────────────────
CALL add_schedule(1, 2, 'Monday',    '18:00:00', '19:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Wednesday', '08:00:00', '09:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Friday',    '18:00:00', '19:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Sunday',    '09:00:00', '10:00:00', 15, 'Salla 2');

-- ── PILATES (ClassTypeID = 2) ────────────────────────────────────────────────
CALL add_schedule(2, 2, 'Tuesday',   '18:00:00', '18:50:00', 12, 'Salla 2');
CALL add_schedule(2, 2, 'Thursday',  '08:00:00', '08:50:00', 12, 'Salla 2');
CALL add_schedule(2, 2, 'Saturday',  '10:00:00', '10:50:00', 12, 'Salla 2');

-- ── BOXING (ClassTypeID = 3) ─────────────────────────────────────────────────
CALL add_schedule(3, 1, 'Tuesday',   '17:00:00', '18:00:00', 10, 'Salla 1');
CALL add_schedule(3, 1, 'Thursday',  '17:00:00', '18:00:00', 10, 'Salla 1');

-- ── STRENGTH TRAINING (ClassTypeID = 4) ─────────────────────────────────────
CALL add_schedule(4, 1, 'Monday',    '17:00:00', '18:00:00', 12, 'Salla 1');
CALL add_schedule(4, 1, 'Wednesday', '17:00:00', '18:00:00', 12, 'Salla 1');
CALL add_schedule(4, 1, 'Saturday',  '11:00:00', '12:00:00', 12, 'Salla 1');

-- ── HIIT (ClassTypeID = 5) ───────────────────────────────────────────────────
CALL add_schedule(5, 3, 'Monday',    '19:30:00', '20:15:00', 20, 'Salla 3');
CALL add_schedule(5, 3, 'Wednesday', '07:00:00', '07:45:00', 20, 'Salla 3');
CALL add_schedule(5, 3, 'Friday',    '19:30:00', '20:15:00', 20, 'Salla 3');

-- ── ZUMBA (ClassTypeID = 6) ──────────────────────────────────────────────────
CALL add_schedule(6, 3, 'Tuesday',   '19:00:00', '20:00:00', 25, 'Salla 3');
CALL add_schedule(6, 3, 'Thursday',  '19:00:00', '20:00:00', 25, 'Salla 3');
CALL add_schedule(6, 3, 'Saturday',  '09:00:00', '10:00:00', 25, 'Salla 3');

-- ── FITNESS (ClassTypeID = 7) ────────────────────────────────────────────────
CALL add_schedule(7, 1, 'Monday',    '07:00:00', '08:00:00', 15, 'Salla 1');
CALL add_schedule(7, 1, 'Wednesday', '19:00:00', '20:00:00', 15, 'Salla 1');
CALL add_schedule(7, 1, 'Friday',    '07:00:00', '08:00:00', 15, 'Salla 1');

-- ── CROSSFIT (ClassTypeID = 8) ───────────────────────────────────────────────
CALL add_schedule(8, 3, 'Tuesday',   '07:00:00', '07:45:00', 15, 'Salla 3');
CALL add_schedule(8, 3, 'Thursday',  '18:00:00', '18:45:00', 15, 'Salla 3');
CALL add_schedule(8, 3, 'Sunday',    '10:00:00', '10:45:00', 15, 'Salla 3');

-- ═══════════════════════════════════════════════════════════════════════════════
--  VERIFY  — run this SELECT to see what was inserted
-- ═══════════════════════════════════════════════════════════════════════════════

SELECT
  ct.TypeName                                    AS Class,
  DAYNAME(c.StartDateTime)                       AS Day,
  TIME(c.StartDateTime)                          AS Start,
  TIME(c.EndDateTime)                            AS End,
  CONCAT(u.FirstName, ' ', u.LastName)           AS Trainer,
  c.Room,
  c.MaxCapacity                                  AS Spots,
  COUNT(*) OVER (PARTITION BY ct.TypeName)       AS TotalSessions
FROM Classes c
JOIN Class_Types ct ON ct.ClassTypeID = c.ClassTypeID
JOIN Trainers    t  ON t.TrainerID    = c.TrainerID
JOIN Users       u  ON u.UserID       = t.UserID
WHERE c.Status = 'scheduled'
ORDER BY FIELD(DAYNAME(c.StartDateTime), 'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'),
         TIME(c.StartDateTime);
