import sqlite3
import json
import datetime

# Connect to sqlite db
sqlite_path = 'prisma/dev.db'
con = sqlite3.connect(sqlite_path)
con.row_factory = sqlite3.Row
cur = con.cursor()

def format_val(v):
    if v is None:
        return "NULL"
    elif isinstance(v, (int, float)):
        return str(v)
    elif isinstance(v, bool):
        return "1" if v else "0"
    else:
        # String escape
        s = str(v).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
        return f"'{s}'"

def format_timestamp(v):
    if v is None:
        return "NULL"
    if isinstance(v, int):
        # milliseconds epoch
        try:
            dt = datetime.datetime.fromtimestamp(v / 1000.0)
            return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"
        except:
            return "NOW()"
    s = str(v)
    if s.isdigit():
        dt = datetime.datetime.fromtimestamp(int(s) / 1000.0)
        return f"'{dt.strftime('%Y-%m-%d %H:%M:%S')}'"
    return f"'{s}'"

out = []
out.append("""-- ==========================================================
-- Database SQL Dump untuk phpMyAdmin
-- Sistem Informasi Akademik & Portal LMS SMA Al-Furqon Driyorejo
-- DBMS: MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- Kompatibel dengan phpMyAdmin (Impor langsung 1-klik)
-- ==========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Buat Database jika belum ada
CREATE DATABASE IF NOT EXISTS `lms_sma_al_furqon` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `lms_sma_al_furqon`;

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- 1. Tabel: User
-- --------------------------------------------------------
DROP TABLE IF EXISTS `User`;
CREATE TABLE `User` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` varchar(191) NOT NULL DEFAULT 'parent',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabel: parents
-- --------------------------------------------------------
DROP TABLE IF EXISTS `parents`;
CREATE TABLE `parents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `parents_userId_key` (`userId`),
  CONSTRAINT `parents_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Tabel: students
-- --------------------------------------------------------
DROP TABLE IF EXISTS `students`;
CREATE TABLE `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `parentId` int(11) NOT NULL,
  `nis` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `class` varchar(191) NOT NULL,
  `major` varchar(191) NOT NULL,
  `entryYear` int(11) NOT NULL DEFAULT 2024,
  `isSantri` tinyint(1) NOT NULL DEFAULT 0,
  `residenceType` varchar(191) NOT NULL DEFAULT 'Non-Asrama',
  `sppNominal` double NOT NULL DEFAULT 500000,
  `activityNominal` double NOT NULL DEFAULT 150000,
  `hasDiscount` tinyint(1) NOT NULL DEFAULT 0,
  `discountNotes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_nis_key` (`nis`),
  KEY `students_parentId_fkey` (`parentId`),
  CONSTRAINT `students_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Tabel: payments
-- --------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `category` varchar(191) NOT NULL DEFAULT 'SPP',
  `destination` varchar(191) NOT NULL DEFAULT 'Yayasan Pondok Pesantren Al-Furqon',
  `title` varchar(191) DEFAULT NULL,
  `semester` varchar(191) NOT NULL,
  `academicYear` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Belum Lunas',
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payments_studentId_fkey` (`studentId`),
  CONSTRAINT `payments_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Tabel: attendances
-- --------------------------------------------------------
DROP TABLE IF EXISTS `attendances`;
CREATE TABLE `attendances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `date` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Hadir',
  `subject` varchar(191) DEFAULT NULL,
  `session` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `attendances_studentId_fkey` (`studentId`),
  CONSTRAINT `attendances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Tabel: grades
-- --------------------------------------------------------
DROP TABLE IF EXISTS `grades`;
CREATE TABLE `grades` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `semester` varchar(191) NOT NULL,
  `score` double NOT NULL,
  `predicate` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `grades_studentId_fkey` (`studentId`),
  CONSTRAINT `grades_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Tabel: allowances
-- --------------------------------------------------------
DROP TABLE IF EXISTS `allowances`;
CREATE TABLE `allowances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `studentId` int(11) NOT NULL,
  `date` varchar(191) NOT NULL,
  `income` double NOT NULL DEFAULT 0,
  `expense` double NOT NULL DEFAULT 0,
  `description` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `allowances_studentId_fkey` (`studentId`),
  CONSTRAINT `allowances_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Tabel: academic_informations
-- --------------------------------------------------------
DROP TABLE IF EXISTS `academic_informations`;
CREATE TABLE `academic_informations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `category` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `date` varchar(191) NOT NULL,
  `imageUrl` text DEFAULT NULL,
  `createdById` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `academic_informations_createdById_fkey` (`createdById`),
  CONSTRAINT `academic_informations_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Tabel: teachers
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teachers`;
CREATE TABLE `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nip` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `subject` varchar(191) NOT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Aktif',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `teachers_nip_key` (`nip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 10. Tabel: teacher_attendances
-- --------------------------------------------------------
DROP TABLE IF EXISTS `teacher_attendances`;
CREATE TABLE `teacher_attendances` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `teacherId` int(11) NOT NULL,
  `date` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'Hadir',
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `teacher_attendances_teacherId_fkey` (`teacherId`),
  CONSTRAINT `teacher_attendances_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 11. Tabel: user_devices
-- --------------------------------------------------------
DROP TABLE IF EXISTS `user_devices`;
CREATE TABLE `user_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `fcmToken` varchar(255) NOT NULL,
  `platform` varchar(191) NOT NULL DEFAULT 'WEB',
  `deviceName` varchar(191) DEFAULT NULL,
  `browser` varchar(191) DEFAULT NULL,
  `appVersion` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastSeenAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_devices_fcmToken_key` (`fcmToken`),
  KEY `user_devices_userId_fkey` (`userId`),
  CONSTRAINT `user_devices_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Tabel: notifications
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) NOT NULL,
  `body` text NOT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'SYSTEM',
  `url` text DEFAULT NULL,
  `imageUrl` text DEFAULT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `notifications_createdBy_fkey` (`createdBy`),
  CONSTRAINT `notifications_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Tabel: notification_recipients
-- --------------------------------------------------------
DROP TABLE IF EXISTS `notification_recipients`;
CREATE TABLE `notification_recipients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `notificationId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `sentAt` datetime(3) DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_recipients_notificationId_fkey` (`notificationId`),
  KEY `notification_recipients_userId_fkey` (`userId`),
  CONSTRAINT `notification_recipients_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `notification_recipients_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
""")

