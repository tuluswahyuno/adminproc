// Impor file Excel "Realisasi Belanja" -> master rekening (dengan induk_kode, induk_uraian, no_urut), pagu, realisasi awal, pejabat default.
const ExcelJS = require('exceljs');
const { db, INDUK_MAP } = require('./db');

const val = (c) => {
  let v = c && c.value;
  if (v && typeof v === 'object') {
    if ('result' in v) v = v.result;
    else if (v.richText) v = v.richText.map((t) => t.text).join('');
    else if (v.text) v = v.text;
  }
  return v == null ? '' : v;
};
const str = (c) => String(val(c)).trim();
const num = (c) => (typeof val(c) === 'number' ? val(c) : Number(String(val(c)).replace(/[^\d.-]/g, '')) || 0);

const BULAN = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const bulanIdx = (name) => BULAN.findIndex((b) => name.toUpperCase().startsWith(b));

async function listSheets(buffer) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb.worksheets.map((w) => w.name);
}

async function importRealisasi(buffer, sheetName) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  let ws = sheetName && wb.getWorksheet(sheetName);
  if (!ws) {
    const bulan = wb.worksheets.filter((w) => bulanIdx(w.name) >= 0)
      .sort((a, b) => bulanIdx(b.name) - bulanIdx(a.name));
    ws = bulan[0] || wb.worksheets[0];
  }
  if (!ws) throw new Error('Sheet tidak ditemukan');

  let hdr = 0;
  const col = {};
  ws.eachRow((row, n) => {
    if (hdr) return;
    row.eachCell((cell, c) => { if (/^kode rekening$/i.test(str(cell))) hdr = n; });
  });
  if (!hdr) throw new Error('Header "Kode Rekening" tidak ditemukan');
  ws.getRow(hdr).eachCell((cell, c) => {
    const t = str(cell).toLowerCase();
    if (t === 'kode rekening') col.kode = c;
    else if (t === 'uraian' || t.startsWith('uraian rincian')) col.uraian = c;
    else if (t === 'anggaran' || t.startsWith('anggaran (pagu)') || t === 'pagu') col.pagu = c;
    else if (t.startsWith('jumlah realisasi') || t.startsWith('realisasi')) col.real = c;
    else if (t === 'ppkom' || t === 'ppk' || t.startsWith('ppkom / ppk')) col.ppkom = c;
    else if (t === 'pptk') col.pptk = c;
    else if (t.startsWith('pejabat pengadaan')) col.pengadaan = c;
  });
  if (!col.uraian || !col.pagu) throw new Error('Kolom Uraian/Anggaran tidak ditemukan');

  const normKey = (s = '') =>
    String(s || '')
      .toLowerCase()
      .replace(/^(dr\.|drg\.|ir\.|h\.|hj\.)\s*/gi, '')
      .split(',')[0]
      .replace(/\b(amd|a\.md|skm|s\.k\.m|s\.kep|ns|m\.kep|m\.si|se|s\.e|m\.eng|s\.kom|apt|s\.farm|s\.st|amte|sp\.n|m\.pd|ked)\b/gi, '')
      .replace(/[^a-z0-9]/g, '');

  const pej = async (nama, peran) => {
    nama = (nama || '').trim();
    if (!nama || nama === '-' || nama === '—') return null;
    const r = await db.prepare('SELECT id FROM pejabat WHERE LOWER(nama)=LOWER(?) AND peran=?').get(nama, peran);
    if (r) return r.id;
    const targetKey = normKey(nama);
    if (targetKey) {
      const allRole = await db.prepare('SELECT id, nama FROM pejabat WHERE peran=? ORDER BY id ASC').all(peran);
      const found = allRole.find((p) => normKey(p.nama) === targetKey || (targetKey.length >= 10 && normKey(p.nama).startsWith(targetKey.slice(0, 10))));
      if (found) return found.id;
    }
    const res = await db.prepare('INSERT INTO pejabat(nama,peran) VALUES(?,?)').run(nama, peran);
    return Number(res.lastInsertRowid);
  };

  const upsertSql = `INSERT INTO rekening(kode,induk_kode,induk_uraian,no_urut,uraian,pagu,realisasi_awal,ppkom_id,pptk_id,pengadaan_id)
    VALUES(?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE
    induk_kode=VALUES(induk_kode),induk_uraian=VALUES(induk_uraian),no_urut=VALUES(no_urut),
    uraian=VALUES(uraian),pagu=VALUES(pagu),realisasi_awal=VALUES(realisasi_awal),
    ppkom_id=COALESCE(VALUES(ppkom_id),ppkom_id),pptk_id=COALESCE(VALUES(pptk_id),pptk_id),pengadaan_id=COALESCE(VALUES(pengadaan_id),pengadaan_id)`;

  let prefix = null, indukUraian = '', jumlah = 0;
  const conn = await db.pool.getConnection();
  await conn.beginTransaction();
  try {
    const rows = [];
    ws.eachRow((row, n) => { if (n > hdr) rows.push(row); });
    for (const row of rows) {
      // Mode 1: Format 7 kolom terpisah (A..F = segmen induk, G = no urut anak)
      const parts = [1, 2, 3, 4, 5, 6].map((i) => str(row.getCell(i)));
      if (parts.every(Boolean) && !parts[0].includes('.')) {
        prefix = parts.map((p, idx) => (idx >= 2 && idx <= 4 ? p.padStart(2, '0') : p)).join('.');
        indukUraian = str(row.getCell(col.uraian)) || INDUK_MAP[prefix] || 'Belanja BLUD';
        continue;
      }
      const g = str(row.getCell(7));
      if (prefix && /^\d+$/.test(g) && str(row.getCell(col.uraian))) {
        const noUrut = parseInt(g, 10) || 0;
        const kode = `${prefix}.${g.padStart(2, '0')}`;
        const ppkomId = col.ppkom ? await pej(str(row.getCell(col.ppkom)), 'PPKOM') : null;
        const pptkId = col.pptk ? await pej(str(row.getCell(col.pptk)), 'PPTK') : null;
        const pengadaanId = col.pengadaan ? await pej(str(row.getCell(col.pengadaan)), 'PENGADAAN') : null;
        await conn.query(upsertSql, [
          kode, prefix, indukUraian, noUrut,
          str(row.getCell(col.uraian)), Math.round(num(row.getCell(col.pagu))),
          col.real ? Math.round(num(row.getCell(col.real))) : 0,
          ppkomId, pptkId, pengadaanId
        ]);
        jumlah++;
        continue;
      }

      // Mode 2: Format kode titik langsung (mis. 5.1.02.99.99.9999.01) di kolom Kode Rekening
      const rawKode = str(row.getCell(col.kode || 1));
      if (/^\d+\.\d+\.\d+/.test(rawKode)) {
        const segs = rawKode.split('.');
        if (segs.length === 6) {
          prefix = rawKode;
          indukUraian = str(row.getCell(col.uraian)) || INDUK_MAP[prefix] || 'Belanja BLUD';
          continue;
        }
        if (segs.length >= 7 && str(row.getCell(col.uraian))) {
          const ik = segs.slice(0, 6).join('.');
          const iu = INDUK_MAP[ik] || indukUraian || 'Belanja BLUD';
          const noUrut = parseInt(segs[6], 10) || 0;
          const ppkomId = col.ppkom ? await pej(str(row.getCell(col.ppkom)), 'PPKOM') : null;
          const pptkId = col.pptk ? await pej(str(row.getCell(col.pptk)), 'PPTK') : null;
          const pengadaanId = col.pengadaan ? await pej(str(row.getCell(col.pengadaan)), 'PENGADAAN') : null;
          await conn.query(upsertSql, [
            rawKode, ik, iu, noUrut,
            str(row.getCell(col.uraian)), Math.round(num(row.getCell(col.pagu))),
            col.real ? Math.round(num(row.getCell(col.real))) : 0,
            ppkomId, pptkId, pengadaanId
          ]);
          jumlah++;
        }
      }
    }
    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
  return { sheet: ws.name, rekening: jumlah };
}

