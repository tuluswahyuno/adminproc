// MySQL Database connection using mysql2/promise (Laragon)
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && !process.env[k.trim()]) process.env[k.trim()] = v.join('=').trim();
  }
}

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'db_spj_proc',
  waitForConnections: true,
  connectionLimit: 15,
  dateStrings: true,
};

const pool = mysql.createPool(DB_CONFIG);

const db = {
  pool,
  get: async (sql, params = []) => {
    const flat = Array.isArray(params) ? params : [params];
    const [rows] = await pool.query(sql, flat);
    return rows[0] || null;
  },
  all: async (sql, params = []) => {
    const flat = Array.isArray(params) ? params : [params];
    const [rows] = await pool.query(sql, flat);
    return rows;
  },
  run: async (sql, params = []) => {
    const flat = Array.isArray(params) ? params : [params];
    const [result] = await pool.query(sql, flat);
    return { lastInsertRowid: result.insertId, changes: result.affectedRows };
  },
  prepare: (sql) => ({
    get: async (...params) => {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const [rows] = await pool.query(sql, flat);
      return rows[0] || null;
    },
    all: async (...params) => {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const [rows] = await pool.query(sql, flat);
      return rows;
    },
    run: async (...params) => {
      const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const [result] = await pool.query(sql, flat);
      return { lastInsertRowid: result.insertId, changes: result.affectedRows };
    },
  }),
};

async function getSettings() {
  const [rows] = await pool.query('SELECT k, v FROM pengaturan');
  return Object.fromEntries(rows.map((r) => [r.k, r.v]));
}

