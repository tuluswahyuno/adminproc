// Pembuat dokumen: SP (Surat Pesanan), BAST, A2 (Surat Bukti Pengeluaran), & Lembar Verifikasi — DOCX dan PDF.
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const D = require('docx');
const { db, getSettings } = require('./db');
const { terbilang, rupiah, hitungPajak, tglIndo, tglKalimatBast } = require('./util');
const docsPl = require('./docs_pl');

const ASSET = path.join(__dirname, '..', 'assets');
const LOGO_RS = fs.readFileSync(path.join(ASSET, 'logo', 'logors.png'));
const LOGO_PEMDA = fs.readFileSync(path.join(ASSET, 'logo', 'logopemkab.png'));

const NOTE = 'Barang-barang termaksud telah masuk buku persediaan / inventaris pada tanggal ………………';
const TTD_BEND = 'Bendahara Pengeluaran Pembantu';

async function ambilData(id) {
  const t = await db.prepare('SELECT * FROM transaksi WHERE id=?').get(id);
  if (!t) return null;
  const rek = await db.prepare('SELECT * FROM rekening WHERE id=?').get(t.rekening_id);
  const pj = async (pid) => (pid ? await db.prepare('SELECT nama,nip,jabatan,alamat FROM pejabat WHERE id=?').get(pid) : null) || { nama: '', nip: '', jabatan: '', alamat: '' };
  const s = await getSettings();
  // uraian kosong -> nama kode rekening; jabatan & alamat PPK diambil dari menu Pejabat & Tim
  if (!String(t.uraian || '').trim()) t.uraian = rek?.uraian || '';
  const pajak = hitungPajak({ kotor: t.kotor, ppn: !!t.ppn_aktif, pph: !!t.pph_aktif, ppnTarif: t.ppn_tarif, pphTarif: t.pph_tarif });
  let items = await db.prepare('SELECT * FROM transaksi_item WHERE transaksi_id=? ORDER BY urut, id').all(id);
  if (!items || items.length === 0) {
    items = [{ urut: 1, jenis_barang: t.uraian || '-', satuan: 'Paket', kuantitas: 1, harga_hps: t.kotor, harga_penawaran: t.kotor, harga_satuan: t.kotor, harga_total: t.kotor }];
  }
  let spektek = {};
  if (t.spektek_json) {
    try { spektek = JSON.parse(t.spektek_json) || {}; } catch { spektek = {}; }
  }
  let pl = {};
  if (t.pl_json) {
    try { pl = JSON.parse(t.pl_json) || {}; } catch { pl = {}; }
  }
  const sumHps = items.reduce((acc, it) => acc + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_hps || it.harga_satuan) || 0)), 0);
  const sumPen = items.reduce((acc, it) => acc + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_penawaran) || 0)), 0);
  const hpsTotal = Number(t.hps_total) || sumHps || Number(t.kotor) || 0;
  const penawaranTotal = Number(t.penawaran_total) || sumPen || 0;

  const ppkomData = await pj(t.ppkom_id || rek?.ppkom_id);
  if (ppkomData.jabatan) t.ppk_jabatan = ppkomData.jabatan;
  if (ppkomData.alamat) t.ppk_alamat = ppkomData.alamat;

  return {
    s, t, rek, pajak, items, spektek, pl,
    hpsTotal,
    penawaranTotal,
    terbilangHps: terbilang(hpsTotal),
    terbilangPenawaran: penawaranTotal > 0 ? terbilang(penawaranTotal) : '-',
    kpa: await pj(t.kpa_id || s.kpa_id),
    ppkom: await pj(t.ppkom_id || rek?.ppkom_id),
    pptk: await pj(t.pptk_id || rek?.pptk_id),
    pengadaan: await pj(t.pengadaan_id || rek?.pengadaan_id),
    bend: await pj(t.bendahara_id || s.bendahara_id),
    ver: await pj(t.verifikator_id || s.verifikator_id),
    pengurus: await pj(t.pengurus_barang_id || s.pengurus_barang_id),
    terbilang: terbilang(t.kotor),
    tahun: (t.sp_tanggal || t.hps_tanggal || t.tanggal || '').slice(0, 4) || s.tahun || new Date().getFullYear(),
  };
}

const nipTxt = (n) => (n ? (/^nip/i.test(n) ? n : 'NIP. ' + n) : '');
const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID');

/* =========================== A2 - PDF (Separuh F4: 21 x 16.5 cm) =========================== */
function a2Pdf(d) {
  // Ukuran Separuh F4: 21 x 16.5 cm = 595.28 x 467.72 pt
  const PAGE_W = 595.28;
  const PAGE_H = 467.72;

  const doc = new PDFDocument({
    size: [PAGE_W, PAGE_H],
    layout: 'portrait',
    margin: 0,
    info: { Title: 'A2 - Surat Bukti Pengeluaran' }
  });

  // Grid horizontal: margin kiri 26pt, kanan 26pt -> Lebar = 543.28 pt
  const X0 = 26;
  // Kolom A=158, B=14, C=54, D=54, E=76, F=62, G=53, H=72.28 (total = 543.28)
  const CW = [158, 14, 54, 54, 76, 62, 53, 72.28];
  const X = [X0];
  for (let i = 0; i < 8; i++) X.push(X[i] + CW[i]);

  // Margin vertikal: atas 20pt, bawah 20pt -> Tinggi = 427.72 pt
  const Y0 = 20;
  const Y_BOTTOM = PAGE_H - 20; // 447.72

  // ── TEXT HELPERS ────────────────────────────────────────────────────────
  const setF = (o = {}) => {
    const f = o.bold && o.italic ? 'Helvetica-BoldOblique'
      : o.bold ? 'Helvetica-Bold'
      : o.italic ? 'Helvetica-Oblique'
      : 'Helvetica';
    doc.font(f).fontSize(o.size || 7.5).fillColor('#000');
  };

  const txt = (str, x, y, w, o = {}) => {
    setF(o);
    doc.text(String(str ?? ''), x, y, {
      width: w, align: o.align || 'left',
      underline: !!o.ul, lineBreak: o.wrap !== false,
      lineGap: o.lineGap || 1.5,
    });
  };

  // Helper teks rata tengah vertikal (Middle Align) dalam tinggi baris rowH
  const txtMid = (str, x, yRow, hRow, w, o = {}) => {
    const s = String(str ?? '');
    setF(o);
    const lg = o.lineGap ?? 1.2;
    const th = doc.heightOfString(s, { width: w, lineGap: lg });
    const yPos = yRow + Math.max(1.5, (hRow - th) / 2);
    doc.text(s, x, yPos, {
      width: w, align: o.align || 'left',
      underline: !!o.ul, lineBreak: o.wrap !== false,
      lineGap: lg,
    });
  };

  const fitOneLine = (str, x, y, w, maxFs = 8.0, o = {}) => {
    const s = String(str ?? '');
    let sz = maxFs;
    setF({ size: sz, ...o });
    while (sz > 5.5 && doc.widthOfString(s) > w - 2) {
      sz -= 0.15;
      setF({ size: sz, ...o });
    }
    doc.text(s, x, y + (maxFs - sz) * 0.3, { width: w, lineBreak: false, align: o.align || 'left', underline: !!o.ul });
  };

  const wVal = X[5] - X[2] - 8;

  const measureH = (str, sz, bold = false, italic = false, lg = 1.2, w = wVal) => {
    setF({ size: sz, bold, italic });
    return doc.heightOfString(String(str ?? ''), { width: w, lineGap: lg });
  };

  // Posisi vertikal utama & Dynamic Row Heights
  const yIsianTop = Y0 + 62; // 82

  // 1. Dibayarkan Kepada
  const sPenyedia = String(d.t.penyedia || '');
  const fsPenyedia = sPenyedia.length > 50 ? 6.8 : 7.4;
  const hTextDibayarkan = measureH(sPenyedia, fsPenyedia, false, false, 1.2);
  const hDibayarkan = Math.max(22, Math.ceil(hTextDibayarkan + 6));

  // 2. Uang sejumlah
  const hUang = 19;

  // 3. Terbilang
  const sTerbilang = '(' + d.terbilang + ')';
  const fsTerbilang = sTerbilang.length > 70 ? 6.8 : 7.2;
  const hTextTerbilang = measureH(sTerbilang, fsTerbilang, false, true, 1.2);
  const hTerbilang = Math.max(19, Math.ceil(hTextTerbilang + 6));

  // 4. Yaitu untuk pembayaran
  const sUntuk = String(d.t.uraian || '');
  const fsUntuk = sUntuk.length > 120 ? 6.6 : (sUntuk.length > 70 ? 6.9 : 7.3);
  const hTextUntuk = measureH(sUntuk, fsUntuk, false, false, 1.3);
  const hUntuk = Math.max(24, Math.ceil(hTextUntuk + 7));

  // 5. Untuk pekerjaan/keperluan
  const sPekerjaan = String(d.rek?.uraian || '-');
  const fsPekerjaan = sPekerjaan.length > 60 ? 6.8 : 7.2;
  const hTextPekerjaan = measureH(sPekerjaan, fsPekerjaan, false, false, 1.2);
  const hPekerjaan = Math.max(18, Math.ceil(hTextPekerjaan + 6));

  // 6. Kode Rek./Kegiatan
  const hKode = 18;

  // Rantai koordinat Y dinamis
  const yDibayarkan = yIsianTop;
  const yDibayarkanBot = yDibayarkan + hDibayarkan;

  const yUang = yDibayarkanBot;
  const yUangBot = yUang + hUang;

  const yTerbilang = yUangBot;
  const yTerbilangBot = yTerbilang + hTerbilang;

  const yUntuk = yTerbilangBot;
  const yUntukBot = yUntuk + hUntuk;

  const yPekerjaan = yUntukBot;
  const yPekerjaanBot = yPekerjaan + hPekerjaan;

  const yKode = yPekerjaanBot;
  const yKodeBot = yKode + hKode;

  const yPenerimaTop = yKodeBot;

  const spaceSisa = Y_BOTTOM - yPenerimaTop;
  const hPenerima = Math.max(68, Math.min(84, Math.round(spaceSisa * 0.35)));
  const yTtdTop = yPenerimaTop + hPenerima;

  // Helper garis
  const thin = 0.75, hair = 0.5;
  const seg = (x1, y1, x2, y2, w = thin) =>
    doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

  // ── BORDER LUAR ─────────────────────────────────────────────────────────
  seg(X[0], Y0,       X[8], Y0);       // atas
  seg(X[0], Y_BOTTOM, X[8], Y_BOTTOM); // bawah
  seg(X[0], Y0,       X[0], Y_BOTTOM); // kiri
  seg(X[8], Y0,       X[8], Y_BOTTOM); // kanan

  // ── PEMISAH HORIZONTAL UTAMA ─────────────────────────────────────────────
  seg(X[5], yIsianTop,    X[8], yIsianTop);    // pemisah kop kanan - tabel pajak (kiri tanpa garis di bawah SURAT BUKTI PENGELUARAN)
  seg(X[0], yPenerimaTop, X[8], yPenerimaTop); // pemisah isian - penerima
  seg(X[0], yTtdTop,      X[8], yTtdTop);      // pemisah penerima - ttd

  // ── DIVIDER VERTIKAL ────────────────────────────────────────────────────
  seg(X[5], Y0,           X[5], yPenerimaTop); // Kolom E|F (Kop s/d Isian)
  seg(X[5], yPenerimaTop, X[5], Y_BOTTOM);     // Kolom E|F (Penerima & TTD)
  const X_KPA = X[0] + 186;                    // batas kolom TTD KPA | PPTK
  seg(X_KPA, yTtdTop,     X_KPA, Y_BOTTOM);    // Zona TTD KPA

  // ── SUB-BARIS ISIAN (Kiri: X[2] s/d X[5]) ────────────────────────────────
  seg(X[2], yDibayarkanBot, X[5], yDibayarkanBot, hair);
  seg(X[2], yUangBot,       X[5], yUangBot,       hair);
  seg(X[2], yTerbilangBot,  X[5], yTerbilangBot,  hair);
  seg(X[2], yUntukBot,      X[5], yUntukBot,      hair);
  seg(X[2], yPekerjaanBot,  X[5], yPekerjaanBot,  hair);

  // ── TABEL PAJAK (Kanan: X[5] s/d X[8]) ──────────────────────────────────
  const yPajakHdr = yIsianTop;
  const hPajakHdr = 18;
  const yPajakHdrBot = yPajakHdr + hPajakHdr;
  seg(X[5], yPajakHdrBot, X[8], yPajakHdrBot);

  const yPajakBot = Math.max(yPajakHdrBot + 40, Math.min(yUntukBot, yPenerimaTop - 22));
  seg(X[6], yPajakHdr, X[6], yPajakBot);
  seg(X[7], yPajakHdr, X[7], yPajakBot);
  seg(X[5], yPajakBot, X[8], yPajakBot);

  // ── KOP KIRI ────────────────────────────────────────────────────
  txt(d.s.instansi_a2 || 'BLUD RSUD dr.SOERATNO GEMOLONG', X[0], Y0 + 8, X[5] - X[0], { bold: true, align: 'center', size: 9.0 });
  txt('TAHUN ANGGARAN : ' + d.tahun, X[0], Y0 + 22, X[5] - X[0], { bold: true, align: 'center', size: 8.0 });
  txt('SURAT BUKTI PENGELUARAN', X[0], Y0 + 42, X[5] - X[0], { bold: true, ul: true, align: 'center', size: 9.5 });

  // ── KOP KANAN ───────────────────────────────────────────────────
  txt('KETERANGAN', X[5], Y0 + 6, X[8] - X[5], { bold: true, ul: true, align: 'center', size: 8.5 });
  txt(NOTE, X[5] + 6, Y0 + 22, X[8] - X[5] - 12, { size: 6.8, lineGap: 2.0 });

  // ── ISIAN KIRI (Middle Aligned dari Dibayarkan Kepada s/d Kode Rek./Kegiatan) ──
  // 1. Dibayarkan Kepada
  txtMid('Dibayarkan Kepada', X[0] + 4, yDibayarkan, hDibayarkan, CW[0] - 6, { size: 7.5 });
  txtMid(':', X[1], yDibayarkan, hDibayarkan, CW[1], { align: 'center', size: 7.5 });
  txtMid(sPenyedia, X[2] + 4, yDibayarkan, hDibayarkan, wVal, { size: fsPenyedia, lineGap: 1.2 });

  // 2. Uang sejumlah (TIDAK bold sesuai instruksi)
  txtMid('Uang sejumlah', X[0] + 4, yUang, hUang, CW[0] - 6, { size: 7.5 });
  txtMid(':', X[1], yUang, hUang, CW[1], { align: 'center', size: 7.5 });
  txtMid('Rp', X[2] + 4, yUang, hUang, 20, { size: 7.5 });
  txtMid(fmtNum(d.t.kotor), X[2] + 4, yUang, hUang, wVal, { align: 'right', size: 8.0, bold: false });

  // 3. Terbilang
  txtMid(sTerbilang, X[2] + 4, yTerbilang, hTerbilang, wVal, { italic: true, size: fsTerbilang, lineGap: 1.2 });

  // 4. Yaitu untuk pembayaran (Diambil dari inputan user d.t.uraian)
  txtMid('Yaitu untuk pembayaran', X[0] + 4, yUntuk, hUntuk, CW[0] - 6, { size: 7.5 });
  txtMid(':', X[1], yUntuk, hUntuk, CW[1], { align: 'center', size: 7.5 });
  txtMid(sUntuk, X[2] + 4, yUntuk, hUntuk, wVal, { size: fsUntuk, lineGap: 1.3 });

  // 5. Untuk pekerjaan/keperluan
  txtMid('Untuk pekerjaan/keperluan', X[0] + 4, yPekerjaan, hPekerjaan, CW[0] - 6, { size: 7.5 });
  txtMid(':', X[1], yPekerjaan, hPekerjaan, CW[1], { align: 'center', size: 7.5 });
  txtMid(sPekerjaan, X[2] + 4, yPekerjaan, hPekerjaan, wVal, { size: fsPekerjaan, lineGap: 1.1 });

  // 6. Kode Rek./Kegiatan
  txtMid('Kode Rek./Kegiatan', X[0] + 4, yKode, hKode, CW[0] - 6, { size: 7.5 });
  txtMid(':', X[1], yKode, hKode, CW[1], { align: 'center', size: 7.5 });
  txtMid(d.rek?.kode || '', X[2] + 4, yKode, hKode, wVal, { size: 7.5 });

  // ── TABEL PAJAK (KANAN) ─────────────────────────────────────────────────
  txtMid('Jumlah Kotor',  X[5], yPajakHdr, hPajakHdr, CW[5], { align: 'center', size: 7.0 });
  txtMid('Pajak',         X[6], yPajakHdr, hPajakHdr, CW[6], { align: 'center', size: 7.0 });
  txtMid('Jumlah bersih', X[7], yPajakHdr, hPajakHdr, CW[7], { align: 'center', size: 7.0 });

  const adaPajak = d.t.ppn_aktif || d.t.pph_aktif;
  if (adaPajak) {
    txt(fmtNum(d.pajak.kotor),  X[5] + 2, yPajakHdrBot + 6, CW[5] - 4, { align: 'right', size: 7.5 });
    let py = yPajakHdrBot + 6;
    if (d.t.ppn_aktif) { txt(fmtNum(d.pajak.ppn),  X[6] + 2, py, CW[6] - 4, { align: 'right', size: 7.5 }); py += 14; }
    if (d.t.pph_aktif) { txt(fmtNum(d.pajak.pph),  X[6] + 2, py, CW[6] - 4, { align: 'right', size: 7.5 }); }
    txt(fmtNum(d.pajak.bersih), X[7] + 2, yPajakHdrBot + 6, CW[7] - 4, { align: 'right', size: 7.5 });
  }

  txtMid('Pengeluaran/pembelian dilakukan berdasarkan :', X[5] + 2, yPajakBot, yPenerimaTop - yPajakBot, X[8] - X[5] - 4, { align: 'center', size: 7.0 });

  // ── BAGIAN PENERIMA (TENGAH) ────────────────────────────────────────────
  txt('Yang berhak menerima', X[0], yPenerimaTop + 6, X[5] - X[0], { align: 'center', size: 8.0 });
  txt('pembayaran',           X[0], yPenerimaTop + 17, X[5] - X[0], { align: 'center', size: 8.0 });
  txt(d.t.penyedia, X[0] + 16, yPenerimaTop + 36, X[5] - X[0] - 32, { align: 'center', size: 7.5, lineGap: 2.0 });

  // Kanan: Yang menerima barang
  txt('Yang menerima barang /\nMemeriksa barang tersebut di atas :', X[5] + 6, yPenerimaTop + 6, X[8] - X[5] - 12, { align: 'center', size: 7.5, lineGap: 2.5 });

  // ── BAGIAN TANDA TANGAN 3 KOLOM ─────────────────────────────────────────
  const inst1 = 'RSUD dr. Soeratno Gemolong';
  const inst2 = 'RSUD dr.Soeratno Gemolong';

  const wColKpa = X_KPA - X[0];     // 186 pt
  const wColPptk = X[5] - X_KPA;    // 170 pt
  const wColBend = X[8] - X[5];     // 187.28 pt (F..H)

  const yTtdTitle = yTtdTop + 8;
  const kpaLH = 11.2;

  // Kolom 1: KPA
  txt('Mengetahui,',                    X[0], yTtdTitle,              wColKpa, { align: 'center', size: 7.8 });
  txt('Pimpinan BLUD',                  X[0], yTtdTitle + kpaLH,     wColKpa, { align: 'center', size: 7.8 });
  txt(inst1,                            X[0], yTtdTitle + kpaLH * 2, wColKpa, { align: 'center', size: 7.5 });
  txt('Selaku Kuasa Pengguna Anggaran', X[0], yTtdTitle + kpaLH * 3, wColKpa, { align: 'center', size: 6.8 });

  // Kolom 2: PPTK (Regular, tidak bold)
  txt('PPTK', X_KPA, yTtdTitle,         wColPptk, { align: 'center', size: 8.0 });
  txt(inst2,  X_KPA, yTtdTitle + kpaLH, wColPptk, { align: 'center', size: 7.8 });

  // Kolom 3: Bendahara
  txt(TTD_BEND, X[5], yTtdTitle,         wColBend, { align: 'center', size: 7.8 });
  txt(inst2,    X[5], yTtdTitle + kpaLH, wColBend, { align: 'center', size: 7.8 });

  // Nama Pejabat & NIP
  const yNama = Y_BOTTOM - 26;
  const yNip = Y_BOTTOM - 13;

  fitOneLine(d.kpa.nama, X[0] + 4, yNama, wColKpa - 8, 8.0, { align: 'center', ul: true });
  fitOneLine(nipTxt(d.kpa.nip), X[0] + 4, yNip, wColKpa - 8, 7.5, { align: 'center' });

  fitOneLine(d.pptk.nama, X_KPA + 4, yNama, wColPptk - 8, 8.0, { align: 'center', ul: true });
  fitOneLine(nipTxt(d.pptk.nip), X_KPA + 4, yNip, wColPptk - 8, 7.5, { align: 'center' });

  fitOneLine(d.bend.nama, X[5] + 4, yNama, wColBend - 8, 8.0, { align: 'center', ul: true });
  fitOneLine(nipTxt(d.bend.nip), X[5] + 4, yNip, wColBend - 8, 7.5, { align: 'center' });

  return doc;
}

