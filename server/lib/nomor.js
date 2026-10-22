// Monitoring nomor surat: kumpulkan semua nomor urut yang terpakai (dokumen + nomor manual) dalam satu tahun.
const { db } = require('./db');

// Kolom nomor di tabel transaksi
const DOK_KOLOM = [
  { kolom: 'hps', label: 'BA Penetapan HPS' },
  { kolom: 'bakn', label: 'BA Klarifikasi & Negosiasi' },
  { kolom: 'sp', label: 'Surat Pesanan' },
  { kolom: 'spk', label: 'SPK' },
  { kolom: 'bast', label: 'BAST' },
  { kolom: 'baphp', label: 'BAPHP' },
];
// Nomor di pl_json (alur 50–750 jt)
const DOK_PL = [
  { kolom: 'undangan', label: 'Undangan Pengadaan Langsung' },
  { kolom: 'pembukaan', label: 'BA Pembukaan Penawaran' },
  { kolom: 'evaluasi', label: 'BA Evaluasi Penawaran' },
  { kolom: 'undangan_klarifikasi', label: 'Undangan Klarifikasi & Negosiasi' },
  { kolom: 'penetapan', label: 'BA Penetapan Pemenang' },
  { kolom: 'bahpl', label: 'BA Hasil Pengadaan Langsung' },
  { kolom: 'pengumuman', label: 'Pengumuman Hasil PL' },
  { kolom: 'laporan', label: 'Laporan Hasil PL ke PPK' },
  { kolom: 'sppbj', label: 'SPPBJ' },
];

const bagian = (urut) => {
  const m = String(urut || '').trim().match(/^(\d+)(?:\.([a-z0-9]+))?$/i);
  return m ? { angka: Number(m[1]), sufiks: (m[2] || '').toLowerCase() } : null;
};
// urutan tampil: angka lalu sufiks ('' < 'a' < 'b')
const bandingUrut = (a, b) => {
  const x = bagian(a) || { angka: Infinity, sufiks: String(a) };
  const y = bagian(b) || { angka: Infinity, sufiks: String(b) };
  return x.angka - y.angka || x.sufiks.localeCompare(y.sufiks);
};
const nomorLengkap = (urut, tahun) => `000.3.2/${urut}/05.1.2/${tahun}`;

async function nomorManualSet(tahun) {
  const rows = await db.prepare('SELECT no_urut FROM nomor_manual WHERE tahun=?').all(tahun);
  return new Set(rows.map((r) => String(r.no_urut).toLowerCase()));
}

async function daftarNomor(tahun) {
  const trx = await db.prepare(`
    SELECT t.id, t.penyedia, t.uraian, t.mode_pengadaan, t.pl_json, r.uraian AS rek_uraian,
      t.hps_no_urut, t.hps_tanggal, t.bakn_no_urut, t.bakn_tanggal, t.sp_no_urut, t.sp_tanggal,
      t.spk_no_urut, t.spk_tanggal, t.bast_no_urut, t.bast_tanggal, t.baphp_no_urut, t.baphp_tanggal
    FROM transaksi t LEFT JOIN rekening r ON r.id=t.rekening_id
    WHERE SUBSTR(COALESCE(t.sp_tanggal, t.tanggal),1,4)=?
  `).all(String(tahun));

  const items = [];
  for (const t of trx) {
    const paket = (t.penyedia && t.penyedia !== '-' ? t.penyedia + ' — ' : '') + (t.uraian || t.rek_uraian || '');
    const tambah = (urut, label, tanggal, kunci) => {
      urut = String(urut || '').trim();
      if (!urut) return;
      items.push({ kunci, sumber: 'dokumen', no_urut: urut, nomor: nomorLengkap(urut, tahun), jenis: label, paket, transaksi_id: t.id, mode: t.mode_pengadaan, tanggal: tanggal || null });
    };
    for (const d of DOK_KOLOM) tambah(t[`${d.kolom}_no_urut`], d.label, t[`${d.kolom}_tanggal`], `t${t.id}:${d.kolom}`);
    let pl = {};
    if (t.pl_json) { try { pl = JSON.parse(t.pl_json) || {}; } catch { pl = {}; } }
    for (const d of DOK_PL) tambah(pl[`${d.kolom}_no_urut`], d.label, pl[`${d.kolom}_tanggal`], `t${t.id}:pl:${d.kolom}`);
  }
  const manual = await db.prepare('SELECT * FROM nomor_manual WHERE tahun=?').all(tahun);
  for (const m of manual) {
    items.push({ kunci: `m${m.id}`, sumber: 'manual', manual_id: m.id, no_urut: m.no_urut, nomor: nomorLengkap(m.no_urut, tahun), jenis: m.perihal || 'Nomor manual', paket: m.keterangan || '', tanggal: m.tanggal || null });
  }

  // nomor kembar: no_urut sama dipakai lebih dari satu dokumen/entri
  const hitung = new Map();
  for (const i of items) hitung.set(i.no_urut.toLowerCase(), (hitung.get(i.no_urut.toLowerCase()) || 0) + 1);
  for (const i of items) i.kembar = hitung.get(i.no_urut.toLowerCase()) > 1;
  items.sort((a, b) => bandingUrut(a.no_urut, b.no_urut) || a.jenis.localeCompare(b.jenis));
  return items;
}

// Saran nomor di atas (lebih kecil) / di bawah (lebih besar) sebuah nomor acuan yang masih kosong.
async function saranNomor(tahun, acuan, arah) {
  const b = bagian(acuan);
  if (!b) throw new Error('Nomor acuan tidak valid');
  const dipakai = new Set((await daftarNomor(tahun)).map((i) => i.no_urut.toLowerCase()));
  const dasar = arah === 'atas' ? b.angka - 1 : b.angka + 1;
  if (dasar < 1) throw new Error('Tidak ada nomor di atas 1');
  if (!dipakai.has(String(dasar))) return String(dasar);
  for (const s of 'abcdefghijklmnopqrstuvwxyz') {
    if (!dipakai.has(`${dasar}.${s}`)) return `${dasar}.${s}`;
  }
  throw new Error('Semua sufiks pada nomor tetangga sudah terpakai');
}

module.exports = { daftarNomor, saranNomor, nomorManualSet, bagian };
