import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, ArrowRight, Award, CalendarRange, Check, ChevronDown, Eye, FileCheck, FileText, Handshake, PackageCheck, Plus, RotateCcw, Save, Trash2,
} from 'lucide-react'
import { api, hitungPajak, kategoriOf, num, persen, rp, terbilang, PERAN } from '../lib'
import { Field, KategoriBadge, PageHeader, Progress, SearchableSelect, konfirmasiHapus } from '../ui'
import { CetakMenu, PreviewModal, filterDokByTahap } from './Transaksi'
import { RekeningPicker, defaultPl, itemBaru, kosong } from './TransaksiForm'
import { useAuth } from '../App'

const hariIni = () => new Date().toISOString().slice(0, 10)
// jalur dokumen mengikuti nilai paket (sama dengan aturan di server): <= Rp50 juta = 10–50 jt
const modeAlur = (mode, nilai) => (nilai > 0 ? (nilai > 50000000 ? '50_750' : '10_50') : mode)
const NAMA_ALUR = { '10_50': '10–50 jt', '50_750': '50–750 jt' }
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
  { id: 'spektek', fase: 'Spesifikasi Teknis / KAK', judul: 'Spesifikasi Teknis / KAK Pengadaan Barang', dok: ['spektek'], tahap: 'spektek' },
  { id: 'hps', fase: 'Penetapan HPS', judul: 'Berita Acara Penetapan HPS & Lampiran Rincian HPS', dok: ['hps'], tahap: 'hps' },
  { id: 'bakn', fase: 'Klarifikasi & Negosiasi', judul: 'Berita Acara Klarifikasi Teknis dan Negosiasi Harga', dok: ['bakn'], tahap: 'negosiasi' },
  { id: 'sp', fase: 'Surat Pesanan', judul: 'Surat Pesanan (SP)', dok: ['sp'], tahap: 'pesanan' },
  { id: 'terima', fase: 'BAST, BAPHP, A2 & Verifikasi', judul: 'BAST, BAPHP, A2 dan Verifikasi', dok: ['bast', 'baphp', 'a2', 'verifikasi'], tahap: 'selesai' },
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
    case 'bakn': return f.sp_no_urut ? `${basisNomor(f.sp_no_urut)}.a` : nn.nextBakn
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
  harga_hps: 'Harga Satuan HPS (Rp)',
  harga_penawaran: 'Harga Penawaran (Rp)',
  harga_satuan: 'Harga Negosiasi (Rp)',
}
const KOLOM_PENDEK = { harga_hps: 'HPS', harga_penawaran: 'Penawaran', harga_satuan: 'Negosiasi' }
// barang: nama/satuan/jumlah bisa diedit; ro: harga sebagai keterangan; edit: kolom harga yang diisi
const MODE_TABEL = {
  spek: { barang: true, ro: [], edit: [], hitung: null },
  semua: { barang: true, ro: [], edit: ['harga_satuan'], hitung: 'harga_satuan' },
  hps: { ro: [], edit: ['harga_hps'], hitung: 'harga_hps' },
  penawaran: { ro: ['harga_hps'], edit: ['harga_penawaran'], hitung: 'harga_penawaran' },
  nego: { ro: ['harga_hps', 'harga_penawaran'], edit: ['harga_satuan'], hitung: 'harga_satuan' },
  nego10: { ro: ['harga_hps'], edit: ['harga_penawaran', 'harga_satuan'], hitung: 'harga_satuan' },
}
const jumlahBaris = (it, key) => Math.round(angka(it.kuantitas) * angka(it[key]))
const digit = (v) => String(v ?? '').replace(/\D/g, '')

// nominal rupiah dengan pemisah titik saat diketik; nilai tersimpan hanya angka
function InputRupiah({ value, onChange, className = '' }) {
  const d = digit(value)
  return (
    <input
      inputMode="numeric" placeholder="0" className={`input !py-1.5 text-right font-mono ${className}`}
      value={d ? num(d) : ''} onChange={(e) => onChange(digit(e.target.value))}
    />
  )
}