/**
 * Buat file Excel Template Kode Rekening & Pejabat (dengan Dropdown Data Validation
 * untuk PPKOM, PPTK, dan Pejabat Pengadaan) sehingga tim PEP tinggal mengganti
 * nominal Anggaran (Pagu) & memilih nama Pejabat dari dropdown untuk tahun berikutnya.
 */
async function generateTemplateExcel(tahun = '2026') {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'AdminProc RSUD dr. Soeratno Gemolong';

  const rekRows = await db.prepare('SELECT * FROM rekening ORDER BY induk_kode, no_urut, kode').all();
  const pejRows = await db.prepare('SELECT * FROM pejabat WHERE aktif=1 ORDER BY peran, nama').all();
  const pejMap = new Map(pejRows.map((p) => [p.id, p.nama]));

  const ppkomList = pejRows.filter((p) => p.peran === 'PPKOM').map((p) => p.nama);
  const pptkList = pejRows.filter((p) => p.peran === 'PPTK').map((p) => p.nama);
  const pengadaanList = pejRows.filter((p) => p.peran === 'PENGADAAN').map((p) => p.nama);

  const ws = wb.addWorksheet(`TEMPLATE_${tahun}`, {
    views: [{ state: 'frozen', ySplit: 5 }],
  });
  const wsRef = wb.addWorksheet('MASTER_PEJABAT');

  // Isi sheet MASTER_PEJABAT untuk sumber Dropdown Data Validation
  wsRef.columns = [
    { header: 'PPKOM', key: 'ppkom', width: 36 },
    { header: 'PPTK', key: 'pptk', width: 36 },
    { header: 'PEJABAT_PENGADAAN', key: 'pengadaan', width: 36 },
  ];
  wsRef.getRow(1).font = { bold: true };
  const maxPej = Math.max(ppkomList.length, pptkList.length, pengadaanList.length, 1);
  for (let i = 0; i < maxPej; i++) {
    wsRef.getRow(i + 2).values = [ppkomList[i] || '', pptkList[i] || '', pengadaanList[i] || ''];
  }

  // Judul & Petunjuk di Sheet Utama
  ws.mergeCells('A1:M1');
  ws.getCell('A1').value = `TEMPLATE IMPOR KODE REKENING & PEJABAT PENGADAAN BLUD — TAHUN ANGGARAN ${tahun}`;
  ws.getCell('A1').font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
  ws.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF122922' } };
  ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
  ws.getRow(1).height = 26;

  ws.mergeCells('A2:M2');
  ws.getCell('A2').value = 'Petunjuk Tim PEP: Ubah nilai pada kolom "Anggaran" (I) dan pilih nama "PPKOM" (K), "PPTK" (L), serta "Pejabat Pengadaan" (M) melalui dropdown. Untuk tahun 2027, cukup sesuaikan nominal & pejabat lalu unggah kembali ke menu Kode Rekening → Impor Excel.';
  ws.getCell('A2').font = { name: 'Arial', size: 9.5, italic: true, color: { argb: 'FF122922' } };
  ws.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EE30' } };
  ws.getCell('A2').alignment = { vertical: 'middle', wrapText: true };
  ws.getRow(2).height = 24;

  // Baris 4: Header Tabel (Persis format yang dikenali importRealisasi)
  ws.mergeCells('A4:G4');
  ws.getCell('A4').value = 'Kode Rekening';
  ws.getCell('H4').value = 'Uraian';
  ws.getCell('I4').value = 'Anggaran';
  ws.getCell('J4').value = 'Jumlah Realisasi';
  ws.getCell('K4').value = 'PPKOM';
  ws.getCell('L4').value = 'PPTK';
  ws.getCell('M4').value = 'Pejabat Pengadaan';

  const hdrRow = ws.getRow(4);
  hdrRow.height = 24;
  for (let c = 1; c <= 13; c++) {
    const cell = hdrRow.getCell(c);
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D5A42' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  }

  // Sub-header nomor kolom (Baris 5)
  ws.mergeCells('A5:G5');
  ws.getCell('A5').value = '1 (Segmen Induk A–F & No. Urut Anak G)';
  ws.getCell('H5').value = '2 (Nama Kode Rekening / Belanja)';
  ws.getCell('I5').value = '3 (Pagu Rp)';
  ws.getCell('J5').value = '4 (Realisasi Awal Rp)';
  ws.getCell('K5').value = '5 (Dropdown PPK)';
  ws.getCell('L5').value = '6 (Dropdown PPTK)';
  ws.getCell('M5').value = '7 (Dropdown Pejabat Pengadaan)';
  const subRow = ws.getRow(5);
  subRow.height = 18;
  for (let c = 1; c <= 13; c++) {
    const cell = subRow.getCell(c);
    cell.font = { name: 'Arial', size: 8.5, bold: true, color: { argb: 'FF122922' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E4D8' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'medium' },
      left: { style: 'thin' }, right: { style: 'thin' },
    };
  }

  ws.columns = [
    { width: 4.5 }, { width: 4.5 }, { width: 5.5 }, { width: 5.5 }, { width: 5.5 }, { width: 7.5 }, { width: 6.5 },
    { width: 44 }, // H: Uraian
    { width: 18 }, // I: Anggaran
    { width: 16 }, // J: Realisasi Awal
    { width: 32 }, // K: PPKOM
    { width: 32 }, // L: PPTK
    { width: 32 }, // M: Pejabat Pengadaan
  ];

  // Kelompokkan per induk_kode
  const groups = new Map();
  for (const r of rekRows) {
    const ik = r.induk_kode || r.kode.split('.').slice(0, 6).join('.') || '5.1.02.99.99.9999';
    if (!groups.has(ik)) {
      groups.set(ik, {
        induk_kode: ik,
        induk_uraian: r.induk_uraian || INDUK_MAP[ik] || 'Belanja BLUD',
        items: [],
      });
    }
    groups.get(ik).items.push(r);
  }

  let rowIdx = 6;
  const ppkomRange = `MASTER_PEJABAT!$A$2:$A$${Math.max(2, ppkomList.length + 1)}`;
  const pptkRange = `MASTER_PEJABAT!$B$2:$B$${Math.max(2, pptkList.length + 1)}`;
  const pengadaanRange = `MASTER_PEJABAT!$C$2:$C$${Math.max(2, pengadaanList.length + 1)}`;

  for (const g of groups.values()) {
    // Baris Induk
    const segs = g.induk_kode.split('.');
    const rInduk = ws.getRow(rowIdx++);
    rInduk.height = 21;
    for (let i = 0; i < 6; i++) rInduk.getCell(i + 1).value = segs[i] || '';
    rInduk.getCell(7).value = '';
    rInduk.getCell(8).value = g.induk_uraian;
    rInduk.getCell(9).value = g.items.reduce((s, x) => s + (Number(x.pagu) || 0), 0);
    rInduk.getCell(10).value = g.items.reduce((s, x) => s + (Number(x.realisasi_awal) || 0), 0);

    for (let c = 1; c <= 13; c++) {
      const cell = rInduk.getCell(c);
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF122922' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6EE30' } };
      cell.border = {
        top: { style: 'thin' }, bottom: { style: 'thin' },
        left: { style: 'thin' }, right: { style: 'thin' },
      };
      if (c <= 7) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (c === 9 || c === 10) cell.numFmt = '#,##0';
    }

    // Baris Anak (Child)
    for (const item of g.items) {
      const rChild = ws.getRow(rowIdx++);
      rChild.height = 20;
      const urut = item.no_urut || parseInt(item.kode.split('.')[6], 10) || 1;
      rChild.getCell(7).value = urut;
      rChild.getCell(8).value = item.uraian;
      rChild.getCell(9).value = Number(item.pagu) || 0;
      rChild.getCell(10).value = Number(item.realisasi_awal) || 0;
      rChild.getCell(11).value = pejMap.get(item.ppkom_id) || '';
      rChild.getCell(12).value = pejMap.get(item.pptk_id) || '';
      rChild.getCell(13).value = pejMap.get(item.pengadaan_id) || '';

      for (let c = 1; c <= 13; c++) {
        const cell = rChild.getCell(c);
        cell.font = { name: 'Arial', size: 9.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        };
        if (c === 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.font = { name: 'Arial', size: 9.5, bold: true };
        }
        if (c === 9 || c === 10) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      }

      // Pasang Dropdown Data Validation untuk PPKOM (K), PPTK (L), dan Pejabat Pengadaan (M)
      if (ppkomList.length > 0) {
        rChild.getCell(11).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [ppkomRange],
          showErrorMessage: false,
        };
      }
      if (pptkList.length > 0) {
        rChild.getCell(12).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [pptkRange],
          showErrorMessage: false,
        };
      }
      if (pengadaanList.length > 0) {
        rChild.getCell(13).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [pengadaanRange],
          showErrorMessage: false,
        };
      }
    }
  }

  return wb.xlsx.writeBuffer();
}

module.exports = { importRealisasi, listSheets, generateTemplateExcel };