/* =========================== A2 - DOCX (Persis Grid Excel A2:H30) =========================== */
const NONE = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NOBORDER = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const SOLID = { style: D.BorderStyle.SINGLE, size: 4, color: '000000' };
const HAIR = { style: D.BorderStyle.SINGLE, size: 2, color: '444444' };
const DASH_BORDER = { style: D.BorderStyle.DASH_SMALL_GAP, size: 4, color: '000000' };
const FONT = 'Arial';

const run = (text, o = {}) => new D.TextRun({
  text: String(text ?? ''), font: FONT, size: o.size || 16,
  bold: o.bold, italics: o.italics, underline: o.underline ? {} : undefined,
});
const para = (children, o = {}) => new D.Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align, spacing: { before: o.before || 0, after: o.after || 0, line: o.line || 200 },
  indent: o.indent, tabStops: o.tabs,
});
const cell = (children, o = {}) => new D.TableCell({
  children: Array.isArray(children) ? children : [children],
  width: o.w ? { size: o.w, type: D.WidthType.DXA } : undefined,
  borders: { top: o.t || NONE, bottom: o.b || NONE, left: o.l || NONE, right: o.r || NONE },
  verticalAlign: o.v || D.VerticalAlign.CENTER, columnSpan: o.span, rowSpan: o.rspan,
  margins: { top: o.mt ?? 10, bottom: o.mb ?? 10, left: o.ml ?? 40, right: o.mr ?? 40 },
});

