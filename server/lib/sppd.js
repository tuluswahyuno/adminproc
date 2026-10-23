// Rekap SPPD periodik (perjalanan dinas dalam / luar daerah): perhitungan dan ekspor Excel sesuai format "FULL REKAP SPPD".
const ExcelJS = require('exceljs');
const { db } = require('./db');

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const JUDUL = { dalam: 'REKAP BELANJA PERJALANAN DINAS DALAM DAERAH ', luar: 'REKAP BELANJA PERJALANAN DINAS LUAR DAERAH ' };
const NAMA_JENIS = { dalam: 'DALAM DAERAH', luar: 'LUAR DAERAH' };

const n = (v) => Math.round(Number(v)) || 0;
const iso = (v) => (v ? String(v).slice(0, 10) : '');
const tglPanjang = (d) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso(d));
  return m ? `${m[3]} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : '';
};
const tglPendek = (d, tanpaTahun) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso(d));
  return m ? `${m[3]} ${BULAN[Number(m[2]) - 1]}${tanpaTahun ? '' : ' ' + m[1]}` : '';
};
// "02 Januari sd 28 Februari 2026"
function labelPeriode(r) {
  const a = iso(r.tgl_mulai), b = iso(r.tgl_selesai);
  if (!a || !b) return '';
  return `${tglPendek(a, a.slice(0, 4) === b.slice(0, 4))} sd ${tglPanjang(b)}`;
}
const hariSelisih = (a, b) => {
  const x = Date.parse(iso(a)), y = Date.parse(iso(b));
  return Number.isNaN(x) || Number.isNaN(y) ? 1 : Math.max(1, Math.round((y - x) / 86400000) + 1);
};

const KOSONG_MODA = { moda: '', maskapai: '', booking: '', tiket: '', penerbangan: '', plat: '', travel: '', tiket_travel: '', harga: 0 };
const parseDetail = (s) => {
  let d = {};
  try { d = typeof s === 'string' ? JSON.parse(s || '{}') : (s || {}); } catch { d = {}; }
  return {
    ber: { ...KOSONG_MODA, ...(d.ber || {}) },
    pul: { ...KOSONG_MODA, ...(d.pul || {}) },
    hotel: { nama: '', alamat: '', malam: 0, harga: 0, ...(d.hotel || {}) },
  };
};
const bersihModa = (m) => {
  m = m || {};
  const t = (k) => String(m[k] || '').trim().slice(0, 120);
  return { moda: ['pesawat_kereta', 'mobil', 'travel_bis'].includes(m.moda) ? m.moda : '', maskapai: t('maskapai'), booking: t('booking'), tiket: t('tiket'), penerbangan: t('penerbangan'), plat: t('plat'), travel: t('travel'), tiket_travel: t('tiket_travel'), harga: n(m.harga) };
};

/* Hitung ulang semua kolom turunan dari isian dasar. Rumus mengikuti contoh Excel:
   Uang Harian = Index x LOS, JUMLAH = BBM + e-tol + Penginapan + Uang Harian + Diklat + Transport PP + Transport Lokal + Kontribusi. */
function hitung(i, jenis) {
  const uhPersen = Number(i.uh_persen);
  const dkPersen = Number(i.dk_persen);
  const uh_tarif = n(i.uh_tarif);
  const uh_persen = Number.isFinite(uhPersen) ? uhPersen : 100;
  const uh_index = uh_tarif > 0 ? Math.round((uh_tarif * uh_persen) / 100) : n(i.uh_index);
  const dk_tarif = n(i.dk_tarif);
  const dk_persen = Number.isFinite(dkPersen) ? dkPersen : 100;
  const dk_hari = n(i.dk_hari);
  const dk_total = dk_tarif > 0 ? Math.round((dk_tarif * dk_persen) / 100) * dk_hari : n(i.dk_total);
  const los = Math.max(0, n(i.los));
  const uh_total = uh_index * los;
  // harga tiket / hotel pada rincian hanya keterangan (satu tiket bisa dipakai rombongan); biaya yang dihitung adalah kolom Transport PP & Penginapan
  const transport_pp = n(i.transport_pp);
  const f = { bbm: n(i.bbm), etol: n(i.etol), penginapan: n(i.penginapan), transport_pp, transport_lokal: n(i.transport_lokal), kontribusi: n(i.kontribusi) };
  const jumlah = f.bbm + f.etol + f.penginapan + uh_total + dk_total + f.transport_pp + f.transport_lokal + f.kontribusi;
  return { uh_tarif, uh_persen, uh_index, dk_tarif, dk_persen, dk_hari, dk_total, los, uh_total, ...f, jumlah };
}

/* Validasi & normalisasi isian satu baris perjalanan dari formulir. */
function bacaItem(b, jenis) {
  const nama = String(b.nama || '').trim();
  if (!nama) throw new Error('Nama pegawai wajib diisi');
  const tb = iso(b.tgl_berangkat);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tb)) throw new Error('Tanggal berangkat wajib diisi');
  const tk = /^\d{4}-\d{2}-\d{2}$/.test(iso(b.tgl_kembali)) ? iso(b.tgl_kembali) : tb;
  if (tk < tb) throw new Error('Tanggal kembali tidak boleh sebelum tanggal berangkat');
  const los = n(b.los) > 0 ? n(b.los) : hariSelisih(tb, tk);
  const detail = jenis === 'luar'
    ? { ber: bersihModa(b.ber ?? b.detail?.ber), pul: bersihModa(b.pul ?? b.detail?.pul), hotel: { nama: String((b.hotel ?? b.detail?.hotel)?.nama || '').trim().slice(0, 200), alamat: String((b.hotel ?? b.detail?.hotel)?.alamat || '').trim().slice(0, 400), malam: n((b.hotel ?? b.detail?.hotel)?.malam), harga: n((b.hotel ?? b.detail?.hotel)?.harga) } }
    : null;
  const h2 = hitung({ ...b, los, detail_json: detail ? JSON.stringify(detail) : null }, jenis);
  return {
    ...h2,
    nama: nama.slice(0, 255),
    status: String(b.status || '').toUpperCase().replace(/\s+/g, ' ').trim() === 'NON ASN' ? 'NON ASN' : 'ASN',
    tgl_berangkat: tb, tgl_kembali: tk, los,
    tujuan: String(b.tujuan || '').trim().slice(0, 500),
    acara: String(b.acara || '').trim().slice(0, 1000),
    no_rek: String(b.no_rek || '').trim().slice(0, 100),
    detail_json: detail ? JSON.stringify(detail) : null,
  };
}

const KOLOM_ITEM = ['nama', 'status', 'tgl_berangkat', 'tgl_kembali', 'los', 'uh_tarif', 'uh_persen', 'uh_index', 'dk_tarif', 'dk_persen', 'dk_hari', 'dk_total', 'tujuan', 'acara', 'bbm', 'etol', 'penginapan', 'uh_total', 'transport_pp', 'transport_lokal', 'kontribusi', 'jumlah', 'no_rek', 'detail_json'];
const nilaiItem = (it) => KOLOM_ITEM.map((k) => it[k]);
const SQL_INSERT_ITEM = `INSERT INTO sppd_item(rekap_id,urut,${KOLOM_ITEM.join(',')}) VALUES(?,?,${KOLOM_ITEM.map(() => '?').join(',')})`;

const keItemApi = (r) => ({
  ...r,
  tgl_berangkat: iso(r.tgl_berangkat), tgl_kembali: iso(r.tgl_kembali),
  uh_persen: Number(r.uh_persen), dk_persen: Number(r.dk_persen),
  uh_tarif: Number(r.uh_tarif), uh_index: Number(r.uh_index), dk_tarif: Number(r.dk_tarif), dk_total: Number(r.dk_total),
  bbm: Number(r.bbm), etol: Number(r.etol), penginapan: Number(r.penginapan), uh_total: Number(r.uh_total),
  transport_pp: Number(r.transport_pp), transport_lokal: Number(r.transport_lokal), kontribusi: Number(r.kontribusi), jumlah: Number(r.jumlah),
  detail: parseDetail(r.detail_json),
});

async function ambilRekap(id) {
  const r = await db.prepare('SELECT * FROM sppd_rekap WHERE id=?').get(id);
  if (!r) return null;
  const items = (await db.prepare('SELECT * FROM sppd_item WHERE rekap_id=? ORDER BY urut, id').all(id)).map(keItemApi);
  return {
    ...r,
    tgl_mulai: iso(r.tgl_mulai), tgl_selesai: iso(r.tgl_selesai), tgl_ttd: iso(r.tgl_ttd),
    items,
    total: items.reduce((s, i) => s + i.jumlah, 0),
  };
}

/* ---------------- ekspor Excel ---------------- */
const RP_FMT = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
const GARIS = { style: 'thin', color: { argb: 'FF000000' } };
const KOTAK = { top: GARIS, left: GARIS, bottom: GARIS, right: GARIS };
const FONT = (o = {}) => ({ name: 'Arial', size: 12, ...o });
const kolomHuruf = (c) => { let s = ''; while (c > 0) { const m = (c - 1) % 26; s = String.fromCharCode(65 + m) + s; c = Math.floor((c - 1) / 26); } return s; };

async function infoTtd(rekap) {
  let ppkId = rekap.ppk_id;
  if (!ppkId && rekap.rekening_id) ppkId = (await db.prepare('SELECT ppkom_id FROM rekening WHERE id=?').get(rekap.rekening_id))?.ppkom_id;
  const ppk = ppkId ? await db.prepare('SELECT nama, nip, jabatan FROM pejabat WHERE id=?').get(ppkId) : null;
  return { kota: 'Sragen', ppk }; // sesuai contoh: "Sragen, 28 Februari 2026"
}

// rumus uang harian: 370000*50% bila tarif & persentase diketahui
const rumusIndex = (it) => (it.uh_tarif > 0 ? `${it.uh_tarif}*${Number(it.uh_persen)}%` : null);
const rumusDiklat = (it) => (it.dk_tarif > 0 ? `(${it.dk_tarif}*${Number(it.dk_persen)}%)*${it.dk_hari}` : null);

function namaSheet(r, dipakai) {
  let nm = (r.label || labelPeriode(r) || `Rekap ${r.id}`).replace(/[\\/?*[\]:]/g, '-').replace(/\s+/g, ' ').trim().replace(/^BULAN\s*-?\s*/i, '');
  nm = nm.slice(0, 31) || `Rekap ${r.id}`;
  let kandidat = nm, k = 2;
  while (dipakai.has(kandidat.toLowerCase())) { const sfx = ` (${k++})`; kandidat = nm.slice(0, 31 - sfx.length) + sfx; }
  dipakai.add(kandidat.toLowerCase());
  return kandidat;
}

async function isiSheet(ws, rekap, jenis, versi) {
  const luar = jenis === 'luar';
  const penuh = luar && versi !== 'ringkas'; // kolom armada & hotel hanya pada versi lengkap luar daerah
  const lastCol = penuh ? 39 : luar ? 19 : 20;
  const rb = penuh ? 2 : 1; // baris judul
  const hdr0 = penuh ? 6 : 5; // baris header pertama
  const nHdr = penuh ? 3 : 2;
  const mulai = hdr0 + nHdr;

  const lebar = penuh
    ? [6.8, 43.2, 11.1, 22, 22.8, 7.2, 15.8, 15.9, 33.9, 45.3, 15.9, 15.9, 15.8, 20.6, 17.2, 17.1, 14.2, 14, 22.2, 21.2, 15.1, 20, 16.9, 15, 22, 15.3, 17.3, 21.2, 15.1, 20, 16.9, 15, 22, 15.3, 17.3, 33, 40, 15, 20]
    : [9, 35, 14, 18, 19, 7, 16, 14, 38, 50, 15, 15, 15, 18, 14, 16, 14, 14, 18, 22];
  (penuh ? lebar : lebar.slice(0, lastCol)).forEach((w, i) => { ws.getColumn(i + 1).width = w; });

  const gabung = (r1, c1, r2, c2) => { if (r1 !== r2 || c1 !== c2) ws.mergeCells(r1, c1, r2, c2); };
  const taruh = (r, c, v, o = {}) => {
    const cell = ws.getCell(r, c);
    cell.value = v;
    cell.font = FONT({ bold: o.bold });
    cell.alignment = { horizontal: o.h || 'center', vertical: 'middle', wrapText: o.wrap !== false };
    if (o.box !== false) cell.border = KOTAK;
    if (o.fmt) cell.numFmt = o.fmt;
    if (o.fill) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: o.fill } };
    return cell;
  };

  // judul
  ws.mergeCells(rb, 1, rb, Math.min(lastCol, 19));
  ws.mergeCells(rb + 1, 1, rb + 1, Math.min(lastCol, 19));
  Object.assign(ws.getCell(rb, 1), { value: JUDUL[jenis], font: FONT({ bold: true, size: 16 }), alignment: { horizontal: 'center', vertical: 'middle' } });
  Object.assign(ws.getCell(rb + 1, 1), { value: 'RSUD dr. SOERATNO GEMOLONG', font: FONT({ bold: true, size: 16 }), alignment: { horizontal: 'center', vertical: 'middle' } });
  ws.getRow(rb).height = 21; ws.getRow(rb + 1).height = 21;
  const label = rekap.label || labelPeriode(rekap);
  Object.assign(ws.getCell(hdr0 - 1, 1), { value: `BULAN : ${label.replace(/^BULAN\s*:\s*/i, '')}`, font: FONT({ bold: true, size: 14 }), alignment: { vertical: 'middle' } });
  ws.getRow(hdr0 - 1).height = 25.2;

  // header tabel
  const FILL = 'FFF2F2F2';
  const hdr = (r, c, t, r2 = r, c2 = c) => { for (let rr = r; rr <= r2; rr++) for (let cc = c; cc <= c2; cc++) taruh(rr, cc, rr === r && cc === c ? t : null, { bold: true, fill: FILL }); gabung(r, c, r2, c2); };
  const akhirH = hdr0 + nHdr - 1;
  [['NO', 1], ['NAMA', 2], ['STATUS', 3], ['TGL BERANGKAT', 4], ['TGL KEMBALI', 5], ['LOS', 6]].forEach(([t, c]) => hdr(hdr0, c, t, akhirH, c));
  hdr(hdr0, 7, 'INDEX', hdr0, 8);
  hdr(hdr0 + 1, 7, 'Uang Harian Perjalanan Dinas', akhirH, 7);
  hdr(hdr0 + 1, 8, 'Uang Harian Diklat', akhirH, 8);
  hdr(hdr0, 9, 'TUJUAN', akhirH, 9);
  hdr(hdr0, 10, 'ACARA', akhirH, 10);
  hdr(hdr0, 11, 'BIAYA', hdr0, lastCol === 39 ? 19 : lastCol);
  ['BBM', 'e-tol', 'Penginapan', 'Uang Harian Perjalanan Dinas', 'Uang Harian Diklat', 'Transport PP', 'Transport Lokal', 'Kontribusi', 'JUMLAH'].forEach((t, k) => hdr(hdr0 + 1, 11 + k, t, akhirH, 11 + k));
  if (!luar) hdr(hdr0 + 1, 20, 'NO.REK', akhirH, 20);
  if (penuh) {
    hdr(hdr0, 20, 'Berangkat', hdr0, 27);
    hdr(hdr0, 28, 'Pulang', hdr0, 35);
    hdr(hdr0, 36, 'Penginapan', hdr0, 39);
    for (const dasar of [20, 28]) {
      hdr(hdr0 + 1, dasar, 'Jika Naik Pesawat/Kereta', hdr0 + 1, dasar + 3);
      hdr(hdr0 + 1, dasar + 4, 'Jika Naik Mobil Kantor/Dinas', hdr0 + 1, dasar + 4);
      hdr(hdr0 + 1, dasar + 5, 'Jika Naik Travel/Bis', hdr0 + 1, dasar + 6);
      hdr(hdr0 + 1, dasar + 7, 'Harga Tiket', akhirH, dasar + 7);
      ['Maskapai/Kereta', 'Kode Boking', 'Nomor Tiket', 'Kode Penerbangan', 'No. Plat Mobil', 'Nama Travel/Bis', 'Nomor Tiket'].forEach((t, k) => hdr(akhirH, dasar + k, t));
    }
    hdr(hdr0 + 1, 36, 'Hotel', akhirH, 36);
    hdr(hdr0 + 1, 37, 'Alamat', akhirH, 37);
    hdr(hdr0 + 1, 38, 'Lama Menginap', akhirH, 38);
    hdr(hdr0 + 1, 39, 'Harga', akhirH, 39);
  }
  for (let r = hdr0; r <= akhirH; r++) ws.getRow(r).height = r === hdr0 ? 25.2 : 40;

  // isi
  const items = rekap.items;
  items.forEach((it, idx) => {
    const r = mulai + idx;
    ws.getRow(r).height = 54;
    taruh(r, 1, idx + 1);
    taruh(r, 2, it.nama, { h: 'left' });
    taruh(r, 3, it.status);
    taruh(r, 4, tglPanjang(it.tgl_berangkat));
    taruh(r, 5, tglPanjang(it.tgl_kembali || it.tgl_berangkat));
    taruh(r, 6, it.los);
    const fi = rumusIndex(it);
    taruh(r, 7, fi ? { formula: fi, result: it.uh_index } : it.uh_index || null, { fmt: RP_FMT });
    const fd = rumusDiklat(it);
    taruh(r, 8, fd ? { formula: fd, result: it.dk_total } : it.dk_total || null, { fmt: RP_FMT });
    taruh(r, 9, it.tujuan, { h: 'left' });
    taruh(r, 10, it.acara, { h: 'left' });
    taruh(r, 11, it.bbm || null, { fmt: RP_FMT });
    taruh(r, 12, it.etol || null, { fmt: RP_FMT });
    taruh(r, 13, it.penginapan || null, { fmt: RP_FMT });
    taruh(r, 14, { formula: `G${r}*F${r}`, result: it.uh_total }, { fmt: RP_FMT });
    taruh(r, 15, it.dk_total ? { formula: `H${r}`, result: it.dk_total } : null, { fmt: RP_FMT });
    taruh(r, 16, it.transport_pp || null, { fmt: RP_FMT });
    taruh(r, 17, it.transport_lokal || null, { fmt: RP_FMT });
    taruh(r, 18, it.kontribusi || null, { fmt: RP_FMT });
    taruh(r, 19, { formula: `SUM(K${r}:R${r})`, result: it.jumlah }, { fmt: RP_FMT });
    if (!luar) taruh(r, 20, it.no_rek || null);
    if (penuh) {
      const d = it.detail;
      [[20, d.ber], [28, d.pul]].forEach(([c, m]) => {
        const pk = m.moda === 'pesawat_kereta', mb = m.moda === 'mobil', tb = m.moda === 'travel_bis';
        taruh(r, c, pk ? m.maskapai : null); taruh(r, c + 1, pk ? m.booking : null); taruh(r, c + 2, pk ? m.tiket : null); taruh(r, c + 3, pk ? m.penerbangan : null);
        taruh(r, c + 4, mb ? m.plat : null);
        taruh(r, c + 5, tb ? m.travel : null); taruh(r, c + 6, tb ? m.tiket_travel : null);
        taruh(r, c + 7, m.harga || null, { fmt: RP_FMT });
      });
      taruh(r, 36, d.hotel.nama || null); taruh(r, 37, d.hotel.alamat || null, { h: 'left' });
      taruh(r, 38, d.hotel.malam ? `${d.hotel.malam} Malam` : null);
      taruh(r, 39, d.hotel.harga || null, { fmt: RP_FMT });
    }
  });

  // sel D/E/I/J digabung untuk baris berurutan dengan kegiatan yang sama
  let i = 0;
  while (i < items.length) {
    let j = i;
    const kunci = (x) => [x.tgl_berangkat, x.tgl_kembali, x.tujuan, x.acara].join('|');
    while (j + 1 < items.length && kunci(items[j + 1]) === kunci(items[i])) j++;
    if (j > i) for (const c of [4, 5, 9, 10]) ws.mergeCells(mulai + i, c, mulai + j, c);
    i = j + 1;
  }

  // baris JUMLAH
  const rj = mulai + items.length;
  for (let c = 1; c <= lastCol; c++) taruh(rj, c, null, { bold: true, fill: FILL });
  ws.mergeCells(rj, 1, rj, 10);
  ws.getCell(rj, 1).value = 'JUMLAH';
  const awal = mulai, akhir = Math.max(mulai, rj - 1);
  for (let c = 11; c <= 19; c++) {
    const huruf = kolomHuruf(c);
    const kolItem = ['bbm', 'etol', 'penginapan', 'uh_total', 'dk_total', 'transport_pp', 'transport_lokal', 'kontribusi', 'jumlah'][c - 11];
    taruh(rj, c, items.length ? { formula: `SUM(${huruf}${awal}:${huruf}${akhir})`, result: items.reduce((s, x) => s + (x[kolItem] || 0), 0) } : 0, { bold: true, h: 'right', fmt: RP_FMT, fill: FILL });
  }
  ws.getRow(rj).height = 24;

  // tanda tangan PPK
  const t = await infoTtd(rekap);
  const rt = rj + 3;
  ws.mergeCells(rt, 15, rt, 17);
  const tglTtd = rekap.tgl_ttd || rekap.tgl_selesai;
  Object.assign(ws.getCell(rt, 15), { value: `${t.kota}, ${tglPanjang(tglTtd)}`, font: FONT(), alignment: { horizontal: 'center' } });
  const baris = [['Pejabat Pembuat Komitmen', 1], ['RSUD dr. Soeratno Gemolong Kab. Sragen', 2]];
  baris.forEach(([teks, k]) => { ws.mergeCells(rt + k, 15, rt + k, 17); Object.assign(ws.getCell(rt + k, 15), { value: teks, font: FONT(), alignment: { horizontal: 'center' } }); });
  const rn = rt + 8;
  ws.mergeCells(rn, 15, rn, 17); ws.mergeCells(rn + 1, 15, rn + 1, 17);
  Object.assign(ws.getCell(rn, 15), { value: t.ppk?.nama || '', font: FONT({ bold: true, underline: true }), alignment: { horizontal: 'center' } });
  Object.assign(ws.getCell(rn + 1, 15), { value: t.ppk?.nip ? `NIP. ${t.ppk.nip}` : '', font: FONT(), alignment: { horizontal: 'center' } });

  ws.views = [{ state: 'frozen', xSplit: 2, ySplit: akhirH, showGridLines: true }];
  ws.pageSetup = { orientation: 'landscape', paperSize: 8, fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 } };
}

/* Satu sheet per periode. Dipakai untuk satu rekap maupun rekap penuh satu tahun. */
async function buatExcel(rekapList, jenis, judulBerkas, versi = 'lengkap') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AdminProc e-SPJ';
  wb.created = new Date();
  const dipakai = new Set();
  for (const r of rekapList) {
    const ws = wb.addWorksheet(namaSheet(r, dipakai), { properties: { defaultRowHeight: 18 } });
    await isiSheet(ws, r, jenis, versi);
  }
  if (!rekapList.length) wb.addWorksheet('Kosong').getCell('A1').value = `Belum ada rekap ${NAMA_JENIS[jenis]}`;
  return { buffer: Buffer.from(await wb.xlsx.writeBuffer()), nama: judulBerkas };
}

module.exports = { hitung, bacaItem, nilaiItem, SQL_INSERT_ITEM, KOLOM_ITEM, ambilRekap, buatExcel, labelPeriode, tglPanjang, hariSelisih, keItemApi, NAMA_JENIS };
