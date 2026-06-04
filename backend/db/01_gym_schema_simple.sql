-- Gym Management System 
-- Target: MySQL 8.0+ (InnoDB)

DROP DATABASE IF EXISTS gym_db;
CREATE DATABASE gym_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_db;


-- 1. USERS — everyone (admin, trainer, member). Auth + profile in one place.

CREATE TABLE Users (
    UserID          INT             AUTO_INCREMENT PRIMARY KEY,
    Email           VARCHAR(150)    NOT NULL UNIQUE,
    PasswordHash    VARCHAR(255)    NOT NULL,
    Role            ENUM('admin', 'trainer', 'member') NOT NULL DEFAULT 'member',
    FirstName       VARCHAR(80)     NOT NULL,
    LastName        VARCHAR(80)     NOT NULL,
    Phone           VARCHAR(20),
    DateOfBirth     DATE,
    JoinDate        DATE            NOT NULL DEFAULT (CURRENT_DATE),
    IsActive        BOOLEAN         NOT NULL DEFAULT TRUE,
    CreatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_role (Role),
    INDEX idx_users_name (LastName, FirstName)
) ENGINE=InnoDB;


-- 2. TRAINERS — trainer-specific info (a trainer is also a User)

CREATE TABLE Trainers (
    TrainerID       INT             AUTO_INCREMENT PRIMARY KEY,
    UserID          INT             NOT NULL UNIQUE,
    Specialization  VARCHAR(120)    NOT NULL,
    HireDate        DATE            NOT NULL,
    Salary          DECIMAL(10,2),
    Bio             TEXT,
    CONSTRAINT fk_trainers_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- 3. MEMBERSHIP_PLANS — plan catalog

CREATE TABLE Membership_Plans (
    PlanID              INT             AUTO_INCREMENT PRIMARY KEY,
    PlanName            VARCHAR(100)    NOT NULL,
    DurationMonths      INT             NOT NULL,
    Price               DECIMAL(10,2)   NOT NULL,
    IncludesClasses     BOOLEAN         NOT NULL DEFAULT FALSE,
    Description         TEXT
) ENGINE=InnoDB;


-- 4. MEMBERSHIPS — subscriptions with payment info embedded

CREATE TABLE Memberships (
    MembershipID    INT             AUTO_INCREMENT PRIMARY KEY,
    UserID          INT             NOT NULL,
    PlanID          INT             NOT NULL,
    StartDate       DATE            NOT NULL,
    EndDate         DATE            NOT NULL,
    Status          ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
    Amount          DECIMAL(10,2)   NOT NULL,
    PaymentMethod   ENUM('cash', 'card', 'bank_transfer') NOT NULL,
    PaymentStatus   ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'pending',
    PaidAt          TIMESTAMP       NULL DEFAULT NULL,
    CreatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_memberships_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_memberships_plan FOREIGN KEY (PlanID) REFERENCES Membership_Plans(PlanID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_membership_dates CHECK (EndDate > StartDate),
    INDEX idx_memberships_user_status (UserID, Status),
    INDEX idx_memberships_enddate (EndDate)
) ENGINE=InnoDB;


-- 5. CLASSES — each row is one scheduled class occurrence

CREATE TABLE Class_Types (
    ClassTypeID     INT             AUTO_INCREMENT PRIMARY KEY,
    TypeName        VARCHAR(100)    NOT NULL UNIQUE,
    Category        VARCHAR(60),
    Description     TEXT,
    Price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    IsActive        BOOLEAN         NOT NULL DEFAULT TRUE,
    CreatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_class_types_active (IsActive),
    INDEX idx_class_types_category (Category)
) ENGINE=InnoDB;


CREATE TABLE Classes (
    ClassID         INT             AUTO_INCREMENT PRIMARY KEY,
    Name            VARCHAR(100)    NOT NULL,
    ClassTypeID     INT             NOT NULL,
    TrainerID       INT             NOT NULL,
    StartDateTime   DATETIME        NOT NULL,
    EndDateTime     DATETIME        NOT NULL,
    MaxCapacity     INT             NOT NULL,
    Price           DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    Room            VARCHAR(50),
    Status          ENUM('scheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
    CreatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_classes_type FOREIGN KEY (ClassTypeID) REFERENCES Class_Types(ClassTypeID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_classes_trainer FOREIGN KEY (TrainerID) REFERENCES Trainers(TrainerID)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_class_time CHECK (EndDateTime > StartDateTime),
    CONSTRAINT chk_class_capacity CHECK (MaxCapacity > 0),
    CONSTRAINT chk_class_room CHECK (CHAR_LENGTH(Room) <= 50),
    INDEX idx_classes_name (Name),
    INDEX idx_classes_type (ClassTypeID),
    INDEX idx_classes_trainer (TrainerID),
    INDEX idx_classes_start (StartDateTime),
    INDEX idx_classes_status (Status)
) ENGINE=InnoDB;


-- 6. BOOKINGS — M:N between Users (members) and Classes

CREATE TABLE Bookings (
    BookingID       INT             AUTO_INCREMENT PRIMARY KEY,
    UserID          INT             NOT NULL,
    ClassID         INT             NOT NULL,
    BookingDate     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status          ENUM('booked', 'attended', 'cancelled', 'no_show') NOT NULL DEFAULT 'booked',
    Amount          DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
    PaymentMethod   ENUM('cash', 'card', 'bank_transfer') NOT NULL,
    PaymentStatus   ENUM('pending', 'paid', 'refunded') NOT NULL DEFAULT 'paid',
    PaidAt          TIMESTAMP       NULL DEFAULT NULL,
    CONSTRAINT fk_bookings_user FOREIGN KEY (UserID) REFERENCES Users(UserID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_bookings_class FOREIGN KEY (ClassID) REFERENCES Classes(ClassID)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT uq_booking_user_class UNIQUE (UserID, ClassID),
    INDEX idx_bookings_class_status (ClassID, Status)
) ENGINE=InnoDB;


-- End of schema