async function a2Docx(d) {
  // Separuh F4: 21 x 16.5 cm = 11906 x 9354 DXA
  const W_PAGE = 11906;
  const H_PAGE = 9354;

  const CW = [3560, 280, 880, 880, 1520, 1240, 1060, 1446];
  const sumW = (a, b) => CW.slice(a, b).reduce((s, x) => s + x, 0);
  const FS = 15; // 7.5pt
  const adaPajak = d.t.ppn_aktif || d.t.pph_aktif;
  const inst1 = 'RSUD dr. Soeratno Gemolong';
  const inst2 = 'RSUD dr.Soeratno Gemolong';
  const sp = (txtStr = '', o = {}) => para(run(txtStr, { size: o.size || FS, bold: o.bold, italics: o.italics, underline: o.underline }), { align: o.align, line: o.line });
  const rowH = (children, h = 280) => new D.TableRow({ height: { value: h, rule: D.HeightRule.ATLEAST }, cantSplit: true, children });

  const rows = [
    // R2: kosong kiri | KETERANGAN kanan
    rowH([
      cell(sp(''), { w: sumW(0, 5), span: 5, t: SOLID, l: SOLID, r: SOLID }),
      cell(sp('KETERANGAN', { bold: true, underline: true, align: D.AlignmentType.CENTER, size: 16 }), { w: sumW(5, 8), span: 3, t: SOLID, l: SOLID, r: SOLID }),
    ], 300),
    // R3: BLUD RSUD...
    rowH([
      cell(sp(d.s.instansi_a2 || 'BLUD RSUD dr.SOERATNO GEMOLONG', { bold: true, align: D.AlignmentType.CENTER, size: 17 }), { w: sumW(0, 5), span: 5, l: SOLID, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 300),
    // R4: TAHUN ANGGARAN
    rowH([
      cell(sp('TAHUN ANGGARAN : ' + d.tahun, { bold: true, align: D.AlignmentType.CENTER, size: 16 }), { w: sumW(0, 5), span: 5, l: SOLID, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 280),
    // R5: kosong | Barang-barang termaksud...
    rowH([
      cell(sp(''), { w: sumW(0, 5), span: 5, l: SOLID, r: SOLID }),
      cell(sp(NOTE, { size: 13, line: 200 }), { w: sumW(5, 8), span: 3, rspan: 2, l: SOLID, r: SOLID, b: SOLID, v: D.VerticalAlign.TOP }),
    ], 280),
    // R6: SURAT BUKTI PENGELUARAN (tanpa border bawah)
    rowH([
      cell(sp('SURAT BUKTI PENGELUARAN', { bold: true, underline: true, align: D.AlignmentType.CENTER, size: 18 }), { w: sumW(0, 5), span: 5, l: SOLID, r: SOLID, b: NONE }),
    ], 320),

    // R7: Dibayarkan Kepada
    rowH([
      cell(sp('Dibayarkan Kepada'), { w: CW[0], l: SOLID, t: NONE }),
      cell(sp(':', { align: D.AlignmentType.CENTER }), { w: CW[1], t: NONE }),
      cell(sp(d.t.penyedia, { size: 14, line: 220 }), { w: sumW(2, 5), span: 3, t: NONE, b: HAIR, r: SOLID }),
      cell(sp('Jumlah Kotor', { align: D.AlignmentType.CENTER, size: 14 }), { w: CW[5], t: SOLID, b: SOLID, l: SOLID, r: SOLID }),
      cell(sp('Pajak', { align: D.AlignmentType.CENTER, size: 14 }), { w: CW[6], t: SOLID, b: SOLID, l: SOLID, r: SOLID }),
      cell(sp('Jumlah bersih', { align: D.AlignmentType.CENTER, size: 14 }), { w: CW[7], t: SOLID, b: SOLID, l: SOLID, r: SOLID }),
    ], 480),

    // R8: Uang sejumlah (tidak bold)
    rowH([
      cell(sp('Uang sejumlah'), { w: CW[0], l: SOLID }),
      cell(sp(':', { align: D.AlignmentType.CENTER }), { w: CW[1] }),
      cell(new D.Paragraph({
        children: [run('Rp', { size: FS }), run('\t' + fmtNum(d.t.kotor), { size: 15, bold: false })],
        tabStops: [{ type: D.TabStopType.RIGHT, position: sumW(2, 5) - 100 }],
        spacing: { line: 220 },
      }), { w: sumW(2, 5), span: 3, t: HAIR, b: HAIR, r: SOLID }),
      cell(sp(adaPajak ? fmtNum(d.pajak.kotor) : '', { align: D.AlignmentType.RIGHT, size: 14 }), { w: CW[5], l: SOLID, r: SOLID }),
      cell(sp(d.t.ppn_aktif ? fmtNum(d.pajak.ppn) : '', { align: D.AlignmentType.RIGHT, size: 14 }), { w: CW[6], l: SOLID, r: SOLID }),
      cell(sp(adaPajak ? fmtNum(d.pajak.bersih) : '', { align: D.AlignmentType.RIGHT, size: 14 }), { w: CW[7], l: SOLID, r: SOLID }),
    ], 340),

    // R9-10: Terbilang
    rowH([
      cell(sp(''), { w: CW[0], l: SOLID }),
      cell(sp(''), { w: CW[1] }),
      cell(sp('(' + d.terbilang + ')', { italics: true, size: 14, line: 220 }), { w: sumW(2, 5), span: 3, rspan: 2, t: HAIR, b: HAIR, r: SOLID }),
      cell(sp(''), { w: CW[5], l: SOLID, r: SOLID }),
      cell(sp(d.t.pph_aktif ? fmtNum(d.pajak.pph) : '', { align: D.AlignmentType.RIGHT, size: 14 }), { w: CW[6], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[7], l: SOLID, r: SOLID }),
    ], 260),
    rowH([
      cell(sp(''), { w: CW[0], l: SOLID }),
      cell(sp(''), { w: CW[1] }),
      cell(sp(''), { w: CW[5], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[6], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[7], l: SOLID, r: SOLID }),
    ], 220),

    // R11-12: Yaitu untuk pembayaran (Middle Aligned dengan rspan: 2)
    rowH([
      cell(sp('Yaitu untuk pembayaran'), { w: CW[0], rspan: 2, l: SOLID }),
      cell(sp(':', { align: D.AlignmentType.CENTER }), { w: CW[1], rspan: 2 }),
      cell(sp(d.t.uraian, { size: 14, line: 220 }), { w: sumW(2, 5), span: 3, rspan: 2, t: HAIR, b: HAIR, r: SOLID }),
      cell(sp(''), { w: CW[5], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[6], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[7], l: SOLID, r: SOLID }),
    ], 340),
    rowH([
      cell(sp(''), { w: CW[5], b: SOLID, l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[6], b: SOLID, l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[7], b: SOLID, l: SOLID, r: SOLID }),
    ], 240),

    // R13: Untuk pekerjaan/keperluan
    rowH([
      cell(sp('Untuk pekerjaan/keperluan'), { w: CW[0], l: SOLID }),
      cell(sp(':', { align: D.AlignmentType.CENTER }), { w: CW[1] }),
      cell(sp(d.rek.uraian, { size: 14 }), { w: sumW(2, 5), span: 3, t: HAIR, b: HAIR, r: SOLID }),
      cell(sp('Pengeluaran/pembelian dilakukan berdasarkan :', { align: D.AlignmentType.CENTER, size: 13, line: 200 }), { w: sumW(5, 8), span: 3, t: SOLID, l: SOLID, r: SOLID }),
    ], 360),

    // R14: Kode Rek./Kegiatan
    rowH([
      cell(sp('Kode Rek./Kegiatan'), { w: CW[0], b: SOLID, l: SOLID }),
      cell(sp(':', { align: D.AlignmentType.CENTER }), { w: CW[1], b: SOLID }),
      cell(sp(d.rek.kode, { size: 15 }), { w: sumW(2, 5), span: 3, t: HAIR, b: SOLID, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, b: SOLID, l: SOLID, r: SOLID }),
    ], 300),

    // R15-R21: Bagian Tengah
    rowH([
      cell(sp(''), { w: sumW(0, 2), span: 2, t: SOLID, l: SOLID }),
      cell(sp('Yang berhak menerima', { align: D.AlignmentType.CENTER, size: 16 }), { w: sumW(2, 5), span: 3, t: SOLID, r: SOLID }),
      cell(sp('Yang menerima barang / Memeriksa barang', { align: D.AlignmentType.CENTER, size: 14 }), { w: sumW(5, 8), span: 3, t: SOLID, l: SOLID, r: SOLID }),
    ], 320),
    rowH([
      cell(sp(''), { w: sumW(0, 2), span: 2, l: SOLID }),
      cell(sp('pembayaran', { align: D.AlignmentType.CENTER, size: 16 }), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp('tersebut di atas :', { align: D.AlignmentType.CENTER, size: 14 }), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 320),
    rowH([
      cell(sp(''), { w: sumW(0, 2), span: 2, l: SOLID }),
      cell(sp(d.t.penyedia, { align: D.AlignmentType.CENTER, size: 15, line: 240 }), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 500),
    rowH([
      cell(sp(''), { w: sumW(0, 2), span: 2, l: SOLID, b: SOLID }),
      cell(sp(''), { w: sumW(2, 5), span: 3, r: SOLID, b: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID, b: SOLID }),
    ], 300),

    // R22-R30: Bagian Tanda Tangan
    rowH([
      cell(sp('Mengetahui,', { align: D.AlignmentType.CENTER, size: 15 }), { w: CW[0], t: SOLID, l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], t: SOLID, l: SOLID }),
      cell(sp('PPTK', { align: D.AlignmentType.CENTER, size: 15 }), { w: sumW(2, 5), span: 3, t: SOLID, r: SOLID }),
      cell(sp(TTD_BEND, { align: D.AlignmentType.CENTER, size: 15 }), { w: sumW(5, 8), span: 3, t: SOLID, l: SOLID, r: SOLID }),
    ], 320),
    rowH([
      cell(sp('Pimpinan BLUD', { align: D.AlignmentType.CENTER, size: 15 }), { w: CW[0], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], l: SOLID }),
      cell(sp(inst2, { align: D.AlignmentType.CENTER, size: 15 }), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(inst2, { align: D.AlignmentType.CENTER, size: 15 }), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 300),
    rowH([
      cell(sp(inst1, { align: D.AlignmentType.CENTER, size: 14 }), { w: CW[0], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], l: SOLID }),
      cell(sp(''), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 280),
    rowH([
      cell(sp('Selaku Kuasa Pengguna Anggaran', { align: D.AlignmentType.CENTER, size: 13 }), { w: CW[0], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], l: SOLID }),
      cell(sp(''), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 280),
    rowH([
      cell(sp(''), { w: CW[0], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], l: SOLID }),
      cell(sp(''), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(''), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 900), // signature gap
    rowH([
      cell(sp(d.kpa.nama, { align: D.AlignmentType.CENTER, underline: true, size: 15 }), { w: CW[0], l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], l: SOLID }),
      cell(sp(d.pptk.nama, { align: D.AlignmentType.CENTER, underline: true, size: 15 }), { w: sumW(2, 5), span: 3, r: SOLID }),
      cell(sp(d.bend.nama, { align: D.AlignmentType.CENTER, underline: true, size: 15 }), { w: sumW(5, 8), span: 3, l: SOLID, r: SOLID }),
    ], 300),
    rowH([
      cell(sp(nipTxt(d.kpa.nip), { align: D.AlignmentType.CENTER, size: 14 }), { w: CW[0], b: SOLID, l: SOLID, r: SOLID }),
      cell(sp(''), { w: CW[1], b: SOLID, l: SOLID }),
      cell(sp(nipTxt(d.pptk.nip), { align: D.AlignmentType.CENTER, size: 14 }), { w: sumW(2, 5), span: 3, b: SOLID, r: SOLID }),
      cell(sp(nipTxt(d.bend.nip), { align: D.AlignmentType.CENTER, size: 14 }), { w: sumW(5, 8), span: 3, b: SOLID, l: SOLID, r: SOLID }),
    ], 280),
  ];

  const tbl = new D.Table({
    width: { size: sumW(0, 8), type: D.WidthType.DXA },
    columnWidths: CW,
    rows,
  });

  const docx = new D.Document({
    creator: 'SPJ App', title: 'A2 - Surat Bukti Pengeluaran',
    sections: [{
      properties: {
        page: {
          size: { width: W_PAGE, height: H_PAGE, orientation: D.PageOrientation.LANDSCAPE },
          margin: { top: 280, bottom: 280, left: 520, right: 520 }
        }
      },
      children: [tbl],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= Lembar Verifikasi - PDF ======================= */
function drawKop(doc, s, y0 = 32) {
  const W = doc.page.width; // 595.28 pt (Folio / F4)
  // Kiri: Logo Pemkab Sragen
  doc.image(LOGO_PEMDA, 70, y0, { width: 45, height: 57 });
  // Kanan: Logo RSUD dr. Soeratno Gemolong
  doc.image(LOGO_RS, W - 70 - 54, y0 + 2, { width: 54, height: 52 });

  doc.font('Helvetica-Bold').fontSize(12).text(s.pemda || 'PEMERINTAH KABUPATEN SRAGEN', 0, y0 + 10, { width: W, align: 'center' });
  doc.fontSize(15).text(s.instansi || 'RSUD dr. SOERATNO GEMOLONG', 0, y0 + 25, { width: W, align: 'center' });
  doc.font('Helvetica').fontSize(8.5).text(s.alamat || 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274', 0, y0 + 42, { width: W, align: 'center' });
  doc.fontSize(8.5).text(s.kontak || 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com', 0, y0 + 53, { width: W, align: 'center' });

  // Garis ganda pembatas kop
  const ly = y0 + 72;
  const lx1 = 70, lx2 = W - 70;
  doc.save().lineWidth(2.5).strokeColor('#000').moveTo(lx1, ly).lineTo(lx2, ly).stroke().restore();
  doc.save().lineWidth(0.8).strokeColor('#000').moveTo(lx1, ly + 4).lineTo(lx2, ly + 4).stroke().restore();

  return ly + 14;
}

function verifPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Lembar Verifikasi' } });
  const W = doc.page.width;

  let y = drawKop(doc, d.s, 32);

  // Judul: VERIFIKASI (center, bold, underline)
  y += 15;
  doc.font('Helvetica-Bold').fontSize(14).text('VERIFIKASI', 0, y, { width: W, align: 'center', underline: true });

  // Tabel Verifikasi (persis format acuan: indent x=105, x=222, x=242 s/d 525)
  y += 35;
  const xCol1 = 105;
  const xCol2 = 222;
  const xCol3 = 242;
  const xCol3End = 525;
  const wCol3 = xCol3End - xCol3;

  const drawDottedLine = (lineY) => {
    doc.save()
      .lineWidth(0.6)
      .dash(1.5, { space: 2.5 })
      .strokeColor('#000')
      .moveTo(xCol3, lineY)
      .lineTo(xCol3End, lineY)
      .stroke()
      .restore();
  };

  // 1. KEGIATAN
  doc.font('Helvetica').fontSize(11).text('Kegiatan', xCol1, y);
  doc.text(':', xCol2, y);
  doc.font('Helvetica-Bold').fontSize(11).text(d.rek.uraian, xCol3, y, { width: wCol3 });
  let nextY = Math.max(doc.y + 4, y + 20);
  drawDottedLine(nextY - 2);

  // Uraian rincian transaksi
  y = nextY + 3;
  doc.font('Helvetica').fontSize(10.5).text(d.t.uraian, xCol3, y, { width: wCol3, lineGap: 3 });
  nextY = Math.max(doc.y + 4, y + 20);
  drawDottedLine(nextY - 2);

  // Baris kosong kegiatan
  y = nextY + 3;
  nextY = y + 18;
  drawDottedLine(nextY - 2);

  // 2. PENYEDIA
  y = nextY + 12;
  doc.font('Helvetica').fontSize(11).text('Penyedia', xCol1, y);
  doc.text(':', xCol2, y);
  doc.font('Helvetica-Bold').fontSize(11).text(d.t.penyedia, xCol3, y, { width: wCol3 });
  nextY = Math.max(doc.y + 4, y + 20);
  drawDottedLine(nextY - 2);

  // 3 baris kosong penyedia
  for (let i = 0; i < 3; i++) {
    y = nextY + 4;
    nextY = y + 18;
    drawDottedLine(nextY - 2);
  }

  // 3. NOMINAL
  y = nextY + 14;
  doc.font('Helvetica').fontSize(11).text('Nominal', xCol1, y);
  doc.text(':', xCol2, y);
  doc.font('Helvetica-Bold').fontSize(11).text(rupiah(d.t.kotor) + ',-', xCol3, y, { width: wCol3 });
  nextY = Math.max(doc.y + 4, y + 20);
  drawDottedLine(nextY - 2);

  // Terbilang
  y = nextY + 4;
  doc.font('Helvetica-Bold').fontSize(10.5).text('(' + d.terbilang + ')', xCol3, y, { width: wCol3, lineGap: 3 });
  nextY = Math.max(doc.y + 4, y + 20);
  drawDottedLine(nextY - 2);

  // 2 baris kosong nominal
  for (let i = 0; i < 2; i++) {
    y = nextY + 4;
    nextY = y + 18;
    drawDottedLine(nextY - 2);
  }

  // TANDA TANGAN VERIFIKATOR (Center di tengah kertas persis format contoh)
  const sigY = 618;
  doc.font('Helvetica').fontSize(11).text((d.s.kota || 'Gemolong') + ', ………………………….', 0, sigY, { width: W, align: 'center' });
  doc.text('Verifikator', 0, sigY + 18, { width: W, align: 'center' });

  const nameY = sigY + 95;
  doc.font('Helvetica-Bold').fontSize(11).text(d.ver.nama, 0, nameY, { width: W, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(11).text(nipTxt(d.ver.nip), 0, nameY + 18, { width: W, align: 'center' });

  return doc;
}

/* ======================= Lembar Verifikasi - DOCX ======================= */
async function verifDocx(d) {
  const W_PAGE = 11906; // F4 width
  const M_HORIZ = 1440; // 1 inch margins
  const W_CONTENT = W_PAGE - 2 * M_HORIZ; // 9026 dxa

  // Kop Surat
  const wLogoLeft = 1400;
  const wLogoRight = 1400;
  const wKopMid = W_CONTENT - wLogoLeft - wLogoRight;

  const kopTxt = [
    para(run(d.s.pemda || 'PEMERINTAH KABUPATEN SRAGEN', { bold: true, size: 24 }), { align: D.AlignmentType.CENTER, line: 280 }),
    para(run(d.s.instansi || 'RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 30 }), { align: D.AlignmentType.CENTER, line: 320 }),
    para(run(d.s.alamat || 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274', { size: 17 }), { align: D.AlignmentType.CENTER, line: 240 }),
    para(run(d.s.kontak || 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com', { size: 17 }), { align: D.AlignmentType.CENTER, line: 240 }),
  ];

  const kop = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [wLogoLeft, wKopMid, wLogoRight],
    borders: {
      ...NOBORDER,
      bottom: { style: D.BorderStyle.DOUBLE, size: 12, color: '000000' },
      insideHorizontal: NONE,
      insideVertical: NONE,
    },
    rows: [
      new D.TableRow({
        children: [
          cell(para(new D.ImageRun({ data: LOGO_PEMDA, type: 'png', transformation: { width: 56, height: 71 } }), { align: D.AlignmentType.CENTER }), { w: wLogoLeft }),
          cell(kopTxt, { w: wKopMid }),
          cell(para(new D.ImageRun({ data: LOGO_RS, type: 'png', transformation: { width: 68, height: 65 } }), { align: D.AlignmentType.CENTER }), { w: wLogoRight }),
        ],
      }),
    ],
  });

  // Tabel Verifikasi (persis 3 kolom: Label, Kolon, Nilai dengan garis putus-putus dashSmallGap)
  const CW = [2239, 485, 5744]; // Total = 8468 dxa
  const tableIndent = 558;

  const makeRow = (col1Text, isColon, col3Content, { boldCol3 = false, hasBottom = true } = {}) => {
    return new D.TableRow({
      children: [
        cell(para(run(col1Text, { size: 22 }), { line: 300 }), { w: CW[0] }),
        cell(para(run(isColon ? ':' : '', { size: 22 }), { align: D.AlignmentType.CENTER, line: 300 }), { w: CW[1] }),
        cell(para(run(col3Content, { size: 22, bold: boldCol3 }), { line: 300 }), { w: CW[2], b: hasBottom ? DASH_BORDER : NONE }),
      ],
    });
  };

  const rows = [
    // Kegiatan
    makeRow('Kegiatan', true, d.rek.uraian, { boldCol3: true }),
    makeRow('', false, d.t.uraian, { boldCol3: false }),
    makeRow('', false, '', { boldCol3: false }),
    // Penyedia
    makeRow('Penyedia', true, d.t.penyedia, { boldCol3: true }),
    makeRow('', false, '', { boldCol3: false }),
    makeRow('', false, '', { boldCol3: false }),
    makeRow('', false, '', { boldCol3: false }),
    // Nominal
    makeRow('Nominal', true, rupiah(d.t.kotor) + ',-', { boldCol3: true }),
    makeRow('', false, '(' + d.terbilang + ')', { boldCol3: true }),
    makeRow('', false, '', { boldCol3: false }),
    makeRow('', false, '', { boldCol3: false }),
  ];

  const mainTable = new D.Table({
    width: { size: 8468, type: D.WidthType.DXA },
    indent: { size: tableIndent, type: D.WidthType.DXA },
    columnWidths: CW,
    borders: NOBORDER,
    rows,
  });

  // Tanda Tangan
  const sigParas = [
    para(run((d.s.kota || 'Gemolong') + ', ………………………….', { size: 22 }), { align: D.AlignmentType.CENTER, before: 600, line: 320 }),
    para(run('Verifikator', { size: 22 }), { align: D.AlignmentType.CENTER, line: 320 }),
    para(run(''), { before: 900 }),
    para(run(d.ver.nama, { size: 22, bold: true, underline: true }), { align: D.AlignmentType.CENTER, line: 320 }),
    para(run(nipTxt(d.ver.nip), { size: 22 }), { align: D.AlignmentType.CENTER, line: 320 }),
  ];

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'Lembar Verifikasi',
    sections: [
      {
        properties: {
          page: {
            size: { width: W_PAGE, height: 18709 },
            margin: { top: 1000, bottom: 1000, left: M_HORIZ, right: M_HORIZ },
          },
        },
        children: [
          kop,
          para(run('VERIFIKASI', { bold: true, size: 28, underline: true }), { align: D.AlignmentType.CENTER, before: 360, after: 360 }),
          mainTable,
          ...sigParas,
        ],
      },
    ],
  });

  return D.Packer.toBuffer(docx);
}

/* ======================= Tabel Item Bersama (SP & BAST) - PDF ======================= */
function drawItemTablePdf(doc, d, yStart) {
  const X0 = 70;
  // Total width = 455 pt (70 .. 525)
  const CW = [28, 152, 52, 55, 84, 84];
  const X = [X0];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);
  const W_TBL = X[6] - X0;

  const seg = (x1, y1, x2, y2, w = 0.6) =>
    doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

  let y = yStart;
  const hHdr = 28;
  // Header box
  seg(X[0], y, X[6], y);
  seg(X[0], y + hHdr, X[6], y + hHdr);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hHdr);

  doc.font('Helvetica').fontSize(10).fillColor('#000');
  doc.text('No', X[0], y + 9, { width: CW[0], align: 'center' });
  doc.text('Jenis Barang', X[1], y + 9, { width: CW[1], align: 'center' });
  doc.text('Satuan', X[2], y + 9, { width: CW[2], align: 'center' });
  doc.text('Kuantitas', X[3], y + 9, { width: CW[3], align: 'center' });
  doc.text('Harga Satuan\n(Rp)', X[4], y + 3, { width: CW[4], align: 'center', lineGap: 1 });
  doc.text('Harga Total\n(Rp)', X[5], y + 3, { width: CW[5], align: 'center', lineGap: 1 });
  y += hHdr;

  let jumlah = 0;
  for (let idx = 0; idx < d.items.length; idx++) {
    const it = d.items[idx];
    const qty = Number(it.kuantitas) || 0;
    const hs = Number(it.harga_satuan) || 0;
    const ht = Number(it.harga_total) || Math.round(qty * hs);
    jumlah += ht;

    doc.font('Helvetica').fontSize(10);
    const textH = doc.heightOfString(String(it.jenis_barang || ''), { width: CW[1] - 8, lineGap: 1 });
    const rowH = Math.max(24, textH + 8);

    seg(X[0], y + rowH, X[6], y + rowH);
    for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + rowH);

    doc.text(`${idx + 1}.`, X[0] + 4, y + 4, { width: CW[0] - 6, align: 'left' });
    doc.text(String(it.jenis_barang || ''), X[1] + 4, y + 4, { width: CW[1] - 8, align: 'left', lineGap: 1 });
    doc.text(String(it.satuan || 'Unit'), X[2] + 2, y + 4, { width: CW[2] - 4, align: 'center' });
    doc.text(String(qty % 1 === 0 ? qty : qty.toLocaleString('id-ID')), X[3] + 2, y + (rowH - 10) / 2, { width: CW[3] - 4, align: 'center' });
    doc.text(fmtNum(hs), X[4] + 4, y + (rowH - 10) / 2, { width: CW[4] - 8, align: 'center' });
    doc.text(fmtNum(ht), X[5] + 4, y + (rowH - 10) / 2, { width: CW[5] - 8, align: 'center' });
    y += rowH;
  }

  // Empty spacer row
  const hEmpty = 16;
  seg(X[0], y + hEmpty, X[6], y + hEmpty);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hEmpty);
  y += hEmpty;

  // Row: Jumlah
  const hJml = 16;
  seg(X[0], y + hJml, X[6], y + hJml);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hJml);
  doc.font('Helvetica').fontSize(10);
  doc.text('Jumlah', X[1] + 4, y + 3, { width: CW[1] - 8 });
  doc.text(fmtNum(jumlah), X[5] + 4, y + 3, { width: CW[5] - 8, align: 'center' });
  y += hJml;

  // Row: Dibulatkan (termasuk PPN 11%)
  const hBulat = 26;
  doc.save().rect(X[2], y, X[5] - X[2], hBulat).fill('#d9d9d9').restore();
  seg(X[0], y + hBulat, X[6], y + hBulat);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hBulat);
  doc.fillColor('#000').font('Helvetica').fontSize(10);
  doc.text('Dibulatkan\n(termasuk PPN 11%)', X[1] + 4, y + 2, { width: CW[1] - 8, lineGap: 1 });
  doc.text(fmtNum(d.t.kotor || jumlah), X[5] + 4, y + 8, { width: CW[5] - 8, align: 'center' });
  y += hBulat;

  // Row: Terbilang
  const tbText = `${d.terbilang}.`;
  doc.font('Helvetica-Oblique').fontSize(10);
  const tbH = Math.max(18, doc.heightOfString('Terbilang : ' + tbText, { width: W_TBL - 10 }) + 6);
  seg(X[0], y + tbH, X[6], y + tbH);
  seg(X[0], y, X[0], y + tbH);
  seg(X[6], y, X[6], y + tbH);

  doc.font('Helvetica').fontSize(10).text('Terbilang : ', X[0] + 4, y + 4, { continued: true });
  doc.font('Helvetica-Oblique').text(tbText);
  y += tbH;

  return y;
}

/* ======================= 1. SURAT PESANAN - PDF ======================= */
function spPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Surat Pesanan' } });
  const W = doc.page.width;
  let y = drawKop(doc, d.s, 32);

  y += 6;
  doc.font('Helvetica-Bold').fontSize(11.5).text('SURAT PESANAN', 0, y, { width: W, align: 'center' });

  y += 26;
  const xLeft = 70;
  const xRight = 308;
  const wRight = 525 - xRight;

  const kotaSp = d.s.kota_sp || 'Sragen';
  const tglSp = tglIndo(d.t.sp_tanggal || d.t.tanggal);
  doc.font('Helvetica').fontSize(10.5).text(`${kotaSp}, ${tglSp}`, xRight, y, { width: wRight });

  y += 18;
  const noSp = d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`;
  doc.text('No', xLeft, y);
  doc.text(': ' + noSp, xLeft + 28, y);
  doc.text('Kepada Yth.', xRight, y);

  y += 16;
  doc.text('Hal', xLeft, y);
  doc.text(': Surat Pesanan', xLeft + 28, y);
  const jabPenyedia = d.t.penyedia_jabatan || 'Direktur';
  const namaPenyedia = (d.t.penyedia || '').replace(/\n/g, ' ');
  doc.text(`${jabPenyedia} ${namaPenyedia}`, xRight, y, { width: wRight });

  const afterNamaY = Math.max(doc.y + 2, y + 14);
  if (d.t.penyedia_alamat) {
    doc.text(d.t.penyedia_alamat, xRight, afterNamaY, { width: wRight, lineGap: 1.5 });
  }
  y = Math.max(doc.y + 16, y + 46);

  doc.font('Helvetica').fontSize(10.5);
  doc.text('Dengan hormat,', xLeft, y);
  y += 16;
  doc.text(
    'Untuk menunjang pelayanan di RSUD dr. Soeratno Gemolong, maka kami bermaksud untuk memesan barang sebagai berikut :',
    xLeft,
    y,
    { width: 455, lineGap: 3 }
  );
  y = doc.y + 10;

  y = drawItemTablePdf(doc, d, y);

  y += 18;
  const tglKirim = tglIndo(d.t.sp_tgl_kirim || d.t.tanggal);
  doc.font('Helvetica').fontSize(10.5).text(
    `Barang-barang yang kami pesan tersebut kami harap dapat segera dikirim selambat-lambatnya pada tanggal ${tglKirim}.`,
    xLeft,
    y,
    { width: 455, lineGap: 3 }
  );
  y = doc.y + 14;
  doc.text(
    'Demikian surat ini kami buat, atas perhatian dan kerja samanya kami sampaian terima kasih.',
    xLeft,
    y,
    { width: 455, lineGap: 3 }
  );

  y = doc.y + 18;
  const xSig = 310, wSig = 215;
  doc.text('Hormat kami,', xSig, y, { width: wSig, align: 'center' });
  doc.text('Pejabat Pengadaan', xSig, y + 14, { width: wSig, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xSig, y + 28, { width: wSig, align: 'center' });

  const yName = y + 84;
  doc.font('Helvetica').fontSize(10.5).text(d.pengadaan.nama || '………………………………', xSig, yName, { width: wSig, align: 'center', underline: true });
  doc.text(nipTxt(d.pengadaan.nip), xSig, yName + 14, { width: wSig, align: 'center' });

  return doc;
}

/* ======================= 4. BAST - PDF ======================= */
function bastPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BAST Hasil Pekerjaan' } });
  const W = doc.page.width;
  let y = drawKop(doc, d.s, 30);

  y += 2;
  const noBast = d.t.bast_nomor || `000.3.2/${d.t.bast_no_urut || '1631'}/05.1.2/${d.tahun}`;
  doc.font('Helvetica-Bold').fontSize(11).text('BERITA ACARA SERAH TERIMA HASIL PEKERJAAN', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.font('Helvetica').fontSize(10.5).text(`Nomor : ${noBast}`, 0, y, { width: W, align: 'center' });

  y += 20;
  const xLeft = 70;
  const wFull = 455;
  const kal = tglKalimatBast(d.t.bast_tanggal || d.t.tanggal);

  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf} yang bertanda tangan dibawah ini :`,
    xLeft,
    y,
    { width: wFull, lineGap: 2 }
  );
  y = doc.y + 10;

  const drawPartyRow = (label, val) => {
    doc.text(label, xLeft + 20, y);
    doc.text(': ' + (val || '-'), xLeft + 92, y, { width: wFull - 92 });
    y = Math.max(doc.y + 1, y + 13);
  };

  doc.text('I.', xLeft, y);
  doc.text('Dari Pihak Penyedia', xLeft + 20, y);
  y += 13;
  drawPartyRow('Nama', d.t.penyedia_pimpinan || '-');
  drawPartyRow('Jabatan', d.t.penyedia_jabatan || 'Direktur');
  drawPartyRow('Alamat', d.t.penyedia_alamat || '-');

  y += 6;
  doc.text('II.', xLeft, y);
  doc.text('Dari Pihak Pejabat Pembuat Komitmen ( PPK )', xLeft + 20, y);
  y += 13;
  drawPartyRow('Nama', d.ppkom.nama || '-');
  drawPartyRow('Jabatan', d.t.ppk_jabatan || d.ppkom.jabatan || 'Pejabat Pembuat Komitmen');
  drawPartyRow('Alamat', d.t.ppk_alamat || d.ppkom.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong');
  drawPartyRow('Nomor RBA', d.rek.kode || '-');

  y += 8;
  const is50750 = d.t.mode_pengadaan === '50_750' || !!d.t.pl_json;
  const perikatanLabel = is50750 ? 'Surat Perintah Kerja (SPK)' : 'Surat Pesanan (SP)';
  const noPerikatan = is50750
    ? (d.t.spk_nomor || d.pl?.spk_nomor || `000.3.2/${d.t.spk_no_urut || d.pl?.spk_no_urut || '2673'}/05.1.2/${d.tahun}`)
    : (d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`);
  const tglPerikatan = tglIndo(is50750 ? (d.t.spk_tanggal || d.pl?.spk_tanggal || d.t.tanggal) : (d.t.sp_tanggal || d.t.tanggal));
  const namaRek = (d.rek?.uraian || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  const paketTxt = namaRek && isianUser && namaRek.toLowerCase() !== isianUser.toLowerCase()
    ? `${namaRek} (${isianUser})`
    : (namaRek || isianUser);
  doc.font('Helvetica').fontSize(10).text(
    `Dengan ini Pihak Penyedia telah menyerahkan Hasil Pekerjaan untuk Paket Pekerjaan ${paketTxt} berdasarkan ${perikatanLabel} Nomor : ${noPerikatan} tanggal ${tglPerikatan} kepada Pihak PPK, dalam keadaan baik dengan rincian sebagai berikut :`,
    xLeft,
    y,
    { width: wFull, align: 'justify', lineGap: 2 }
  );
  y = doc.y + 8;

  y = drawItemTablePdf(doc, d, y);

  y += 12;
  doc.font('Helvetica').fontSize(10).text(
    'Demikian Berita Serah Terima ini dibuat dengan sebenarnya dalam rangkap 1 (satu) untuk dipergunakan sebagaimana mestinya.',
    xLeft,
    y,
    { width: wFull, lineGap: 2 }
  );

  y = doc.y + 14;
  const xColL = 70, wColL = 210;
  const xColR = 315, wColR = 210;

  doc.text('Pejabat Pembuat Komitmen', xColL, y, { width: wColL, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xColL, y + 13, { width: wColL, align: 'center' });

  doc.text('Penyedia Barang/Jasa', xColR, y, { width: wColR, align: 'center' });
  doc.text((d.t.penyedia || '').split('\n')[0], xColR, y + 13, { width: wColR, align: 'center' });

  const yName = y + 100;
  doc.text(d.ppkom.nama || '………………………………', xColL, yName, { width: wColL, align: 'center' });
  doc.text(nipTxt(d.ppkom.nip), xColL, yName + 13, { width: wColL, align: 'center' });

  doc.text(d.t.penyedia_pimpinan || '………………………………', xColR, yName, { width: wColR, align: 'center' });
  doc.text(d.t.penyedia_jabatan || 'Direktur', xColR, yName + 13, { width: wColR, align: 'center' });

  return doc;
}

/* ======================= Kop & Tabel Item Bersama - DOCX ======================= */
function makeKopDocx(s, W_CONTENT = 9026) {
  const wLogoLeft = 1400, wLogoRight = 1400, wKopMid = W_CONTENT - wLogoLeft - wLogoRight;
  const kopTxt = [
    para(run(s.pemda || 'PEMERINTAH KABUPATEN SRAGEN', { bold: true, size: 24 }), { align: D.AlignmentType.CENTER, line: 260 }),
    para(run(s.instansi || 'RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 28 }), { align: D.AlignmentType.CENTER, line: 300 }),
    para(run(s.alamat || 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274', { size: 17 }), { align: D.AlignmentType.CENTER, line: 220 }),
    para(run(s.kontak || 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com', { size: 17 }), { align: D.AlignmentType.CENTER, line: 220 }),
  ];
  return new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [wLogoLeft, wKopMid, wLogoRight],
    borders: {
      ...NOBORDER,
      bottom: { style: D.BorderStyle.DOUBLE, size: 12, color: '000000' },
      insideHorizontal: NONE,
      insideVertical: NONE,
    },
    rows: [
      new D.TableRow({
        children: [
          cell(para(new D.ImageRun({ data: LOGO_PEMDA, type: 'png', transformation: { width: 54, height: 68 } }), { align: D.AlignmentType.CENTER }), { w: wLogoLeft }),
          cell(kopTxt, { w: wKopMid }),
          cell(para(new D.ImageRun({ data: LOGO_RS, type: 'png', transformation: { width: 64, height: 62 } }), { align: D.AlignmentType.CENTER }), { w: wLogoRight }),
        ],
      }),
    ],
  });
}

function makeItemTableDocx(d, W_CONTENT = 9026) {
  const CW = [560, 3026, 1040, 1100, 1650, 1650];
  const BDR = { t: SOLID, b: SOLID, l: SOLID, r: SOLID };
  const p = (txt, o = {}) => para(run(txt, { size: 20, bold: o.bold, italics: o.italics }), { align: o.align, line: 240 });

  let jumlah = 0;
  const itemRows = d.items.map((it, idx) => {
    const qty = Number(it.kuantitas) || 0;
    const hs = Number(it.harga_satuan) || 0;
    const ht = Number(it.harga_total) || Math.round(qty * hs);
    jumlah += ht;
    return new D.TableRow({
      children: [
        cell(p(`${idx + 1}.`), { w: CW[0], ...BDR }),
        cell(p(it.jenis_barang), { w: CW[1], ...BDR }),
        cell(p(it.satuan || 'Unit', { align: D.AlignmentType.CENTER }), { w: CW[2], ...BDR }),
        cell(p(String(qty), { align: D.AlignmentType.CENTER }), { w: CW[3], ...BDR }),
        cell(p(fmtNum(hs), { align: D.AlignmentType.CENTER }), { w: CW[4], ...BDR }),
        cell(p(fmtNum(ht), { align: D.AlignmentType.CENTER }), { w: CW[5], ...BDR }),
      ],
    });
  });

  const greyShade = { fill: 'D9D9D9' };
  const greyCell = (w) => new D.TableCell({
    children: [p('')],
    width: { size: w, type: D.WidthType.DXA },
    borders: { top: SOLID, bottom: SOLID, left: SOLID, right: SOLID },
    shading: greyShade,
  });

  return new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: CW,
    rows: [
      new D.TableRow({
        children: [
          cell(p('No', { align: D.AlignmentType.CENTER }), { w: CW[0], ...BDR }),
          cell(p('Jenis Barang', { align: D.AlignmentType.CENTER }), { w: CW[1], ...BDR }),
          cell(p('Satuan', { align: D.AlignmentType.CENTER }), { w: CW[2], ...BDR }),
          cell(p('Kuantitas', { align: D.AlignmentType.CENTER }), { w: CW[3], ...BDR }),
          cell(p('Harga Satuan (Rp)', { align: D.AlignmentType.CENTER }), { w: CW[4], ...BDR }),
          cell(p('Harga Total (Rp)', { align: D.AlignmentType.CENTER }), { w: CW[5], ...BDR }),
        ],
      }),
      ...itemRows,
      new D.TableRow({
        children: CW.map((w) => cell(p(''), { w, ...BDR })),
      }),
      new D.TableRow({
        children: [
          cell(p(''), { w: CW[0], ...BDR }),
          cell(p('Jumlah'), { w: CW[1], ...BDR }),
          cell(p(''), { w: CW[2], ...BDR }),
          cell(p(''), { w: CW[3], ...BDR }),
          cell(p(''), { w: CW[4], ...BDR }),
          cell(p(fmtNum(jumlah), { align: D.AlignmentType.CENTER }), { w: CW[5], ...BDR }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(p(''), { w: CW[0], ...BDR }),
          cell(p('Dibulatkan (termasuk PPN 11%)'), { w: CW[1], ...BDR }),
          greyCell(CW[2]),
          greyCell(CW[3]),
          greyCell(CW[4]),
          cell(p(fmtNum(d.t.kotor || jumlah), { align: D.AlignmentType.CENTER }), { w: CW[5], ...BDR }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(
            para([run('Terbilang : ', { size: 20 }), run(d.terbilang + '.', { size: 20, italics: true })], { line: 240 }),
            { w: W_CONTENT, span: 6, ...BDR }
          ),
        ],
      }),
    ],
  });
}

/* ======================= 1. SURAT PESANAN - DOCX ======================= */
async function spDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const noSp = d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`;
  const tglSp = tglIndo(d.t.sp_tanggal || d.t.tanggal);
  const tglKirim = tglIndo(d.t.sp_tgl_kirim || d.t.tanggal);
  const kotaSp = d.s.kota_sp || 'Sragen';

  const metaTbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [4600, 4426],
    borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('', { size: 21 })), { w: 4600 }),
          cell(para(run(`${kotaSp}, ${tglSp}`, { size: 21 })), { w: 4426 }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run(`No\t: ${noSp}`, { size: 21 })), { w: 4600 }),
          cell(para(run('Kepada Yth.', { size: 21 })), { w: 4426 }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run('Hal\t: Surat Pesanan', { size: 21 })), { w: 4600, v: D.VerticalAlign.TOP }),
          cell([
            para(run(`${d.t.penyedia_jabatan || 'Direktur'} ${(d.t.penyedia || '').replace(/\n/g, ' ')}`, { size: 21 })),
            para(run(d.t.penyedia_alamat || '', { size: 21 })),
          ], { w: 4426 }),
        ],
      }),
    ],
  });

  const sigTbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [4600, 4426],
    borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('')), { w: 4600 }),
          cell([
            para(run('Hormat kami,', { size: 21 }), { align: D.AlignmentType.CENTER }),
            para(run('Pejabat Pengadaan', { size: 21 }), { align: D.AlignmentType.CENTER }),
            para(run('RSUD dr. Soeratno Gemolong', { size: 21 }), { align: D.AlignmentType.CENTER }),
            para(run(''), { before: 700 }),
            para(run(d.pengadaan.nama || '………………………………', { size: 21, underline: true }), { align: D.AlignmentType.CENTER }),
            para(run(nipTxt(d.pengadaan.nip), { size: 21 }), { align: D.AlignmentType.CENTER }),
          ], { w: 4426 }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'Surat Pesanan',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 900, bottom: 900, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('SURAT PESANAN', { bold: true, size: 24 }), { align: D.AlignmentType.CENTER, before: 200, after: 200 }),
        metaTbl,
        para(run('Dengan hormat,', { size: 21 }), { before: 200 }),
        para(run('Untuk menunjang pelayanan di RSUD dr. Soeratno Gemolong, maka kami bermaksud untuk memesan barang sebagai berikut :', { size: 21 }), { before: 100, after: 160 }),
        makeItemTableDocx(d, W_CONTENT),
        para(run(`Barang-barang yang kami pesan tersebut kami harap dapat segera dikirim selambat-lambatnya pada tanggal ${tglKirim}.`, { size: 21 }), { before: 220 }),
        para(run('Demikian surat ini kami buat, atas perhatian dan kerja samanya kami sampaian terima kasih.', { size: 21 }), { before: 140, after: 240 }),
        sigTbl,
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= 4. BAST - DOCX ======================= */
async function bastDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const noBast = d.t.bast_nomor || `000.3.2/${d.t.bast_no_urut || '1631'}/05.1.2/${d.tahun}`;
  const is50750 = d.t.mode_pengadaan === '50_750' || !!d.t.pl_json;
  const perikatanLabel = is50750 ? 'Surat Perintah Kerja (SPK)' : 'Surat Pesanan (SP)';
  const noPerikatan = is50750
    ? (d.t.spk_nomor || d.pl?.spk_nomor || `000.3.2/${d.t.spk_no_urut || d.pl?.spk_no_urut || '2673'}/05.1.2/${d.tahun}`)
    : (d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`);
  const tglPerikatan = tglIndo(is50750 ? (d.t.spk_tanggal || d.pl?.spk_tanggal || d.t.tanggal) : (d.t.sp_tanggal || d.t.tanggal));
  const kal = tglKalimatBast(d.t.bast_tanggal || d.t.tanggal);

  const sigTbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [4513, 4513],
    borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new D.TableRow({
        children: [
          cell([
            para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(''), { before: 1250 }),
            para(run(d.ppkom.nama || '………………………………', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(nipTxt(d.ppkom.nip), { size: 20 }), { align: D.AlignmentType.CENTER }),
          ], { w: 4513 }),
          cell([
            para(run('Penyedia Barang/Jasa', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run((d.t.penyedia || '').split('\n')[0], { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(''), { before: 1250 }),
            para(run(d.t.penyedia_pimpinan || '………………………………', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(d.t.penyedia_jabatan || 'Direktur', { size: 20 }), { align: D.AlignmentType.CENTER }),
          ], { w: 4513 }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'BAST Hasil Pekerjaan',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA SERAH TERIMA HASIL PEKERJAAN', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 160 }),
        para(run(`Nomor : ${noBast}`, { size: 21 }), { align: D.AlignmentType.CENTER, after: 180 }),
        para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf} yang bertanda tangan dibawah ini :`, { size: 20 }), { after: 120 }),
        para(run('I.\tDari Pihak Penyedia', { size: 20 })),
        para(run(`\tNama\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
        para(run(`\tJabatan\t\t: ${d.t.penyedia_jabatan || 'Direktur'}`, { size: 20 })),
        para(run(`\tAlamat\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 }), { after: 100 }),
        para(run('II.\tDari Pihak Pejabat Pembuat Komitmen ( PPK )', { size: 20 })),
        para(run(`\tNama\t\t: ${d.ppkom.nama || '-'}`, { size: 20 })),
        para(run(`\tJabatan\t\t: ${d.t.ppk_jabatan || d.ppkom.jabatan || 'Pejabat Pembuat Komitmen'}`, { size: 20 })),
        para(run(`\tAlamat\t\t: ${d.t.ppk_alamat || d.ppkom.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'}`, { size: 20 })),
        para(run(`\tNomor RBA\t: ${d.rek.kode || '-'}`, { size: 20 }), { after: 140 }),
        para(run(`Dengan ini Pihak Penyedia telah menyerahkan Hasil Pekerjaan untuk Paket Pekerjaan ${
          (d.rek?.uraian || '').trim() && (d.t.uraian || '').trim() && (d.rek?.uraian || '').trim().toLowerCase() !== (d.t.uraian || '').trim().toLowerCase()
            ? `${d.rek.uraian.trim()} (${d.t.uraian.trim()})`
            : (d.rek?.uraian || d.t.uraian || '')
        } berdasarkan ${perikatanLabel} Nomor : ${noPerikatan} tanggal ${tglPerikatan} kepada Pihak PPK, dalam keadaan baik dengan rincian sebagai berikut :`, { size: 20 }), { after: 140 }),
        makeItemTableDocx(d, W_CONTENT),
        para(run('Demikian Berita Serah Terima ini dibuat dengan sebenarnya dalam rangkap 1 (satu) untuk dipergunakan sebagaimana mestinya.', { size: 20 }), { before: 180, after: 200 }),
        sigTbl,
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= 5. BAPHP - PDF (Penyerahan Hasil Pekerjaan PPK -> KPA) ======================= */
function baphpPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BAPHP Hasil Pekerjaan' } });
  const W = doc.page.width;
  let y = drawKop(doc, d.s, 30);

  y += 2;
  const defUrut = d.t.baphp_no_urut || (d.t.bast_no_urut ? `${d.t.bast_no_urut}.a` : '1351.a');
  const noBaphp = d.t.baphp_nomor || `000.3.2/${defUrut}/05.1.2/${d.tahun}`;
  doc.font('Helvetica-Bold').fontSize(11).text('BERITA ACARA PENYERAHAN HASIL PEKERJAAN', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.font('Helvetica').fontSize(10.5).text(`Nomor : ${noBaphp}`, 0, y, { width: W, align: 'center' });

  y += 18;
  const xLeft = 70;
  const wFull = 455;
  const kal = tglKalimatBast(d.t.baphp_tanggal || d.t.bast_tanggal || d.t.tanggal);

  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf} yang bertanda tangan dibawah ini :`,
    xLeft,
    y,
    { width: wFull, lineGap: 2 }
  );
  y = doc.y + 8;

  const drawPartyRow = (label, val) => {
    doc.text(label, xLeft + 20, y);
    doc.text(': ' + (val || '-'), xLeft + 92, y, { width: wFull - 92 });
    y = Math.max(doc.y + 1, y + 12.5);
  };

  doc.text('I.', xLeft, y);
  doc.text('Pejabat Pembuat Komitmen (PPK) RSUD dr. Soeratno Gemolong', xLeft + 20, y);
  y += 12.5;
  drawPartyRow('Nama', d.ppkom.nama || '-');
  drawPartyRow('Jabatan', d.t.ppk_jabatan || d.ppkom.jabatan || 'Kepala Seksi Informasi dan Pemasaran');
  drawPartyRow('Alamat', d.t.ppk_alamat || d.ppkom.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong');

  y += 5;
  doc.text('II.', xLeft, y);
  doc.text('Kuasa Pengguna Anggaran RSUD dr. Soeratno Gemolong', xLeft + 20, y);
  y += 12.5;
  drawPartyRow('Nama', d.kpa.nama || '-');
  drawPartyRow('Jabatan', d.kpa.jabatan || 'Direktur RSUD dr.Soeratno Gemolong');
  drawPartyRow('Alamat', d.kpa.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong');
  drawPartyRow('Nomor RBA', d.rek.kode || '-');

  y += 6;
  const is50750 = d.t.mode_pengadaan === '50_750' || !!d.t.pl_json;
  const perikatanLabel = is50750 ? 'Surat Perintah Kerja (SPK)' : 'Surat Pesanan (SP)';
  const noPerikatan = is50750
    ? (d.t.spk_nomor || d.pl?.spk_nomor || `000.3.2/${d.t.spk_no_urut || d.pl?.spk_no_urut || '2673'}/05.1.2/${d.tahun}`)
    : (d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`);
  const tglPerikatan = tglIndo(is50750 ? (d.t.spk_tanggal || d.pl?.spk_tanggal || d.t.tanggal) : (d.t.sp_tanggal || d.t.tanggal));
  const namaRek = (d.rek?.uraian || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  const paketTxt = namaRek && isianUser && namaRek.toLowerCase() !== isianUser.toLowerCase()
    ? `${namaRek} (${isianUser})`
    : (namaRek || isianUser);

  doc.font('Helvetica').fontSize(10).text(
    `Dengan ini Pihak PPK telah menyerahkan hasil pekerjaan untuk Paket Pekerjaan ${paketTxt} RSUD dr. Soeratno Gemolong berdasarkan ${perikatanLabel} Nomor : ${noPerikatan} tanggal ${tglPerikatan} kepada Pihak Kuasa Pengguna Anggaran dalam keadaan baik dengan rincian sebagai berikut :`,
    xLeft,
    y,
    { width: wFull, align: 'justify', lineGap: 2 }
  );
  y = doc.y + 8;

  y = drawItemTablePdf(doc, d, y);

  y += 10;
  doc.font('Helvetica').fontSize(10).text(
    'Demikian Berita Serah Terima ini dibuat dengan sebenarnya dalam rangkap 1 (satu) untuk dipergunakan sebagaimana mestinya.',
    xLeft,
    y,
    { width: wFull, lineGap: 2 }
  );

  // Pengurus Barang section
  y = doc.y + 10;
  doc.font('Helvetica').fontSize(10).text('Pengurus Barang :', xLeft, y);
  y += 16;
  const pbNama = d.pengurus?.nama || 'Rajendra Prima Ariyanto, S.K.M';
  const pbNip = d.pengurus?.nip || '19830815 202321 1 003';
  doc.text('-', xLeft, y);
  doc.text('Nama', xLeft + 16, y);
  doc.text(': ' + pbNama, xLeft + 62, y);
  doc.text('……………………………..', 385, y);
  y += 13;
  doc.text('-', xLeft, y);
  doc.text('NIP.', xLeft + 16, y);
  doc.text(': ' + pbNip, xLeft + 62, y);

  y += 26;
  const xColL = 70, wColL = 210;
  const xColR = 315, wColR = 210;

  doc.text('Pejabat Pembuat Komitmen', xColL, y, { width: wColL, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xColL, y + 13, { width: wColL, align: 'center' });

  doc.text('Kuasa Pengguna Anggaran', xColR, y, { width: wColR, align: 'center' });
  doc.text(d.kpa.jabatan || 'Direktur RSUD dr. Soeratno Gemolong', xColR, y + 13, { width: wColR, align: 'center' });

  const yName = y + 96;
  doc.text(d.ppkom.nama || '………………………………', xColL, yName, { width: wColL, align: 'center' });
  doc.text(nipTxt(d.ppkom.nip), xColL, yName + 13, { width: wColL, align: 'center' });

  doc.text(d.kpa.nama || '………………………………', xColR, yName, { width: wColR, align: 'center' });
  doc.text(nipTxt(d.kpa.nip), xColR, yName + 13, { width: wColR, align: 'center' });

  return doc;
}

/* ======================= 5. BAPHP - DOCX ======================= */
async function baphpDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const defUrut = d.t.baphp_no_urut || (d.t.bast_no_urut ? `${d.t.bast_no_urut}.a` : '1351.a');
  const noBaphp = d.t.baphp_nomor || `000.3.2/${defUrut}/05.1.2/${d.tahun}`;
  const is50750 = d.t.mode_pengadaan === '50_750' || !!d.t.pl_json;
  const perikatanLabel = is50750 ? 'Surat Perintah Kerja (SPK)' : 'Surat Pesanan (SP)';
  const noPerikatan = is50750
    ? (d.t.spk_nomor || d.pl?.spk_nomor || `000.3.2/${d.t.spk_no_urut || d.pl?.spk_no_urut || '2673'}/05.1.2/${d.tahun}`)
    : (d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`);
  const tglPerikatan = tglIndo(is50750 ? (d.t.spk_tanggal || d.pl?.spk_tanggal || d.t.tanggal) : (d.t.sp_tanggal || d.t.tanggal));
  const kal = tglKalimatBast(d.t.baphp_tanggal || d.t.bast_tanggal || d.t.tanggal);
  const namaRek = (d.rek?.uraian || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  const paketTxt = namaRek && isianUser && namaRek.toLowerCase() !== isianUser.toLowerCase()
    ? `${namaRek} (${isianUser})`
    : (namaRek || isianUser);
  const pbNama = d.pengurus?.nama || 'Rajendra Prima Ariyanto, S.K.M';
  const pbNip = d.pengurus?.nip || '19830815 202321 1 003';

  const sigTbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [4513, 4513],
    borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new D.TableRow({
        children: [
          cell([
            para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(''), { before: 1200 }),
            para(run(d.ppkom.nama || '………………………………', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(nipTxt(d.ppkom.nip), { size: 20 }), { align: D.AlignmentType.CENTER }),
          ], { w: 4513 }),
          cell([
            para(run('Kuasa Pengguna Anggaran', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(d.kpa.jabatan || 'Direktur RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(''), { before: 1200 }),
            para(run(d.kpa.nama || '………………………………', { size: 20 }), { align: D.AlignmentType.CENTER }),
            para(run(nipTxt(d.kpa.nip), { size: 20 }), { align: D.AlignmentType.CENTER }),
          ], { w: 4513 }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'BAPHP Hasil Pekerjaan',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA PENYERAHAN HASIL PEKERJAAN', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run(`Nomor : ${noBaphp}`, { size: 21 }), { align: D.AlignmentType.CENTER, after: 160 }),
        para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf} yang bertanda tangan dibawah ini :`, { size: 20 }), { after: 100 }),
        para(run('I.\tPejabat Pembuat Komitmen (PPK) RSUD dr. Soeratno Gemolong', { size: 20 })),
        para(run(`\tNama\t\t: ${d.ppkom.nama || '-'}`, { size: 20 })),
        para(run(`\tJabatan\t\t: ${d.t.ppk_jabatan || d.ppkom.jabatan || 'Kepala Seksi Informasi dan Pemasaran'}`, { size: 20 })),
        para(run(`\tAlamat\t\t: ${d.t.ppk_alamat || d.ppkom.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'}`, { size: 20 }), { after: 80 }),
        para(run('II.\tKuasa Pengguna Anggaran RSUD dr. Soeratno Gemolong', { size: 20 })),
        para(run(`\tNama\t\t: ${d.kpa.nama || '-'}`, { size: 20 })),
        para(run(`\tJabatan\t\t: ${d.kpa.jabatan || 'Direktur RSUD dr.Soeratno Gemolong'}`, { size: 20 })),
        para(run(`\tAlamat\t\t: ${d.kpa.alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong'}`, { size: 20 })),
        para(run(`\tNomor RBA\t: ${d.rek.kode || '-'}`, { size: 20 }), { after: 120 }),
        para(run(`Dengan ini Pihak PPK telah menyerahkan hasil pekerjaan untuk Paket Pekerjaan ${paketTxt} RSUD dr. Soeratno Gemolong berdasarkan ${perikatanLabel} Nomor : ${noPerikatan} tanggal ${tglPerikatan} kepada Pihak Kuasa Pengguna Anggaran dalam keadaan baik dengan rincian sebagai berikut :`, { size: 20 }), { after: 120 }),
        makeItemTableDocx(d, W_CONTENT),
        para(run('Demikian Berita Serah Terima ini dibuat dengan sebenarnya dalam rangkap 1 (satu) untuk dipergunakan sebagaimana mestinya.', { size: 20 }), { before: 140, after: 140 }),
        para(run('Pengurus Barang :', { size: 20 }), { after: 80 }),
        para(run(`-\tNama\t: ${pbNama}\t\t\t……………………………..`, { size: 20 })),
        para(run(`-\tNIP.\t: ${pbNip}`, { size: 20 }), { after: 200 }),
        sigTbl,
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= 0. SPESIFIKASI TEKNIS / KAK (PDF & DOCX) ======================= */
function getSpektekData(d) {
  const spk = d.spektek || {};
  const listBrg = (d.items || []).map((it) => `${it.jenis_barang} (${it.kuantitas} ${it.satuan || 'Unit'})`).join(', ');
  // PAKET PENGADAAN = nama kode rekening, bukan isian manual
  const namaPaket = d.rek?.uraian || d.t.uraian || spk.paket_pengadaan || 'Pengadaan Barang/Jasa';
  return {
    paket_pengadaan: namaPaket,
    id_rup: spk.id_rup || '-',
    tanggal: spk.tanggal || d.t.hps_tanggal || d.t.sp_tanggal || d.t.tanggal,
    fungsi_umum: spk.fungsi_umum || `Pengadaan ${namaPaket.replace(/^pengadaan\s+/i, '')} ini berfungsi sebagai perangkat/sarana pendukung operasional untuk menunjang pelayanan dan administrasi di RSUD dr. Soeratno Gemolong. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, kelancaran operasional, serta terjaminnya mutu pelayanan rumah sakit.`,
    mutu_merek: spk.mutu_merek || 'Mengacu pada merek pabrikan resmi yang terdaftar pada sistem E-Katalog LKPP / standar kualitas resmi.',
    mutu_standarisasi: spk.mutu_standarisasi || 'Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.',
    mutu_teknis: spk.mutu_teknis || (d.items || []).map((it) => `${it.jenis_barang} (${it.kuantitas} ${it.satuan || 'Unit'})`).join('\n') || '-',
    mutu_kinerja: spk.mutu_kinerja || 'Mampu beroperasi stabil sesuai spesifikasi teknis untuk mendukung beban kerja pelayanan harian di RSUD dr. Soeratno Gemolong.',
    mutu_pdn: spk.mutu_pdn || 'Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.',
    waktu_jangka: spk.waktu_jangka || '30 (tiga puluh) hari kalender sejak penandatanganan kontrak / Surat Pesanan.',
    waktu_lokasi: spk.waktu_lokasi || 'RSUD dr. Soeratno Gemolong\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen',
    waktu_transportasi: spk.waktu_transportasi || 'Menggunakan kemasan/kardus standar pabrikan dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.',
    layanan_tingkat: spk.layanan_tingkat || 'Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.',
    layanan_pelatihan: spk.layanan_pelatihan || 'Penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal) serta uji coba fungsi di lokasi penempatan hingga seluruh barang siap digunakan.',
    layanan_pemeliharaan: spk.layanan_pemeliharaan || 'Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\nApabila barang ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.',
    layanan_lainnya: spk.layanan_lainnya || 'Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.',
    info_lainnya: spk.info_lainnya || `Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\nKelengkapan Perangkat : Setiap unit barang (${listBrg || namaPaket}) yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard) dan Kartu Garansi fisik yang masih berlaku.`,
  };
}

function spektekPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 45, info: { Title: 'Spesifikasi Teknis Pengadaan Barang' } });
  const spk = getSpektekData(d);
  const X0 = 45, W = 505;
  let y = 40;

  const seg = (x1, y1, x2, y2, w = 0.6) =>
    doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

  const checkPage = (needH) => {
    if (y + needH > 880) {
      doc.addPage({ size: [595.28, 935.43], margin: 45 });
      y = 40;
    }
  };

  const drawBoxHeader = (title) => {
    checkPage(26);
    doc.save().rect(X0, y, W, 20).fill('#e6e6e6').restore();
    seg(X0, y, X0 + W, y);
    seg(X0, y + 20, X0 + W, y + 20);
    seg(X0, y, X0, y + 20);
    seg(X0 + W, y, X0 + W, y + 20);
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(9.5).text(title, X0 + 6, y + 5, { width: W - 12, align: 'center' });
    y += 20;
  };

  const drawTwoColRow = (col1, col2, w1 = 155, bold1 = false, judul2 = false) => {
    const w2 = W - w1;
    doc.font(bold1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    const h1 = doc.heightOfString(String(col1 || ''), { width: w1 - 12 });
    doc.font('Helvetica').fontSize(9);
    const h2 = doc.heightOfString(String(col2 || ''), { width: w2 - 12 });
    const rowH = Math.max(20, Math.max(h1, h2) + 10);
    checkPage(rowH);

    seg(X0, y, X0 + W, y);
    seg(X0, y + rowH, X0 + W, y + rowH);
    seg(X0, y, X0, y + rowH);
    seg(X0 + w1, y, X0 + w1, y + rowH);
    seg(X0 + W, y, X0 + W, y + rowH);

    doc.font(bold1 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#000')
      .text(String(col1 || ''), X0 + 6, y + 5, { width: w1 - 12 });
    doc.font(judul2 ? 'Helvetica-Bold' : 'Helvetica').fontSize(9)
      .text(String(col2 || ''), X0 + w1 + 6, y + 5, { width: w2 - 12, align: judul2 ? 'center' : 'justify' });
    y += rowH;
  };

  // Judul Dokumen
  doc.save().rect(X0, y, W, 32).fill('#d9e2ec').restore();
  seg(X0, y, X0 + W, y);
  seg(X0, y + 32, X0 + W, y + 32);
  seg(X0, y, X0, y + 32);
  seg(X0 + W, y, X0 + W, y + 32);
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(10.5)
    .text('DOKUMEN SPESIFIKASI TEKNIS PENGADAAN BARANG\nRSUD dr. SOERATNO GEMOLONG', X0, y + 5, { width: W, align: 'center', lineGap: 2 });
  y += 32;

  drawTwoColRow('PAKET PENGADAAN', spk.paket_pengadaan, 155, true);
  drawTwoColRow('PPK', d.ppkom.nama || '-', 155, true);
  drawTwoColRow('ID RUP', spk.id_rup || '-', 155, true);
  y += 8;

  // SPESIFIKASI FUNGSI UMUM
  drawBoxHeader('SPESIFIKASI FUNGSI UMUM');
  doc.font('Helvetica').fontSize(9);
  const hFungsi = Math.max(28, doc.heightOfString(spk.fungsi_umum, { width: W - 14 }) + 12);
  checkPage(hFungsi);
  seg(X0, y + hFungsi, X0 + W, y + hFungsi);
  seg(X0, y, X0, y + hFungsi);
  seg(X0 + W, y, X0 + W, y + hFungsi);
  doc.text(spk.fungsi_umum, X0 + 7, y + 6, { width: W - 14, align: 'justify' });
  y += hFungsi + 8;

  // SPESIFIKASI MUTU/KUALITAS
  drawBoxHeader('SPESIFIKASI MUTU/KUALITAS');
  drawTwoColRow('Spesifikasi Mutu', 'Uraian Detail', 155, true, true);
  drawTwoColRow('Merek Barang', spk.mutu_merek, 155);
  drawTwoColRow('Standarisasi', spk.mutu_standarisasi, 155);
  drawTwoColRow('Spesifikasi Teknik', spk.mutu_teknis, 155);
  drawTwoColRow('Spesifikasi Kinerja', spk.mutu_kinerja, 155);
  drawTwoColRow('Prioritas Produk Dalam Negeri (PDN)', spk.mutu_pdn, 155);
  y += 8;

  // SPESIFIKASI JUMLAH
  drawBoxHeader('SPESIFIKASI JUMLAH');
  const cwJml = [35, 290, 90, 90];
  const xJml = [X0, X0 + 35, X0 + 325, X0 + 415, X0 + 505];
  checkPage(22);
  seg(X0, y + 20, X0 + W, y + 20);
  for (let i = 0; i <= 4; i++) seg(xJml[i], y, xJml[i], y + 20);
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('No', xJml[0], y + 5, { width: cwJml[0], align: 'center' });
  doc.text('Uraian Barang', xJml[1] + 6, y + 5, { width: cwJml[1] - 12 });
  doc.text('Satuan', xJml[2], y + 5, { width: cwJml[2], align: 'center' });
  doc.text('Volume', xJml[3], y + 5, { width: cwJml[3], align: 'center' });
  y += 20;

  for (let idx = 0; idx < d.items.length; idx++) {
    const it = d.items[idx];
    doc.font('Helvetica').fontSize(9);
    const hIt = Math.max(20, doc.heightOfString(String(it.jenis_barang || ''), { width: cwJml[1] - 12 }) + 8);
    checkPage(hIt);
    seg(X0, y + hIt, X0 + W, y + hIt);
    for (let i = 0; i <= 4; i++) seg(xJml[i], y, xJml[i], y + hIt);
    doc.text(`${idx + 1}.`, xJml[0], y + 5, { width: cwJml[0], align: 'center' });
    doc.text(String(it.jenis_barang || ''), xJml[1] + 6, y + 5, { width: cwJml[1] - 12 });
    doc.text(String(it.satuan || 'Unit'), xJml[2], y + 5, { width: cwJml[2], align: 'center' });
    doc.text(String(Math.round(Number(it.kuantitas)) || 1), xJml[3], y + 5, { width: cwJml[3], align: 'center' });
    y += hIt;
  }
  y += 8;

  // SPESIFIKASI WAKTU
  drawBoxHeader('SPESIFIKASI WAKTU');
  drawTwoColRow('Uraian', 'Keterangan', 155, true);
  drawTwoColRow('Jangka penyelesaian pekerjaan', spk.waktu_jangka, 155);
  drawTwoColRow('Lokasi kedatangan barang', spk.waktu_lokasi, 155);
  drawTwoColRow('Metode transportasi dan pengepakan', spk.waktu_transportasi, 155);
  y += 8;

  // SPESIFIKASI PELAYANAN
  drawBoxHeader('SPESIFIKASI PELAYANAN');
  drawTwoColRow('Uraian', 'Keterangan', 155, true);
  drawTwoColRow('Tingkat pelayanan barang/jasa', spk.layanan_tingkat, 155);
  drawTwoColRow('Pelatihan dan Bantuan Teknis dari Penyedia Barang/Jasa', spk.layanan_pelatihan, 155);
  drawTwoColRow('Pemeliharaan', spk.layanan_pemeliharaan, 155);
  drawTwoColRow('Informasi lainnya terkait spesifikasi pelayanan', spk.layanan_lainnya, 155);
  y += 8;

  // INFORMASI LAINNYA
  drawBoxHeader('INFORMASI LAINNYA');
  doc.font('Helvetica').fontSize(9);
  const hInfo = Math.max(28, doc.heightOfString(spk.info_lainnya, { width: W - 14 }) + 12);
  checkPage(hInfo);
  seg(X0, y + hInfo, X0 + W, y + hInfo);
  seg(X0, y, X0, y + hInfo);
  seg(X0 + W, y, X0 + W, y + hInfo);
  doc.text(spk.info_lainnya, X0 + 7, y + 6, { width: W - 14, align: 'justify' });
  y += hInfo + 16;

  // Tanda Tangan PPK
  checkPage(125);
  const xSig = 310, wSig = 220;
  doc.font('Helvetica').fontSize(9.5);
  doc.text(`Ditetapkan di Sragen tanggal ${tglIndo(spk.tanggal)}`, xSig, y, { width: wSig, align: 'center' });
  doc.text('Pejabat Pembuat Komitmen', xSig, y + 14, { width: wSig, align: 'center' });
  doc.font('Helvetica-Bold').text(d.ppkom.nama || '………………………………', xSig, y + 88, { width: wSig, align: 'center', underline: true });
  doc.font('Helvetica').text(nipTxt(d.ppkom.nip), xSig, y + 101, { width: wSig, align: 'center' });

  return doc;
}

async function spektekDocx(d) {
  const spk = getSpektekData(d);
  const W_PAGE = 11906, M_HORIZ = 1134, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const wL = 3200, wR = W_CONTENT - wL;
  const bdrAll = { t: SOLID, b: SOLID, l: SOLID, r: SOLID };

  const row2Col = (k, v, boldK = false, judul2 = false) =>
    new D.TableRow({
      children: [
        cell(para(run(k, { size: 19, bold: boldK })), { w: wL, ...bdrAll, mt: 60, mb: 60, ml: 100, mr: 100 }),
        cell(
          String(v || '').split('\n').map((ln) => para(run(ln, { size: 19, bold: judul2 }), judul2 ? { align: D.AlignmentType.CENTER } : {})),
          { w: wR, ...bdrAll, mt: 60, mb: 60, ml: 100, mr: 100 }
        ),
      ],
    });

  const rowHeaderFull = (title) =>
    new D.TableRow({
      children: [
        cell(para(run(title, { size: 20, bold: true }), { align: D.AlignmentType.CENTER }), { w: W_CONTENT, span: 2, ...bdrAll, mt: 80, mb: 80 }),
      ],
    });

  const tblMain = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [wL, wR],
    rows: [
      rowHeaderFull('DOKUMEN SPESIFIKASI TEKNIS PENGADAAN BARANG\nRSUD dr. SOERATNO GEMOLONG'),
      row2Col('PAKET PENGADAAN', spk.paket_pengadaan, true),
      row2Col('PPK', d.ppkom.nama || '-', true),
      row2Col('ID RUP', spk.id_rup || '-', true),
      rowHeaderFull('SPESIFIKASI FUNGSI UMUM'),
      new D.TableRow({
        children: [
          cell(para(run(spk.fungsi_umum, { size: 19 })), { w: W_CONTENT, span: 2, ...bdrAll, mt: 80, mb: 80, ml: 100, mr: 100 }),
        ],
      }),
      rowHeaderFull('SPESIFIKASI MUTU/KUALITAS'),
      row2Col('Spesifikasi Mutu', 'Uraian Detail', true, true),
      row2Col('Merek Barang', spk.mutu_merek),
      row2Col('Standarisasi', spk.mutu_standarisasi),
      row2Col('Spesifikasi Teknik', spk.mutu_teknis),
      row2Col('Spesifikasi Kinerja', spk.mutu_kinerja),
      row2Col('Prioritas Produk Dalam Negeri (PDN)', spk.mutu_pdn),
      rowHeaderFull('SPESIFIKASI WAKTU'),
      row2Col('Uraian', 'Keterangan', true),
      row2Col('Jangka penyelesaian pekerjaan', spk.waktu_jangka),
      row2Col('Lokasi kedatangan barang', spk.waktu_lokasi),
      row2Col('Metode transportasi dan pengepakan', spk.waktu_transportasi),
      rowHeaderFull('SPESIFIKASI PELAYANAN'),
      row2Col('Uraian', 'Keterangan', true),
      row2Col('Tingkat pelayanan barang/jasa', spk.layanan_tingkat),
      row2Col('Pelatihan dan Bantuan Teknis dari Penyedia Barang/Jasa', spk.layanan_pelatihan),
      row2Col('Pemeliharaan', spk.layanan_pemeliharaan),
      row2Col('Informasi lainnya terkait spesifikasi pelayanan', spk.layanan_lainnya),
      rowHeaderFull('INFORMASI LAINNYA'),
      new D.TableRow({
        children: [
          cell(String(spk.info_lainnya || '').split('\n').map((ln) => para(run(ln, { size: 19 }))), { w: W_CONTENT, span: 2, ...bdrAll, mt: 80, mb: 80, ml: 100, mr: 100 }),
        ],
      }),
    ],
  });

  const cwJ = [700, W_CONTENT - 3300, 1300, 1300];
  const tblJumlah = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: cwJ,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('SPESIFIKASI JUMLAH', { size: 20, bold: true }), { align: D.AlignmentType.CENTER }), { w: W_CONTENT, span: 4, ...bdrAll, mt: 80, mb: 80 }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run('No', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cwJ[0], ...bdrAll }),
          cell(para(run('Uraian Barang', { size: 19, bold: true })), { w: cwJ[1], ...bdrAll }),
          cell(para(run('Satuan', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cwJ[2], ...bdrAll }),
          cell(para(run('Volume', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cwJ[3], ...bdrAll }),
        ],
      }),
      ...d.items.map((it, idx) => new D.TableRow({
        children: [
          cell(para(run(`${idx + 1}.`, { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cwJ[0], ...bdrAll }),
          cell(para(run(it.jenis_barang || '', { size: 19 })), { w: cwJ[1], ...bdrAll }),
          cell(para(run(it.satuan || 'Unit', { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cwJ[2], ...bdrAll }),
          cell(para(run(String(Math.round(Number(it.kuantitas)) || 1), { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cwJ[3], ...bdrAll }),
        ],
      })),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'Spesifikasi Teknis / KAK',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        tblMain,
        para(run(''), { before: 120 }),
        tblJumlah,
        para(run(`Ditetapkan di Sragen tanggal ${tglIndo(spk.tanggal)}`, { size: 20 }), { align: D.AlignmentType.RIGHT, before: 240 }),
        para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.RIGHT }),
        para(run(''), { before: 1200 }),
        para(run(d.ppkom.nama || '………………………………', { size: 20, bold: true, underline: true }), { align: D.AlignmentType.RIGHT }),
        para(run(nipTxt(d.ppkom.nip), { size: 20 }), { align: D.AlignmentType.RIGHT }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= 5. HPS - PDF & DOCX ======================= */
function hpsPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Berita Acara Penetapan HPS' } });
  const W = doc.page.width;
  const noHps = d.t.hps_nomor || `000.3.2/${d.t.hps_no_urut || '1286'}/05.1.2/${d.tahun}`;
  const tglHps = d.t.hps_tanggal || d.t.sp_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglHps);
  const namaKerja = d.rek?.uraian || d.t.uraian || '-';

  // Halaman 1: Berita Acara Penetapan HPS
  let y = drawKop(doc, d.s, 30);
  y += 6;
  doc.font('Helvetica-Bold').fontSize(11).text('BERITA ACARA', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.text('PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.font('Helvetica').fontSize(10.5).text(`Nomor : ${noHps}`, 0, y, { width: W, align: 'center' });

  y += 24;
  const xLeft = 70, wFull = 455;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + namaKerja, xLeft + 115, y, { width: wFull - 115 });
  y = Math.max(doc.y + 3, y + 15);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. Soeratno Gemolong', xLeft + 115, y);
  y += 15;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 115, y);

  y += 22;
  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, yang bertanda tangan di bawah ini :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2 }
  );
  y = doc.y + 12;

  doc.text('Nama', xLeft + 20, y); doc.text(': ' + (d.ppkom.nama || '-'), xLeft + 150, y);
  y += 15;
  doc.text('NIP', xLeft + 20, y); doc.text(': ' + (d.ppkom.nip || '-'), xLeft + 150, y);
  y += 15;
  doc.text('Jabatan dalam kegiatan', xLeft + 20, y); doc.text(': Pejabat Pembuat Komitmen', xLeft + 150, y);

  y += 22;
  doc.text(
    `bahwa pada tanggal tersebut di atas, Pejabat Pembuat Komitmen telah menyusun Harga Perkiraan Sendiri (HPS) Kegiatan ${namaKerja} berdasarkan kriteria penetapan harga yang telah meliputi survei harga, Indeks Harga Kabupaten Sragen Tahun ${d.tahun} dan Kontrak SPK Sejenis tahun sebelumnya.`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 12;
  doc.text(
    'Berdasarkan kriteria tersebut diatas, Pejabat Pembuat Komitmen mengambil keputusan menetapkan Harga Perkiraan Sendiri (HPS) termasuk pajak-pajak dan keuntungan penyedia jasa sesuai ketentuan yang berlaku sebagaimana lampiran Berita Acara ini.',
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );

  y = doc.y + 28;
  const xSig = 300, wSig = 225;
  doc.text('Untuk dan atas nama', xSig, y, { width: wSig, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xSig, y + 14, { width: wSig, align: 'center' });
  doc.text('Pejabat Pembuat Komitmen', xSig, y + 28, { width: wSig, align: 'center' });
  doc.font('Helvetica-Bold').text(d.ppkom.nama || '………………………………', xSig, y + 106, { width: wSig, align: 'center', underline: true });
  doc.font('Helvetica').text(nipTxt(d.ppkom.nip), xSig, y + 120, { width: wSig, align: 'center' });

  // Halaman 2: Lampiran HPS
  doc.addPage({ size: [595.28, 935.43], margin: 0 });
  y = 45;
  doc.font('Helvetica-Bold').fontSize(10.5).text('Lampiran', xLeft, y);
  y += 14;
  doc.text('Berita Acara Penetapan Harga Perkiraan Sendiri (HPS)', xLeft, y);
  y += 15;
  doc.font('Helvetica').fontSize(10);
  doc.text('Nomor', xLeft, y); doc.text(': ' + noHps, xLeft + 60, y);
  y += 14;
  doc.text('Tanggal', xLeft, y); doc.text(': ' + tglIndo(tglHps), xLeft + 60, y);

  y += 18;
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + namaKerja, xLeft + 115, y, { width: wFull - 115 });
  y = Math.max(doc.y + 2, y + 14);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. Soeratno Gemolong', xLeft + 115, y);
  y += 14;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 115, y);
  y += 18;

  // Tabel Lampiran HPS: No | Uraian | Unit/Satuan | Kuantitas/Volume | Harga Satuan (Rp) | Jumlah (Rp)
  const CW = [28, 152, 52, 55, 84, 84];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);
  const seg = (x1, y1, x2, y2, w = 0.6) =>
    doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

  const hHdr = 28;
  seg(X[0], y, X[6], y);
  seg(X[0], y + hHdr, X[6], y + hHdr);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hHdr);
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text('No', X[0], y + 9, { width: CW[0], align: 'center' });
  doc.text('Uraian', X[1], y + 9, { width: CW[1], align: 'center' });
  doc.text('Unit/\nSatuan', X[2], y + 3, { width: CW[2], align: 'center' });
  doc.text('Kuantitas/\nVolume', X[3], y + 3, { width: CW[3], align: 'center' });
  doc.text('Harga Satuan\n(Rp)', X[4], y + 3, { width: CW[4], align: 'center' });
  doc.text('Jumlah\n(Rp)', X[5], y + 3, { width: CW[5], align: 'center' });
  y += hHdr;

  // Baris nomor kolom 1..6
  const hNum = 16;
  doc.save().rect(X[0], y, X[6] - X[0], hNum).fill('#e6e6e6').restore();
  seg(X[0], y + hNum, X[6], y + hNum);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hNum);
  doc.fillColor('#000').font('Helvetica-Oblique').fontSize(8.5);
  for (let i = 0; i < 6; i++) doc.text(String(i + 1), X[i], y + 3, { width: CW[i], align: 'center' });
  y += hNum;

  let totalHps = 0;
  for (let idx = 0; idx < d.items.length; idx++) {
    const it = d.items[idx];
    const qty = Number(it.kuantitas) || 1;
    const hSat = Number(it.harga_hps) || Number(it.harga_satuan) || 0;
    const hJml = Math.round(qty * hSat);
    totalHps += hJml;

    doc.font('Helvetica').fontSize(9.5);
    const th = doc.heightOfString(String(it.jenis_barang || ''), { width: CW[1] - 8 });
    const rH = Math.max(22, th + 8);
    seg(X[0], y + rH, X[6], y + rH);
    for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + rH);

    doc.text(`${idx + 1}.`, X[0], y + 5, { width: CW[0], align: 'center' });
    doc.text(String(it.jenis_barang || ''), X[1] + 4, y + 5, { width: CW[1] - 8 });
    doc.text(String(it.satuan || 'Unit'), X[2], y + 5, { width: CW[2], align: 'center' });
    doc.text(String(qty), X[3], y + 5, { width: CW[3], align: 'center' });
    doc.text('Rp' + fmtNum(hSat), X[4] + 4, y + 5, { width: CW[4] - 8, align: 'right' });
    doc.text('Rp' + fmtNum(hJml), X[5] + 4, y + 5, { width: CW[5] - 8, align: 'right' });
    y += rH;
  }

  const finalHps = d.hpsTotal || totalHps;
  const hTot = 24;
  seg(X[0], y + hTot, X[6], y + hTot);
  for (let i = 0; i <= 6; i++) seg(X[i], y, X[i], y + hTot);
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text('Total (termasuk PPN 11%)', X[1] + 4, y + 6, { width: X[5] - X[1] - 8 });
  doc.text('Rp' + fmtNum(finalHps), X[5] + 4, y + 6, { width: CW[5] - 8, align: 'right' });
  y += hTot;

  const tbHps = `Terbilang : ${terbilang(finalHps)} rupiah`;
  doc.font('Helvetica-Oblique').fontSize(9.5);
  const hTb = Math.max(20, doc.heightOfString(tbHps, { width: wFull - 12 }) + 8);
  seg(X[0], y + hTb, X[6], y + hTb);
  seg(X[0], y, X[0], y + hTb);
  seg(X[6], y, X[6], y + hTb);
  doc.text(tbHps, X[0] + 6, y + 5, { width: wFull - 12 });
  y += hTb + 28;

  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pembuat Komitmen', xSig, y, { width: wSig, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xSig, y + 14, { width: wSig, align: 'center' });
  doc.text('Kabupaten Sragen', xSig, y + 28, { width: wSig, align: 'center' });
  doc.font('Helvetica-Bold').text(d.ppkom.nama || '………………………………', xSig, y + 106, { width: wSig, align: 'center', underline: true });
  doc.font('Helvetica').text(nipTxt(d.ppkom.nip), xSig, y + 120, { width: wSig, align: 'center' });

  return doc;
}

