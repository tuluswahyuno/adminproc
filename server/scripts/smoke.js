// Uji cepat: impor realisasi, buat transaksi contoh, cetak dokumen.
const fs = require('fs');
process.env.DATA_DIR = require('path').join(process.env.TEMP, 'spjtest');
const { db } = require('../lib/db');
const { importRealisasi } = require('../lib/import');
const { buatDokumen } = require('../lib/docs');
(async () => {
  const up = process.argv[2];
  const r = await importRealisasi(fs.readFileSync(up));
  console.log('import', r);
  const rek = db.prepare("SELECT * FROM rekening WHERE kode='5.1.02.99.99.9999.20'").get();
  console.log(rek, db.prepare('SELECT COUNT(*) c FROM rekening').get(), db.prepare('SELECT * FROM pejabat').all().length);
  const kpa = db.prepare("SELECT id FROM pejabat WHERE peran='KPA'").get().id;
  const bend = db.prepare("SELECT id FROM pejabat WHERE peran='BENDAHARA'").get().id;
  const ver = db.prepare("SELECT id FROM pejabat WHERE peran='VERIFIKATOR'").get().id;
  const id = Number(db.prepare(`INSERT INTO transaksi(tanggal,rekening_id,penyedia,uraian,kotor,ppn_aktif,pph_aktif,kategori,kpa_id,pptk_id,bendahara_id,verifikator_id)
    VALUES('2026-10-15',?,?,?,?,1,1,'K4',?,?,?,?)`).run(rek.id, 'PT Millennium Pharmacon International Tbk Cabang Solo', 'Belanja Obat (miozidine)', 91499986, kpa, rek.pptk_id, bend, ver).lastInsertRowid);
  for (const j of ['a2', 'verifikasi']) for (const f of ['pdf', 'docx']) {
    const o = await buatDokumen(id, j, f);
    fs.writeFileSync(`${process.env.TEMP}\\spjtest\\${j}.${f}`, o.buffer);
    console.log(j, f, o.buffer.length);
  }
})().catch((e) => { console.error(e); process.exit(1); });
