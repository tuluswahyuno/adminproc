import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Download, Eye, FileText, Pencil, Plus, Printer, Search, Trash2,
  PackageCheck, FileCheck, ArrowUpDown, ArrowUp, ArrowDown, CheckCircle2, Clock, Receipt, CalendarRange
} from 'lucide-react'
import { api, rp, tgl, KATEGORI } from '../lib'
import { PageHeader, KategoriBadge, Empty, Modal, SearchableSelect, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const DOK_LIST = [
  { jenis: 'spektek', title: 'SPESIFIKASI TEKNIS / KAK', desc: 'Dokumen Spesifikasi Teknis PPK', badge: 'bg-[#d6ee30]' },
  { jenis: 'hps', title: 'HPS (HARGA PERKIRAAN SENDIRI)', desc: 'BA Penetapan & Lampiran HPS PPK', badge: 'bg-[#f6db5b]' },
  { jenis: 'undangan_pl', title: 'UNDANGAN PENGADAAN LANGSUNG', desc: 'Undangan pengadaan langsung ke penyedia', badge: 'bg-[#a9dcf0]' },
  { jenis: 'ba_pembukaan', title: 'BA PEMBUKAAN PENAWARAN', desc: 'Berita Acara Pembukaan Dokumen Penawaran', badge: 'bg-[#d6ee30]' },
  { jenis: 'ba_evaluasi', title: 'BA EVALUASI PENAWARAN', desc: 'Berita Acara Hasil Evaluasi Penawaran', badge: 'bg-[#b7aef3]' },
  { jenis: 'undangan_klarifikasi', title: 'UNDANGAN KLARIFIKASI & NEGO', desc: 'Undangan Klarifikasi Teknis & Negosiasi Harga', badge: 'bg-[#a9dcf0]' },
  { jenis: 'bakn', title: 'BA KLARIFIKASI & NEGOSIASI', desc: 'Klarifikasi Teknis & Negosiasi Harga', badge: 'bg-[#f6db5b]' },
  { jenis: 'ba_penetapan', title: 'BA PENETAPAN PEMENANG', desc: 'Berita Acara Penetapan Penyedia/Pemenang', badge: 'bg-[#b5e8a5]' },
  { jenis: 'bahpl', title: 'BA HASIL PENGADAAN LANGSUNG', desc: 'Berita Acara Hasil Pengadaan Langsung (BAHPL)', badge: 'bg-[#d6ee30]' },
  { jenis: 'pengumuman_pl', title: 'PENGUMUMAN HASIL PL', desc: 'Pengumuman Hasil Pengadaan Langsung', badge: 'bg-[#a9dcf0]' },
  { jenis: 'laporan_pl', title: 'LAPORAN HASIL PL KE PPK', desc: 'Laporan Proses Pengadaan Langsung kepada PPK', badge: 'bg-[#b7aef3]' },
  { jenis: 'sppbj', title: 'SPPBJ', desc: 'Surat Penunjukan Penyedia Barang/Jasa (PPK)', badge: 'bg-[#f6db5b]' },
  { jenis: 'spk', title: 'SURAT PERINTAH KERJA (SPK)', desc: 'SPK Kontrak & Lampiran Rincian Barang', badge: 'bg-[#d6ee30]' },
  { jenis: 'sp', title: 'SURAT PESANAN', desc: 'Pemesanan barang ke penyedia', badge: 'bg-[#d6ee30]' },
  { jenis: 'bast', title: 'BAST HASIL PEKERJAAN', desc: 'Serah terima Penyedia → PPK', badge: 'bg-[#a9dcf0]' },
  { jenis: 'baphp', title: 'BAPHP (PPK → KPA)', desc: 'Penyerahan hasil pekerjaan PPK → KPA', badge: 'bg-[#b7aef3]' },
  { jenis: 'a2', title: 'A2 — BUKTI PENGELUARAN', desc: 'Kuitansi separuh F4 (21×16,5 cm)', badge: 'bg-[#b5e8a5]' },
  { jenis: 'verifikasi', title: 'LEMBAR VERIFIKASI', desc: 'Lembar kendali verifikator', badge: 'bg-[#f6db5b]' },
]

export function filterDokByTahap(tahap, modePengadaan = '0_10') {
  const is50750 = modePengadaan === '50_750' || ['undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(tahap)
  const is1050 = !is50750 && (modePengadaan === '10_50' || ['spektek', 'hps', 'spektek_hps', 'negosiasi'].includes(tahap))
  let raw = []
  if (tahap === 'spj_langsung') {
    raw = DOK_LIST.filter((d) => d.jenis === 'a2' || d.jenis === 'verifikasi')
  } else if (is50750) {
    const plOrder = [
      'spektek', 'hps', 'undangan_pl', 'ba_pembukaan', 'ba_evaluasi',
      'undangan_klarifikasi', 'bakn', 'ba_penetapan', 'bahpl', 'pengumuman_pl',
      'laporan_pl', 'spk', 'sppbj', 'bast', 'baphp', 'a2', 'verifikasi'
    ]
    let maxIdx = plOrder.length
    if (tahap === 'spektek') maxIdx = 1
    else if (tahap === 'hps' || tahap === 'spektek_hps') maxIdx = 2
    else if (tahap === 'undangan') maxIdx = 3
    else if (tahap === 'evaluasi') maxIdx = 5
    else if (tahap === 'negosiasi') maxIdx = 7
    else if (tahap === 'penetapan') maxIdx = 11
    else if (tahap === 'kontrak') maxIdx = 13
    else if (tahap === 'selesai') maxIdx = plOrder.length

    const activeCodes = plOrder.slice(0, maxIdx)
    raw = activeCodes.map((k) => DOK_LIST.find((d) => d.jenis === k)).filter(Boolean)
  } else if (tahap === 'spektek') {
    raw = DOK_LIST.filter((d) => d.jenis === 'spektek')
  } else if (tahap === 'hps' || tahap === 'spektek_hps') {
    raw = DOK_LIST.filter((d) => d.jenis === 'spektek' || d.jenis === 'hps')
  } else if (tahap === 'negosiasi') {
    raw = DOK_LIST.filter((d) => ['spektek', 'hps', 'bakn'].includes(d.jenis))
  } else if (tahap === 'pesanan') {
    raw = is1050
      ? DOK_LIST.filter((d) => ['spektek', 'hps', 'bakn', 'sp'].includes(d.jenis))
      : DOK_LIST.filter((d) => d.jenis === 'sp')
  } else {
    raw = is1050
      ? DOK_LIST.filter((d) => ['spektek', 'hps', 'bakn', 'sp', 'bast', 'baphp', 'a2', 'verifikasi'].includes(d.jenis))
      : DOK_LIST.filter((d) => ['sp', 'bast', 'baphp', 'a2', 'verifikasi'].includes(d.jenis))
  }
  return raw.map((d, idx) => ({
    ...d,
    urut: idx + 1,
    kode: String(idx + 1).padStart(2, '0'),
    label: `${idx + 1}. ${d.title}`,
  }))
}

export function CetakMenu({ id, tahap = 'selesai', modePengadaan = '0_10', onPreview }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const list = filterDokByTahap(tahap, modePengadaan)
  const btnLabel =
    tahap === 'spektek' ? '1. Spektek (1)'
    : tahap === 'hps' || tahap === 'spektek_hps' ? 'Spektek & HPS (2)'
    : tahap === 'undangan' ? 'Undangan PL (3)'
    : tahap === 'evaluasi' ? 'Dok. Evaluasi (5)'
    : tahap === 'negosiasi' ? `Dokumen Nego (${list.length})`
    : tahap === 'penetapan' ? `Dok. Penetapan (${list.length})`
    : tahap === 'kontrak' ? `SPPBJ & SPK (${list.length})`
    : tahap === 'pesanan' ? (list.length > 1 ? `Dokumen SP (${list.length})` : 'Cetak SP')
    : tahap === 'spj_langsung' ? 'Dokumen (2)'
    : `Dokumen (${list.length})`

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="btn-ghost !px-2.5 !py-1.5 text-xs">
        <Printer size={13} />
        {btnLabel}
      </button>
      {open && (
        <div className="card absolute right-0 z-30 mt-2 max-h-[75vh] w-88 overflow-y-auto divide-y divide-[#122922]/10 border-2 border-[#122922] p-2 shadow-[6px_6px_0_#122922]">
          {list.map((d) => (
            <div key={d.jenis} className="p-2.5 first:pt-1.5 last:pb-1.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#122922] border border-[#122922] ${d.badge}`}>
                  {d.kode}
                </span>
                <span className="text-xs font-extrabold tracking-tight text-[#122922]">{d.label}</span>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => { onPreview?.({ id, jenis: d.jenis, tahap, modePengadaan }); setOpen(false) }}
                  className="btn-ghost flex-1 !px-2 !py-1 text-[11px]"
                >
                  <Eye size={12} /> Pratinjau
                </button>
                <a href={`/api/transaksi/${id}/dokumen/${d.jenis}.pdf`} className="btn-ghost !px-2.5 !py-1 text-[11px]">
                  <Download size={12} /> PDF
                </a>
                <a href={`/api/transaksi/${id}/dokumen/${d.jenis}.docx`} className="btn-ghost !px-2.5 !py-1 text-[11px]">
                  <Download size={12} /> Word
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function PreviewModal({ preview, onClose, onSwitch }) {
  if (!preview) return null
  const list = filterDokByTahap(preview.tahap, preview.modePengadaan)
  const cur = list.find((x) => x.jenis === preview.jenis) || list[0] || { label: preview.jenis?.toUpperCase() }
  const src = `/api/transaksi/${preview.id}/dokumen/${preview.jenis}.pdf?inline=1`
  return (
    <Modal open onClose={onClose} wide title={`Pratinjau — ${cur.label}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {list.map((d) => (
            <button
              key={d.jenis}
              type="button"
              onClick={() => onSwitch?.({ ...preview, jenis: d.jenis })}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                preview.jenis === d.jenis
                  ? 'border border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[2px_2px_0_#122922]'
                  : 'border border-[#122922]/15 bg-[#f7f5ef] text-[#122922]/70 hover:text-[#122922]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost !py-1.5" href={`/api/transaksi/${preview.id}/dokumen/${preview.jenis}.pdf`}>
            <Download size={14} /> Unduh PDF
          </a>
          <a className="btn-primary !py-1.5" href={`/api/transaksi/${preview.id}/dokumen/${preview.jenis}.docx`}>
            <Download size={14} /> Unduh Word
          </a>
        </div>
      </div>
      <iframe key={src} title="pratinjau" src={src} className="h-[74vh] w-full rounded-xl border-2 border-[#122922]/20 bg-[#f7f5ef]" />
    </Modal>
  )
}

// paket 10-50 jt dan 50-750 jt dikerjakan di wizard; langkahnya dipilih otomatis
const linkPaket = (t, mode) => (['10_50', '50_750'].includes(t.mode_pengadaan)
  ? `/pengadaan/${t.id}`
  : `/transaksi/${t.id}${mode ? '?mode=' + mode : ''}`)

export default function Transaksi() {
  const { user, tahun, setTahun, tahunList } = useAuth()
  const [rows, setRows] = useState(null)
  const [rekeningList, setRekeningList] = useState([])
  const [q, setQ] = useState('')
  const [rekId, setRekId] = useState('')
  const [tahapFilter, setTahapFilter] = useState('')
  const [kat, setKat] = useState('')
  const [bulan, setBulan] = useState('')
  const [sortBy, setSortBy] = useState('tanggal')
  const [sortDir, setSortDir] = useState('desc')
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    api(`/rekening?diampu=1&tahun=${encodeURIComponent(tahun || '')}`).then(setRekeningList)
  }, [user?.id, user?.role, tahun])

  const load = useCallback(() => {
    const p = new URLSearchParams({
      q,
      rekening_id: rekId,
      tahap: tahapFilter,
      kategori: kat,
      bulan,
      tahun: tahun || '',
    })
    api('/transaksi?' + p).then(setRows)
  }, [q, rekId, tahapFilter, kat, bulan, tahun, user?.id, user?.role])

  useEffect(() => { const t = setTimeout(load, 150); return () => clearTimeout(t) }, [load])

  const hapus = async (t) => {
    try {
      const yakin = await konfirmasiHapus({
        title: 'Hapus Paket Pengadaan?',
        text: `Paket "${t.penyedia || t.uraian || 'Pengadaan'}" beserta seluruh dokumen terkait akan dihapus secara permanen.`,
        confirmText: 'Ya, Hapus Paket!',
      })
      if (!yakin) return
      await api('/transaksi/' + t.id, { method: 'DELETE' })
      load()
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menghapus paket pengadaan')
    }
  }

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(col); setSortDir('asc') }
  }

  const sortedRows = rows ? [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1
    if (sortBy === 'rek_kode') return String(a.rek_kode || '').localeCompare(String(b.rek_kode || '')) * dir
    if (sortBy === 'penyedia') return String(a.penyedia || '').localeCompare(String(b.penyedia || '')) * dir
    if (sortBy === 'kotor') return ((Number(a.kotor) || 0) - (Number(b.kotor) || 0)) * dir
    return String(a.tanggal || '').localeCompare(String(b.tanggal || '')) * dir
  }) : null

  const SortIcon = ({ col }) => {
    if (sortBy !== col) return <ArrowUpDown size={12} className="inline ml-1 opacity-40" />
    return sortDir === 'asc' ? <ArrowUp size={12} className="inline ml-1 text-[#122922]" /> : <ArrowDown size={12} className="inline ml-1 text-[#122922]" />
  }

  const rekOptions = useMemo(
    () => [
      { value: '', label: `Semua Kode Belanja (${rekeningList.length})` },
      ...rekeningList.map((r) => ({ value: r.id, badge: r.kode, label: r.uraian, sub: r.induk_uraian })),
    ],
    [rekeningList]
  )

  const tahapOptions = [
    { value: '', label: 'Semua Status / Mode' },
    { value: 'spektek', label: '1. Spesifikasi Teknis / KAK' },
    { value: 'hps', label: '2. Penetapan HPS' },
    { value: 'undangan', label: '50-750 Jt: 3. Undangan PL' },
    { value: 'evaluasi', label: '50-750 Jt: 4. Evaluasi Penawaran' },
    { value: 'negosiasi', label: 'BA Klarifikasi & Negosiasi' },
    { value: 'penetapan', label: '50-750 Jt: Penetapan & Laporan PPK' },
    { value: 'kontrak', label: '50-750 Jt: SPPBJ & Kontrak SPK' },
    { value: 'pesanan', label: 'Surat Pesanan (SP)' },
    { value: 'selesai', label: 'Selesai BAST, BAPHP & A2' },
    { value: 'spj_langsung', label: 'Langsung: A2 & Verifikasi Saja' },
  ]

  const katOptions = [
    { value: '', label: 'Semua Kategori Nilai' },
    ...KATEGORI.map((k) => ({ value: k.kode, label: k.label })),
  ]

  return (
    <>
      <PageHeader
        kicker={`Alur Pengadaan & SPJ · TA ${tahun === 'semua' ? 'Semua Tahun' : tahun}`}
        title={`Daftar Dokumen Pengadaan ${tahun === 'semua' ? '(Semua Tahun)' : tahun}`}
        desc={`Daftar dokumen pengadaan barang/jasa dan berkas SPJ ${tahun === 'semua' ? 'seluruh tahun anggaran' : 'tahun ' + tahun}`}
      >
        <div className="flex items-center gap-1.5 rounded-full border-2 border-[#122922] bg-white px-3 py-1.5 text-xs font-extrabold text-[#122922]">
          <CalendarRange size={14} className="text-[#3f8f77]" />
          <span>Tahun:</span>
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="bg-transparent font-mono font-extrabold text-[#122922] outline-none cursor-pointer"
          >
            {(tahunList || ['2026', '2025']).map((yr) => (
              <option key={yr} value={yr}>
                {yr}{String(yr) === String(new Date().getFullYear()) ? ' (Tahun Berjalan)' : ''}
              </option>
            ))}
            <option value="semua">Semua Tahun</option>
          </select>
        </div>
        <Link to="/transaksi/baru?mode=langsung" className="btn-ghost">
          <Receipt size={15} /> A2 & Verifikasi Saja
        </Link>
        <Link to="/transaksi/baru" className="btn-ghost !border-[#122922] !bg-[#d6ee30]/60">
          <Plus size={15} strokeWidth={2.5} /> Paket 0–2 Jt & 2–10 Jt (SP)
        </Link>
        <Link to="/pengadaan/baru?tier=10_50" className="btn-lime">
          <FileText size={15} /> Paket 10–50 Jt
        </Link>
        <Link to="/pengadaan/baru?tier=50_750" className="btn-primary">
          <FileText size={15} /> Paket 50–750 Jt
        </Link>
      </PageHeader>

      <div className="card overflow-visible">
        {/* Filter & Searchable Dropdown Bar */}
        <div className="grid gap-2.5 border-b border-[#122922]/12 bg-[#f7f5ef]/70 p-4 rounded-t-2xl sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-4">
            <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
            <input
              className="input !pl-9"
              placeholder="Cari penyedia, nomor HPS/BA/SP/BAST, atau paket…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="lg:col-span-3">
            <SearchableSelect
              value={rekId}
              options={rekOptions}
              placeholder={`Semua Kode Belanja (${rekeningList.length})`}
              searchPlaceholder="Cari kode rekening atau nama belanja…"
              allowClear
              onChange={(v) => setRekId(v)}
            />
          </div>
          <div className="lg:col-span-2">
            <SearchableSelect
              value={tahapFilter}
              options={tahapOptions}
              placeholder="Semua Status / Mode"
              searchPlaceholder="Cari status tahap…"
              allowClear
              onChange={(v) => setTahapFilter(v)}
            />
          </div>
          <div className="lg:col-span-2">
            <SearchableSelect
              value={kat}
              options={katOptions}
              placeholder="Semua Kategori Nilai"
              searchPlaceholder="Cari kategori nilai…"
              allowClear
              onChange={(v) => setKat(v)}
            />
          </div>
          <div className="lg:col-span-1">
            <input type="month" className="input !px-2" value={bulan} onChange={(e) => setBulan(e.target.value)} title="Filter Bulan" />
          </div>
        </div>

        {/* Tabel Responsif Tanpa Terpotong */}
        <div className="w-full">
          <table className="w-full table-fixed">
            <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/40">
              <tr>
                <th onClick={() => toggleSort('tanggal')} className="th w-[18%] cursor-pointer select-none hover:text-[#122922]">
                  Tanggal & Nomor <SortIcon col="tanggal" />
                </th>
                <th onClick={() => toggleSort('penyedia')} className="th w-[24%] cursor-pointer select-none hover:text-[#122922]">
                  Penyedia & Pembayaran <SortIcon col="penyedia" />
                </th>
                <th onClick={() => toggleSort('rek_kode')} className="th w-[20%] cursor-pointer select-none hover:text-[#122922]">
                  Kode Belanja (RBA) <SortIcon col="rek_kode" />
                </th>
                <th onClick={() => toggleSort('kotor')} className="th w-[12%] cursor-pointer select-none text-right hover:text-[#122922]">
                  Nominal <SortIcon col="kotor" />
                </th>
                <th className="th w-[11%] text-center">Status Alur</th>
                <th className="th w-[15%] text-right">Aksi & Dokumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#122922]/10">
              {sortedRows?.map((t) => {
                const isLangsung = t.tahap === 'spj_langsung'
                const is50750 = !isLangsung && (t.mode_pengadaan === '50_750' || ['undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(t.tahap))
                const isSpektekOnly = t.tahap === 'spektek'
                const isHpsStage = t.tahap === 'hps' || t.tahap === 'spektek_hps'
                const isUndangan = t.tahap === 'undangan'
                const isEvaluasi = t.tahap === 'evaluasi'
                const isNegosiasi = t.tahap === 'negosiasi'
                const isPenetapan = t.tahap === 'penetapan'
                const isKontrak = t.tahap === 'kontrak'
                const isSelesai = t.tahap === 'selesai' || (!isLangsung && !isSpektekOnly && !isHpsStage && !isUndangan && !isEvaluasi && !isNegosiasi && !isPenetapan && !isKontrak && !!t.bast_nomor)
                const modeTahap = isLangsung ? 'spj_langsung'
                  : isSpektekOnly ? 'spektek'
                  : isHpsStage ? 'hps'
                  : isUndangan ? 'undangan'
                  : isEvaluasi ? 'evaluasi'
                  : isNegosiasi ? 'negosiasi'
                  : isPenetapan ? 'penetapan'
                  : isKontrak ? 'kontrak'
                  : isSelesai ? 'selesai'
                  : 'pesanan'
                const modePengadaan = is50750 ? '50_750' : (t.mode_pengadaan || (Number(t.kotor) > 10000000 || t.hps_nomor || t.bakn_nomor ? '10_50' : '0_10'))

                return (
                  <tr key={t.id} className="transition hover:bg-[#f7f5ef]/70">
                    <td className="td align-top">
                      <div className="font-bold text-[#122922]">{tgl(t.spk_tanggal || t.sp_tanggal || t.hps_tanggal || t.tanggal)}</div>
                      <div className="mt-1 space-y-0.5 font-mono text-[11px] text-[#122922]/70 break-all">
                        {isLangsung ? (
                          <span className="inline-flex items-center gap-1 text-[#3f8f77] font-semibold">
                            <Receipt size={11} /> Langsung A2 & Verifikasi
                          </span>
                        ) : (
                          <>
                            {t.hps_nomor && (
                              <div className="flex items-center gap-1 text-[#856404]">
                                <FileText size={11} className="shrink-0" />
                                <span className="truncate" title={t.hps_nomor}>HPS: {t.hps_nomor}</span>
                              </div>
                            )}
                            {t.bakn_nomor && (
                              <div className="flex items-center gap-1 text-[#1d5a42]">
                                <FileCheck size={11} className="shrink-0" />
                                <span className="truncate" title={t.bakn_nomor}>BA Nego: {t.bakn_nomor}</span>
                              </div>
                            )}
                            {t.spk_nomor ? (
                              <div className="flex items-center gap-1 text-[#3f8f77]">
                                <PackageCheck size={11} className="shrink-0 text-[#3f8f77]" />
                                <span className="truncate" title={t.spk_nomor}>SPK: {t.spk_nomor}</span>
                              </div>
                            ) : t.sp_nomor ? (
                              <div className="flex items-center gap-1">
                                <PackageCheck size={11} className="shrink-0 text-[#3f8f77]" />
                                <span className="truncate" title={t.sp_nomor}>SP: {t.sp_nomor}</span>
                              </div>
                            ) : null}
                            {isSelesai && t.bast_nomor && (
                              <div className="flex items-center gap-1 text-[#122922]">
                                <FileCheck size={11} className="shrink-0 text-[#122922]" />
                                <span className="truncate" title={t.bast_nomor}>BAST: {t.bast_nomor}</span>
                              </div>
                            )}
                            {isSelesai && t.baphp_nomor && (
                              <div className="flex items-center gap-1 text-[#4c3f91]">
                                <FileCheck size={11} className="shrink-0 text-[#4c3f91]" />
                                <span className="truncate" title={t.baphp_nomor}>BAPHP: {t.baphp_nomor}</span>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="td align-top">
                      <div className="font-extrabold text-[#122922] break-words">
                        {t.penyedia && t.penyedia !== '-' ? t.penyedia : <span className="italic text-[#122922]/50">Penyedia dipilih saat Negosiasi</span>}
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-xs font-medium text-[#122922]/70" title={t.uraian}>{t.uraian || t.rek_uraian}</div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {!isLangsung && t.jml_item > 0 && (
                          <span className="rounded-full border border-[#122922]/20 bg-[#d6ee30]/50 px-2 py-0.5 font-mono text-[10px] font-bold text-[#122922]">
                            {t.jml_item} item
                          </span>
                        )}
                        <KategoriBadge kode={t.kategori} />
                      </div>
                    </td>

                    <td className="td align-top">
                      <span className="inline-block rounded-md border border-[#122922]/15 bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#3f8f77]">
                        {t.rek_kode}
                      </span>
                      <div className="mt-1 line-clamp-2 text-xs font-semibold text-[#122922]/80" title={t.rek_uraian}>
                        {t.rek_uraian}
                      </div>
                    </td>

                    <td className="td align-top text-right font-mono font-extrabold tabular-nums text-[#122922]">
                      {rp(t.kotor)}
                    </td>

                    <td className="td align-top text-center">
                      {isLangsung ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#b5e8a5] px-2.5 py-1 text-[10px] font-extrabold text-[#122922]">
                          <Receipt size={11} /> A2 & Verifikasi
                        </span>
                      ) : isSpektekOnly ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 1. Spektek / KAK
                          </span>
                          <Link
                            to={linkPaket(t, 'hps')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#f6db5b] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#ecd04d]"
                          >
                            + Buat HPS →
                          </Link>
                        </div>
                      ) : isHpsStage ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#f6db5b] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 2. Penetapan HPS
                          </span>
                          <Link
                            to={linkPaket(t, is50750 ? 'undangan' : 'negosiasi')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            {is50750 ? '+ Undangan PL →' : '+ BA Klarifikasi & Nego →'}
                          </Link>
                        </div>
                      ) : isUndangan ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#a9dcf0] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 3. Undangan PL
                          </span>
                          <Link
                            to={linkPaket(t, 'evaluasi')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            + Evaluasi Penawaran →
                          </Link>
                        </div>
                      ) : isEvaluasi ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#b7aef3] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 4. Evaluasi PL
                          </span>
                          <Link
                            to={linkPaket(t, 'negosiasi')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            + Klarifikasi & Nego →
                          </Link>
                        </div>
                      ) : isNegosiasi ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#a9dcf0] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> {is50750 ? '5. BA Klarifikasi' : '3. BA Negosiasi'}
                          </span>
                          <Link
                            to={linkPaket(t, is50750 ? 'penetapan' : 'sp')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            {is50750 ? '+ Penetapan Pemenang →' : '+ Buat Surat Pesanan →'}
                          </Link>
                        </div>
                      ) : isPenetapan ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 6. Penetapan & Lap.
                          </span>
                          <Link
                            to={linkPaket(t, 'kontrak')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#a9dcf0] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#92cbdf]"
                          >
                            + SPPBJ & SPK →
                          </Link>
                        </div>
                      ) : isKontrak ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#f6db5b] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> 7. Kontrak SPK
                          </span>
                          <Link
                            to={linkPaket(t, 'terima')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            + BAST & SPJ →
                          </Link>
                        </div>
                      ) : isSelesai ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#a9dcf0] px-2.5 py-1 text-[10px] font-extrabold text-[#122922]">
                          <CheckCircle2 size={11} /> BAST & SPJ Selesai
                        </span>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#f6db5b] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922]">
                            <Clock size={11} /> Surat Pesanan (SP)
                          </span>
                          <Link
                            to={linkPaket(t, 'terima')}
                            className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] shadow-[1px_1px_0_#122922] hover:bg-[#c8e220]"
                          >
                            + Buat BAST & A2 →
                          </Link>
                        </div>
                      )}
                    </td>

                    <td className="td align-top">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <CetakMenu id={t.id} tahap={modeTahap} modePengadaan={modePengadaan} onPreview={setPreview} />
                        <Link
                          to={linkPaket(t, '')}
                          className="rounded-lg border border-[#122922]/20 p-1.5 text-[#122922] hover:bg-[#d6ee30]"
                          title="Ubah / Lanjutkan Tahap"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => hapus(t)}
                          className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {sortedRows && sortedRows.length === 0 && (
            <Empty>
              <FileText className="mx-auto mb-2 text-[#122922]/40" />
              Belum ada pengadaan/SPJ yang cocok. Klik <b>+ Buat Surat Pesanan (SP)</b> atau <b>+ Paket 10–50 Jt (Spektek &amp; HPS)</b>.
            </Empty>
          )}
        </div>
      </div>
      <PreviewModal preview={preview} onClose={() => setPreview(null)} onSwitch={setPreview} />
    </>
  )
}
