import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, Download, Eye, Plus, RotateCcw, Save, Trash2,
} from 'lucide-react'
import { api, hitungPajak, kategoriOf, rp, terbilang, PERAN } from '../lib'
import { Field, KategoriBadge, PageHeader, SearchableSelect, konfirmasiHapus } from '../ui'
import { PreviewModal } from './Transaksi'
import { RekeningPicker, defaultPl, itemBaru, kosong } from './TransaksiForm'
import { useAuth } from '../App'

const hariIni = () => new Date().toISOString().slice(0, 10)
const nomorLengkap = (urut, tahun) => `000.3.2/${urut}/05.1.2/${tahun}`
const basisNomor = (u) => String(u || '').split('.')[0]
const angka = (v) => Number(v) || 0

// urutan tahap di database; tahap tidak boleh mundur saat menyimpan langkah sebelumnya
const TAHAP_RANK = { spektek: 0, spektek_hps: 1, hps: 1, undangan: 2, evaluasi: 3, negosiasi: 4, penetapan: 5, kontrak: 6, pesanan: 6, selesai: 7 }

const DOK = {
  spektek: 'Spesifikasi Teknis / KAK', hps: 'BA Penetapan HPS', undangan_pl: 'Undangan Pengadaan Langsung',
  ba_pembukaan: 'BA Pembukaan Penawaran', ba_evaluasi: 'BA Evaluasi Penawaran',
  undangan_klarifikasi: 'Undangan Klarifikasi & Negosiasi', bakn: 'BA Klarifikasi & Negosiasi',
  ba_penetapan: 'BA Penetapan Pemenang', bahpl: 'BA Hasil Pengadaan Langsung', pengumuman_pl: 'Pengumuman Hasil PL',
  laporan_pl: 'Laporan Hasil PL ke PPK', spk: 'SPK', sppbj: 'SPPBJ', sp: 'Surat Pesanan', bast: 'BAST',
  baphp: 'BAPHP', a2: 'A2 (Bukti Pengeluaran)', verifikasi: 'Lembar Verifikasi',
}

/* ---------- daftar langkah ---------- */
const LANGKAH_50 = [
  { id: 'spektek', fase: 'Perencanaan', judul: 'Spesifikasi Teknis / KAK', dok: ['spektek'], tahap: 'spektek' },
  { id: 'hps', fase: 'Perencanaan', judul: 'BA Penetapan HPS', dok: ['hps'], tahap: 'hps' },
  { id: 'undangan', fase: 'Pemilihan Penyedia', judul: 'Undangan Pengadaan Langsung', dok: ['undangan_pl'], tahap: 'undangan' },
  { id: 'pembukaan', fase: 'Pemilihan Penyedia', judul: 'BA Pembukaan Penawaran', dok: ['ba_pembukaan'], tahap: 'evaluasi' },
  { id: 'evaluasi', fase: 'Pemilihan Penyedia', judul: 'BA Evaluasi Penawaran', dok: ['ba_evaluasi'], tahap: 'evaluasi' },
  { id: 'undklar', fase: 'Klarifikasi & Negosiasi', judul: 'Undangan Klarifikasi & Negosiasi', dok: ['undangan_klarifikasi'], tahap: 'negosiasi' },
  { id: 'bakn', fase: 'Klarifikasi & Negosiasi', judul: 'BA Klarifikasi & Negosiasi', dok: ['bakn'], tahap: 'negosiasi' },
  { id: 'penetapan', fase: 'Penetapan', judul: 'Penetapan Pemenang & Pengumuman', dok: ['ba_penetapan', 'bahpl', 'pengumuman_pl', 'laporan_pl'], tahap: 'penetapan' },
  { id: 'spk', fase: 'Kontrak', judul: 'Surat Perintah Kerja (SPK)', dok: ['spk'], tahap: 'kontrak' },
  { id: 'sppbj', fase: 'Kontrak', judul: 'SPPBJ', dok: ['sppbj'], tahap: 'kontrak' },
  { id: 'serah', fase: 'Serah Terima & Pembayaran', judul: 'BAST & BAPHP', dok: ['bast', 'baphp'], tahap: 'selesai' },
  { id: 'bayar', fase: 'Serah Terima & Pembayaran', judul: 'A2 & Lembar Verifikasi', dok: ['a2', 'verifikasi'], tahap: 'selesai' },
]
const LANGKAH_10 = [
  { id: 'spektek', fase: 'Perencanaan', judul: 'Spesifikasi Teknis / KAK', dok: ['spektek'], tahap: 'spektek' },
  { id: 'hps', fase: 'Perencanaan', judul: 'BA Penetapan HPS', dok: ['hps'], tahap: 'hps' },
  { id: 'bakn', fase: 'Klarifikasi & Negosiasi', judul: 'Penyedia & BA Klarifikasi / Negosiasi', dok: ['bakn'], tahap: 'negosiasi' },
  { id: 'sp', fase: 'Pemesanan', judul: 'Surat Pesanan', dok: ['sp'], tahap: 'pesanan' },
  { id: 'serah', fase: 'Serah Terima & Pembayaran', judul: 'BAST & BAPHP', dok: ['bast', 'baphp'], tahap: 'selesai' },
  { id: 'bayar', fase: 'Serah Terima & Pembayaran', judul: 'A2 & Lembar Verifikasi', dok: ['a2', 'verifikasi'], tahap: 'selesai' },
]

/* ---------- penomoran: kunci dokumen -> kolom ---------- */
const NOMOR = {
  hps: { label: 'No. BA Penetapan HPS' },
  bakn: { label: 'No. BA Klarifikasi & Negosiasi' },
  sp: { label: 'No. Surat Pesanan' },
  spk: { label: 'No. SPK' },
  bast: { label: 'No. BAST' },
  baphp: { label: 'No. BAPHP' },
  undangan: { label: 'No. Undangan PL', pl: true },
  pembukaan: { label: 'No. BA Pembukaan', pl: true },
  evaluasi: { label: 'No. BA Evaluasi', pl: true },
  undangan_klarifikasi: { label: 'No. Undangan Klarifikasi', pl: true },
  penetapan: { label: 'No. BA Penetapan Pemenang', pl: true },
  bahpl: { label: 'No. BAHPL', pl: true },
  pengumuman: { label: 'No. Pengumuman', pl: true },
  laporan: { label: 'No. Laporan ke PPK', pl: true },
  sppbj: { label: 'No. SPPBJ', pl: true },
}
const nomorDari = (f, k) => (NOMOR[k].pl ? f.pl?.[`${k}_no_urut`] : f[`${k}_no_urut`]) || ''
const tanggalDari = (f, k) => (NOMOR[k].pl ? f.pl?.[`${k}_tanggal`] : f[`${k}_tanggal`]) || ''

// saran nomor berikutnya (dari server) disesuaikan dengan nomor yang sudah dipilih pada paket ini
const saranNomor = (k, f, nn) => {
  switch (k) {
    case 'hps': return nn.nextHps
    case 'bakn': return nn.nextBakn
    case 'sp': { const m = /^(\d+)\.a$/i.exec(f.bakn_no_urut || ''); return m ? m[1] : nn.nextSp }
    case 'spk': return nn.nextSpk
    case 'bast': return nn.nextBast
    case 'baphp': return `${basisNomor(f.bast_no_urut) || nn.nextBast}.a`
    case 'undangan': return nn.nextPlUndangan
    case 'pembukaan': return `${basisNomor(f.pl?.evaluasi_no_urut) || nn.nextPlEvaluasi}.b`
    case 'evaluasi': return `${basisNomor(f.pl?.pembukaan_no_urut) || nn.nextPlEvaluasi}.c`
    case 'undangan_klarifikasi': return nn.nextPlUndanganKlarifikasi
    case 'penetapan': return nn.nextPlPenetapan
    case 'bahpl': return `${basisNomor(f.pl?.penetapan_no_urut) || nn.nextPlPenetapan}.a`
    case 'pengumuman': return `${basisNomor(f.pl?.penetapan_no_urut) || nn.nextPlPenetapan}.b`
    case 'laporan': {
      const dasar = basisNomor(f.pl?.penetapan_no_urut)
      return String(dasar ? Math.max(angka(nn.nextPlLaporan), angka(dasar) + 1) : nn.nextPlLaporan)
    }
    case 'sppbj': return nn.nextSppbj
    default: return ''
  }
}

