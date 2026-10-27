// Generator Dokumen Pengadaan Langsung (PL) 50–750 Juta — PDF & DOCX
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const D = require('docx');
const { terbilang, rupiah, tglIndo, tglKalimatBast, BATAS_HPS_EPUR } = require('./util');

const ASSET = path.join(__dirname, '..', 'assets');
const LOGO_RS = fs.readFileSync(path.join(ASSET, 'logo', 'logors.png'));
const LOGO_PEMDA = fs.readFileSync(path.join(ASSET, 'logo', 'logopemkab.png'));

const FONT = 'Arial';
const NONE = { style: D.BorderStyle.NONE, size: 0, color: 'auto' };
const SOLID = { style: D.BorderStyle.SINGLE, size: 6, color: '000000' };
const NOBORDER = { top: NONE, bottom: NONE, left: NONE, right: NONE };
const bdrAll = { t: SOLID, b: SOLID, l: SOLID, r: SOLID };

const nipTxt = (n) => (n ? (/^nip/i.test(n) ? n : 'NIP. ' + n) : '');
const fmtNum = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID');

/* ---- format tanggal & nominal sesuai contoh dokumen ---- */
const BULAN_ID = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const pad2 = (n) => String(n).padStart(2, '0');
const pecahTgl = (iso) => {
  const [y, m, dd] = String(iso || '').slice(0, 10).split('-').map(Number);
  return y && m && dd ? { y, m, d: dd } : null;
};
// 02 Oktober 2025 (tanggal 2 digit, nama bulan)
const tgl2 = (iso) => { const t = pecahTgl(iso); return t ? pad2(t.d) + ' ' + BULAN_ID[t.m - 1] + ' ' + t.y : '-'; };
// 22 - 25 September 2025  |  28 September - 02 Oktober 2025
const rentangTgl = (a, b) => {
  const x = pecahTgl(a), z = pecahTgl(b);
  if (!x) return '-';
  if (!z || (x.y === z.y && x.m === z.m && x.d === z.d)) return tgl2(a);
  if (x.y === z.y && x.m === z.m) return pad2(x.d) + ' - ' + pad2(z.d) + ' ' + BULAN_ID[x.m - 1] + ' ' + x.y;
  return tgl2(a) + ' - ' + tgl2(b);
};
const rpKoma = (n) => 'Rp' + fmtNum(n) + ',00';
const rpStrip = (n) => 'Rp ' + fmtNum(n) + ',-';
const terbKecil = (n) => { const t = terbilang(n).toLowerCase(); return t.charAt(0).toUpperCase() + t.slice(1); };

// tanda centang (akar) digambar sebagai vektor karena font standar PDF tidak punya glyph itu
function drawCek(doc, cx, cy, sz = 3.6) {
  doc.save().lineWidth(0.9).strokeColor('#000').lineJoin('miter')
    .moveTo(cx - sz, cy).lineTo(cx - sz * 0.35, cy + sz * 0.9).lineTo(cx + sz, cy - sz).stroke().restore();
}

// daftar bernomor: label (boleh 2 baris) | : nilai (boleh beberapa baris); tinggi baris mengikuti isi terpanjang
function drawDaftarHasil(doc, items, y, xLeft, wFull, colon = 170) {
  const xNo = xLeft + 10, xLbl = xLeft + 30, xVal = xLeft + colon;
  const wLbl = xVal - xLbl - 6, wVal = xLeft + wFull - xVal - 8;
  doc.font('Helvetica').fontSize(10);
  for (const it of items) {
    const hL = doc.heightOfString(it.label, { width: wLbl });
    const hV = doc.heightOfString(it.val, { width: wVal });
    doc.text(it.no + '.', xNo, y);
    doc.text(it.label, xLbl, y, { width: wLbl });
    doc.text(':', xVal, y);
    doc.text(it.val, xVal + 8, y, { width: wVal });
    y += Math.max(hL, hV, 12) + 6;
  }
  return y;
}
const itemPenyedia = (d) => [
  { no: 1, label: 'Nama Perusahaan', val: d.t.penyedia || '-' },
  { no: 2, label: 'Kuasa Direktur', val: d.t.penyedia_pimpinan || '-' },
  { no: 3, label: 'Alamat', val: d.t.penyedia_alamat || '-' },
  { no: 4, label: 'NPWP', val: d.t.penyedia_npwp || '-' },
];
const hasilNego = (d) => d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga';
const LBL_NEGO = 'Hasil klarifikasi dan\nNegosiasi teknis dan harga';

// versi DOCX: tabel tanpa garis agar label/nilai yang panjang tidak saling menumpuk
function tabelDaftarDocx(items, wContent = 9026) {
  const w = [620, 2900, 260, wContent - 620 - 2900 - 260];
  return new D.Table({
    width: { size: wContent, type: D.WidthType.DXA }, columnWidths: w,
    borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
    rows: items.map((it) => new D.TableRow({
      children: [
        cell(para(run(it.no + '.', { size: 20 }), { align: D.AlignmentType.RIGHT }), { w: w[0], v: D.VerticalAlign.TOP }),
        cell(String(it.label).split('\n').map((l) => para(run(l, { size: 20 }))), { w: w[1], v: D.VerticalAlign.TOP }),
        cell(para(run(':', { size: 20 })), { w: w[2], v: D.VerticalAlign.TOP }),
        cell(String(it.val).split('\n').map((l) => para(run(l, { size: 20 }))), { w: w[3], v: D.VerticalAlign.TOP }),
      ],
    })),
  });
}
const NAMA_JABAT = (d) => d.pengadaan.nama || 'Tulus Wahyuno, A.Md';

