const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { db, getSettings, migrateSchema, INDUK_MAP } = require('./lib/db');
const { kategori, KATEGORI, hitungPajak } = require('./lib/util');
const { buatDokumen } = require('./lib/docs');
const { importRealisasi, listSheets, generateTemplateExcel } = require('./lib/import');

const PORT = process.env.PORT || 3001;
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });
const secretFile = path.join(dataDir, 'secret.key');
if (!fs.existsSync(secretFile)) fs.writeFileSync(secretFile, crypto.randomBytes(32).toString('hex'));
const SECRET = process.env.APP_SECRET || fs.readFileSync(secretFile, 'utf8');

const app = express();
app.use(express.json({ limit: '2mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } });

/* ---------- sesi (cookie bertanda tangan HMAC) ---------- */
const sign = (p) => {
  const b = Buffer.from(JSON.stringify(p)).toString('base64url');
  return b + '.' + crypto.createHmac('sha256', SECRET).update(b).digest('base64url');
};
function verify(tok) {
  if (!tok) return null;
  const [b, s] = tok.split('.');
  const ok = s && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(crypto.createHmac('sha256', SECRET).update(b).digest('base64url')));
  if (!ok) return null;
  const p = JSON.parse(Buffer.from(b, 'base64url').toString());
  return p.exp > Date.now() ? p : null;
}
const cookie = (req, n) => (req.headers.cookie || '').split(';').map((c) => c.trim().split('=')).find(([k]) => k === n)?.[1];
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch((e) => {
  console.error(e);
  res.status(500).json({ error: e.message });
});

async function auth(req, res, next) {
  try {
    const p = verify(cookie(req, 'sid'));
    const u = p && await db.prepare(`
      SELECT u.id, u.username, u.nama, u.role, u.pejabat_id, p.peran AS pejabat_peran
      FROM users u
      LEFT JOIN pejabat p ON p.id = u.pejabat_id
      WHERE u.id=? AND u.aktif=1
    `).get(p.id);
    if (!u) return res.status(401).json({ error: 'Belum masuk' });
    u.is_super = !!(p.super_id || u.role === 'superuser' || u.role === 'admin');
    u.super_id = p.super_id || (u.is_super ? u.id : null);
    if (p.act_role && u.is_super) u.role = p.act_role;
    req.user = u;
    next();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
const admin = (req, res, next) => (['admin', 'superuser'].includes(req.user.role) || req.user.is_super ? next() : res.status(403).json({ error: 'Hanya admin / superuser' }));
const adminOrPep = (req, res, next) => (['admin', 'superuser', 'pep'].includes(req.user.role) || req.user.is_super ? next() : res.status(403).json({ error: 'Hanya Admin / PEP / Super User' }));
const validRole = (r) => (['admin', 'superuser', 'pep', 'staf', 'pejabat_pengadaan'].includes(r) ? r : 'staf');

app.post('/api/login', wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const u = await db.prepare(`
    SELECT u.*, p.peran AS pejabat_peran
    FROM users u
    LEFT JOIN pejabat p ON p.id = u.pejabat_id
    WHERE u.username=? AND u.aktif=1
  `).get(String(username || ''));
  if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) return res.status(401).json({ error: 'Username atau password salah' });
  const isSuper = u.role === 'superuser' || u.role === 'admin';
  const tok = sign({ id: u.id, super_id: isSuper ? u.id : null, exp: Date.now() + 12 * 3600e3 });
  res.setHeader('Set-Cookie', `sid=${tok}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${12 * 3600}`);
  res.json({ id: u.id, username: u.username, nama: u.nama, role: u.role, pejabat_id: u.pejabat_id, pejabat_peran: u.pejabat_peran, is_super: isSuper, super_id: isSuper ? u.id : null });
}));
app.post('/api/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'sid=; HttpOnly; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.use('/api', auth);
app.get('/api/me', (req, res) => res.json(req.user));

/* ---------- Super User: Pindah User & Coba Semua Role ---------- */
app.get('/api/superuser/options', wrap(async (req, res) => {
  if (!req.user.is_super) return res.status(403).json({ error: 'Hanya Super User' });
  const users = await db.prepare(`
    SELECT u.id, u.username, u.nama, u.role, u.pejabat_id, p.peran AS pejabat_peran, p.nip AS pejabat_nip
    FROM users u
    LEFT JOIN pejabat p ON p.id = u.pejabat_id
    WHERE u.aktif = 1
    ORDER BY u.id
  `).all();
  const pejabat = await db.prepare(`SELECT id, nama, nip, peran, jabatan FROM pejabat WHERE aktif=1 ORDER BY peran, nama`).all();
  res.json({ users, pejabat });
}));

app.post('/api/superuser/switch', wrap(async (req, res) => {
  if (!req.user.is_super) return res.status(403).json({ error: 'Hanya Super User' });
  const { user_id, pejabat_id, act_role } = req.body || {};
  const superId = req.user.super_id || req.user.id;

  let targetUserId = user_id ? Number(user_id) : null;
  if (!targetUserId && pejabat_id) {
    const p = await db.prepare('SELECT * FROM pejabat WHERE id=?').get(Number(pejabat_id));
    if (!p) return res.status(404).json({ error: 'Pejabat tidak ditemukan' });
    let ex = await db.prepare('SELECT * FROM users WHERE pejabat_id=?').get(p.id);
    if (!ex) {
      const uname = p.nama.split(',')[0].replace(/^(dr\.|drg\.|ir\.|h\.|hj\.)\s*/i, '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '') || `pejabat.${p.id}`;
      const defRole = p.peran === 'PENGADAAN' ? 'pejabat_pengadaan' : p.peran === 'KPA' ? 'admin' : 'staf';
      try {
        const ins = await db.prepare('INSERT INTO users(username,nama,password_hash,role,pejabat_id,aktif) VALUES(?,?,?,?,?,1)')
          .run(uname, p.nama, bcrypt.hashSync('123456', 10), defRole, p.id);
        targetUserId = Number(ins.lastInsertRowid);
      } catch {
        const ins = await db.prepare('INSERT INTO users(username,nama,password_hash,role,pejabat_id,aktif) VALUES(?,?,?,?,?,1)')
          .run(`${uname}.${p.id}`, p.nama, bcrypt.hashSync('123456', 10), defRole, p.id);
        targetUserId = Number(ins.lastInsertRowid);
      }
    } else {
      targetUserId = ex.id;
    }
  }
  if (!targetUserId) targetUserId = superId;

  const tok = sign({
    id: targetUserId,
    super_id: superId,
    act_role: act_role || null,
    exp: Date.now() + 12 * 3600e3,
  });
  res.setHeader('Set-Cookie', `sid=${tok}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${12 * 3600}`);
  const u = await db.prepare(`
    SELECT u.id, u.username, u.nama, u.role, u.pejabat_id, p.peran AS pejabat_peran
    FROM users u
    LEFT JOIN pejabat p ON p.id = u.pejabat_id
    WHERE u.id=?
  `).get(targetUserId);
  if (act_role) u.role = act_role;
  u.is_super = true;
  u.super_id = superId;
  res.json(u);
}));

app.post('/api/password', wrap(async (req, res) => {
  const { lama, baru } = req.body || {};
  const u = await db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!bcrypt.compareSync(String(lama || ''), u.password_hash)) return res.status(400).json({ error: 'Password lama salah' });
  if (String(baru || '').length < 6) return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
  await db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(baru, 10), u.id);
  res.json({ ok: true });
}));

/* ---------- pengguna (admin / superuser) ---------- */
app.get('/api/users', admin, wrap(async (req, res) => {
  const rows = await db.prepare(`
    SELECT u.id, u.username, u.nama, u.role, u.pejabat_id, u.aktif,
           p.nama AS pejabat_nama, p.nip AS pejabat_nip, p.peran AS pejabat_peran, p.jabatan AS pejabat_jabatan
    FROM users u
    LEFT JOIN pejabat p ON p.id = u.pejabat_id
    ORDER BY u.id
  `).all();
  res.json(rows);
}));
app.post('/api/users', admin, wrap(async (req, res) => {
  const { username, nama, password, role, pejabat_id } = req.body || {};
  if (!username?.trim() || !nama?.trim() || !password) return res.status(400).json({ error: 'Username, nama, dan password wajib diisi' });
  try {
    const r = await db.prepare('INSERT INTO users(username,nama,password_hash,role,pejabat_id) VALUES(?,?,?,?,?)')
      .run(username.trim(), nama.trim(), bcrypt.hashSync(String(password), 10), validRole(role), pejabat_id ? Number(pejabat_id) : null);
    res.json({ id: Number(r.lastInsertRowid) });
  } catch {
    res.status(400).json({ error: 'Username sudah dipakai' });
  }
}));
app.put('/api/users/:id', admin, wrap(async (req, res) => {
  const { username, nama, role, aktif = 1, password, pejabat_id } = req.body || {};
  try {
    if (username?.trim()) {
      await db.prepare('UPDATE users SET username=?, nama=?, role=?, pejabat_id=?, aktif=? WHERE id=?')
        .run(username.trim(), nama.trim(), validRole(role), pejabat_id ? Number(pejabat_id) : null, aktif ? 1 : 0, req.params.id);
    } else {
      await db.prepare('UPDATE users SET nama=?, role=?, pejabat_id=?, aktif=? WHERE id=?')
        .run(nama, validRole(role), pejabat_id ? Number(pejabat_id) : null, aktif ? 1 : 0, req.params.id);
    }
    if (password) await db.prepare('UPDATE users SET password_hash=? WHERE id=?').run(bcrypt.hashSync(String(password), 10), req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Username sudah dipakai oleh akun lain' });
  }
}));
app.delete('/api/users/:id', admin, wrap(async (req, res) => {
  if (Number(req.params.id) === Number(req.user.id)) return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
  try {
    await db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Pengguna sudah memiliki riwayat transaksi, nonaktifkan saja' });
  }
}));

/* ---------- pengaturan ---------- */
app.get('/api/pengaturan', wrap(async (req, res) => {
  const s = await getSettings();
  res.json({ ...s, kategori: KATEGORI });
}));
app.put('/api/pengaturan', adminOrPep, wrap(async (req, res) => {
  const s = await getSettings();
  for (const [k, v] of Object.entries(req.body || {})) {
    if (k in s) {
      await db.prepare('INSERT INTO pengaturan(k,v) VALUES(?,?) ON DUPLICATE KEY UPDATE v=VALUES(v)').run(k, String(v ?? ''));
    }
  }
  res.json(await getSettings());
}));

/* ---------- tahun anggaran (daftar tahun <= tahun berjalan) ---------- */
app.get('/api/tahun-list', wrap(async (req, res) => {
  const s = await getSettings();
  const maxYear = new Date().getFullYear();
  const tahunAktif = String(s.tahun && Number(s.tahun) <= maxYear ? s.tahun : maxYear);
  const rows = await db.prepare(`SELECT DISTINCT SUBSTR(COALESCE(sp_tanggal, tanggal), 1, 4) AS th FROM transaksi WHERE COALESCE(sp_tanggal, tanggal) IS NOT NULL`).all();
  const setTh = new Set([tahunAktif, String(maxYear), '2026', '2025']);
  for (const r of rows) {
    if (r.th && /^\d{4}$/.test(r.th) && Number(r.th) <= maxYear) {
      setTh.add(r.th);
    }
  }
  const list = Array.from(setTh)
    .filter((th) => Number(th) <= maxYear)
    .sort((a, b) => b.localeCompare(a));
  res.json({ tahunAktif, list });
}));

/* ---------- pejabat ---------- */
app.get('/api/pejabat', wrap(async (req, res) => {
  const rows = await db.prepare('SELECT * FROM pejabat ORDER BY peran, nama').all();
  res.json(rows);
}));
app.post('/api/pejabat', wrap(async (req, res) => {
  const { nama, nip = '', peran, jabatan = '', alamat = '' } = req.body;
  if (!nama || !peran) return res.status(400).json({ error: 'Nama & peran wajib' });
  const r = await db.prepare('INSERT INTO pejabat(nama,nip,peran,jabatan,alamat) VALUES(?,?,?,?,?)').run(nama, nip, peran, jabatan, alamat);
  res.json({ id: Number(r.lastInsertRowid) });
}));
app.put('/api/pejabat/:id', wrap(async (req, res) => {
  const { nama, nip = '', peran, jabatan = '', alamat = '', aktif = 1 } = req.body;
  await db.prepare('UPDATE pejabat SET nama=?,nip=?,peran=?,jabatan=?,alamat=?,aktif=? WHERE id=?')
    .run(nama, nip, peran, jabatan, alamat, aktif ? 1 : 0, req.params.id);
  res.json({ ok: true });
}));
app.delete('/api/pejabat/:id', adminOrPep, wrap(async (req, res) => {
  try {
    await db.prepare('DELETE FROM pejabat WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Pejabat masih dipakai, nonaktifkan saja' });
  }
}));

/* ---------- penyedia (master vendor) ---------- */
app.get('/api/penyedia', wrap(async (req, res) => {
  const all = req.query.all === '1';
  const rows = await db.prepare(`SELECT * FROM penyedia ${all ? '' : 'WHERE aktif=1'} ORDER BY nama`).all();
  res.json(rows);
}));
app.post('/api/penyedia', wrap(async (req, res) => {
  const { nama, pimpinan = '', jabatan = 'Direktur', alamat = '', npwp = '' } = req.body || {};
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama penyedia/CV wajib' });
  const r = await db.prepare('INSERT INTO penyedia(nama,pimpinan,jabatan,alamat,npwp) VALUES(?,?,?,?,?)')
    .run(nama.trim(), pimpinan.trim(), jabatan.trim() || 'Direktur', alamat.trim(), npwp.trim());
  res.json({ id: Number(r.lastInsertRowid) });
}));
app.put('/api/penyedia/:id', wrap(async (req, res) => {
  const { nama, pimpinan = '', jabatan = 'Direktur', alamat = '', npwp = '', aktif = 1 } = req.body || {};
  await db.prepare('UPDATE penyedia SET nama=?,pimpinan=?,jabatan=?,alamat=?,npwp=?,aktif=? WHERE id=?')
    .run(nama, pimpinan, jabatan, alamat, npwp, aktif ? 1 : 0, req.params.id);
  res.json({ ok: true });
}));
app.delete('/api/penyedia/:id', wrap(async (req, res) => {
  await db.prepare('DELETE FROM penyedia WHERE id=?').run(req.params.id);
  res.json({ ok: true });
}));

/* ---------- penomoran otomatis HPS, BAKN, SP, BAST & BAPHP ---------- */
app.get('/api/penomoran/next', wrap(async (req, res) => {
  const s = await getSettings();
  const tahun = req.query.tahun || s.tahun || String(new Date().getFullYear());
  const rows = await db.prepare('SELECT hps_no_urut, bakn_no_urut, sp_no_urut, bast_no_urut, spk_no_urut FROM transaksi WHERE SUBSTR(COALESCE(sp_tanggal, tanggal),1,4)=?').all(tahun);
  let maxHps = 1285;
  let maxSp = 1606;
  let maxBast = 1630;
  let maxUndangan = 2435;
  let maxPembukaan = 2572;
  let maxPenetapan = 2655;
  let maxSppbj = 1768;
  let maxSpk = 2672;
  for (const r of rows) {
    const nHps = parseInt(r.hps_no_urut, 10);
    if (!Number.isNaN(nHps) && nHps > maxHps) maxHps = nHps;
    const nSp = parseInt(r.sp_no_urut, 10);
    if (!Number.isNaN(nSp) && nSp > maxSp) maxSp = nSp;
    const nBast = parseInt(r.bast_no_urut, 10);
    if (!Number.isNaN(nBast) && nBast > maxBast) maxBast = nBast;
    const nSpk = parseInt(r.spk_no_urut, 10);
    if (!Number.isNaN(nSpk) && nSpk > maxSpk) maxSpk = nSpk;
  }
  const nextHps = String(maxHps + 1);
  const nextSp = String(maxSp + 1);
  const nextBakn = `${nextSp}.a`;
  const nextBast = String(maxBast + 1);
  const nextBaphp = `${nextBast}.a`;
  const nextUndanganPl = String(maxUndangan + 1);
  const nextPembukaan = String(maxPembukaan + 1);
  const nextPenetapan = String(maxPenetapan + 1);
  const nextSppbj = String(maxSppbj + 1);
  const nextSpk = String(maxSpk + 1);
  res.json({
    tahun,
    prefix: '000.3.2',
    kodeBagian: '05.1.2',
    nextHps,
    nextBakn,
    nextSp,
    nextBast,
    nextBaphp,
    nextUndanganPl,
    nextPembukaan,
    nextPenetapan,
    nextSppbj,
    nextSpk,
    formatHps: `000.3.2/${nextHps}/05.1.2/${tahun}`,
    formatBakn: `000.3.2/${nextBakn}/05.1.2/${tahun}`,
    formatSp: `000.3.2/${nextSp}/05.1.2/${tahun}`,
    formatBast: `000.3.2/${nextBast}/05.1.2/${tahun}`,
    formatBaphp: `000.3.2/${nextBaphp}/05.1.2/${tahun}`,
    formatUndanganPl: `000.3.2/${nextUndanganPl}/05.1.2/${tahun}`,
    formatPembukaan: `000.3.2/${nextPembukaan}.b/05.1.2/${tahun}`,
    formatEvaluasi: `000.3.2/${nextPembukaan}.c/05.1.2/${tahun}`,
    formatUndKlarifikasi: `000.3.2/${parseInt(nextPembukaan, 10) + 5}.a/05.1.2/${tahun}`,
    formatPenetapan: `000.3.2/${nextPenetapan}/05.1.2/${tahun}`,
    formatBahpl: `000.3.2/${nextPenetapan}.a/05.1.2/${tahun}`,
    formatPengumuman: `000.3.2/${nextPenetapan}.b/05.1.2/${tahun}`,
    formatLaporan: `000.3.2/${parseInt(nextPenetapan, 10) + 1}/05.1.2/${tahun}`,
    formatSppbj: `000.3.2/${nextSppbj}/05.1.2/${tahun}`,
    formatSpk: `000.3.2/${nextSpk}/05.1.2/${tahun}`,
    formatSpkLampiran: `000.3.2/${nextSpk}.a/05.1.2/${tahun}`,
  });
}));

/* ---------- rekening ---------- */
const withSisa = (r) => ({ ...r, sisa: r.pagu - r.realisasi, capaian: r.pagu ? (r.realisasi / r.pagu) * 100 : 0 });

function parseIndukFromKode(kode, indukKodeIn, indukUraianIn, noUrutIn) {
  const parts = String(kode || '').trim().split('.');
  const ik = indukKodeIn || (parts.length >= 6 ? parts.slice(0, 6).join('.') : '5.1.02.99.99.9999');
  const iu = indukUraianIn || INDUK_MAP[ik] || 'Belanja BLUD';
  const nu = Number(noUrutIn) || (parts.length >= 7 ? parseInt(parts[6], 10) || 0 : 0);
  return { ik, iu, nu };
}

app.get('/api/rekening', wrap(async (req, res) => {
  const q = `%${(req.query.q || '').toString().toLowerCase()}%`;
  const tahun = req.query.tahun || '';
  const diampu = req.query.diampu === '1';

  const w = ['(lower(r.kode) LIKE ? OR lower(r.uraian) LIKE ? OR lower(r.induk_uraian) LIKE ?)'];
  const p = [q, q, q];

  // Tugas 3: Ketika memilih Kode Rekening saat membuat SPJ, hanya tampilkan yang diampu oleh Pejabat (PP, PPK, PPTK) yang sedang login
  if (diampu) {
    const isFullRole = ['admin', 'superuser', 'pep'].includes(req.user.role);
    if (!isFullRole && req.user.pejabat_id) {
      const pid = Number(req.user.pejabat_id);
      w.push('(r.pengadaan_id = ? OR r.ppkom_id = ? OR r.pptk_id = ?)');
      p.push(pid, pid, pid);
    }
  }

  const trxFilter = tahun && tahun !== 'semua' ? `AND SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,4) = ${db.pool.escape(tahun)}` : '';
  const sql = `
    SELECT r.*,
      r.realisasi_awal + COALESCE((SELECT SUM(kotor) FROM transaksi t WHERE t.rekening_id=r.id ${trxFilter}), 0) AS realisasi
    FROM rekening r
    WHERE ${w.join(' AND ')}
    ORDER BY r.induk_kode, r.no_urut, r.kode
  `;
  const rows = await db.prepare(sql).all(...p);
  res.json(rows.map(withSisa));
}));

app.post('/api/rekening', adminOrPep, wrap(async (req, res) => {
  const { kode, uraian, pagu = 0, induk_kode, induk_uraian, no_urut, ppkom_id, pptk_id, pengadaan_id } = req.body;
  if (!kode || !uraian) return res.status(400).json({ error: 'Kode & uraian wajib' });
  const { ik, iu, nu } = parseIndukFromKode(kode, induk_kode, induk_uraian, no_urut);
  try {
    const r = await db.prepare('INSERT INTO rekening(kode,induk_kode,induk_uraian,no_urut,uraian,pagu,ppkom_id,pptk_id,pengadaan_id) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(kode.trim(), ik, iu, nu, uraian.trim(), +pagu, ppkom_id || null, pptk_id || null, pengadaan_id || null);
    res.json({ id: Number(r.lastInsertRowid) });
  } catch {
    res.status(400).json({ error: 'Kode rekening sudah ada' });
  }
}));
app.put('/api/rekening/:id', adminOrPep, wrap(async (req, res) => {
  const { kode, uraian, pagu, realisasi_awal, induk_kode, induk_uraian, no_urut, ppkom_id, pptk_id, pengadaan_id } = req.body;
  const { ik, iu, nu } = parseIndukFromKode(kode, induk_kode, induk_uraian, no_urut);
  try {
    await db.prepare('UPDATE rekening SET kode=?,induk_kode=?,induk_uraian=?,no_urut=?,uraian=?,pagu=?,realisasi_awal=?,ppkom_id=?,pptk_id=?,pengadaan_id=? WHERE id=?')
      .run(kode, ik, iu, nu, uraian, +pagu || 0, +realisasi_awal || 0, ppkom_id || null, pptk_id || null, pengadaan_id || null, req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Kode rekening sudah ada' });
  }
}));
app.delete('/api/rekening/:id', adminOrPep, wrap(async (req, res) => {
  try {
    await db.prepare('DELETE FROM rekening WHERE id=?').run(req.params.id);
    res.json({ ok: true });
  } catch {
    res.status(400).json({ error: 'Rekening sudah dipakai transaksi' });
  }
}));

/* ---------- Impor & Template Excel Kode Rekening (PEP / Admin / Superuser) ---------- */
app.get('/api/import/template', wrap(async (req, res) => {
  const s = await getSettings();
  const tahun = req.query.tahun || s.tahun || '2026';
  const buf = await generateTemplateExcel(tahun);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Template_Kode_Rekening_dan_Pejabat_BLUD_${tahun}.xlsx"`);
  res.send(Buffer.from(buf));
}));
app.post('/api/import/sheets', adminOrPep, upload.single('file'), wrap(async (req, res) => res.json(await listSheets(req.file.buffer))));
app.post('/api/import/realisasi', adminOrPep, upload.single('file'), wrap(async (req, res) => {
  try {
    res.json(await importRealisasi(req.file.buffer, req.body.sheet));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

/* ---------- transaksi ---------- */
const TRX_SQL = `SELECT t.*, r.kode AS rek_kode, r.uraian AS rek_uraian, r.induk_kode AS rek_induk_kode, r.induk_uraian AS rek_induk_uraian, u.nama AS pembuat,
  (SELECT COUNT(*) FROM transaksi_item ti WHERE ti.transaksi_id=t.id) AS jml_item
  FROM transaksi t JOIN rekening r ON r.id=t.rekening_id LEFT JOIN users u ON u.id=t.dibuat_oleh`;

app.get('/api/transaksi', wrap(async (req, res) => {
  const { q = '', rekening_id, induk_kode, tahap, bulan, tahun, kategori: kat } = req.query;
  const w = [], p = [];
  if (q) {
    w.push('(lower(t.penyedia) LIKE ? OR lower(t.uraian) LIKE ? OR r.kode LIKE ? OR lower(r.uraian) LIKE ? OR lower(t.sp_nomor) LIKE ? OR lower(t.bast_nomor) LIKE ? OR lower(t.baphp_nomor) LIKE ?)');
    const l = `%${String(q).toLowerCase()}%`;
    p.push(l, l, l, l, l, l, l);
  }
  if (rekening_id) { w.push('t.rekening_id=?'); p.push(rekening_id); }
  if (induk_kode) { w.push('r.induk_kode=?'); p.push(induk_kode); }
  if (tahap) { w.push('t.tahap=?'); p.push(tahap); }
  if (bulan) { w.push('SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,7)=?'); p.push(bulan); }
  if (tahun && tahun !== 'semua') {
    w.push('SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,4)=?');
    p.push(String(tahun));
  }
  if (kat) { w.push('t.kategori=?'); p.push(kat); }

  // Jika login sebagai Pejabat Pengadaan, filter juga pekerjaan yang diampu/dibuatnya jika diminta atau sesuai pejabat_id
  if (req.user.role === 'pejabat_pengadaan' && req.user.pejabat_id && req.query.semua_pejabat !== '1') {
    w.push('(t.pengadaan_id=? OR r.pengadaan_id=? OR t.dibuat_oleh=?)');
    p.push(req.user.pejabat_id, req.user.pejabat_id, req.user.id);
  }

  const rows = await db.prepare(`${TRX_SQL} ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY COALESCE(t.sp_tanggal, t.tanggal) DESC, t.id DESC LIMIT 500`).all(...p);
  res.json(rows.map((t) => ({ ...t, ...hitungPajak({ kotor: t.kotor, ppn: !!t.ppn_aktif, pph: !!t.pph_aktif, ppnTarif: t.ppn_tarif, pphTarif: t.pph_tarif }) })));
}));

app.get('/api/transaksi/:id', wrap(async (req, res) => {
  const t = await db.prepare(`${TRX_SQL} WHERE t.id=?`).get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Tidak ditemukan' });
  const items = await db.prepare('SELECT * FROM transaksi_item WHERE transaksi_id=? ORDER BY urut, id').all(req.params.id);
  res.json({ ...t, items });
}));

function bacaTrx(b, user, tahunDefault) {
  const items = Array.isArray(b.items)
    ? b.items.filter((it) => it && String(it.jenis_barang || '').trim())
    : [];

  const sumNego = items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_satuan) || 0)), 0);
  const sumHps = items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_hps || it.harga_satuan) || 0)), 0);
  const sumPenawaran = items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_penawaran) || 0)), 0);

  const hpsTotal = Math.round(Number(b.hps_total)) || sumHps;
  const penawaranTotal = Math.round(Number(b.penawaran_total)) || sumPenawaran;
  const kotor = Math.round(Number(b.kotor)) || sumNego || hpsTotal;

  const thn = (b.sp_tanggal || b.hps_tanggal || b.tanggal || '').slice(0, 4) || tahunDefault || new Date().getFullYear();
  const hpsUrut = String(b.hps_no_urut || '').trim();
  const baknUrut = String(b.bakn_no_urut || '').trim();
  const spUrut = String(b.sp_no_urut || '').trim();
  const bastUrut = String(b.bast_no_urut || '').trim();
  const baphpUrut = String(b.baphp_no_urut || '').trim();

  const hpsNomor = String(b.hps_nomor || '').trim() || (hpsUrut ? `000.3.2/${hpsUrut}/05.1.2/${thn}` : '');
  const baknNomor = String(b.bakn_nomor || '').trim() || (baknUrut ? `000.3.2/${baknUrut}/05.1.2/${thn}` : '');
  const spNomor = String(b.sp_nomor || '').trim() || (spUrut ? `000.3.2/${spUrut}/05.1.2/${thn}` : '');
  const bastNomor = String(b.bast_nomor || '').trim() || (bastUrut ? `000.3.2/${bastUrut}/05.1.2/${thn}` : '');
  const baphpNomor = String(b.baphp_nomor || '').trim() || (baphpUrut ? `000.3.2/${baphpUrut}/05.1.2/${thn}` : '');
  const isSpjLangsung = b.tahap === 'spj_langsung';
  const modePengadaan = isSpjLangsung
    ? '0_10'
    : (b.mode_pengadaan && ['0_10', '10_50', '50_750'].includes(b.mode_pengadaan)
        ? b.mode_pengadaan
        : (kotor > 50000000 ? '50_750' : kotor > 10000000 || hpsNomor || baknNomor ? '10_50' : '0_10'));

  const validTahap = ['spektek', 'hps', 'spektek_hps', 'undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan', 'selesai', 'spj_langsung'];
  const tahap = isSpjLangsung
    ? 'spj_langsung'
    : (validTahap.includes(b.tahap) ? b.tahap : (bastNomor ? 'selesai' : modePengadaan === '50_750' ? 'undangan' : 'pesanan'));

  const is50750 = modePengadaan === '50_750';
  const spkUrut = is50750 ? String(b.spk_no_urut || b.pl?.spk_no_urut || '').trim() : '';
  const spkNomor = is50750 ? (String(b.spk_nomor || b.pl?.spk_nomor || '').trim() || (spkUrut ? `000.3.2/${spkUrut}/05.1.2/${thn}` : '')) : '';
  const spkTanggal = is50750 ? (b.spk_tanggal || b.pl?.spk_tanggal || null) : null;

  const uraianClean = String(b.uraian || '').trim();
  if (!b.tanggal || !b.rekening_id) {
    throw new Error('Tanggal dan kode rekening wajib diisi');
  }
  if (!['spektek', 'hps', 'spektek_hps'].includes(tahap) && !b.penyedia?.trim()) {
    throw new Error('Nama penyedia (CV/PT) wajib diisi');
  }
  if (tahap === 'spektek' && items.length === 0) {
    throw new Error('Spesifikasi Jumlah (minimal 1 item barang) wajib diisi');
  }
  if (tahap !== 'spektek' && !(kotor > 0 || hpsTotal > 0)) {
    throw new Error('Rincian barang dan harga wajib diisi');
  }
  if ((tahap === 'selesai' || tahap === 'spj_langsung') && !uraianClean) {
    throw new Error('Kolom "Yaitu untuk pembayaran / Uraian Paket Pekerjaan" wajib diisi untuk BAST, A2 & Lembar Verifikasi');
  }

  const n = (v) => (v ? Number(v) : null);
  const pengadaanId = n(b.pengadaan_id) || (user?.role === 'pejabat_pengadaan' ? n(user.pejabat_id) : null);
  const spektekStr = is50750 || modePengadaan === '10_50'
    ? (typeof b.spektek === 'object' && b.spektek !== null ? JSON.stringify(b.spektek) : (typeof b.spektek_json === 'string' ? b.spektek_json : null))
    : null;
  const plStr = is50750
    ? (typeof b.pl === 'object' && b.pl !== null ? JSON.stringify(b.pl) : (typeof b.pl_json === 'string' ? b.pl_json : null))
    : null;

  return {
    fields: [
      b.tanggal, +b.rekening_id, String(b.penyedia || '-').trim(), uraianClean, kotor,
      b.ppn_aktif ? 1 : 0, b.pph_aktif ? 1 : 0,
      Number(b.ppn_tarif) || 11, Number(b.pph_tarif) || 1.5,
      kategori(kotor || hpsTotal), b.status || 'draft', tahap, modePengadaan,
      n(b.kpa_id), n(b.ppkom_id), n(b.pptk_id), pengadaanId, n(b.bendahara_id), n(b.verifikator_id), n(b.pengurus_barang_id),
      spektekStr,
      hpsUrut, hpsNomor, b.hps_tanggal || b.tanggal, hpsTotal,
      baknUrut, baknNomor, b.bakn_tanggal || b.sp_tanggal || b.tanggal, penawaranTotal, String(b.bakn_hasil_teknis || 'Sesuai - Ada Perubahan').trim(),
      spUrut, spNomor, b.sp_tanggal || b.tanggal, b.sp_tgl_kirim || b.tanggal,
      bastUrut, bastNomor, b.bast_tanggal || b.tanggal,
      baphpUrut, baphpNomor, b.baphp_tanggal || b.bast_tanggal || b.tanggal,
      plStr, spkUrut, spkNomor, spkTanggal,
      n(b.penyedia_id), String(b.penyedia_pimpinan || '').trim(), String(b.penyedia_jabatan || 'Direktur').trim(), String(b.penyedia_alamat || '').trim(), String(b.penyedia_npwp || '').trim(),
      String(b.ppk_jabatan || '').trim(), String(b.ppk_alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong').trim(),
    ],
    items,
  };
}

