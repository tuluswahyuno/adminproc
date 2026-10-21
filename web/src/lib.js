export async function api(path, { method = 'GET', body, form } = {}) {
  const opt = { method, headers: {}, credentials: 'same-origin' }
  if (form) opt.body = form
  else if (body !== undefined) { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body) }
  const r = await fetch('/api' + path, opt)
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { const e = new Error(data.error || 'Terjadi kesalahan'); e.status = r.status; throw e }
  return data
}

export const rp = (n) => 'Rp' + Math.round(Number(n) || 0).toLocaleString('id-ID')
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('id-ID')
export const persen = (n) => (Number(n) || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + '%'

const S = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas']
export function baca(n) {
  n = Math.floor(Number(n) || 0)
  if (n < 12) return S[n]
  if (n < 20) return baca(n - 10) + ' Belas'
  if (n < 100) return baca(Math.floor(n / 10)) + ' Puluh' + (n % 10 ? ' ' + baca(n % 10) : '')
  if (n < 200) return 'Seratus' + (n - 100 ? ' ' + baca(n - 100) : '')
  if (n < 1000) return baca(Math.floor(n / 100)) + ' Ratus' + (n % 100 ? ' ' + baca(n % 100) : '')
  if (n < 2000) return 'Seribu' + (n - 1000 ? ' ' + baca(n - 1000) : '')
  if (n < 1e6) return baca(Math.floor(n / 1e3)) + ' Ribu' + (n % 1e3 ? ' ' + baca(n % 1e3) : '')
  if (n < 1e9) return baca(Math.floor(n / 1e6)) + ' Juta' + (n % 1e6 ? ' ' + baca(n % 1e6) : '')
  if (n < 1e12) return baca(Math.floor(n / 1e9)) + ' Miliar' + (n % 1e9 ? ' ' + baca(n % 1e9) : '')
  return baca(Math.floor(n / 1e12)) + ' Triliun' + (n % 1e12 ? ' ' + baca(n % 1e12) : '')
}
export const terbilang = (n) => { n = Math.round(Number(n) || 0); return n ? baca(n) + ' Rupiah' : '' }

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN_FULL = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export function kalimatTanggalBast(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number)
  if (!y || !m || !d) return ''
  const dt = new Date(y, m - 1, d)
  return `Pada hari ini, ${HARI[dt.getDay()]} tanggal ${baca(d)} bulan ${BULAN_FULL[m - 1]} tahun ${baca(y)}`
}

// Rumus pajak identik dengan server (contoh Excel PPh 22)
export function hitungPajak({ kotor, ppn, pph, ppnTarif = 11, pphTarif = 1.5 }) {
  kotor = Math.round(Number(kotor) || 0)
  const dpp = ppn ? (100 / (100 + ppnTarif)) * kotor : kotor
  const nPpn = ppn ? Math.round((ppnTarif / 100) * dpp) : 0
  const nPph = pph ? Math.round((pphTarif / 100) * dpp) : 0
  return { kotor, dpp: Math.round(dpp), ppn: nPpn, pph: nPph, bersih: kotor - nPpn - nPph }
}

export const KATEGORI = [
  { kode: 'K1', label: '0 – 2 jt', max: 2e6, tone: 'bg-[#b5e8a5] text-[#122922] ring-[#122922]/30' },
  { kode: 'K2', label: '2 – 10 jt', max: 1e7, tone: 'bg-[#a9dcf0] text-[#122922] ring-[#122922]/30' },
  { kode: 'K3', label: '10 – 50 jt', max: 5e7, tone: 'bg-[#f6db5b] text-[#122922] ring-[#122922]/30' },
  { kode: 'K4', label: '50 – 750 jt', max: 7.5e8, tone: 'bg-[#f4c2cc] text-[#122922] ring-[#122922]/30' },
  { kode: 'K5', label: '> 750 jt', max: Infinity, tone: 'bg-[#b7aef3] text-[#122922] ring-[#122922]/30' },
]
export const kategoriOf = (n) => KATEGORI.find((k) => (Number(n) || 0) <= k.max)
export const kategoriByKode = (k) => KATEGORI.find((x) => x.kode === k) || KATEGORI[0]

export const PERAN = {
  KPA: 'Kuasa Pengguna Anggaran',
  PPKOM: 'Pejabat Pembuat Komitmen (PPK)',
  PPTK: 'PPTK',
  PENGADAAN: 'Pejabat Pengadaan',
  BENDAHARA: 'Bendahara Pengeluaran Pembantu',
  VERIFIKATOR: 'Verifikator',
  PENGURUS_BARANG: 'Pengurus Barang',
}

export const ROLE_LABEL = {
  superuser: 'Super User (Semua Akses)',
  admin: 'Administrator',
  pep: 'PEP (Perencanaan & Evaluasi)',
  pejabat_pengadaan: 'Pejabat Pengadaan',
  staf: 'Staf / Pejabat / Tim',
}

export const bulanLabel = (ym) => {
  if (!ym) return ''
  const [y, m] = ym.split('-')
  return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][+m - 1] + ' ' + y.slice(2)
}
export const tgl = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '')