function TabelBarang({ items, setItems, mode, aksi }) {
  const m = MODE_TABEL[mode]
  const ubah = (i, k, v) => setItems(items.map((it, j) => (j === i ? { ...it, [k]: v } : it)))
  const total = m.hitung ? items.reduce((s, it) => s + jumlahBaris(it, m.hitung), 0) : 0
  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-[#122922]/15">
        <table className="w-full min-w-[700px]">
          <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/50">
            <tr>
              <th className="th w-10 text-center">No</th>
              <th className="th min-w-[13rem]">Uraian Barang / Spesifikasi</th>
              <th className="th w-24 text-center">Satuan</th>
              <th className="th w-20 text-center">Jumlah</th>
              {m.edit.map((k) => <th key={k} className="th w-36 text-right">{KOLOM_HARGA[k]}</th>)}
              {m.hitung && <th className="th w-36 text-right">Jumlah (Rp)</th>}
              {m.barang && <th className="th w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#122922]/10">
            {items.map((it, i) => (
              <tr key={i} className="align-top hover:bg-[#f7f5ef]/40">
                <td className="td text-center font-mono text-xs font-bold">{i + 1}.</td>
                <td className="p-2">
                  {m.barang
                    ? <input className="input !py-1.5" value={it.jenis_barang} onChange={(e) => ubah(i, 'jenis_barang', e.target.value)} placeholder="Nama / spesifikasi barang…" />
                    : <div className="py-1.5 text-sm font-semibold text-[#122922]">{it.jenis_barang}</div>}
                  {m.ro.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-[#122922]/55">
                      {m.ro.map((k) => <span key={k}>{KOLOM_PENDEK[k]}: <b className="font-mono">{angka(it[k]) ? rp(it[k]) : '—'}</b></span>)}
                    </div>
                  )}
                </td>
                <td className="p-2">
                  {m.barang
                    ? <input className="input !py-1.5 text-center" value={it.satuan} onChange={(e) => ubah(i, 'satuan', e.target.value)} placeholder="Unit" />
                    : <div className="py-1.5 text-center text-sm">{it.satuan}</div>}
                </td>
                <td className="p-2">
                  {m.barang
                    ? <input inputMode="numeric" className="input !py-1.5 text-center font-mono" value={it.kuantitas} onChange={(e) => ubah(i, 'kuantitas', digit(e.target.value))} placeholder="1" />
                    : <div className="py-1.5 text-center font-mono text-sm">{String(Number(it.kuantitas) || 0)}</div>}
                </td>
                {m.edit.map((k) => <td key={k} className="p-2"><InputRupiah value={it[k]} onChange={(v) => ubah(i, k, v)} /></td>)}
                {m.hitung && <td className="td text-right font-mono font-bold tabular-nums text-[#122922]">{num(jumlahBaris(it, m.hitung))}</td>}
                {m.barang && (
                  <td className="p-2 text-center">
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="rounded-full p-1.5 text-[#122922]/40 hover:bg-rose-50 hover:text-rose-600" title="Hapus baris"><Trash2 size={14} /></button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          {m.hitung && (
            <tfoot>
              <tr className="bg-[#d6ee30]/40 font-extrabold">
                <td colSpan={4 + m.edit.length} className="px-3 py-2 text-right text-xs uppercase tracking-wider">Total {KOLOM_PENDEK[m.hitung]}</td>
                <td className="px-3 py-2 text-right font-mono">{rp(total)}</td>
                {m.barang && <td />}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {m.barang && (
          <button type="button" className="btn-lime !py-1.5 !px-3 text-xs" onClick={() => setItems([...items, itemBaru()])}><Plus size={14} strokeWidth={2.5} /> Tambah Barang</button>
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
    const t = setTimeout(() => api('/spektek/standar?paket=' + encodeURIComponent(rek?.uraian || f.uraian || '')).then(setStandar).catch(() => {}), 350)
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
      terima: !!s.bast_no_urut && !!s.baphp_no_urut && RANK(s) >= 7 && !!s.uraian?.trim(),
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
    bakn: ['bakn'], penetapan: ['penetapan', 'bahpl', 'pengumuman', 'laporan'], spk: ['spk'], sppbj: ['sppbj'], sp: ['sp'], serah: ['bast', 'baphp'], terima: ['bast', 'baphp'], bayar: [],
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
  const pejabatRek = rek ? [['PPK', f.ppkom_id || rek.ppkom_id], ['PPTK', f.pptk_id || rek.pptk_id], ['Pejabat Pengadaan', f.pengadaan_id || rek.pengadaan_id]] : []
  const pejabatKurang = pejabatRek.filter(([, v]) => !v).map(([n]) => n)

  const validasi = () => {
    if (!f.rekening_id) return 'Pilih kode rekening dulu (kartu "Kode rekening & paket pekerjaan" di bagian atas).'
    if (!f.tanggal) return 'Tanggal paket wajib diisi.'
    if (pejabatKurang.length) return `Kode rekening ini belum memiliki ${pejabatKurang.join(', ')}. Lengkapi dulu di menu Kode Rekening.`
    const id = L.id
    const rank = Math.max(TAHAP_RANK[L.tahap] ?? 0, TAHAP_RANK[f.tahap] ?? 0)
    if (id === 'spektek' && !f.items.some((i) => i.jenis_barang.trim())) return 'Isi minimal satu barang pada kartu "Barang yang diadakan".'
    if (rank >= 1 && nilai <= 0) return 'Isi harga barang dulu (HPS, penawaran, atau harga kontrak) agar paket bisa disimpan.'
    if (rank >= 2 && !f.penyedia.trim()) return 'Nama penyedia wajib diisi.'
    if (id === 'hps' && totalHps <= 0) return 'Isi harga HPS minimal untuk satu barang.'
    if (id === 'undangan' && !(f.pl.lingkup_pekerjaan || '').trim()) return 'Isi Lingkup pekerjaan (dipakai sebagai uraian paket pada dokumen).'
    if (id === 'pembukaan' && totalPen <= 0) return 'Isi harga penawaran dari penyedia.'
    if (id === 'bakn' && totalNego <= 0) return 'Isi harga hasil negosiasi (atau tekan "samakan dengan penawaran").'
    if (['serah', 'bayar', 'terima'].includes(id) && !f.uraian.trim()) return 'Isi uraian pekerjaan ("Yaitu untuk pembayaran…").'
    return ''
  }

  const bangunBody = () => {
    const x = { ...f }
    // nomor otomatis dari langkah yang hanya dibuka (belum dikerjakan/disimpan) tidak ikut tersimpan
    const langkahIni = new Set(nomorLangkah[L.id] || [])
    for (const k of Object.keys(NOMOR)) {
      let u = nomorDari(x, k)
      if (u && !langkahIni.has(k) && !nomorDari(snap || {}, k)) {
        u = ''
        if (NOMOR[k].pl) x.pl = { ...x.pl, [`${k}_no_urut`]: '', [`${k}_nomor`]: '' }
        else { x[`${k}_no_urut`] = ''; x[`${k}_nomor`] = '' }
      }
      if (!u) continue
      if (NOMOR[k].pl) x.pl = { ...x.pl, [`${k}_nomor`]: nomorLengkap(u, tahun) }
      else x[`${k}_nomor`] = nomorLengkap(u, tahun)
    }
    const tahap = (TAHAP_RANK[L.tahap] ?? 0) > (TAHAP_RANK[f.tahap] ?? 0) ? L.tahap : f.tahap
    const body = {
      ...x, mode_pengadaan: tier, tahap, kotor: nilai, hps_total: totalHps, penawaran_total: totalPen,
      spektek: { ...x.spektek, paket_pengadaan: rek?.uraian || '', tanggal: x.spektek.tanggal || x.tanggal },
      items: x.items.filter((i) => i.jenis_barang.trim()),
    }
    if (tier === '50_750') {
      Object.assign(body, { sp_tanggal: x.tanggal, sp_no_urut: '', sp_nomor: '', spk_tanggal: x.spk_tanggal || x.tanggal, pl: x.pl, pl_json: JSON.stringify(x.pl) })
    } else {
      Object.assign(body, { pl: x.pl, pl_json: JSON.stringify(x.pl), spk_no_urut: '', spk_nomor: '' })
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
      const alurBaru = modeAlur(tier, nilai)
      if (alurBaru !== tier) {
        window.alert(`Nilai paket ${rp(nilai)} termasuk jalur ${NAMA_ALUR[alurBaru]}. Paket dialihkan ke jalur ${NAMA_ALUR[alurBaru]}, dan dokumennya mengikuti jalur tersebut.`)
        window.location.assign(`/pengadaan/${target}`)
        return true
      }
      const baru = { ...f, tahap: body.tahap, pl: body.pl || f.pl }
      for (const k of Object.keys(NOMOR)) {
        if (NOMOR[k].pl) continue
        baru[`${k}_no_urut`] = body[`${k}_no_urut`]
        baru[`${k}_nomor`] = body[`${k}_nomor`]
      }
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

  // harga negosiasi = harga penawaran; bila penawaran kosong, memakai HPS
  const samakanHarga = () => {
    if (!f.items.some((it) => angka(it.harga_penawaran) || angka(it.harga_hps))) {
      setOk(''); setErr('Belum ada harga penawaran atau HPS untuk disalin. Isi kolom Penawaran di tabel ini, atau isi HPS di langkah Penetapan HPS.')
      return
    }
    setErr('')
    setItems(f.items.map((it) => ({ ...it, harga_satuan: String(angka(it.harga_penawaran) || angka(it.harga_hps) || '') })))
    setOk('Harga negosiasi disamakan dengan penawaran / HPS'); setTimeout(() => setOk(''), 2500)
  }

  const pilihRekening = (r) => {
    setRek(r)
    upd({ rekening_id: r.id, ppkom_id: r.ppkom_id || f.ppkom_id, pptk_id: r.pptk_id || f.pptk_id, pengadaan_id: r.pengadaan_id || f.pengadaan_id })
  }

  // kartu bantu (rekening, penyedia, barang) ditentukan saat langkah dibuka agar tidak hilang ketika sedang diketik
  const [bantu, setBantu] = useState({ penyedia: false, barang: false })
  const [rbaBuka, setRbaBuka] = useState(false)
  useEffect(() => {
    if (!siap || idx < 0) return
    const punyaBoxPenyedia = tier === '50_750' ? 'undangan' : 'bakn'
    setBantu({
      penyedia: (TAHAP_RANK[L.tahap] ?? 0) >= 2 && L.id !== punyaBoxPenyedia && !f.penyedia.trim(),
      barang: ['sp', 'spk'].includes(L.id) || (!['spektek', 'hps', 'pembukaan', 'bakn'].includes(L.id) && nilai <= 0),
    })
    setRbaBuka(false)
  }, [idx, siap]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ----- isi tiap langkah ----- */
  const noLengkap = (k) => (nomorDari(f, k) ? nomorLengkap(nomorDari(f, k), tahun) : '')
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
  const jadwalNama = { pemasukan_tgl: 'Pemasukan penawaran (mulai)', pemasukan_sampai_tgl: 'Pemasukan penawaran s.d. (opsional)', pembukaan_tgl: 'Pembukaan penawaran', evaluasi_tgl: 'Evaluasi', klarifikasi_tgl: 'Klarifikasi & negosiasi', penetapan_tgl: 'Penetapan pemenang', spk_tgl: 'Penandatanganan SPK' }
  const waktuKlarifikasi = (
    <Field label="Waktu klarifikasi">
      <input className="input" value={f.pl.jadwal.klarifikasi_waktu || ''} onChange={(e) => setF((x) => ({ ...x, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, klarifikasi_waktu: e.target.value } } }))} placeholder="09.00 WIB" />
    </Field>
  )

  const pajakJsx = (
    <>
      <Field label="Jumlah Kotor / Dibulatkan (Rp)" className="max-w-sm">
        <input readOnly className="input bg-[#f7f5ef] text-right font-mono text-base font-extrabold tabular-nums" value={nilai ? num(nilai) : ''} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {[['PPN', 'ppn_aktif', 'ppn_tarif'], ['PPh 22', 'pph_aktif', 'pph_tarif']].map(([label, aktif, tarif]) => (
          <label key={aktif} className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${f[aktif] ? 'border-[#122922] bg-[#d6ee30]/40' : 'border-[#122922]/15'}`}>
            <span className="flex items-center gap-2.5 text-sm font-extrabold"><input type="checkbox" className="h-4 w-4 accent-[#122922]" checked={!!f[aktif]} onChange={(e) => upd({ [aktif]: e.target.checked })} /> {label}</span>
            <span className="flex items-center gap-1 text-xs font-bold">tarif <input type="number" step="0.1" className="w-16 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f[tarif]} onChange={(e) => upd({ [tarif]: e.target.value })} /> %</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-[#122922]/60">Terbilang: <b>{terbilang(nilai)}</b></p>
    </>
  )
  const isi = {
    spektek: () => (
      <>
        <Kartu badge="KAK" judul="Data KAK">
          <div className="grid gap-4 sm:grid-cols-2">
            <TanggalField label="Tanggal KAK / awal paket" value={f.tanggal} onChange={(v) => setF((x) => ({ ...x, tanggal: v, spektek: { ...x.spektek, tanggal: v }, ...(tier === '10_50' && x.sp_tanggal === x.tanggal ? { sp_tanggal: v } : {}) }))} />
            <Field label="ID RUP"><input className="input font-mono" value={f.spektek.id_rup || ''} onChange={(e) => updSpek('id_rup', e.target.value)} placeholder="mis. 62736023" /></Field>
          </div>
          {rek && (
            <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3.5 text-xs">
              <div className="mb-1.5 font-extrabold uppercase tracking-wider text-[#122922]/70">Pejabat dari kode rekening ini</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {pejabatRek.map(([nama, id]) => (
                  <div key={nama}><div className="text-[#122922]/55">{nama}</div><div className="font-bold">{pejabat.find((p) => p.id === id)?.nama || '— belum diatur —'}</div></div>
                ))}
              </div>
            </div>
          )}
          {pejabatKurang.length > 0 && (
            <Peringatan>Kode rekening ini belum memiliki {pejabatKurang.join(', ')}. Lengkapi dulu di <Link to="/rekening" className="underline">menu Kode Rekening</Link>, lalu pilih ulang kode rekeningnya.</Peringatan>
          )}
        </Kartu>
        <Kartu badge="BRG" judul="Barang yang diadakan">
          <TabelBarang items={f.items} setItems={setItems} mode="spek" />
        </Kartu>
        <Kartu badge="KAK" judul="Isi Spesifikasi Teknis / KAK">
          <EditorKak spektek={f.spektek} updSpek={updSpek} standar={standar} items={f.items} />
        </Kartu>
      </>
    ),
    hps: () => (
      <>
        <Kartu badge="HPS" judul={tier === '10_50' ? 'Berita Acara Penetapan HPS' : 'BA Penetapan HPS'} nomor={noLengkap('hps')}>{nomorTanggal(['hps'])}</Kartu>
        <Kartu badge="RINCI" judul={tier === '10_50' ? 'Lampiran Rincian HPS' : 'Rincian harga HPS'}>
          <TabelBarang items={f.items} setItems={setItems} mode="hps" />
          <p className="text-xs text-[#122922]/60">Terbilang: <b>{terbilang(totalHps) || '—'}</b></p>
        </Kartu>
      </>
    ),
    undangan: () => (
      <>
        <Kartu badge="PNY" judul="Penyedia yang diundang"><PenyediaBox f={f} upd={upd} daftar={penyedia} /></Kartu>
        <Kartu badge="UND" judul="Undangan Pengadaan Langsung" nomor={noLengkap('undangan')}>
          {nomorTanggal(['undangan'])}
          <Field label="Lingkup pekerjaan (nama / uraian paket)" hint="Dipakai pada Undangan sampai SPK sebagai uraian paket, tertulis di samping nama kode rekening. Contoh: Pemeliharaan Videotroon.">
            <textarea rows={2} className="input" value={f.pl.lingkup_pekerjaan || ''} onChange={(e) => updPl({ lingkup_pekerjaan: e.target.value })} placeholder="mis. Pemeliharaan Videotroon" />
          </Field>
        </Kartu>
        <Kartu badge="JDW" judul="Jadwal pengadaan">
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(jadwalNama).map(([k, label]) => <TanggalField key={k} label={label} value={f.pl.jadwal[k]} onChange={(v) => setJadwal(k, v)} />)}
            {waktuKlarifikasi}
          </div>
          <p className="text-[11px] text-[#122922]/55">Tanggal jadwal ini menjadi tanggal awal dokumen pada langkah berikutnya; masih bisa diubah di tiap langkah.</p>
        </Kartu>
      </>
    ),
    pembukaan: () => (
      <>
        <Kartu badge="BA" judul="BA Pembukaan Penawaran" nomor={noLengkap('pembukaan')}>
          {nomorTanggal(['pembukaan'])}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nomor surat penawaran penyedia"><input className="input" value={f.pl.penawaran_nomor || ''} onChange={(e) => updPl({ penawaran_nomor: e.target.value })} placeholder="mis. 015/BSE-P/V/2026" /></Field>
            <TanggalField label="Tanggal surat penawaran" value={f.pl.penawaran_tanggal} onChange={(v) => updPl({ penawaran_tanggal: v })} />
          </div>
        </Kartu>
        <Kartu badge="HRG" judul="Harga penawaran penyedia">
          <TabelBarang items={f.items} setItems={setItems} mode="penawaran" />
          {totalPen > totalHps && totalHps > 0 && <Peringatan>Total penawaran ({rp(totalPen)}) melebihi HPS ({rp(totalHps)}).</Peringatan>}
        </Kartu>
      </>
    ),
    evaluasi: () => (
      <Kartu badge="BA" judul="BA Evaluasi Penawaran" nomor={noLengkap('evaluasi')}>
        {nomorTanggal(['evaluasi'])}
        {ringkasHarga}
      </Kartu>
    ),
    undklar: () => (
      <Kartu badge="UND" judul="Undangan Klarifikasi & Negosiasi" nomor={noLengkap('undangan_klarifikasi')}>
        {nomorTanggal(['undangan_klarifikasi'])}
        <div className="grid gap-4 sm:grid-cols-2">
          <TanggalField label="Tanggal pelaksanaan klarifikasi & negosiasi" value={f.bakn_tanggal} onChange={(v) => setF((x) => ({ ...x, bakn_tanggal: v, pl: { ...x.pl, jadwal: { ...x.pl.jadwal, klarifikasi_tgl: v } } }))} />
          {waktuKlarifikasi}
        </div>
      </Kartu>
    ),
    bakn: () => (
      <>
        {tier === '10_50' && <Kartu badge="PNY" judul="Penyedia"><PenyediaBox f={f} upd={upd} daftar={penyedia} /></Kartu>}
        <Kartu badge="BA" judul={tier === '10_50' ? 'Berita Acara Klarifikasi Teknis dan Negosiasi Harga' : 'BA Klarifikasi & Negosiasi'} nomor={noLengkap('bakn')}>
          {nomorTanggal(['bakn'])}
          <Field label="Hasil evaluasi teknis">
            <SearchableSelect value={f.bakn_hasil_teknis} options={['Sesuai', 'Sesuai - Ada Perubahan'].map((v) => ({ value: v, label: v }))} onChange={(v) => upd({ bakn_hasil_teknis: v })} />
          </Field>
        </Kartu>
        <Kartu badge="HRG" judul="Harga hasil negosiasi">
          <TabelBarang
            items={f.items} setItems={setItems} mode={tier === '10_50' ? 'nego10' : 'nego'}
            aksi={<button type="button" className="btn-ghost !py-1.5 text-xs" onClick={samakanHarga}>Samakan harga negosiasi dengan {tier === '10_50' ? 'penawaran / HPS' : 'penawaran'}</button>}
          />
          {totalNego > totalHps && totalHps > 0 && <Peringatan>Hasil negosiasi ({rp(totalNego)}) melebihi HPS ({rp(totalHps)}).</Peringatan>}
          {ringkasHarga}
        </Kartu>
      </>
    ),
    penetapan: () => (
      <>
        <p className="rounded-xl border border-[#122922]/15 bg-white px-4 py-2.5 text-xs text-[#122922]/75">Empat dokumen ini hanya membutuhkan nomor dan tanggal, jadi dikerjakan sekaligus dalam satu langkah.</p>
        {[['penetapan', 'BA Penetapan Pemenang'], ['bahpl', 'BA Hasil Pengadaan Langsung (BAHPL)'], ['pengumuman', 'Pengumuman Hasil Pengadaan Langsung'], ['laporan', 'Laporan Hasil PL kepada PPK']].map(([k, judul], i) => (
          <Kartu key={k} badge={`${i + 1}`} judul={judul} nomor={noLengkap(k)}>{nomorTanggal([k])}</Kartu>
        ))}
      </>
    ),
    spk: () => (
      <>
        <Kartu badge="SPK" judul="Surat Perintah Kerja" nomor={noLengkap('spk')}>
          {nomorTanggal(['spk'])}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Jenis kontrak"><SearchableSelect value={f.pl.spk_jenis_kontrak} options={['Kontrak Harga Satuan', 'Kontrak Lumsum'].map((v) => ({ value: v, label: v }))} onChange={(v) => updPl({ spk_jenis_kontrak: v })} /></Field>
            <Field label="Waktu pelaksanaan (hari kalender)"><input type="number" min="1" className="input font-mono" value={f.pl.spk_waktu_hari} onChange={(e) => updPl({ spk_waktu_hari: e.target.value })} /></Field>
          </div>
        </Kartu>
        <Kartu badge="NILAI" judul="Nilai kontrak">{ringkasHarga}</Kartu>
      </>
    ),
    sppbj: () => <Kartu badge="SPPBJ" judul="Surat Penunjukan Penyedia Barang/Jasa" nomor={noLengkap('sppbj')}>{nomorTanggal(['sppbj'])}</Kartu>,
    sp: () => (
      <Kartu badge="SP" judul="Surat Pesanan" nomor={noLengkap('sp')}>
        {nomorTanggal(['sp'])}
        <TanggalField label="Batas waktu pengiriman barang" value={f.sp_tgl_kirim} onChange={(v) => upd({ sp_tgl_kirim: v })} />
      </Kartu>
    ),
    serah: () => (
      <>
        <Kartu badge="URAIAN" judul="Uraian pekerjaan">
          <Field label="Yaitu untuk pembayaran / rincian paket pekerjaan" hint="Tampil di A2, Verifikasi, BAST, dan BAPHP.">
            <textarea rows={2} className="input" value={f.uraian} onChange={(e) => upd({ uraian: e.target.value })} />
          </Field>
        </Kartu>
        <Kartu badge="BAST" judul="Berita Acara Serah Terima" nomor={noLengkap('bast')}>{nomorTanggal(['bast'])}</Kartu>
        <Kartu badge="BAPHP" judul="Berita Acara Pemeriksaan Hasil Pekerjaan" nomor={noLengkap('baphp')}>
          {nomorTanggal(['baphp'])}
        </Kartu>
      </>
    ),
    bayar: () => (
      <>
        <Kartu badge="A2" judul="Pajak & nilai pembayaran">
          <Field label="Yaitu untuk pembayaran / rincian paket pekerjaan">
            <textarea rows={2} className="input" value={f.uraian} onChange={(e) => upd({ uraian: e.target.value })} />
          </Field>
          {pajakJsx}
        </Kartu>
      </>
    ),
    terima: () => (
      <>
        {isi.serah()}
        <Kartu badge="A2" judul="Pajak & nilai pembayaran (A2)">{pajakJsx}</Kartu>
      </>
    ),
  }

  const rbaTerbuka = rbaBuka || L?.id === 'spektek' || !f.rekening_id
  const kartuRba = rbaTerbuka ? (
    <Kartu badge="RBA" judul="Kode rekening & paket pekerjaan" ket={L?.id === 'spektek' ? 'Dokumen pertama' : 'Dipakai di semua dokumen'}>
      <Field label="Kode rekening (RBA)" hint={`Hanya kode rekening RAB tahun ${tahun} yang diampu pejabat Anda yang tampil.`}>
        <RekeningPicker value={rek} onPick={pilihRekening} user={user} tahun={tahun} />
      </Field>
    </Kartu>
  ) : (
    <div className="card flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="min-w-0 text-sm">
        <span className="mr-2 rounded-md border border-[#122922] bg-[#d6ee30] px-2 py-0.5 font-mono text-[11px] font-extrabold">RBA</span>
        <span className="font-mono text-xs font-bold text-[#3f8f77]">{rek?.kode}</span>
        <span className="ml-2 font-semibold text-[#122922]">{f.uraian || rek?.uraian}</span>
      </div>
      <button type="button" className="btn-ghost !py-1 !px-2.5 text-[11px]" onClick={() => setRbaBuka(true)}>Ubah</button>
    </div>
  )
  const kartuPenyedia = bantu.penyedia ? <Kartu badge="PNY" judul="Penyedia" ket="Dibutuhkan untuk menyimpan langkah ini"><PenyediaBox f={f} upd={upd} daftar={penyedia} /></Kartu> : null
  const kartuBarang = bantu.barang ? (
    <Kartu badge="BRG" judul={['sp', 'spk'].includes(L?.id) ? 'Rincian barang & harga' : 'Barang & harga'} ket={['sp', 'spk'].includes(L?.id) ? '' : 'Belum ada harga — isi di sini bila langkah Spektek / HPS dikerjakan belakangan'}>
      <TabelBarang items={f.items} setItems={setItems} mode="semua" />
    </Kartu>
  ) : null

  if (!siap || !L) return <div className="p-10 text-center text-sm font-semibold text-[#122922]/50">Memuat paket pengadaan…</div>
  const fase = [...new Set(langkah.map((l) => l.fase))]
  const indeksFase = (nama) => langkah.map((l, i) => (l.fase === nama ? i : -1)).filter((i) => i >= 0)
  const langkahFaseIni = indeksFase(L.fase)
  const terakhir = idx === langkah.length - 1
  const selesai = terisi.filter(Boolean).length
  const modeDok = tier
  const berikut = langkah[idx + 1]
  const jumlahBarang = f.items.filter((i) => i.jenis_barang.trim()).length

  return (
    <>
      <PageHeader
        kicker={tier === '50_750' ? 'Alur Pengadaan Langsung 50–750 Juta' : 'Alur Pengadaan 10–50 Juta'}
        title={f.uraian?.trim() || rek?.uraian || 'Paket Pengadaan Baru'}
        desc={`${selesai}/${langkah.length} langkah selesai`}
      >
        <Link to="/transaksi" className="btn-ghost"><ArrowLeft size={15} /> Daftar paket</Link>
        {saved && <CetakMenu id={saved} tahap={f.tahap} modePengadaan={tier} onPreview={setPreview} />}
        {saved && <button type="button" onClick={hapus} className="btn-ghost !text-rose-600"><Trash2 size={15} /> Hapus</button>}
      </PageHeader>

      {/* progres keseluruhan */}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex-1"><Progress value={(selesai / langkah.length) * 100} /></div>
        <span className="font-mono text-xs font-extrabold text-[#122922]">{selesai}/{langkah.length} langkah</span>
      </div>

      {/* stepper fase */}
      <div className={`mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 ${fase.length > 4 ? 'lg:grid-cols-6' : 'lg:grid-cols-4'}`}>
        {fase.map((nama) => {
          const ids = indeksFase(nama)
          const aktif = L.fase === nama
          const jml = ids.filter((i) => terisi[i]).length
          const Ikon = IKON_FASE[nama] || FileText
          return (
            <button
              key={nama} type="button"
              onClick={() => { setErr(''); setIdx(ids.find((i) => !terisi[i]) ?? ids[0]) }}
              className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left transition duration-150 ${aktif ? '-translate-y-0.5 border-2 border-[#122922] bg-white shadow-[4px_4px_0_#122922]' : 'border border-[#122922]/20 bg-white/75 hover:border-[#122922]/50 hover:bg-white'}`}
            >
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-[#122922] text-[#122922] ${jml === ids.length ? 'bg-[#b5e8a5]' : aktif ? 'bg-[#d6ee30]' : 'bg-[#f7f5ef]'}`}>
                {jml === ids.length ? <Check size={16} strokeWidth={3} /> : <Ikon size={16} strokeWidth={2.2} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold leading-tight text-[#122922]">{nama}</div>
                <div className="mt-0.5 font-mono text-[10px] font-bold text-[#122922]/55">{ids.length === 1 ? (jml ? 'Selesai' : 'Belum diisi') : `${jml}/${ids.length} langkah`}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
        <form
          id="form-wizard" className="min-w-0 space-y-6 xl:col-span-8"
          onSubmit={(e) => { e.preventDefault(); simpan({ lanjut: true }) }}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault() }}
        >
          {langkahFaseIni.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {langkahFaseIni.map((i) => (
                <button
                  key={langkah[i].id} type="button" onClick={() => { setErr(''); setIdx(i) }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-extrabold transition ${i === idx ? 'border-[#122922] bg-[#d6ee30] shadow-[2px_2px_0_#122922]' : 'border-[#122922]/20 bg-white text-[#122922]/75 hover:text-[#122922]'}`}
                >
                  {terisi[i] ? <Check size={12} strokeWidth={3} /> : <span className="font-mono">{i + 1}</span>} {langkah[i].judul}
                </button>
              ))}
            </div>
          )}
          {kartuRba}
          {kartuPenyedia}
          {kartuBarang}
          {isi[L.id]()}
          {peringatanTanggal && <Peringatan>{peringatanTanggal}</Peringatan>}
        </form>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:col-span-4">
          <div className="card space-y-4 border-2 border-[#122922] p-5 shadow-[5px_5px_0_#122922]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">Ringkasan · {L.judul}</span>
              {nilai > 0 && <KategoriBadge kode={kategoriOf(nilai).kode} />}
            </div>
            <dl className="space-y-2 text-xs">
              <Baris l="Alur" v={tier === '50_750' ? 'PL 50–750 Juta (17 Dok)' : 'SPJ 10–50 Juta (8 Dok)'} />
              <Baris l="Rekening" v={rek?.kode || '—'} />
              {f.penyedia && <Baris l="Penyedia" v={f.penyedia} biasa />}
              {(nomorLangkah[L.id] || []).map((k) => <Baris key={k} l={NOMOR[k].label.replace('No. ', 'No. ')} v={noLengkap(k) || '—'} />)}
              <Baris l="Jumlah item" v={`${jumlahBarang} jenis barang`} biasa />
            </dl>
            <dl className="space-y-2 border-t border-[#122922]/15 pt-3 text-sm tabular-nums">
              <Baris l="Total HPS" v={rp(totalHps)} />
              {tier === '50_750' && <Baris l="Harga penawaran" v={totalPen ? rp(totalPen) : '—'} />}
              <Baris l={tier === '50_750' ? 'Nilai kontrak (SPK)' : 'Nilai negosiasi'} v={totalNego ? rp(totalNego) : '—'} />
              {['bayar', 'terima'].includes(L.id) && (
                <>
                  {f.ppn_aktif && <Baris l={`PPN (${f.ppn_tarif}%)`} v={rp(pajak.ppn)} />}
                  {f.pph_aktif && <Baris l={`PPh (${f.pph_tarif}%)`} v={rp(pajak.pph)} />}
                  <div className="flex justify-between border-t border-dashed border-[#122922]/20 pt-2 text-base font-extrabold text-[#122922]"><dt>Jumlah bersih (A2)</dt><dd className="font-mono text-[#1d5a42]">{rp(pajak.bersih)}</dd></div>
                </>
              )}
            </dl>

            {modeAlur(tier, nilai) !== tier && <Peringatan>Nilai {rp(nilai)} termasuk jalur {NAMA_ALUR[modeAlur(tier, nilai)]}. Saat disimpan, paket dialihkan ke jalur tersebut dan dokumennya mengikuti jalur itu.</Peringatan>}
            {sisaPagu != null && sisaPagu < 0 && <Peringatan>Nilai melebihi sisa pagu rekening sebesar {rp(-sisaPagu)}.</Peringatan>}
            {err && <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{err}</p>}
            {ok && <p className="flex items-center gap-1.5 rounded-xl border border-[#122922] bg-[#b5e8a5] px-3 py-2 text-xs font-bold text-[#122922]"><Check size={14} /> {ok}</p>}

            <div className="space-y-2.5 pt-1">
              <button type="submit" form="form-wizard" disabled={busy} className="btn-lime w-full py-3">
                {busy ? 'Menyimpan…' : terakhir ? 'Simpan & Selesai' : 'Simpan & Lanjut'} {!busy && !terakhir && <ArrowRight size={16} />}
              </button>
              {berikut && <p className="-mt-1 text-center text-[11px] font-semibold text-[#122922]/55">Berikutnya: {berikut.judul}</p>}
              <button type="button" disabled={busy} onClick={() => simpan()} className="btn-ghost w-full"><Save size={15} /> Simpan saja</button>
              {L.dok.map((j) => (
                <button key={j} type="button" disabled={busy} onClick={() => simpan({ lihat: j })} className="btn-ghost w-full" title="Simpan lalu tampilkan pratinjau PDF">
                  <Eye size={15} /> Pratinjau {DOK[j]}
                </button>
              ))}
              <button type="button" className="btn-ghost w-full" disabled={idx === 0 || busy} onClick={() => { setErr(''); setIdx(idx - 1); window.scrollTo({ top: 0 }) }}><ArrowLeft size={15} /> Langkah sebelumnya</button>
            </div>
          </div>

          {saved && (
            <div className="card space-y-2 p-5">
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Dokumen Siap Cetak (Urut Otomatis):</div>
              <div className="grid grid-cols-1 gap-1.5">
                {filterDokByTahap(f.tahap, modeDok).map((d) => (
                  <div key={d.jenis} className="flex items-center justify-between rounded-xl border border-[#122922]/20 bg-[#f7f5ef] px-3 py-2 text-xs font-bold text-[#122922]">
                    <button type="button" onClick={() => setPreview({ id: saved, jenis: d.jenis, tahap: f.tahap, modePengadaan: modeDok })} className="flex items-center gap-2 text-left hover:underline">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full border border-[#122922] ${d.badge}`} />
                      {d.label}
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => setPreview({ id: saved, jenis: d.jenis, tahap: f.tahap, modePengadaan: modeDok })} className="rounded border border-[#122922]/20 bg-white px-2 py-0.5 text-[10px] hover:bg-[#d6ee30]">Lihat</button>
                      <a href={`/api/transaksi/${saved}/dokumen/${d.jenis}.pdf`} className="rounded border border-[#122922]/20 bg-white px-2 py-0.5 text-[10px] hover:bg-[#d6ee30]">PDF</a>
                      <a href={`/api/transaksi/${saved}/dokumen/${d.jenis}.docx`} className="rounded border border-[#122922]/20 bg-white px-2 py-0.5 text-[10px] hover:bg-[#d6ee30]">Word</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rek && (
            <div className="card space-y-3 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-[#122922]">Kontrol Pagu RBA</span>
                <span className="font-mono font-bold text-[#3f8f77]">{persen(rek.pagu ? ((rek.realisasi - awal + nilai) / rek.pagu) * 100 : 0)}</span>
              </div>
              <Progress value={rek.pagu ? ((rek.realisasi - awal + nilai) / rek.pagu) * 100 : 0} />
              <dl className="space-y-1 text-xs tabular-nums">
                <div className="flex justify-between"><dt className="text-[#122922]/60">Pagu Anggaran</dt><dd className="font-mono font-bold">{rp(rek.pagu)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#122922]/60">Realisasi s.d. ini</dt><dd className="font-mono">{rp(rek.realisasi - awal)}</dd></div>
                <div className="flex justify-between font-bold">
                  <dt>Sisa setelah paket ini</dt>
                  <dd className={`font-mono ${sisaPagu < 0 ? 'text-rose-600' : 'text-[#1d5a42]'}`}>{rp(sisaPagu)}</dd>
                </div>
              </dl>
              {sisaPagu < 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><AlertTriangle size={14} /> Melebihi sisa anggaran!</div>
              )}
            </div>
          )}
        </aside>
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

const IKON_FASE = {
  'Spesifikasi Teknis / KAK': FileText,
  'Penetapan HPS': CalendarRange,
  'Surat Pesanan': FileCheck,
  'BAST, BAPHP, A2 & Verifikasi': PackageCheck,
  Perencanaan: FileText,
  'Pemilihan Penyedia': CalendarRange,
  'Klarifikasi & Negosiasi': Handshake,
  Penetapan: Award,
  Kontrak: FileCheck,
  Pemesanan: FileCheck,
  'Serah Terima & Pembayaran': PackageCheck,
}

// kartu isian bergaya SPJ 2–10 jt: badge, judul, dan nomor dokumen di kanan
function Kartu({ badge, judul, ket, nomor, children }) {
  return (
    <div className="card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
        <div className="flex items-center gap-2.5">
          {badge && <span className="rounded-md border border-[#122922] bg-[#d6ee30] px-2 py-0.5 font-mono text-[11px] font-extrabold">{badge}</span>}
          <div>
            {ket && <div className="font-mono text-[10px] font-bold uppercase text-[#3f8f77]">{ket}</div>}
            <h2 className="text-base font-extrabold leading-tight text-[#122922]">{judul}</h2>
          </div>
        </div>
        {nomor && <div className="rounded-full border border-[#122922] bg-[#d6ee30]/70 px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">No : {nomor}</div>}
      </div>
      {children}
    </div>
  )
}

function Baris({ l, v, biasa, bahaya }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 font-medium text-[#122922]/60">{l}</dt>
      <dd className={`text-right font-bold break-words ${biasa ? '' : 'font-mono'} ${bahaya ? 'text-rose-600' : 'text-[#122922]'}`}>{v}</dd>
    </div>
  )
}
