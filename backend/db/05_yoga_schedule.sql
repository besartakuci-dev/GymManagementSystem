USE gym_db;

-- ─────────────────────────────────────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────────────────────────────────────

SET @start_date = '2026-06-08';   -- first Monday of the schedule
SET @weeks      = 4;              -- how many weeks to generate


-- ─────────────────────────────────────────────────────────────────────────────
-- RESET  — remove only scheduled Yoga classes (ClassTypeID = 1)
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM Bookings
WHERE ClassID IN (
  SELECT ClassID FROM Classes
  WHERE Status = 'scheduled' AND ClassTypeID = 1
);

DELETE FROM Classes
WHERE Status = 'scheduled' AND ClassTypeID = 1;


-- ─────────────────────────────────────────────────────────────────────────────
-- PROCEDURE  (recreated so this script is self-contained)
-- ─────────────────────────────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS add_schedule;

DELIMITER //

CREATE PROCEDURE add_schedule (
  IN p_type_id    INT,
  IN p_trainer_id INT,
  IN p_day        VARCHAR(10),
  IN p_start      TIME,
  IN p_end        TIME,
  IN p_capacity   INT,
  IN p_room       VARCHAR(50)
)
BEGIN
  DECLARE i       INT  DEFAULT 0;
  DECLARE day_num INT;
  DECLARE diff    INT;
  DECLARE base    DATE;

  SET day_num = CASE LOWER(p_day)
    WHEN 'sunday'    THEN 1
    WHEN 'monday'    THEN 2
    WHEN 'tuesday'   THEN 3
    WHEN 'wednesday' THEN 4
    WHEN 'thursday'  THEN 5
    WHEN 'friday'    THEN 6
    WHEN 'saturday'  THEN 7
    ELSE 2
  END;

  SET diff = MOD(day_num - DAYOFWEEK(@start_date) + 7, 7);
  SET base = DATE_ADD(@start_date, INTERVAL diff DAY);

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


-- ─────────────────────────────────────────────────────────────────────────────
-- YOGA SCHEDULE  (ClassTypeID = 1, Trainer 2 = Saranda Krasniqi)
-- ─────────────────────────────────────────────────────────────────────────────

CALL add_schedule(1, 2, 'Monday',    '18:00:00', '19:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Wednesday', '08:00:00', '09:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Friday',    '18:00:00', '19:00:00', 15, 'Salla 2');
CALL add_schedule(1, 2, 'Sunday',    '09:00:00', '10:00:00', 15, 'Salla 2');


-- ─────────────────────────────────────────────────────────────────────────────
-- VERIFY
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  ct.TypeName                           AS Class,
  DAYNAME(c.StartDateTime)              AS Day,
  TIME(c.StartDateTime)                 AS Start,
  TIME(c.EndDateTime)                   AS End,
  CONCAT(u.FirstName, ' ', u.LastName)  AS Trainer,
  c.Room,
  c.MaxCapacity                         AS Spots,
  DATE(c.StartDateTime)                 AS Date
FROM Classes c
JOIN Class_Types ct ON ct.ClassTypeID = c.ClassTypeID
JOIN Trainers    t  ON t.TrainerID    = c.TrainerID
JOIN Users       u  ON u.UserID       = t.UserID
WHERE c.Status = 'scheduled' AND c.ClassTypeID = 1
ORDER BY c.StartDateTime;