// jadwal (undangan) -> tanggal dokumen terkait, dipakai saat jadwal diubah
const DARI_JADWAL = {
  pembukaan_tgl: ['pl.pembukaan_tanggal'],
  evaluasi_tgl: ['pl.evaluasi_tanggal'],
  klarifikasi_tgl: ['bakn_tanggal'],
  penetapan_tgl: ['pl.penetapan_tanggal', 'pl.bahpl_tanggal', 'pl.pengumuman_tanggal', 'pl.laporan_tanggal'],
  spk_tgl: ['spk_tanggal'],
}
// ke jadwal bila tanggal dokumen diubah di langkahnya sendiri
const KE_JADWAL = { pembukaan: 'pembukaan_tgl', evaluasi: 'evaluasi_tgl', bakn: 'klarifikasi_tgl', penetapan: 'penetapan_tgl', spk: 'spk_tgl' }

const KAK = [
  { judul: 'Fungsi & hasil yang diharapkan', kolom: [['fungsi_umum', 'Fungsi umum dan output pengadaan']] },
  {
    judul: 'Mutu & spesifikasi',
    kolom: [['mutu_merek', 'Merek'], ['mutu_standarisasi', 'Standar & kondisi barang'], ['mutu_teknis', 'Spesifikasi teknis', true], ['mutu_kinerja', 'Kinerja'], ['mutu_pdn', 'Produk dalam negeri (TKDN)']],
  },
  { judul: 'Waktu & tempat penyerahan', kolom: [['waktu_jangka', 'Jangka waktu'], ['waktu_lokasi', 'Lokasi penyerahan'], ['waktu_transportasi', 'Pengemasan & transportasi']] },
  { judul: 'Layanan purna jual', kolom: [['layanan_tingkat', 'Tingkat layanan'], ['layanan_pelatihan', 'Pelatihan / bantuan teknis'], ['layanan_pemeliharaan', 'Garansi & pemeliharaan'], ['layanan_lainnya', 'Layanan lainnya']] },
  { judul: 'Informasi lainnya', kolom: [['info_lainnya', 'Komponen harga & kelengkapan']] },
]