async function hpsDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const noHps = d.t.hps_nomor || `000.3.2/${d.t.hps_no_urut || '1286'}/05.1.2/${d.tahun}`;
  const tglHps = d.t.hps_tanggal || d.t.sp_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglHps);
  const namaKerja = d.rek?.uraian || d.t.uraian || '-';
  const finalHps = d.hpsTotal || d.t.kotor || 0;
  const bdrAll = { t: SOLID, b: SOLID, l: SOLID, r: SOLID };
  const cw = [500, 3106, 1000, 1100, 1660, 1660];

  const tblLampiran = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: cw,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('No', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[0], ...bdrAll }),
          cell(para(run('Uraian', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[1], ...bdrAll }),
          cell(para(run('Unit/ Satuan', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[2], ...bdrAll }),
          cell(para(run('Kuantitas/ Volume', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[3], ...bdrAll }),
          cell(para(run('Harga Satuan (Rp)', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[4], ...bdrAll }),
          cell(para(run('Jumlah (Rp)', { size: 19, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[5], ...bdrAll }),
        ],
      }),
      ...d.items.map((it, idx) => {
        const qty = Number(it.kuantitas) || 1;
        const hSat = Number(it.harga_hps) || Number(it.harga_satuan) || 0;
        const hJml = Math.round(qty * hSat);
        return new D.TableRow({
          children: [
            cell(para(run(`${idx + 1}.`, { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cw[0], ...bdrAll }),
            cell(para(run(it.jenis_barang || '', { size: 19 })), { w: cw[1], ...bdrAll }),
            cell(para(run(it.satuan || 'Unit', { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cw[2], ...bdrAll }),
            cell(para(run(String(qty), { size: 19 }), { align: D.AlignmentType.CENTER }), { w: cw[3], ...bdrAll }),
            cell(para(run('Rp' + fmtNum(hSat), { size: 19 }), { align: D.AlignmentType.RIGHT }), { w: cw[4], ...bdrAll }),
            cell(para(run('Rp' + fmtNum(hJml), { size: 19 }), { align: D.AlignmentType.RIGHT }), { w: cw[5], ...bdrAll }),
          ],
        });
      }),
      new D.TableRow({
        children: [
          cell(para(run('Total (termasuk PPN 11%)', { size: 19, bold: true })), { w: cw.slice(0, 5).reduce((a, b) => a + b, 0), span: 5, ...bdrAll }),
          cell(para(run('Rp' + fmtNum(finalHps), { size: 19, bold: true }), { align: D.AlignmentType.RIGHT }), { w: cw[5], ...bdrAll }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run(`Terbilang : ${terbilang(finalHps)} rupiah`, { size: 19, italics: true })), { w: W_CONTENT, span: 6, ...bdrAll }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'Berita Acara Penetapan HPS',
    sections: [
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          makeKopDocx(d.s, W_CONTENT),
          para(run('BERITA ACARA', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
          para(run('PENETAPAN HARGA PERKIRAAN SENDIRI (HPS)', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER }),
          para(run(`Nomor : ${noHps}`, { size: 21 }), { align: D.AlignmentType.CENTER, after: 200 }),
          para(run(`PEKERJAAN\t\t: ${namaKerja}`, { bold: true, size: 20 })),
          para(run('SUMBER DANA\t: BLUD RSUD dr. Soeratno Gemolong', { bold: true, size: 20 })),
          para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 160 }),
          para(run(`Pada hari ini ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, yang bertanda tangan di bawah ini :`, { size: 20 }), { after: 100 }),
          para(run(`Nama\t\t\t\t: ${d.ppkom.nama || '-'}`, { size: 20 })),
          para(run(`NIP\t\t\t\t: ${d.ppkom.nip || '-'}`, { size: 20 })),
          para(run('Jabatan dalam kegiatan\t: Pejabat Pembuat Komitmen', { size: 20 }), { after: 140 }),
          para(run(`bahwa pada tanggal tersebut di atas, Pejabat Pembuat Komitmen telah menyusun Harga Perkiraan Sendiri (HPS) Kegiatan ${namaKerja} berdasarkan kriteria penetapan harga yang telah meliputi survei harga, Indeks Harga Kabupaten Sragen Tahun ${d.tahun} dan Kontrak SPK Sejenis tahun sebelumnya.`, { size: 20 }), { after: 120 }),
          para(run('Berdasarkan kriteria tersebut diatas, Pejabat Pembuat Komitmen mengambil keputusan menetapkan Harga Perkiraan Sendiri (HPS) termasuk pajak-pajak dan keuntungan penyedia jasa sesuai ketentuan yang berlaku sebagaimana lampiran Berita Acara ini.', { size: 20 }), { after: 260 }),
          para(run('Untuk dan atas nama', { size: 20 }), { align: D.AlignmentType.RIGHT }),
          para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.RIGHT }),
          para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.RIGHT }),
          para(run(''), { before: 1200 }),
          para(run(d.ppkom.nama || '………………………………', { size: 20, bold: true, underline: true }), { align: D.AlignmentType.RIGHT }),
          para(run(nipTxt(d.ppkom.nip), { size: 20 }), { align: D.AlignmentType.RIGHT }),
        ],
      },
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          para(run('Lampiran', { bold: true, size: 20 })),
          para(run('Berita Acara Penetapan Harga Perkiraan Sendiri (HPS)', { bold: true, size: 20 })),
          para(run(`Nomor\t: ${noHps}`, { size: 20 })),
          para(run(`Tanggal\t: ${tglIndo(tglHps)}`, { size: 20 }), { after: 140 }),
          para(run(`PEKERJAAN\t\t: ${namaKerja}`, { bold: true, size: 20 })),
          para(run('SUMBER DANA\t: BLUD RSUD dr. Soeratno Gemolong', { bold: true, size: 20 })),
          para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 140 }),
          tblLampiran,
          para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.RIGHT, before: 260 }),
          para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.RIGHT }),
          para(run('Kabupaten Sragen', { size: 20 }), { align: D.AlignmentType.RIGHT }),
          para(run(''), { before: 1200 }),
          para(run(d.ppkom.nama || '………………………………', { size: 20, bold: true, underline: true }), { align: D.AlignmentType.RIGHT }),
          para(run(nipTxt(d.ppkom.nip), { size: 20 }), { align: D.AlignmentType.RIGHT }),
        ],
      },
    ],
  });
  return D.Packer.toBuffer(docx);
}