async function addColIfMissing(table, col, def) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, col]
  );
  if (rows.length === 0) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${def}`);
  }
}

const INDUK_MAP = {
  '5.1.01.99.99.9999': 'Belanja Pegawai BLUD',
  '5.1.02.99.99.9999': 'Belanja Barang dan Jasa BLUD',
  '5.2.02.99.99.9999': 'Belanja Modal Peralatan dan Mesin BLUD',
  '5.2.03.99.99.9999': 'Belanja Modal Gedung dan Bangunan BLUD',
  '5.2.04.99.99.9999': 'Belanja Modal Jalan, Jaringan, dan Irigasi ( BLUD )',
};

async function migrateSchema() {
  // 1. Expand users.role to support 'pejabat_pengadaan' and link to pejabat_id
  await pool.query(`ALTER TABLE users MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'staf'`);
  await addColIfMissing('users', 'pejabat_id', 'INT NULL');

  // 2. Add jabatan & alamat to pejabat
  await addColIfMissing('pejabat', 'jabatan', "VARCHAR(255) DEFAULT ''");
  await addColIfMissing('pejabat', 'alamat', 'TEXT NULL');

  // Update known reference NIPs & Jabatan from sample PDFs if empty
  await pool.query(
    `UPDATE pejabat SET nip='19800402 200804 1 001', jabatan='Kepala Seksi Informasi dan Pemasaran', alamat='Jl. R Ngt Tjitrosantjoko No. 10 Gemolong' WHERE id=5 AND (nip='' OR nip IS NULL)`
  );
  await pool.query(
    `UPDATE pejabat SET nama='Tulus Wahyuno, A.Md', nip='1996011420201210007', jabatan='Pejabat Pengadaan' WHERE id=21 AND (nip='' OR nip IS NULL)`
  );
  await pool.query(
    `UPDATE pejabat SET jabatan='Direktur RSUD dr.Soeratno Gemolong', alamat='Jl. R Ngt Tjitrosantjoko No. 10 Gemolong' WHERE peran='KPA' AND (jabatan='' OR jabatan IS NULL)`
  );

  // Seed Pengurus Barang from 4. BAPHP.pdf if not exists
  const [pbRows] = await pool.query(`SELECT id FROM pejabat WHERE peran='PENGURUS_BARANG'`);
  let pengurusId = pbRows[0]?.id || null;
  if (!pengurusId) {
    const [ins] = await pool.query(
      `INSERT INTO pejabat(nama, nip, peran, jabatan, alamat, aktif) VALUES('Rajendra Prima Ariyanto, S.K.M', '19830815 202321 1 003', 'PENGURUS_BARANG', 'Pengurus Barang', 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', 1)`
    );
    pengurusId = ins.insertId;
  }
  await pool.query(`INSERT IGNORE INTO pengaturan(k,v) VALUES('pengurus_barang_id', ?)`, [String(pengurusId)]);

  // Deduplikasi otomatis data Pejabat & Tim (mis. Tulus Wahyuno, A.Md vs Tulus Wahyuno, AMd; Nunung Agus Dwi Haryanto, dll)
  const normPejabatKey = (nama = '') => {
    let s = String(nama || '').toLowerCase();
    // Ambil nama depan sebelum gelar koma atau gelar umum
    s = s.replace(/^(dr\.|drg\.|ir\.|h\.|hj\.)\s*/gi, '');
    s = s.split(',')[0];
    s = s.replace(/\b(amd|a\.md|skm|s\.k\.m|s\.kep|ns|m\.kep|m\.si|se|s\.e|m\.eng|s\.kom|apt|s\.farm|s\.st|amte|sp\.n|m\.pd|ked)\b/gi, '');
    s = s.replace(/[^a-z0-9]/g, '');
    return s;
  };

  const mergePejabatPair = async (keepId, dupId, canonicalNama) => {
    if (!keepId || !dupId || keepId === dupId) return;
    await pool.query(`UPDATE rekening SET pengadaan_id=? WHERE pengadaan_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE rekening SET ppkom_id=? WHERE ppkom_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE rekening SET pptk_id=? WHERE pptk_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET pengadaan_id=? WHERE pengadaan_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET ppkom_id=? WHERE ppkom_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET pptk_id=? WHERE pptk_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET kpa_id=? WHERE kpa_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET bendahara_id=? WHERE bendahara_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET verifikator_id=? WHERE verifikator_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE transaksi SET pengurus_barang_id=? WHERE pengurus_barang_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE users SET pejabat_id=? WHERE pejabat_id=?`, [keepId, dupId]);
    await pool.query(`UPDATE pengaturan SET v=? WHERE v=? AND k LIKE '%_id'`, [String(keepId), String(dupId)]);
    if (canonicalNama) {
      await pool.query(`UPDATE pejabat SET nama=? WHERE id=?`, [canonicalNama, keepId]);
    }
    await pool.query(`DELETE FROM pejabat WHERE id=?`, [dupId]);
  };

  // Pastikan penggabungan eksplisit untuk duplikat yang terdeteksi dari import Excel sebelumnya
  // 1) Tulus Wahyuno (id 26 -> digabung ke id 21 'Tulus Wahyuno, A.Md')
  const [tulusRows] = await pool.query(`SELECT id, nama, nip FROM pejabat WHERE peran='PENGADAAN' AND LOWER(nama) LIKE '%tulus wahyuno%' ORDER BY id ASC`);
  if (tulusRows.length > 1) {
    const keep = tulusRows[0];
    for (let i = 1; i < tulusRows.length; i++) {
      await mergePejabatPair(keep.id, tulusRows[i].id, 'Tulus Wahyuno, A.Md');
    }
  }
  // 2) Nunung Agus Dwi Haryanto (id 20 & 25 -> digabung ke id 4 'Nunung Agus Dwi Haryanto, SE, M.Si')
  const [nunungRows] = await pool.query(`SELECT id, nama, nip FROM pejabat WHERE peran='PPTK' AND LOWER(nama) LIKE '%nunung agus dwi%' ORDER BY id ASC`);
  if (nunungRows.length > 1) {
    const keep = nunungRows[0];
    for (let i = 1; i < nunungRows.length; i++) {
      await mergePejabatPair(keep.id, nunungRows[i].id, 'Nunung Agus Dwi Haryanto, SE, M.Si');
    }
  }
  // 3) Deduplikasi umum bila ada pejabat dengan peran sama & nama ternormalisasi identik
  const [allPej] = await pool.query(`SELECT * FROM pejabat ORDER BY id ASC`);
  const seenPej = new Map();
  for (const p of allPej) {
    const key = `${p.peran}::${normPejabatKey(p.nama)}`;
    if (!normPejabatKey(p.nama)) continue;
    if (seenPej.has(key)) {
      const keep = seenPej.get(key);
      if (!keep.nip && p.nip) {
        await pool.query(`UPDATE pejabat SET nip=? WHERE id=?`, [p.nip, keep.id]);
      }
      await mergePejabatPair(keep.id, p.id, null);
    } else {
      seenPej.set(key, p);
    }
  }

  // Seed default Pejabat Pengadaan, Super User, and PEP login users if not exists
  const bcrypt = require('bcryptjs');
  const [tulusPej] = await pool.query(`SELECT id FROM pejabat WHERE peran='PENGADAAN' AND LOWER(nama) LIKE '%tulus wahyuno%' LIMIT 1`);
  const tulusPejId = tulusPej[0]?.id || 21;
  const [uRows] = await pool.query(`SELECT id FROM users WHERE username='tulus'`);
  if (uRows.length === 0) {
    await pool.query(
      `INSERT INTO users(username, nama, password_hash, role, aktif, pejabat_id) VALUES('tulus', 'Tulus Wahyuno, A.Md', ?, 'pejabat_pengadaan', 1, ?)`,
      [bcrypt.hashSync('123456', 10), tulusPejId]
    );
  } else {
    await pool.query(`UPDATE users SET pejabat_id=?, nama='Tulus Wahyuno, A.Md' WHERE username='tulus'`, [tulusPejId]);
  }
  const [suRows] = await pool.query(`SELECT id FROM users WHERE username='superuser'`);
  if (suRows.length === 0) {
    await pool.query(
      `INSERT INTO users(username, nama, password_hash, role, aktif, pejabat_id) VALUES('superuser', 'Super User (Penguji Sistem)', ?, 'superuser', 1, NULL)`,
      [bcrypt.hashSync('123456', 10)]
    );
  }
  const [pepRows] = await pool.query(`SELECT id FROM users WHERE username='pep'`);
  if (pepRows.length === 0) {
    await pool.query(
      `INSERT INTO users(username, nama, password_hash, role, aktif, pejabat_id) VALUES('pep', 'Tim PEP (Perencanaan & Evaluasi)', ?, 'pep', 1, NULL)`,
      [bcrypt.hashSync('123456', 10)]
    );
  }

  // 3. Create penyedia table & add npwp
  await pool.query(`
    CREATE TABLE IF NOT EXISTS penyedia (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      pimpinan VARCHAR(255) DEFAULT '',
      jabatan VARCHAR(100) DEFAULT 'Direktur',
      alamat TEXT,
      npwp VARCHAR(100) DEFAULT '',
      aktif TINYINT DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await addColIfMissing('penyedia', 'npwp', "VARCHAR(100) DEFAULT ''");

  const [pCount] = await pool.query(`SELECT COUNT(*) AS c FROM penyedia`);
  if (pCount[0].c === 0) {
    await pool.query(
      `INSERT INTO penyedia (nama, pimpinan, jabatan, alamat, npwp) VALUES
       ('CV. Surya Globe', 'Sigit Gunawan', 'Direktur', 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta', '01.234.567.8-526.000'),
       ('PT. Telkom Indonesia', 'Pimpinan Cabang', 'Kepala Kantor Daerah', 'Jl. Mayor Kusmanto, Sragen', '01.000.013.1-093.000'),
       ('RSUD dr Adhyatma MPH (RSUD Tugurejo)', 'Direktur RSUD', 'Direktur', 'Jl. Walisongo No. 137, Tambakaji, Ngaliyan, Kota Semarang, Provinsi Jawa Tengah', '')`
    );
  }

  // 4. Add induk columns to rekening
  await addColIfMissing('rekening', 'induk_kode', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('rekening', 'induk_uraian', "VARCHAR(255) DEFAULT ''");
  await addColIfMissing('rekening', 'no_urut', 'INT DEFAULT 0');

  const [rekRows] = await pool.query(`SELECT id, kode, induk_kode, induk_uraian, no_urut FROM rekening`);
  for (const r of rekRows) {
    const parts = String(r.kode || '').split('.');
    if (parts.length >= 7 && (!r.induk_kode || !r.induk_uraian || !r.no_urut)) {
      const ik = parts.slice(0, 6).join('.');
      const iu = INDUK_MAP[ik] || 'Belanja BLUD';
      const nu = parseInt(parts[6], 10) || 0;
      await pool.query(`UPDATE rekening SET induk_kode=?, induk_uraian=?, no_urut=? WHERE id=?`, [ik, iu, nu, r.id]);
    }
  }

  // 5. Add SP, BAST, BAPHP, SPEKTEK, HPS, BA KLARIFIKASI & tahap columns to transaksi
  await addColIfMissing('transaksi', 'tahap', "VARCHAR(30) DEFAULT 'pesanan'");
  await addColIfMissing('transaksi', 'mode_pengadaan', "VARCHAR(30) DEFAULT '0_10'");
  await addColIfMissing('transaksi', 'sp_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'sp_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'sp_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'sp_tgl_kirim', 'DATE NULL');
  await addColIfMissing('transaksi', 'bast_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'bast_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'bast_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'baphp_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'baphp_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'baphp_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'spektek_json', 'LONGTEXT NULL');
  await addColIfMissing('transaksi', 'hps_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'hps_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'hps_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'hps_total', 'BIGINT DEFAULT 0');
  await addColIfMissing('transaksi', 'bakn_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'bakn_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'bakn_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'penawaran_total', 'BIGINT DEFAULT 0');
  await addColIfMissing('transaksi', 'bakn_hasil_teknis', "VARCHAR(255) DEFAULT 'Sesuai - Ada Perubahan'");
  await addColIfMissing('transaksi', 'pl_json', 'LONGTEXT NULL');
  await addColIfMissing('transaksi', 'spk_no_urut', "VARCHAR(50) DEFAULT ''");
  await addColIfMissing('transaksi', 'spk_nomor', "VARCHAR(120) DEFAULT ''");
  await addColIfMissing('transaksi', 'spk_tanggal', 'DATE NULL');
  await addColIfMissing('transaksi', 'pengurus_barang_id', 'INT NULL');
  await addColIfMissing('transaksi', 'penyedia_id', 'INT NULL');
  await addColIfMissing('transaksi', 'penyedia_pimpinan', "VARCHAR(255) DEFAULT ''");
  await addColIfMissing('transaksi', 'penyedia_jabatan', "VARCHAR(100) DEFAULT 'Direktur'");
  await addColIfMissing('transaksi', 'penyedia_alamat', 'TEXT NULL');
  await addColIfMissing('transaksi', 'penyedia_npwp', "VARCHAR(100) DEFAULT ''");
  await addColIfMissing('transaksi', 'ppk_jabatan', "VARCHAR(255) DEFAULT ''");
  await addColIfMissing('transaksi', 'ppk_alamat', "VARCHAR(255) DEFAULT 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'");

  // 6. Create transaksi_item table & add harga_hps / harga_penawaran
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transaksi_item (
      id INT AUTO_INCREMENT PRIMARY KEY,
      transaksi_id INT NOT NULL,
      urut INT DEFAULT 1,
      jenis_barang VARCHAR(500) NOT NULL,
      satuan VARCHAR(80) DEFAULT 'Unit',
      kuantitas DECIMAL(12,2) DEFAULT 1,
      harga_hps BIGINT DEFAULT 0,
      harga_penawaran BIGINT DEFAULT 0,
      harga_satuan BIGINT DEFAULT 0,
      harga_total BIGINT DEFAULT 0,
      INDEX idx_trx_item (transaksi_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await addColIfMissing('transaksi_item', 'harga_hps', 'BIGINT DEFAULT 0');
  await addColIfMissing('transaksi_item', 'harga_penawaran', 'BIGINT DEFAULT 0');
}

module.exports = { db, pool, getSettings, migrateSchema, DB_CONFIG, INDUK_MAP };