const run = (text, o = {}) => new D.TextRun({
  text: String(text ?? ''), font: FONT, size: o.size || 18,
  bold: o.bold, italics: o.italics, underline: o.underline ? {} : undefined,
});
const para = (children, o = {}) => new D.Paragraph({
  children: Array.isArray(children) ? children : [children],
  alignment: o.align, spacing: { before: o.before || 0, after: o.after || 0, line: o.line || 220 },
  indent: o.indent, tabStops: o.tabs,
});
const cell = (children, o = {}) => new D.TableCell({
  children: Array.isArray(children) ? children : [children],
  width: o.w ? { size: o.w, type: D.WidthType.DXA } : undefined,
  borders: { top: o.t || NONE, bottom: o.b || NONE, left: o.l || NONE, right: o.r || NONE },
  verticalAlign: o.v || D.VerticalAlign.CENTER, columnSpan: o.span, rowSpan: o.rspan,
  shading: o.fill ? { type: D.ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  margins: { top: o.mt ?? 40, bottom: o.mb ?? 40, left: o.ml ?? 80, right: o.mr ?? 80 },
});

function drawKop(doc, s, y0 = 32) {
  const W = doc.page.width;
  doc.image(LOGO_PEMDA, 70, y0, { width: 45, height: 57 });
  doc.image(LOGO_RS, W - 70 - 54, y0 + 2, { width: 54, height: 52 });

  doc.font('Helvetica-Bold').fontSize(12).text(s.pemda || 'PEMERINTAH KABUPATEN SRAGEN', 0, y0 + 10, { width: W, align: 'center' });
  doc.fontSize(15).text(s.instansi || 'RSUD dr. SOERATNO GEMOLONG', 0, y0 + 25, { width: W, align: 'center' });
  doc.font('Helvetica').fontSize(8.5).text(s.alamat || 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274', 0, y0 + 42, { width: W, align: 'center' });
  doc.fontSize(8.5).text(s.kontak || 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com', 0, y0 + 53, { width: W, align: 'center' });

  const ly = y0 + 72;
  const lx1 = 70, lx2 = W - 70;
  doc.save().lineWidth(2.5).strokeColor('#000').moveTo(lx1, ly).lineTo(lx2, ly).stroke().restore();
  doc.save().lineWidth(0.8).strokeColor('#000').moveTo(lx1, ly + 4).lineTo(lx2, ly + 4).stroke().restore();
  return ly + 14;
}

function makeKopDocx(s, W_CONTENT = 9026) {
  const wLogoLeft = 1400, wLogoRight = 1400, wKopMid = W_CONTENT - wLogoLeft - wLogoRight;
  return new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [wLogoLeft, wKopMid, wLogoRight],
    borders: { ...NOBORDER, bottom: { style: D.BorderStyle.DOUBLE, size: 12, color: '000000' }, insideHorizontal: NONE, insideVertical: NONE },
    rows: [
      new D.TableRow({
        children: [
          cell(para(new D.ImageRun({ data: LOGO_PEMDA, type: 'png', transformation: { width: 50, height: 63 } }), { align: D.AlignmentType.CENTER }), { w: wLogoLeft }),
          cell([
            para(run(s.pemda || 'PEMERINTAH KABUPATEN SRAGEN', { bold: true, size: 21 }), { align: D.AlignmentType.CENTER }),
            para(run(s.instansi || 'RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 26 }), { align: D.AlignmentType.CENTER }),
            para(run(s.alamat || 'Jl. R. Ngt. Tjitrosantjoko 10, Gemolong, Sragen, Jawa Tengah 57274', { size: 16 }), { align: D.AlignmentType.CENTER }),
            para(run(s.kontak || 'Telp. (0271) 6811839, Laman rsudgemolong.sragenkab.go.id, Pos-el rsudgemolong@gmail.com', { size: 15 }), { align: D.AlignmentType.CENTER, after: 120 }),
          ], { w: wKopMid }),
          cell(para(new D.ImageRun({ data: LOGO_RS, type: 'png', transformation: { width: 60, height: 58 } }), { align: D.AlignmentType.CENTER }), { w: wLogoRight }),
        ],
      }),
    ],
  });
}

function getPaketTxt(d) {
  const namaRek = (d.rek?.uraian || d.spektek?.paket_pengadaan || '').trim();
  const isianUser = (d.t.uraian || '').trim();
  return (namaRek && isianUser && namaRek.toLowerCase() !== isianUser.toLowerCase())
    ? `${namaRek} (${isianUser})`
    : (namaRek || isianUser || 'Paket Pengadaan');
}

/* ==========================================================================
   1. UNDANGAN PENGADAAN LANGSUNG (undangan_pl)
   ========================================================================== */
function undanganPlPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Undangan Pengadaan Langsung' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const jdw = pl.jadwal || {};
  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tgl2(pl.undangan_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const lingkup = pl.lingkup_pekerjaan || d.t.uraian || (d.rek?.uraian || '');

  y += 6;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglUndangan}`, W - 70 - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Nomor     : ${noUndangan}`, xLeft, y);
  y += 13;
  doc.text(`Lampiran : 1 (satu) berkas`, xLeft, y);
  y += 18;
  doc.font('Helvetica').text('Kepada Yth.', xLeft, y);
  y += 13;
  doc.text(d.t.penyedia || '-', xLeft, y);
  y += 13;
  doc.font('Helvetica').text('di', xLeft, y);
  y += 13;
  doc.text(d.t.penyedia_alamat || 'Sragen', xLeft, y, { width: 300 });
  y = doc.y + 14;

  doc.font('Helvetica').fontSize(10).text(
    `Dengan ini Saudara kami undang untuk mengikuti proses pengadaan langsung ${paketTxt} dengan ketentuan sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2 }
  );
  y = doc.y + 10;

  doc.font('Helvetica-Bold').text('1. Paket Pekerjaan', xLeft, y);
  y += 14;
  doc.font('Helvetica');
  const drawRow = (lbl, val) => {
    doc.text(lbl, xLeft + 15, y);
    doc.text(': ' + val, xLeft + 145, y, { width: wFull - 145 });
    y = Math.max(doc.y + 2, y + 14);
  };
  drawRow('Nama paket pekerjaan', d.rek?.uraian || paketTxt);
  drawRow('Lingkup pekerjaan', lingkup);
  drawRow('Nilai HPS', `${rpKoma(d.hpsTotal)} (${terbKecil(d.hpsTotal)})`);
  drawRow('Sumber pendanaan', `BLUD Tahun Anggaran ${d.tahun}`);

  y += 4;
  doc.font('Helvetica-Bold').text('2. Pelaksanaan Pengadaan', xLeft, y);
  y += 14;
  doc.font('Helvetica');
  drawRow('Tempat dan alamat', 'RSUD dr. Soeratno Gemolong, Jl. Rngt. Tjitro Santjoko No. 10, Gemolong, Kab. Sragen');
  drawRow('Telepon/Fax', '0271-6811839');

  y += 4;
  doc.text(
    'Saudara diminta untuk memasukan penawaran administrasi, teknis dan harga, secara langsung sesuai dengan jadwal pelaksanaan sebagai berikut :',
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2 }
  );
  y = doc.y + 8;

  // Tabel jadwal: garis penuh, tanggal "02 Oktober 2025", sel waktu abu-abu bila tidak ada
  const XJ = [xLeft, xLeft + 28, xLeft + 215, xLeft + 355, xLeft + wFull];
  const jadwRows = [
    ['a.', 'Pemasukan Dokumen Penawaran', rentangTgl(jdw.pemasukan_tgl, jdw.pemasukan_sampai_tgl), jdw.pemasukan_waktu || '08.00 wib s.d.14.00 wib'],
    ['b.', 'Pembukaan Dokumen Penawaran', tgl2(jdw.pembukaan_tgl), jdw.pembukaan_waktu || '08.00 wib s.d.14.00 wib'],
    ['c.', 'Klarifikasi Teknis dan Negosiasi Harga', tgl2(jdw.klarifikasi_tgl), jdw.klarifikasi_waktu || '08.00 wib s.d. 09.00 wib'],
    ['d.', 'Penetapan Pemenang', tgl2(jdw.penetapan_tgl), null],
    ['e.', 'Penandatanganan SPK', tgl2(jdw.spk_tgl), null],
  ];
  const garis = (x1, y1, x2, y2) => doc.save().lineWidth(0.7).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
  const sel = (kol, yy, hh, teks, o = {}) => {
    if (o.fill) doc.save().rect(XJ[kol], yy, XJ[kol + 1] - XJ[kol], hh).fill('#c9c9c9').restore();
    if (teks) doc.fillColor('#000').text(teks, XJ[kol] + 4, yy + 3, { width: XJ[kol + 1] - XJ[kol] - 8, align: o.align || 'left' });
  };
  const barisTabel = (yy, hh, teks, o = {}) => {
    teks.forEach((t, k) => sel(k, yy, hh, t, { align: k === 0 || o.tengah ? 'center' : (k === 2 && !o.header ? 'center' : 'left'), fill: o.fill?.[k] }));
    garis(XJ[0], yy + hh, XJ[4], yy + hh);
    return yy + hh;
  };
  const yTab = y;
  doc.font('Helvetica').fontSize(10);
  y = barisTabel(y, 16, ['No', 'Kegiatan', 'Tanggal', 'Waktu'], { tengah: true, header: true });
  for (const r of jadwRows) {
    const hh = Math.max(16, doc.heightOfString(r[1], { width: XJ[2] - XJ[1] - 8 }) + 6, r[3] ? doc.heightOfString(r[3], { width: XJ[4] - XJ[3] - 8 }) + 6 : 0);
    y = barisTabel(y, hh, [r[0], r[1], r[2], r[3] || ''], { fill: r[3] ? null : [null, null, null, true] });
  }
  garis(XJ[0], yTab, XJ[4], yTab);
  for (const x of XJ) garis(x, yTab, x, y);

  y += 12;
  doc.fontSize(9.5).text(
    'Apabila Saudara membutuhkan keterangan dan penjelasan lebih lanjut, dapat menghubungi kami sesuai alamat tersebut di atas.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y = doc.y + 8;
  doc.text('Demikian untuk menjadikan periksa dan atas kerjasamanya kami sampaikan terimakasih.', xLeft, y, { width: wFull });
  y += 24;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function undanganPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const jdw = pl.jadwal || {};
  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tgl2(pl.undangan_tanggal || d.t.tanggal);
  const GRAY = 'C9C9C9';
  const paketTxt = getPaketTxt(d);
  const lingkup = pl.lingkup_pekerjaan || d.t.uraian || (d.rek?.uraian || '');

  const tblJadw = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [600, 3600, 2400, 2426],
    borders: bdrAll,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('No', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run('Kegiatan', { bold: true, size: 18 })), { w: 3600, ...bdrAll }),
          cell(para(run('Tanggal', { bold: true, size: 18 })), { w: 2400, ...bdrAll }),
          cell(para(run('Waktu', { bold: true, size: 18 })), { w: 2426, ...bdrAll }),
        ],
      }),
      ...[
        ['a.', 'Pemasukan Dokumen Penawaran', rentangTgl(jdw.pemasukan_tgl, jdw.pemasukan_sampai_tgl), jdw.pemasukan_waktu || '08.00 wib s.d.14.00 wib'],
        ['b.', 'Pembukaan Dokumen Penawaran', tgl2(jdw.pembukaan_tgl), jdw.pembukaan_waktu || '08.00 wib s.d.14.00 wib'],
        ['c.', 'Klarifikasi Teknis dan Negosiasi Harga', tgl2(jdw.klarifikasi_tgl), jdw.klarifikasi_waktu || '08.00 wib s.d. 09.00 wib'],
        ['d.', 'Penetapan Pemenang', tgl2(jdw.penetapan_tgl), ''],
        ['e.', 'Penandatanganan SPK', tgl2(jdw.spk_tgl), ''],
      ].map((r) => new D.TableRow({
        children: [
          cell(para(run(r[0], { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run(r[1], { size: 18 })), { w: 3600, ...bdrAll }),
          cell(para(run(r[2], { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 2400, ...bdrAll }),
          cell(para(run(r[3], { size: 18 })), { w: 2426, ...bdrAll, fill: r[3] ? undefined : GRAY }),
        ],
      })),
    ],
  });

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Undangan PL',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run(`Sragen, ${tglUndangan}`, { size: 20 }), { align: D.AlignmentType.RIGHT, before: 120 }),
        para(run(`Nomor\t\t: ${noUndangan}`, { size: 20 })),
        para(run('Lampiran\t: 1 (satu) berkas', { size: 20 }), { after: 120 }),
        para(run('Kepada Yth.', { size: 20 })),
        para(run(d.t.penyedia || '-', { size: 20 })),
        para(run('di', { size: 20 })),
        para(run(d.t.penyedia_alamat || 'Sragen', { size: 20 }), { after: 140 }),
        para(run(`Dengan ini Saudara kami undang untuk mengikuti proses pengadaan langsung ${paketTxt} dengan ketentuan sebagai berikut :`, { size: 20 }), { after: 100 }),
        para(run('1.\tPaket Pekerjaan', { bold: true, size: 20 })),
        para(run(`\tNama paket pekerjaan\t: ${d.rek?.uraian || paketTxt}`, { size: 20 })),
        para(run(`\tLingkup pekerjaan\t\t: ${lingkup}`, { size: 20 })),
        para(run(`\tNilai HPS\t\t\t: ${rpKoma(d.hpsTotal)} (${terbKecil(d.hpsTotal)})`, { size: 20 })),
        para(run(`\tSumber pendanaan\t\t: BLUD Tahun Anggaran ${d.tahun}`, { size: 20 })),
        para(run('2.\tPelaksanaan Pengadaan', { bold: true, size: 20 }), { before: 80 }),
        para(run('\tTempat dan alamat\t\t: RSUD dr. Soeratno Gemolong, Jl. Rngt. Tjitro Santjoko No. 10, Gemolong', { size: 20 })),
        para(run('\tTelepon/Fax\t\t\t: 0271-6811839', { size: 20 }), { after: 100 }),
        para(run('Saudara diminta untuk memasukan penawaran administrasi, teknis dan harga, secara langsung sesuai dengan jadwal pelaksanaan sebagai berikut :', { size: 20 }), { after: 100 }),
        tblJadw,
        para(run('Apabila Saudara membutuhkan keterangan dan penjelasan lebih lanjut, dapat menghubungi kami sesuai alamat tersebut di atas.', { size: 20 }), { before: 120 }),
        para(run('Demikian untuk menjadikan periksa dan atas kerjasamanya kami sampaikan terimakasih.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   2. BA PEMBUKAAN PENAWARAN (ba_pembukaan)
   ========================================================================== */
function baPembukaanPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BA Pembukaan Penawaran' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const defNomor = pl.pembukaan_no_urut ? `${pl.pembukaan_no_urut}.b` : '2573.b';
  const noDoc = pl.pembukaan_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.pembukaan_tanggal || pl.jadwal?.pembukaan_tgl || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('BERITA ACARA PEMBUKAAN PENAWARAN', 0, y, { width: W, align: 'center' });
  y += 16;
  doc.font('Helvetica').fontSize(10).text(`Nomor : ${noDoc}`, 0, y, { width: W, align: 'center' });
  y += 20;

  doc.font('Helvetica-Bold');
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + (d.rek?.uraian || paketTxt), xLeft + 120, y, { width: wFull - 120 });
  y = Math.max(doc.y + 3, y + 14);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. SOERATNO GEMOLONG', xLeft + 120, y);
  y += 14;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 120, y);
  y += 22;

  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah membuka penawaran yang disampaikan oleh penyedia jasa untuk kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 14;

  const drawFld = (lbl, val) => {
    doc.font('Helvetica').text(lbl, xLeft + 15, y);
    doc.text(': ' + val, xLeft + 150, y, { width: wFull - 150 });
    y = Math.max(doc.y + 2, y + 15);
  };
  drawFld('Nama Penyedia', d.t.penyedia || '-');
  drawFld('Direktur', d.t.penyedia_pimpinan || '-');
  drawFld('Alamat', d.t.penyedia_alamat || '-');
  drawFld('Harga Penawaran', `${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`);

  doc.text('Kelengkapan Dokumen', xLeft + 15, y);
  doc.text(':', xLeft + 150, y);
  doc.text('a. Dokumen Penawaran Administrasi', xLeft + 160, y); y += 14;
  doc.text('b. Dokumen Penawaran Teknis', xLeft + 160, y); y += 14;
  doc.text('c. Dokumen Penawaran Harga', xLeft + 160, y); y += 18;

  doc.text(
    'Selanjutnya Pejabat pengadaan akan melakukan evaluasi dokumen penawaran sesuai dokumen pengadaan.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y = doc.y + 10;
  doc.text(
    'Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y = doc.y + 26;

  // 2 Kolom TTD
  const wCol = (wFull - 30) / 2;
  doc.font('Helvetica').fontSize(10);
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y, { width: wCol, align: 'center' });
  doc.text('Pejabat Pengadaan', xLeft, y + 13, { width: wCol, align: 'center' });

  doc.text('Penyedia Barang / Jasa', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia || '-', xLeft + wCol + 30, y + 13, { width: wCol, align: 'center' });
  y += 92;

  doc.font('Helvetica');
  doc.text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xLeft, y, { width: wCol, align: 'center', underline: true });
  doc.text(d.t.penyedia_pimpinan || '………………………', xLeft + wCol + 30, y, { width: wCol, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9);
  doc.text(nipTxt(d.pengadaan.nip), xLeft, y + 13, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_jabatan || 'Direktur', xLeft + wCol + 30, y + 13, { width: wCol, align: 'center' });

  return doc;
}

async function baPembukaanDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.pembukaan_no_urut ? `${pl.pembukaan_no_urut}.b` : '2573.b';
  const noDoc = pl.pembukaan_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.pembukaan_tanggal || pl.jadwal?.pembukaan_tgl || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'BA Pembukaan Penawaran',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA PEMBUKAAN PENAWARAN', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run(`Nomor : ${noDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
        para(run(`PEKERJAAN\t\t: ${d.rek?.uraian || paketTxt}`, { bold: true, size: 20 })),
        para(run('SUMBER DANA\t: BLUD RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 })),
        para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 120 }),
        para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah membuka penawaran yang disampaikan oleh penyedia jasa untuk kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`, { size: 20 }), { after: 120 }),
        para(run(`Nama Penyedia\t\t: ${d.t.penyedia || '-'}`, { size: 20 })),
        para(run(`Direktur\t\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
        para(run(`Alamat\t\t\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 })),
        para(run(`Harga Penawaran\t\t: ${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`, { size: 20 })),
        para(run('Kelengkapan Dokumen\t: a. Dokumen Penawaran Administrasi', { size: 20 })),
        para(run('\t\t\t\t  b. Dokumen Penawaran Teknis', { size: 20 })),
        para(run('\t\t\t\t  c. Dokumen Penawaran Harga', { size: 20 }), { after: 120 }),
        para(run('Selanjutnya Pejabat pengadaan akan melakukan evaluasi dokumen penawaran sesuai dokumen pengadaan.', { size: 20 }), { after: 100 }),
        para(run('Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell([
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
              cell([
                para(run('Penyedia Barang / Jasa', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(d.t.penyedia || '-', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.t.penyedia_pimpinan || '………………………', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(d.t.penyedia_jabatan || 'Direktur', { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   3. BA EVALUASI PENAWARAN (ba_evaluasi)
   ========================================================================== */
function baEvaluasiPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BA Hasil Evaluasi Penawaran' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const defNomor = pl.evaluasi_no_urut ? `${pl.evaluasi_no_urut}.c` : '2573.c';
  const noDoc = pl.evaluasi_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.evaluasi_tanggal || pl.pembukaan_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('BERITA ACARA HASIL EVALUASI PENAWARAN', 0, y, { width: W, align: 'center' });
  y += 16;
  doc.font('Helvetica').fontSize(10).text(`Nomor : ${noDoc}`, 0, y, { width: W, align: 'center' });
  y += 20;

  doc.font('Helvetica-Bold');
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + (d.rek?.uraian || paketTxt), xLeft + 120, y, { width: wFull - 120 });
  y = Math.max(doc.y + 3, y + 14);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. SOERATNO GEMOLONG', xLeft + 120, y);
  y += 14;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 120, y);
  y += 22;

  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah melakukan evaluasi pada dokumen penawaran yang disampaikan oleh Penyedia Jasa untuk kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 14;

  // Tabel evaluasi (garis penuh, baris nomor kolom abu-abu, a/b/c di bawah Evaluasi Teknis)
  const CW = [30, 128, 70, 27, 27, 27, 56, 45, 45];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);
  const ln = (x1, y1, x2, y2, w = 0.7) => doc.save().lineWidth(w).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
  const yT = y;
  const hHdr = 38, hNo = 14, hAbc = 14, hData = 34;
  const yNo = yT + hHdr, yAbc = yNo + hNo, yData = yAbc + hAbc, yEnd = yData + hData;
  doc.save().rect(X[0], yNo, wFull, hNo).fill('#cfcfcf').restore();
  doc.fillColor('#000').font('Helvetica-Bold').fontSize(9);
  const tengah = (t, k, yy, hh, k2 = k) => {
    const w = X[k2 + 1] - X[k];
    const th = doc.heightOfString(t, { width: w });
    doc.text(t, X[k], yy + (hh - th) / 2, { width: w, align: 'center' });
  };
  tengah('No', 0, yT, hHdr);
  tengah('Nama Perusahaan', 1, yT, hHdr);
  tengah('Administrasi', 2, yT, hHdr);
  tengah('Evaluasi\nTeknis', 3, yT, hHdr, 5);
  tengah('Evaluasi\nHarga', 6, yT, hHdr);
  tengah('Sah/\nTidak', 7, yT, hHdr);
  tengah('Ket', 8, yT, hHdr);
  doc.font('Helvetica-BoldOblique').fontSize(8.5);
  ['1', '2', '3', '4', '5', '6', '7'].forEach((t, k) => {
    const kol = [0, 1, 2, 3, 6, 7, 8][k];
    const akhir = k === 3 ? 5 : kol;
    tengah(t, kol, yNo, hNo, akhir);
  });
  doc.font('Helvetica-Bold').fontSize(9);
  ['a', 'b', 'c'].forEach((t, k) => tengah(t, 3 + k, yAbc, hAbc));
  // data
  doc.font('Helvetica').fontSize(10);
  doc.text('1.', X[0], yData + 11, { width: CW[0], align: 'center' });
  doc.text(d.t.penyedia || '-', X[1] + 5, yData + 4, { width: CW[1] - 10 });
  [2, 3, 4, 5, 6].forEach((k) => drawCek(doc, X[k] + CW[k] / 2, yData + hData / 2));
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text('SAH', X[7], yData + 12, { width: CW[7], align: 'center' });
  doc.text('LULUS', X[8], yData + 12, { width: CW[8], align: 'center' });
  // garis: tepi, horizontal, vertikal (a|b|c hanya pada baris a/b/c dan data)
  [yT, yNo, yAbc, yData, yEnd].forEach((yy) => ln(X[0], yy, X[9], yy));
  [0, 1, 2, 3, 6, 7, 8, 9].forEach((k) => ln(X[k], yT, X[k], yEnd));
  [4, 5].forEach((k) => ln(X[k], yAbc, X[k], yEnd));
  y = yEnd + 6;

  doc.font('Helvetica').fontSize(10).text('Keterangan:', xLeft, y);
  y += 15;
  const baris = (indent, no, teks) => {
    doc.text(no, xLeft + indent, y);
    doc.text(teks, xLeft + indent + 18, y, { width: wFull - indent - 18 });
    y = doc.y + 3;
  };
  baris(14, 'a.', 'Unsur-unsur yang di evaluasi meliputi:');
  baris(32, '1.', 'Evaluasi Administrasi :');
  baris(50, '-', 'Kelengkapan dokumen administrasi yang diminta.');
  baris(32, '2.', 'Evaluasi Teknis :');
  baris(50, 'a.', 'Keabsahan surat penawaran.');
  baris(50, 'b.', 'Pemenuhan terhadap spesifikasi teknis yang diminta.');
  baris(50, 'c.', 'Pemenuhan syarat teknis lain yang diminta.');
  baris(32, '3.', 'Evaluasi Harga :');
  baris(50, '-', 'Total harga penawaran terhadap Harga Perkiraan Sendiri (HPS)');
  doc.text('b.', xLeft + 14, y);
  doc.text('Keterangan Tanda', xLeft + 32, y);
  const xCek = xLeft + 32 + doc.widthOfString('Keterangan Tanda ') + 6;
  drawCek(doc, xCek, y + 5, 3);
  doc.text(': Sesuai', xCek + 8, y);
  y += 28;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 26, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function baEvaluasiDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.evaluasi_no_urut ? `${pl.evaluasi_no_urut}.c` : '2573.c';
  const noDoc = pl.evaluasi_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.evaluasi_tanggal || pl.pembukaan_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  const GRAY = 'CFCFCF';
  const cw = [600, 3000, 1300, 500, 500, 500, 900, 800, 926];
  const H = (t, o = {}) => cell(para(run(t, { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: o.w, span: o.span, ...bdrAll });
  const tbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: cw,
    borders: bdrAll,
    rows: [
      new D.TableRow({ children: [H('No', { w: cw[0] }), H('Nama Perusahaan', { w: cw[1] }), H('Administrasi', { w: cw[2] }), H('Evaluasi Teknis', { w: cw[3] + cw[4] + cw[5], span: 3 }), H('Evaluasi Harga', { w: cw[6] }), H('Sah/ Tidak', { w: cw[7] }), H('Ket', { w: cw[8] })] }),
      new D.TableRow({
        children: [['1', 0, 1], ['2', 1, 1], ['3', 2, 1], ['4', 3, 3], ['5', 6, 1], ['6', 7, 1], ['7', 8, 1]].map(([t, k, n]) =>
          cell(para(run(t, { italics: true, size: 16 }), { align: D.AlignmentType.CENTER }), { w: cw.slice(k, k + n).reduce((a, b) => a + b, 0), span: n > 1 ? n : undefined, ...bdrAll, fill: GRAY })),
      }),
      new D.TableRow({
        children: [
          cell(para(run('')), { w: cw[0], ...bdrAll }), cell(para(run('')), { w: cw[1], ...bdrAll }), cell(para(run('')), { w: cw[2], ...bdrAll }),
          ...['a', 'b', 'c'].map((t, k) => cell(para(run(t, { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: cw[3 + k], ...bdrAll })),
          cell(para(run('')), { w: cw[6], ...bdrAll }), cell(para(run('')), { w: cw[7], ...bdrAll }), cell(para(run('')), { w: cw[8], ...bdrAll }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run('1.', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[0], ...bdrAll }),
          cell(para(run(d.t.penyedia || '-', { size: 18 })), { w: cw[1], ...bdrAll }),
          ...[2, 3, 4, 5, 6].map((k) => cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[k], ...bdrAll })),
          cell(para(run('SAH', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[7], ...bdrAll }),
          cell(para(run('LULUS', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: cw[8], ...bdrAll }),
        ],
      }),
    ],
  });

  const docx = new D.Document({
    creator: 'AdminProc', title: 'BA Evaluasi Penawaran',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA HASIL EVALUASI PENAWARAN', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run(`Nomor : ${noDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
        para(run(`PEKERJAAN\t\t: ${d.rek?.uraian || paketTxt}`, { bold: true, size: 20 })),
        para(run('SUMBER DANA\t: BLUD RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 })),
        para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 120 }),
        para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah melakukan evaluasi pada dokumen penawaran yang disampaikan oleh Penyedia Jasa untuk kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong dengan hasil sebagai berikut :`, { size: 20 }), { after: 120 }),
        tbl,
        para(run('Keterangan:', { bold: true, size: 19 }), { before: 140 }),
        para(run('a. Unsur - unsur yang di evaluasi meliputi:', { size: 18 })),
        para(run('   1. Evaluasi Administrasi : Kelengkapan dokumen administrasi yang diminta.', { size: 18 })),
        para(run('   2. Evaluasi Teknis : a. Keabsahan surat penawaran; b. Pemenuhan terhadap spesifikasi teknis yang diminta; c. Pemenuhan syarat teknis lain yang diminta.', { size: 18 })),
        para(run('   3. Evaluasi Harga : Total harga penawaran terhadap HPS.', { size: 18 })),
        para(run('b. Keterangan Tanda √ : Sesuai', { size: 18 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(`Tahun ${d.tahun}`, { size: 18 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   4. UNDANGAN KLARIFIKASI DAN NEGOSIASI (undangan_klarifikasi)
   ========================================================================== */
function undanganKlarifikasiPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Undangan Klarifikasi dan Negosiasi' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const defNomor = pl.undangan_klarifikasi_no_urut || '2578.a';
  const noDoc = pl.undangan_klarifikasi_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.undangan_klarifikasi_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const tglPertemuan = pl.jadwal?.klarifikasi_tgl || d.t.bakn_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglPertemuan);

  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglDoc}`, W - 70 - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Nomor   : ${noDoc}`, xLeft, y); y += 13;
  doc.text('Perihal  : Undangan Klarifikasi dan Negosiasi Teknis dan Harga', xLeft, y); y += 20;

  doc.font('Helvetica-Bold').text('Kepada Yth.', xLeft, y); y += 13;
  doc.text(d.t.penyedia || '-', xLeft, y); y += 13;
  doc.font('Helvetica').text(d.t.penyedia_alamat || 'Sragen', xLeft, y, { width: 320 });
  y = doc.y + 16;

  doc.font('Helvetica').fontSize(10).text(
    `Sehubungan dengan kegiatan pengadaan langsung ${paketTxt} RSUD dr. Soeratno Gemolong Tahun Anggaran ${d.tahun}, kami mengundang saudara untuk hadir pada :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 12;

  const drawFld = (lbl, val) => {
    doc.text(lbl, xLeft + 20, y);
    doc.text(': ' + val, xLeft + 120, y, { width: wFull - 120 });
    y = Math.max(doc.y + 3, y + 15);
  };
  drawFld('Hari/ tanggal', `${kal.hari}, ${tgl2(tglPertemuan)}`);
  drawFld('Waktu', pl.jadwal?.klarifikasi_waktu || '09.00 WIB');
  drawFld('Tempat', 'RSUD dr. Soeratno Gemolong, Jl. RNgt Tjitrosantjoko No. 10 Gemolong');
  drawFld('Keperluan', 'Klarifikasi dan negosiasi teknis dan harga');

  y += 8;
  doc.text('Demikian untuk mendapatkan perhatian dan atas kehadiran saudara kami ucapkan terima kasih.', xLeft, y, { width: wFull });
  y += 35;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 26, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function undanganKlarifikasiDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.undangan_klarifikasi_no_urut || '2578.a';
  const noDoc = pl.undangan_klarifikasi_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.undangan_klarifikasi_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const tglPertemuan = pl.jadwal?.klarifikasi_tgl || d.t.bakn_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglPertemuan);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Undangan Klarifikasi',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run(`Sragen, ${tglDoc}`, { size: 20 }), { align: D.AlignmentType.RIGHT, before: 120 }),
        para(run(`Nomor\t: ${noDoc}`, { size: 20 })),
        para(run('Perihal\t: Undangan Klarifikasi dan Negosiasi Teknis dan Harga', { size: 20 }), { after: 140 }),
        para(run('Kepada Yth.', { bold: true, size: 20 })),
        para(run(d.t.penyedia || '-', { bold: true, size: 20 })),
        para(run(d.t.penyedia_alamat || 'Sragen', { size: 20 }), { after: 140 }),
        para(run(`Sehubungan dengan kegiatan pengadaan langsung ${paketTxt} RSUD dr. Soeratno Gemolong Tahun Anggaran ${d.tahun}, kami mengundang saudara untuk hadir pada :`, { size: 20 }), { after: 120 }),
        para(run(`Hari/ tanggal\t: ${kal.hari}, ${tgl2(tglPertemuan)}`, { size: 20 })),
        para(run(`Waktu\t\t: ${pl.jadwal?.klarifikasi_waktu || '09.00 WIB'}`, { size: 20 })),
        para(run('\tTempat\t\t: RSUD dr. Soeratno Gemolong, Jl. RNgt Tjitrosantjoko No. 10 Gemolong', { size: 20 })),
        para(run('\tKeperluan\t: Klarifikasi dan negosiasi teknis dan harga', { size: 20 }), { after: 140 }),
        para(run('Demikian untuk mendapatkan perhatian dan atas kehadiran saudara kami ucapkan terima kasih.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(`Tahun ${d.tahun}`, { size: 18 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   5. BERITA ACARA PENETAPAN PEMENANG (ba_penetapan)
   ========================================================================== */
function baPenetapanPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BA Penetapan Pemenang' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const noDoc = pl.penetapan_nomor || `000.3.2/${pl.penetapan_no_urut || '2656'}/05.1.2/${d.tahun}`;
  const tglDoc = pl.penetapan_tanggal || pl.jadwal?.penetapan_tgl || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);
  const noBakn = d.t.bakn_nomor || `000.3.2/${d.t.bakn_no_urut || '2613.a'}/05.1.2/${d.tahun}`;

  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('BERITA ACARA PENETAPAN PEMENANG', 0, y, { width: W, align: 'center' });
  y += 16;
  doc.font('Helvetica').fontSize(10).text(`Nomor : ${noDoc}`, 0, y, { width: W, align: 'center' });
  y += 20;

  doc.font('Helvetica-Bold');
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + (d.rek?.uraian || paketTxt), xLeft + 120, y, { width: wFull - 120 });
  y = Math.max(doc.y + 3, y + 14);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. SOERATNO GEMOLONG', xLeft + 120, y);
  y += 14;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 120, y);
  y += 22;

  doc.font('Helvetica').fontSize(10).text(
    `Berdasarkan Berita Acara Klarifikasi dan Negosiasi Teknis dan Harga Nomor : ${noBakn}, pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, dengan ini Pejabat pengadaan RSUD dr. Soeratno Gemolong menetapkan penyedia untuk ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} adalah sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 14;

  y = drawDaftarHasil(doc, [
    ...itemPenyedia(d),
    { no: 5, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + '\n(' + terbKecil(d.penawaranTotal) + ')' },
    { no: 6, label: LBL_NEGO, val: hasilNego(d) },
    { no: 7, label: 'Harga Hasil Negosiasi', val: rpStrip(d.t.kotor) + '\n(' + terbKecil(d.t.kotor) + ')' },
  ], y, xLeft, wFull, 170);

  y += 10;
  doc.text(
    'Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y += 35;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 26, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function baPenetapanDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noDoc = pl.penetapan_nomor || `000.3.2/${pl.penetapan_no_urut || '2656'}/05.1.2/${d.tahun}`;
  const tglDoc = pl.penetapan_tanggal || pl.jadwal?.penetapan_tgl || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);
  const noBakn = d.t.bakn_nomor || `000.3.2/${d.t.bakn_no_urut || '2613.a'}/05.1.2/${d.tahun}`;

  const docx = new D.Document({
    creator: 'AdminProc', title: 'BA Penetapan Pemenang',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA PENETAPAN PEMENANG', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run(`Nomor : ${noDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
        para(run(`PEKERJAAN\t\t: ${d.rek?.uraian || paketTxt}`, { bold: true, size: 20 })),
        para(run('SUMBER DANA\t: BLUD RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 })),
        para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 120 }),
        para(run(`Berdasarkan Berita Acara Klarifikasi dan Negosiasi Teknis dan Harga Nomor : ${noBakn}, pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, dengan ini Pejabat pengadaan RSUD dr. Soeratno Gemolong menetapkan penyedia untuk ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} adalah sebagai berikut :`, { size: 20 }), { after: 120 }),
        tabelDaftarDocx([
          ...itemPenyedia(d),
          { no: 5, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + '\n(' + terbKecil(d.penawaranTotal) + ')' },
          { no: 6, label: LBL_NEGO, val: hasilNego(d) },
          { no: 7, label: 'Harga Hasil Negosiasi', val: rpStrip(d.t.kotor) + '\n(' + terbKecil(d.t.kotor) + ')' },
        ], W_CONTENT),
        para(run(''), { after: 140 }),
        para(run('Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(`Tahun ${d.tahun}`, { size: 18 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   6. BERITA ACARA HASIL PENGADAAN LANGSUNG (bahpl)
   ========================================================================== */
function bahplPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'BA Hasil Pengadaan Langsung (BAHPL)' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const defNomor = pl.bahpl_no_urut ? `${pl.bahpl_no_urut}.a` : (pl.penetapan_no_urut ? `${pl.penetapan_no_urut}.a` : '2656.a');
  const noDoc = pl.bahpl_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.bahpl_tanggal || pl.penetapan_tanggal || pl.jadwal?.penetapan_tgl || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('BERITA ACARA', 0, y, { width: W, align: 'center' });
  y += 15;
  doc.text('HASIL PENGADAAN LANGSUNG (BAHPL)', 0, y, { width: W, align: 'center' });
  y += 16;
  doc.font('Helvetica').fontSize(10).text(`Nomor : ${noDoc}`, 0, y, { width: W, align: 'center' });
  y += 20;

  doc.font('Helvetica-Bold');
  doc.text('PEKERJAAN', xLeft, y); doc.text(': ' + (d.rek?.uraian || paketTxt), xLeft + 120, y, { width: wFull - 120 });
  y = Math.max(doc.y + 3, y + 14);
  doc.text('SUMBER DANA', xLeft, y); doc.text(': BLUD RSUD dr. SOERATNO GEMOLONG', xLeft + 120, y);
  y += 14;
  doc.text('TAHUN ANGGARAN', xLeft, y); doc.text(': ' + d.tahun, xLeft + 120, y);
  y += 22;

  doc.font('Helvetica').fontSize(10).text(
    `Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah selesai melakukan evaluasi, klarifikasi dan negosiasi pada dokumen penawaran yang disampaikan oleh penyedia jasa untuk kegiatan ${paketTxt} dr. Soeratno Gemolong tahun ${d.tahun} dengan hasil sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 14;

  y = drawDaftarHasil(doc, [
    ...itemPenyedia(d),
    { no: 5, label: 'Hasil evaluasi penawaran', val: 'Lulus kualifikasi administrasi, teknis dan harga' },
    { no: 6, label: 'HPS', val: rpKoma(d.hpsTotal) + ' (' + terbKecil(d.hpsTotal) + ')' },
    { no: 7, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + ' (' + terbKecil(d.penawaranTotal) + ')' },
    { no: 8, label: LBL_NEGO, val: hasilNego(d) },
    { no: 9, label: 'Harga Hasil Negosiasi', val: rpKoma(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ')' },
  ], y, xLeft, wFull, 170);

  y += 10;
  doc.text(
    'Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y += 30;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 26, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function bahplDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.bahpl_no_urut ? `${pl.bahpl_no_urut}.a` : (pl.penetapan_no_urut ? `${pl.penetapan_no_urut}.a` : '2656.a');
  const noDoc = pl.bahpl_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = pl.bahpl_tanggal || pl.penetapan_tanggal || d.t.tanggal;
  const kal = tglKalimatBast(tglDoc);
  const paketTxt = getPaketTxt(d);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'BAHPL',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('BERITA ACARA', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run('HASIL PENGADAAN LANGSUNG (BAHPL)', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER }),
        para(run(`Nomor : ${noDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
        para(run(`PEKERJAAN\t\t: ${d.rek?.uraian || paketTxt}`, { bold: true, size: 20 })),
        para(run('SUMBER DANA\t: BLUD RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 })),
        para(run(`TAHUN ANGGARAN\t: ${d.tahun}`, { bold: true, size: 20 }), { after: 120 }),
        para(run(`Pada hari ini, ${kal.hari} tanggal ${kal.tanggalHuruf} bulan ${kal.bulan} tahun ${kal.tahunHuruf}, Pejabat pengadaan RSUD dr. Soeratno Gemolong telah selesai melakukan evaluasi, klarifikasi dan negosiasi pada dokumen penawaran yang disampaikan oleh penyedia jasa untuk kegiatan ${paketTxt} dr. Soeratno Gemolong tahun ${d.tahun} dengan hasil sebagai berikut :`, { size: 20 }), { after: 120 }),
        tabelDaftarDocx([
          ...itemPenyedia(d),
          { no: 5, label: 'Hasil evaluasi penawaran', val: 'Lulus kualifikasi administrasi, teknis dan harga' },
          { no: 6, label: 'HPS', val: rpKoma(d.hpsTotal) + ' (' + terbKecil(d.hpsTotal) + ')' },
          { no: 7, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + ' (' + terbKecil(d.penawaranTotal) + ')' },
          { no: 8, label: LBL_NEGO, val: hasilNego(d) },
          { no: 9, label: 'Harga Hasil Negosiasi', val: rpKoma(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ')' },
  ], W_CONTENT),
        para(run(''), { after: 140 }),
        para(run('Demikian berita acara ini dibuat dan ditandatangani pada hari, tanggal, bulan dan tahun sebagaimana tersebut diatas untuk dapat dipergunakan sebagaimana mestinya.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(`Tahun ${d.tahun}`, { size: 18 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   7. PENGUMUMAN HASIL PENGADAAN LANGSUNG (pengumuman_pl)
   ========================================================================== */
function pengumumanPlPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Pengumuman Hasil PL' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const defNomor = pl.pengumuman_no_urut ? `${pl.pengumuman_no_urut}.b` : (pl.penetapan_no_urut ? `${pl.penetapan_no_urut}.b` : '2656.b');
  const noDoc = pl.pengumuman_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.pengumuman_tanggal || pl.penetapan_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  y += 10;
  doc.font('Helvetica-Bold').fontSize(12).text('PENGUMUMAN', 0, y, { width: W, align: 'center' });
  y += 15;
  doc.text('HASIL PENGADAAN LANGSUNG', 0, y, { width: W, align: 'center' });
  y += 16;
  doc.font('Helvetica').fontSize(10).text(`Nomor : ${noDoc}`, 0, y, { width: W, align: 'center' });
  y += 20;

  doc.font('Helvetica').fontSize(10).text(
    `Berdasarkan Berita Acara Hasil Pengadaan Langsung untuk pekerjaan ${paketTxt} nomor : ${noBahpl}, maka dengan ini kami umumkan pemenang ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} sebagai berikut :`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 14;

  y = drawDaftarHasil(doc, [
    ...itemPenyedia(d),
    { no: 5, label: 'Hasil evaluasi penawaran', val: 'Lulus kualifikasi administrasi, teknis dan harga' },
    { no: 6, label: 'HPS', val: rpKoma(d.hpsTotal) + ' (' + terbKecil(d.hpsTotal) + ')' },
    { no: 7, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + ' (' + terbKecil(d.penawaranTotal) + ')' },
    { no: 8, label: LBL_NEGO, val: hasilNego(d) },
    { no: 9, label: 'Harga Hasil Negosiasi', val: rpKoma(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ')' },
  ], y, xLeft, wFull, 170);

  y += 10;
  doc.text(
    'Selanjutnya Pejabat Penandatangan Kontrak bersama penyedia barang/jasa akan menerbitkan SPK sebagai dasar perikatan untuk melaksanakan kegiatan tersebut diatas.',
    xLeft, y, { width: wFull, align: 'justify' }
  );
  y = doc.y + 8;
  doc.text('Demikian untuk diketahui dan harap menjadikan maklum.', xLeft, y, { width: wFull });
  y += 24;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglDoc}`, xTtd, y, { width: 200, align: 'center' });
  doc.text('Pejabat Pengadaan', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 26, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 39, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function pengumumanPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.pengumuman_no_urut ? `${pl.pengumuman_no_urut}.b` : (pl.penetapan_no_urut ? `${pl.penetapan_no_urut}.b` : '2656.b');
  const noDoc = pl.pengumuman_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.pengumuman_tanggal || pl.penetapan_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Pengumuman PL',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run('PENGUMUMAN', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
        para(run('HASIL PENGADAAN LANGSUNG', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER }),
        para(run(`Nomor : ${noDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
        para(run(`Berdasarkan Berita Acara Hasil Pengadaan Langsung untuk pekerjaan ${paketTxt} nomor : ${noBahpl}, maka dengan ini kami umumkan pemenang ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} sebagai berikut :`, { size: 20 }), { after: 120 }),
        tabelDaftarDocx([
          ...itemPenyedia(d),
          { no: 5, label: 'Hasil evaluasi penawaran', val: 'Lulus kualifikasi administrasi, teknis dan harga' },
          { no: 6, label: 'HPS', val: rpKoma(d.hpsTotal) + ' (' + terbKecil(d.hpsTotal) + ')' },
          { no: 7, label: 'Harga Penawaran', val: rpKoma(d.penawaranTotal) + ' (' + terbKecil(d.penawaranTotal) + ')' },
          { no: 8, label: LBL_NEGO, val: hasilNego(d) },
          { no: 9, label: 'Harga Hasil Negosiasi', val: rpKoma(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ')' },
  ], W_CONTENT),
        para(run(''), { after: 140 }),
        para(run('Selanjutnya Pejabat Penandatangan Kontrak bersama penyedia barang/jasa akan menerbitkan SPK sebagai dasar perikatan untuk melaksanakan kegiatan tersebut diatas.', { size: 20 })),
        para(run('Demikian untuk diketahui dan harap menjadikan maklum.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run(`Sragen, ${tglDoc}`, { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(`Tahun ${d.tahun}`, { size: 18 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   8. LAPORAN HASIL PENGADAAN LANGSUNG KEPADA PPK (laporan_pl)
   ========================================================================== */
function laporanPlPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Laporan Hasil Pengadaan Langsung' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const noDoc = pl.laporan_nomor || `000.3.2/${pl.laporan_no_urut || '2657'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.laporan_tanggal || pl.penetapan_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglDoc}`, W - 70 - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Nomor     : ${noDoc}`, xLeft, y); y += 13;
  doc.text('Lampiran : -', xLeft, y); y += 13;
  doc.text('Perihal    : Laporan Hasil Pengadaan Langsung', xLeft, y); y += 20;

  doc.font('Helvetica-Bold').text('Yth.', xLeft, y); y += 13;
  doc.text('Pejabat Pembuat Komitmen', xLeft, y); y += 13;
  doc.text(d.rek?.uraian || paketTxt, xLeft, y, { width: 340 }); y += 13;
  doc.font('Helvetica').text('di Tempat', xLeft, y);
  y = doc.y + 16;

  doc.font('Helvetica').fontSize(10).text(
    `Sehubungan dengan kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} yang kami laksanakan, maka dengan ini kami sampaikan bahwa kegiatan pengadaan tersebut diatas telah selesai kami laksanakan. Maka dengan ini mohon untuk segera ditindaklanjuti dengan menerbitkan Surat Perintah Kerja (SPK) oleh Pejabat Pembuat Komitmen (PPK).`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 12;

  doc.text('Bersama ini kami lampirkan dokumen - dokumen pada proses kegiatan pengadaan langsung tersebut diatas sebagai berikut :', xLeft, y, { width: wFull });
  y = doc.y + 8;

  const lampiranList = [
    '1. Dokumen Pengadaan',
    '2. Dokumen Penawaran',
    '3. Berita Acara Pembukaan Penawaran',
    '4. Berita Acara Hasil Evaluasi Penawaran',
    '5. Berita Acara Klarifikasi dan Negosiasi Teknis dan Harga',
    '6. Berita Acara Penetapan Pemenang',
    '7. Berita Acara Hasil Pengadaan Langsung',
    '8. Pengumuman Pemenang',
  ];
  for (const l of lampiranList) {
    doc.text(l, xLeft + 15, y);
    y += 14;
  }

  y += 10;
  doc.text('Demikian laporan ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.', xLeft, y, { width: wFull });
  y += 30;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  y += 92;
  doc.font('Helvetica').fontSize(10).text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function laporanPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noDoc = pl.laporan_nomor || `000.3.2/${pl.laporan_no_urut || '2657'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.laporan_tanggal || pl.penetapan_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Laporan Hasil PL',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run(`Sragen, ${tglDoc}`, { size: 20 }), { align: D.AlignmentType.RIGHT, before: 120 }),
        para(run(`Nomor\t\t: ${noDoc}`, { size: 20 })),
        para(run('Lampiran\t: -', { size: 20 })),
        para(run('Perihal\t\t: Laporan Hasil Pengadaan Langsung', { size: 20 }), { after: 140 }),
        para(run('Yth.', { bold: true, size: 20 })),
        para(run('Pejabat Pembuat Komitmen', { bold: true, size: 20 })),
        para(run(d.rek?.uraian || paketTxt, { bold: true, size: 20 })),
        para(run('di Tempat', { size: 20 }), { after: 140 }),
        para(run(`Sehubungan dengan kegiatan ${paketTxt} RSUD dr. Soeratno Gemolong tahun ${d.tahun} yang kami laksanakan, maka dengan ini kami sampaikan bahwa kegiatan pengadaan tersebut diatas telah selesai kami laksanakan. Maka dengan ini mohon untuk segera ditindaklanjuti dengan menerbitkan Surat Perintah Kerja (SPK) oleh Pejabat Pembuat Komitmen (PPK).`, { size: 20 }), { after: 120 }),
        para(run('Bersama ini kami lampirkan dokumen - dokumen pada proses kegiatan pengadaan langsung tersebut diatas sebagai berikut :', { size: 20 }), { after: 80 }),
        ...[
          '1. Dokumen Pengadaan',
          '2. Dokumen Penawaran',
          '3. Berita Acara Pembukaan Penawaran',
          '4. Berita Acara Hasil Evaluasi Penawaran',
          '5. Berita Acara Klarifikasi dan Negosiasi Teknis dan Harga',
          '6. Berita Acara Penetapan Pemenang',
          '7. Berita Acara Hasil Pengadaan Langsung',
          '8. Pengumuman Pemenang',
        ].map((it) => para(run(it, { size: 20 }), { indent: { left: 400 } })),
        para(run('Demikian laporan ini kami sampaikan, atas perhatiannya kami ucapkan terima kasih.', { size: 20 }), { before: 120, after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pengadaan', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   9. SURAT PENUNJUKAN PENYEDIA BARANG / JASA (sppbj)
   ========================================================================== */
function sppbjPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'SPPBJ' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const noDoc = pl.sppbj_nomor || `000.3.2/${pl.sppbj_no_urut || '1769'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.sppbj_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const noPenawaran = pl.penawaran_nomor || `05/PNWR/${d.t.penyedia?.split(' ')[0] || 'VND'}/${d.tahun}`;
  const tglPenawaran = tgl2(pl.penawaran_tanggal || pl.jadwal?.pemasukan_tgl || d.t.tanggal);

  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglDoc}`, W - 70 - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Nomor     : ${noDoc}`, xLeft, y); y += 13;
  doc.text('Lampiran : -', xLeft, y); y += 13;
  doc.text(`Perihal    : Penunjukan Penyedia untuk Pelaksanaan Paket Pengadaan\n             ${paketTxt}`, xLeft, y, { width: wFull });
  y = doc.y + 16;

  doc.font('Helvetica').text('Kepada Yth.', xLeft, y); y += 13;
  doc.text(`${d.t.penyedia_jabatan || 'Direktur'}`, xLeft, y); y += 13;
  doc.text(d.t.penyedia || '-', xLeft, y); y += 13;
  doc.font('Helvetica').text(d.t.penyedia_alamat || 'Sragen', xLeft, y, { width: 340 });
  y = doc.y + 16;

  doc.font('Helvetica').fontSize(10).text(
    `Dengan ini kami beritahukan bahwa penawaran Saudara nomor ${noPenawaran} tanggal ${tglPenawaran} tentang Penawaran Harga ${paketTxt} dengan hasil negosiasi harga sebesar ${rupiah(d.t.kotor)} (${d.terbilang}) kami nyatakan diterima/disetujui.`,
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 12;

  doc.text(
    'Sebagai tindak lanjut dari Surat Penunjukan Penyedia Barang/Jasa (SPPBJ) ini Saudara diharuskan menandatangani SPK paling lambat 14 (empat belas) hari kerja setelah diterbitkannya SPPBJ. Kegagalan Saudara untuk menerima penunjukan ini yang disusun berdasarkan evaluasi terhadap penawaran Saudara, akan dikenakan sanksi sesuai ketentuan dalam Peraturan Perundangan terkait tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknisnya.',
    xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 }
  );
  y = doc.y + 24;

  const xTtd = W - 70 - 220;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pembuat Komitmen', xTtd, y, { width: 220, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 220, align: 'center' });
  y += 92;
  doc.font('Helvetica').text(d.ppkom.nama || 'dr. Sumarji, Sp. N.', xTtd, y, { width: 220, align: 'center', underline: true });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.ppkom.nip), xTtd, y + 13, { width: 220, align: 'center' });

  y = doc.y + 20;
  doc.font('Helvetica-Bold').fontSize(9).text('Tembusan Yth. :', xLeft, y); y += 12;
  doc.font('Helvetica').text('1. KPA Pada Rumah Sakit Umum Daerah dr. Soeratno Gemolong', xLeft, y); y += 11;
  doc.text('2. SPI', xLeft, y);

  return doc;
}

async function sppbjDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noDoc = pl.sppbj_nomor || `000.3.2/${pl.sppbj_no_urut || '1769'}/05.1.2/${d.tahun}`;
  const tglDoc = tgl2(pl.sppbj_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const noPenawaran = pl.penawaran_nomor || `05/PNWR/${d.t.penyedia?.split(' ')[0] || 'VND'}/${d.tahun}`;
  const tglPenawaran = tgl2(pl.penawaran_tanggal || pl.jadwal?.pemasukan_tgl || d.t.tanggal);

  const docx = new D.Document({
    creator: 'AdminProc', title: 'SPPBJ',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run(`Sragen, ${tglDoc}`, { size: 20 }), { align: D.AlignmentType.RIGHT, before: 120 }),
        para(run(`Nomor\t\t: ${noDoc}`, { size: 20 })),
        para(run('Lampiran\t: -', { size: 20 })),
        para(run(`Perihal\t\t: Penunjukan Penyedia untuk Pelaksanaan Paket Pengadaan ${paketTxt}`, { size: 20 }), { after: 140 }),
        para(run('Kepada Yth.', { bold: true, size: 20 })),
        para(run(d.t.penyedia_jabatan || 'Direktur', { size: 20 })),
        para(run(d.t.penyedia || '-', { bold: true, size: 20 })),
        para(run(d.t.penyedia_alamat || 'Sragen', { size: 20 }), { after: 140 }),
        para(run(`Dengan ini kami beritahukan bahwa penawaran Saudara nomor ${noPenawaran} tanggal ${tglPenawaran} tentang Penawaran Harga ${paketTxt} dengan hasil negosiasi harga sebesar ${rupiah(d.t.kotor)} (${d.terbilang}) kami nyatakan diterima/disetujui.`, { size: 20 }), { after: 120 }),
        para(run('Sebagai tindak lanjut dari Surat Penunjukan Penyedia Barang/Jasa (SPPBJ) ini Saudara diharuskan menandatangani SPK paling lambat 14 (empat belas) hari kerja setelah diterbitkannya SPPBJ. Kegagalan Saudara untuk menerima penunjukan ini yang disusun berdasarkan evaluasi terhadap penawaran Saudara, akan dikenakan sanksi sesuai ketentuan dalam Peraturan Perundangan terkait tentang Pengadaan Barang/Jasa Pemerintah beserta petunjuk teknisnya.', { size: 20 }), { after: 200 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA },
          columnWidths: [4513, 4513],
          borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.ppkom.nama || 'dr. Sumarji, Sp. N.', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.ppkom.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
        para(run('Tembusan Yth. :', { bold: true, size: 19 }), { before: 140 }),
        para(run('1. KPA Pada Rumah Sakit Umum Daerah dr. Soeratno Gemolong', { size: 18 })),
        para(run('2. SPI', { size: 18 })),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

/* ==========================================================================
   10. SURAT PERINTAH KERJA (spk) — 2 HALAMAN (SPK & LAMPIRAN RINCIAN)
   ========================================================================== */
function spkPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Surat Perintah Kerja (SPK)' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140;

  // ── HALAMAN 1: INDUK SURAT PERINTAH KERJA (SPK) ──────────────────────────
  let y = drawKop(doc, d.s, 32);

  const pl = d.pl || {};
  const noSpk = d.t.spk_nomor || pl.spk_nomor || `000.3.2/${d.t.spk_no_urut || pl.spk_no_urut || '2673'}/05.1.2/${d.tahun}`;
  const tglSpk = tgl2(d.t.spk_tanggal || pl.spk_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tgl2(pl.undangan_tanggal || d.t.tanggal);
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglBahpl = tgl2(pl.bahpl_tanggal || pl.penetapan_tanggal || d.t.tanggal);

  const jenisKontrak = pl.spk_jenis_kontrak || 'Kontrak Harga Satuan';
  const waktuHari = pl.spk_waktu_hari ? `${pl.spk_waktu_hari} (${terbilang(pl.spk_waktu_hari).replace(/ rupiah$/i, '').toLowerCase()}) hari kalender` : '30 (tiga puluh) hari kalender';

  const X0 = xLeft, XM = xLeft + 150, X2 = xLeft + wFull;
  const FS = 9.5;
  const ln = (x1, y1, x2, y2) => doc.save().lineWidth(0.8).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
  const kotak = (yy, hh, bagi = false) => { doc.save().lineWidth(0.8).strokeColor('#000').rect(X0, yy, wFull, hh).stroke().restore(); if (bagi) ln(XM, yy, XM, yy + hh); };
  const T = (txt, x, yy, w, o = {}) => doc.font(o.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(o.size || FS).fillColor('#000').text(txt, x, yy, { width: w, align: o.align, lineGap: 1.5, underline: !!o.ul });
  const H = (txt, w, bold = false) => { doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(FS); return doc.heightOfString(String(txt), { width: w, lineGap: 1.5 }); };
  const wKiri = XM - X0 - 12, wKanan = X2 - XM - 14;

  y += 8;
  // Baris 1: judul | satuan kerja, nomor dan tanggal
  const h1 = 96;
  kotak(y, h1, true);
  T('SURAT PERINTAH\nKERJA (SPK)', X0 + 6, y + (h1 - 26) / 2, wKiri, { bold: true, size: 10.5 });
  T('SATUAN KERJA : RSUD dr. SOERATNO GEMOLONG', XM + 8, y + 8, wKanan, { bold: true });
  T('NOMOR DAN TANGGAL SPK', XM + 8, y + 30, wKanan);
  T('Nomor', XM + 8, y + 52, 60); T(': ' + noSpk, XM + 78, y + 52, wKanan - 70);
  T('Tanggal', XM + 8, y + 72, 60); T(': ' + tglSpk, XM + 78, y + 72, wKanan - 70);
  y += h1;

  // Baris 2-3: PPK, penyedia
  const baris2 = (kiri, kanan) => {
    const hh = Math.max(H(kiri, wKiri), H(kanan, wKanan)) + 12;
    kotak(y, hh, true);
    T(kiri, X0 + 6, y + 6, wKiri); T(kanan, XM + 8, y + 6, wKanan);
    y += hh;
  };
  baris2('Pejabat Pembuat Komitmen (PPK)', ': ' + (d.ppkom.nama || '-'));
  baris2('Penyedia', ': ' + (d.t.penyedia || '-'));

  // Baris 4: paket pekerjaan | surat undangan & BA hasil PL
  const hPaket = H('PAKET PEKERJAAN :', wKiri, true) + 4 + H(paketTxt, wKiri) + 14;
  const h4 = Math.max(hPaket, 112);
  kotak(y, h4, true);
  T('PAKET PEKERJAAN :', X0 + 6, y + 8, wKiri, { bold: true });
  T(paketTxt, X0 + 6, y + 8 + 14, wKiri);
  const grup = (yy, judul, no, tgl) => {
    T(judul, XM + 8, yy, wKanan);
    T('Nomor', XM + 8, yy + 18, 60); T(': ' + no, XM + 78, yy + 18, wKanan - 70);
    T('Tanggal', XM + 8, yy + 34, 60); T(': ' + tgl, XM + 78, yy + 34, wKanan - 70);
  };
  grup(y + 6, 'SURAT UNDANGAN PENGADAAN LANGSUNG', noUndangan, tglUndangan);
  ln(XM, y + h4 / 2, X2, y + h4 / 2);
  grup(y + h4 / 2 + 6, 'BERITA ACARA HASIL PENGADAAN LANGSUNG', noBahpl, tglBahpl);
  y += h4;

  // Baris lebar penuh
  const barisPenuh = (teks, o = {}) => {
    const hh = H(teks, wFull - 12, o.bold) + 12;
    kotak(y, hh);
    T(teks, X0 + 6, y + 6, wFull - 12, o);
    y += hh;
  };
  barisPenuh('SUMBER DANA :\nDIPA/DPA BLUD RSUD dr. Soeratno Gemolong Tahun Anggaran ' + d.tahun + ' untuk mata anggaran ' + (d.rek?.uraian || paketTxt) + ' RSUD dr. Soeratno Gemolong.');
  barisPenuh('Nilai Kontrak termasuk Pajak Pertambahan Nilai (PPN) adalah sebesar ' + rpStrip(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ').');
  barisPenuh('JENIS KONTRAK : ' + jenisKontrak + '.');
  barisPenuh('WAKTU PELAKSANAAN PEKERJAAN : ' + waktuHari + '.');
  barisPenuh('INSTRUKSI KEPADA PENYEDIA : Penagihan hanya dapat dilakukan setelah penyelesaian pekerjaan yang diperintahkan dalam SPK ini dan dibuktikan dengan Berita Acara Serah Terima. Jika pekerjaan tidak dapat diselesaikan dalam jangka waktu pelaksanaan pekerjaan karena kesalahan atau kelalaian Penyedia maka Penyedia berkewajiban untuk membayar denda kepada PPK sebesar 1/1000 (satu per seribu) dari bagian tertentu nilai SPK sebelum PPN setiap hari kalender keterlambatan.');

  // Baris tanda tangan dua pihak (di dalam kotak)
  const hTtd = 150;
  kotak(y, hTtd);
  const wCol = wFull / 2;
  T('Untuk dan atas nama', X0, y + 14, wCol, { align: 'center' });
  T('RSUD dr. Soeratno Gemolong', X0, y + 26, wCol, { align: 'center' });
  T('Pejabat Pembuat Komitmen', X0, y + 38, wCol, { align: 'center' });
  T('Untuk dan atas nama Penyedia', X0 + wCol, y + 14, wCol, { align: 'center' });
  T(d.t.penyedia || '-', X0 + wCol, y + 26, wCol - 6, { align: 'center' });
  T('Materai 10rb', X0 + wCol, y + 68, wCol, { align: 'center' });
  T(d.ppkom.nama || '-', X0, y + 112, wCol, { align: 'center', ul: true });
  T(nipTxt(d.ppkom.nip), X0, y + 125, wCol, { align: 'center', size: 9 });
  T(d.t.penyedia_pimpinan || '………………………', X0 + wCol, y + 112, wCol, { align: 'center', ul: true });
  T(d.t.penyedia_jabatan || 'Direktur', X0 + wCol, y + 125, wCol, { align: 'center', size: 9 });

  // ── HALAMAN 2: LAMPIRAN SURAT PERINTAH KERJA (RINCIAN BARANG) ─────────────
  doc.addPage({ size: [595.28, 935.43], margin: 0 });
  y = drawKop(doc, d.s, 32);

  const defLampUrut = d.t.spk_no_urut || pl.spk_no_urut ? `${d.t.spk_no_urut || pl.spk_no_urut}.a` : '2673.a';
  const noLamp = `000.3.2/${defLampUrut}/05.1.2/${d.tahun}`;

  y += 8;
  doc.font('Helvetica').fontSize(10);
  doc.text('Lampiran', xLeft, y); y += 15;
  doc.text('Surat Perintah Kerja', xLeft, y); y += 15;
  doc.text('Nomor   : ' + noLamp, xLeft, y); y += 15;
  doc.text('Tanggal : ' + tglSpk, xLeft, y); y += 22;

  // Tabel barang: garis penuh, baris nomor kolom abu-abu
  const CW = [30, 205, 52, 56, 56, 56];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);
  const lg = (x1, y1, x2, y2) => doc.save().lineWidth(0.8).strokeColor('#000').moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
  const yT = y, hHdr = 32, hNo = 14;
  doc.font('Helvetica').fontSize(9.5).fillColor('#000');
  const mid = (t, k, yy, hh) => { const th = doc.heightOfString(t, { width: CW[k] - 4 }); doc.text(t, X[k] + 2, yy + (hh - th) / 2, { width: CW[k] - 4, align: 'center' }); };
  ['No', 'Uraian', 'Unit/\nSatuan', 'Kuantitas\n/ Volume', 'Harga\nSatuan (Rp)', 'Jumlah (Rp)'].forEach((t, k) => mid(t, k, yT, hHdr));
  y = yT + hHdr;
  doc.save().rect(X[0], y, wFull, hNo).fill('#cfcfcf').restore();
  doc.fillColor('#000').font('Helvetica-Oblique').fontSize(8.5);
  ['1', '2', '3', '4', '5', '6'].forEach((t, k) => mid(t, k, y, hNo));
  y += hNo;

  const yIsi = y;
  let totalKotor = 0;
  doc.font('Helvetica').fontSize(9);
  d.items.forEach((it, idx) => {
    const qty = Math.round(Number(it.kuantitas)) || 1;
    const hs = Math.round(Number(it.harga_satuan) || 0);
    totalKotor += qty * hs;
    const uraian = it.jenis_barang || '-';
    const rowH = Math.max(24, doc.heightOfString(uraian, { width: CW[1] - 10, lineGap: 1.5 }) + 10);
    doc.text(String(idx + 1) + '.', X[0], y + 6, { width: CW[0], align: 'center' });
    doc.text(uraian, X[1] + 5, y + 5, { width: CW[1] - 10, lineGap: 1.5 });
    doc.text(it.satuan || 'Unit', X[2], y + 6, { width: CW[2], align: 'center' });
    doc.text(String(qty), X[3], y + 6, { width: CW[3], align: 'center' });
    doc.text(fmtNum(hs), X[4], y + 6, { width: CW[4] - 5, align: 'right' });
    doc.text(fmtNum(qty * hs), X[5], y + 6, { width: CW[5] - 5, align: 'right' });
    y += rowH;
  });
  const yAkhirIsi = y;
  const grandTotal = totalKotor || d.t.kotor || 0;
  const hTot = 18;
  doc.font('Helvetica').fontSize(9).text('Total (termasuk PPN 11%)', X[0] + 6, y + 5);
  doc.text(fmtNum(grandTotal), X[5], y + 5, { width: CW[5] - 5, align: 'right' });
  y += hTot;
  doc.text('Terbilang : ' + terbKecil(grandTotal), X[0] + 6, y + 5, { width: wFull - 12 });
  const yEnd = y + 20;
  // garis tabel
  [yT, yT + hHdr, yT + hHdr + hNo, yAkhirIsi, yAkhirIsi + hTot, yEnd].forEach((yy) => lg(X[0], yy, X[6], yy));
  X.forEach((x, k) => { if (k === 0 || k === 6) lg(x, yT, x, yEnd); else if (k === 5) lg(x, yT, x, yAkhirIsi + hTot); else lg(x, yT, x, yAkhirIsi); });
  y = yEnd + 26;

  // tanda tangan lampiran (tanpa kotak)
  doc.font('Helvetica').fontSize(9.5);
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y, { width: wCol, align: 'center' });
  doc.text('Pejabat Pembuat Komitmen', xLeft, y + 12, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia || '-', xLeft + wCol, y, { width: wCol, align: 'center' });
  doc.text('Materai 10rb', xLeft + wCol, y + 36, { width: wCol, align: 'center' });
  y += 92;
  doc.text(d.ppkom.nama || '-', xLeft, y, { width: wCol, align: 'center', underline: true });
  doc.fontSize(9).text(nipTxt(d.ppkom.nip), xLeft, y + 13, { width: wCol, align: 'center' });
  doc.fontSize(9.5).text(d.t.penyedia_pimpinan || '………………………', xLeft + wCol, y, { width: wCol, align: 'center', underline: true });
  doc.fontSize(9).text(d.t.penyedia_jabatan || 'Direktur', xLeft + wCol, y + 13, { width: wCol, align: 'center' });

  return doc;
}

async function spkDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noSpk = d.t.spk_nomor || pl.spk_nomor || `000.3.2/${d.t.spk_no_urut || pl.spk_no_urut || '2673'}/05.1.2/${d.tahun}`;
  const tglSpk = tgl2(d.t.spk_tanggal || pl.spk_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tgl2(pl.undangan_tanggal || d.t.tanggal);
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglBahpl = tgl2(pl.bahpl_tanggal || pl.penetapan_tanggal || d.t.tanggal);

  const jenisKontrak = pl.spk_jenis_kontrak || 'Kontrak Harga Satuan';
  const waktuHari = pl.spk_waktu_hari ? `${pl.spk_waktu_hari} (${terbilang(pl.spk_waktu_hari).replace(/ rupiah$/i, '').toLowerCase()}) hari kalender` : '30 (tiga puluh) hari kalender';

  const defLampUrut = d.t.spk_no_urut || pl.spk_no_urut ? `${d.t.spk_no_urut || pl.spk_no_urut}.a` : '2673.a';
  const noLamp = `000.3.2/${defLampUrut}/05.1.2/${d.tahun}`;

  // Tabel Barang Lampiran
  const tblBarang = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [600, 4200, 1000, 800, 1200, 1226],
    borders: bdrAll,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('No', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run('Uraian', { bold: true, size: 18 })), { w: 4200, ...bdrAll }),
          cell(para(run('Satuan', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 1000, ...bdrAll }),
          cell(para(run('Vol', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 800, ...bdrAll }),
          cell(para(run('Harga (Rp)', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 1200, ...bdrAll }),
          cell(para(run('Jumlah (Rp)', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 1226, ...bdrAll }),
        ],
      }),
      ...d.items.map((it, idx) => {
        const qty = Number(it.kuantitas) || 1;
        const hs = Math.round(Number(it.harga_satuan) || 0);
        return new D.TableRow({
          children: [
            cell(para(run(String(idx + 1) + '.', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
            cell(para(run(it.jenis_barang || '-', { size: 18 })), { w: 4200, ...bdrAll }),
            cell(para(run(it.satuan || 'Unit', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 1000, ...bdrAll }),
            cell(para(run(String(qty), { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 800, ...bdrAll }),
            cell(para(run(fmtNum(hs), { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: 1200, ...bdrAll }),
            cell(para(run(fmtNum(qty * hs), { size: 18 }), { align: D.AlignmentType.RIGHT }), { w: 1226, ...bdrAll }),
          ],
        });
      }),
      new D.TableRow({
        children: [
          cell(para(run('Total (termasuk PPN 11%)', { bold: true, size: 18 })), { w: 6600, span: 4, ...bdrAll }),
          cell(para(run(fmtNum(d.t.kotor || 0), { bold: true, size: 18 }), { align: D.AlignmentType.RIGHT }), { w: 2426, span: 2, ...bdrAll }),
        ],
      }),
    ],
  });

  // Halaman 1: seluruhnya berborder seperti contoh
  const w2 = [3000, 6026];
  const PT = (t, o = {}) => para(run(t, { size: o.size || 19, bold: o.bold, underline: o.underline }), { align: o.align, before: o.before });
  const sel2 = (kiri, kanan) => new D.TableRow({ children: [cell(kiri, { w: w2[0], ...bdrAll, v: D.VerticalAlign.TOP, mt: 80, mb: 80 }), cell(kanan, { w: w2[1], ...bdrAll, v: D.VerticalAlign.TOP, mt: 80, mb: 80 })] });
  const barisPenuh = (children) => new D.TableRow({ children: [cell(children, { w: W_CONTENT, span: 2, ...bdrAll, v: D.VerticalAlign.TOP, mt: 80, mb: 80 })] });
  const tblSpk = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA }, columnWidths: w2, borders: bdrAll,
    rows: [
      sel2(PT('SURAT PERINTAH KERJA (SPK)', { bold: true, size: 20 }), [PT('SATUAN KERJA : RSUD dr. SOERATNO GEMOLONG', { bold: true }), PT('NOMOR DAN TANGGAL SPK', { before: 120 }), PT('Nomor     : ' + noSpk, { before: 80 }), PT('Tanggal   : ' + tglSpk, { before: 60 })]),
      sel2(PT('Pejabat Pembuat Komitmen (PPK)'), PT(': ' + (d.ppkom.nama || '-'))),
      sel2(PT('Penyedia'), PT(': ' + (d.t.penyedia || '-'))),
      sel2([PT('PAKET PEKERJAAN :', { bold: true }), PT(paketTxt)], [
        PT('SURAT UNDANGAN PENGADAAN LANGSUNG'), PT('Nomor     : ' + noUndangan), PT('Tanggal   : ' + tglUndangan),
        PT('BERITA ACARA HASIL PENGADAAN LANGSUNG', { before: 160 }), PT('Nomor     : ' + noBahpl), PT('Tanggal   : ' + tglBahpl),
      ]),
      barisPenuh([PT('SUMBER DANA :'), PT('DIPA/DPA BLUD RSUD dr. Soeratno Gemolong Tahun Anggaran ' + d.tahun + ' untuk mata anggaran ' + (d.rek?.uraian || paketTxt) + ' RSUD dr. Soeratno Gemolong.')]),
      barisPenuh(PT('Nilai Kontrak termasuk Pajak Pertambahan Nilai (PPN) adalah sebesar ' + rpStrip(d.t.kotor) + ' (' + terbKecil(d.t.kotor) + ').')),
      barisPenuh(PT('JENIS KONTRAK : ' + jenisKontrak + '.')),
      barisPenuh(PT('WAKTU PELAKSANAAN PEKERJAAN : ' + waktuHari + '.')),
      barisPenuh(PT('INSTRUKSI KEPADA PENYEDIA : Penagihan hanya dapat dilakukan setelah penyelesaian pekerjaan yang diperintahkan dalam SPK ini dan dibuktikan dengan Berita Acara Serah Terima. Jika pekerjaan tidak dapat diselesaikan dalam jangka waktu pelaksanaan pekerjaan karena kesalahan atau kelalaian Penyedia maka Penyedia berkewajiban untuk membayar denda kepada PPK sebesar 1/1000 (satu per seribu) dari bagian tertentu nilai SPK sebelum PPN setiap hari kalender keterlambatan.')),
      barisPenuh(new D.Table({
        width: { size: 8800, type: D.WidthType.DXA }, columnWidths: [4400, 4400], borders: { ...NOBORDER, insideHorizontal: NONE, insideVertical: NONE },
        rows: [new D.TableRow({ children: [
          cell([PT('Untuk dan atas nama', { align: D.AlignmentType.CENTER }), PT('RSUD dr. Soeratno Gemolong', { align: D.AlignmentType.CENTER }), PT('Pejabat Pembuat Komitmen', { align: D.AlignmentType.CENTER }), PT('', { before: 1300 }), PT(d.ppkom.nama || '-', { align: D.AlignmentType.CENTER, underline: true }), PT(nipTxt(d.ppkom.nip), { align: D.AlignmentType.CENTER, size: 18 })], { w: 4400, v: D.VerticalAlign.TOP }),
          cell([PT('Untuk dan atas nama Penyedia', { align: D.AlignmentType.CENTER }), PT(d.t.penyedia || '-', { align: D.AlignmentType.CENTER }), PT('Materai 10rb', { align: D.AlignmentType.CENTER, before: 500 }), PT('', { before: 500 }), PT(d.t.penyedia_pimpinan || '………………………', { align: D.AlignmentType.CENTER, underline: true }), PT(d.t.penyedia_jabatan || 'Direktur', { align: D.AlignmentType.CENTER, size: 18 })], { w: 4400, v: D.VerticalAlign.TOP }),
        ] })],
      })),
    ],
  });

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Surat Perintah Kerja (SPK)',
    sections: [
      // Section 1: SPK
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          makeKopDocx(d.s, W_CONTENT),
          para(run(''), { before: 100 }),
          tblSpk,
        ],
      },
      // Section 2: Lampiran SPK
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          makeKopDocx(d.s, W_CONTENT),
          para(run('Lampiran Surat Perintah Kerja', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
          para(run(`Nomor : ${noLamp}`, { size: 20 }), { align: D.AlignmentType.CENTER }),
          para(run(`Tanggal : ${tglSpk}`, { size: 20 }), { align: D.AlignmentType.CENTER, after: 140 }),
          tblBarang,
          para(run(`Terbilang : ${terbilang(d.t.kotor || 0)}`, { size: 20 }), { before: 100, after: 180 }),
          new D.Table({
            width: { size: W_CONTENT, type: D.WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: NOBORDER,
            rows: [new D.TableRow({
              children: [
                cell([
                  para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(''), { before: 1300 }),
                  para(run(d.ppkom.nama || '-', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(nipTxt(d.ppkom.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
                cell([
                  para(run(d.t.penyedia || '-', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('[ Materai 10.000 ]', { size: 16, italics: true }), { align: D.AlignmentType.CENTER, before: 200 }),
                  para(run(''), { before: 300 }),
                  para(run(d.t.penyedia_pimpinan || '………………………', { underline: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(d.t.penyedia_jabatan || 'Direktur', { size: 18 }), { align: D.AlignmentType.CENTER }),
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

/* ==========================================================================
   SURAT PENYERAHAN PEKERJAAN PENGADAAN — E-Purchasing (PPK -> Pejabat Pengadaan)
   Memakai kolom nomor/tanggal Surat Pesanan (sp_*) karena alur E-Purchasing tidak punya SP.
   ========================================================================== */
function teksPenyerahan(d) {
  const rek = (d.rek?.uraian || '').trim();
  const paket = (d.t.uraian || '').trim();
  const nilai = Number(d.hpsTotal) || 0;
  return {
    noDoc: d.t.sp_nomor || `000.3.2/${d.t.sp_no_urut || '1607'}/05.1.2/${d.tahun}`,
    tglDoc: tglIndo(d.t.sp_tanggal || d.t.tanggal),
    buka: `Dengan hormat kami beritahukan bahwa pada Tahun Anggaran ${d.tahun} Rumah Sakit Umum Daerah dr. Soeratno Gemolong Kabupaten Sragen mempunyai alokasi dana untuk kegiatan :`,
    kegiatan: `${paket && paket.toLowerCase() !== rek.toLowerCase() ? `${rek} untuk ${paket}` : (rek || paket)} dengan nilai Harga Perkiraan Sendiri sebesar Rp${fmtNum(nilai)},- (${terbilang(nilai)})`,
    mohon: 'Sehubungan dengan hal tersebut demi kelancaran pelaksanaannya, maka dengan ini kami mohon bantuan Pejabat Pengadaan Barang dan Jasa RSUD dr. Soeratno Gemolong untuk melaksanakan proses pengadaan barang/jasa tersebut.',
    lampiran: ['Spesifikasi teknis', ...(nilai > BATAS_HPS_EPUR ? ['HPS (Harga Perkiraan Sendiri)'] : [])],
    tutup: 'Demikian kami sampaikan permohonan kami, mohon ditindaklanjuti dan atas kerja samanya kami ucapkan terima kasih.',
  };
}

function penyerahanPpPdf(d) {
  const doc = new PDFDocument({ size: [595.28, 935.43], margin: 0, info: { Title: 'Surat Penyerahan Pekerjaan Pengadaan' } });
  const W = doc.page.width, xLeft = 70, wFull = W - 140, xKanan = 315, wKanan = W - 70 - 315;
  const t = teksPenyerahan(d);
  let y = drawKop(doc, d.s, 32) + 10;

  doc.font('Helvetica').fontSize(10.5);
  doc.text(`Gemolong, ${t.tglDoc}`, 350, y); y += 20;
  for (const [k, v] of [['Nomor', t.noDoc], ['Lamp', '1 bendel'], ['Hal', 'Penyerahan Pekerjaan Pengadaan']]) {
    doc.text(k, xLeft, y); doc.text(': ' + v, xLeft + 55, y); y += 14;
  }
  y += 14;
  for (const baris of ['Kepada,', 'Yth . Pejabat Pengadaan Barang dan Jasa RSUD', 'dr. Soeratno Gemolong', 'di –']) { doc.text(baris, xKanan, y); y += 12.5; }
  doc.text('G E M O L O N G', xKanan + 25, y); y += 28;

  doc.text(t.buka, xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5, indent: 30 });
  y = doc.y + 10;
  doc.text(t.kegiatan, xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 });
  y = doc.y + 14;
  doc.text(t.mohon, xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5 });
  y = doc.y + 10;
  doc.text('Adapun kelengkapan berkas sebagai berikut :', xLeft + 30, y); y += 18;
  t.lampiran.forEach((l, i) => { doc.text(`${i + 1}.`, xLeft + 8, y); doc.text(l, xLeft + 28, y); y += 14; });
  y += 4;
  doc.text(t.tutup, xLeft, y, { width: wFull, align: 'justify', lineGap: 2.5, indent: 30 });
  y = doc.y + 34;

  doc.text('Pejabat Pembuat Komitmen', xKanan, y, { width: wKanan, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xKanan, y + 14, { width: wKanan, align: 'center' });
  doc.text('Kabupaten Sragen', xKanan, y + 28, { width: wKanan, align: 'center' });
  y += 112;
  doc.text(d.ppkom.nama || '………………………………', xKanan, y, { width: wKanan, align: 'center', underline: true });
  doc.text(nipTxt(d.ppkom.nip), xKanan, y + 14, { width: wKanan, align: 'center' });
  return doc;
}

async function penyerahanPpDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const t = teksPenyerahan(d);
  const geser = { left: 4900 };
  const docx = new D.Document({
    creator: 'AdminProc', title: 'Surat Penyerahan Pekerjaan Pengadaan',
    sections: [{
      properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
      children: [
        makeKopDocx(d.s, W_CONTENT),
        para(run(`Gemolong, ${t.tglDoc}`, { size: 21 }), { indent: geser, before: 200, after: 120 }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA }, columnWidths: [1100, W_CONTENT - 1100], borders: NOBORDER,
          rows: [['Nomor', t.noDoc], ['Lamp', '1 bendel'], ['Hal', 'Penyerahan Pekerjaan Pengadaan']].map(([k, v]) => new D.TableRow({
            children: [cell(para(run(k, { size: 21 })), { w: 1100, mt: 10, mb: 10 }), cell(para(run(': ' + v, { size: 21 })), { w: W_CONTENT - 1100, mt: 10, mb: 10 })],
          })),
        }),
        para(run('Kepada,', { size: 21 }), { indent: geser, before: 200 }),
        para(run('Yth . Pejabat Pengadaan Barang dan Jasa RSUD dr. Soeratno Gemolong', { size: 21 }), { indent: geser }),
        para(run('di –', { size: 21 }), { indent: geser }),
        para(run('G E M O L O N G', { size: 21 }), { indent: { left: 5500 }, after: 240 }),
        para(run(t.buka, { size: 21 }), { align: D.AlignmentType.JUSTIFIED, line: 276, after: 140, indent: { firstLine: 500 } }),
        para(run(t.kegiatan, { size: 21 }), { align: D.AlignmentType.JUSTIFIED, line: 276, after: 200 }),
        para(run(t.mohon, { size: 21 }), { align: D.AlignmentType.JUSTIFIED, line: 276, after: 140 }),
        para(run('Adapun kelengkapan berkas sebagai berikut :', { size: 21 }), { indent: { firstLine: 500 }, after: 80 }),
        ...t.lampiran.map((l, i) => para(run(`${i + 1}.   ${l}`, { size: 21 }), { indent: { left: 360 } })),
        para(run(t.tutup, { size: 21 }), { align: D.AlignmentType.JUSTIFIED, line: 276, before: 100, after: 240, indent: { firstLine: 500 } }),
        new D.Table({
          width: { size: W_CONTENT, type: D.WidthType.DXA }, columnWidths: [4513, 4513], borders: NOBORDER,
          rows: [new D.TableRow({
            children: [
              cell(para(run('')), { w: 4513 }),
              cell([
                para(run('Pejabat Pembuat Komitmen', { size: 21 }), { align: D.AlignmentType.CENTER }),
                para(run('RSUD dr. Soeratno Gemolong', { size: 21 }), { align: D.AlignmentType.CENTER }),
                para(run('Kabupaten Sragen', { size: 21 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 1300 }),
                para(run(d.ppkom.nama || '………………………………', { underline: true, size: 21 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.ppkom.nip), { size: 21 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
            ],
          })],
        }),
      ],
    }],
  });
  return D.Packer.toBuffer(docx);
}

module.exports = {
  penyerahanPpPdf, penyerahanPpDocx,
  undanganPlPdf, undanganPlDocx,
  baPembukaanPdf, baPembukaanDocx,
  baEvaluasiPdf, baEvaluasiDocx,
  undanganKlarifikasiPdf, undanganKlarifikasiDocx,
  baPenetapanPdf, baPenetapanDocx,
  bahplPdf, bahplDocx,
  pengumumanPlPdf, pengumumanPlDocx,
  laporanPlPdf, laporanPlDocx,
  sppbjPdf, sppbjDocx,
  spkPdf, spkDocx,
};
