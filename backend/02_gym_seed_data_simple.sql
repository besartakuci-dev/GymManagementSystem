USE gym_db;


-- USERS  (1 admin + 3 trainers + 10 members = 14 users)

INSERT INTO Users (UserID, Email, PasswordHash, Role, FirstName, LastName, Phone, DateOfBirth, JoinDate, IsActive) VALUES
-- Admin
(1,  'admin@bbrosgym.com',         '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'admin',   'Admin',    'BBros',     '+38344000001', '1990-01-01', '2020-01-01', TRUE),
-- Trainers
(2,  'petrit.maliqi@bbrosgym.com', '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'trainer', 'Petrit',   'Maliqi',    '+38344123456', '1988-03-15', '2020-01-10', TRUE),
(3,  'saranda.krasniqi@bbrosgym.com', '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'trainer', 'Saranda',  'Krasniqi',  '+38344234567', '1992-07-22', '2021-03-20', TRUE),
(4,  'valbona.gashi@bbrosgym.com',  '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'trainer', 'Valbona',  'Gashi',     '+38344345678', '1990-11-08', '2019-09-01', TRUE),
-- Members
(5,  'egzon.krasniqi@gmail.com',    '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Egzon',    'Krasniqi',  '+38344456789', '1996-05-12', '2024-02-15', TRUE),
(6,  'blerta.hoxha@gmail.com',      '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Blerta',   'Hoxha',     '+38344567890', '1998-09-03', '2024-04-22', TRUE),
(7,  'drilon.berisha@hotmail.com',  '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Drilon',   'Berisha',   '+38344678901', '1995-12-18', '2023-11-05', TRUE),
(8,  'fatlinda.gashi@gmail.com',    '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Fatlinda', 'Gashi',     '+38344789012', '2000-04-25', '2025-01-10', TRUE),
(9,  'gentian.shala@yahoo.com',     '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Gentian',  'Shala',     '+38344890123', '1993-08-30', '2024-08-12', TRUE),
(10, 'hana.bajrami@gmail.com',      '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Hana',     'Bajrami',   '+38344901234', '1999-02-14', '2025-03-01', TRUE),
(11, 'ilir.krasniqi@gmail.com',     '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Ilir',     'Krasniqi',  '+38345012345', '1985-06-07', '2023-05-18', TRUE),
(12, 'jeta.sylejmani@gmail.com',    '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Jeta',     'Sylejmani', '+38345123456', '1997-10-21', '2024-11-30', TRUE),
(13, 'kushtrim.maliqi@gmail.com',   '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Kushtrim', 'Maliqi',    '+38345234567', '1994-01-17', '2022-07-04', TRUE),
(14, 'mirjeta.hasani@gmail.com',    '$2b$10$zJF5sQErLTHtGUhhISve6ei4vxTeYMM5FJShx/hNjmU6OabMyulsK', 'member',  'Mirjeta',  'Hasani',    '+38345345678', '2001-11-09', '2025-04-15', TRUE);


-- TRAINERS

INSERT INTO Trainers (TrainerID, UserID, Specialization, HireDate, Salary, Bio) VALUES
(1, 2, 'Bodybuilding & Forcë', '2020-01-15', 850.00, 'Trajner i certifikuar me 10+ vite përvojë në bodybuilding dhe trajnim force.'),
(2, 3, 'Joga & Pilates',        '2021-03-25', 720.00, 'Mësimdhënëse joga e certifikuar (RYT-200), specializuar në Vinyasa dhe Pilates.'),
(3, 4, 'HIIT & Kardio',         '2019-09-05', 800.00, 'Specializuar në programe HIIT, spinning dhe trajnim kardiovaskular.');


-- MEMBERSHIP PLANS

INSERT INTO Membership_Plans (PlanID, PlanName, DurationMonths, Price, IncludesClasses, Description) VALUES
(1, 'Bazik',    1, 25.00,  FALSE, 'Qasje në palestër, pa klasa në grup.'),
(2, 'Standard', 1, 40.00,  TRUE,  'Qasje e plotë në palestër + klasa në grup.'),
(3, 'Premium',  1, 65.00,  TRUE,  'Gjithçka e Standard + qasje prioritare në klasa.'),
(4, 'Vjetor',  12, 420.00, TRUE,  'Plani Standard për 12 muaj — kursim 60 EUR.');


-- MEMBERSHIPS 

INSERT INTO Memberships (MembershipID, UserID, PlanID, StartDate, EndDate, Status, Amount, PaymentMethod, PaymentStatus, PaidAt) VALUES
(1,  5,  3, '2025-04-01', '2025-05-01', 'active',  65.00,  'card',          'paid', '2025-04-01 09:15:22'),
(2,  6,  2, '2025-04-15', '2025-05-15', 'active',  40.00,  'cash',          'paid', '2025-04-15 18:30:00'),
(3,  7,  3, '2025-04-01', '2025-05-01', 'active',  65.00,  'bank_transfer', 'paid', '2025-04-01 11:00:00'),
(4,  8,  2, '2025-04-20', '2025-05-20', 'active',  40.00,  'card',          'paid', '2025-04-20 14:22:18'),
(5,  9,  3, '2025-03-01', '2025-04-01', 'expired', 65.00,  'card',          'paid', '2025-03-01 10:05:33'),
(6,  9,  3, '2025-04-10', '2025-05-10', 'active',  65.00,  'card',          'paid', '2025-04-10 16:40:11'),
(7,  10, 1, '2025-05-01', '2025-06-01', 'active',  25.00,  'cash',          'pending', NULL),
(8,  11, 4, '2024-12-01', '2025-12-01', 'active',  420.00, 'bank_transfer', 'paid', '2024-12-01 09:00:00'),
(9,  12, 2, '2025-04-25', '2025-05-25', 'active',  40.00,  'card',          'paid', '2025-04-25 19:55:02'),
(10, 13, 3, '2025-01-01', '2025-02-01', 'expired', 65.00,  'card',          'paid', '2025-01-01 12:00:00'),
(11, 14, 1, '2025-05-10', '2025-06-10', 'active',  25.00,  'cash',          'pending', NULL);


-- CLASSES  (each row = one scheduled occurrence)

INSERT INTO Classes (ClassID, TrainerID, ClassName, Category, StartDateTime, EndDateTime, MaxCapacity, Room, Status) VALUES
-- Past classes (completed)
(1, 2, 'Joga për fillestarë', 'Joga',   '2025-05-12 18:00:00', '2025-05-12 19:00:00', 15, 'Salla 2',  'completed'),
(2, 3, 'HIIT i avancuar',     'Kardio', '2025-05-13 19:00:00', '2025-05-13 19:45:00', 20, 'Salla 3',  'completed'),
(3, 1, 'Forcë & Hipertrofi',  'Forcë',  '2025-05-14 17:00:00', '2025-05-14 18:00:00', 12, 'Salla 1',  'completed'),
-- Upcoming classes
(4, 2, 'Joga për fillestarë', 'Joga',   '2025-05-19 18:00:00', '2025-05-19 19:00:00', 15, 'Salla 2',  'scheduled'),
(5, 3, 'HIIT i avancuar',     'Kardio', '2025-05-20 19:00:00', '2025-05-20 19:45:00', 20, 'Salla 3',  'scheduled'),
(6, 1, 'Forcë & Hipertrofi',  'Forcë',  '2025-05-21 17:00:00', '2025-05-21 18:00:00', 12, 'Salla 1',  'scheduled'),
(7, 3, 'Spinning matinal',    'Kardio', '2025-05-22 07:00:00', '2025-05-22 07:50:00', 25, 'Salla 3',  'scheduled'),
(8, 2, 'Pilates',             'Pilates','2025-05-23 17:00:00', '2025-05-23 17:45:00', 15, 'Salla 2',  'scheduled'),
(9, 1, 'Forcë për fillestarë','Forcë',  '2025-05-24 11:00:00', '2025-05-24 12:00:00', 10, 'Salla 1',  'scheduled');


-- BOOKINGS

INSERT INTO Bookings (BookingID, UserID, ClassID, BookingDate, Status) VALUES
-- Past — Class 1 (Joga)
(1,  6,  1, '2025-05-10 10:22:00', 'attended'),
(2,  8,  1, '2025-05-11 14:18:00', 'attended'),
(3,  12, 1, '2025-05-12 08:00:00', 'attended'),
(4,  14, 1, '2025-05-11 21:30:00', 'no_show'),
-- Past — Class 2 (HIIT)
(5,  5,  2, '2025-05-12 09:15:00', 'attended'),
(6,  7,  2, '2025-05-12 19:00:00', 'attended'),
(7,  10, 2, '2025-05-13 07:45:00', 'attended'),
-- Past — Class 3 (Forcë)
(8,  5,  3, '2025-05-13 11:00:00', 'attended'),
(9,  7,  3, '2025-05-13 16:30:00', 'attended'),
(10, 13, 3, '2025-05-14 08:00:00', 'attended'),
-- Upcoming bookings
(11, 6,  4, '2025-05-17 19:00:00', 'booked'),
(12, 8,  4, '2025-05-17 20:15:00', 'booked'),
(13, 12, 4, '2025-05-18 09:00:00', 'booked'),
(14, 5,  5, '2025-05-17 22:00:00', 'booked'),
(15, 7,  5, '2025-05-18 07:30:00', 'booked'),
(16, 5,  6, '2025-05-18 12:00:00', 'booked'),
(17, 13, 6, '2025-05-19 09:00:00', 'booked'),
(18, 10, 7, '2025-05-19 18:45:00', 'booked'),
(19, 12, 8, '2025-05-20 14:20:00', 'booked');

-- End of seed data
-- Try queries like:
--   SELECT * FROM Users WHERE Role = 'member' AND IsActive = TRUE;
--   SELECT u.FirstName, u.LastName, p.PlanName, m.EndDate
--     FROM Memberships m
--     JOIN Users u ON u.UserID = m.UserID
--     JOIN Membership_Plans p ON p.PlanID = m.PlanID
--     WHERE m.Status = 'active';
--   SELECT c.ClassName, c.StartDateTime, COUNT(b.BookingID) AS booked
--     FROM Classes c
--     LEFT JOIN Bookings b ON b.ClassID = c.ClassID AND b.Status = 'booked'
--     WHERE c.Status = 'scheduled'
--     GROUP BY c.ClassID;

