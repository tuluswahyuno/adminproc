// Utilitas: terbilang, pajak, kategori nilai, format.
const crypto = require('crypto');

const passwordAcak = (n = 12) => crypto.randomBytes(n).toString('base64url').slice(0, n);

const SATUAN = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

function baca(n) {
  n = Math.floor(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return baca(n - 10) + ' Belas';
  if (n < 100) return baca(Math.floor(n / 10)) + ' Puluh' + (n % 10 ? ' ' + baca(n % 10) : '');
  if (n < 200) return 'Seratus' + (n - 100 ? ' ' + baca(n - 100) : '');
  if (n < 1000) return baca(Math.floor(n / 100)) + ' Ratus' + (n % 100 ? ' ' + baca(n % 100) : '');
  if (n < 2000) return 'Seribu' + (n - 1000 ? ' ' + baca(n - 1000) : '');
  if (n < 1e6) return baca(Math.floor(n / 1e3)) + ' Ribu' + (n % 1e3 ? ' ' + baca(n % 1e3) : '');
  if (n < 1e9) return baca(Math.floor(n / 1e6)) + ' Juta' + (n % 1e6 ? ' ' + baca(n % 1e6) : '');
  if (n < 1e12) return baca(Math.floor(n / 1e9)) + ' Miliar' + (n % 1e9 ? ' ' + baca(n % 1e9) : '');
  return baca(Math.floor(n / 1e12)) + ' Triliun' + (n % 1e12 ? ' ' + baca(n % 1e12) : '');
}

function terbilang(n) {
  n = Math.round(Number(n) || 0);
  return (n === 0 ? 'Nol' : baca(n)) + ' Rupiah';
}

const rupiah = (n) => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID');

/**
 * Perhitungan pajak mengikuti contoh Excel "A2 - CONTOH PERHITUNGAN PAJAK PPH 22":
 *   DPP  = Jumlah Kotor x 100/111   (bila harga sudah termasuk PPN)
 *   PPN  = ROUND(11% x DPP)
 *   PPh22= ROUND(1,5% x DPP)
 *   Bersih = Kotor - (PPN + PPh22)
 */
function hitungPajak({ kotor, ppn = false, pph = false, ppnTarif = 11, pphTarif = 1.5 }) {
  kotor = Math.round(Number(kotor) || 0);
  const dpp = ppn ? (100 / (100 + ppnTarif)) * kotor : kotor;
  const nPpn = ppn ? Math.round((ppnTarif / 100) * dpp) : 0;
  const nPph = pph ? Math.round((pphTarif / 100) * dpp) : 0;
  return { kotor, dpp: Math.round(dpp), ppn: nPpn, pph: nPph, bersih: kotor - (nPpn + nPph) };
}

// Kategori nilai SPJ
const KATEGORI = [
  { kode: 'K1', label: '0 – 2 jt', max: 2_000_000 },
  { kode: 'K2', label: '> 2 – 10 jt', max: 10_000_000 },
  { kode: 'K3', label: '> 10 – 50 jt', max: 50_000_000 },
  { kode: 'K4', label: '> 50 – 750 jt', max: 750_000_000 },
];
function kategori(n) {
  n = Number(n) || 0;
  return (KATEGORI.find((k) => n <= k.max) || { kode: 'K5', label: '> 750 jt' }).kode;
}

// Jalur dokumen mengikuti nilai paket: sampai Rp50 juta = 10–50 jt, di atasnya = 50–750 jt (nilai 0 = belum ditentukan).
const BATAS_ALUR_PL = 50_000_000;
// E-Purchasing: dokumen HPS hanya dibuat untuk paket bernilai di atas Rp100 juta
const BATAS_HPS_EPUR = 100_000_000;
function modeAlur(mode, nilai) {
  if (mode !== '10_50' && mode !== '50_750') return mode;
  const n = Number(nilai) || 0;
  if (n <= 0) return mode;
  return n > BATAS_ALUR_PL ? '50_750' : '10_50';
}
// tahap yang hanya ada di satu jalur dipetakan ke tahap setara di jalur tujuan
function tahapUntukMode(mode, tahap) {
  if (mode === '10_50') return { undangan: 'hps', evaluasi: 'negosiasi', penetapan: 'negosiasi', kontrak: 'negosiasi' }[tahap] || tahap;
  if (mode === '50_750') return { pesanan: 'kontrak' }[tahap] || tahap;
  return tahap;
}

const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

function tglIndo(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return `${d} ${BULAN[m - 1]} ${y}`;
}

function tglKalimatBast(iso) {
  if (!iso) return { hari: '……', tanggalHuruf: '……', bulan: '……', tahunHuruf: '……' };
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return { hari: '……', tanggalHuruf: '……', bulan: '……', tahunHuruf: '……' };
  const dt = new Date(y, m - 1, d);
  return {
    hari: HARI[dt.getDay()],
    tanggalHuruf: baca(d).trim(),
    bulan: BULAN[m - 1],
    tahunHuruf: baca(y).trim(),
  };
}

module.exports = { modeAlur, tahapUntukMode, BATAS_ALUR_PL, BATAS_HPS_EPUR, passwordAcak, terbilang, baca, rupiah, hitungPajak, kategori, KATEGORI, tglIndo, tglKalimatBast };