/* ======================= BA KLARIFIKASI TEKNIS & NEGOSIASI HARGA (PDF & DOCX) ======================= */
function baknPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BA Klarifikasi Teknis dan Negosiasi Harga' } });
  const W = doc.page.width;
  const defUrut = d.t.bakn_no_urut || (d.t.sp_no_urut ? `${d.t.sp_no_urut}.a` : '2613.a');
  const noBakn = d.t.bakn_nomor || `000.3.2/${defUrut}/05.1.2/${d.tahun}`;
  const tglBakn = d.t.bakn_tanggal || d.t.sp_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglBakn);
  const namaRek = (d.rek?.uraian || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  const paketTxt = namaRek || isianUser;

  // Halaman 1: Berita Acara Klarifikasi Teknis dan Negosiasi Harga
  let y = drawKop(doc, d.s, 30);
  y += 6;
  doc.font('Helvetica-Bold').fontSize(11).text('BERITA ACARA', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.text('KLARIFIKASI TEKNIS DAN NEGOSIASI HARGA', 0, y, { width: W, align: 'center' });
  y += 14;
  doc.font('Helvetica').fontSize(10.5).text(`Nomor : ${noBakn}`, 0, y, { width: W, align: 'center' });

  y += 22;
  const xLeft = 70, wFull = 455;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + paketTxt, xLeft + 115, y, { width: wFull - 115 });
  y = Math.max(doc.y + 3, y + 15);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. SOERATNO GEMOLONG', xLeft + 115, y);
  y += 15;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 115, y);

  y += 22;
  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, kami Pejabat Pengadaan telah melakukan negosiasi teknis dan harga terhadap peserta Pengadaan Langsung ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 12;

  doc.font('Helvetica-Bold').fontSize(10).text('Peserta Pengadaan :', xLeft + 20, y);
  y += 16;

  const drawPesertaRow = (no, label, val) => {
    doc.font('Helvetica').fontSize(10);
    doc.text(`${no}.`, xLeft + 20, y);
    doc.text(label, xLeft + 42, y);
    doc.text(': ' + (val || '-'), xLeft + 170, y, { width: wFull - 170, lineGap: 1.5 });
    y = Math.max(doc.y + 3, y + 16);
  };

  const namaPenyedia = (d.t.penyedia || '-').split('\n')[0];
  drawPesertaRow(1, 'Nama Perusahaan', namaPenyedia);
  drawPesertaRow(2, d.t.penyedia_jabatan || 'Direktur', d.t.penyedia_pimpinan || '-');
  drawPesertaRow(3, 'Alamat', d.t.penyedia_alamat || '-');
  drawPesertaRow(4, 'NPWP', d.t.penyedia_npwp || '-');
  drawPesertaRow(5, 'HPS', `Rp${fmtNum(d.hpsTotal)},00 (${d.terbilangHps} rupiah)`);
  drawPesertaRow(6, 'Harga Penawaran', d.penawaranTotal > 0 ? `Rp${fmtNum(d.penawaranTotal)},00 (${d.terbilangPenawaran} rupiah)` : '-');
  drawPesertaRow(7, 'Hasil Negosiasi Teknis', d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan');
  drawPesertaRow(8, 'Hasil Negosiasi Harga', 'Terlampir');

  y += 10;
  doc.font('Helvetica').fontSize(10).text(
    'Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.',
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );

  y = doc.y + 26;
  doc.font('Helvetica').fontSize(10);
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y);
  y += 18;
  doc.text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xLeft, y);
  doc.text('Pejabat Pengadaan', xLeft + 185, y);
  doc.text('................................................', xLeft + 310, y);

  y += 42;
  doc.text(namaPenyedia, xLeft, y);
  y += 18;
  doc.text(d.t.penyedia_pimpinan || '………………………………', xLeft, y);
  doc.text(d.t.penyedia_jabatan || 'Direktur', xLeft + 185, y);
  doc.text('................................................', xLeft + 310, y);

  // Halaman 2: Lampiran Berita Acara Klarifikasi Teknis Dan Negosiasi Harga
  doc.addPage({ size: [595.28, 935.43], margin: 0 });
  y = 50;
  doc.font('Helvetica').fontSize(10.5);
  doc.text('Lampiran', xLeft, y);
  y += 15;
  doc.text('Berita Acara Klarifikasi Teknis Dan Negosiasi Harga', xLeft, y);
  y += 15;
  doc.text('Nomor', xLeft, y); doc.text(': ' + noBakn, xLeft + 65, y);
  y += 15;
  doc.text('Tanggal', xLeft, y); doc.text(': ' + tglIndo(tglBakn), xLeft + 65, y);
  y += 22;

  // Tabel 8 kolom: No(24) | Uraian(135) | Unit/Satuan(40) | Kuantitas/Volume(46) | HPS(52) | Penawaran(52) | Negosiasi(52) | Jumlah(54) = 455
  const CW = [24, 135, 40, 46, 52, 52, 52, 54];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);
  const seg = (x1, y1, x2, y2, w = 0.6) =>
    doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

  const hHdr1 = 15, hHdr2 = 15, hHdrTotal = hHdr1 + hHdr2;
  seg(X[0], y, X[8], y);
  seg(X[0], y + hHdrTotal, X[8], y + hHdrTotal);
  seg(X[4], y + hHdr1, X[7], y + hHdr1);
  for (let i = 0; i <= 4; i++) seg(X[i], y, X[i], y + hHdrTotal);
  for (let i = 5; i <= 6; i++) seg(X[i], y + hHdr1, X[i], y + hHdrTotal);
  seg(X[7], y, X[7], y + hHdrTotal);
  seg(X[8], y, X[8], y + hHdrTotal);

  doc.font('Helvetica').fontSize(8.5).fillColor('#000');
  doc.text('No', X[0], y + 10, { width: CW[0], align: 'center' });
  doc.text('Uraian', X[1], y + 10, { width: CW[1], align: 'center' });
  doc.text('Unit/\nSatuan', X[2], y + 5, { width: CW[2], align: 'center' });
  doc.text('Kuantitas/\nVolume', X[3], y + 5, { width: CW[3], align: 'center' });
  doc.text('Harga Satuan (Rp)', X[4], y + 3, { width: CW[4] + CW[5] + CW[6], align: 'center' });
  doc.text('HPS', X[4], y + hHdr1 + 3, { width: CW[4], align: 'center' });
  doc.text('Penawaran', X[5], y + hHdr1 + 3, { width: CW[5], align: 'center' });
  doc.text('Negosiasi', X[6], y + hHdr1 + 3, { width: CW[6], align: 'center' });
  doc.text('Jumlah\n(Rp)', X[7], y + 5, { width: CW[7], align: 'center' });
  y += hHdrTotal;

  // Baris nomor kolom 1..8
  const hNum = 15;
  doc.save().rect(X[0], y, X[8] - X[0], hNum).fill('#d9d9d9').restore();
  seg(X[0], y + hNum, X[8], y + hNum);
  for (let i = 0; i <= 8; i++) seg(X[i], y, X[i], y + hNum);
  doc.fillColor('#000').font('Helvetica-Oblique').fontSize(8);
  for (let i = 0; i < 8; i++) doc.text(String(i + 1), X[i], y + 3, { width: CW[i], align: 'center' });
  y += hNum;

  let totalNego = 0;
  for (let idx = 0; idx < d.items.length; idx++) {
    const it = d.items[idx];
    const qty = Number(it.kuantitas) || 1;
    const hNego = Number(it.harga_satuan) || 0;
    const hHps = Number(it.harga_hps) || hNego;
    const hPen = Number(it.harga_penawaran) || 0;
    const hJml = Math.round(qty * hNego);
    totalNego += hJml;

    doc.font('Helvetica').fontSize(8.5);
    const th = doc.heightOfString(String(it.jenis_barang || ''), { width: CW[1] - 6 });
    const rH = Math.max(22, th + 8);
    seg(X[0], y + rH, X[8], y + rH);
    for (let i = 0; i <= 8; i++) seg(X[i], y, X[i], y + rH);

    doc.text(`${idx + 1}.`, X[0], y + 5, { width: CW[0], align: 'center' });
    doc.text(String(it.jenis_barang || ''), X[1] + 3, y + 5, { width: CW[1] - 6 });
    doc.text(String(it.satuan || 'Unit'), X[2], y + 5, { width: CW[2], align: 'center' });
    doc.text(String(qty), X[3], y + 5, { width: CW[3], align: 'center' });
    doc.text(fmtNum(hHps), X[4] + 2, y + 5, { width: CW[4] - 4, align: 'right' });
    doc.text(hPen > 0 ? fmtNum(hPen) : '-', X[5] + 2, y + 5, { width: CW[5] - 4, align: 'right' });
    doc.text(fmtNum(hNego), X[6] + 2, y + 5, { width: CW[6] - 4, align: 'right' });
    doc.text(fmtNum(hJml), X[7] + 2, y + 5, { width: CW[7] - 4, align: 'right' });
    y += rH;
  }

  const finalNego = d.t.kotor || totalNego;
  const hTot = 20;
  seg(X[0], y + hTot, X[8], y + hTot);
  for (let i = 0; i <= 8; i++) seg(X[i], y, X[i], y + hTot);
  doc.font('Helvetica').fontSize(8.5);
  doc.text('Total (termasuk PPN 11%)', X[1] + 3, y + 5, { width: X[7] - X[1] - 6 });
  doc.text(fmtNum(finalNego), X[7] + 2, y + 5, { width: CW[7] - 4, align: 'right' });
  y += hTot;

  const tbNego = `Terbilang : ${terbilang(finalNego)} rupiah`;
  const hTb = Math.max(20, doc.heightOfString(tbNego, { width: wFull - CW[0] - 8 }) + 8);
  seg(X[0], y + hTb, X[8], y + hTb);
  seg(X[0], y, X[0], y + hTb);
  seg(X[1], y, X[1], y + hTb);
  seg(X[8], y, X[8], y + hTb);
  doc.text(tbNego, X[1] + 3, y + 5, { width: wFull - CW[0] - 8 });
  y += hTb + 26;

  // Tanda tangan di lampiran, sama seperti pada Berita Acara
  if (y + 130 > doc.page.height - 40) { doc.addPage(); y = 50; }
  const wKol = wFull / 2;
  doc.font('Helvetica').fontSize(10).fillColor('#000');
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y, { width: wKol, align: 'center' });
  doc.text('Pejabat Pengadaan', xLeft, y + 14, { width: wKol, align: 'center' });
  doc.text(namaPenyedia, xLeft + wKol, y, { width: wKol, align: 'center' });
  doc.text('Penyedia Barang/Jasa', xLeft + wKol, y + 14, { width: wKol, align: 'center' });
  doc.font('Helvetica').text(d.pengadaan.nama || '………………………………', xLeft, y + 84, { width: wKol, align: 'center', underline: true });
  doc.font('Helvetica').text(nipTxt(d.pengadaan.nip), xLeft, y + 98, { width: wKol, align: 'center' });
  doc.font('Helvetica').text(d.t.penyedia_pimpinan || '………………………………', xLeft + wKol, y + 84, { width: wKol, align: 'center', underline: true });
  doc.font('Helvetica').text(d.t.penyedia_jabatan || 'Direktur', xLeft + wKol, y + 98, { width: wKol, align: 'center' });

  return doc;
}

