// Generator Dokumen Pengadaan Langsung (PL) 50–750 Juta — PDF & DOCX
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const D = require('docx');
const { terbilang, rupiah, tglIndo, tglKalimatBast } = require('./util');

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
  const tglUndangan = tglIndo(pl.undangan_tanggal || d.t.tanggal);
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
  doc.font('Helvetica-Bold').text('Kepada Yth.', xLeft, y);
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
  drawRow('Nilai HPS', `${rupiah(d.hpsTotal)} (${d.terbilangHps})`);
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

  // Tabel Jadwal
  const XJ = [xLeft, xLeft + 25, xLeft + 215, xLeft + 355, xLeft + wFull];
  const hHdr = 18;
  doc.save().lineWidth(0.7).strokeColor('#000').rect(XJ[0], y, wFull, hHdr).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('No', XJ[0], y + 4, { width: XJ[1] - XJ[0], align: 'center' });
  doc.text('Kegiatan', XJ[1] + 5, y + 4);
  doc.text('Tanggal', XJ[2] + 5, y + 4);
  doc.text('Waktu', XJ[3] + 5, y + 4);
  y += hHdr;

  const jadwRows = [
    ['a.', 'Pemasukan Dokumen Penawaran', jdw.pemasukan_tgl || '-', jdw.pemasukan_waktu || '08.00 wib s.d. 14.00 wib'],
    ['b.', 'Pembukaan Dokumen Penawaran', jdw.pembukaan_tgl || '-', jdw.pembukaan_waktu || '08.00 wib s.d. 14.00 wib'],
    ['c.', 'Klarifikasi Teknis dan Negosiasi Harga', jdw.klarifikasi_tgl || '-', jdw.klarifikasi_waktu || '08.00 wib s.d. 09.00 wib'],
    ['d.', 'Penetapan Pemenang', jdw.penetapan_tgl || '-', '-'],
    ['e.', 'Penandatanganan SPK', jdw.spk_tgl || '-', '-'],
  ];

  doc.font('Helvetica').fontSize(8.5);
  for (const r of jadwRows) {
    const rowH = 17;
    doc.save().lineWidth(0.5).strokeColor('#000').rect(XJ[0], y, wFull, rowH).stroke().restore();
    doc.text(r[0], XJ[0], y + 4, { width: XJ[1] - XJ[0], align: 'center' });
    doc.text(r[1], XJ[1] + 5, y + 4);
    doc.text(r[2], XJ[2] + 5, y + 4);
    doc.text(r[3], XJ[3] + 5, y + 4);
    y += rowH;
  }

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
  y += 65;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function undanganPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const jdw = pl.jadwal || {};
  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tglIndo(pl.undangan_tanggal || d.t.tanggal);
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
        ['a.', 'Pemasukan Dokumen Penawaran', jdw.pemasukan_tgl || '-', jdw.pemasukan_waktu || '08.00 wib s.d. 14.00 wib'],
        ['b.', 'Pembukaan Dokumen Penawaran', jdw.pembukaan_tgl || '-', jdw.pembukaan_waktu || '08.00 wib s.d. 14.00 wib'],
        ['c.', 'Klarifikasi Teknis dan Negosiasi Harga', jdw.klarifikasi_tgl || '-', jdw.klarifikasi_waktu || '08.00 wib s.d. 09.00 wib'],
        ['d.', 'Penetapan Pemenang', jdw.penetapan_tgl || '-', '-'],
        ['e.', 'Penandatanganan SPK', jdw.spk_tgl || '-', '-'],
      ].map((r) => new D.TableRow({
        children: [
          cell(para(run(r[0], { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run(r[1], { size: 18 })), { w: 3600, ...bdrAll }),
          cell(para(run(r[2], { size: 18 })), { w: 2400, ...bdrAll }),
          cell(para(run(r[3], { size: 18 })), { w: 2426, ...bdrAll }),
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
        para(run('Kepada Yth.', { bold: true, size: 20 })),
        para(run(d.t.penyedia || '-', { bold: true, size: 20 })),
        para(run('di', { size: 20 })),
        para(run(d.t.penyedia_alamat || 'Sragen', { size: 20 }), { after: 140 }),
        para(run(`Dengan ini Saudara kami undang untuk mengikuti proses pengadaan langsung ${paketTxt} dengan ketentuan sebagai berikut :`, { size: 20 }), { after: 100 }),
        para(run('1.\tPaket Pekerjaan', { bold: true, size: 20 })),
        para(run(`\tNama paket pekerjaan\t: ${d.rek?.uraian || paketTxt}`, { size: 20 })),
        para(run(`\tLingkup pekerjaan\t\t: ${lingkup}`, { size: 20 })),
        para(run(`\tNilai HPS\t\t\t: ${rupiah(d.hpsTotal)} (${d.terbilangHps})`, { size: 20 })),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  y += 70;

  doc.font('Helvetica-Bold');
  doc.text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xLeft, y, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_pimpinan || '………………………', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(nipTxt(d.pengadaan.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
              ], { w: 4513 }),
              cell([
                para(run('Penyedia Barang / Jasa', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(d.t.penyedia || '-', { size: 20 }), { align: D.AlignmentType.CENTER }),
                para(run(''), { before: 600 }),
                para(run(d.t.penyedia_pimpinan || '………………………', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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

  // Tabel Evaluasi (No, Nama Perusahaan, Administrasi, Evaluasi Teknis [a, b, c], Evaluasi Harga, Sah/Tidak, Ket)
  // Kolom: No(25), Nama(160), Adm(40), Teknis(75 -> 25, 25, 25), Harga(45), Sah(45), Ket(55) = 445 (wFull = 455)
  const CW = [25, 170, 42, 26, 26, 26, 46, 44, 50];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);

  // Header 2 baris
  doc.save().lineWidth(0.7).strokeColor('#000').rect(X[0], y, wFull, 32).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('No', X[0], y + 10, { width: CW[0], align: 'center' });
  doc.text('Nama Perusahaan', X[1], y + 10, { width: CW[1], align: 'center' });
  doc.text('Administrasi', X[2], y + 10, { width: CW[2], align: 'center' });
  doc.text('Evaluasi Teknis', X[3], y + 2, { width: CW[3] + CW[4] + CW[5], align: 'center' });
  doc.text('a', X[3], y + 17, { width: CW[3], align: 'center' });
  doc.text('b', X[4], y + 17, { width: CW[4], align: 'center' });
  doc.text('c', X[5], y + 17, { width: CW[5], align: 'center' });
  doc.text('Evaluasi\nHarga', X[6], y + 4, { width: CW[6], align: 'center' });
  doc.text('Sah/\nTidak', X[7], y + 4, { width: CW[7], align: 'center' });
  doc.text('Ket', X[8], y + 10, { width: CW[8], align: 'center' });
  y += 32;

  // Baris Data
  doc.save().lineWidth(0.5).strokeColor('#000').rect(X[0], y, wFull, 22).stroke().restore();
  doc.font('Helvetica').fontSize(9);
  doc.text('1.', X[0], y + 6, { width: CW[0], align: 'center' });
  doc.text(d.t.penyedia || '-', X[1] + 4, y + 6, { width: CW[1] - 8 });
  doc.text('√', X[2], y + 6, { width: CW[2], align: 'center' });
  doc.text('√', X[3], y + 6, { width: CW[3], align: 'center' });
  doc.text('√', X[4], y + 6, { width: CW[4], align: 'center' });
  doc.text('√', X[5], y + 6, { width: CW[5], align: 'center' });
  doc.text('√', X[6], y + 6, { width: CW[6], align: 'center' });
  doc.font('Helvetica-Bold');
  doc.text('SAH', X[7], y + 6, { width: CW[7], align: 'center' });
  doc.text('LULUS', X[8], y + 6, { width: CW[8], align: 'center' });
  y += 22;

  y += 14;
  doc.font('Helvetica-Bold').fontSize(9).text('Keterangan:', xLeft, y);
  y += 12;
  doc.font('Helvetica').fontSize(8.5);
  doc.text('a. Unsur - unsur yang di evaluasi meliputi:', xLeft, y); y += 12;
  doc.text('   1. Evaluasi Administrasi : Kelengkapan dokumen administrasi yang diminta.', xLeft, y); y += 11;
  doc.text('   2. Evaluasi Teknis :', xLeft, y); y += 11;
  doc.text('      a. Keabsahan surat penawaran.', xLeft, y); y += 11;
  doc.text('      b. Pemenuhan terhadap spesifikasi teknis yang diminta.', xLeft, y); y += 11;
  doc.text('      c. Pemenuhan syarat teknis lain yang diminta.', xLeft, y); y += 11;
  doc.text('   3. Evaluasi Harga : Total harga penawaran terhadap Harga Perkiraan Sendiri (HPS)', xLeft, y); y += 12;
  doc.text('b. Keterangan Tanda √ : Sesuai', xLeft, y); y += 24;

  const xTtd = W - 70 - 200;
  doc.font('Helvetica').fontSize(10);
  doc.text('Pejabat Pengadaan', xTtd, y, { width: 200, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xTtd, y + 13, { width: 200, align: 'center' });
  doc.text(`Tahun ${d.tahun}`, xTtd, y + 26, { width: 200, align: 'center' });
  y += 75;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
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

  const tbl = new D.Table({
    width: { size: W_CONTENT, type: D.WidthType.DXA },
    columnWidths: [600, 3426, 900, 500, 500, 500, 900, 800, 900],
    borders: bdrAll,
    rows: [
      new D.TableRow({
        children: [
          cell(para(run('No', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run('Nama Perusahaan', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 3426, ...bdrAll }),
          cell(para(run('Administrasi', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
          cell(para(run('Teknis a', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('Teknis b', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('Teknis c', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('Harga', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
          cell(para(run('Sah', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 800, ...bdrAll }),
          cell(para(run('Ket', { bold: true, size: 17 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
        ],
      }),
      new D.TableRow({
        children: [
          cell(para(run('1.', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 600, ...bdrAll }),
          cell(para(run(d.t.penyedia || '-', { size: 18 })), { w: 3426, ...bdrAll }),
          cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
          cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 500, ...bdrAll }),
          cell(para(run('√', { size: 18 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
          cell(para(run('SAH', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 800, ...bdrAll }),
          cell(para(run('LULUS', { bold: true, size: 18 }), { align: D.AlignmentType.CENTER }), { w: 900, ...bdrAll }),
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
        para(run('   2. Evaluasi Teknis : a. Keabsahan surat penawaran; b. Pemenuhan spektek; c. Syarat teknis lain.', { size: 18 })),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  const tglDoc = tglIndo(pl.undangan_klarifikasi_tanggal || d.t.tanggal);
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
  drawFld('Hari/ tanggal', `${kal.hari}, ${tglIndo(tglPertemuan)}`);
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
  y += 75;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function undanganKlarifikasiDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.undangan_klarifikasi_no_urut || '2578.a';
  const noDoc = pl.undangan_klarifikasi_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const tglDoc = tglIndo(pl.undangan_klarifikasi_tanggal || d.t.tanggal);
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
        para(run(`Hari/ tanggal\t: ${kal.hari}, ${tglIndo(tglPertemuan)}`, { size: 20 })),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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

  const drawItem = (no, lbl, val) => {
    doc.text(`${no}.`, xLeft + 10, y);
    doc.text(lbl, xLeft + 28, y);
    doc.text(': ' + val, xLeft + 160, y, { width: wFull - 160 });
    y = Math.max(doc.y + 2, y + 15);
  };
  drawItem(1, 'Nama Perusahaan', d.t.penyedia || '-');
  drawItem(2, 'Kuasa Direktur', d.t.penyedia_pimpinan || '-');
  drawItem(3, 'Alamat', d.t.penyedia_alamat || '-');
  drawItem(4, 'NPWP', d.t.penyedia_npwp || '-');
  drawItem(5, 'Harga Penawaran', `${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`);
  drawItem(6, 'Hasil klarifikasi dan\nNegosiasi teknis dan harga', d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga');
  drawItem(7, 'Harga Hasil Negosiasi', `${rupiah(d.t.kotor)} (${d.terbilang})`);

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
  y += 75;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
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
        para(run(`1.\tNama Perusahaan\t\t: ${d.t.penyedia || '-'}`, { size: 20 })),
        para(run(`2.\tKuasa Direktur\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
        para(run(`3.\tAlamat\t\t\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 })),
        para(run(`4.\tNPWP\t\t\t\t: ${d.t.penyedia_npwp || '-'}`, { size: 20 })),
        para(run(`5.\tHarga Penawaran\t\t: ${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`, { size: 20 })),
        para(run(`6.\tHasil klarifikasi/nego\t: ${d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga'}`, { size: 20 })),
        para(run(`7.\tHarga Hasil Negosiasi\t: ${rupiah(d.t.kotor)} (${d.terbilang})`, { size: 20 }), { after: 140 }),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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

  const drawItem = (no, lbl, val) => {
    doc.text(`${no}.`, xLeft + 10, y);
    doc.text(lbl, xLeft + 28, y);
    doc.text(': ' + val, xLeft + 160, y, { width: wFull - 160 });
    y = Math.max(doc.y + 2, y + 15);
  };
  drawItem(1, 'Nama Perusahaan', d.t.penyedia || '-');
  drawItem(2, 'Kuasa Direktur', d.t.penyedia_pimpinan || '-');
  drawItem(3, 'Alamat', d.t.penyedia_alamat || '-');
  drawItem(4, 'NPWP', d.t.penyedia_npwp || '-');
  drawItem(5, 'Hasil evaluasi penawaran', 'Lulus kualifikasi administrasi, teknis dan harga');
  drawItem(6, 'HPS', `${rupiah(d.hpsTotal)} (${d.terbilangHps})`);
  drawItem(7, 'Harga Penawaran', `${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`);
  drawItem(8, 'Hasil klarifikasi dan\nNegosiasi teknis dan harga', d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga');
  drawItem(9, 'Harga Hasil Negosiasi', `${rupiah(d.t.kotor)} (${d.terbilang})`);

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
  y += 75;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
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
        para(run(`1.\tNama Perusahaan\t\t: ${d.t.penyedia || '-'}`, { size: 20 })),
        para(run(`2.\tKuasa Direktur\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
        para(run(`3.\tAlamat\t\t\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 })),
        para(run(`4.\tNPWP\t\t\t\t: ${d.t.penyedia_npwp || '-'}`, { size: 20 })),
        para(run('\t5.\tHasil evaluasi penawaran\t: Lulus kualifikasi administrasi, teknis dan harga', { size: 20 })),
        para(run(`6.\tHPS\t\t\t\t: ${rupiah(d.hpsTotal)} (${d.terbilangHps})`, { size: 20 })),
        para(run(`7.\tHarga Penawaran\t\t: ${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`, { size: 20 })),
        para(run(`8.\tHasil klarifikasi/nego\t: ${d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga'}`, { size: 20 })),
        para(run(`9.\tHarga Hasil Negosiasi\t: ${rupiah(d.t.kotor)} (${d.terbilang})`, { size: 20 }), { after: 140 }),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  const tglDoc = tglIndo(pl.pengumuman_tanggal || pl.penetapan_tanggal || d.t.tanggal);
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

  const drawItem = (no, lbl, val) => {
    doc.text(`${no}.`, xLeft + 10, y);
    doc.text(lbl, xLeft + 28, y);
    doc.text(': ' + val, xLeft + 160, y, { width: wFull - 160 });
    y = Math.max(doc.y + 2, y + 15);
  };
  drawItem(1, 'Nama Perusahaan', d.t.penyedia || '-');
  drawItem(2, 'Kuasa Direktur', d.t.penyedia_pimpinan || '-');
  drawItem(3, 'Alamat', d.t.penyedia_alamat || '-');
  drawItem(4, 'NPWP', d.t.penyedia_npwp || '-');
  drawItem(5, 'Hasil evaluasi penawaran', 'Lulus kualifikasi administrasi, teknis dan harga');
  drawItem(6, 'HPS', `${rupiah(d.hpsTotal)} (${d.terbilangHps})`);
  drawItem(7, 'Harga Penawaran', `${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`);
  drawItem(8, 'Hasil klarifikasi dan\nNegosiasi teknis dan harga', d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga');
  drawItem(9, 'Harga Hasil Negosiasi', `${rupiah(d.t.kotor)} (${d.terbilang})`);

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
  y += 85;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function pengumumanPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const defNomor = pl.pengumuman_no_urut ? `${pl.pengumuman_no_urut}.b` : (pl.penetapan_no_urut ? `${pl.penetapan_no_urut}.b` : '2656.b');
  const noDoc = pl.pengumuman_nomor || `000.3.2/${defNomor}/05.1.2/${d.tahun}`;
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglDoc = tglIndo(pl.pengumuman_tanggal || pl.penetapan_tanggal || d.t.tanggal);
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
        para(run(`1.\tNama Perusahaan\t\t: ${d.t.penyedia || '-'}`, { size: 20 })),
        para(run(`2.\tKuasa Direktur\t\t: ${d.t.penyedia_pimpinan || '-'}`, { size: 20 })),
        para(run(`3.\tAlamat\t\t\t\t: ${d.t.penyedia_alamat || '-'}`, { size: 20 })),
        para(run(`4.\tNPWP\t\t\t\t: ${d.t.penyedia_npwp || '-'}`, { size: 20 })),
        para(run('\t5.\tHasil evaluasi penawaran\t: Lulus kualifikasi administrasi, teknis dan harga', { size: 20 })),
        para(run(`6.\tHPS\t\t\t\t: ${rupiah(d.hpsTotal)} (${d.terbilangHps})`, { size: 20 })),
        para(run(`7.\tHarga Penawaran\t\t: ${rupiah(d.penawaranTotal)} (${d.terbilangPenawaran})`, { size: 20 })),
        para(run(`8.\tHasil klarifikasi/nego\t: ${d.t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan Harga'}`, { size: 20 })),
        para(run(`9.\tHarga Hasil Negosiasi\t: ${rupiah(d.t.kotor)} (${d.terbilang})`, { size: 20 }), { after: 140 }),
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  const tglDoc = tglIndo(pl.laporan_tanggal || pl.penetapan_tanggal || d.t.tanggal);
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
  y += 75;
  doc.font('Helvetica-Bold').text(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', xTtd, y, { width: 200, align: 'center' });
  doc.font('Helvetica').fontSize(9).text(nipTxt(d.pengadaan.nip), xTtd, y + 13, { width: 200, align: 'center' });

  return doc;
}

async function laporanPlDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noDoc = pl.laporan_nomor || `000.3.2/${pl.laporan_no_urut || '2657'}/05.1.2/${d.tahun}`;
  const tglDoc = tglIndo(pl.laporan_tanggal || pl.penetapan_tanggal || d.t.tanggal);
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
                para(run(''), { before: 600 }),
                para(run(d.pengadaan.nama || 'Tulus Wahyuno, A.Md', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  const tglDoc = tglIndo(pl.sppbj_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const noPenawaran = pl.penawaran_nomor || `05/PNWR/${d.t.penyedia?.split(' ')[0] || 'VND'}/${d.tahun}`;
  const tglPenawaran = tglIndo(pl.penawaran_tanggal || pl.jadwal?.pemasukan_tgl || d.t.tanggal);

  y += 10;
  doc.font('Helvetica').fontSize(10);
  doc.text(`Sragen, ${tglDoc}`, W - 70 - 200, y, { width: 200, align: 'right' });
  y += 14;
  doc.text(`Nomor     : ${noDoc}`, xLeft, y); y += 13;
  doc.text('Lampiran : -', xLeft, y); y += 13;
  doc.text(`Perihal    : Penunjukan Penyedia untuk Pelaksanaan Paket Pengadaan\n             ${paketTxt}`, xLeft, y, { width: wFull });
  y = doc.y + 16;

  doc.font('Helvetica-Bold').text('Kepada Yth.', xLeft, y); y += 13;
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
  y += 70;
  doc.font('Helvetica-Bold').text(d.ppkom.nama || 'dr. Sumarji, Sp. N.', xTtd, y, { width: 220, align: 'center' });
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
  const tglDoc = tglIndo(pl.sppbj_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);
  const noPenawaran = pl.penawaran_nomor || `05/PNWR/${d.t.penyedia?.split(' ')[0] || 'VND'}/${d.tahun}`;
  const tglPenawaran = tglIndo(pl.penawaran_tanggal || pl.jadwal?.pemasukan_tgl || d.t.tanggal);

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
                para(run(''), { before: 600 }),
                para(run(d.ppkom.nama || 'dr. Sumarji, Sp. N.', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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
  const tglSpk = tglIndo(d.t.spk_tanggal || pl.spk_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tglIndo(pl.undangan_tanggal || d.t.tanggal);
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglBahpl = tglIndo(pl.bahpl_tanggal || pl.penetapan_tanggal || d.t.tanggal);

  const jenisKontrak = pl.spk_jenis_kontrak || 'Kontrak Harga Satuan';
  const waktuHari = pl.spk_waktu_hari ? `${pl.spk_waktu_hari} hari kalender` : '30 (tiga puluh) hari kalender';

  y += 6;
  doc.font('Helvetica-Bold').fontSize(12).text('SURAT PERINTAH KERJA (SPK)', 0, y, { width: W, align: 'center' });
  y += 18;

  // Grid / Data Blok SPK
  const drawBlock = (lbl, val, boldVal = false) => {
    doc.font('Helvetica-Bold').fontSize(9).text(lbl, xLeft, y, { width: 155 });
    doc.font(boldVal ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).text(': ' + val, xLeft + 160, y, { width: wFull - 160, lineGap: 1.5 });
    y = Math.max(doc.y + 3, y + 14);
  };

  drawBlock('SATUAN KERJA', 'RSUD dr. SOERATNO GEMOLONG');
  drawBlock('NOMOR DAN TANGGAL SPK', `Nomor : ${noSpk}\nTanggal : ${tglSpk}`);
  drawBlock('Pejabat Pembuat Komitmen (PPK)', d.ppkom.nama || '-');
  drawBlock('Penyedia', d.t.penyedia || '-');
  drawBlock('PAKET PEKERJAAN', paketTxt);
  drawBlock('SURAT UNDANGAN PL', `Nomor : ${noUndangan}\nTanggal : ${tglUndangan}`);
  drawBlock('BERITA ACARA HASIL PL', `Nomor : ${noBahpl}\nTanggal : ${tglBahpl}`);
  drawBlock('SUMBER DANA', `DIPA/DPA BLUD RSUD dr. Soeratno Gemolong Tahun Anggaran ${d.tahun} untuk mata anggaran ${d.rek?.uraian || paketTxt} RSUD dr. Soeratno Gemolong.`);
  drawBlock('NILAI KONTRAK', `Nilai Kontrak termasuk Pajak Pertambahan Nilai (PPN) adalah sebesar ${rupiah(d.t.kotor)} (${d.terbilang}).`, true);
  drawBlock('JENIS KONTRAK', jenisKontrak);
  drawBlock('WAKTU PELAKSANAAN', waktuHari);
  drawBlock('INSTRUKSI KEPADA PENYEDIA', 'Penagihan hanya dapat dilakukan setelah penyelesaian pekerjaan yang diperintahkan dalam SPK ini dan dibuktikan dengan Berita Acara Serah Terima. Jika pekerjaan tidak dapat diselesaikan dalam jangka waktu pelaksanaan pekerjaan karena kesalahan atau kelalaian Penyedia maka Penyedia berkewajiban untuk membayar denda kepada PPK sebesar 1/1000 (satu per seribu) dari bagian tertentu nilai SPK sebelum PPN setiap hari kalender keterlambatan.');

  y = Math.max(y + 8, doc.y + 8);

  // TTD 2 pihak
  const wCol = (wFull - 30) / 2;
  doc.font('Helvetica').fontSize(9.5);
  doc.text('Untuk dan atas nama', xLeft, y, { width: wCol, align: 'center' });
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y + 12, { width: wCol, align: 'center' });
  doc.text('Pejabat Pembuat Komitmen', xLeft, y + 24, { width: wCol, align: 'center' });

  doc.text('Untuk dan atas nama Penyedia', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia || '-', xLeft + wCol + 30, y + 12, { width: wCol, align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8).text('[ Materai 10.000 ]', xLeft + wCol + 30, y + 42, { width: wCol, align: 'center' });

  y += 75;
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text(d.ppkom.nama || '-', xLeft, y, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_pimpinan || '………………………', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
  doc.font('Helvetica').fontSize(8.5);
  doc.text(nipTxt(d.ppkom.nip), xLeft, y + 12, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_jabatan || 'Direktur', xLeft + wCol + 30, y + 12, { width: wCol, align: 'center' });

  // ── HALAMAN 2: LAMPIRAN SURAT PERINTAH KERJA (RINCIAN BARANG) ─────────────
  doc.addPage({ size: [595.28, 935.43], margin: 0 });
  y = drawKop(doc, d.s, 32);

  const defLampUrut = d.t.spk_no_urut || pl.spk_no_urut ? `${d.t.spk_no_urut || pl.spk_no_urut}.a` : '2673.a';
  const noLamp = `000.3.2/${defLampUrut}/05.1.2/${d.tahun}`;

  y += 8;
  doc.font('Helvetica-Bold').fontSize(11).text('Lampiran Surat Perintah Kerja', 0, y, { width: W, align: 'center' });
  y += 15;
  doc.font('Helvetica').fontSize(9.5);
  doc.text(`Nomor : ${noLamp}`, 0, y, { width: W, align: 'center' });
  y += 13;
  doc.text(`Tanggal : ${tglSpk}`, 0, y, { width: W, align: 'center' });
  y += 18;

  // Tabel Barang: No(25), Uraian(210), Satuan(50), Volume(45), Harga Satuan(65), Jumlah(60) = 455
  const CW = [25, 210, 50, 45, 65, 60];
  const X = [xLeft];
  for (let i = 0; i < CW.length; i++) X.push(X[i] + CW[i]);

  const hHdr = 18;
  doc.save().lineWidth(0.7).strokeColor('#000').rect(X[0], y, wFull, hHdr).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('No', X[0], y + 4, { width: CW[0], align: 'center' });
  doc.text('Uraian', X[1] + 5, y + 4);
  doc.text('Satuan', X[2], y + 4, { width: CW[2], align: 'center' });
  doc.text('Vol', X[3], y + 4, { width: CW[3], align: 'center' });
  doc.text('Harga Satuan', X[4], y + 4, { width: CW[4], align: 'center' });
  doc.text('Jumlah (Rp)', X[5], y + 4, { width: CW[5], align: 'center' });
  y += hHdr;

  doc.font('Helvetica').fontSize(8.5);
  let totalKotor = 0;
  for (let idx = 0; idx < d.items.length; idx++) {
    const it = d.items[idx];
    const qty = Number(it.kuantitas) || 1;
    const hs = Math.round(Number(it.harga_satuan) || 0);
    const sub = qty * hs;
    totalKotor += sub;

    const rowH = Math.max(20, (it.jenis_barang.length > 50 ? 32 : 20));
    doc.save().lineWidth(0.5).strokeColor('#000').rect(X[0], y, wFull, rowH).stroke().restore();
    doc.text(`${idx + 1}.`, X[0], y + 5, { width: CW[0], align: 'center' });
    doc.text(it.jenis_barang || '-', X[1] + 5, y + 5, { width: CW[1] - 10, lineGap: 1 });
    doc.text(it.satuan || 'Unit', X[2], y + 5, { width: CW[2], align: 'center' });
    doc.text(String(qty), X[3], y + 5, { width: CW[3], align: 'center' });
    doc.text(fmtNum(hs), X[4], y + 5, { width: CW[4] - 5, align: 'right' });
    doc.text(fmtNum(sub), X[5], y + 5, { width: CW[5] - 5, align: 'right' });
    y += rowH;
  }

  // Baris Total
  const grandTotal = totalKotor || d.t.kotor || 0;
  doc.save().lineWidth(0.7).strokeColor('#000').rect(X[0], y, wFull, 20).stroke().restore();
  doc.font('Helvetica-Bold').fontSize(8.5);
  doc.text('Total (termasuk PPN 11%)', X[0] + 10, y + 5);
  doc.text(fmtNum(grandTotal), X[5], y + 5, { width: CW[5] - 5, align: 'right' });
  y += 20;

  y += 8;
  doc.font('Helvetica').fontSize(9).text(`Terbilang : ${terbilang(grandTotal)}`, xLeft, y, { width: wFull });
  y += 28;

  // TTD Halaman 2
  doc.font('Helvetica').fontSize(9.5);
  doc.text('RSUD dr. Soeratno Gemolong', xLeft, y, { width: wCol, align: 'center' });
  doc.text('Pejabat Pembuat Komitmen', xLeft, y + 12, { width: wCol, align: 'center' });

  doc.text(d.t.penyedia || '-', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
  doc.font('Helvetica-Oblique').fontSize(8).text('[ Materai 10.000 ]', xLeft + wCol + 30, y + 36, { width: wCol, align: 'center' });

  y += 70;
  doc.font('Helvetica-Bold').fontSize(9.5);
  doc.text(d.ppkom.nama || '-', xLeft, y, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_pimpinan || '………………………', xLeft + wCol + 30, y, { width: wCol, align: 'center' });
  doc.font('Helvetica').fontSize(8.5);
  doc.text(nipTxt(d.ppkom.nip), xLeft, y + 12, { width: wCol, align: 'center' });
  doc.text(d.t.penyedia_jabatan || 'Direktur', xLeft + wCol + 30, y + 12, { width: wCol, align: 'center' });

  return doc;
}

async function spkDocx(d) {
  const W_PAGE = 11906, M_HORIZ = 1440, W_CONTENT = W_PAGE - 2 * M_HORIZ;
  const pl = d.pl || {};
  const noSpk = d.t.spk_nomor || pl.spk_nomor || `000.3.2/${d.t.spk_no_urut || pl.spk_no_urut || '2673'}/05.1.2/${d.tahun}`;
  const tglSpk = tglIndo(d.t.spk_tanggal || pl.spk_tanggal || d.t.tanggal);
  const paketTxt = getPaketTxt(d);

  const noUndangan = pl.undangan_nomor || `000.3.2/${pl.undangan_no_urut || '2436'}/05.1.2/${d.tahun}`;
  const tglUndangan = tglIndo(pl.undangan_tanggal || d.t.tanggal);
  const noBahpl = pl.bahpl_nomor || `000.3.2/${pl.bahpl_no_urut || '2656.a'}/05.1.2/${d.tahun}`;
  const tglBahpl = tglIndo(pl.bahpl_tanggal || pl.penetapan_tanggal || d.t.tanggal);

  const jenisKontrak = pl.spk_jenis_kontrak || 'Kontrak Harga Satuan';
  const waktuHari = pl.spk_waktu_hari ? `${pl.spk_waktu_hari} hari kalender` : '30 (tiga puluh) hari kalender';

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

  const docx = new D.Document({
    creator: 'AdminProc', title: 'Surat Perintah Kerja (SPK)',
    sections: [
      // Section 1: SPK
      {
        properties: { page: { size: { width: W_PAGE, height: 18709 }, margin: { top: 800, bottom: 800, left: M_HORIZ, right: M_HORIZ } } },
        children: [
          makeKopDocx(d.s, W_CONTENT),
          para(run('SURAT PERINTAH KERJA (SPK)', { bold: true, size: 22 }), { align: D.AlignmentType.CENTER, before: 140 }),
          para(run('SATUAN KERJA\t\t\t: RSUD dr. SOERATNO GEMOLONG', { bold: true, size: 20 }), { before: 100 }),
          para(run(`NOMOR DAN TANGGAL SPK\t: Nomor : ${noSpk}\n\t\t\t\t\t  Tanggal : ${tglSpk}`, { size: 20 })),
          para(run(`Pejabat Pembuat Komitmen\t: ${d.ppkom.nama || '-'}`, { size: 20 })),
          para(run(`Penyedia\t\t\t\t: ${d.t.penyedia || '-'}`, { size: 20 })),
          para(run(`PAKET PEKERJAAN\t\t: ${paketTxt}`, { bold: true, size: 20 })),
          para(run(`SURAT UNDANGAN PL\t\t: Nomor : ${noUndangan}\n\t\t\t\t\t  Tanggal : ${tglUndangan}`, { size: 20 })),
          para(run(`BERITA ACARA HASIL PL\t: Nomor : ${noBahpl}\n\t\t\t\t\t  Tanggal : ${tglBahpl}`, { size: 20 })),
          para(run(`SUMBER DANA\t\t\t: DIPA/DPA BLUD RSUD dr. Soeratno Gemolong Tahun Anggaran ${d.tahun}`, { size: 20 })),
          para(run(`NILAI KONTRAK\t\t\t: ${rupiah(d.t.kotor)} (${d.terbilang})`, { bold: true, size: 20 })),
          para(run(`JENIS KONTRAK\t\t\t: ${jenisKontrak}`, { size: 20 })),
          para(run(`WAKTU PELAKSANAAN\t\t: ${waktuHari}`, { size: 20 })),
          para(run('INSTRUKSI KEPADA PENYEDIA\t: Penagihan hanya dapat dilakukan setelah penyelesaian pekerjaan yang dibuktikan dengan BAST. Denda keterlambatan 1/1000 per hari.', { size: 18 }), { after: 140 }),
          new D.Table({
            width: { size: W_CONTENT, type: D.WidthType.DXA },
            columnWidths: [4513, 4513],
            borders: NOBORDER,
            rows: [new D.TableRow({
              children: [
                cell([
                  para(run('RSUD dr. Soeratno Gemolong', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('Pejabat Pembuat Komitmen', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(''), { before: 600 }),
                  para(run(d.ppkom.nama || '-', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(nipTxt(d.ppkom.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
                cell([
                  para(run('Untuk dan atas nama Penyedia', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(d.t.penyedia || '-', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('[ Materai 10.000 ]', { size: 16, italics: true }), { align: D.AlignmentType.CENTER, before: 200 }),
                  para(run(''), { before: 300 }),
                  para(run(d.t.penyedia_pimpinan || '………………………', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(d.t.penyedia_jabatan || 'Direktur', { size: 18 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
              ],
            })],
          }),
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
                  para(run(''), { before: 600 }),
                  para(run(d.ppkom.nama || '-', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run(nipTxt(d.ppkom.nip), { size: 18 }), { align: D.AlignmentType.CENTER }),
                ], { w: 4513 }),
                cell([
                  para(run(d.t.penyedia || '-', { size: 20 }), { align: D.AlignmentType.CENTER }),
                  para(run('[ Materai 10.000 ]', { size: 16, italics: true }), { align: D.AlignmentType.CENTER, before: 200 }),
                  para(run(''), { before: 300 }),
                  para(run(d.t.penyedia_pimpinan || '………………………', { bold: true, size: 20 }), { align: D.AlignmentType.CENTER }),
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

module.exports = {
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
