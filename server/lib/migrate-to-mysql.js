const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('--- Migrating SQLite to MySQL (Laragon: db_spj_proc) ---');
  
  // 1. Open SQLite
  const sqliteDb = new DatabaseSync(path.join(__dirname, '..', 'data', 'app.db'));
  
  // 2. Open MySQL
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_spj_proc',
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true,
  });

  const conn = await pool.getConnection();

  try {
    // 3. Create tables in MySQL
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        nama VARCHAR(150) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'staf',
        aktif TINYINT NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS pejabat (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(150) NOT NULL,
        nip VARCHAR(50) DEFAULT '',
        peran VARCHAR(50) NOT NULL,
        aktif TINYINT NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS rekening (
        id INT AUTO_INCREMENT PRIMARY KEY,
        kode VARCHAR(50) UNIQUE NOT NULL,
        uraian TEXT NOT NULL,
        pagu DOUBLE NOT NULL DEFAULT 0,
        realisasi_awal DOUBLE NOT NULL DEFAULT 0,
        ppkom_id INT DEFAULT NULL,
        pptk_id INT DEFAULT NULL,
        pengadaan_id INT DEFAULT NULL,
        FOREIGN KEY (ppkom_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (pptk_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (pengadaan_id) REFERENCES pejabat(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS transaksi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tanggal DATE NOT NULL,
        rekening_id INT NOT NULL,
        penyedia VARCHAR(255) NOT NULL,
        uraian TEXT NOT NULL,
        kotor DOUBLE NOT NULL,
        ppn_aktif TINYINT NOT NULL DEFAULT 0,
        pph_aktif TINYINT NOT NULL DEFAULT 0,
        ppn_tarif DOUBLE NOT NULL DEFAULT 11,
        pph_tarif DOUBLE NOT NULL DEFAULT 1.5,
        kategori VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        kpa_id INT DEFAULT NULL,
        ppkom_id INT DEFAULT NULL,
        pptk_id INT DEFAULT NULL,
        pengadaan_id INT DEFAULT NULL,
        bendahara_id INT DEFAULT NULL,
        verifikator_id INT DEFAULT NULL,
        dibuat_oleh INT DEFAULT NULL,
        dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_trx_rek (rekening_id),
        INDEX idx_trx_tgl (tanggal),
        FOREIGN KEY (rekening_id) REFERENCES rekening(id) ON DELETE CASCADE,
        FOREIGN KEY (kpa_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (ppkom_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (pptk_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (pengadaan_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (bendahara_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (verifikator_id) REFERENCES pejabat(id) ON DELETE SET NULL,
        FOREIGN KEY (dibuat_oleh) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS pengaturan (
        k VARCHAR(50) PRIMARY KEY,
        v TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Migrate users
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    for (const u of users) {
      await conn.query(
        'INSERT INTO users (id, username, nama, password_hash, role, aktif) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama=VALUES(nama), password_hash=VALUES(password_hash), role=VALUES(role), aktif=VALUES(aktif)',
        [u.id, u.username, u.nama, u.password_hash, u.role, u.aktif]
      );
    }
    console.log(`Migrated ${users.length} users`);

    // 5. Migrate pejabat
    const pejabat = sqliteDb.prepare('SELECT * FROM pejabat').all();
    for (const p of pejabat) {
      await conn.query(
        'INSERT INTO pejabat (id, nama, nip, peran, aktif) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE nama=VALUES(nama), nip=VALUES(nip), peran=VALUES(peran), aktif=VALUES(aktif)',
        [p.id, p.nama, p.nip || '', p.peran, p.aktif]
      );
    }
    console.log(`Migrated ${pejabat.length} pejabat`);

    // 6. Migrate rekening
    const rekening = sqliteDb.prepare('SELECT * FROM rekening').all();
    for (const r of rekening) {
      await conn.query(
        'INSERT INTO rekening (id, kode, uraian, pagu, realisasi_awal, ppkom_id, pptk_id, pengadaan_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE uraian=VALUES(uraian), pagu=VALUES(pagu), realisasi_awal=VALUES(realisasi_awal), ppkom_id=VALUES(ppkom_id), pptk_id=VALUES(pptk_id), pengadaan_id=VALUES(pengadaan_id)',
        [r.id, r.kode, r.uraian, r.pagu, r.realisasi_awal, r.ppkom_id || null, r.pptk_id || null, r.pengadaan_id || null]
      );
    }
    console.log(`Migrated ${rekening.length} rekening`);

    // 7. Migrate transaksi
    const transaksi = sqliteDb.prepare('SELECT * FROM transaksi').all();
    for (const t of transaksi) {
      await conn.query(
        'INSERT INTO transaksi (id, tanggal, rekening_id, penyedia, uraian, kotor, ppn_aktif, pph_aktif, ppn_tarif, pph_tarif, kategori, status, kpa_id, ppkom_id, pptk_id, pengadaan_id, bendahara_id, verifikator_id, dibuat_oleh, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE penyedia=VALUES(penyedia), uraian=VALUES(uraian), kotor=VALUES(kotor)',
        [
          t.id, t.tanggal, t.rekening_id, t.penyedia, t.uraian, t.kotor,
          t.ppn_aktif, t.pph_aktif, t.ppn_tarif, t.pph_tarif, t.kategori,
          t.status, t.kpa_id || null, t.ppkom_id || null, t.pptk_id || null,
          t.pengadaan_id || null, t.bendahara_id || null, t.verifikator_id || null,
          t.dibuat_oleh || null, t.dibuat_pada || null
        ]
      );
    }
    console.log(`Migrated ${transaksi.length} transaksi`);

    // 8. Migrate pengaturan
    const pengaturan = sqliteDb.prepare('SELECT * FROM pengaturan').all();
    for (const p of pengaturan) {
      await conn.query(
        'INSERT INTO pengaturan (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v=VALUES(v)',
        [p.k, p.v]
      );
    }
    console.log(`Migrated ${pengaturan.length} pengaturan`);

    console.log('✅ Migration to MySQL db_spj_proc completed successfully!');
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
