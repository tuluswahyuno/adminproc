-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table db_spj_proc.nomor_manual
CREATE TABLE IF NOT EXISTS `nomor_manual` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tahun` smallint NOT NULL,
  `no_urut` varchar(50) NOT NULL,
  `perihal` varchar(255) NOT NULL DEFAULT '',
  `tanggal` date DEFAULT NULL,
  `keterangan` varchar(500) NOT NULL DEFAULT '',
  `dibuat_oleh` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_nomor_manual` (`tahun`,`no_urut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_spj_proc.nomor_manual: ~0 rows (approximately)

-- Dumping structure for table db_spj_proc.pejabat
CREATE TABLE IF NOT EXISTS `pejabat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `peran` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aktif` tinyint NOT NULL DEFAULT '1',
  `jabatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `alamat` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table db_spj_proc.pejabat: ~24 rows (approximately)
INSERT INTO `pejabat` (`id`, `nama`, `nip`, `peran`, `aktif`, `jabatan`, `alamat`) VALUES
	(1, 'Dr. dr. Kinik Darsono, M.Pd.Ked', '19710415 200903 1 001', 'KPA', 1, 'Direktur RSUD dr.Soeratno Gemolong', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'),
	(2, 'Erni Tri Yuniati, SKM', '19820616 201001 2 023', 'BENDAHARA', 1, '', NULL),
	(3, 'NUR ROHMAWATI, S.K.M', '199502022023212009', 'VERIFIKATOR', 1, '', NULL),
	(4, 'Nunung Agus Dwi Haryanto, SE, M.Si', '198308052009031007', 'PPTK', 1, '', NULL),
	(5, 'Bekti Nugroho, S.Kom., M.Eng', '19800402 200804 1 001', 'PPKOM', 1, 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'),
	(6, 'Yuwono Laksito, A.Md', '19710612 199903 1 011', 'PPTK', 1, '', NULL),
	(7, 'Candra Nugraheni, S.ST', '', 'PENGADAAN', 1, '', NULL),
	(8, 'Bagus Prasetya Utama, AMTE', '', 'PENGADAAN', 1, '', NULL),
	(9, 'Suramin, SKM.,S.Kep.,Ns', '', 'PPKOM', 1, '', NULL),
	(10, 'dr. Nofi Kusumaningrum', '', 'PPKOM', 1, '', NULL),
	(11, 'Lilik Subagyo, S.Kep.Ns', '', 'PPKOM', 1, '', NULL),
	(12, 'dr. Mayasari Ayu Hendrawati', '', 'PPKOM', 1, '', NULL),
	(13, 'Candra Rosanti, SKM', '', 'PENGADAAN', 1, '', NULL),
	(14, 'Andreas Hasta Riawan', '19821218 200903 1 006', 'PPTK', 1, '', NULL),
	(15, 'Fitria Purnamawati, S.Kep.,Ns. M.Kep', '', 'PENGADAAN', 1, '', NULL),
	(16, 'Agus Dwiyanto, S. Farm Apt', '', 'PENGADAAN', 1, '', NULL),
	(17, 'Purwanto, AMD', '', 'PENGADAAN', 1, '', NULL),
	(18, 'Eko Sujianto, S.Kep.Ns.', '', 'PPKOM', 1, '', NULL),
	(19, 'Dr.dr. Kinik Darsono, M.Pd.,Ked', '', 'PPKOM', 1, '', NULL),
	(21, 'Tulus Wahyuno, A.Md', '1996011420201210007', 'PENGADAAN', 1, 'Pejabat Pengadaan', NULL),
	(22, 'dr. Sumarji, Sp.N', '', 'PPKOM', 1, '', NULL),
	(24, 'Imas Wulandari, S.Kom.,M.Eng', '', 'PPKOM', 1, '', NULL),
	(27, 'Rajendra Prima Ariyanto, S.K.M', '19830815 202321 1 003', 'PENGURUS_BARANG', 1, 'Pengurus Barang', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong');

-- Dumping structure for table db_spj_proc.pengaturan
CREATE TABLE IF NOT EXISTS `pengaturan` (
  `k` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `v` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table db_spj_proc.pengaturan: ~10 rows (approximately)
INSERT INTO `pengaturan` (`k`, `v`) VALUES
	('alamat', 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274'),
	('bendahara_id', '2'),
	('instansi', 'RSUD dr. SOERATNO GEMOLONG'),
	('instansi_a2', 'BLUD RSUD dr.SOERATNO GEMOLONG'),
	('kontak', 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com'),
	('kota', 'Gemolong'),
	('kpa_id', '1'),
	('pemda', 'PEMERINTAH KABUPATEN SRAGEN'),
	('pengurus_barang_id', '27'),
	('tahun', '2026'),
	('verifikator_id', '3');

-- Dumping structure for table db_spj_proc.penyedia
CREATE TABLE IF NOT EXISTS `penyedia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nama` varchar(255) NOT NULL,
  `pimpinan` varchar(255) DEFAULT '',
  `jabatan` varchar(100) DEFAULT 'Direktur',
  `alamat` text,
  `aktif` tinyint DEFAULT '1',
  `npwp` varchar(100) DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_spj_proc.penyedia: ~9 rows (approximately)
INSERT INTO `penyedia` (`id`, `nama`, `pimpinan`, `jabatan`, `alamat`, `aktif`, `npwp`) VALUES
	(1, 'CV. Surya Globe', 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 1, '01.234.567.8-526.000'),
	(2, 'PT. Telkom Indonesia', 'Pimpinan Cabang', 'Kepala Kantor Daerah', 'Jl. Mayor Kusmanto, Sragen', 1, ''),
	(3, 'RSUD dr Adhyatma MPH (RSUD Tugurejo)', 'Direktur RSUD', 'Direktur', 'Jl. Walisongo No. 137, Tambakaji, Ngaliyan, Kota Semarang, Provinsi Jawa Tengah', 1, ''),
	(4, 'RSUD dr. Adhyatma MPH (RSUD Tugurejo) Provinsi Jawa Tengah', '', 'Direktur', '', 1, ''),
	(5, 'Asosiasi Rumah Sakit Daerah Seluruh Indonesia (ARSADA) Provinsi Jawa Tengah', '', 'Direktur', '', 1, ''),
	(6, 'PT. Shopee Indonesia', '', 'Direktur', '', 1, ''),
	(7, 'Bytedance Pte. Ltd', '', 'Direktur', '', 1, ''),
	(8, 'PT. Cahaya Ilmu Indonesia', 'Wahyudi', 'Direktur', 'Jl. Gemolong - Sragen', 1, '4567876545678'),
	(9, 'CV. MULTITON GRAPHINDO', 'Ahmad Sajid, S.E', 'Direktur', 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen', 1, '81.242.576.7-528.000'),
	(10, 'PT. Perusahaan Listrik Negara (PLN)', '', 'Direktur', '', 1, ''),
	(11, 'Claude by Anthropic', '', 'Direktur', '', 1, '');

-- Dumping structure for table db_spj_proc.rekening
CREATE TABLE IF NOT EXISTS `rekening` (
  `id` int NOT NULL AUTO_INCREMENT,
  `kode` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uraian` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pagu` double NOT NULL DEFAULT '0',
  `realisasi_awal` double NOT NULL DEFAULT '0',
  `ppkom_id` int DEFAULT NULL,
  `pptk_id` int DEFAULT NULL,
  `pengadaan_id` int DEFAULT NULL,
  `induk_kode` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `induk_uraian` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `no_urut` int DEFAULT '0',
  `tahun` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_rek_tahun_kode` (`tahun`,`kode`),
  KEY `ppkom_id` (`ppkom_id`),
  KEY `pptk_id` (`pptk_id`),
  KEY `pengadaan_id` (`pengadaan_id`),
  CONSTRAINT `rekening_ibfk_1` FOREIGN KEY (`ppkom_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `rekening_ibfk_2` FOREIGN KEY (`pptk_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `rekening_ibfk_3` FOREIGN KEY (`pengadaan_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=151 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table db_spj_proc.rekening: ~75 rows (approximately)
INSERT INTO `rekening` (`id`, `kode`, `uraian`, `pagu`, `realisasi_awal`, `ppkom_id`, `pptk_id`, `pengadaan_id`, `induk_kode`, `induk_uraian`, `no_urut`, `tahun`) VALUES
	(1, '5.1.02.99.99.9999.01', 'Belanja Alat Tulis Kantor', 200000000, 0, 5, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 1, 2026),
	(2, '5.1.02.99.99.9999.02', 'Belanja Alat Listrik dan Elektronik', 100000000, 0, 5, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 2, 2026),
	(3, '5.1.02.99.99.9999.03', 'Belanja Perangko, Materai, dan Benda Pos', 10000000, 2000000, 9, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 3, 2026),
	(4, '5.1.02.99.99.9999.04', 'Belanja Alat Kebersihan dan Bahan Pembersih', 250000000, 0, 10, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 4, 2026),
	(5, '5.1.02.99.99.9999.05', 'Belanja Alat Rumah Tangga Kantor', 220000000, 0, 11, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 5, 2026),
	(6, '5.1.02.99.99.9999.06', 'Belanja Hadiah Lomba / Penghargaan / Suvenir', 25000000, 0, 5, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 6, 2026),
	(7, '5.1.02.99.99.9999.07', 'Belanja Perkakas Kerja', 5000000, 0, 9, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 7, 2026),
	(8, '5.1.02.99.99.9999.08', 'Belanja Barang Pakai Habis Kesehatan', 6000000000, 4807862, 12, 6, 13, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 8, 2026),
	(9, '5.1.02.99.99.9999.09', 'Belanja Bahan Obat-Obatan', 13277000000, 14945015, 12, 14, 15, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 9, 2026),
	(10, '5.1.02.99.99.9999.10', 'Belanja Bahan Kimia/ Radiologi/ Oksigen/ PMI', 2200000000, 239572797, 12, 14, 16, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 10, 2026),
	(11, '5.1.02.99.99.9999.11', 'Belanja Bahan Laboratorium', 1980000000, 18361000, 12, 6, 16, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 11, 2026),
	(12, '5.1.02.99.99.9999.12', 'Belanja Cetak', 200000000, 0, 5, 6, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 12, 2026),
	(13, '5.1.02.99.99.9999.13', 'Belanja Penggandaan', 40000000, 1514100, 5, 6, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 13, 2026),
	(14, '5.1.02.99.99.9999.14', 'Belanja Makanan dan Minuman Harian Pegawai', 200000000, 6971375, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 14, 2026),
	(15, '5.1.02.99.99.9999.15', 'Belanja Makanan dan Minuman Rapat', 65000000, 0, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 15, 2026),
	(16, '5.1.02.99.99.9999.16', 'Belanja Makanan dan Minuman Tamu', 10000000, 0, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 16, 2026),
	(17, '5.1.02.99.99.9999.17', 'Belanja Makanan dan Minuman Pasien', 1042533400, 0, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 17, 2026),
	(18, '5.1.02.99.99.9999.18', 'Belanja Pengisian Tabung Pemadam Kebakaran', 20000000, 0, 11, 6, 16, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 18, 2026),
	(19, '5.1.02.99.99.9999.19', 'Belanja Pengisian Tabung Gas', 70000000, 0, 11, 6, 16, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 19, 2026),
	(20, '5.1.02.99.99.9999.20', 'Belanja Telepon / Faksimil/ Internet/paket data', 60000000, 1858359, 19, 4, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 20, 2026),
	(21, '5.1.02.99.99.9999.21', 'Belanja Air', 75000000, 1280100, 19, 4, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 21, 2026),
	(22, '5.1.02.99.99.9999.22', 'Belanja Listrik', 1247852000, 102073640, 19, 4, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 22, 2026),
	(23, '5.1.02.99.99.9999.23', 'Belanja Pakaian Dinas Harian', 32000000, 0, 18, 6, 13, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 23, 2026),
	(24, '5.1.02.99.99.9999.24', 'Belanja Surat Kabar/Majalah', 3000000, 0, 9, 6, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 24, 2026),
	(25, '5.1.02.99.99.9999.25', 'Belanja Paket/Pengiriman', 3000000, 0, 9, 6, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 25, 2026),
	(26, '5.1.02.99.99.9999.26', 'Belanja Perjalanan Dinas Dalam Daerah', 20000000, 0, 22, 14, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 26, 2026),
	(27, '5.1.02.99.99.9999.27', 'Belanja Perjalanan Dinas Luar Daerah', 150000000, 34810393, 22, 14, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 27, 2026),
	(28, '5.1.02.99.99.9999.28', 'Belanja Penggantian Suku Cadang', 500000000, 0, 18, 14, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 28, 2026),
	(29, '5.1.02.99.99.9999.29', 'Belanja Bahan Bakar Minyak dan Pelumas', 260000000, 29524864, 11, 6, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 29, 2026),
	(30, '5.1.02.99.99.9999.30', 'Belanja Asuransi Kesehatan', 300000000, 8046158, 19, 4, 16, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 30, 2026),
	(31, '5.1.02.99.99.9999.31', 'Belanja iuran jaminan kesehatan ASN', 500000000, 6956995, 19, 4, NULL, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 31, 2026),
	(32, '5.1.02.99.99.9999.32', 'Belanja Asuransi Kendaraan', 25000000, 0, 18, 14, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 32, 2026),
	(33, '5.1.02.99.99.9999.33', 'Belanja Sertifikasi / Kalibrasi', 210000000, 0, 11, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 33, 2026),
	(34, '5.1.02.99.99.9999.34', 'Belanja Pajak/Retribusi', 60000000, 0, 19, 4, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 34, 2026),
	(35, '5.1.02.99.99.9999.35', 'Belanja Jasa Tenaga Kesehatan / ASN-Non ASN', 3600000000, 241822000, 19, 4, NULL, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 35, 2026),
	(36, '5.1.02.99.99.9999.36', 'Belanja Jasa Tenaga Pengamanan dan Sopir', 635988000, 53125000, 24, 14, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 36, 2026),
	(37, '5.1.02.99.99.9999.37', 'Belanja Jasa Tenaga Administrasi', 719728000, 59932532, 24, 14, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 37, 2026),
	(38, '5.1.02.99.99.9999.38', 'Belanja Jasa Kebersihan', 1208000000, 100496618, 24, 14, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 38, 2026),
	(39, '5.1.02.99.99.9999.39', 'Belanja Penguburan Jenazah dan Perlengkapannya', 6000000, 0, 9, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 39, 2026),
	(40, '5.1.02.99.99.9999.40', 'Belanja Jasa Sosial', 110000000, 1100000, 10, 14, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 40, 2026),
	(41, '5.1.02.99.99.9999.41', 'Belanja Jasa Pengambilan/Pengumpulan/Pengangkutan Sampah', 200000000, 6000000, 10, 14, 13, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 41, 2026),
	(42, '5.1.02.99.99.9999.42', 'Belanja Sewa', 50000000, 0, 9, 14, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 42, 2026),
	(43, '5.1.02.99.99.9999.43', 'Belanja Jasa Asuransi, Perbankan, dan Keuangan', 70000000, 0, 18, 4, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 43, 2026),
	(44, '5.1.02.99.99.9999.44', 'Belanja Jasa Penerangan, Iklan/Reklame,Film dan Pemotretan', 80000000, 40000000, 5, 14, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 44, 2026),
	(45, '5.1.02.99.99.9999.45', 'Belanja Jasa Konsultansi Manajemen/Keuangan/SDM', 560000000, 0, 18, 4, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 45, 2026),
	(46, '5.1.02.99.99.9999.46', 'Belanja Jasa Pelayanan Kesehatan bagi ASN', 20300000000, 0, 19, 4, NULL, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 46, 2026),
	(47, '5.1.02.99.99.9999.47', 'Belanja Insentif bagi Pegawai Non ASN atas Pemungutan Retribusi Jasa Umum- Pelayanan Kesehatan', 4000000000, 0, 19, 4, NULL, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 47, 2026),
	(48, '5.1.02.99.99.9999.48', 'Belanja Jasa Servis', 100000000, 0, 5, 14, 17, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 48, 2026),
	(49, '5.1.02.99.99.9999.49', 'Belanja Jasa Pest Control', 28000000, 2099998, 18, 14, 13, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 49, 2026),
	(50, '5.1.02.99.99.9999.50', 'Belanja Bimbingan Teknis, Sosialisasi, Pelatihan', 1000000000, 0, 24, 6, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 50, 2026),
	(51, '5.1.02.99.99.9999.51', 'Belanja Pemeliharaan Alat Kantor dan Rumah Tangga lainnya', 100000000, 0, 5, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 51, 2026),
	(52, '5.1.02.99.99.9999.52', 'Belanja Pemeliharaan Alat Pendingin Ruangan ( Air Conditioner )', 150000000, 0, 18, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 52, 2026),
	(53, '5.1.02.99.99.9999.53', 'Belanja Pemeliharaan Alat Kedokteran dan Kesehatan umum', 700000000, 24000000, 18, 14, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 53, 2026),
	(54, '5.1.02.99.99.9999.54', 'Belanja Pemeliharaan Bangunan Gedung - Pemeliharaan Lift', 100000000, 8750000, 18, 6, 8, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 54, 2026),
	(55, '5.1.02.99.99.9999.55', 'Belanja Pemeliharaan Bangunan Gedung Tempat Kerja', 629196140, 1695000, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 55, 2026),
	(56, '5.1.02.99.99.9999.56', 'Belanja Pemeliharaan Bangunan Tempat Kerja - Taman', 50000000, 2000000, 18, 6, 7, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 56, 2026),
	(57, '5.1.02.99.99.9999.57', 'Belanja Pemeliharaan Alat Kantor dan Rumah Tangga - Elektronik dan Software', 100000000, 0, 5, 14, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 57, 2026),
	(58, '5.1.02.99.99.9999.58', 'Belanja Lainnya', 20432000, 0, 19, 14, 21, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 58, 2026),
	(59, '5.1.02.99.99.9999.59', 'Belanja Perjalanan Dinas Luar Negeri', 60000000, 0, NULL, NULL, NULL, '5.1.02.99.99.9999', 'Belanja Barang dan Jasa BLUD', 59, 2026),
	(60, '5.2.02.99.99.9999.01', 'Belanja Modal Kendaraan Dinas', 60000000, 0, 11, 4, 16, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 1, 2026),
	(61, '5.2.02.99.99.9999.02', 'Belanja Modal Alat Kantor Lainnya', 100000000, 0, 11, 4, 7, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 2, 2026),
	(62, '5.2.02.99.99.9999.03', 'Belanja Modal Meubelair', 100000000, 0, 5, 6, 16, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 3, 2026),
	(63, '5.2.02.99.99.9999.04', 'Belanja Modal Alat Dapur', 100000000, 0, 10, 6, 7, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 4, 2026),
	(64, '5.2.02.99.99.9999.05', 'Belanja Modal Alat Rumah Tangga Lainnya', 100000000, 0, 18, 6, 7, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 5, 2026),
	(65, '5.2.02.99.99.9999.06', 'Belanja Modal Alat Kesehatan Umum Lainnya', 5100000000, 10599390, 22, 14, 16, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 6, 2026),
	(66, '5.2.02.99.99.9999.07', 'Belanja Modal Peralatan Komputer', 120000000, 0, 5, 14, 21, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 7, 2026),
	(67, '5.2.02.99.99.9999.08', 'Belanja Modal Alat Komunikasi', 20000000, 0, 5, 14, 21, '5.2.02.99.99.9999', 'Belanja Modal Peralatan dan Mesin BLUD', 8, 2026),
	(68, '5.2.03.99.99.9999.01', 'Belanja Modal Rehab Gedung Transit Dokter - Gedung eks Kelurahan', 730000000, 0, 24, 14, 21, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 1, 2026),
	(69, '5.2.03.99.99.9999.02', 'Belanja Modal Review DED Ruang Instalasi Bedah Sentral', 52868880, 0, 22, 14, 17, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 2, 2026),
	(70, '5.2.03.99.99.9999.03', 'Belanja Modal Rehab Poliklinik Rawat Jalan', 450000000, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 3, 2026),
	(71, '5.2.03.99.99.9999.04', 'Belanja Modal Rehab Ruang Apotek Rawat Jalan dan Rawat Inap', 525000000, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 4, 2026),
	(72, '5.2.03.99.99.9999.05', 'Belanja Modal Rehab Ruang Instalasi Bedah Sentral', 450000000, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 5, 2026),
	(73, '5.2.03.99.99.9999.06', 'Belanja Modal Rehab Ruang Tulip', 600000000, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 6, 2026),
	(74, '5.2.03.99.99.9999.07', 'Belanja Modal Pemindahan Bank', 92131120, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 7, 2026),
	(75, '5.2.03.99.99.9999.08', 'Belanja Modal Rehab Ruang Server', 100000000, 0, NULL, NULL, NULL, '5.2.03.99.99.9999', 'Belanja Modal Gedung dan Bangunan BLUD', 8, 2026);

-- Dumping structure for table db_spj_proc.sppd_item
CREATE TABLE IF NOT EXISTS `sppd_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rekap_id` int NOT NULL,
  `urut` int NOT NULL DEFAULT '0',
  `nama` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ASN',
  `tgl_berangkat` date DEFAULT NULL,
  `tgl_kembali` date DEFAULT NULL,
  `los` int NOT NULL DEFAULT '1',
  `uh_tarif` bigint NOT NULL DEFAULT '0',
  `uh_persen` decimal(6,2) NOT NULL DEFAULT '100.00',
  `uh_index` bigint NOT NULL DEFAULT '0',
  `dk_tarif` bigint NOT NULL DEFAULT '0',
  `dk_persen` decimal(6,2) NOT NULL DEFAULT '100.00',
  `dk_hari` int NOT NULL DEFAULT '0',
  `dk_total` bigint NOT NULL DEFAULT '0',
  `tujuan` varchar(500) NOT NULL DEFAULT '',
  `acara` varchar(1000) NOT NULL DEFAULT '',
  `bbm` bigint NOT NULL DEFAULT '0',
  `etol` bigint NOT NULL DEFAULT '0',
  `penginapan` bigint NOT NULL DEFAULT '0',
  `uh_total` bigint NOT NULL DEFAULT '0',
  `transport_pp` bigint NOT NULL DEFAULT '0',
  `transport_lokal` bigint NOT NULL DEFAULT '0',
  `kontribusi` bigint NOT NULL DEFAULT '0',
  `jumlah` bigint NOT NULL DEFAULT '0',
  `no_rek` varchar(100) NOT NULL DEFAULT '',
  `detail_json` mediumtext,
  PRIMARY KEY (`id`),
  KEY `idx_sppd_item` (`rekap_id`,`urut`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_spj_proc.sppd_item: ~8 rows (approximately)
INSERT INTO `sppd_item` (`id`, `rekap_id`, `urut`, `nama`, `status`, `tgl_berangkat`, `tgl_kembali`, `los`, `uh_tarif`, `uh_persen`, `uh_index`, `dk_tarif`, `dk_persen`, `dk_hari`, `dk_total`, `tujuan`, `acara`, `bbm`, `etol`, `penginapan`, `uh_total`, `transport_pp`, `transport_lokal`, `kontribusi`, `jumlah`, `no_rek`, `detail_json`) VALUES
	(1, 1, 1, 'Dr. dr. KINIK DARSONO, M.Pd.Ked.', 'ASN', '2026-08-27', '2026-08-27', 1, 410000, 50.00, 205000, 0, 50.00, 0, 0, 'RSUD Dr. Mohammad Soewandi Kota Surabaya', 'Studi Banding/ Koordinasi ke Dinas Kesehatan Kota Surabaya Provinsi Jawa Timur Khususnya ke RSUD Dr. Mohammad Soewandi Kota Surabaya', 0, 0, 0, 205000, 0, 0, 0, 205000, '', '{"ber":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"","alamat":"","malam":0,"harga":0}}'),
	(2, 1, 2, 'SETYANA TRI PUTRA, ST., M.Si', 'ASN', '2026-08-27', '2026-08-27', 1, 410000, 50.00, 205000, 0, 50.00, 0, 0, 'RSUD Dr. Mohammad Soewandi Kota Surabaya', 'Studi Banding/ Koordinasi ke Dinas Kesehatan Kota Surabaya Provinsi Jawa Timur Khususnya ke RSUD Dr. Mohammad Soewandi Kota Surabaya', 0, 0, 0, 205000, 0, 0, 0, 205000, '', '{"ber":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"","alamat":"","malam":0,"harga":0}}'),
	(3, 1, 3, 'NUNUNG AGUS DWI HARYANTO, SE, M.Si', 'ASN', '2026-08-27', '2026-08-27', 1, 410000, 50.00, 205000, 0, 50.00, 0, 0, 'RSUD Dr. Mohammad Soewandi Kota Surabaya', 'Studi Banding/ Koordinasi ke Dinas Kesehatan Kota Surabaya Provinsi Jawa Timur Khususnya ke RSUD Dr. Mohammad Soewandi Kota Surabaya', 400000, 540000, 0, 205000, 0, 0, 0, 1145000, '', '{"ber":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"","alamat":"","malam":0,"harga":0}}'),
	(4, 1, 4, 'ANDREAS HASTA RIAWAN, AMF', 'ASN', '2026-08-27', '2026-08-27', 1, 410000, 50.00, 205000, 0, 50.00, 0, 0, 'RSUD Dr. Mohammad Soewandi Kota Surabaya', 'Studi Banding/ Koordinasi ke Dinas Kesehatan Kota Surabaya Provinsi Jawa Timur Khususnya ke RSUD Dr. Mohammad Soewandi Kota Surabaya', 0, 0, 0, 205000, 0, 0, 0, 205000, '', '{"ber":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"","alamat":"","malam":0,"harga":0}}'),
	(5, 1, 5, 'FITRIA PURNAMAWATI,S.Kep.,M.Kep', 'ASN', '2026-08-27', '2026-08-27', 1, 410000, 50.00, 205000, 0, 50.00, 0, 0, 'RSUD Dr. Mohammad Soewandi Kota Surabaya', 'Studi Banding/ Koordinasi ke Dinas Kesehatan Kota Surabaya Provinsi Jawa Timur Khususnya ke RSUD Dr. Mohammad Soewandi Kota Surabaya', 0, 0, 0, 205000, 0, 0, 0, 205000, '', '{"ber":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"","maskapai":"","booking":"","tiket":"","penerbangan":"","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"","alamat":"","malam":0,"harga":0}}'),
	(6, 1, 6, 'ANDREAS HASTA RIAWAN, AMF', 'ASN', '2026-09-17', '2026-09-19', 2, 530000, 50.00, 265000, 160000, 50.00, 1, 80000, 'SMESCO Jakarta, Jl. Gatot Subroto No.94, RT.11/RW.3, Pancoran, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta', 'Workshop Nasional : Sosialisasi Standar Nasional Indonesia SMART Hospital dan Penyusunan / Revisi Masterplan Rumah Sakit 2026-2045 Berdasarkan Standar Nasional Indonesia (SNI)', 0, 0, 0, 530000, 0, 0, 0, 610000, '', '{"ber":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"67K93TL","plat":"","travel":"","tiket_travel":"","harga":2136500},"pul":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"678863K93TY","plat":"","travel":"","tiket_travel":"","harga":1783500},"hotel":{"nama":"Aryaduta Suite Semanggi","alamat":"l. Garnisun Jl. Garnisun 1 No.8 5, RT.5/RW.4, Karet Semanggi, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12930","malam":2,"harga":2646943}}'),
	(7, 1, 7, 'BEKTI NUGROHO,S.Kom. M.Eng.', 'ASN', '2026-09-17', '2026-09-19', 2, 530000, 50.00, 265000, 160000, 50.00, 1, 80000, 'SMESCO Jakarta, Jl. Gatot Subroto No.94, RT.11/RW.3, Pancoran, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta', 'Workshop Nasional : Sosialisasi Standar Nasional Indonesia SMART Hospital dan Penyusunan / Revisi Masterplan Rumah Sakit 2026-2045 Berdasarkan Standar Nasional Indonesia (SNI)', 0, 0, 0, 530000, 0, 0, 0, 610000, '', '{"ber":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"67K93TL","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"678863K93TY","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"Aryaduta Suite Semanggi","alamat":"l. Garnisun Jl. Garnisun 1 No.8 5, RT.5/RW.4, Karet Semanggi, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12930","malam":2,"harga":0}}'),
	(8, 1, 8, 'BAGUS PRASETYA UTAMA, AMTE', 'ASN', '2026-09-17', '2026-09-19', 2, 530000, 50.00, 265000, 160000, 50.00, 1, 80000, 'SMESCO Jakarta, Jl. Gatot Subroto No.94, RT.11/RW.3, Pancoran, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta', 'Workshop Nasional : Sosialisasi Standar Nasional Indonesia SMART Hospital dan Penyusunan / Revisi Masterplan Rumah Sakit 2026-2045 Berdasarkan Standar Nasional Indonesia (SNI)', 0, 0, 0, 530000, 0, 0, 0, 610000, '', '{"ber":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"67K93TL","plat":"","travel":"","tiket_travel":"","harga":0},"pul":{"moda":"pesawat_kereta","maskapai":"SINGASARI 149","booking":"","tiket":"","penerbangan":"678863K93TY","plat":"","travel":"","tiket_travel":"","harga":0},"hotel":{"nama":"Aryaduta Suite Semanggi","alamat":"l. Garnisun Jl. Garnisun 1 No.8 5, RT.5/RW.4, Karet Semanggi, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12930","malam":2,"harga":0}}');

-- Dumping structure for table db_spj_proc.sppd_rekap
CREATE TABLE IF NOT EXISTS `sppd_rekap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `jenis` varchar(10) NOT NULL,
  `tahun` smallint NOT NULL,
  `tgl_mulai` date NOT NULL,
  `tgl_selesai` date NOT NULL,
  `tgl_ttd` date DEFAULT NULL,
  `label` varchar(255) NOT NULL DEFAULT '',
  `rekening_id` int DEFAULT NULL,
  `ppk_id` int DEFAULT NULL,
  `dibuat_oleh` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sppd_rekap` (`jenis`,`tahun`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_spj_proc.sppd_rekap: ~0 rows (approximately)
INSERT INTO `sppd_rekap` (`id`, `jenis`, `tahun`, `tgl_mulai`, `tgl_selesai`, `tgl_ttd`, `label`, `rekening_id`, `ppk_id`, `dibuat_oleh`) VALUES
	(1, 'luar', 2026, '2026-10-06', '2026-11-06', '2026-11-06', 'Periode 06 Oktober s.d 06 November 2026', 27, NULL, 1);

-- Dumping structure for table db_spj_proc.transaksi
CREATE TABLE IF NOT EXISTS `transaksi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tanggal` date NOT NULL,
  `rekening_id` int NOT NULL,
  `penyedia` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uraian` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `kotor` double NOT NULL,
  `ppn_aktif` tinyint NOT NULL DEFAULT '0',
  `pph_aktif` tinyint NOT NULL DEFAULT '0',
  `ppn_tarif` double NOT NULL DEFAULT '11',
  `pph_tarif` double NOT NULL DEFAULT '1.5',
  `kategori` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `kpa_id` int DEFAULT NULL,
  `ppkom_id` int DEFAULT NULL,
  `pptk_id` int DEFAULT NULL,
  `pengadaan_id` int DEFAULT NULL,
  `bendahara_id` int DEFAULT NULL,
  `verifikator_id` int DEFAULT NULL,
  `dibuat_oleh` int DEFAULT NULL,
  `dibuat_pada` datetime DEFAULT CURRENT_TIMESTAMP,
  `sp_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `sp_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `sp_tanggal` date DEFAULT NULL,
  `sp_tgl_kirim` date DEFAULT NULL,
  `bast_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bast_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bast_tanggal` date DEFAULT NULL,
  `penyedia_id` int DEFAULT NULL,
  `penyedia_pimpinan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `penyedia_jabatan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Direktur',
  `penyedia_alamat` text COLLATE utf8mb4_unicode_ci,
  `ppk_jabatan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `ppk_alamat` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong',
  `tahap` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT 'pesanan',
  `penyedia_npwp` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `baphp_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `baphp_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `baphp_tanggal` date DEFAULT NULL,
  `pengurus_barang_id` int DEFAULT NULL,
  `mode_pengadaan` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '0_10',
  `spektek_json` longtext COLLATE utf8mb4_unicode_ci,
  `hps_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `hps_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `hps_tanggal` date DEFAULT NULL,
  `hps_total` bigint DEFAULT '0',
  `bakn_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bakn_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `bakn_tanggal` date DEFAULT NULL,
  `penawaran_total` bigint DEFAULT '0',
  `bakn_hasil_teknis` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Sesuai - Ada Perubahan',
  `pl_json` longtext COLLATE utf8mb4_unicode_ci,
  `spk_no_urut` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `spk_nomor` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `spk_tanggal` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_trx_rek` (`rekening_id`),
  KEY `idx_trx_tgl` (`tanggal`),
  KEY `kpa_id` (`kpa_id`),
  KEY `ppkom_id` (`ppkom_id`),
  KEY `pptk_id` (`pptk_id`),
  KEY `pengadaan_id` (`pengadaan_id`),
  KEY `bendahara_id` (`bendahara_id`),
  KEY `verifikator_id` (`verifikator_id`),
  KEY `dibuat_oleh` (`dibuat_oleh`),
  CONSTRAINT `transaksi_ibfk_1` FOREIGN KEY (`rekening_id`) REFERENCES `rekening` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaksi_ibfk_2` FOREIGN KEY (`kpa_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_3` FOREIGN KEY (`ppkom_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_4` FOREIGN KEY (`pptk_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_5` FOREIGN KEY (`pengadaan_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_6` FOREIGN KEY (`bendahara_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_7` FOREIGN KEY (`verifikator_id`) REFERENCES `pejabat` (`id`) ON DELETE SET NULL,
  CONSTRAINT `transaksi_ibfk_8` FOREIGN KEY (`dibuat_oleh`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table db_spj_proc.transaksi: ~29 rows (approximately)
INSERT INTO `transaksi` (`id`, `tanggal`, `rekening_id`, `penyedia`, `uraian`, `kotor`, `ppn_aktif`, `pph_aktif`, `ppn_tarif`, `pph_tarif`, `kategori`, `status`, `kpa_id`, `ppkom_id`, `pptk_id`, `pengadaan_id`, `bendahara_id`, `verifikator_id`, `dibuat_oleh`, `dibuat_pada`, `sp_no_urut`, `sp_nomor`, `sp_tanggal`, `sp_tgl_kirim`, `bast_no_urut`, `bast_nomor`, `bast_tanggal`, `penyedia_id`, `penyedia_pimpinan`, `penyedia_jabatan`, `penyedia_alamat`, `ppk_jabatan`, `ppk_alamat`, `tahap`, `penyedia_npwp`, `baphp_no_urut`, `baphp_nomor`, `baphp_tanggal`, `pengurus_barang_id`, `mode_pengadaan`, `spektek_json`, `hps_no_urut`, `hps_nomor`, `hps_tanggal`, `hps_total`, `bakn_no_urut`, `bakn_nomor`, `bakn_tanggal`, `penawaran_total`, `bakn_hasil_teknis`, `pl_json`, `spk_no_urut`, `spk_nomor`, `spk_tanggal`) VALUES
	(1, '2026-10-16', 20, 'PT. Telkom Indonesia', 'Biaya Telepon dan Internet Bulan Oktober 2026', 1858359, 1, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 1, '2026-10-16 07:56:39', '', '', NULL, NULL, '', '', NULL, NULL, '', 'Direktur', NULL, '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'pesanan', '', '', '', NULL, NULL, '0_10', NULL, '', '', NULL, 0, '', '', NULL, 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(2, '2026-10-15', 50, 'CV. Surya Globe', 'Pelatihan PPI Dasar Bagi Tenaga Kesehatan di Fasyankes Angkatan III an. Sansavera Nur Fatimah, A.Md.Kep', 1475000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 1, '2026-10-16 17:29:45', '1607', '000.3.2/1607/05.1.2/2026', '2026-09-01', '2026-09-17', '1631', '000.3.2/1631/05.1.2/2026', '2026-09-17', NULL, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'pesanan', '', '', '', NULL, NULL, '0_10', NULL, '', '', NULL, 0, '', '', NULL, 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(3, '2026-10-17', 66, 'CV. Surya Globe', 'Belanja Modal Peralatan Komputer', 7050000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 5, 14, 21, 2, 3, 1, '2026-10-17 09:56:34', '1608', '000.3.2/1608/05.1.2/2026', '2026-10-17', '2026-10-26', '1632', '000.3.2/1632/05.1.2/2026', '2026-10-17', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '', '', '', NULL, NULL, '0_10', NULL, '', '', NULL, 0, '', '', NULL, 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(4, '2026-10-17', 50, 'RSUD dr. Adhyatma MPH (RSUD Tugurejo) Provinsi Jawa Tengah', 'Pelatihan PPI Dasar Bagi Tenaga Kesehatan di Fasyankes Angkatan III an. Sansavera Nur Fatimah, A.Md.Kep', 1475000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 24, 6, 21, 2, 3, 1, '2026-10-17 10:30:53', '', '', '2026-10-17', '2026-10-17', '', '', '2026-10-17', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', NULL, NULL, '0_10', NULL, '', '', NULL, 0, '', '', NULL, 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(5, '2026-10-17', 67, 'CV. Surya Globe', 'Samsung Galaxy Tab A11 WiFi 4/64GB', 6300000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 5, 14, 21, 2, 3, 1, '2026-10-17 11:38:51', '3129', '000.3.2/3129/05.1.2/2026', '2026-10-17', '2026-10-27', '1633', '000.3.2/1633/05.1.2/2026', '2026-10-17', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '', '1633.a', '000.3.2/1633.a/05.1.2/2026', '2026-10-29', 27, '0_10', NULL, '', '', NULL, 0, '', '', NULL, 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(7, '2026-10-17', 66, 'CV. Surya Globe', 'PC Pendaftaran', 39000000, 1, 0, 11, 1.5, 'K3', 'draft', 1, 5, 14, 21, 2, 3, 2, '2026-10-17 16:35:48', '3131', '000.3.2/3131/05.1.2/2026', '2026-10-17', '2026-10-28', '1635', '000.3.2/1635/05.1.2/2026', '2026-10-17', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '', '1635.a', '000.3.2/1635.a/05.1.2/2026', '2026-10-29', 27, '10_50', '{"paket_pengadaan":"Belanja Modal Peralatan Komputer","id_rup":"62736023","tanggal":"2026-10-17","fungsi_umum":"Pengadaan Belanja Modal Peralatan Komputer ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"PC Desktop : Minimal Core i3 Generasi ke-13, RAM 8GB, SSD 512 GB, Keyboard & Mouse USB, Monitor LED Minimal 21 Inci FHD.\\nPrinter : Tipe Ink Tank (Print Only), Resolusi 720 x 720 dpi, Kecepatan Cetak 9.0 ipm (Hitam) / 4.8 ipm (Warna), Konektivitas USB 2.0.","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '1286', '000.3.2/1286/05.1.2/2026', '2026-10-17', 40000000, '3131.a', '000.3.2/3131.a/05.1.2/2026', '2026-10-17', 40000000, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(9, '2026-10-20', 50, 'Asosiasi Rumah Sakit Daerah Seluruh Indonesia (ARSADA) Provinsi Jawa Tengah', 'Rapat Kerja Daerah (Rakerda) XXVI, Seminar dan Workshop ARSADA Jawa Tengah Tahun 2026 an. Setyana Tri Putra, ST.M.Si, Imas Wulandari, S.Kom., M.Eng, Fitria Purnamawati, S.Kep.,M.Kep, Bekti Nugroho, S.Kom., M.Eng', 10000000, 0, 0, 11, 1.5, 'K2', 'draft', 1, 24, 6, 21, 2, 3, 1, '2026-10-20 10:10:20', '', '', '2026-10-20', '2026-10-20', '', '', '2026-10-20', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-20', 27, '0_10', NULL, '', '', '2026-10-20', 10200000, '', '', '2026-10-20', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(12, '2026-10-21', 50, 'Asosiasi Rumah Sakit Daerah Seluruh Indonesia (ARSADA) Provinsi Jawa Tengah', 'Pelatihan dialisis', 10000000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 24, 6, 21, 2, 3, 1, '2026-10-21 09:47:34', '', '', '2026-10-21', '2026-10-21', '', '', '2026-10-21', 5, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-21', 27, '0_10', '{"paket_pengadaan":"Belanja Bimbingan Teknis, Sosialisasi, Pelatihan","id_rup":"62736023","tanggal":"2026-10-21","fungsi_umum":"Pengadaan Belanja Modal Peralatan Komputer ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"PC Desktop : Minimal Core i3 Generasi ke-13, RAM 8GB, SSD 512 GB, Keyboard & Mouse USB, Monitor LED Minimal 21 Inci FHD.\\nPrinter : Tipe Ink Tank (Print Only), Resolusi 720 x 720 dpi, Kecepatan Cetak 9.0 ipm (Hitam) / 4.8 ipm (Warna), Konektivitas USB 2.0.","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '', '', '2026-10-21', 10000000, '', '', '2026-10-21', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(13, '2026-10-21', 67, 'CV. Surya Globe', 'Pembayaran Tablet Samsung A301', 5000000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 5, 14, 21, 2, 3, 1, '2026-10-21 09:49:22', '', '', '2026-10-21', '2026-10-28', '', '', '2026-10-21', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-21', 27, '0_10', NULL, '', '', '2026-10-21', 4, '', '', '2026-10-21', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(15, '2026-10-21', 20, 'PT. Shopee Indonesia', 'Tagihan Internet Halo Pascabayar 085210101086 Bulan Oktober 2026', 133500, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-21 12:26:22', '', '', '2026-10-21', '2026-10-21', '', '', '2026-10-21', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-21', 27, '0_10', NULL, '', '', '2026-10-21', 133500, '', '', '2026-10-21', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(18, '2026-10-21', 20, 'Bytedance Pte. Ltd', 'Biaya Langganan Capcut Pro 1 Tahun itrsudgemolong@gmail.com', 365000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-21 14:10:45', '', '', '2026-10-21', '2026-10-21', '', '', '2026-10-21', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-21', 27, '0_10', NULL, '', '', '2026-10-21', 0, '', '', '2026-10-21', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(19, '2026-09-17', 1, 'CV. Surya Globe', 'Pengadaan PC Desktop Build-Up Core i3 Gen 13 dan InkTank Printer', 44400000, 0, 0, 11, 1.5, 'K3', 'draft', 1, 5, 6, 7, 2, 3, 1, '2026-10-22 08:47:29', '1607', '000.3.2/1607/05.1.2/2026', '2026-09-01', '2026-09-28', '', '', '2026-09-17', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'pesanan', '01.234.567.8-526.000', '', '', '2026-09-17', 27, '10_50', '{"paket_pengadaan":"Belanja Alat Tulis Kantor","id_rup":"62736023","tanggal":"2026-10-22","fungsi_umum":"Pengadaan Belanja Modal Peralatan Komputer ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"PC SET Build-up, Intel core i3 Gen 13, RAM 8GB DDR5, SSD 512GB (2 Set)\\nInkTank Printer (Print Only, Resolusi 720x720 dpi, USB 2.0) (8 Unit)","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '1286', '000.3.2/1286/05.1.2/2026', '2026-06-29', 45303992, '1607.a', '000.3.2/1607.a/05.1.2/2026', '2026-09-01', 44800000, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(20, '2026-10-22', 1, 'PT. Cahaya Ilmu Indonesia', 'asdfasdfasdfasdfasdfasdf', 200000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 5, 6, 7, 2, 3, 1, '2026-10-22 08:49:49', '', '', '2026-10-22', '2026-10-22', '', '', '2026-10-22', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 0, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(21, '2026-10-26', 1, 'PT. Cahaya Ilmu Indonesia', 'Pembayaran ATK', 2100000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 5, 6, 7, 2, 3, 1, '2026-10-22 08:52:25', '3132', '000.3.2/3132/05.1.2/2026', '2026-10-22', '2026-10-26', '1636', '000.3.2/1636/05.1.2/2026', '2026-10-26', 8, 'Wahyudi', 'Direktur', 'Jl. Gemolong - Sragen', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '', '1636.a', '000.3.2/1636.a/05.1.2/2026', '2026-10-26', 27, '0_10', NULL, '', '', '2026-10-22', 41, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(22, '2026-10-22', 2, 'CV. Surya Globe', '', 3000000, 0, 0, 11, 1.5, 'K2', 'draft', 1, 5, 6, 8, 2, 3, 1, '2026-10-22 09:00:28', '3133', '000.3.2/3133/05.1.2/2026', '2026-10-22', '2026-10-22', '', '', '2026-10-22', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'pesanan', '01.234.567.8-526.000', '', '', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 2, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(23, '2026-10-29', 2, 'CV. Surya Globe', 'PC dan Mouse', 10800000, 1, 0, 11, 1.5, 'K3', 'draft', 1, 5, 6, 8, 2, 3, 1, '2026-10-22 09:04:06', '', '', '2026-10-29', '2026-10-22', '1637', '000.3.2/1637/05.1.2/2026', '2026-10-29', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '01.234.567.8-526.000', '1637.a', '000.3.2/1637.a/05.1.2/2026', '2026-10-28', 27, '10_50', '{"paket_pengadaan":"PC dan Mouse","id_rup":"62736023","tanggal":"2026-10-22","fungsi_umum":"Pengadaan Belanja Alat Listrik dan Elektronik ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"PC Desktop : Minimal Core i3 Generasi ke-13, RAM 8GB, SSD 512 GB, Keyboard & Mouse USB, Monitor LED Minimal 21 Inci FHD.\\nPrinter : Tipe Ink Tank (Print Only), Resolusi 720 x 720 dpi, Kecepatan Cetak 9.0 ipm (Hitam) / 4.8 ipm (Warna), Konektivitas USB 2.0.","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '1287', '000.3.2/1287/05.1.2/2026', '2026-10-22', 11000000, '3134.a', '000.3.2/3134.a/05.1.2/2026', '2026-10-22', 10890000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"2436","undangan_nomor":"000.3.2/2436/05.1.2/2026","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"PC dan Mouse","penawaran_nomor":"","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-22","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"2573.b","pembukaan_nomor":"000.3.2/2573.b/05.1.2/2026","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"2573.c","evaluasi_nomor":"000.3.2/2573.c/05.1.2/2026","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"2578.a","undangan_klarifikasi_nomor":"000.3.2/2578.a/05.1.2/2026","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"2656","penetapan_nomor":"000.3.2/2656/05.1.2/2026","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"2656.a","bahpl_nomor":"000.3.2/2656.a/05.1.2/2026","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"2656.b","pengumuman_nomor":"000.3.2/2656.b/05.1.2/2026","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"2657","laporan_nomor":"000.3.2/2657/05.1.2/2026","laporan_tanggal":"2026-10-22","sppbj_no_urut":"1769","sppbj_nomor":"000.3.2/1769/05.1.2/2026","sppbj_tanggal":"2026-10-22","spk_no_urut":"2673","spk_nomor":"000.3.2/2673/05.1.2/2026","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '2673', '000.3.2/2673/05.1.2/2026', '2026-10-22'),
	(24, '2026-10-22', 3, '-', '', 10000000, 0, 0, 11, 1.5, 'K2', 'draft', 1, 9, 6, 7, 2, 3, 1, '2026-10-22 09:09:13', '', '', '2026-10-22', '2026-10-22', '', '', '2026-10-22', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'hps', '', '', '', '2026-10-22', 27, '10_50', '{"paket_pengadaan":"Belanja Perangko, Materai, dan Benda Pos","id_rup":"62736023","tanggal":"2026-10-22","fungsi_umum":"Pengadaan Belanja Modal Peralatan Komputer ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"PC Desktop : Minimal Core i3 Generasi ke-13, RAM 8GB, SSD 512 GB, Keyboard & Mouse USB, Monitor LED Minimal 21 Inci FHD.\\nPrinter : Tipe Ink Tank (Print Only), Resolusi 720 x 720 dpi, Kecepatan Cetak 9.0 ipm (Hitam) / 4.8 ipm (Warna), Konektivitas USB 2.0.","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '1288', '000.3.2/1288/05.1.2/2026', '2026-10-22', 10000000, '3134.a', '000.3.2/3134.a/05.1.2/2026', '2026-10-22', 0, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"2436","undangan_nomor":"000.3.2/2436/05.1.2/2026","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"","penawaran_nomor":"","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-22","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"2573.b","pembukaan_nomor":"000.3.2/2573.b/05.1.2/2026","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"2573.c","evaluasi_nomor":"000.3.2/2573.c/05.1.2/2026","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"2578.a","undangan_klarifikasi_nomor":"000.3.2/2578.a/05.1.2/2026","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"2656","penetapan_nomor":"000.3.2/2656/05.1.2/2026","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"2656.a","bahpl_nomor":"000.3.2/2656.a/05.1.2/2026","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"2656.b","pengumuman_nomor":"000.3.2/2656.b/05.1.2/2026","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"2657","laporan_nomor":"000.3.2/2657/05.1.2/2026","laporan_tanggal":"2026-10-22","sppbj_no_urut":"1769","sppbj_nomor":"000.3.2/1769/05.1.2/2026","sppbj_tanggal":"2026-10-22","spk_no_urut":"2674","spk_nomor":"000.3.2/2674/05.1.2/2026","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '2674', '000.3.2/2674/05.1.2/2026', '2026-10-22'),
	(25, '2026-07-25', 17, 'CV. MULTITON GRAPHINDO', 'Pengadaan AC Split dan AC Floor Standing Ruang Pelayanan RSUD dr. Soeratno Gemolong', 86700000, 0, 0, 11, 1.5, 'K4', 'draft', 1, 18, 6, 7, 2, 3, 1, '2026-10-22 10:00:32', '', '', '2026-10-22', '2026-10-22', '', '', '2026-07-25', NULL, 'Ahmad Sajid, S.E', 'Direktur', 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'evaluasi', '81.242.576.7-528.000', '', '', '2026-07-25', 27, '50_750', '{"paket_pengadaan":"Belanja Makanan dan Minuman Pasien","id_rup":"62736023","tanggal":"2026-10-22","fungsi_umum":"Pengadaan Belanja Makanan dan Minuman Pasien ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_teknis":"AC Split 1 PK Inverter Daikin Flash Inverter FTKQ25UVM4 (4 Unit)\\nAC Floor Standing 5 PK Daikin FVRN125BXV14 (2 Unit)","mutu_kinerja":"Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","info_lainnya":"Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku."}', '1286', '000.3.2/1286/05.1.2/2026', '2026-06-29', 88300000, '1607.a', '000.3.2/1607.a/05.1.2/2026', '2026-07-03', 87400000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"2436","undangan_nomor":"000.3.2/2436/05.1.2/2026","undangan_tanggal":"2026-06-29","lingkup_pekerjaan":"Pengadaan AC Split dan AC Floor Standing Ruang Pelayanan","penawaran_nomor":"05/PNWR/MG/2026","penawaran_tanggal":"2026-07-01","jadwal":{"pemasukan_tgl":"2026-07-01","pembukaan_tgl":"2026-07-01","evaluasi_tgl":"2026-07-02","klarifikasi_tgl":"2026-07-03","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-07-06","spk_tgl":"2026-07-08"},"pembukaan_no_urut":"2573.b","pembukaan_nomor":"000.3.2/2573.b/05.1.2/2026","pembukaan_tanggal":"2026-07-01","evaluasi_no_urut":"2573.c","evaluasi_nomor":"000.3.2/2573.c/05.1.2/2026","evaluasi_tanggal":"2026-07-02","undangan_klarifikasi_no_urut":"2578.a","undangan_klarifikasi_nomor":"000.3.2/2578.a/05.1.2/2026","undangan_klarifikasi_tanggal":"2026-07-02","penetapan_no_urut":"2656","penetapan_nomor":"000.3.2/2656/05.1.2/2026","penetapan_tanggal":"2026-07-06","bahpl_no_urut":"2656.a","bahpl_nomor":"000.3.2/2656.a/05.1.2/2026","bahpl_tanggal":"2026-07-06","pengumuman_no_urut":"2656.b","pengumuman_nomor":"000.3.2/2656.b/05.1.2/2026","pengumuman_tanggal":"2026-07-06","laporan_no_urut":"2657","laporan_nomor":"000.3.2/2657/05.1.2/2026","laporan_tanggal":"2026-07-06","sppbj_no_urut":"1769","sppbj_nomor":"000.3.2/1769/05.1.2/2026","sppbj_tanggal":"2026-07-07","spk_no_urut":"2673","spk_nomor":"000.3.2/2673/05.1.2/2026","spk_tanggal":"2026-07-08","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '2673', '000.3.2/2673/05.1.2/2026', '2026-07-08'),
	(26, '2026-10-22', 1, 'PT. Cahaya Ilmu Indonesia', 'Pembelian ATK Periode Januari - Juni 2026', 14891000, 1, 0, 11, 1.5, 'K3', 'draft', 1, 5, 6, 7, 2, 3, 1, '2026-10-22 10:31:09', '3134', '000.3.2/3134/05.1.2/2026', '2026-10-22', '2026-10-30', '1638', '000.3.2/1638/05.1.2/2026', '2026-10-22', 8, 'Wahyudi', 'Direktur', 'Jl. Gemolong - Sragen', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '4567876545678', '1638.a', '000.3.2/1638.a/05.1.2/2026', '2026-10-22', 27, '10_50', '{"id_rup":"56853","tanggal":"2026-10-22","fungsi_umum":"Pengadaan PC dan printer ini berfungsi sebagai perangkat kerja operasional untuk menjalankan Sistem Informasi Manajemen Rumah Sakit (SIMRS), memproses data rekam medis, serta mencetak dokumen pelayanan dan administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.","mutu_merek":"Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.","mutu_standarisasi":"Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.","mutu_kinerja":"PC Desktop : Mampu beroperasi stabil tanpa overheat untuk menjalankan SIMRS selama jam operasional rumah sakit.\\n\\nPrinter : Memiliki kecepatan cetak tinggi dan dirancang untuk beban kerja administrasi harian yang padat.","mutu_pdn":"Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.","waktu_jangka":"30 (tiga puluh) hari kalender sejak penandatangan kontrak.","waktu_lokasi":"RSUD dr. Soeratno Gemolong\\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen\\n","waktu_transportasi":"Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang elektronik aman dari benturan, debu, dan air hujan.","layanan_tingkat":"Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.","layanan_pelatihan":"Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal penyambungan kabel PC ke monitor dan kelistrikan), pengisian tinta printer, serta uji coba fungsi (power on dan test print) di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.","layanan_pemeliharaan":"1.\\tTerdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun untuk PC dan 2 (dua) tahun untuk Printer.\\n2.\\tApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.\\n","layanan_lainnya":"Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.","paket_pengadaan":"Pembelian ATK Periode Januari - Juni 2026"}', '1289', '000.3.2/1289/05.1.2/2026', '2026-10-22', 15300000, '3134.a', '000.3.2/3134.a/05.1.2/2026', '2026-10-22', 15095000, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(27, '2026-10-08', 67, '-', 'Pengadaan Tablet Bangsal dan Radiologi', 0, 0, 0, 11, 1.5, 'K1', 'draft', 1, 5, 14, 21, 2, 3, 1, '2026-10-22 10:45:59', '', '', '2026-10-08', '2026-10-22', '', '', '2026-10-22', NULL, '', 'Direktur', '', '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spektek', '', '', '', '2026-10-22', 27, '10_50', '{"id_rup":"","tanggal":"2026-10-08","paket_pengadaan":"Pengadaan Tablet Bangsal dan Radiologi"}', '1290', '000.3.2/1290/05.1.2/2026', '2026-10-22', 0, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(29, '2026-10-22', 67, 'CV. Surya Globe', 'Tablet Radiologi dan Bangsal', 13700000, 1, 0, 11, 1.5, 'K3', 'draft', 1, 5, 14, 21, 2, 3, 1, '2026-10-22 15:08:34', '1819', '000.3.2/1819/05.1.2/2026', '2026-10-22', '2026-10-29', '1639', '000.3.2/1639/05.1.2/2026', '2026-10-22', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '01.234.567.8-526.000', '1639.a', '000.3.2/1639.a/05.1.2/2026', '2026-10-22', 27, '10_50', '{"id_rup":"","tanggal":"2026-10-22","paket_pengadaan":"Belanja Modal Alat Komunikasi","fungsi_umum":""}', '1292', '000.3.2/1292/05.1.2/2026', '2026-10-22', 14200000, '1819.a', '000.3.2/1819.a/05.1.2/2026', '2026-10-19', 14200000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"","undangan_nomor":"","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"","penawaran_nomor":"","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-19","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"","pembukaan_nomor":"","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"","evaluasi_nomor":"","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"","undangan_klarifikasi_nomor":"","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"","penetapan_nomor":"","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"","bahpl_nomor":"","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"","pengumuman_nomor":"","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"","laporan_nomor":"","laporan_tanggal":"2026-10-22","sppbj_no_urut":"","sppbj_nomor":"","sppbj_tanggal":"2026-10-22","spk_no_urut":"","spk_nomor":"","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '', '', NULL),
	(30, '2026-10-22', 6, 'RSUD dr. Adhyatma MPH (RSUD Tugurejo) Provinsi Jawa Tengah', 'Hadiah Lomba 17 Agustus 2026', 1000000, 1, 0, 11, 1.5, 'K1', 'draft', 1, 5, 6, 7, 2, 3, 1, '2026-10-22 18:49:27', '', '', '2026-10-22', '2026-10-22', '', '', '2026-10-22', 4, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 0, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(31, '2026-10-22', 22, 'CV. MULTITON GRAPHINDO', 'Kabel Listrik PLN', 1100000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 1, '2026-10-22 18:53:55', '3135', '000.3.2/3135/05.1.2/2026', '2026-10-22', '2026-10-22', '1640', '000.3.2/1640/05.1.2/2026', '2026-10-22', 9, 'Ahmad Sajid, S.E', 'Direktur', 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '81.242.576.7-528.000', '1640.a', '000.3.2/1640.a/05.1.2/2026', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 1, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(32, '2026-10-22', 50, 'CV. MULTITON GRAPHINDO', 'tes pengadaan 10-50jt', 11900000, 1, 0, 11, 1.5, 'K3', 'draft', 1, 24, 6, 21, 2, 3, 2, '2026-10-22 19:13:50', '3136', '000.3.2/3136/05.1.2/2026', '2026-10-22', '2026-10-29', '1641', '000.3.2/1641/05.1.2/2026', '2026-10-22', 9, 'Ahmad Sajid, S.E', 'Direktur', 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen', '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '81.242.576.7-528.000', '1641.a', '000.3.2/1641.a/05.1.2/2026', '2026-10-22', 27, '10_50', '{"id_rup":"","tanggal":"2026-10-22","paket_pengadaan":"tes pengadaan 10-50jt"}', '1293', '000.3.2/1293/05.1.2/2026', '2026-10-22', 12000000, '3136.a', '000.3.2/3136.a/05.1.2/2026', '2026-10-22', 11900000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"","undangan_nomor":"","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"","penawaran_nomor":"","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-22","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"","pembukaan_nomor":"","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"","evaluasi_nomor":"","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"","undangan_klarifikasi_nomor":"","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"","penetapan_nomor":"","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"","bahpl_nomor":"","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"","pengumuman_nomor":"","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"","laporan_nomor":"","laporan_tanggal":"2026-10-22","sppbj_no_urut":"","sppbj_nomor":"","sppbj_tanggal":"2026-10-22","spk_no_urut":"","spk_nomor":"","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '', '', NULL),
	(33, '2026-10-22', 22, 'PT. Perusahaan Listrik Negara (PLN)', 'tessssasdfasdf', 1200000, 1, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-22 19:58:01', '', '', '2026-10-22', '2026-10-22', '', '', '2026-10-22', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 0, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(34, '2026-10-22', 22, 'PT. Cahaya Ilmu Indonesia', 'Listrik PLN yang itu tu', 1000000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-22 20:00:23', '3137', '000.3.2/3137/05.1.2/2026', '2026-10-22', '2026-10-28', '', '', '2026-10-22', 8, 'Wahyudi', 'Direktur', 'Jl. Gemolong - Sragen', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '4567876545678', '1642', '000.3.2/1642/05.1.2/2026', '2026-10-22', 27, '0_10', NULL, '', '', '2026-10-22', 1, '', '', '2026-10-22', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL),
	(35, '2026-10-22', 22, 'CV. Surya Globe', 'Kabel listik PLN', 10000000, 1, 0, 11, 1.5, 'K2', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-22 20:09:55', '3138', '000.3.2/3138/05.1.2/2026', '2026-10-22', '2026-10-29', '1643', '000.3.2/1643/05.1.2/2026', '2026-10-22', 1, 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '01.234.567.8-526.000', '1643.a', '000.3.2/1643.a/05.1.2/2026', '2026-10-22', 27, '10_50', '{"id_rup":"","tanggal":"2026-10-22","mutu_teknis":"kabel listrik (1 Unit)","paket_pengadaan":"Belanja Listrik"}', '1294', '000.3.2/1294/05.1.2/2026', '2026-10-22', 10000000, '3138.a', '000.3.2/3138.a/05.1.2/2026', '2026-10-22', 11000000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"","undangan_nomor":"","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"","penawaran_nomor":"","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-22","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"","pembukaan_nomor":"","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"","evaluasi_nomor":"","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"","undangan_klarifikasi_nomor":"","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"","penetapan_nomor":"","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"","bahpl_nomor":"","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"","pengumuman_nomor":"","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"","laporan_nomor":"","laporan_tanggal":"2026-10-22","sppbj_no_urut":"","sppbj_nomor":"","sppbj_tanggal":"2026-10-22","spk_no_urut":"","spk_nomor":"","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '', '', NULL),
	(36, '2026-10-22', 22, 'CV. MULTITON GRAPHINDO', 'ini adalah contoh untuk a2', 79500000, 1, 0, 11, 1.5, 'K4', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-22 20:31:30', '', '', '2026-10-22', '2026-10-22', '1644', '000.3.2/1644/05.1.2/2026', '2026-10-22', 9, 'Ahmad Sajid, S.E', 'Direktur', 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen', '', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'selesai', '81.242.576.7-528.000', '1644.a', '000.3.2/1644.a/05.1.2/2026', '2026-10-22', 27, '50_750', '{"id_rup":"56785","tanggal":"2026-10-22","paket_pengadaan":"Belanja Listrik"}', '1295', '000.3.2/1295/05.1.2/2026', '2026-10-22', 82000000, '3139.a', '000.3.2/3139.a/05.1.2/2026', '2026-10-22', 80900000, 'Sesuai - Ada Perubahan', '{"undangan_no_urut":"2437","undangan_nomor":"000.3.2/2437/05.1.2/2026","undangan_tanggal":"2026-10-22","lingkup_pekerjaan":"Pekerjaan pemasangan kabel listrik PLN","penawaran_nomor":"456gfc/466/2026","penawaran_tanggal":"2026-10-22","jadwal":{"pemasukan_tgl":"2026-10-22","pembukaan_tgl":"2026-10-22","evaluasi_tgl":"2026-10-22","klarifikasi_tgl":"2026-10-22","klarifikasi_waktu":"09.00 WIB","penetapan_tgl":"2026-10-22","spk_tgl":"2026-10-22"},"pembukaan_no_urut":"2574.b","pembukaan_nomor":"000.3.2/2574.b/05.1.2/2026","pembukaan_tanggal":"2026-10-22","evaluasi_no_urut":"2574.c","evaluasi_nomor":"000.3.2/2574.c/05.1.2/2026","evaluasi_tanggal":"2026-10-22","undangan_klarifikasi_no_urut":"2580.a","undangan_klarifikasi_nomor":"000.3.2/2580.a/05.1.2/2026","undangan_klarifikasi_tanggal":"2026-10-22","penetapan_no_urut":"2658","penetapan_nomor":"000.3.2/2658/05.1.2/2026","penetapan_tanggal":"2026-10-22","bahpl_no_urut":"2658.a","bahpl_nomor":"000.3.2/2658.a/05.1.2/2026","bahpl_tanggal":"2026-10-22","pengumuman_no_urut":"2658.b","pengumuman_nomor":"000.3.2/2658.b/05.1.2/2026","pengumuman_tanggal":"2026-10-22","laporan_no_urut":"2659","laporan_nomor":"000.3.2/2659/05.1.2/2026","laporan_tanggal":"2026-10-22","sppbj_no_urut":"1770","sppbj_nomor":"000.3.2/1770/05.1.2/2026","sppbj_tanggal":"2026-10-22","spk_no_urut":"","spk_nomor":"","spk_tanggal":"2026-10-22","spk_jenis_kontrak":"Kontrak Harga Satuan","spk_waktu_hari":30}', '2675', '000.3.2/2675/05.1.2/2026', '2026-10-22'),
	(37, '2026-10-27', 20, 'Claude by Anthropic', 'Biaya Langganan Claude Code Max 1 Bulan', 1999000, 0, 0, 11, 1.5, 'K1', 'draft', 1, 19, 4, 21, 2, 3, 2, '2026-10-27 09:03:38', '', '', '2026-10-27', '2026-10-27', '', '', '2026-10-27', NULL, '', 'Direktur', '', 'Kepala Seksi Informasi dan Pemasaran', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 'spj_langsung', '', '', '', '2026-10-27', 27, '0_10', NULL, '', '', '2026-10-27', 0, '', '', '2026-10-27', 0, 'Sesuai - Ada Perubahan', NULL, '', '', NULL);

-- Dumping structure for table db_spj_proc.transaksi_item
CREATE TABLE IF NOT EXISTS `transaksi_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transaksi_id` int NOT NULL,
  `urut` int DEFAULT '1',
  `jenis_barang` varchar(500) NOT NULL,
  `satuan` varchar(80) DEFAULT 'Unit',
  `kuantitas` decimal(12,2) DEFAULT '1.00',
  `harga_satuan` bigint DEFAULT '0',
  `harga_total` bigint DEFAULT '0',
  `harga_hps` bigint DEFAULT '0',
  `harga_penawaran` bigint DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_trx_item` (`transaksi_id`)
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table db_spj_proc.transaksi_item: ~38 rows (approximately)
INSERT INTO `transaksi_item` (`id`, `transaksi_id`, `urut`, `jenis_barang`, `satuan`, `kuantitas`, `harga_satuan`, `harga_total`, `harga_hps`, `harga_penawaran`) VALUES
	(1, 2, 1, 'Automatic Pressure Control Wasser PC-250 / Otomatis Pompa pendorong', 'Unit', 1.00, 790000, 790000, 0, 0),
	(2, 2, 2, 'Seal tape 1 inch', 'Pcs', 2.00, 11000, 22000, 0, 0),
	(3, 2, 3, 'Rucika SDL 1 x 3/4 inch', 'Pcs', 2.00, 7000, 14000, 0, 0),
	(4, 2, 4, 'Stopkran 1 inch', 'Pcs', 1.00, 45000, 45000, 0, 0),
	(5, 2, 5, 'Watermur 1 inch', 'Pcs', 1.00, 29000, 29000, 0, 0),
	(14, 3, 1, 'Printer Epson L121', 'Unit', 3.00, 2100000, 6300000, 0, 0),
	(15, 3, 2, 'Printer barcode zebra', 'Unit', 1.00, 750000, 750000, 0, 0),
	(17, 4, 1, 'Pelatihan PPI Dasar Bagi Tenaga Kesehatan di Fasyankes Angkatan III an. Sansavera Nur Fatimah, A.Md.Kep', 'Paket', 1.00, 1475000, 1475000, 0, 0),
	(21, 5, 1, 'Samsung Galaxy Tab A11 WiFi 4/64GB', 'Unit', 2.00, 3150000, 6300000, 0, 0),
	(30, 7, 1, 'PC', 'Unit', 10.00, 3900000, 39000000, 4000000, 4000000),
	(32, 12, 1, 'Pelatihan dialisis', 'Paket', 1.00, 10000000, 10000000, 10000000, 0),
	(35, 9, 1, 'Rapat Kerja Daerah (Rakerda) XXVI, Seminar dan Workshop ARSADA Jawa Tengah Tahun 2026 an. Setyana Tri Putra, Imas Wulandari, Fitria Purnamawati, Bekti Nugroho', 'Paket', 1.00, 10200000, 10200000, 10200000, 0),
	(43, 13, 1, 'Samsung A30', 'Unit', 2.00, 2500000, 5000000, 2, 0),
	(44, 15, 1, 'Tagihan Internet Halo Pascabayar 085210101086 Bulan Oktober 2026', 'Paket', 1.00, 133500, 133500, 133500, 0),
	(45, 19, 1, 'PC SET Build-up, Intel core i3 Gen 13, RAM 8GB DDR5, SSD 512GB', 'Set', 2.00, 14400000, 28800000, 14652000, 14500000),
	(46, 19, 2, 'InkTank Printer (Print Only, Resolusi 720x720 dpi, USB 2.0)', 'Unit', 8.00, 1950000, 15600000, 1999999, 1975000),
	(56, 21, 1, 'Kertas A5', 'Rim', 10.00, 100000, 1000000, 1, 0),
	(57, 21, 2, 'Boploin', 'Box', 5.00, 100000, 500000, 5, 0),
	(58, 21, 3, 'Tinta Printer', 'Botol', 3.00, 200000, 600000, 2, 0),
	(59, 22, 1, 'Kabel Listrik', 'Unit', 2.00, 1500000, 3000000, 1, 0),
	(72, 24, 1, 'PC', 'Unit', 1.00, 10000000, 10000000, 10000000, 0),
	(75, 25, 1, 'AC Split 1 PK Inverter Daikin Flash Inverter FTKQ25UVM4', 'Unit', 4.00, 6050000, 24200000, 6150000, 6100000),
	(76, 25, 2, 'AC Floor Standing 5 PK Daikin FVRN125BXV14', 'Unit', 2.00, 31250000, 62500000, 31850000, 31500000),
	(113, 26, 1, 'Kertas A4 Sinar Dunia', 'Unit', 2.00, 7300000, 14600000, 7500000, 7400000),
	(114, 26, 2, 'Kertas A4 Bola Bersinar', 'Unit', 2.00, 98000, 196000, 100000, 99000),
	(115, 26, 3, 'Bolpoin Snowman', 'Unit', 1.00, 95000, 95000, 100000, 97000),
	(116, 23, 1, 'PC', 'Unit', 1.00, 9900000, 9900000, 10000000, 9990000),
	(117, 23, 2, 'mouser', 'Unit', 10.00, 90000, 900000, 100000, 90000),
	(128, 27, 1, 'Itel VistaTab 30GT', 'Unit', 1.00, 0, 0, 0, 0),
	(129, 27, 2, 'Advan VX Neo', 'Unit', 4.00, 0, 0, 0, 0),
	(163, 31, 1, 'Kabel Listrik PLN', 'Unit', 1.00, 1100000, 1100000, 1, 0),
	(182, 32, 1, 'pelatihan', 'Unit', 1.00, 11900000, 11900000, 12000000, 11900000),
	(185, 34, 1, 'asdfasdfasdf', 'Unit', 1.00, 1000000, 1000000, 1, 0),
	(194, 35, 1, 'kabel listrik', 'Unit', 1.00, 10000000, 10000000, 10000000, 11000000),
	(225, 36, 1, 'barang pertama', 'Unit', 1.00, 51500000, 51500000, 52000000, 51900000),
	(226, 36, 2, 'barang kedua', 'Unit', 1.00, 28000000, 28000000, 30000000, 29000000),
	(227, 29, 1, 'Tablet Itel VistaTab 30GT Ram 8gb Internal 128gb 4G LTE', 'Unit', 1.00, 3700000, 3700000, 3800000, 3800000),
	(228, 29, 2, 'Tablet Advan VX Neo Ram 4gb Internal 128gb + 4G LTE', 'Unit', 4.00, 2500000, 10000000, 2600000, 2600000);

-- Dumping structure for table db_spj_proc.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nama` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staf',
  `aktif` tinyint NOT NULL DEFAULT '1',
  `pejabat_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table db_spj_proc.users: ~4 rows (approximately)
INSERT INTO `users` (`id`, `username`, `nama`, `password_hash`, `role`, `aktif`, `pejabat_id`) VALUES
	(1, 'admin', 'Administrator', '$2b$10$xuP/nSZoCuI1DKjFG61A4.UhFG.jr4Xhr9oIKjbCqji8fWBbJ7joC', 'admin', 1, NULL),
	(2, 'tulus', 'Tulus Wahyuno, A.Md', '$2b$10$O.X1TPQGToK9SMqQCX1swuUYFjMCVHR21pA5vHru1QWd3wPjZ.Ckm', 'pejabat_pengadaan', 1, 21),
	(3, 'superuser', 'Super User (Penguji Sistem)', '$2b$10$A3VFfnmJheW6iSmVBx4XeuBMnluh1ZbChvw4DSTHgdA6LF3xn92OW', 'superuser', 1, NULL),
	(4, 'pep', 'Tim PEP (Perencanaan & Evaluasi)', '$2b$10$76rkPUq78J.yN3UG5BiH2.YaS44q0rMIUnrmg.49AqIAPTaGRKVEe', 'pep', 1, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