# Now insert data from dev.db
out.append("\n-- ========================================================")
out.append("-- DATA AWAL (SEED & EXISTING DATA)")
out.append("-- ========================================================\n")

# Users
users = cur.execute("SELECT * FROM User").fetchall()
if users:
    out.append("-- Data Tabel: User")
    for u in users:
        c_at = format_timestamp(u['createdAt'])
        u_at = format_timestamp(u['updatedAt'])
        out.append(f"INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES ({u['id']}, {format_val(u['name'])}, {format_val(u['email'])}, {format_val(u['password'])}, {format_val(u['role'])}, {c_at}, {u_at});")
    out.append("")

# Parents
parents = cur.execute("SELECT * FROM parents").fetchall()
if parents:
    out.append("-- Data Tabel: parents")
    for p in parents:
        c_at = format_timestamp(p['createdAt'])
        u_at = format_timestamp(p['updatedAt'])
        out.append(f"INSERT INTO `parents` (`id`, `userId`, `phone`, `createdAt`, `updatedAt`) VALUES ({p['id']}, {p['userId']}, {format_val(p['phone'])}, {c_at}, {u_at});")
    out.append("")

# Students
students = cur.execute("SELECT * FROM students").fetchall()
if students:
    out.append("-- Data Tabel: students")
    for s in students:
        c_at = format_timestamp(s['createdAt'])
        u_at = format_timestamp(s['updatedAt'])
        out.append(f"INSERT INTO `students` (`id`, `parentId`, `nis`, `name`, `class`, `major`, `entryYear`, `isSantri`, `residenceType`, `sppNominal`, `activityNominal`, `hasDiscount`, `discountNotes`, `createdAt`, `updatedAt`) VALUES ({s['id']}, {s['parentId']}, {format_val(s['nis'])}, {format_val(s['name'])}, {format_val(s['class'])}, {format_val(s['major'])}, {s['entryYear']}, {s['isSantri']}, {format_val(s['residenceType'])}, {s['sppNominal']}, {s['activityNominal']}, {s['hasDiscount']}, {format_val(s['discountNotes'])}, {c_at}, {u_at});")
    out.append("")

# Teachers
teachers = cur.execute("SELECT * FROM teachers").fetchall()
if teachers:
    out.append("-- Data Tabel: teachers")
    for t in teachers:
        c_at = format_timestamp(t['createdAt'])
        u_at = format_timestamp(t['updatedAt'])
        out.append(f"INSERT INTO `teachers` (`id`, `nip`, `name`, `subject`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) VALUES ({t['id']}, {format_val(t['nip'])}, {format_val(t['name'])}, {format_val(t['subject'])}, {format_val(t['phone'])}, {format_val(t['email'])}, {format_val(t['status'])}, {c_at}, {u_at});")
    out.append("")

# Teacher Attendances
t_att = cur.execute("SELECT * FROM teacher_attendances").fetchall()
if t_att:
    out.append("-- Data Tabel: teacher_attendances")
    for ta in t_att:
        c_at = format_timestamp(ta['createdAt'])
        u_at = format_timestamp(ta['updatedAt'])
        out.append(f"INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES ({ta['id']}, {ta['teacherId']}, {format_val(ta['date'])}, {format_val(ta['status'])}, {format_val(ta['notes'])}, {c_at}, {u_at});")
    out.append("")