/* ---------- komponen kecil ---------- */
function NomorField({ k, f, tahun, nn, setNo }) {
  const urut = nomorDari(f, k)
  const saran = saranNomor(k, f, nn)
  const sudahIsi = useRef(false)
  // 'tersimpan' = nomor sudah ada sebelum langkah dibuka; 'otomatis' / 'manual' = hasil isian pada sesi ini
  const [asal, setAsal] = useState(urut ? 'tersimpan' : '')
  useEffect(() => {
    if (!sudahIsi.current && !urut && saran) { sudahIsi.current = true; setAsal('otomatis'); setNo(k, saran) }
  }, [saran]) // eslint-disable-line react-hooks/exhaustive-deps
  const ubah = (v) => { setAsal('manual'); setNo(k, v) }
  return (
    <Field label={NOMOR[k].label}>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-[#122922]/20 bg-white focus-within:border-[#122922]">
        <span className="grid place-items-center bg-[#f7f5ef] px-2.5 font-mono text-[11px] font-bold text-[#122922]/60">000.3.2/</span>
        <input className="w-24 min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-sm font-extrabold outline-none" value={urut} onChange={(e) => ubah(e.target.value.trim())} />
        <span className="grid place-items-center bg-[#f7f5ef] px-2.5 font-mono text-[11px] font-bold text-[#122922]/60">/05.1.2/{tahun}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <span className={`rounded-full px-2 py-0.5 font-bold ${asal === 'otomatis' ? 'bg-[#b5e8a5]' : asal === 'manual' ? 'bg-[#f6db5b]' : 'bg-[#f7f5ef] text-[#122922]/70'}`}>
          {asal === 'otomatis' ? 'Otomatis' : asal === 'manual' ? 'Manual' : 'Tersimpan'}
        </span>
        {asal === 'manual' && saran && urut !== saran && (
          <button type="button" className="inline-flex items-center gap-1 font-bold text-[#1d5a42] hover:underline" onClick={() => { setAsal('otomatis'); setNo(k, saran) }}>
            <RotateCcw size={11} /> pakai saran {saran}
          </button>
        )}
      </div>
    </Field>
  )
}

const TanggalField = ({ label, value, onChange }) => (
  <Field label={label}>
    <input type="date" className="input" value={(value || '').slice(0, 10)} onChange={(e) => onChange(e.target.value)} />
  </Field>
)

function PejabatField({ pejabat, peran, nilai, onChange, label }) {
  const opsi = pejabat.filter((p) => p.peran === peran).map((p) => ({ value: p.id, label: p.nama, sub: p.nip ? `NIP. ${p.nip}${p.jabatan ? ' · ' + p.jabatan : ''}` : p.jabatan || '' }))
  return (
    <Field label={label || PERAN[peran]}>
      <SearchableSelect value={nilai || ''} options={opsi} placeholder="— pilih —" searchPlaceholder="Cari nama pejabat…" allowClear onChange={onChange} />
    </Field>
  )
}

const KOLOM_HARGA = {
  harga_hps: 'Harga HPS',
  harga_penawaran: 'Harga penawaran',
  harga_satuan: 'Harga hasil negosiasi',
}
const MODE_TABEL = {
  spek: { ro: [], edit: [], hitung: null },
  hps: { ro: [], edit: ['harga_hps'], hitung: 'harga_hps' },
  penawaran: { ro: ['harga_hps'], edit: ['harga_penawaran'], hitung: 'harga_penawaran' },
  nego: { ro: ['harga_hps', 'harga_penawaran'], edit: ['harga_satuan'], hitung: 'harga_satuan' },
  nego10: { ro: ['harga_hps'], edit: ['harga_penawaran', 'harga_satuan'], hitung: 'harga_satuan' },
}
const jumlahBaris = (it, key) => Math.round(angka(it.kuantitas) * angka(it[key]))

function TabelBarang({ items, setItems, mode, aksi }) {
  const m = MODE_TABEL[mode]
  const ubah = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))
  const total = m.hitung ? items.reduce((s, it) => s + jumlahBaris(it, m.hitung), 0) : 0
  const kolomHarga = [...m.ro, ...m.edit]
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#122922]/15">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-[#f7f5ef]">
            <tr className="text-left text-[11px] font-extrabold uppercase tracking-wider text-[#122922]/70">
              <th className="w-9 px-2.5 py-2">No</th>
              <th className="px-2.5 py-2">Nama barang / spesifikasi</th>
              <th className="w-20 px-2.5 py-2">Satuan</th>
              <th className="w-16 px-2.5 py-2 text-right">Jumlah</th>
              {kolomHarga.map((k) => <th key={k} className="w-32 px-2.5 py-2 text-right">{KOLOM_HARGA[k]}</th>)}
              {m.hitung && <th className="w-32 px-2.5 py-2 text-right">Total</th>}
              {mode === 'spek' && <th className="w-9" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#122922]/10">
            {items.map((it, i) => (
              <tr key={i} className="align-top">
                <td className="px-2.5 py-2 font-mono text-xs font-bold text-[#122922]/50">{i + 1}</td>
                <td className="px-2.5 py-1.5">
                  {mode === 'spek'
                    ? <textarea rows={2} className="input !py-1.5 text-sm" value={it.jenis_barang} onChange={(e) => ubah(i, 'jenis_barang', e.target.value)} placeholder="mis. AC Split 1 PK Inverter" />
                    : <div className="py-1 font-semibold text-[#122922]">{it.jenis_barang}</div>}
                </td>
                <td className="px-2.5 py-1.5">
                  {mode === 'spek' ? <input className="input !py-1.5 text-sm" value={it.satuan} onChange={(e) => ubah(i, 'satuan', e.target.value)} /> : <div className="py-1">{it.satuan}</div>}
                </td>
                <td className="px-2.5 py-1.5">
                  {mode === 'spek'
                    ? <input type="number" min="0" step="any" className="input !py-1.5 text-right font-mono text-sm" value={it.kuantitas} onChange={(e) => ubah(i, 'kuantitas', e.target.value)} />
                    : <div className="py-1 text-right font-mono">{angka(it.kuantitas)}</div>}
                </td>
                {kolomHarga.map((k) => (
                  <td key={k} className="px-2.5 py-1.5">
                    {m.edit.includes(k)
                      ? <input type="number" min="0" step="any" className="input !py-1.5 text-right font-mono text-sm" value={it[k]} onChange={(e) => ubah(i, k, e.target.value)} />
                      : <div className="py-1 text-right font-mono text-[#122922]/60">{angka(it[k]) ? rp(it[k]) : '—'}</div>}
                  </td>
                ))}
                {m.hitung && <td className="px-2.5 py-2 text-right font-mono font-bold">{rp(jumlahBaris(it, m.hitung))}</td>}
                {mode === 'spek' && (
                  <td className="px-1 py-1.5">
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-[#122922]/40 hover:bg-rose-50 hover:text-rose-600" title="Hapus baris"><Trash2 size={14} /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {m.hitung && (
            <tfoot>
              <tr className="bg-[#d6ee30]/40 font-extrabold">
                <td colSpan={4 + kolomHarga.length} className="px-2.5 py-2 text-right text-xs uppercase tracking-wider">Total {KOLOM_HARGA[m.hitung]}</td>
                <td className="px-2.5 py-2 text-right font-mono">{rp(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {mode === 'spek' && (
          <button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setItems([...items, itemBaru()])}><Plus size={13} /> Tambah barang</button>
        )}
        {aksi}
      </div>
    </div>
  )
}

function PenyediaBox({ f, upd, daftar }) {
  const opsi = daftar.map((v) => ({ value: v.id, label: v.nama, sub: [v.pimpinan, v.alamat].filter(Boolean).join(' · ') }))
  const pilih = (id) => {
    const v = daftar.find((x) => x.id === id)
    if (!v) return
    upd({ penyedia_id: v.id, penyedia: v.nama, penyedia_pimpinan: v.pimpinan || '', penyedia_jabatan: v.jabatan || 'Direktur', penyedia_alamat: v.alamat || '', penyedia_npwp: v.npwp || '' })
  }
  return (
    <div className="space-y-3 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3.5">
      <Field label="Pilih dari daftar penyedia" hint="Atau ketik penyedia baru di bawah; data tersimpan otomatis ke daftar penyedia.">
        <SearchableSelect value={f.penyedia_id || ''} options={opsi} placeholder="— cari CV / PT —" searchPlaceholder="Cari nama penyedia…" onChange={pilih} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nama penyedia (CV / PT)"><input className="input" value={f.penyedia} onChange={(e) => upd({ penyedia: e.target.value, penyedia_id: '' })} /></Field>
        <Field label="Nama pimpinan"><input className="input" value={f.penyedia_pimpinan} onChange={(e) => upd({ penyedia_pimpinan: e.target.value })} /></Field>
        <Field label="Jabatan"><input className="input" value={f.penyedia_jabatan} onChange={(e) => upd({ penyedia_jabatan: e.target.value })} /></Field>
        <Field label="NPWP"><input className="input font-mono" value={f.penyedia_npwp} onChange={(e) => upd({ penyedia_npwp: e.target.value })} /></Field>
        <Field label="Alamat" className="sm:col-span-2"><input className="input" value={f.penyedia_alamat} onChange={(e) => upd({ penyedia_alamat: e.target.value })} /></Field>
      </div>
    </div>
  )
}

function EditorKak({ spektek, updSpek, standar, items }) {
  const [buka, setBuka] = useState(0)
  const diubah = (kolom) => kolom.filter(([k]) => String(spektek[k] || '').trim()).length
  const daftarBarang = items.filter((i) => i.jenis_barang.trim()).map((i) => `${i.jenis_barang.trim()} (${angka(i.kuantitas)} ${i.satuan || 'Unit'})`).join('\n')
  return (
    <div className="space-y-2.5">
      <p className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-3.5 py-2.5 text-xs text-[#122922]/75">
        Kolom yang <b>dikosongkan</b> otomatis dicetak dengan <b>teks standar</b> (tampil abu-abu). Isi hanya bagian yang perlu Anda sesuaikan.
      </p>
      {KAK.map((g, gi) => (
        <div key={g.judul} className="overflow-hidden rounded-xl border border-[#122922]/15 bg-white">
          <button type="button" onClick={() => setBuka(buka === gi ? -1 : gi)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#f7f5ef]">
            <span className="text-sm font-extrabold text-[#122922]">{g.judul}</span>
            <span className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${diubah(g.kolom) ? 'bg-[#d6ee30]' : 'bg-[#f7f5ef] text-[#122922]/60'}`}>
                {diubah(g.kolom) ? `${diubah(g.kolom)} diubah` : 'teks standar'}
              </span>
              <ChevronDown size={16} className={`transition ${buka === gi ? 'rotate-180' : ''}`} />
            </span>
          </button>
          {buka === gi && (
            <div className="space-y-4 border-t border-[#122922]/10 p-4">
              {g.kolom.map(([k, label, daridaftar]) => {
                const nilai = spektek[k] || ''
                const std = k === 'mutu_teknis' ? (daftarBarang || standar[k] || '') : (standar[k] || '')
                return (
                  <div key={k}>
                    <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="label !mb-0">{label}</span>
                      <span className="flex gap-3 text-[11px] font-bold text-[#1d5a42]">
                        {daridaftar && daftarBarang && <button type="button" className="hover:underline" onClick={() => updSpek(k, daftarBarang)}>ambil dari daftar barang</button>}
                        {!nilai && std && <button type="button" className="hover:underline" onClick={() => updSpek(k, std)}>edit teks standar</button>}
                        {nilai && <button type="button" className="inline-flex items-center gap-1 hover:underline" onClick={() => updSpek(k, '')}><RotateCcw size={11} /> kembali ke standar</button>}
                      </span>
                    </div>
                    <textarea rows={nilai.length > 160 || std.length > 160 ? 4 : 2} className="input text-sm placeholder:text-[#122922]/35" value={nilai} placeholder={std} onChange={(e) => updSpek(k, e.target.value)} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/* ---------- halaman utama ---------- */
export default function PengadaanWizard() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const { user } = useAuth()

  const [tier, setTier] = useState(sp.get('tier') === '10_50' ? '10_50' : '50_750')
  const langkah = tier === '50_750' ? LANGKAH_50 : LANGKAH_10
  const [f, setF] = useState(() => ({
    ...kosong(), mode_pengadaan: sp.get('tier') === '10_50' ? '10_50' : '50_750', tahap: 'spektek',
    spektek: { id_rup: '', tanggal: hariIni() }, pl: defaultPl(), items: [itemBaru()],
  }))
  const [saved, setSaved] = useState(id ? Number(id) : null)
  const [snap, setSnap] = useState(null)
  const [idx, setIdx] = useState(0)
  const [tabKak, setTabKak] = useState('paket')
  const [rek, setRek] = useState(null)
  const [awal, setAwal] = useState(0)
  const [pejabat, setPejabat] = useState([])
  const [penyedia, setPenyedia] = useState([])
  const [nn, setNn] = useState({})
  const [standar, setStandar] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [preview, setPreview] = useState(null)
  const [siap, setSiap] = useState(false)
  const pindahAwal = useRef(false)

  const tahun = useMemo(() => {
    const t = (tier === '10_50' ? (f.sp_tanggal || f.tanggal) : f.tanggal) || ''
    return t.slice(0, 4) || String(new Date().getFullYear())
  }, [tier, f.tanggal, f.sp_tanggal])

  const upd = (p) => setF((x) => ({ ...x, ...p }))
  const updSpek = (k, v) => setF((x) => ({ ...x, spektek: { ...x.spektek, [k]: v } }))
  const updPl = (p) => setF((x) => ({ ...x, pl: { ...x.pl, ...p } }))
  const setItems = (items) => setF((x) => ({ ...x, items }))
  const muatNomor = useCallback(() => api('/penomoran/next?tahun=' + tahun).then(setNn), [tahun])

  const setNo = useCallback((k, v) => setF((x) => {
    const nomor = v ? nomorLengkap(v, tahun) : ''
    return NOMOR[k].pl
      ? { ...x, pl: { ...x.pl, [`${k}_no_urut`]: v, [`${k}_nomor`]: nomor } }
      : { ...x, [`${k}_no_urut`]: v, [`${k}_nomor`]: nomor }
  }), [tahun])
  const setTgl = (k, v) => setF((x) => {
    const jk = KE_JADWAL[k]
    const jadwal = jk ? { ...x.pl.jadwal, [jk]: v } : x.pl.jadwal
    return NOMOR[k].pl
      ? { ...x, pl: { ...x.pl, [`${k}_tanggal`]: v, jadwal } }
      : { ...x, [`${k}_tanggal`]: v, pl: { ...x.pl, jadwal } }
  })
  const setJadwal = (k, v) => setF((x) => {
    const baru = { ...x, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, [k]: v } } }
    for (const tujuan of DARI_JADWAL[k] || []) {
      if (tujuan.startsWith('pl.')) baru.pl[tujuan.slice(3)] = v
      else baru[tujuan] = v
    }
    return baru
  })

  /* ----- muat master data & paket ----- */
  useEffect(() => {
    let batal = false
    ;(async () => {
      const [p, s, v] = await Promise.all([api('/pejabat'), api('/pengaturan'), api('/penyedia')])
      if (batal) return
      setPejabat(p.filter((x) => x.aktif)); setPenyedia(v)
      if (!id) {
        const sendiri = user?.role === 'pejabat_pengadaan' ? (user.pejabat_id || '') : ''
        upd({ kpa_id: s.kpa_id || '', bendahara_id: s.bendahara_id || '', verifikator_id: s.verifikator_id || '', pengurus_barang_id: s.pengurus_barang_id || '', pengadaan_id: sendiri })
        pindahAwal.current = true
        setSiap(true)
        return
      }
      if (Number(id) === saved && snap) return // baru saja dibuat dari halaman ini
      const t = await api('/transaksi/' + id)
      if (batal) return
      if (!['10_50', '50_750'].includes(t.mode_pengadaan)) { nav(`/transaksi/${id}`, { replace: true }); return }
      const items = (t.items?.length ? t.items : [{ jenis_barang: t.uraian || '', satuan: 'Paket', kuantitas: 1, harga_hps: t.kotor, harga_satuan: t.kotor }]).map((it) => ({
        jenis_barang: it.jenis_barang, satuan: it.satuan || 'Unit', kuantitas: angka(it.kuantitas) || 1,
        harga_hps: angka(it.harga_hps) || '', harga_penawaran: angka(it.harga_penawaran) || '', harga_satuan: angka(it.harga_satuan) || '',
      }))
      let spektek = {}, pl = {}
      try { spektek = JSON.parse(t.spektek_json || '{}') || {} } catch { /* kosong */ }
      try { pl = JSON.parse(t.pl_json || '{}') || {} } catch { /* kosong */ }
      const dasarPl = defaultPl()
      const baru = {
        ...kosong(), ...t, penyedia: t.penyedia === '-' ? '' : (t.penyedia || ''), items, spektek,
        pl: { ...dasarPl, ...pl, jadwal: { ...dasarPl.jadwal, ...(pl.jadwal || {}) } },
        ppn_aktif: !!t.ppn_aktif, pph_aktif: !!t.pph_aktif,
        pengurus_barang_id: t.pengurus_barang_id || s.pengurus_barang_id || '',
        spk_tanggal: t.spk_tanggal || pl.spk_tanggal || t.tanggal,
      }
      setTier(t.mode_pengadaan)
      setF(baru); setSnap(baru); setAwal(Number(t.kotor) || 0)
      const daftar = t.mode_pengadaan === '50_750' ? LANGKAH_50 : LANGKAH_10
      const minta = sp.get('langkah')
      const i = daftar.findIndex((l) => l.id === minta)
      setIdx(i >= 0 ? i : -1) // -1 = lompat ke langkah pertama yang belum selesai (dihitung di bawah)
      const r = (await api('/rekening?q=' + encodeURIComponent(t.rek_kode))).find((x) => x.id === t.rekening_id)
      setRek(r || null)
      setSiap(true)
    })().catch((e) => setErr(e.message))
    return () => { batal = true }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { muatNomor() }, [muatNomor])

  // teks standar KAK mengikuti nama paket
  useEffect(() => {
    const t = setTimeout(() => api('/spektek/standar?paket=' + encodeURIComponent(f.uraian || rek?.uraian || '')).then(setStandar).catch(() => {}), 350)
    return () => clearTimeout(t)
  }, [f.uraian, rek?.uraian])

  /* ----- hitungan ----- */
  const totalHps = f.items.reduce((s, it) => s + jumlahBaris(it, 'harga_hps'), 0)
  const totalPen = f.items.reduce((s, it) => s + jumlahBaris(it, 'harga_penawaran'), 0)
  const totalNego = f.items.reduce((s, it) => s + jumlahBaris(it, 'harga_satuan'), 0)
  const nilai = totalNego || totalHps
  const pajak = useMemo(() => hitungPajak({ kotor: nilai, ppn: f.ppn_aktif, pph: f.pph_aktif, ppnTarif: +f.ppn_tarif, pphTarif: +f.pph_tarif }), [nilai, f.ppn_aktif, f.pph_aktif, f.ppn_tarif, f.pph_tarif])
  const sisaPagu = rek ? rek.sisa + awal - nilai : null

  /* ----- status langkah (dari data yang sudah tersimpan) ----- */
  const terisi = useMemo(() => {
    const s = snap
    if (!s) return langkah.map(() => false)
    const sum = (k) => s.items.reduce((a, it) => a + jumlahBaris(it, k), 0)
    const pl = s.pl || {}
    const cek = {
      spektek: !!s.rekening_id && s.items.some((i) => i.jenis_barang?.trim()),
      hps: !!s.hps_no_urut && sum('harga_hps') > 0 && RANK(s) >= 1,
      undangan: !!pl.undangan_no_urut && !!s.penyedia?.trim(),
      pembukaan: !!pl.pembukaan_no_urut && sum('harga_penawaran') > 0,
      evaluasi: !!pl.evaluasi_no_urut,
      undklar: !!pl.undangan_klarifikasi_no_urut,
      bakn: !!s.bakn_no_urut && !!s.penyedia?.trim() && RANK(s) >= 4,
      penetapan: !!pl.penetapan_no_urut && !!pl.bahpl_no_urut && !!pl.pengumuman_no_urut && !!pl.laporan_no_urut,
      spk: !!s.spk_no_urut && RANK(s) >= 6,
      sppbj: !!pl.sppbj_no_urut,
      sp: !!s.sp_no_urut && RANK(s) >= 6,
      serah: !!s.bast_no_urut && !!s.baphp_no_urut && RANK(s) >= 7,
      bayar: s.tahap === 'selesai' && !!s.uraian?.trim(),
    }
    return langkah.map((l) => !!cek[l.id])
  }, [snap, langkah])
  const terjauh = Math.min(terisi.findIndex((x) => !x) === -1 ? langkah.length - 1 : terisi.findIndex((x) => !x), langkah.length - 1)

  useEffect(() => {
    if (siap && idx === -1) setIdx(terjauh)
  }, [siap, idx, terjauh])

  const L = langkah[Math.max(idx, 0)]
  useEffect(() => {
    if (saved && idx >= 0) nav(`/pengadaan/${saved}?langkah=${langkah[idx].id}`, { replace: true })
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps
  const nomorLangkah = {
    spektek: [], hps: ['hps'], undangan: ['undangan'], pembukaan: ['pembukaan'], evaluasi: ['evaluasi'], undklar: ['undangan_klarifikasi'],
    bakn: ['bakn'], penetapan: ['penetapan', 'bahpl', 'pengumuman', 'laporan'], spk: ['spk'], sppbj: ['sppbj'], sp: ['sp'], serah: ['bast', 'baphp'], bayar: [],
  }

  /* ----- peringatan urutan tanggal (50–750) ----- */
  const peringatanTanggal = useMemo(() => {
    if (tier !== '50_750' || !L) return ''
    const tingkat = [
      [['hps', 'HPS']], [['undangan', 'Undangan PL']], [['pembukaan', 'BA Pembukaan']], [['evaluasi', 'BA Evaluasi']],
      [['undangan_klarifikasi', 'Undangan Klarifikasi']], [['bakn', 'BA Klarifikasi & Negosiasi']],
      [['penetapan', 'BA Penetapan'], ['bahpl', 'BAHPL'], ['pengumuman', 'Pengumuman'], ['laporan', 'Laporan ke PPK']],
      [['spk', 'SPK'], ['sppbj', 'SPPBJ']], [['bast', 'BAST'], ['baphp', 'BAPHP']],
    ]
    const milik = new Set(nomorLangkah[L.id] || [])
    const ti = tingkat.findIndex((t) => t.some(([k]) => milik.has(k)))
    if (ti <= 0) return ''
    let batas = null
    for (const t of tingkat.slice(0, ti)) for (const [k, label] of t) {
      const d = tanggalDari(f, k)
      if (d && (!batas || d > batas.d)) batas = { d, label }
    }
    if (!batas) return ''
    const lebihAwal = tingkat[ti].find(([k]) => milik.has(k) && tanggalDari(f, k) && tanggalDari(f, k) < batas.d)
    return lebihAwal ? `Tanggal ${lebihAwal[1]} lebih awal dari ${batas.label} (${batas.d.split('-').reverse().join('/')}). Periksa urutan tanggal.` : ''
  }, [tier, L, f]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ----- simpan ----- */
  const validasi = () => {
    if (!f.rekening_id) return 'Pilih kode rekening dulu (langkah Spesifikasi Teknis, bagian "Paket & Pejabat").'
    if (!f.tanggal) return 'Tanggal paket wajib diisi.'
    const id = L.id
    if (id === 'spektek' && !f.items.some((i) => i.jenis_barang.trim())) return 'Isi minimal satu barang pada bagian "Barang".'
    if (id === 'hps' && totalHps <= 0) return 'Isi harga HPS minimal untuk satu barang.'
    if (['undangan', 'bakn'].includes(id) && (tier === '10_50' ? id === 'bakn' : id === 'undangan') && !f.penyedia.trim()) return 'Nama penyedia wajib diisi.'
    if (id === 'pembukaan' && totalPen <= 0) return 'Isi harga penawaran dari penyedia.'
    if (id === 'bakn' && totalNego <= 0) return 'Isi harga hasil negosiasi (atau tekan "samakan dengan penawaran").'
    if (['serah', 'bayar'].includes(id) && !f.uraian.trim()) return 'Isi uraian pekerjaan ("Yaitu untuk pembayaran…").'
    return ''
  }

  const bangunBody = () => {
    const x = { ...f }
    for (const k of Object.keys(NOMOR)) {
      const u = nomorDari(x, k)
      if (!u) continue
      if (NOMOR[k].pl) x.pl = { ...x.pl, [`${k}_nomor`]: nomorLengkap(u, tahun) }
      else x[`${k}_nomor`] = nomorLengkap(u, tahun)
    }
    const tahap = (TAHAP_RANK[L.tahap] ?? 0) > (TAHAP_RANK[f.tahap] ?? 0) ? L.tahap : f.tahap
    const body = {
      ...x, mode_pengadaan: tier, tahap, kotor: nilai, hps_total: totalHps, penawaran_total: totalPen,
      spektek: { ...x.spektek, paket_pengadaan: x.uraian || x.spektek.paket_pengadaan || '', tanggal: x.spektek.tanggal || x.tanggal },
      items: x.items.filter((i) => i.jenis_barang.trim()),
    }
    if (tier === '50_750') {
      Object.assign(body, { sp_tanggal: x.tanggal, sp_no_urut: '', sp_nomor: '', spk_tanggal: x.spk_tanggal || x.tanggal, pl: x.pl, pl_json: JSON.stringify(x.pl) })
    } else {
      Object.assign(body, { pl: null, pl_json: null, spk_no_urut: '', spk_nomor: '' })
    }
    return body
  }

  const simpan = async ({ lanjut = false, lihat = null } = {}) => {
    const masalah = validasi()
    if (masalah) { setErr(masalah); return false }
    setErr(''); setBusy(true)
    try {
      const body = bangunBody()
      let target = saved
      if (saved) await api('/transaksi/' + saved, { method: 'PUT', body })
      else {
        const r = await api('/transaksi', { method: 'POST', body })
        target = r.id
        setSaved(r.id)
        const berikut = langkah[Math.min(idx + 1, langkah.length - 1)].id
        nav(`/pengadaan/${r.id}?langkah=${lanjut ? berikut : L.id}`, { replace: true })
      }
      const baru = { ...f, tahap: body.tahap, pl: body.pl || f.pl }
      for (const k of Object.keys(NOMOR)) if (!NOMOR[k].pl) baru[`${k}_nomor`] = body[`${k}_nomor`]
      setF(baru); setSnap(baru); setAwal(nilai)
      muatNomor()
      api('/penyedia').then(setPenyedia)
      if (rek) api('/rekening?q=' + encodeURIComponent(rek.kode)).then((r) => setRek(r.find((y) => y.id === rek.id) || rek))
      if (lihat) setPreview({ id: target, jenis: lihat, tahap: body.tahap, modePengadaan: tier })
      else if (lanjut && idx < langkah.length - 1) { setIdx(idx + 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }
      else if (lanjut) { nav('/transaksi'); return true }
      setOk('Tersimpan'); setTimeout(() => setOk(''), 1800)
      return true
    } catch (e) {
      setErr(e.message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const hapus = async () => {
    if (!saved) return
    const yakin = await konfirmasiHapus({ title: 'Hapus paket pengadaan ini?', text: `Paket "${f.uraian || f.penyedia || 'tanpa nama'}" beserta seluruh nomor dokumennya dihapus permanen.`, confirmText: 'Ya, hapus paket' })
    if (!yakin) return
    try { await api('/transaksi/' + saved, { method: 'DELETE' }); nav('/transaksi') } catch (e) { setErr(e.message) }
  }

  const pilihRekening = (r) => {
    setRek(r)
    upd({ rekening_id: r.id, ppkom_id: r.ppkom_id || f.ppkom_id, pptk_id: r.pptk_id || f.pptk_id, pengadaan_id: r.pengadaan_id || f.pengadaan_id })
  }

  /* ----- isi tiap langkah ----- */
  const nomorTanggal = (kunci) => (
    <div className="grid gap-4 sm:grid-cols-2">
      {kunci.map((k) => (
        <div key={k} className="contents">
          <NomorField k={k} f={f} tahun={tahun} nn={nn} setNo={setNo} />
          <TanggalField label={`Tanggal ${NOMOR[k].label.replace('No. ', '')}`} value={tanggalDari(f, k)} onChange={(v) => setTgl(k, v)} />
        </div>
      ))}
    </div>
  )
  const ringkasHarga = (
    <div className="grid gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs sm:grid-cols-3">
      <div><div className="font-bold text-[#122922]/60">Total HPS</div><div className="font-mono text-sm font-extrabold">{rp(totalHps)}</div></div>
      <div><div className="font-bold text-[#122922]/60">Total penawaran</div><div className="font-mono text-sm font-extrabold">{totalPen ? rp(totalPen) : '—'}</div></div>
      <div><div className="font-bold text-[#122922]/60">Hasil negosiasi</div><div className="font-mono text-sm font-extrabold">{totalNego ? rp(totalNego) : '—'}</div></div>
    </div>
  )

  const isi = {
    spektek: () => {
      const tab = (kode, judul, sudah) => (
        <button key={kode} type="button" onClick={() => setTabKak(kode)} className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${tabKak === kode ? 'border-[#122922] bg-[#d6ee30] shadow-[2px_2px_0_#122922]' : 'border-[#122922]/20 bg-white text-[#122922]/70 hover:text-[#122922]'}`}>
          {sudah && <Check size={12} strokeWidth={3} />} {judul}
        </button>
      )
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {tab('paket', 'A. Paket & Pejabat', !!f.rekening_id && !!f.uraian.trim())}
            {tab('barang', 'B. Barang', f.items.some((i) => i.jenis_barang.trim()))}
            {tab('kak', 'C. Isi KAK', Object.values(f.spektek).some((v) => typeof v === 'string' && v.length > 12))}
          </div>
          {tabKak === 'paket' && (
            <div className="space-y-4">
              <Field label="Kode rekening (RBA)" hint={`Hanya kode rekening RAB tahun ${tahun} yang tampil.`}>
                <RekeningPicker value={rek} onPick={pilihRekening} user={user} tahun={tahun} />
              </Field>
              <Field label="Nama / uraian paket pekerjaan" hint="Dipakai di HPS, undangan, BAST, A2 (“Yaitu untuk pembayaran…”) dan nama paket pada KAK.">
                <textarea rows={2} className="input" value={f.uraian} onChange={(e) => upd({ uraian: e.target.value })} placeholder="mis. Pengadaan AC Split dan AC Floor Standing untuk Ruang Rawat Inap" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <TanggalField label="Tanggal KAK / awal paket" value={f.tanggal} onChange={(v) => setF((x) => ({ ...x, tanggal: v, spektek: { ...x.spektek, tanggal: v }, ...(tier === '10_50' && x.sp_tanggal === x.tanggal ? { sp_tanggal: v } : {}) }))} />
                <Field label="ID RUP"><input className="input font-mono" value={f.spektek.id_rup || ''} onChange={(e) => updSpek('id_rup', e.target.value)} placeholder="mis. 62736023" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <PejabatField pejabat={pejabat} peran="PENGADAAN" nilai={f.pengadaan_id} onChange={(v) => upd({ pengadaan_id: v })} label="Pejabat Pengadaan" />
                <PejabatField pejabat={pejabat} peran="PPKOM" nilai={f.ppkom_id} onChange={(v) => upd({ ppkom_id: v })} label="PPK" />
                <PejabatField pejabat={pejabat} peran="PPTK" nilai={f.pptk_id} onChange={(v) => upd({ pptk_id: v })} label="PPTK" />
              </div>
              <p className="text-[11px] text-[#122922]/55">Pejabat terisi dari data kode rekening yang dipilih; ubah bila perlu. KPA, Bendahara, dan Verifikator diatur di langkah akhir.</p>
              <div className="flex justify-end"><button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setTabKak('barang')}>Lanjut ke Barang <ArrowRight size={13} /></button></div>
            </div>
          )}
          {tabKak === 'barang' && (
            <div className="space-y-3">
              <TabelBarang items={f.items} setItems={setItems} mode="spek" />
              <div className="flex justify-end"><button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setTabKak('kak')}>Lanjut ke Isi KAK <ArrowRight size={13} /></button></div>
            </div>
          )}
          {tabKak === 'kak' && <EditorKak spektek={f.spektek} updSpek={updSpek} standar={standar} items={f.items} />}
        </div>
      )
    },
    hps: () => (
      <div className="space-y-4">
        {nomorTanggal(['hps'])}
        <TabelBarang items={f.items} setItems={setItems} mode="hps" />
        <p className="text-xs text-[#122922]/60">Terbilang: <b>{terbilang(totalHps) || '—'}</b></p>
      </div>
    ),
    undangan: () => (
      <div className="space-y-4">
        <PenyediaBox f={f} upd={upd} daftar={penyedia} />
        {nomorTanggal(['undangan'])}
        <Field label="Lingkup pekerjaan" hint="Terisi dari nama paket saat langkah ini dibuka; ubah bila perlu.">
          <LingkupField value={f.pl.lingkup_pekerjaan} dasar={f.uraian || rek?.uraian || ''} onChange={(v) => updPl({ lingkup_pekerjaan: v })} />
        </Field>
        <div>
          <div className="mb-1.5 text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">Jadwal pengadaan</div>
          <div className="grid gap-3 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3.5 sm:grid-cols-3">
            {[['pemasukan_tgl', 'Pemasukan penawaran'], ['pembukaan_tgl', 'Pembukaan penawaran'], ['evaluasi_tgl', 'Evaluasi'], ['klarifikasi_tgl', 'Klarifikasi & negosiasi'], ['penetapan_tgl', 'Penetapan pemenang'], ['spk_tgl', 'Penandatanganan SPK']].map(([k, label]) => (
              <TanggalField key={k} label={label} value={f.pl.jadwal[k]} onChange={(v) => setJadwal(k, v)} />
            ))}
            <Field label="Waktu klarifikasi"><input className="input" value={f.pl.jadwal.klarifikasi_waktu || ''} onChange={(e) => setF((x) => ({ ...x, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, klarifikasi_waktu: e.target.value } } }))} placeholder="09.00 WIB" /></Field>
          </div>
          <p className="mt-1.5 text-[11px] text-[#122922]/55">Tanggal jadwal ini menjadi tanggal awal dokumen pada langkah berikutnya; masih bisa diubah di tiap langkah.</p>
        </div>
      </div>
    ),
    pembukaan: () => (
      <div className="space-y-4">
        {nomorTanggal(['pembukaan'])}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nomor surat penawaran penyedia"><input className="input" value={f.pl.penawaran_nomor || ''} onChange={(e) => updPl({ penawaran_nomor: e.target.value })} placeholder="mis. 015/BSE-P/V/2026" /></Field>
          <TanggalField label="Tanggal surat penawaran" value={f.pl.penawaran_tanggal} onChange={(v) => updPl({ penawaran_tanggal: v })} />
        </div>
        <TabelBarang items={f.items} setItems={setItems} mode="penawaran" />
        {totalPen > totalHps && totalHps > 0 && <Peringatan>Total penawaran ({rp(totalPen)}) melebihi HPS ({rp(totalHps)}).</Peringatan>}
      </div>
    ),
    evaluasi: () => (
      <div className="space-y-4">
        {nomorTanggal(['evaluasi'])}
        {ringkasHarga}
      </div>
    ),
    undklar: () => (
      <div className="space-y-4">
        {nomorTanggal(['undangan_klarifikasi'])}
        <div className="grid gap-4 sm:grid-cols-2">
          <TanggalField label="Tanggal pelaksanaan klarifikasi & negosiasi" value={f.bakn_tanggal} onChange={(v) => setF((x) => ({ ...x, bakn_tanggal: v, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, klarifikasi_tgl: v } } }))} />
          <Field label="Waktu"><input className="input" value={f.pl.jadwal.klarifikasi_waktu || ''} onChange={(e) => setF((x) => ({ ...x, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, klarifikasi_waktu: e.target.value } } }))} placeholder="09.00 WIB" /></Field>
        </div>
      </div>
    ),
    bakn: () => (
      <div className="space-y-4">
        {tier === '10_50' && <PenyediaBox f={f} upd={upd} daftar={penyedia} />}
        {nomorTanggal(['bakn'])}
        <Field label="Hasil evaluasi teknis">
          <SearchableSelect value={f.bakn_hasil_teknis} options={['Sesuai', 'Sesuai - Ada Perubahan'].map((v) => ({ value: v, label: v }))} onChange={(v) => upd({ bakn_hasil_teknis: v })} />
        </Field>
        <TabelBarang
          items={f.items} setItems={setItems} mode={tier === '10_50' ? 'nego10' : 'nego'}
          aksi={<button type="button" className="btn-ghost !py-1.5 text-xs" onClick={() => setItems(f.items.map((it) => ({ ...it, harga_satuan: it.harga_penawaran || it.harga_hps })))}>Samakan harga negosiasi dengan {tier === '10_50' ? 'penawaran / HPS' : 'penawaran'}</button>}
        />
        {totalNego > totalHps && totalHps > 0 && <Peringatan>Hasil negosiasi ({rp(totalNego)}) melebihi HPS ({rp(totalHps)}).</Peringatan>}
        {ringkasHarga}
      </div>
    ),
    penetapan: () => (
      <div className="space-y-4">
        <p className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-3.5 py-2.5 text-xs text-[#122922]/75">Empat dokumen ini hanya membutuhkan nomor dan tanggal, jadi dikerjakan sekaligus dalam satu langkah.</p>
        {['penetapan', 'bahpl', 'pengumuman', 'laporan'].map((k) => (
          <div key={k} className="rounded-xl border border-[#122922]/15 p-3.5">
            <div className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">{k === 'penetapan' ? 'BA Penetapan Pemenang' : k === 'bahpl' ? 'BA Hasil Pengadaan Langsung' : k === 'pengumuman' ? 'Pengumuman Hasil PL' : 'Laporan Hasil PL ke PPK'}</div>
            {nomorTanggal([k])}
          </div>
        ))}
      </div>
    ),
    spk: () => (
      <div className="space-y-4">
        {nomorTanggal(['spk'])}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Jenis kontrak"><SearchableSelect value={f.pl.spk_jenis_kontrak} options={['Kontrak Harga Satuan', 'Kontrak Lumsum'].map((v) => ({ value: v, label: v }))} onChange={(v) => updPl({ spk_jenis_kontrak: v })} /></Field>
          <Field label="Waktu pelaksanaan (hari kalender)"><input type="number" min="1" className="input font-mono" value={f.pl.spk_waktu_hari} onChange={(e) => updPl({ spk_waktu_hari: e.target.value })} /></Field>
        </div>
        {ringkasHarga}
      </div>
    ),
    sppbj: () => nomorTanggal(['sppbj']),
    sp: () => (
      <div className="space-y-4">
        {nomorTanggal(['sp'])}
        <TanggalField label="Batas waktu pengiriman barang" value={f.sp_tgl_kirim} onChange={(v) => upd({ sp_tgl_kirim: v })} />
      </div>
    ),
    serah: () => (
      <div className="space-y-4">
        <Field label="Uraian pekerjaan (“Yaitu untuk pembayaran…”)">
          <textarea rows={2} className="input" value={f.uraian} onChange={(e) => upd({ uraian: e.target.value })} />
        </Field>
        {nomorTanggal(['bast', 'baphp'])}
        <div className="grid gap-4 sm:grid-cols-3">
          <PejabatField pejabat={pejabat} peran="PENGURUS_BARANG" nilai={f.pengurus_barang_id} onChange={(v) => upd({ pengurus_barang_id: v })} />
          <Field label="Jabatan PPK pada BAST"><input className="input" value={f.ppk_jabatan} onChange={(e) => upd({ ppk_jabatan: e.target.value })} placeholder="mis. Kepala Seksi Informasi dan Pemasaran" /></Field>
          <Field label="Alamat PPK"><input className="input" value={f.ppk_alamat} onChange={(e) => upd({ ppk_alamat: e.target.value })} /></Field>
        </div>
      </div>
    ),
    bayar: () => (
      <div className="space-y-4">
        <Field label="Uraian pekerjaan (“Yaitu untuk pembayaran…”)">
          <textarea rows={2} className="input" value={f.uraian} onChange={(e) => upd({ uraian: e.target.value })} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          {[['ppn', 'PPN', 'ppn_aktif', 'ppn_tarif'], ['pph', 'PPh 22', 'pph_aktif', 'pph_tarif']].map(([k, label, aktif, tarif]) => (
            <label key={k} className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${f[aktif] ? 'border-[#122922] bg-[#d6ee30]/40' : 'border-[#122922]/15'}`}>
              <span className="flex items-center gap-2.5 text-sm font-extrabold"><input type="checkbox" className="h-4 w-4 accent-[#122922]" checked={!!f[aktif]} onChange={(e) => upd({ [aktif]: e.target.checked })} /> {label}</span>
              <span className="flex items-center gap-1 text-xs font-bold">tarif <input type="number" step="0.1" className="w-16 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f[tarif]} onChange={(e) => upd({ [tarif]: e.target.value })} /> %</span>
            </label>
          ))}
        </div>
        <div className="grid gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3.5 text-sm sm:grid-cols-4">
          {[['Nilai kotor', pajak.kotor], ['PPN', pajak.ppn], ['PPh 22', pajak.pph], ['Dibayar ke penyedia', pajak.bersih]].map(([l, v]) => (
            <div key={l}><div className="text-[11px] font-bold text-[#122922]/60">{l}</div><div className="font-mono font-extrabold">{rp(v)}</div></div>
          ))}
        </div>
        <p className="text-xs text-[#122922]/60">Terbilang: <b>{terbilang(nilai)}</b></p>
        <div className="grid gap-4 sm:grid-cols-3">
          <PejabatField pejabat={pejabat} peran="KPA" nilai={f.kpa_id} onChange={(v) => upd({ kpa_id: v })} />
          <PejabatField pejabat={pejabat} peran="BENDAHARA" nilai={f.bendahara_id} onChange={(v) => upd({ bendahara_id: v })} />
          <PejabatField pejabat={pejabat} peran="VERIFIKATOR" nilai={f.verifikator_id} onChange={(v) => upd({ verifikator_id: v })} />
        </div>
      </div>
    ),
  }

  if (!siap || !L) return <div className="p-10 text-center text-sm font-semibold text-[#122922]/50">Memuat paket pengadaan…</div>
  const jumlahSelesai = terisi.filter(Boolean).length
  const fase = [...new Set(langkah.map((l) => l.fase))]
  const terakhir = idx === langkah.length - 1

  return (
    <>
      <PageHeader
        kicker={tier === '50_750' ? 'Pengadaan Langsung · 50 – 750 Jt' : 'Pengadaan · 10 – 50 Jt'}
        title={f.uraian?.trim() || 'Paket Pengadaan Baru'}
        desc={`${jumlahSelesai} dari ${langkah.length} langkah tersimpan`}
      >
        <Link to="/transaksi" className="btn-ghost"><ArrowLeft size={15} /> Daftar paket</Link>
        {saved && <button type="button" onClick={hapus} className="btn-ghost !text-rose-600"><Trash2 size={15} /> Hapus</button>}
      </PageHeader>

      {/* peta langkah (layar kecil) */}
      <div className="card mb-4 p-3 lg:hidden">
        <div className="mb-2 flex items-center justify-between text-xs font-bold"><span>Langkah {idx + 1} dari {langkah.length}</span><span>{L.fase}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-[#f7f5ef]"><div className="h-full bg-[#3f8f77]" style={{ width: `${((idx + 1) / langkah.length) * 100}%` }} /></div>
        <select className="input mt-2.5 !py-1.5 text-sm" value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
          {langkah.map((l, i) => <option key={l.id} value={i} disabled={i > terjauh}>{i + 1}. {l.judul}{terisi[i] ? ' ✓' : ''}</option>)}
        </select>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
        <aside className="hidden space-y-4 lg:sticky lg:top-4 lg:block">
          <nav className="card p-3">
            {fase.map((nama) => (
              <div key={nama} className="mb-2.5 last:mb-0">
                <div className="mb-1 px-2 font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">{nama}</div>
                {langkah.map((l, i) => l.fase !== nama ? null : (
                  <button
                    key={l.id} type="button" disabled={i > terjauh} onClick={() => setIdx(i)}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${i === idx ? 'bg-[#122922] text-white' : 'text-[#122922] hover:bg-[#f7f5ef]'}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] font-extrabold ${terisi[i] ? 'border-[#3f8f77] bg-[#b5e8a5] text-[#122922]' : i === idx ? 'border-white/50' : 'border-[#122922]/25'}`}>
                      {terisi[i] ? <Check size={12} strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="leading-tight">{l.judul}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="card space-y-2 p-3.5 text-xs">
            <div className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Ringkasan paket</div>
            {rek ? <div><div className="font-mono font-bold">{rek.kode}</div><div className="text-[#122922]/70">{rek.uraian}</div></div> : <div className="text-[#122922]/50">Kode rekening belum dipilih</div>}
            <div className="flex justify-between"><span className="text-[#122922]/60">Nilai</span><span className="font-mono font-extrabold">{rp(nilai)}</span></div>
            {nilai > 0 && <div className="flex items-center justify-between"><span className="text-[#122922]/60">Kategori</span><KategoriBadge kode={kategoriOf(nilai).kode} /></div>}
            {sisaPagu != null && <div className="flex justify-between"><span className="text-[#122922]/60">Sisa pagu</span><span className={`font-mono font-extrabold ${sisaPagu < 0 ? 'text-rose-600' : ''}`}>{rp(sisaPagu)}</span></div>}
            {f.penyedia && <div><span className="text-[#122922]/60">Penyedia</span><div className="font-bold">{f.penyedia}</div></div>}
          </div>
        </aside>

        <section className="card min-w-0 p-4 sm:p-5">
          <div className="mb-5 border-b border-[#122922]/10 pb-4">
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#3f8f77]">Langkah {idx + 1} dari {langkah.length} · {L.fase}</div>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#122922]">{L.judul}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {L.dok.map((j) => (
                <span key={j} className="rounded-full border border-[#122922]/20 bg-[#d6ee30]/40 px-2.5 py-0.5 text-[11px] font-bold">{DOK[j]}</span>
              ))}
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); simpan({ lanjut: true }) }} onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault() }}>
            {isi[L.id]()}

            {peringatanTanggal && <div className="mt-4"><Peringatan>{peringatanTanggal}</Peringatan></div>}
            {sisaPagu != null && sisaPagu < 0 && ['hps', 'bakn', 'bayar'].includes(L.id) && <div className="mt-4"><Peringatan>Nilai melebihi sisa pagu rekening sebesar {rp(-sisaPagu)}.</Peringatan></div>}
            {err && <p className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700">{err}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-[#122922]/10 pt-4">
              <button type="button" className="btn-ghost" disabled={idx === 0 || busy} onClick={() => { setErr(''); setIdx(idx - 1); window.scrollTo({ top: 0 }) }}><ArrowLeft size={15} /> Sebelumnya</button>
              <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
                {ok && <span className="inline-flex items-center gap-1 text-sm font-bold text-[#1d5a42]"><Check size={14} strokeWidth={3} /> {ok}</span>}
                {L.dok.map((j) => (
                  <span key={j} className="inline-flex overflow-hidden rounded-xl border border-[#122922]/20 text-[11px] font-bold">
                    <button type="button" disabled={busy} onClick={() => simpan({ lihat: j })} className="inline-flex items-center gap-1 bg-white px-2.5 py-1.5 hover:bg-[#d6ee30]/50" title={`Simpan lalu pratinjau ${DOK[j]}`}><Eye size={12} /> {L.dok.length > 1 ? DOK[j] : 'Pratinjau'}</button>
                    {saved && terisi[idx] && <a href={`/api/transaksi/${saved}/dokumen/${j}.pdf`} className="border-l border-[#122922]/20 bg-white px-2 py-1.5 hover:bg-[#d6ee30]/50" title="Unduh PDF"><Download size={12} /></a>}
                  </span>
                ))}
                <button type="button" className="btn-ghost" disabled={busy} onClick={() => simpan()}><Save size={15} /> Simpan</button>
                <button className="btn-primary" disabled={busy}>{busy ? 'Menyimpan…' : terakhir ? 'Simpan & Selesai' : 'Simpan & Lanjut'} {!terakhir && <ArrowRight size={15} />}</button>
              </div>
            </div>
          </form>
        </section>
      </div>

      <PreviewModal preview={preview} onClose={() => setPreview(null)} onSwitch={setPreview} />
    </>
  )
}

const RANK = (s) => TAHAP_RANK[s.tahap] ?? 0

function Peringatan({ children }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#d4a017]/50 bg-[#fff6d6] px-3.5 py-2.5 text-xs font-semibold text-[#6b4e00]">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" /> <span>{children}</span>
    </div>
  )
}

// isi lingkup pekerjaan dari nama paket satu kali bila masih kosong
function LingkupField({ value, dasar, onChange }) {
  const sudah = useRef(false)
  useEffect(() => {
    if (!sudah.current && !value && dasar) { sudah.current = true; onChange(dasar) }
  }, [dasar]) // eslint-disable-line react-hooks/exhaustive-deps
  return <textarea rows={2} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)} />
}