async function baknDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const defUrut = d.t.bakn_no_urut || (d.t.sp_no_urut ? `${d.t.sp_no_urut}.a` : '2613.a');
  const noBakn = d.t.bakn_nomor || `000.3.2/${defUrut}/05.1.2/${d.tahun}`;
  const tglBakn = d.t.bakn_tanggal || d.t.sp_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglBakn);
  const namaRek = (d.rek?.uraian || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  const paketTxt = namaRek || isianUser;
  const namaPenyedia = (d.t.penyedia || '-').split('\n')[0];
  const finalNego = d.t.kotor || 0;
  const bdrAll = { t: SOLID, b: SOLID, l: SOLID, r: SOLID };
  const cw = [450, 2676, 800, 900, 1050, 1050, 1050, 1050];

  const tblLampiran = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: cw,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('No', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[0], ...bdrAll }),
          cell(para(run('Uraian', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[1], ...bdrAll }),
          cell(para(run('Unit/ Satuan', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[2], ...bdrAll }),
          cell(para(run('Kuantitas/ Volume', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[3], ...bdrAll }),
          cell(para(run('HPS (Rp)', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[4], ...bdrAll }),
          cell(para(run('Penawaran (Rp)', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[5], ...bdrAll }),
          cell(para(run('Negosiasi (Rp)', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[6], ...bdrAll }),
          cell(para(run('Jumlah (Rp)', { size: 18, bold: true }), { align: D.AlignmentType.CENTER }), { w: cw[7], ...bdrAll }),
        ],
      }),
      ...d.items.map((it, idx) => {
        const qty = Number(it.kuantitas) || 1;
        const hNego = Number(it.harga_satuan) || 0;
        const hHps = Number(it.harga_hps) || hNego;
        const hPen = Number(it.harga_penawaran) || 0;
        const hJml = Math.round(qty * hNego);
        return new D.TableRow({
          children: [
            cell(para(run(`${idx + 1}.`, { size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[0], ...bdrAll }),
            cell(para(run(it.jenis_barang || '', { size: 18 })), { w: cw[1], ...bdrAll }),
            cell(para(run(it.satuan || 'Unit', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[2], ...bdrAll }),
            cell(para(run(String(qty), { size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[3], ...bdrAll }),
            cell(para(run(fmtNum(hHps), { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: cw[4], ...bdrAll }),
            cell(para(run(hPen > 0 ? fmtNum(hPen) : '-', { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: cw[5], ...bdrAll }),
            cell(para(run(fmtNum(hNego), { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: cw[6], ...bdrAll }),
            cell(para(run(fmtNum(hJml), { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: cw[7], ...bdrAll }),
          ],
        });
      }),
      new D.TableRow({
        children: [
          cell(para(run('Total (termasuk PPN 11%)', { size: 18, bold: true })), { w: cw.slice(0, 7).reduce((a, b) => a + b, 0), span: 7, ...bdrAll }),
          cell(para(run(fmtNum(finalNego), { size: 18, bold: true }), { align: D.AlignmentType.RIGHT }), { w: cw[7], ...bdrAll }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run(`Terbilang : ${terbilang(finalNego)} rupiah`, { size: 18 })), { w: W_CONTENT, span: 8, ...bdrAll }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'SPJ App',
    title: 'BA Klarifikasi Teknis dan Negosiasi Harga',
    sections: [
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          makeKopDocx(d.s, W_CONTENT),
          para(run('BERITA ACARA', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
          para(run('KLARIFIKASI TEKNIS DAN NEGOSIASI HARGA', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER }),
          para(run(`Nomor : ${noBakn}`, { size: 21 }), { align: D.AlignmentType.CENTER, after: 180 }),
          para(run(`PEKERJAAN\t\t: ${paketTxt}`, { bold: true, size: 20 })),
          para(run('SUMBER DANA\t: BLUD RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 })),
          para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 140 }),
          para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, kami Pejabat Pengadaan telah melakukan negosiasi teknis dan harga terhadap peserta Pengadaan Langsung ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`, { size: 20 }), { after: 100 }),
          para(run('Peserta Pengadaan :', { bold: true, size: 20 }), { after: 60 }),
          para(run(`1.\tNama Perusahaan\t\t: ${namaPenyedia}`, { size: 20 })),
          para(run(`2.\t${d.t.penyedia_jabatan || 'Direktur'}\t\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
          para(run(`3.\tAlamat\t\t\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 })),
          para(run(`4.\tNPWP\t\t\t\t: ${d.t.penyedia_npwp || '-'}`, { size: 20 })),
          para(run(`5.\tHPS\t\t\t\t: Rp${fmtNum(d.hpsTotal)},00 (${d.terbilangHps} rupiah)`, { size: 20 })),
          para(run(`6.\tHarga Penawaran\t\t: ${d.penawaranTotal > 0 ? `Rp${fmtNum(d.penawaranTotal)},00 (${d.terbilangPenawaran} rupiah)` : '-'}`, { size: 20 })),
          para(run(`7.\tHasil Negosiasi Teknis\t: ${d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan'}`, { size: 20 })),
          para(run('8.\tHasil Negosiasi Harga\t\t: Terlampir', { size: 20 }), { after: 120 }),
          para(run('Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.', { size: 20 }), { after: 220 }),
          para(run('RSUD dr. Soeratno Gemolong', { size: 20 })),
          para(run(`${d.pengadaan.nama || 'Tulus Wahyuno, A.Md'}\t\tPejabat Pengadaan\t\t…………………………….......`, { size: 20 }), { after: 220 }),
          para(run(namaPenyedia, { size: 20 })),
          para(run(`${d.t.penyedia_pimpinan || '-'}\t\t\t${d.t.penyedia_jabatan || 'Direktur'}\t\t\t……………………………......`, { size: 20 })),
        ],
      },
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 750, bottom: 750, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          para(run('Lampiran', { size: 20 })),
          para(run('Berita Acara Klarifikasi Teknis Dan Negosiasi Harga', { size: 20 })),
          para(run(`Nomor\t: ${noBakn}`, { size: 20 })),
          para(run(`Tanggal\t: ${tglIndo(tglBakn)}`, { size: 20 }), { after: 140 }),
          tblLampiran,
          para(run(''), { before: 300 }),
          new D.Table({
            width: { size: 9026, type: D.WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
            rows: [new D.TableRow({
              children: [
                cell([
                  para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(''), { before: 1200 }),
                  para(run(d.pengadaan.nama || '………………………………', { size: 20, underline: true }), { align: D.AlignmentType.CENTER }),
                  para(run(nipTxt(d.pengadaan.nip), { size: 20 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
                cell([
                  para(run(namaPenyedia, { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('Penyedia Barang/Jasa', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(''), { before: 1200 }),
                  para(run(d.t.penyedia_pimpinan || '………………………………', { size: 20, underline: true }), { align: D.AlignmentType.CENTER }),
                  para(run(d.t.penyedia_jabatan || 'Direktur', { size: 20 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
              ],
            })],
          }),
        ],
      },
    ],
  });
  return D.Packer.toBuffer(docx);
}

const pdfBuffer = (doc) => new Promise((res) => {
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => res(Buffer.concat(chunks)));
  doc.end();
});

const LABEL_DOK_50_750 = {
  spektek: '1. SPEKTEK',
  hps: '2. HPS',
  undangan_pl: '3. UNDANGAN PL',
  ba_pembukaan: '4. BA PEMBUKAAN PENAWARAN',
  ba_evaluasi: '5. BA EVALUASI PENAWARAN',
  undangan_klarifikasi: '6. UNDANGAN KLARIFIKASI & NEGOSIASI',
  bakn: '7. BA KLARIFIKASI & NEGOSIASI',
  ba_penetapan: '8. BA PENETAPAN PEMENANG',
  bahpl: '9. BAHPL',
  pengumuman_pl: '10. PENGUMUMAN HASIL PL',
  laporan_pl: '11. LAPORAN HASIL PL KE PPK',
  spk: '12. SPK',
  sppbj: '13. SPPBJ',
  bast: '14. BAST',
  baphp: '15. BAPHP',
  a2: '16. A2',
  verifikasi: '17. LEMBAR VERIFIKASI',
};

const LABEL_DOK_10_50 = {
  spektek: '1. SPEKTEK',
  hps: '2. HPS',
  bakn: '3. BA KLARIFIKASI DAN NEGOSIASI',
  sp: '4. SURAT PESANAN',
  bast: '5. BAST',
  baphp: '6. BAPHP',
  a2: '7. A2',
  verifikasi: '8. LEMBAR VERIFIKASI',
};

const LABEL_DOK_0_10 = {
  sp: '1. SURAT PESANAN',
  bast: '2. BAST',
  baphp: '3. BAPHP',
  a2: '4. A2',
  verifikasi: '5. LEMBAR VERIFIKASI',
};

// alur 0–2 jt: tanpa BAST
const LABEL_DOK_0_2 = {
  sp: '1. SURAT PESANAN',
  baphp: '2. BAPHP',
  a2: '3. A2',
  verifikasi: '4. LEMBAR VERIFIKASI',
};

const LABEL_DOK_LANGSUNG = {
  a2: '1. A2',
  verifikasi: '2. LEMBAR VERIFIKASI',
};

/** Hasilkan dokumen. jenis: 'spektek' | 'hps' | 'undangan_pl' | 'ba_pembukaan' | 'ba_evaluasi' | 'undangan_klarifikasi' | 'bakn' | 'ba_penetapan' | 'bahpl' | 'pengumuman_pl' | 'laporan_pl' | 'sppbj' | 'spk' | 'sp' | 'bast' | 'baphp' | 'a2' | 'verifikasi'; format: 'docx' | 'pdf' */
async function buatDokumen(id, jenis, format) {
  const d = await ambilData(id);
  if (!d) return null;
  const isLangsung = d.t.tahap === 'spj_langsung';
  const is50750 = !isLangsung && (d.t.mode_pengadaan === '50_750' || ['undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(d.t.tahap));
  const is1050 = !isLangsung && !is50750 && (d.t.mode_pengadaan === '10_50' || ['spektek', 'hps', 'spektek_hps', 'negosiasi'].includes(d.t.tahap) || !!d.t.hps_nomor);
  const is02 = !isLangsung && !is50750 && !is1050 && d.t.mode_pengadaan === '0_10' && Number(d.t.kotor) > 0 && Number(d.t.kotor) <= 2000000;
  // alur 50–750 jt: dari Undangan PL sampai SPK, nama/uraian paket diambil dari Lingkup pekerjaan (langkah Undangan)
  if (is50750 && d.pl?.lingkup_pekerjaan && !['spektek', 'hps', 'bast', 'baphp', 'a2', 'verifikasi'].includes(jenis)) d.t.uraian = d.pl.lingkup_pekerjaan;
  const mapLabel = is50750 ? LABEL_DOK_50_750 : (isLangsung ? LABEL_DOK_LANGSUNG : is1050 ? LABEL_DOK_10_50 : is02 ? LABEL_DOK_0_2 : LABEL_DOK_0_10);
  const prefix = mapLabel[jenis] || LABEL_DOK_50_750[jenis] || LABEL_DOK_10_50[jenis] || jenis.toUpperCase();
  const nama = prefix + ' - ' + ((d.t.penyedia && d.t.penyedia !== '-') ? d.t.penyedia : (d.rek?.uraian || 'Paket')).replace(/[\\/:*?"<>|\n]/g, ' ').trim().slice(0, 70);
  let buffer;
  if (format === 'pdf') {
    const fn = jenis === 'spektek' ? spektekPdf
      : jenis === 'hps' ? hpsPdf
      : jenis === 'undangan_pl' ? docsPl.undanganPlPdf
      : jenis === 'ba_pembukaan' ? docsPl.baPembukaanPdf
      : jenis === 'ba_evaluasi' ? docsPl.baEvaluasiPdf
      : jenis === 'undangan_klarifikasi' ? docsPl.undanganKlarifikasiPdf
      : jenis === 'bakn' ? baknPdf
      : jenis === 'ba_penetapan' ? docsPl.baPenetapanPdf
      : jenis === 'bahpl' ? docsPl.bahplPdf
      : jenis === 'pengumuman_pl' ? docsPl.pengumumanPlPdf
      : jenis === 'laporan_pl' ? docsPl.laporanPlPdf
      : jenis === 'sppbj' ? docsPl.sppbjPdf
      : (jenis === 'spk' || (jenis === 'sp' && is50750)) ? docsPl.spkPdf
      : jenis === 'sp' ? spPdf
      : jenis === 'bast' ? bastPdf
      : jenis === 'baphp' ? baphpPdf
      : jenis === 'a2' ? a2Pdf
      : verifPdf;
    buffer = await pdfBuffer(fn(d));
  } else {
    const fn = jenis === 'spektek' ? spektekDocx
      : jenis === 'hps' ? hpsDocx
      : jenis === 'undangan_pl' ? docsPl.undanganPlDocx
      : jenis === 'ba_pembukaan' ? docsPl.baPembukaanDocx
      : jenis === 'ba_evaluasi' ? docsPl.baEvaluasiDocx
      : jenis === 'undangan_klarifikasi' ? docsPl.undanganKlarifikasiDocx
      : jenis === 'bakn' ? baknDocx
      : jenis === 'ba_penetapan' ? docsPl.baPenetapanDocx
      : jenis === 'bahpl' ? docsPl.bahplDocx
      : jenis === 'pengumuman_pl' ? docsPl.pengumumanPlDocx
      : jenis === 'laporan_pl' ? docsPl.laporanPlDocx
      : jenis === 'sppbj' ? docsPl.sppbjDocx
      : (jenis === 'spk' || (jenis === 'sp' && is50750)) ? docsPl.spkDocx
      : jenis === 'sp' ? spDocx
      : jenis === 'bast' ? bastDocx
      : jenis === 'baphp' ? baphpDocx
      : jenis === 'a2' ? a2Docx
      : verifDocx;
    buffer = await fn(d);
  }
  return { buffer, filename: nama + '.' + format, mime: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
}

module.exports = { buatDokumen, ambilData, getSpektekData };

