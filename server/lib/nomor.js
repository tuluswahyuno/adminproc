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
      if (label === 'Surat Pesanan' && t.mode_pengadaan === 'epur') label = 'Surat Penyerahan Pekerjaan ke PP';
      items.push({ kunci, sumber: 'dokumen', no_urut: urut, nomor: nomorLengkap(urut, tahun), jenis: label, paket, transaksi_id: t.id, mode: t.mode_pengadaan, tanggal: tanggal || null });
    };
    const alurPl = t.mode_pengadaan === '50_750';
    for (const d of DOK_KOLOM) {
      if (d.kolom === 'spk' && !alurPl) continue; // SPK hanya ada di alur 50–750 jt
      tambah(t[`${d.kolom}_no_urut`], d.label, t[`${d.kolom}_tanggal`], `t${t.id}:${d.kolom}`);
    }
    let pl = {};
    if (alurPl && t.pl_json) { try { pl = JSON.parse(t.pl_json) || {}; } catch { pl = {}; } }
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

// Daftar nomor yang diajukan sebuah paket (kolom transaksi + pl_json bila alur 50–750 jt) untuk diperiksa kembar.
function entriNomor(kol, pl, alurPl, mode) {
  const out = [];
  for (const d of DOK_KOLOM) {
    if (d.kolom === 'spk' && !alurPl) continue;
    const v = String(kol[d.kolom] || '').trim();
    if (v) out.push({ kunci: d.kolom, label: d.kolom === 'sp' && mode === 'epur' ? 'Surat Penyerahan Pekerjaan ke PP' : d.label, no_urut: v });
  }
  if (alurPl && pl) for (const d of DOK_PL) {
    const v = String(pl[d.kolom + '_no_urut'] || '').trim();
    if (v) out.push({ kunci: d.kolom, label: d.label, no_urut: v });
  }
  return out;
}

/* Periksa nomor sebuah paket / catatan manual terhadap seluruh nomor lain pada tahun yang sama
   (dan terhadap nomor lain dalam paket itu sendiri). Mengembalikan { kunci: pesan }. */
async function periksaKembar(tahun, entri, { idTrx = null, idManual = null } = {}) {
  const konflik = {};
  const daftar = await daftarNomor(tahun);
  const lain = new Map();
  for (const i of daftar) {
    if (idTrx && Number(i.transaksi_id) === Number(idTrx)) continue;
    if (idManual && i.sumber === 'manual' && Number(i.manual_id) === Number(idManual)) continue;
    const k = i.no_urut.toLowerCase();
    if (!lain.has(k)) lain.set(k, i);
  }
  const pernah = new Map();
  for (const e of entri) {
    const k = String(e.no_urut || '').trim().toLowerCase();
    if (!k) continue;
    const pakai = lain.get(k);
    if (pakai) {
      konflik[e.kunci] = pakai.sumber === 'manual'
        ? 'Nomor ' + e.no_urut + ' sudah dicatat manual di Monitoring Nomor (' + pakai.jenis + '). Pilih nomor lain atau hapus catatannya.'
        : 'Nomor ' + e.no_urut + ' sudah dipakai (' + pakai.jenis + (pakai.paket ? ' — ' + pakai.paket.slice(0, 70) : '') + '). Gunakan nomor lain.';
    } else if (pernah.has(k)) {
      konflik[e.kunci] = 'Nomor ' + e.no_urut + ' sama dengan nomor ' + pernah.get(k) + ' pada paket ini. Gunakan nomor lain.';
    } else pernah.set(k, e.label);
  }
  return konflik;
}

// Saran nomor untuk sebuah tanggal: letaknya mengikuti urutan nomor pada tanggal-tanggal di sekitarnya.
async function saranTanggal(tahun, tanggal) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal || '')) throw new Error('Tanggal tidak valid');
  const semua = await daftarNomor(tahun);
  const dipakai = new Set(semua.map((i) => i.no_urut.toLowerCase()));
  const daftar = semua.filter((i) => i.tanggal && bagian(i.no_urut));
  const tgl10 = (i) => String(i.tanggal).slice(0, 10);
  const urut = (arr) => [...arr].sort((a, b) => bandingUrut(a.no_urut, b.no_urut));
  const pada = urut(daftar.filter((i) => tgl10(i) === tanggal));
  const sebelumArr = daftar.filter((i) => tgl10(i) < tanggal);
  const sesudahArr = daftar.filter((i) => tgl10(i) > tanggal);
  // tanggal terdekat sebelum / sesudah; ambil nomor terbesar (sebelum) atau terkecil (sesudah) pada tanggal itu
  const tglSebelum = sebelumArr.reduce((m, i) => (tgl10(i) > m ? tgl10(i) : m), '');
  const tglSesudah = sesudahArr.reduce((m, i) => (!m || tgl10(i) < m ? tgl10(i) : m), '');
  const sebelum = urut(sebelumArr.filter((i) => tgl10(i) === tglSebelum)).pop() || null;
  const sesudah = urut(sesudahArr.filter((i) => tgl10(i) === tglSesudah))[0] || null;

  const acuan = pada.length ? pada[pada.length - 1] : sebelum;
  const batas = sesudah ? bagian(sesudah.no_urut) : null;
  let saran = '';
  if (acuan) {
    const b = bagian(acuan.no_urut);
    let berikut = b.angka + 1;
    if (!batas) while (dipakai.has(String(berikut))) berikut++; // tanggal paling akhir: nomor kosong pertama di atasnya
    // bila ada tanggal sesudahnya, nomor berikutnya hanya dipakai kalau masih muat sebelum nomor di sana
    if (!dipakai.has(String(berikut)) && (!batas || berikut < batas.angka)) saran = String(berikut);
    else {
      for (const sfx of 'abcdefghijklmnopqrstuvwxyz') {
        const c = b.angka + '.' + sfx;
        if (!dipakai.has(c) && b.sufiks < sfx) { saran = c; break; }
      }
    }
  } else if (sesudah) {
    const b = bagian(sesudah.no_urut);
    if (b.angka > 1 && !dipakai.has(String(b.angka - 1))) saran = String(b.angka - 1);
  }
  const ringkas = (i) => (i ? { no_urut: i.no_urut, jenis: i.jenis, paket: i.paket, tanggal: i.tanggal } : null);
  return { saran, sebelum: ringkas(sebelum), sesudah: ringkas(sesudah), pada: pada.map(ringkas) };
}

module.exports = { daftarNomor, saranNomor, saranTanggal, nomorManualSet, periksaKembar, entriNomor, bagian };
