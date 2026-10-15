-- ==========================================================
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


-- ========================================================
-- DATA AWAL (SEED & EXISTING DATA)
-- ========================================================

-- Data Tabel: User
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (109, 'Administrator Sekolah', 'admin@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'admin', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (110, 'Drs. H. Ahmad Wijaya, M.Pd', 'guru@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'guru', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (111, 'Siti Rahmawati, S.Kom', 'staff@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'staff', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (112, 'Budi Santoso', 'orangtua@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'parent', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (113, 'Siti Aminah', 'orangtua2@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'parent', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `User` (`id`, `name`, `email`, `password`, `role`, `createdAt`, `updatedAt`) VALUES (114, 'Hendra Pratama', 'orangtua3@sekolah.sch.id', '$2b$10$9bFJd/zvMVcwBzcBQ3lSY.Ml3aOR58U5kW5opdd1b.m/oGA.JVTj6', 'parent', '2026-08-25 11:51:03', '2026-08-25 11:51:03');

-- Data Tabel: parents
INSERT INTO `parents` (`id`, `userId`, `phone`, `createdAt`, `updatedAt`) VALUES (55, 112, '081234567890', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `parents` (`id`, `userId`, `phone`, `createdAt`, `updatedAt`) VALUES (56, 113, '082198765432', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `parents` (`id`, `userId`, `phone`, `createdAt`, `updatedAt`) VALUES (57, 114, '085711223344', '2026-08-25 11:51:03', '2026-08-25 11:51:03');

-- Data Tabel: students
INSERT INTO `students` (`id`, `parentId`, `nis`, `name`, `class`, `major`, `entryYear`, `isSantri`, `residenceType`, `sppNominal`, `activityNominal`, `hasDiscount`, `discountNotes`, `createdAt`, `updatedAt`) VALUES (55, 55, '20241001', 'Ahmad Rizky Santoso', 'X IPA 1', 'IPA (MIPA)', 2024, 1, 'Asrama', 750000.0, 200000.0, 0, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `students` (`id`, `parentId`, `nis`, `name`, `class`, `major`, `entryYear`, `isSantri`, `residenceType`, `sppNominal`, `activityNominal`, `hasDiscount`, `discountNotes`, `createdAt`, `updatedAt`) VALUES (56, 56, '20231045', 'Dewi Lestari (Keringanan Santri)', 'XI IPS 1', 'IPS', 2023, 1, 'Asrama', 400000.0, 100000.0, 1, 'Pengajuan Keringanan Santri Yatim / Ekonomi', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `students` (`id`, `parentId`, `nis`, `name`, `class`, `major`, `entryYear`, `isSantri`, `residenceType`, `sppNominal`, `activityNominal`, `hasDiscount`, `discountNotes`, `createdAt`, `updatedAt`) VALUES (57, 57, '20241012', 'Fajar Pratama', 'X IPA 1', 'IPA (MIPA)', 2024, 0, 'Non-Asrama', 500000.0, 150000.0, 0, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');

-- Data Tabel: teachers
INSERT INTO `teachers` (`id`, `nip`, `name`, `subject`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) VALUES (73, '197805122005011002', 'Drs. H. Ahmad Wijaya, M.Pd', 'Matematika Terapan', '081234567891', 'guru@sekolah.sch.id', 'Aktif', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teachers` (`id`, `nip`, `name`, `subject`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) VALUES (74, '198503202010012005', 'Siti Nurhaliza, S.ST, M.T', 'Pemrograman Web & Perangkat Bergerak', '081398765432', 'siti.nurhaliza@sekolah.sch.id', 'Aktif', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teachers` (`id`, `nip`, `name`, `subject`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) VALUES (75, '199011152018011003', 'Bambang Supriyadi, S.Kom', 'Teknik Komputer & Jaringan', '085712344321', 'bambang.s@sekolah.sch.id', 'Aktif', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teachers` (`id`, `nip`, `name`, `subject`, `phone`, `email`, `status`, `createdAt`, `updatedAt`) VALUES (76, '199208042020022008', 'Rina Kartika, S.Pd', 'Bahasa Inggris Industri', '082155443322', 'rina.k@sekolah.sch.id', 'Aktif', '2026-08-25 11:51:04', '2026-08-25 11:51:04');

-- Data Tabel: teacher_attendances
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (361, 73, '2026-08-25', 'Hadir', 'Mengajar jam ke 1-4', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (362, 74, '2026-08-25', 'Hadir', 'Mengajar jam ke 3-6', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (363, 75, '2026-08-25', 'Hadir', 'Praktikum Lab TKJ', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (364, 76, '2026-08-25', 'Hadir', 'Mengajar Bahasa Inggris', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (365, 73, '2026-08-24', 'Hadir', 'Mengajar jam ke 1-4', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (366, 74, '2026-08-24', 'Hadir', 'Mengajar jam ke 3-6', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (367, 75, '2026-08-24', 'Hadir', 'Praktikum Lab TKJ', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (368, 76, '2026-08-24', 'Hadir', 'Mengajar Bahasa Inggris', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (369, 73, '2026-08-23', 'Hadir', 'Mengajar jam ke 1-4', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (370, 74, '2026-08-23', 'Izin', 'Tugas Luar Sekolah', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (371, 75, '2026-08-23', 'Hadir', 'Praktikum Lab TKJ', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (372, 76, '2026-08-23', 'Hadir', 'Mengajar Bahasa Inggris', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (373, 73, '2026-08-22', 'Hadir', 'Mengajar jam ke 1-4', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (374, 74, '2026-08-22', 'Hadir', 'Mengajar jam ke 3-6', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (375, 75, '2026-08-22', 'Hadir', 'Praktikum Lab TKJ', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (376, 76, '2026-08-22', 'Hadir', 'Mengajar Bahasa Inggris', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (377, 73, '2026-08-21', 'Hadir', 'Mengajar jam ke 1-4', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (378, 74, '2026-08-21', 'Hadir', 'Mengajar jam ke 3-6', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (379, 75, '2026-08-21', 'Hadir', 'Praktikum Lab TKJ', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `teacher_attendances` (`id`, `teacherId`, `date`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (380, 76, '2026-08-21', 'Sakit', 'Surat Dokter', '2026-08-25 11:51:04', '2026-08-25 11:51:04');

-- Data Tabel: payments
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (118, 55, 'SPP', 'Yayasan Pondok Pesantren Al-Furqon', 'SPP Bulanan / Semester 1', 'Semester 1', '2024/2025', 750000.0, 'Lunas', 'Disalurkan ke Yayasan Pondok Pesantren Al-Furqon', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (119, 55, 'Kegiatan', 'Sekolah (SMA Al-Furqon)', 'Anggaran Kegiatan Pembelajaran & Ekstrakurikuler', 'Semester 1', '2024/2025', 200000.0, 'Lunas', 'Disalurkan ke Rekening Sekolah (SMA Al-Furqon)', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (120, 55, 'SPP', 'Yayasan Pondok Pesantren Al-Furqon', 'SPP Bulanan / Semester 2', 'Semester 2', '2024/2025', 750000.0, 'Belum Lunas', 'Tagihan SPP Semester 2 ke Yayasan', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (121, 56, 'SPP', 'Yayasan Pondok Pesantren Al-Furqon', 'SPP Bulanan (Tarif Khusus Keringanan)', 'Semester 1', '2024/2025', 400000.0, 'Lunas', 'Disetujui Keringanan SPP Yayasan Al-Furqon', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (122, 56, 'Kegiatan', 'Sekolah (SMA Al-Furqon)', 'Anggaran Kegiatan Sekolah (Keringanan)', 'Semester 1', '2024/2025', 100000.0, 'Belum Lunas', 'Tagihan Anggaran Kegiatan Sekolah', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (123, 57, 'SPP', 'Yayasan Pondok Pesantren Al-Furqon', 'SPP Bulanan Siswa Reguler', 'Semester 1', '2024/2025', 500000.0, 'Lunas', 'Setoran SPP Yayasan Al-Furqon', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `payments` (`id`, `studentId`, `category`, `destination`, `title`, `semester`, `academicYear`, `amount`, `status`, `notes`, `createdAt`, `updatedAt`) VALUES (124, 57, 'Kegiatan', 'Sekolah (SMA Al-Furqon)', 'Anggaran Kegiatan & Praktikum Sekolah', 'Semester 1', '2024/2025', 150000.0, 'Lunas', 'Setoran Kegiatan ke Sekolah', '2026-08-25 11:51:03', '2026-08-25 11:51:03');

-- Data Tabel: attendances
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (811, 55, '2026-08-10', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (812, 56, '2026-08-10', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (813, 57, '2026-08-10', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (814, 55, '2026-08-11', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (815, 56, '2026-08-11', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (816, 57, '2026-08-11', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (817, 55, '2026-08-12', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (818, 56, '2026-08-12', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (819, 57, '2026-08-12', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (820, 55, '2026-08-13', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (821, 56, '2026-08-13', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (822, 57, '2026-08-13', 'Alpha', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (823, 55, '2026-08-14', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (824, 56, '2026-08-14', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (825, 57, '2026-08-14', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (826, 55, '2026-08-15', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (827, 56, '2026-08-15', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (828, 57, '2026-08-15', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (829, 55, '2026-08-16', 'Sakit', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (830, 56, '2026-08-16', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (831, 57, '2026-08-16', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (832, 55, '2026-08-17', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (833, 56, '2026-08-17', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (834, 57, '2026-08-17', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (835, 55, '2026-08-18', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (836, 56, '2026-08-18', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (837, 57, '2026-08-18', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (838, 55, '2026-08-19', 'Izin', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (839, 56, '2026-08-19', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (840, 57, '2026-08-19', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (841, 55, '2026-08-20', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (842, 56, '2026-08-20', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (843, 57, '2026-08-20', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (844, 55, '2026-08-21', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (845, 56, '2026-08-21', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (846, 57, '2026-08-21', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (847, 55, '2026-08-22', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (848, 56, '2026-08-22', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (849, 57, '2026-08-22', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (850, 55, '2026-08-23', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (851, 56, '2026-08-23', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (852, 57, '2026-08-23', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (853, 55, '2026-08-24', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (854, 56, '2026-08-24', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `attendances` (`id`, `studentId`, `date`, `status`, `subject`, `session`, `createdAt`, `updatedAt`) VALUES (855, 57, '2026-08-24', 'Hadir', NULL, NULL, '2026-08-25 11:51:03', '2026-08-25 11:51:03');

-- Data Tabel: grades
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (127, 55, 'Pemrograman Web & Perangkat Bergerak', 'Semester 1', 92.0, 'A', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (128, 55, 'Basis Data & SQL', 'Semester 1', 88.0, 'A', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (129, 55, 'Matematika Terapan', 'Semester 1', 84.0, 'B', '2026-08-25 11:51:03', '2026-08-25 11:51:03');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (130, 55, 'Bahasa Inggris Industri', 'Semester 1', 90.0, 'A', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (131, 55, 'Bahasa Indonesia', 'Semester 1', 86.0, 'A', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (132, 55, 'Pendidikan Pancasila', 'Semester 1', 80.0, 'B', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `grades` (`id`, `studentId`, `subject`, `semester`, `score`, `predicate`, `createdAt`, `updatedAt`) VALUES (133, 55, 'Fisika Komputasi', 'Semester 1', 78.0, 'B', '2026-08-25 11:51:04', '2026-08-25 11:51:04');

-- Data Tabel: allowances
INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES (91, 55, '2026-08-20', 150000.0, 0.0, 'Transfer Uang Saku Mingguan dari Orang Tua', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES (92, 55, '2026-08-21', 0.0, 25000.0, 'Makan Siang & Minum di Kantin Sekolah', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES (93, 55, '2026-08-22', 0.0, 35000.0, 'Pembelian Buku Catatan & Alat Tulis', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES (94, 55, '2026-08-24', 50000.0, 0.0, 'Bonus Nilai Ujian Kuis Koding', '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `allowances` (`id`, `studentId`, `date`, `income`, `expense`, `description`, `createdAt`, `updatedAt`) VALUES (95, 55, '2026-08-25', 0.0, 20000.0, 'Top Up Saldo E-Money Kartu Bus Sekolah', '2026-08-25 11:51:04', '2026-08-25 11:51:04');

-- Data Tabel: academic_informations
INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES (91, 'Jadwal Pelajaran Kelas X IPA 1 Semester Genap 2024/2025', 'Jadwal Pelajaran', 'Senin: Biologi & Fisika (07.00-10.00), B. Indo (10.15-12.00)\nSelasa: Kimia & Matematika (07.00-10.00), B. Inggris (10.15-12.00)\nRabu: Matematika Peminatan (07.00-09.30), PJOK (09.45-12.00)\nKamis: Fisika (07.00-09.30), PKN (09.45-12.00)\nJumat: Agama & Pembinaan Karakter (07.00-11.00)', '2026-08-15', NULL, 109, '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES (92, 'Penilaian Tengah Semester (PTS) Genap 2024/2025', 'Jadwal Ujian', 'Ujian Tengah Semester (PTS) akan dilaksanakan secara serentak menggunakan CBT (Computer Based Test) mulai tanggal 15 Maret 2025 s/d 22 Maret 2025. Harap persiapkan diri dengan baik.', '2026-09-08', NULL, 109, '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES (93, 'Juara 1 Lomba Karya Ilmiah Remaja (KIR) Tingkat Provinsi', 'Prestasi', 'Selamat kepada Ahmad Rizky Santoso (Kelas X IPA 1) atas perolehan Medali Emas Juara 1 Lomba Karya Ilmiah Remaja (KIR) SMA 2025.', '2026-08-22', NULL, 109, '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES (94, 'Peringatan Hari Pendidikan Nasional & Pentas Seni', 'Kegiatan', 'Kegiatan pentas seni siswa dan bazaar kewirausahaan SMA AL - FURQON DRIYOREJO akan diselenggarakan pada halaman utama sekolah.', '2026-09-14', NULL, 109, '2026-08-25 11:51:04', '2026-08-25 11:51:04');
INSERT INTO `academic_informations` (`id`, `title`, `category`, `description`, `date`, `imageUrl`, `createdById`, `createdAt`, `updatedAt`) VALUES (95, 'Pengumuman Libur Awal Ramadhan 1446 H', 'Pengumuman', 'Diberitahukan kepada seluruh siswa dan bapak/ibu wali murid bahwa kegiatan belajar mengajar diliburkan pada awal Ramadhan selama 3 hari.', '2026-08-24', NULL, 109, '2026-08-25 11:51:04', '2026-08-25 11:51:04');

-- --------------------------------------------------------
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


SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