async function simpanItemsDanPenyedia(trxId, b, items) {
  await db.prepare('DELETE FROM transaksi_item WHERE transaksi_id=?').run(trxId);
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const qty = Number(it.kuantitas) || 1;
    const hs = Math.round(Number(it.harga_satuan) || Number(it.harga_hps) || 0);
    const hHps = Math.round(Number(it.harga_hps) || hs);
    const hPen = Math.round(Number(it.harga_penawaran) || 0);
    const ht = Math.round(qty * hs);
    await db.prepare(
      'INSERT INTO transaksi_item(transaksi_id,urut,jenis_barang,satuan,kuantitas,harga_hps,harga_penawaran,harga_satuan,harga_total) VALUES(?,?,?,?,?,?,?,?,?)'
    ).run(trxId, i + 1, String(it.jenis_barang).trim(), String(it.satuan || 'Unit').trim(), qty, hHps, hPen, hs, ht);
  }
  const namaP = String(b.penyedia || '').trim().split('\n')[0].trim();
  if (namaP && namaP !== '-') {
    const ex = await db.prepare('SELECT id FROM penyedia WHERE lower(nama)=lower(?)').get(namaP);
    if (!ex) {
      await db.prepare('INSERT INTO penyedia(nama,pimpinan,jabatan,alamat,npwp) VALUES(?,?,?,?,?)')
        .run(namaP, String(b.penyedia_pimpinan || '').trim(), String(b.penyedia_jabatan || 'Direktur').trim(), String(b.penyedia_alamat || '').trim(), String(b.penyedia_npwp || '').trim());
    } else if (b.penyedia_pimpinan || b.penyedia_alamat || b.penyedia_npwp) {
      await db.prepare('UPDATE penyedia SET pimpinan=COALESCE(NULLIF(?,""),pimpinan), jabatan=COALESCE(NULLIF(?,""),jabatan), alamat=COALESCE(NULLIF(?,""),alamat), npwp=COALESCE(NULLIF(?,""),npwp) WHERE id=?')
        .run(String(b.penyedia_pimpinan || '').trim(), String(b.penyedia_jabatan || '').trim(), String(b.penyedia_alamat || '').trim(), String(b.penyedia_npwp || '').trim(), ex.id);
    }
  }
}