# Payments
payments = cur.execute("SELECT * FROM payments").fetchall()
if payments:
    out.append("-- Data Tabel: payments")
    for py in payments:
        c_at = format_timestamp(py['createdAt'])
        u_at = format_timestamp(py['updatedAt'])
        out.append(f"INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES ({py['id']}, {py['studentId']}, {format_val(py['category'])}, {format_val(py['destination'])}, {format_val(py['title'])}, {format_val(py['semester'])}, {format_val(py['academicYear'])}, {py['amount']}, {format_val(py['status'])}, {format_val(py['notes'])}, {c_at}, {u_at});")
    out.append("")

# Attendances
attendances = cur.execute("SELECT * FROM attendances").fetchall()
if attendances:
    out.append("-- Data Tabel: attendances")
    for a in attendances:
        c_at = format_timestamp(a['createdAt'])
        u_at = format_timestamp(a['updatedAt'])
        out.append(f"INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES ({a['id']}, {a['studentId']}, {format_val(a['date'])}, {format_val(a['status'])}, {format_val(a['subject'])}, {format_val(a['session'])}, {c_at}, {u_at});")
    out.append("")

# Grades
grades = cur.execute("SELECT * FROM grades").fetchall()
if grades:
    out.append("-- Data Tabel: grades")
    for g in grades:
        c_at = format_timestamp(g['createdAt'])
        u_at = format_timestamp(g['updatedAt'])
        out.append(f"INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES ({g['id']}, {g['studentId']}, {format_val(g['subject'])}, {format_val(g['semester'])}, {g['score']}, {format_val(g['predicate'])}, {c_at}, {u_at});")
    out.append("")

# Allowances
allowances = cur.execute("SELECT * FROM allowances").fetchall()
if allowances:
    out.append("-- Data Tabel: allowances")
    for al in allowances:
        c_at = format_timestamp(al['createdAt'])
        u_at = format_timestamp(al['updatedAt'])
        out.append(f"INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES ({al['id']}, {al['studentId']}, {format_val(al['date'])}, {al['income']}, {al['expense']}, {format_val(al['description'])}, {c_at}, {u_at});")
    out.append("")

# Academic Informations
academic_infos = cur.execute("SELECT * FROM academic_informations").fetchall()
if academic_infos:
    out.append("-- Data Tabel: academic_informations")
    for info in academic_infos:
        c_at = format_timestamp(info['createdAt'])
        u_at = format_timestamp(info['updatedAt'])
        img_url = format_val(None)
        created_by = format_val(109) # Admin
        out.append(f"INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES ({info['id']}, {format_val(info['title'])}, {format_val(info['category'])}, {format_val(info['description'])}, {format_val(info['date'])}, {img_url}, {created_by}, {c_at}, {u_at});")
    out.append("")

# Seed Notifications
out.append("""-- --------------------------------------------------------
-- Data Tabel: notifications & recipients (Notifikasi Awal)
-- --------------------------------------------------------
INSERT INTO `notifications` (`id`, `title`, `body`, `type`, `url`, `createdBy`, `createdAt`) VALUES
(1, 'Presensi Masuk Tepat Waktu - Ahmad Rizky Santoso', 'Ananda Ahmad Rizky Santoso (X IPA 1) telah melakukan presensi masuk di gerbang sekolah pada pukul 06:45 WIB. Status: Hadir Tepat Waktu.', 'ATTENDANCE', '/parent/attendance', 110, NOW()),
(2, 'Nilai Ulangan Harian Pemrograman Web Diterbitkan', 'Nilai ulangan Bab Pemrograman Web untuk Ahmad Rizky Santoso telah diinput oleh Guru Pengampu: Nilai 92 (Predikat A - Sangat Baik).', 'GRADE', '/parent/grades', 110, NOW()),
(3, 'Pengingat Tagihan SPP Semester 2', 'Tagihan SPP Semester 2 Tahun Ajaran 2024/2025 sebesar Rp 750.000 atas nama Ahmad Rizky Santoso telah diterbitkan. Disalurkan ke Yayasan Pondok Pesantren Al-Furqon.', 'SPP', '/parent/payments', 111, NOW()),
(4, 'Rapor PTS Semester Ganjil Telah Terbit', 'Laporan Hasil Penilaian Tengah Semester (PTS) Ganjil sudah tersedia dan dapat diunduh melalui menu Rapor Akademik.', 'ACADEMIC', '/parent/academic', 111, NOW());

INSERT INTO `notification_recipients` (`id`, `notificationId`, `userId`, `status`, `sentAt`, `readAt`) VALUES
(1, 1, 112, 'PENDING', NOW(), NULL),
(2, 2, 112, 'PENDING', NOW(), NULL),
(3, 3, 112, 'PENDING', NOW(), NULL),
(4, 4, 112, 'PENDING', NOW(), NULL);
""")

out.append("""
SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
""")

with open('lms_sma_al_furqon.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(out))

print("lms_sma_al_furqon.sql generated successfully!")