app.post('/api/transaksi', wrap(async (req, res) => {
  try {
    const s = await getSettings();
    const { fields, items } = bacaTrx(req.body, req.user, s.tahun);
    const r = await db.prepare(`INSERT INTO transaksi(
      tanggal,rekening_id,penyedia,uraian,kotor,ppn_aktif,pph_aktif,ppn_tarif,pph_tarif,kategori,status,tahap,mode_pengadaan,
      kpa_id,ppkom_id,pptk_id,pengadaan_id,bendahara_id,verifikator_id,pengurus_barang_id,
      spektek_json,
      hps_no_urut,hps_nomor,hps_tanggal,hps_total,
      bakn_no_urut,bakn_nomor,bakn_tanggal,penawaran_total,bakn_hasil_teknis,
      sp_no_urut,sp_nomor,sp_tanggal,sp_tgl_kirim,
      bast_no_urut,bast_nomor,bast_tanggal,
      baphp_no_urut,baphp_nomor,baphp_tanggal,
      pl_json,spk_no_urut,spk_nomor,spk_tanggal,
      penyedia_id,penyedia_pimpinan,penyedia_jabatan,penyedia_alamat,penyedia_npwp,
      ppk_jabatan,ppk_alamat,dibuat_oleh
    ) VALUES(${'?,'.repeat(51)}?)`).run(...fields, req.user.id);
    const trxId = Number(r.lastInsertRowid);
    await simpanItemsDanPenyedia(trxId, req.body, items);
    res.json({ id: trxId });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

app.put('/api/transaksi/:id', wrap(async (req, res) => {
  try {
    const s = await getSettings();
    const { fields, items } = bacaTrx(req.body, req.user, s.tahun);
    await db.prepare(`UPDATE transaksi SET
      tanggal=?,rekening_id=?,penyedia=?,uraian=?,kotor=?,ppn_aktif=?,pph_aktif=?,ppn_tarif=?,pph_tarif=?,kategori=?,status=?,tahap=?,mode_pengadaan=?,
      kpa_id=?,ppkom_id=?,pptk_id=?,pengadaan_id=?,bendahara_id=?,verifikator_id=?,pengurus_barang_id=?,
      spektek_json=?,
      hps_no_urut=?,hps_nomor=?,hps_tanggal=?,hps_total=?,
      bakn_no_urut=?,bakn_nomor=?,bakn_tanggal=?,penawaran_total=?,bakn_hasil_teknis=?,
      sp_no_urut=?,sp_nomor=?,sp_tanggal=?,sp_tgl_kirim=?,
      bast_no_urut=?,bast_nomor=?,bast_tanggal=?,
      baphp_no_urut=?,baphp_nomor=?,baphp_tanggal=?,
      pl_json=?,spk_no_urut=?,spk_nomor=?,spk_tanggal=?,
      penyedia_id=?,penyedia_pimpinan=?,penyedia_jabatan=?,penyedia_alamat=?,penyedia_npwp=?,
      ppk_jabatan=?,ppk_alamat=?
      WHERE id=?`).run(...fields, req.params.id);
    await simpanItemsDanPenyedia(Number(req.params.id), req.body, items);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}));

app.delete('/api/transaksi/:id', wrap(async (req, res) => {
  await db.prepare('DELETE FROM transaksi_item WHERE transaksi_id=?').run(req.params.id);
  await db.prepare('DELETE FROM transaksi WHERE id=?').run(req.params.id);
  res.json({ ok: true });
}));

app.get('/api/transaksi/:id/dokumen/:jenis.:format', wrap(async (req, res) => {
  const { jenis, format } = req.params;
  const validJenis = [
    'spektek', 'hps', 'bakn', 'sp', 'bast', 'baphp', 'a2', 'verifikasi',
    'undangan_pl', 'ba_pembukaan', 'ba_evaluasi', 'undangan_klarifikasi',
    'ba_penetapan', 'bahpl', 'pengumuman_pl', 'laporan_pl', 'sppbj', 'spk'
  ];
  if (!validJenis.includes(jenis) || !['pdf', 'docx'].includes(format)) {
    return res.status(400).json({ error: 'Jenis/format tidak valid' });
  }
  const f = await buatDokumen(req.params.id, jenis, format);
  if (!f) return res.status(404).json({ error: 'Tidak ditemukan' });
  res.setHeader('Content-Type', f.mime);
  res.setHeader('Content-Disposition', `${req.query.inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(f.filename)}`);
  res.send(f.buffer);
}));

/* ---------- dashboard (mendukung filter arsip tahun & pejabat pengadaan) ---------- */
app.get('/api/dashboard', wrap(async (req, res) => {
  const s = await getSettings();
  const tahun = req.query.tahun || s.tahun || String(new Date().getFullYear());
  const wTrx = [];
  const pTrx = [];

  if (tahun && tahun !== 'semua') {
    wTrx.push('SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,4)=?');
    pTrx.push(String(tahun));
  }
  if (req.user.role === 'pejabat_pengadaan' && req.user.pejabat_id) {
    wTrx.push('(t.pengadaan_id=? OR t.dibuat_oleh=?)');
    pTrx.push(req.user.pejabat_id, req.user.id);
  }
  const whereClause = wTrx.length ? 'WHERE ' + wTrx.join(' AND ') : '';

  const tot = await db.prepare(`SELECT COALESCE(SUM(pagu),0) pagu, COALESCE(SUM(realisasi_awal),0) awal FROM rekening`).get();
  const trx = await db.prepare(`SELECT COALESCE(SUM(t.kotor),0) s, COUNT(*) c FROM transaksi t ${whereClause}`).get(...pTrx);
  const perKategori = await db.prepare(`SELECT t.kategori, COUNT(*) AS jumlah, SUM(t.kotor) AS total FROM transaksi t ${whereClause} GROUP BY t.kategori`).all(...pTrx);
  const perTahap = await db.prepare(`SELECT COALESCE(t.tahap,"pesanan") AS tahap, COUNT(*) AS jumlah, SUM(t.kotor) AS total FROM transaksi t ${whereClause} GROUP BY COALESCE(t.tahap,"pesanan")`).all(...pTrx);
  const perBulan = (await db.prepare(`SELECT SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,7) AS bulan, COUNT(*) AS jumlah, SUM(t.kotor) AS total FROM transaksi t ${whereClause} GROUP BY SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,7) ORDER BY bulan DESC LIMIT 12`).all(...pTrx)).reverse();

  const trxFilterRek = tahun && tahun !== 'semua' ? `AND SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,4) = ${db.pool.escape(tahun)}` : '';
  const allRek = (await db.prepare(`
    SELECT r.*, r.realisasi_awal + COALESCE((SELECT SUM(kotor) FROM transaksi t WHERE t.rekening_id=r.id ${trxFilterRek}),0) AS realisasi
    FROM rekening r
  `).all()).map(withSisa);
  const top = [...allRek].filter((r) => r.pagu > 0).sort((a, b) => b.capaian - a.capaian).slice(0, 8);

  // Ringkasan per Kode Rekening Induk
  const mapInduk = {};
  for (const r of allRek) {
    const ik = r.induk_kode || '5.1.02.99.99.9999';
    if (!mapInduk[ik]) {
      mapInduk[ik] = { induk_kode: ik, induk_uraian: r.induk_uraian || INDUK_MAP[ik] || 'Belanja BLUD', pagu: 0, realisasi: 0, jumlah_rekening: 0 };
    }
    mapInduk[ik].pagu += Number(r.pagu) || 0;
    mapInduk[ik].realisasi += Number(r.realisasi) || 0;
    mapInduk[ik].jumlah_rekening += 1;
  }
  const perInduk = Object.values(mapInduk).map((g) => ({
    ...g,
    sisa: g.pagu - g.realisasi,
    capaian: g.pagu ? (g.realisasi / g.pagu) * 100 : 0,
  }));

  const recent = await db.prepare(`${TRX_SQL} ${whereClause} ORDER BY COALESCE(t.sp_tanggal, t.tanggal) DESC, t.id DESC LIMIT 6`).all(...pTrx);
  const penyediaCount = (await db.prepare('SELECT COUNT(*) AS c FROM penyedia WHERE aktif=1').get()).c;

  res.json({
    tahun,
    pagu: Number(tot.pagu),
    realisasi: Number(tot.awal) + Number(trx.s),
    transaksi: Number(trx.c),
    penyedia: Number(penyediaCount),
    perKategori,
    perTahap,
    perBulan,
    perInduk,
    top,
    recent,
    rekening: allRek.length,
  });
}));

/* ---------- web (produksi) ---------- */
const dist = path.join(__dirname, '..', 'web', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

migrateSchema()
  .then(() => {
    app.listen(PORT, () => console.log(`SPJ App berjalan di http://localhost:${PORT} (MySQL: Laragon db_spj_proc)`));
  })
  .catch((err) => {
    console.error('Migration error:', err);
    process.exit(1);
  });
