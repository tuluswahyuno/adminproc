import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, Check, ChevronDown, Plus,
  Search, Trash2, Sparkles, Package, FileCheck2, UserCheck, Printer, Receipt, FileText, Handshake,
  CalendarRange, FileCheck, Award, PackageCheck, Maximize2, Minimize2
} from 'lucide-react'
import { api, hitungPajak, kategoriOf, num, persen, rp, terbilang, kalimatTanggalBast, PERAN } from '../lib'
import { Field, KategoriBadge, PageHeader, Progress, SearchableSelect, konfirmasiHapus } from '../ui'
import { CetakMenu, PreviewModal, filterDokByTahap } from './Transaksi'
import { useAuth } from '../App'

const hariIni = () => new Date().toISOString().slice(0, 10)

const CONTOH_ITEMS_PDF = [
  { jenis_barang: 'Printer Label Barcode Xprinter D4601B', satuan: 'Unit', kuantitas: 2, harga_hps: 1320000, harga_penawaran: 1300000, harga_satuan: 1285000 },
  { jenis_barang: 'Printer Kasir Thermal Iware 58ac', satuan: 'Unit', kuantitas: 2, harga_hps: 900000, harga_penawaran: 890000, harga_satuan: 875000 },
  { jenis_barang: 'Barcode Scanner Iware OS-930', satuan: 'Unit', kuantitas: 2, harga_hps: 890000, harga_penawaran: 880000, harga_satuan: 865000 },
  { jenis_barang: 'Webcam Logitech C270 HD', satuan: 'Unit', kuantitas: 2, harga_hps: 375000, harga_penawaran: 360000, harga_satuan: 350000 },
  { jenis_barang: 'Fingerprint Reader U Are U 4500', satuan: 'Unit', kuantitas: 2, harga_hps: 1520000, harga_penawaran: 1500000, harga_satuan: 1475000 },
]

const CONTOH_ITEMS_10_50 = [
  { jenis_barang: 'PC SET Build-up, Intel core i3 Gen 13, RAM 8GB DDR5, SSD 512GB', satuan: 'Set', kuantitas: 2, harga_hps: 14652000, harga_penawaran: 14500000, harga_satuan: 14400000 },
  { jenis_barang: 'InkTank Printer (Print Only, Resolusi 720x720 dpi, USB 2.0)', satuan: 'Unit', kuantitas: 8, harga_hps: 1999999, harga_penawaran: 1975000, harga_satuan: 1950000 },
]

const CONTOH_ITEMS_50_750 = [
  { jenis_barang: 'AC Split 1 PK Inverter Daikin Flash Inverter FTKQ25UVM4', satuan: 'Unit', kuantitas: 4, harga_hps: 6150000, harga_penawaran: 6100000, harga_satuan: 6050000 },
  { jenis_barang: 'AC Floor Standing 5 PK Daikin FVRN125BXV14', satuan: 'Unit', kuantitas: 2, harga_hps: 31850000, harga_penawaran: 31500000, harga_satuan: 31250000 },
]

export const defaultPl = (tahun = '2026') => ({
  undangan_no_urut: '',
  undangan_nomor: '',
  undangan_tanggal: hariIni(),
  lingkup_pekerjaan: '',
  penawaran_nomor: '',
  penawaran_tanggal: hariIni(),
  jadwal: {
    pemasukan_tgl: hariIni(),
    pembukaan_tgl: hariIni(),
    evaluasi_tgl: hariIni(),
    klarifikasi_tgl: hariIni(),
    klarifikasi_waktu: '09.00 WIB',
    penetapan_tgl: hariIni(),
    spk_tgl: hariIni(),
  },
  pembukaan_no_urut: '',
  pembukaan_nomor: '',
  pembukaan_tanggal: hariIni(),
  evaluasi_no_urut: '',
  evaluasi_nomor: '',
  evaluasi_tanggal: hariIni(),
  undangan_klarifikasi_no_urut: '',
  undangan_klarifikasi_nomor: '',
  undangan_klarifikasi_tanggal: hariIni(),
  penetapan_no_urut: '',
  penetapan_nomor: '',
  penetapan_tanggal: hariIni(),
  bahpl_no_urut: '',
  bahpl_nomor: '',
  bahpl_tanggal: hariIni(),
  pengumuman_no_urut: '',
  pengumuman_nomor: '',
  pengumuman_tanggal: hariIni(),
  laporan_no_urut: '',
  laporan_nomor: '',
  laporan_tanggal: hariIni(),
  sppbj_no_urut: '',
  sppbj_nomor: '',
  sppbj_tanggal: hariIni(),
  spk_no_urut: '',
  spk_nomor: '',
  spk_tanggal: hariIni(),
  spk_jenis_kontrak: 'Kontrak Harga Satuan',
  spk_waktu_hari: 30,
})

const defaultSpektek = (namaRek = 'Belanja Modal Peralatan Komputer', items = []) => {
  const listTeknis = (items || [])
    .filter((i) => i?.jenis_barang)
    .map((i) => `${i.jenis_barang} (${i.kuantitas || 1} ${i.satuan || 'Unit'})`)
    .join('\n')
  return {
    paket_pengadaan: namaRek || 'Belanja Modal Peralatan Komputer',
    id_rup: '62736023',
    tanggal: hariIni(),
    fungsi_umum: `Pengadaan ${namaRek || 'barang/perangkat'} ini berfungsi sebagai perangkat kerja operasional untuk menjalankan layanan rumah sakit, memproses data pelayanan, serta mendukung administrasi pasien. Output yang diharapkan dari pengadaan ini adalah peningkatan efisiensi layanan, percepatan waktu penanganan pasien, serta terjaminnya akurasi dan integrasi data operasional di RSUD dr. Soeratno Gemolong.`,
    mutu_merek: 'Mengacu pada merek pabrikan resmi (bukan rakitan) yang terdaftar pada sistem E-Katalog LKPP.',
    mutu_standarisasi: 'Barang 100% baru (brand new), asli (original), bukan rekondisi, dan memiliki garansi resmi pabrikan/distributor minimal 1 (satu) tahun.',
    mutu_teknis: listTeknis || 'PC Desktop : Minimal Core i3 Generasi ke-13, RAM 8GB, SSD 512 GB, Keyboard & Mouse USB, Monitor LED Minimal 21 Inci FHD.\nPrinter : Tipe Ink Tank (Print Only), Resolusi 720 x 720 dpi, Kecepatan Cetak 9.0 ipm (Hitam) / 4.8 ipm (Warna), Konektivitas USB 2.0.',
    mutu_kinerja: 'Mampu beroperasi stabil tanpa overheat untuk menjalankan sistem layanan selama jam operasional rumah sakit serta dirancang untuk beban kerja administrasi harian yang padat.',
    mutu_pdn: 'Diutamakan produk dalam negeri atau memiliki nilai TKDN (Tingkat Komponen Dalam Negeri) yang ditetapkan.',
    waktu_jangka: '30 (tiga puluh) hari kalender sejak penandatangan kontrak.',
    waktu_lokasi: 'RSUD dr. Soeratno Gemolong\nJln. R. Ngt Tjitrosantjoko No. 10 Gemolong, Sragen',
    waktu_transportasi: 'Menggunakan kemasan/kardus standar pabrikan (dilengkapi styrofoam pelindung) dan dikirim menggunakan kendaraan tertutup agar barang aman dari benturan, debu, dan air hujan.',
    layanan_tingkat: 'Penyedia wajib memastikan seluruh barang dikirim dalam kondisi 100% baru, utuh, dan berfungsi normal. Penyedia wajib merespons laporan kendala/kerusakan perangkat dari pihak RSUD maksimal 2x24 jam pada hari kerja selama masa garansi berlaku.',
    layanan_pelatihan: 'Tidak memerlukan pelatihan khusus. Namun, penyedia wajib memberikan bantuan teknis awal berupa penyiapan perangkat (setup awal), serta uji coba fungsi di lokasi penempatan hingga seluruh perangkat menyala dan siap digunakan.',
    layanan_pemeliharaan: 'Terdapat jaminan garansi resmi perbaikan dan penggantian suku cadang minimal 1 (satu) tahun.\nApabila perangkat ditemukan rusak/cacat pabrik saat baru diterima (Dead on Arrival), penyedia wajib mengganti dengan unit baru selambat-lambatnya 7 (tujuh) hari kerja.',
    layanan_lainnya: 'Penyedia wajib melampirkan kontak narahubung (Person in Charge / Helpdesk) atau alamat Service Center resmi terdekat yang mudah dihubungi untuk memfasilitasi kelancaran proses klaim garansi.',
    info_lainnya: 'Komponen Harga : Harga yang ditawarkan oleh penyedia pada sistem/kontrak sudah harus meliputi harga barang, biaya pengepakan, pajak (PPN), serta biaya-biaya lain yang diwajibkan oleh ketentuan perundang-undangan.\nKelengkapan Perangkat : Setiap unit barang yang diserahterimakan wajib disertai dengan kelengkapan standar bawaan pabrik (factory standard), meliputi buku panduan penggunaan (manual book) dan Kartu Garansi fisik yang masih berlaku.',
  }
}

export const itemBaru = () => ({ jenis_barang: '', satuan: 'Unit', kuantitas: 1, harga_hps: '', harga_penawaran: '', harga_satuan: '' })

export const kosong = () => ({
  tahap: 'pesanan',
  mode_pengadaan: '0_10',
  tanggal: hariIni(),
  rekening_id: '',
  penyedia: '',
  penyedia_id: '',
  penyedia_pimpinan: '',
  penyedia_jabatan: 'Direktur',
  penyedia_alamat: '',
  penyedia_npwp: '',
  uraian: '',
  kotor: '',
  ppn_aktif: false,
  pph_aktif: false,
  ppn_tarif: 11,
  pph_tarif: 1.5,
  kpa_id: '',
  ppkom_id: '',
  pptk_id: '',
  pengadaan_id: '',
  bendahara_id: '',
  verifikator_id: '',
  pengurus_barang_id: '',
  spektek: defaultSpektek(),
  hps_no_urut: '',
  hps_nomor: '',
  hps_tanggal: hariIni(),
  hps_total: 0,
  bakn_no_urut: '',
  bakn_nomor: '',
  bakn_tanggal: hariIni(),
  penawaran_total: 0,
  bakn_hasil_teknis: 'Sesuai - Ada Perubahan',
  sp_no_urut: '',
  sp_nomor: '',
  sp_tanggal: hariIni(),
  sp_tgl_kirim: hariIni(),
  bast_no_urut: '',
  bast_nomor: '',
  bast_tanggal: hariIni(),
  baphp_no_urut: '',
  baphp_nomor: '',
  baphp_tanggal: hariIni(),
  ppk_jabatan: '',
  ppk_alamat: 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong',
  spk_no_urut: '',
  spk_nomor: '',
  spk_tanggal: hariIni(),
  pl: defaultPl(),
  items: [itemBaru()],
})

export function RekeningPicker({ value, onPick, user, tahun }) {
  const [q, setQ] = useState('')
  const [list, setList] = useState([])
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const isFilteredByPejabat = user && !['admin', 'superuser', 'pep'].includes(user.role) && !!user.pejabat_id

  useEffect(() => {
    const t = setTimeout(() => {
      const p = new URLSearchParams({ q, diampu: '1', tahun: tahun || '' })
      api('/rekening?' + p).then((r) => setList(r.slice(0, 100)))
    }, 100)
    return () => clearTimeout(t)
  }, [q, user, tahun])

  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} className="input flex items-center justify-between text-left cursor-pointer">
        {value ? (
          <span className="truncate">
            <span className="rounded bg-[#d6ee30]/60 px-1.5 py-0.5 font-mono text-xs font-bold text-[#122922]">{value.kode}</span>
            <span className="ml-2 font-semibold text-[#122922]">{value.uraian}</span>
          </span>
        ) : (
          <span className="text-[#122922]/45">
            {isFilteredByPejabat
              ? `Pilih kode rekening yang diampu oleh ${user.nama}…`
              : 'Pilih kode rekening / Nomor RBA…'}
          </span>
        )}
        <ChevronDown size={16} className="shrink-0 text-[#122922]/50" />
      </button>
      {open && (
        <div className="card absolute z-40 mt-1 w-full border-2 border-[#122922] bg-white shadow-[6px_6px_0_#122922]">
          <div className="relative border-b border-[#122922]/10 bg-[#f7f5ef] p-2">
            <Search size={14} className="absolute left-5 top-4.5 text-[#122922]/45" />
            <input autoFocus className="input !pl-8 bg-white" placeholder="Ketik kode RBA atau nama rekening yang diampu…" value={q} onChange={(e) => setQ(e.target.value)} />
            {isFilteredByPejabat && (
              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-[#d6ee30]/50 px-2.5 py-1 text-[11px] font-bold text-[#122922]">
                <span>Menampilkan khusus rekening yang diampu: {user.nama}</span>
                <span className="font-mono">{list.length} rekening</span>
              </div>
            )}
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-[#122922]/6 py-1">
            {list.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { onPick(r); setOpen(false) }}
                  className="block w-full px-3.5 py-2.5 text-left transition hover:bg-[#d6ee30]/35"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded border border-[#122922]/20 bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3f8f77]">{r.induk_uraian || 'BLUD'}</span>
                    <span className="text-sm font-bold text-[#122922]">{r.uraian}</span>
                  </div>
                  <div className="mt-0.5 flex justify-between font-mono text-xs text-[#122922]/60">
                    <span>{r.kode}</span>
                    <span>Sisa {rp(r.sisa)}</span>
                  </div>
                </button>
              </li>
            ))}
            {list.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-[#122922]/45">
                {isFilteredByPejabat
                  ? `Tidak ada kode rekening yang diampu oleh ${user.nama} sesuai kata kunci ini.`
                  : 'Tidak ditemukan'}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

const STEPS_LANGSUNG = [
  {
    id: 3,
    tag: 'Mode Cepat · Tanpa SP & BAST (< 2 Jt)',
    title: 'Bukti Pengeluaran A2 & Lembar Verifikasi Saja',
    desc: 'Khusus transaksi yang hanya membutuhkan Bukti A2 & Verifikasi tanpa SP & BAST',
    icon: Receipt,
    color: 'bg-[#b5e8a5]',
  },
]

const STEPS_0_10 = [
  {
    id: 1,
    tag: 'Tahap 1 · Pemesanan Barang',
    title: '1. Buat & Cetak Surat Pesanan (SP)',
    desc: 'Input pesanan barang ke penyedia, simpan & cetak SP terlebih dahulu',
    icon: Package,
    color: 'bg-[#d6ee30]',
  },
  {
    id: 2,
    tag: 'Tahap 2 · Setelah Barang Diterima (0–2 Jt & 2–10 Jt)',
    title: '2. Buat BAST, BAPHP, Bukti A2 & Verifikasi',
    desc: 'Lanjutkan saat barang datang untuk mencetak BAST, BAPHP (PPK → KPA), A2 & Verifikasi',
    icon: FileCheck2,
    color: 'bg-[#a9dcf0]',
  },
]

const STEPS_10_50 = [
  {
    id: 10,
    tag: 'Tahap 1 (10–50 Jt) · Dokumen Persiapan PPK',
    title: '1. Spesifikasi Teknis / KAK',
    desc: 'Susun Spektek/KAK (Paket, PPK, ID RUP, Mutu, Spesifikasi Jumlah, Waktu & Pelayanan)',
    icon: FileText,
    color: 'bg-[#d6ee30]',
  },
  {
    id: 12,
    tag: 'Tahap 2 (10–50 Jt) · Harga Perkiraan Sendiri',
    title: '2. Penetapan HPS & Lampiran',
    desc: 'Input Nomor HPS, Tanggal HPS, PPK & Harga Satuan HPS per barang',
    icon: Receipt,
    color: 'bg-[#f6db5b]',
  },
  {
    id: 11,
    tag: 'Tahap 3 (10–50 Jt) · Klarifikasi & Negosiasi',
    title: '3. BA Klarifikasi & Negosiasi',
    desc: 'Pilih penyedia, input Harga Penawaran Penyedia & Harga Hasil Negosiasi',
    icon: Handshake,
    color: 'bg-[#a9dcf0]',
  },
  {
    id: 1,
    tag: 'Tahap 4 (10–50 Jt) · Pemesanan Barang',
    title: '4. Surat Pesanan (SP)',
    desc: 'Cetak Surat Pesanan (SP) ke penyedia berdasarkan harga hasil negosiasi',
    icon: Package,
    color: 'bg-[#d6ee30]',
  },
  {
    id: 2,
    tag: 'Tahap 5 (10–50 Jt) · Serah Terima & Pencairan',
    title: '5. BAST, BAPHP, A2 & Verifikasi',
    desc: 'Setelah barang diterima, cetak BAST, BAPHP (PPK → KPA), A2 & Verifikasi',
    icon: FileCheck2,
    color: 'bg-[#b5e8a5]',
  },
]

const STEPS_50_750 = [
  {
    id: 10,
    tag: 'Tahap 1 (50–750 Jt) · Dokumen Persiapan PPK',
    title: '1. Spesifikasi Teknis / KAK',
    desc: 'Susun Spektek/KAK (Paket, PPK, ID RUP, Mutu, Spesifikasi Jumlah, Waktu & Pelayanan)',
    icon: FileText,
    color: 'bg-[#d6ee30]',
  },
  {
    id: 12,
    tag: 'Tahap 2 (50–750 Jt) · Harga Perkiraan Sendiri',
    title: '2. Penetapan HPS & Lampiran',
    desc: 'Input Nomor HPS, Tanggal HPS, PPK & Harga Satuan HPS per barang',
    icon: Receipt,
    color: 'bg-[#f6db5b]',
  },
  {
    id: 20,
    tag: 'Tahap 3 (50–750 Jt) · Undangan & Jadwal',
    title: '3. Undangan PL & Jadwal',
    desc: 'Undangan Pengadaan Langsung ke Penyedia & Jadwal 5 Tahapan Pengadaan Langsung',
    icon: CalendarRange,
    color: 'bg-[#a9dcf0]',
  },
  {
    id: 21,
    tag: 'Tahap 4 (50–750 Jt) · Evaluasi Penawaran',
    title: '4. Pembukaan & Evaluasi',
    desc: 'BA Pembukaan Dokumen Penawaran & BA Hasil Evaluasi (Administrasi, Teknis, Kualifikasi & Harga)',
    icon: FileCheck,
    color: 'bg-[#b7aef3]',
  },
  {
    id: 11,
    tag: 'Tahap 5 (50–750 Jt) · Klarifikasi & Negosiasi',
    title: '5. Undangan & BA Klarifikasi Nego',
    desc: 'Undangan Klarifikasi & BA Klarifikasi Teknis serta Negosiasi Harga (Pejabat Pengadaan)',
    icon: Handshake,
    color: 'bg-[#f6db5b]',
  },
  {
    id: 22,
    tag: 'Tahap 6 (50–750 Jt) · Penetapan & Laporan',
    title: '6. Penetapan, BAHPL & Laporan',
    desc: 'BA Penetapan Pemenang, Berita Acara Hasil Pengadaan Langsung (BAHPL), Pengumuman, & Laporan ke PPK',
    icon: Award,
    color: 'bg-[#d6ee30]',
  },
  {
    id: 23,
    tag: 'Tahap 7 (50–750 Jt) · Kontrak Pengadaan',
    title: '7. SPPBJ & Kontrak SPK',
    desc: 'Surat Penunjukan (SPPBJ) dari PPK & Surat Perintah Kerja (SPK) beserta Lampiran Rincian Barang',
    icon: PackageCheck,
    color: 'bg-[#a9dcf0]',
  },
  {
    id: 2,
    tag: 'Tahap 8 (50–750 Jt) · Serah Terima & SPJ',
    title: '8. BAST, BAPHP, A2 & Verifikasi',
    desc: 'Penerimaan barang mengacu pada SPK, cetak BAST, BAPHP (PPK → KPA), Bukti A2 & Lembar Verifikasi',
    icon: FileCheck2,
    color: 'bg-[#b5e8a5]',
  },
]

export default function TransaksiForm() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const { user } = useAuth()

  const initMode = searchParams.get('mode')
  useEffect(() => {
    if (id || !['10_50', '50_750', 'spektek', 'hps', 'negosiasi', 'undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(initMode)) return
    nav(`/pengadaan/baru?tier=${['10_50', 'spektek', 'hps', 'negosiasi'].includes(initMode) ? '10_50' : '50_750'}`, { replace: true })
  }, [id, initMode, nav])
  const [step, setStep] = useState(() => {
    if (initMode === '50_750') return 10
    if (initMode === 'undangan') return 20
    if (initMode === 'evaluasi') return 21
    if (initMode === 'penetapan') return 22
    if (initMode === 'kontrak') return 23
    if (initMode === '10_50' || initMode === 'spektek') return 10
    if (initMode === 'hps') return 12
    if (initMode === 'negosiasi') return 11
    if (initMode === 'terima') return 2
    if (initMode === 'langsung') return 3
    return 1
  })
  const [f, setF] = useState(() => {
    const isPlInit = ['50_750', 'undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(initMode)
    const is1050Init = !isPlInit && ['10_50', 'spektek', 'hps', 'negosiasi'].includes(initMode)
    const tInit = initMode === 'langsung' ? 'spj_langsung'
      : (isPlInit && initMode !== '50_750') ? initMode
      : (isPlInit || initMode === '10_50' || initMode === 'spektek') ? 'spektek'
      : initMode === 'hps' ? 'hps'
      : initMode === 'negosiasi' ? 'negosiasi'
      : 'pesanan'
    return {
      ...kosong(),
      mode_pengadaan: isPlInit ? '50_750' : is1050Init ? '10_50' : '0_10',
      tahap: tInit,
    }
  })
  const [rek, setRek] = useState(null)
  const [pejabat, setPejabat] = useState([])
  const [penyediaList, setPenyediaList] = useState([])
  const [set, setSet] = useState(null)
  const [saved, setSaved] = useState(id ? Number(id) : null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState('')
  const [preview, setPreview] = useState(null)
  const [awal, setAwal] = useState(0)
  const [nextNomor, setNextNomor] = useState({
    nextHps: '1286', nextBakn: '1607.a', nextSp: '1607', nextBast: '1631', nextBaphp: '1631.a',
    nextPlUndangan: '2436', nextPlEvaluasi: '2573', nextPlUndanganKlarifikasi: '2578.a',
    nextPlPenetapan: '2656', nextPlLaporan: '2657', nextSppbj: '1769', nextSpk: '2673',
    tahun: '2026'
  })

  const [spekTab, setSpekTab] = useState('barang')
  const [standarSubTab, setStandarSubTab] = useState('mutu')
  const [isLebarSpektek, setIsLebarSpektek] = useState(false)
  const [hint02, setHint02] = useState(searchParams.get('mode') === '0_2')

  const isLangsung = f.tahap === 'spj_langsung' || step === 3
  const is50750 = !isLangsung && (f.mode_pengadaan === '50_750' || [20, 21, 22, 23].includes(step))
  const is1050 = !isLangsung && !is50750 && (f.mode_pengadaan === '10_50' || [10, 12, 11].includes(step))

  const tahunBerjalan = useMemo(() => {
    const dt = f.spk_tanggal || f.sp_tanggal || f.hps_tanggal || f.tanggal || ''
    return dt.slice(0, 4) || set?.tahun || String(new Date().getFullYear())
  }, [f.spk_tanggal, f.sp_tanggal, f.hps_tanggal, f.tanggal, set])

  // Load master data & auto-numbering
  useEffect(() => {
    Promise.all([
      api('/pejabat'),
      api('/pengaturan'),
      api('/penyedia'),
      api('/penomoran/next'),
    ]).then(([p, s, vList, nomor]) => {
      const aktifP = p.filter((x) => x.aktif)
      setPejabat(aktifP)
      setSet(s)
      setPenyediaList(vList)
      setNextNomor(nomor)

      if (!id) {
        let defaultPengadaanId = ''
        if (user?.role === 'pejabat_pengadaan') {
          if (user.pejabat_id) defaultPengadaanId = user.pejabat_id
          else {
            const match = aktifP.find((x) => x.peran === 'PENGADAAN' && x.nama.toLowerCase() === user.nama.toLowerCase())
            if (match) defaultPengadaanId = match.id
          }
        }
        const defaultPengurusId = s.pengurus_barang_id || aktifP.find((x) => x.peran === 'PENGURUS_BARANG')?.id || ''

        const isLangsung = searchParams.get('mode') === 'langsung'
        const isPl = ['50_750', 'undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(searchParams.get('mode'))
        const mode1050 = !isPl && ['10_50', 'spektek', 'hps', 'negosiasi'].includes(searchParams.get('mode'))
        const baseEvaluasi = nomor.nextPlEvaluasi || '2573'
        const basePenetapan = nomor.nextPlPenetapan || '2656'
        const baseSpk = nomor.nextSpk || '2673'
        const baseSppbj = nomor.nextSppbj || '1769'
        const baseUndangan = nomor.nextPlUndangan || '2436'
        const baseUndKlar = nomor.nextPlUndanganKlarifikasi || '2578.a'
        const baseLaporan = nomor.nextPlLaporan || '2657'

        setF((x) => ({
          ...x,
          mode_pengadaan: isPl ? '50_750' : mode1050 ? '10_50' : x.mode_pengadaan,
          tahap: isLangsung ? 'spj_langsung' : (isPl || mode1050) ? 'spektek' : 'pesanan',
          kpa_id: s.kpa_id || '',
          bendahara_id: s.bendahara_id || '',
          verifikator_id: s.verifikator_id || '',
          pengurus_barang_id: defaultPengurusId || x.pengurus_barang_id,
          pengadaan_id: defaultPengadaanId || x.pengadaan_id,
          hps_no_urut: (isPl || mode1050) ? nomor.nextHps : x.hps_no_urut,
          hps_nomor: (isPl || mode1050) ? `000.3.2/${nomor.nextHps}/05.1.2/${nomor.tahun}` : x.hps_nomor,
          bakn_no_urut: (isPl || mode1050) ? nomor.nextBakn : x.bakn_no_urut,
          bakn_nomor: (isPl || mode1050) ? `000.3.2/${nomor.nextBakn}/05.1.2/${nomor.tahun}` : x.bakn_nomor,
          sp_no_urut: (isLangsung || isPl) ? '' : nomor.nextSp,
          sp_nomor: (isLangsung || isPl) ? '' : `000.3.2/${nomor.nextSp}/05.1.2/${nomor.tahun}`,
          spk_no_urut: isPl ? baseSpk : '',
          spk_nomor: isPl ? `000.3.2/${baseSpk}/05.1.2/${nomor.tahun}` : '',
          spk_tanggal: hariIni(),
          bast_no_urut: '',
          bast_nomor: '',
          baphp_no_urut: '',
          baphp_nomor: '',
          pl: {
            ...defaultPl(nomor.tahun),
            undangan_no_urut: baseUndangan,
            undangan_nomor: `000.3.2/${baseUndangan}/05.1.2/${nomor.tahun}`,
            pembukaan_no_urut: `${baseEvaluasi}.b`,
            pembukaan_nomor: `000.3.2/${baseEvaluasi}.b/05.1.2/${nomor.tahun}`,
            evaluasi_no_urut: `${baseEvaluasi}.c`,
            evaluasi_nomor: `000.3.2/${baseEvaluasi}.c/05.1.2/${nomor.tahun}`,
            undangan_klarifikasi_no_urut: baseUndKlar,
            undangan_klarifikasi_nomor: `000.3.2/${baseUndKlar}/05.1.2/${nomor.tahun}`,
            penetapan_no_urut: basePenetapan,
            penetapan_nomor: `000.3.2/${basePenetapan}/05.1.2/${nomor.tahun}`,
            bahpl_no_urut: `${basePenetapan}.a`,
            bahpl_nomor: `000.3.2/${basePenetapan}.a/05.1.2/${nomor.tahun}`,
            pengumuman_no_urut: `${basePenetapan}.b`,
            pengumuman_nomor: `000.3.2/${basePenetapan}.b/05.1.2/${nomor.tahun}`,
            laporan_no_urut: baseLaporan,
            laporan_nomor: `000.3.2/${baseLaporan}/05.1.2/${nomor.tahun}`,
            sppbj_no_urut: baseSppbj,
            sppbj_nomor: `000.3.2/${baseSppbj}/05.1.2/${nomor.tahun}`,
            spk_no_urut: baseSpk,
            spk_nomor: `000.3.2/${baseSpk}/05.1.2/${nomor.tahun}`,
          },
        }))
      }
    })
  }, [id, user, searchParams])

  // Load existing transaction when editing
  useEffect(() => {
    if (!id) return
    Promise.all([api('/transaksi/' + id), api('/penomoran/next'), api('/pengaturan'), api('/pejabat')]).then(async ([t, nomor, s, pList]) => {
      const loadedItems = Array.isArray(t.items) && t.items.length > 0
        ? t.items.map((it) => {
            const hs = Number(it.harga_satuan) || 0
            return {
              jenis_barang: it.jenis_barang,
              satuan: it.satuan || 'Unit',
              kuantitas: Number(it.kuantitas) || 1,
              harga_hps: Number(it.harga_hps) || hs,
              harga_penawaran: Number(it.harga_penawaran) > 0 ? Number(it.harga_penawaran) : '',
              harga_satuan: hs,
            }
          })
        : [{ jenis_barang: t.uraian || '', satuan: 'Paket', kuantitas: 1, harga_hps: t.kotor || 0, harga_penawaran: t.penawaran_total || '', harga_satuan: t.kotor || 0 }]

      let parsedSpektek = defaultSpektek(t.rek_uraian || t.uraian, loadedItems)
      if (t.spektek_json) {
        try {
          parsedSpektek = { ...parsedSpektek, ...JSON.parse(t.spektek_json) }
        } catch {}
      }

      let parsedPl = defaultPl(nomor.tahun || '2026')
      if (t.pl_json) {
        try {
          parsedPl = { ...parsedPl, ...JSON.parse(t.pl_json) }
        } catch {}
      }

      const isLangsung = t.tahap === 'spj_langsung'
      const qMode = searchParams.get('mode')
      const isPlLoaded = !isLangsung && (t.mode_pengadaan === '50_750' || ['undangan', 'evaluasi', 'penetapan', 'kontrak'].includes(t.tahap) || qMode === '50_750')
      const mode1050 = !isLangsung && !isPlLoaded && (t.mode_pengadaan === '10_50' || ['spektek', 'hps', 'spektek_hps', 'negosiasi'].includes(t.tahap) || qMode === '10_50')
      const wantTerima = !isLangsung && (qMode === 'terima' || t.tahap === 'selesai' || !!t.bast_nomor)

      const hpsUrut = t.hps_no_urut || ((isPlLoaded || mode1050) ? nomor.nextHps : '')
      const hpsNomor = t.hps_nomor || (hpsUrut ? `000.3.2/${hpsUrut}/05.1.2/${nomor.tahun}` : '')
      const spUrut = (isPlLoaded || isLangsung) ? '' : (t.sp_no_urut || nomor.nextSp)
      const spNomor = (isPlLoaded || isLangsung) ? '' : (t.sp_nomor || (spUrut ? `000.3.2/${spUrut}/05.1.2/${nomor.tahun}` : ''))
      const baknUrut = t.bakn_no_urut || ((isPlLoaded || mode1050) ? (spUrut ? `${spUrut}.a` : (nomor.nextBakn || '1607.a')) : '')
      const baknNomor = t.bakn_nomor || (baknUrut ? `000.3.2/${baknUrut}/05.1.2/${nomor.tahun}` : '')
      const spkUrut = isPlLoaded ? (t.spk_no_urut || parsedPl.spk_no_urut || nomor.nextSpk || '2673') : ''
      const spkNomor = isPlLoaded ? (t.spk_nomor || parsedPl.spk_nomor || `000.3.2/${spkUrut}/05.1.2/${nomor.tahun}`) : ''
      const t02 = t.mode_pengadaan === '0_10' && Number(t.kotor) > 0 && Number(t.kotor) <= 2000000
      const bastUrut = t02 ? '' : (t.bast_no_urut || (wantTerima ? nomor.nextBast : ''))
      const bastNomor = t.bast_nomor || (bastUrut ? `000.3.2/${bastUrut}/05.1.2/${nomor.tahun}` : '')
      const baphpUrut = t.baphp_no_urut || (wantTerima ? (t02 ? nomor.nextBast : `${bastUrut || nomor.nextBast}.a`) : '')
      const baphpNomor = t.baphp_nomor || (baphpUrut ? `000.3.2/${baphpUrut}/05.1.2/${nomor.tahun}` : '')
      const defaultPengurusId = t.pengurus_barang_id || s.pengurus_barang_id || pList.find((x) => x.peran === 'PENGURUS_BARANG' && x.aktif)?.id || ''

      if (['10_50', '50_750'].includes(t.mode_pengadaan)) { nav(`/pengadaan/${id}`, { replace: true }); return }
      setF({
        ...kosong(),
        ...t,
        penyedia: t.penyedia === '-' ? '' : (t.penyedia || ''),
        mode_pengadaan: isPlLoaded ? '50_750' : mode1050 ? '10_50' : '0_10',
        spektek: parsedSpektek,
        pl: {
          ...defaultPl(nomor.tahun),
          ...parsedPl,
          spk_no_urut: spkUrut,
          spk_nomor: spkNomor,
        },
        pengurus_barang_id: defaultPengurusId,
        spk_no_urut: spkUrut,
        spk_nomor: spkNomor,
        spk_tanggal: t.spk_tanggal || parsedPl.spk_tanggal || parsedPl.jadwal?.spk_tgl || t.tanggal,
        hps_no_urut: hpsUrut,
        hps_nomor: hpsNomor,
        hps_tanggal: t.hps_tanggal || t.sp_tanggal || t.tanggal,
        bakn_no_urut: baknUrut,
        bakn_nomor: baknNomor,
        bakn_tanggal: t.bakn_tanggal || t.sp_tanggal || t.tanggal,
        penawaran_total: Number(t.penawaran_total) || 0,
        bakn_hasil_teknis: t.bakn_hasil_teknis || 'Sesuai - Ada Perubahan',
        sp_no_urut: spUrut,
        sp_nomor: spNomor,
        sp_tanggal: t.sp_tanggal || t.tanggal,
        sp_tgl_kirim: t.sp_tgl_kirim || t.tanggal,
        bast_no_urut: bastUrut,
        bast_nomor: bastNomor,
        bast_tanggal: t.bast_tanggal || t.tanggal,
        baphp_no_urut: baphpUrut,
        baphp_nomor: baphpNomor,
        baphp_tanggal: t.baphp_tanggal || t.bast_tanggal || t.tanggal,
        ppn_aktif: !!t.ppn_aktif,
        pph_aktif: !!t.pph_aktif,
        items: loadedItems,
      })

      if (isLangsung) setStep(3)
      else if (qMode === 'spektek' || t.tahap === 'spektek') setStep(10)
      else if (qMode === 'hps' || t.tahap === 'hps' || t.tahap === 'spektek_hps') setStep(12)
      else if (qMode === 'undangan' || t.tahap === 'undangan') setStep(20)
      else if (qMode === 'evaluasi' || t.tahap === 'evaluasi') setStep(21)
      else if (qMode === 'negosiasi' || t.tahap === 'negosiasi') setStep(11)
      else if (qMode === 'penetapan' || t.tahap === 'penetapan') setStep(22)
      else if (qMode === 'kontrak' || t.tahap === 'kontrak') setStep(23)
      else if (qMode === 'sp') setStep(1)
      else if (qMode === 'terima' || t.tahap === 'selesai') setStep(2)
      else setStep(isPlLoaded ? 10 : 1)

      setAwal(t.kotor)
      const r = (await api('/rekening?q=' + encodeURIComponent(t.rek_kode))).find((x) => x.id === t.rekening_id)
      setRek(r)
    })
  }, [id, searchParams])

  const upd = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const updSpek = (k, v) => setF((x) => ({ ...x, spektek: { ...(x.spektek || defaultSpektek()), [k]: v } }))
  const updPl = (k, v) => setF((x) => ({ ...x, pl: { ...(x.pl || defaultPl(tahunBerjalan)), [k]: v } }))
  const updJadwal = (k, v) => setF((x) => {
    const prevPl = x.pl || defaultPl(tahunBerjalan)
    const prevJadwal = prevPl.jadwal || {}
    return {
      ...x,
      pl: {
        ...prevPl,
        jadwal: { ...prevJadwal, [k]: v },
      },
    }
  })

  const ubahKategoriAlur = (modeDipilih) => {
    let targetMode = modeDipilih
    if (modeDipilih === '0_2' || modeDipilih === '2_10') { setHint02(modeDipilih === '0_2'); targetMode = '0_10' }
    if (targetMode === 'langsung') {
      setF((x) => ({
        ...x,
        mode_pengadaan: '0_10',
        tahap: 'spj_langsung',
      }))
      setStep(3)
    } else if (targetMode === '50_750') {
      setF((x) => {
        const th = tahunBerjalan
        const baseEvaluasi = nextNomor.nextPlEvaluasi || '2573'
        const basePenetapan = nextNomor.nextPlPenetapan || '2656'
        const baseSpk = nextNomor.nextSpk || '2673'
        const plExisting = x.pl || defaultPl(th)
        return {
          ...x,
          mode_pengadaan: '50_750',
          tahap: x.tahap === 'selesai' ? 'selesai' : (x.tahap || 'spektek'),
          spk_no_urut: x.spk_no_urut || baseSpk,
          spk_nomor: x.spk_nomor || `000.3.2/${baseSpk}/05.1.2/${th}`,
          spk_tanggal: x.spk_tanggal || x.tanggal || hariIni(),
          hps_no_urut: x.hps_no_urut || nextNomor.nextHps || '1286',
          hps_nomor: x.hps_nomor || `000.3.2/${x.hps_no_urut || nextNomor.nextHps || '1286'}/05.1.2/${th}`,
          bakn_no_urut: x.bakn_no_urut || nextNomor.nextBakn || `${x.sp_no_urut || '1607'}.a`,
          bakn_nomor: x.bakn_nomor || `000.3.2/${x.bakn_no_urut || nextNomor.nextBakn || '1607.a'}/05.1.2/${th}`,
          pl: {
            ...plExisting,
            undangan_no_urut: plExisting.undangan_no_urut || nextNomor.nextPlUndangan || '2436',
            undangan_nomor: plExisting.undangan_nomor || `000.3.2/${nextNomor.nextPlUndangan || '2436'}/05.1.2/${th}`,
            pembukaan_no_urut: plExisting.pembukaan_no_urut || `${baseEvaluasi}.b`,
            pembukaan_nomor: plExisting.pembukaan_nomor || `000.3.2/${baseEvaluasi}.b/05.1.2/${th}`,
            evaluasi_no_urut: plExisting.evaluasi_no_urut || `${baseEvaluasi}.c`,
            evaluasi_nomor: plExisting.evaluasi_nomor || `000.3.2/${baseEvaluasi}.c/05.1.2/${th}`,
            undangan_klarifikasi_no_urut: plExisting.undangan_klarifikasi_no_urut || nextNomor.nextPlUndanganKlarifikasi || '2578.a',
            undangan_klarifikasi_nomor: plExisting.undangan_klarifikasi_nomor || `000.3.2/${nextNomor.nextPlUndanganKlarifikasi || '2578.a'}/05.1.2/${th}`,
            penetapan_no_urut: plExisting.penetapan_no_urut || basePenetapan,
            penetapan_nomor: plExisting.penetapan_nomor || `000.3.2/${basePenetapan}/05.1.2/${th}`,
            bahpl_no_urut: plExisting.bahpl_no_urut || `${basePenetapan}.a`,
            bahpl_nomor: plExisting.bahpl_nomor || `000.3.2/${basePenetapan}.a/05.1.2/${th}`,
            pengumuman_no_urut: plExisting.pengumuman_no_urut || `${basePenetapan}.b`,
            pengumuman_nomor: plExisting.pengumuman_nomor || `000.3.2/${basePenetapan}.b/05.1.2/${th}`,
            laporan_no_urut: plExisting.laporan_no_urut || nextNomor.nextPlLaporan || '2657',
            laporan_nomor: plExisting.laporan_nomor || `000.3.2/${nextNomor.nextPlLaporan || '2657'}/05.1.2/${th}`,
            sppbj_no_urut: plExisting.sppbj_no_urut || nextNomor.nextSppbj || '1769',
            sppbj_nomor: plExisting.sppbj_nomor || `000.3.2/${nextNomor.nextSppbj || '1769'}/05.1.2/${th}`,
            spk_no_urut: x.spk_no_urut || baseSpk,
            spk_nomor: x.spk_nomor || `000.3.2/${baseSpk}/05.1.2/${th}`,
          },
          spektek: {
            ...defaultSpektek(rek?.uraian, x.items),
            ...(x.spektek || {}),
            paket_pengadaan: x.spektek?.paket_pengadaan || rek?.uraian || 'Belanja Pengadaan Langsung',
          },
        }
      })
      if (![10, 12, 20, 21, 11, 22, 23, 2].includes(step)) setStep(10)
    } else if (targetMode === '10_50') {
      setF((x) => {
        const hpsU = x.hps_no_urut || nextNomor.nextHps || '1286'
        const spU = x.sp_no_urut || nextNomor.nextSp || '1607'
        const baknU = x.bakn_no_urut || `${spU}.a`
        return {
          ...x,
          mode_pengadaan: '10_50',
          tahap: x.tahap === 'selesai' ? 'selesai' : (x.tahap || 'spektek'),
          hps_no_urut: hpsU,
          hps_nomor: x.hps_nomor || `000.3.2/${hpsU}/05.1.2/${tahunBerjalan}`,
          bakn_no_urut: baknU,
          bakn_nomor: x.bakn_nomor || `000.3.2/${baknU}/05.1.2/${tahunBerjalan}`,
          sp_no_urut: spU,
          sp_nomor: x.sp_nomor || `000.3.2/${spU}/05.1.2/${tahunBerjalan}`,
          spektek: {
            ...defaultSpektek(rek?.uraian, x.items),
            ...(x.spektek || {}),
            paket_pengadaan: x.spektek?.paket_pengadaan || rek?.uraian || 'Belanja Modal Peralatan Komputer',
          },
        }
      })
      if (![10, 12, 11, 1, 2].includes(step)) setStep(10)
      else if (step === 1 && !saved) setStep(10)
    } else {
      setF((x) => ({
        ...x,
        mode_pengadaan: '0_10',
        tahap: x.tahap === 'spj_langsung' ? 'pesanan' : x.tahap === 'selesai' ? 'selesai' : 'pesanan',
      }))
      if ([10, 12, 11, 20, 21, 22, 23, 3].includes(step)) setStep(1)
    }
  }

  const ubahNoUrutHps = (urut) => {
    setF((x) => ({
      ...x,
      hps_no_urut: urut,
      hps_nomor: `000.3.2/${urut || '____'}/05.1.2/${(x.hps_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan}`,
    }))
  }

  const ubahNoUrutBakn = (urut) => {
    setF((x) => ({
      ...x,
      bakn_no_urut: urut,
      bakn_nomor: `000.3.2/${urut || '____'}/05.1.2/${(x.bakn_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan}`,
    }))
  }

  const ubahNoUrutSp = (urut) => {
    setF((x) => {
      const th = (x.sp_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      const autoBakn = !x.bakn_no_urut || x.bakn_no_urut === `${x.sp_no_urut}.a`
      const nextBakn = autoBakn ? (urut ? `${urut}.a` : '') : x.bakn_no_urut
      return {
        ...x,
        sp_no_urut: urut,
        sp_nomor: `000.3.2/${urut || '____'}/05.1.2/${th}`,
        bakn_no_urut: nextBakn,
        bakn_nomor: nextBakn ? `000.3.2/${nextBakn}/05.1.2/${th}` : x.bakn_nomor,
      }
    })
  }

  const ubahNoUrutUndanganPl = (urut) => {
    setF((x) => {
      const th = (x.pl?.undangan_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          undangan_no_urut: urut,
          undangan_nomor: `000.3.2/${urut || '____'}/05.1.2/${th}`,
        },
      }
    })
  }

  const ubahBaseNoUrutEvaluasi = (base) => {
    setF((x) => {
      const th = (x.pl?.evaluasi_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      const pU = base ? `${base}.b` : ''
      const eU = base ? `${base}.c` : ''
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          pembukaan_no_urut: pU,
          pembukaan_nomor: pU ? `000.3.2/${pU}/05.1.2/${th}` : '',
          evaluasi_no_urut: eU,
          evaluasi_nomor: eU ? `000.3.2/${eU}/05.1.2/${th}` : '',
        },
      }
    })
  }

  const ubahNoUrutUndanganKlarifikasi = (urut) => {
    setF((x) => {
      const th = (x.pl?.undangan_klarifikasi_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          undangan_klarifikasi_no_urut: urut,
          undangan_klarifikasi_nomor: `000.3.2/${urut || '____'}/05.1.2/${th}`,
        },
      }
    })
  }

  const ubahBaseNoUrutPenetapan = (base) => {
    setF((x) => {
      const th = (x.pl?.penetapan_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      const penU = base || ''
      const bahU = base ? `${base}.a` : ''
      const pengU = base ? `${base}.b` : ''
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          penetapan_no_urut: penU,
          penetapan_nomor: penU ? `000.3.2/${penU}/05.1.2/${th}` : '',
          bahpl_no_urut: bahU,
          bahpl_nomor: bahU ? `000.3.2/${bahU}/05.1.2/${th}` : '',
          pengumuman_no_urut: pengU,
          pengumuman_nomor: pengU ? `000.3.2/${pengU}/05.1.2/${th}` : '',
        },
      }
    })
  }

  const ubahNoUrutLaporanPl = (urut) => {
    setF((x) => {
      const th = (x.pl?.laporan_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          laporan_no_urut: urut,
          laporan_nomor: `000.3.2/${urut || '____'}/05.1.2/${th}`,
        },
      }
    })
  }

  const ubahNoUrutSppbj = (urut) => {
    setF((x) => {
      const th = (x.pl?.sppbj_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      return {
        ...x,
        pl: {
          ...(x.pl || defaultPl(th)),
          sppbj_no_urut: urut,
          sppbj_nomor: `000.3.2/${urut || '____'}/05.1.2/${th}`,
        },
      }
    })
  }

  const ubahNoUrutSpk = (urut) => {
    setF((x) => {
      const th = (x.spk_tanggal || x.pl?.spk_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      const no = `000.3.2/${urut || '____'}/05.1.2/${th}`
      return {
        ...x,
        spk_no_urut: urut,
        spk_nomor: no,
        pl: {
          ...(x.pl || defaultPl(th)),
          spk_no_urut: urut,
          spk_nomor: no,
        },
      }
    })
  }

  const ubahNoUrutBast = (urut) => {
    setF((x) => {
      const th = (x.bast_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan
      const autoBaphp = !x.baphp_no_urut || x.baphp_no_urut === `${x.bast_no_urut}.a`
      const nextBaphpUrut = autoBaphp ? (urut ? `${urut}.a` : '') : x.baphp_no_urut
      return {
        ...x,
        bast_no_urut: urut,
        bast_nomor: urut ? `000.3.2/${urut}/05.1.2/${th}` : '',
        baphp_no_urut: nextBaphpUrut,
        baphp_nomor: nextBaphpUrut ? `000.3.2/${nextBaphpUrut}/05.1.2/${th}` : '',
      }
    })
  }

  const ubahNoUrutBaphp = (urut) => {
    setF((x) => ({
      ...x,
      baphp_no_urut: urut,
      baphp_nomor: urut ? `000.3.2/${urut}/05.1.2/${(x.baphp_tanggal || x.bast_tanggal || x.tanggal || '').slice(0, 4) || tahunBerjalan}` : '',
    }))
  }

  const pilihModeStep = (modeId) => {
    if (modeId === 10) {
      setF((x) => ({
        ...x,
        mode_pengadaan: x.mode_pengadaan === '50_750' ? '50_750' : '10_50',
        tahap: x.tahap === 'selesai' ? 'selesai' : (['hps', 'spektek_hps', 'undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan'].includes(x.tahap) ? x.tahap : 'spektek'),
      }))
      setStep(10)
    } else if (modeId === 12) {
      setF((x) => {
        const hpsU = x.hps_no_urut || nextNomor.nextHps || '1286'
        return {
          ...x,
          mode_pengadaan: x.mode_pengadaan === '50_750' ? '50_750' : '10_50',
          tahap: ['undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan', 'selesai'].includes(x.tahap) ? x.tahap : 'hps',
          hps_no_urut: hpsU,
          hps_nomor: x.hps_nomor || `000.3.2/${hpsU}/05.1.2/${tahunBerjalan}`,
        }
      })
      setStep(12)
    } else if (modeId === 20) {
      setF((x) => {
        const undU = x.pl?.undangan_no_urut || nextNomor.nextPlUndangan || '2436'
        return {
          ...x,
          mode_pengadaan: '50_750',
          tahap: ['evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(x.tahap) ? x.tahap : 'undangan',
          pl: {
            ...x.pl,
            undangan_no_urut: undU,
            undangan_nomor: x.pl?.undangan_nomor || `000.3.2/${undU}/05.1.2/${tahunBerjalan}`,
          },
        }
      })
      setStep(20)
    } else if (modeId === 21) {
      setF((x) => {
        const base = nextNomor.nextPlEvaluasi || '2573'
        return {
          ...x,
          mode_pengadaan: '50_750',
          tahap: ['negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(x.tahap) ? x.tahap : 'evaluasi',
          pl: {
            ...x.pl,
            pembukaan_no_urut: x.pl?.pembukaan_no_urut || `${base}.b`,
            pembukaan_nomor: x.pl?.pembukaan_nomor || `000.3.2/${base}.b/05.1.2/${tahunBerjalan}`,
            evaluasi_no_urut: x.pl?.evaluasi_no_urut || `${base}.c`,
            evaluasi_nomor: x.pl?.evaluasi_nomor || `000.3.2/${base}.c/05.1.2/${tahunBerjalan}`,
          },
        }
      })
      setStep(21)
    } else if (modeId === 11) {
      setF((x) => {
        const spU = x.sp_no_urut || nextNomor.nextSp || '1607'
        const baknU = x.bakn_no_urut || `${spU}.a`
        const undKlarU = x.pl?.undangan_klarifikasi_no_urut || nextNomor.nextPlUndanganKlarifikasi || '2578.a'
        return {
          ...x,
          mode_pengadaan: x.mode_pengadaan === '50_750' ? '50_750' : '10_50',
          tahap: ['penetapan', 'kontrak', 'pesanan', 'selesai'].includes(x.tahap) ? x.tahap : 'negosiasi',
          bakn_no_urut: baknU,
          bakn_nomor: x.bakn_nomor || `000.3.2/${baknU}/05.1.2/${tahunBerjalan}`,
          pl: {
            ...x.pl,
            undangan_klarifikasi_no_urut: undKlarU,
            undangan_klarifikasi_nomor: x.pl?.undangan_klarifikasi_nomor || `000.3.2/${undKlarU}/05.1.2/${tahunBerjalan}`,
          },
        }
      })
      setStep(11)
    } else if (modeId === 22) {
      setF((x) => {
        const basePen = nextNomor.nextPlPenetapan || '2656'
        const baseLap = nextNomor.nextPlLaporan || '2657'
        return {
          ...x,
          mode_pengadaan: '50_750',
          tahap: ['kontrak', 'selesai'].includes(x.tahap) ? x.tahap : 'penetapan',
          pl: {
            ...x.pl,
            penetapan_no_urut: x.pl?.penetapan_no_urut || basePen,
            penetapan_nomor: x.pl?.penetapan_nomor || `000.3.2/${basePen}/05.1.2/${tahunBerjalan}`,
            bahpl_no_urut: x.pl?.bahpl_no_urut || `${basePen}.a`,
            bahpl_nomor: x.pl?.bahpl_nomor || `000.3.2/${basePen}.a/05.1.2/${tahunBerjalan}`,
            pengumuman_no_urut: x.pl?.pengumuman_no_urut || `${basePen}.b`,
            pengumuman_nomor: x.pl?.pengumuman_nomor || `000.3.2/${basePen}.b/05.1.2/${tahunBerjalan}`,
            laporan_no_urut: x.pl?.laporan_no_urut || baseLap,
            laporan_nomor: x.pl?.laporan_nomor || `000.3.2/${baseLap}/05.1.2/${tahunBerjalan}`,
          },
        }
      })
      setStep(22)
    } else if (modeId === 23) {
      setF((x) => {
        const baseSppbj = nextNomor.nextSppbj || '1769'
        const baseSpk = x.spk_no_urut || nextNomor.nextSpk || '2673'
        return {
          ...x,
          mode_pengadaan: '50_750',
          tahap: x.tahap === 'selesai' ? 'selesai' : 'kontrak',
          spk_no_urut: baseSpk,
          spk_nomor: x.spk_nomor || `000.3.2/${baseSpk}/05.1.2/${tahunBerjalan}`,
          pl: {
            ...x.pl,
            sppbj_no_urut: x.pl?.sppbj_no_urut || baseSppbj,
            sppbj_nomor: x.pl?.sppbj_nomor || `000.3.2/${baseSppbj}/05.1.2/${tahunBerjalan}`,
            spk_no_urut: baseSpk,
            spk_nomor: `000.3.2/${baseSpk}/05.1.2/${tahunBerjalan}`,
          },
        }
      })
      setStep(23)
    } else if (modeId === 3) {
      setF((x) => ({ ...x, mode_pengadaan: '0_10', tahap: 'spj_langsung' }))
      setStep(3)
    } else if (modeId === 2) {
      setF((x) => {
        const urutSp = x.sp_no_urut || nextNomor.nextSp || '1607'
        const urutBast = is02 ? '' : (x.bast_no_urut || nextNomor.nextBast || '1631')
        const urutBaphp = x.baphp_no_urut || (is02 ? (nextNomor.nextBast || '1631') : `${urutBast}.a`)
        return {
          ...x,
          tahap: 'selesai',
          sp_no_urut: urutSp,
          sp_nomor: x.sp_nomor || `000.3.2/${urutSp}/05.1.2/${tahunBerjalan}`,
          bast_no_urut: urutBast,
          bast_nomor: urutBast ? `000.3.2/${urutBast}/05.1.2/${tahunBerjalan}` : '',
          bast_tanggal: x.bast_tanggal || hariIni(),
          baphp_no_urut: urutBaphp,
          baphp_nomor: `000.3.2/${urutBaphp}/05.1.2/${tahunBerjalan}`,
          baphp_tanggal: x.baphp_tanggal || x.bast_tanggal || hariIni(),
        }
      })
      setStep(2)
    } else {
      setF((x) => {
        const urutSp = x.sp_no_urut || nextNomor.nextSp || '1607'
        return {
          ...x,
          tahap: x.tahap === 'selesai' ? 'selesai' : 'pesanan',
          sp_no_urut: urutSp,
          sp_nomor: x.sp_nomor || `000.3.2/${urutSp}/05.1.2/${tahunBerjalan}`,
        }
      })
      setStep(1)
    }
  }

  // Ketika pilih kode rekening, JANGAN menimpa "uraian" (Yaitu untuk pembayaran), tetapi sinkronkan Paket Pengadaan di Spektek
  const pilihRek = (r) => {
    setRek(r)
    const ppkObj = pejabat.find((p) => p.id === r.ppkom_id)
    setF((x) => ({
      ...x,
      rekening_id: r.id,
      ppkom_id: r.ppkom_id || x.ppkom_id || '',
      pptk_id: r.pptk_id || x.pptk_id || '',
      pengadaan_id: (user?.role === 'pejabat_pengadaan' && user?.pejabat_id) ? user.pejabat_id : (r.pengadaan_id || x.pengadaan_id || ''),
      ppk_jabatan: ppkObj?.jabatan || x.ppk_jabatan || 'Kepala Seksi Informasi dan Pemasaran',
      ppk_alamat: ppkObj?.alamat || x.ppk_alamat || 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong',
      spektek: {
        ...(x.spektek || defaultSpektek(r.uraian, x.items)),
        paket_pengadaan: r.uraian || x.spektek?.paket_pengadaan || '',
      },
    }))
  }

  const pilihPenyediaDariDaftar = (idVendor) => {
    const v = penyediaList.find((x) => String(x.id) === String(idVendor))
    if (!v) {
      setF((x) => ({ ...x, penyedia_id: '' }))
      return
    }
    setF((x) => ({
      ...x,
      penyedia_id: v.id,
      penyedia: v.nama,
      penyedia_pimpinan: v.pimpinan || '',
      penyedia_jabatan: v.jabatan || 'Direktur',
      penyedia_alamat: v.alamat || '',
      penyedia_npwp: v.npwp || '',
    }))
  }

  const totalHpsItems = useMemo(
    () => f.items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_hps || it.harga_satuan) || 0)), 0),
    [f.items]
  )
  const sumPenawaranItems = useMemo(
    () => f.items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_penawaran) || 0)), 0),
    [f.items]
  )
  const totalPenawaranEfektif = Number(f.penawaran_total) || sumPenawaranItems || 0
  const totalItems = useMemo(
    () => f.items.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_satuan || it.harga_hps) || 0)), 0),
    [f.items]
  )

  const updItem = (idx, key, val) => {
    setF((x) => {
      const next = x.items.map((it, i) => {
        if (i !== idx) return it
        const updated = { ...it, [key]: val }
        // Saat mengisi harga_hps, JANGAN menyalin ke harga_penawaran (karena Harga Penawaran Penyedia harus diinput sendiri di BA Klarifikasi).
        // Untuk harga_satuan (negosiasi), hanya isi default jika masih kosong.
        if (key === 'harga_hps') {
          if (!updated.harga_satuan || Number(updated.harga_satuan) === Number(it.harga_hps)) updated.harga_satuan = val
        }
        if (key === 'harga_satuan' && !updated.harga_hps) {
          updated.harga_hps = val
        }
        return updated
      })
      const sumNego = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_satuan || it.harga_hps) || 0)), 0)
      const sumHps = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_hps || it.harga_satuan) || 0)), 0)
      const sumPen = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_penawaran) || 0)), 0)
      return {
        ...x,
        items: next,
        hps_total: sumHps,
        penawaran_total: key === 'harga_penawaran' || key === 'kuantitas' ? (sumPen > 0 ? sumPen : x.penawaran_total) : x.penawaran_total,
        kotor: sumNego > 0 ? sumNego : x.kotor,
      }
    })
  }

  const tambahItem = () => setF((x) => ({ ...x, items: [...x.items, itemBaru()] }))
  const hapusItem = (idx) => setF((x) => {
    if (x.items.length <= 1) return x
    const next = x.items.filter((_, i) => i !== idx)
    const sumNego = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_satuan || it.harga_hps) || 0)), 0)
    const sumHps = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_hps || it.harga_satuan) || 0)), 0)
    const sumPen = next.reduce((s, it) => s + Math.round((Number(it.kuantitas) || 0) * (Number(it.harga_penawaran) || 0)), 0)
    return { ...x, items: next, hps_total: sumHps, penawaran_total: sumPen, kotor: sumNego > 0 ? sumNego : x.kotor }
  })

  const isiTemplateSpektekOtomatis = () => {
    const tmpl = defaultSpektek(rek?.uraian || f.spektek?.paket_pengadaan || 'Belanja Modal Peralatan Komputer', f.items)
    setF((x) => ({
      ...x,
      spektek: {
        ...tmpl,
        id_rup: x.spektek?.id_rup || '62736023',
        tanggal: x.spektek?.tanggal || x.hps_tanggal || hariIni(),
      },
    }))
  }

  const isiContohPdf = () => {
    const itemsSrc = is50750 ? CONTOH_ITEMS_50_750 : (is1050 ? CONTOH_ITEMS_10_50 : CONTOH_ITEMS_PDF)
    const sumNego = itemsSrc.reduce((s, it) => s + it.kuantitas * it.harga_satuan, 0)
    const sumHps = itemsSrc.reduce((s, it) => s + it.kuantitas * it.harga_hps, 0)
    const sumPen = itemsSrc.reduce((s, it) => s + it.kuantitas * it.harga_penawaran, 0)
    const surya = penyediaList.find((v) => v.nama.toLowerCase().includes('surya globe'))
    const multiton = penyediaList.find((v) => v.nama.toLowerCase().includes('multiton'))

    if (is50750) {
      setF((x) => ({
        ...x,
        penyedia_id: multiton?.id || '',
        penyedia: 'CV. MULTITON GRAPHINDO',
        penyedia_pimpinan: 'Ahmad Sajid, S.E',
        penyedia_jabatan: 'Direktur',
        penyedia_alamat: 'Jl. KH. Agus Salim Gang 5, Mojomulyo RT 03/11, Sragen Kulon, Sragen',
        penyedia_npwp: multiton?.npwp || '81.242.576.7-528.000',
        uraian: x.uraian || 'Pengadaan AC Split dan AC Floor Standing Ruang Pelayanan RSUD dr. Soeratno Gemolong',
        hps_no_urut: '1286',
        hps_nomor: `000.3.2/1286/05.1.2/${tahunBerjalan}`,
        hps_tanggal: `${tahunBerjalan}-06-29`,
        hps_total: sumHps,
        bakn_no_urut: '1607.a',
        bakn_nomor: `000.3.2/1607.a/05.1.2/${tahunBerjalan}`,
        bakn_tanggal: `${tahunBerjalan}-07-03`,
        penawaran_total: sumPen,
        bakn_hasil_teknis: 'Sesuai - Ada Perubahan',
        spk_no_urut: '2673',
        spk_nomor: `000.3.2/2673/05.1.2/${tahunBerjalan}`,
        spk_tanggal: `${tahunBerjalan}-07-08`,
        bast_no_urut: step === 2 ? '1631' : x.bast_no_urut,
        bast_nomor: step === 2 ? `000.3.2/1631/05.1.2/${tahunBerjalan}` : x.bast_nomor,
        bast_tanggal: `${tahunBerjalan}-07-25`,
        baphp_no_urut: step === 2 ? '1631.a' : x.baphp_no_urut,
        baphp_nomor: step === 2 ? `000.3.2/1631.a/05.1.2/${tahunBerjalan}` : x.baphp_nomor,
        baphp_tanggal: `${tahunBerjalan}-07-25`,
        tanggal: `${tahunBerjalan}-07-25`,
        pl: {
          undangan_no_urut: '2436',
          undangan_nomor: `000.3.2/2436/05.1.2/${tahunBerjalan}`,
          undangan_tanggal: `${tahunBerjalan}-06-29`,
          lingkup_pekerjaan: 'Pengadaan AC Split dan AC Floor Standing Ruang Pelayanan',
          penawaran_nomor: `05/PNWR/MG/${tahunBerjalan}`,
          penawaran_tanggal: `${tahunBerjalan}-07-01`,
          jadwal: {
            pemasukan_tgl: `${tahunBerjalan}-07-01`,
            pembukaan_tgl: `${tahunBerjalan}-07-01`,
            evaluasi_tgl: `${tahunBerjalan}-07-02`,
            klarifikasi_tgl: `${tahunBerjalan}-07-03`,
            klarifikasi_waktu: '09.00 WIB',
            penetapan_tgl: `${tahunBerjalan}-07-06`,
            spk_tgl: `${tahunBerjalan}-07-08`,
          },
          pembukaan_no_urut: '2573.b',
          pembukaan_nomor: `000.3.2/2573.b/05.1.2/${tahunBerjalan}`,
          pembukaan_tanggal: `${tahunBerjalan}-07-01`,
          evaluasi_no_urut: '2573.c',
          evaluasi_nomor: `000.3.2/2573.c/05.1.2/${tahunBerjalan}`,
          evaluasi_tanggal: `${tahunBerjalan}-07-02`,
          undangan_klarifikasi_no_urut: '2578.a',
          undangan_klarifikasi_nomor: `000.3.2/2578.a/05.1.2/${tahunBerjalan}`,
          undangan_klarifikasi_tanggal: `${tahunBerjalan}-07-02`,
          penetapan_no_urut: '2656',
          penetapan_nomor: `000.3.2/2656/05.1.2/${tahunBerjalan}`,
          penetapan_tanggal: `${tahunBerjalan}-07-06`,
          bahpl_no_urut: '2656.a',
          bahpl_nomor: `000.3.2/2656.a/05.1.2/${tahunBerjalan}`,
          bahpl_tanggal: `${tahunBerjalan}-07-06`,
          pengumuman_no_urut: '2656.b',
          pengumuman_nomor: `000.3.2/2656.b/05.1.2/${tahunBerjalan}`,
          pengumuman_tanggal: `${tahunBerjalan}-07-06`,
          laporan_no_urut: '2657',
          laporan_nomor: `000.3.2/2657/05.1.2/${tahunBerjalan}`,
          laporan_tanggal: `${tahunBerjalan}-07-06`,
          sppbj_no_urut: '1769',
          sppbj_nomor: `000.3.2/1769/05.1.2/${tahunBerjalan}`,
          sppbj_tanggal: `${tahunBerjalan}-07-07`,
          spk_no_urut: '2673',
          spk_nomor: `000.3.2/2673/05.1.2/${tahunBerjalan}`,
          spk_tanggal: `${tahunBerjalan}-07-08`,
          spk_jenis_kontrak: 'Kontrak Harga Satuan',
          spk_waktu_hari: 30,
        },
        spektek: defaultSpektek(rek?.uraian || 'Belanja Modal Alat Pendingin Ruangan (AC)', itemsSrc),
        items: itemsSrc.map((it) => ({ ...it })),
        kotor: sumNego,
      }))
      return
    }

    setF((x) => ({
      ...x,
      hps_no_urut: '1286',
      hps_nomor: `000.3.2/1286/05.1.2/${tahunBerjalan}`,
      hps_tanggal: `${tahunBerjalan}-06-29`,
      hps_total: sumHps,
      bakn_no_urut: '1607.a',
      bakn_nomor: `000.3.2/1607.a/05.1.2/${tahunBerjalan}`,
      bakn_tanggal: `${tahunBerjalan}-09-01`,
      penawaran_total: sumPen,
      bakn_hasil_teknis: 'Sesuai - Ada Perubahan',
      sp_no_urut: '1607',
      sp_nomor: `000.3.2/1607/05.1.2/${tahunBerjalan}`,
      sp_tanggal: `${tahunBerjalan}-09-01`,
      sp_tgl_kirim: `${tahunBerjalan}-09-28`,
      bast_no_urut: step === 2 ? '1631' : x.bast_no_urut,
      bast_nomor: step === 2 ? `000.3.2/1631/05.1.2/${tahunBerjalan}` : x.bast_nomor,
      bast_tanggal: `${tahunBerjalan}-09-17`,
      baphp_no_urut: step === 2 ? '1631.a' : x.baphp_no_urut,
      baphp_nomor: step === 2 ? `000.3.2/1631.a/05.1.2/${tahunBerjalan}` : x.baphp_nomor,
      baphp_tanggal: `${tahunBerjalan}-09-17`,
      tanggal: `${tahunBerjalan}-09-17`,
      penyedia_id: surya?.id || '',
      penyedia: 'CV. Surya Globe',
      penyedia_pimpinan: 'Sigit Gunawan',
      penyedia_jabatan: 'Direktur',
      penyedia_alamat: 'Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta',
      penyedia_npwp: surya?.npwp || '01.234.567.8-526.000',
      uraian: x.uraian || (is1050 ? 'Pengadaan PC Desktop Build-Up Core i3 Gen 13 dan InkTank Printer' : 'Pembelian Perangkat Pendaftaran Pasien (Printer Thermal, Barcode Scanner, Webcam, dan Fingerprint)'),
      spektek: defaultSpektek(rek?.uraian || 'Belanja Modal Peralatan Komputer', itemsSrc),
      items: itemsSrc.map((it) => ({ ...it })),
      kotor: sumNego,
    }))
  }

  const nominalEfektif = step === 3 ? (Number(f.kotor) || 0) : (Number(f.kotor) || totalItems || totalHpsItems)
  // alur 0–2 jt: SP, BAPHP, A2, Verifikasi (tanpa BAST); alur 2–10 jt: SP, BAST, BAPHP, A2, Verifikasi
  const is02 = !isLangsung && !is1050 && !is50750 && (nominalEfektif > 0 ? nominalEfektif <= 2000000 : hint02)
  const pajak = useMemo(
    () => hitungPajak({ kotor: nominalEfektif, ppn: f.ppn_aktif, pph: f.pph_aktif, ppnTarif: +f.ppn_tarif, pphTarif: +f.pph_tarif }),
    [nominalEfektif, f.ppn_aktif, f.pph_aktif, f.ppn_tarif, f.pph_tarif]
  )
  const kat = kategoriOf(nominalEfektif)
  const sisaSetelah = rek ? rek.sisa + awal - nominalEfektif : null

  const simpanTahap = async (targetTahap, openPreviewJenis = null) => {
    setErr(''); setBusy(true)
    try {
      const isLangsung = targetTahap === 'spj_langsung' || step === 3
      const curMode = isLangsung ? '0_10' : (is50750 ? '50_750' : (is1050 ? '10_50' : (is02 ? '0_2' : '0_10')))
      const urutHps = (!isLangsung && (is50750 || is1050)) ? (f.hps_no_urut || nextNomor.nextHps || '1286') : ''
      const nomorHps = (!isLangsung && (is50750 || is1050)) ? (f.hps_nomor || `000.3.2/${urutHps}/05.1.2/${tahunBerjalan}`) : ''
      const urutSp = (isLangsung || is50750) ? '' : (f.sp_no_urut || nextNomor.nextSp || '1607')
      const nomorSp = (isLangsung || is50750) ? '' : (f.sp_nomor || `000.3.2/${urutSp}/05.1.2/${tahunBerjalan}`)
      const urutBakn = (!isLangsung && (is50750 || is1050)) ? (f.bakn_no_urut || `${urutSp || '1607'}.a`) : ''
      const nomorBakn = (!isLangsung && (is50750 || is1050)) ? (f.bakn_nomor || `000.3.2/${urutBakn}/05.1.2/${tahunBerjalan}`) : ''
      const urutSpk = (!isLangsung && is50750) ? (f.spk_no_urut || f.pl?.spk_no_urut || nextNomor.nextSpk || '2673') : ''
      const nomorSpk = (!isLangsung && is50750) ? (f.spk_nomor || f.pl?.spk_nomor || `000.3.2/${urutSpk}/05.1.2/${tahunBerjalan}`) : ''
      const urutBast = targetTahap === 'selesai' && !is02 ? (f.bast_no_urut || nextNomor.nextBast || '1631') : ''
      const nomorBast = targetTahap === 'selesai' && !is02 ? (f.bast_nomor || `000.3.2/${urutBast}/05.1.2/${tahunBerjalan}`) : ''
      const urutBaphp = targetTahap === 'selesai' ? (f.baphp_no_urut || (is02 ? (nextNomor.nextBast || '1631') : `${urutBast}.a`)) : ''
      const nomorBaphp = targetTahap === 'selesai' ? (f.baphp_nomor || `000.3.2/${urutBaphp}/05.1.2/${tahunBerjalan}`) : ''

      const body = {
        ...f,
        // tanggal A2 = tanggal saat dicetak/disimpan
        tanggal: targetTahap === 'selesai' || targetTahap === 'spj_langsung' ? hariIni() : f.tanggal,
        mode_pengadaan: curMode,
        tahap: targetTahap,
        hps_no_urut: urutHps,
        hps_nomor: nomorHps,
        hps_total: isLangsung ? 0 : (totalHpsItems || f.hps_total || nominalEfektif),
        bakn_no_urut: urutBakn,
        bakn_nomor: nomorBakn,
        penawaran_total: isLangsung ? 0 : totalPenawaranEfektif,
        sp_no_urut: urutSp,
        sp_nomor: nomorSp,
        spk_no_urut: urutSpk,
        spk_nomor: nomorSpk,
        spk_tanggal: (!isLangsung && is50750) ? (f.spk_tanggal || f.pl?.spk_tanggal || f.pl?.jadwal?.spk_tgl || f.tanggal) : null,
        pl_json: (!isLangsung && is50750) ? JSON.stringify(f.pl || {}) : null,
        pl: (!isLangsung && is50750) ? f.pl : null,
        bast_no_urut: urutBast,
        bast_nomor: nomorBast,
        baphp_no_urut: urutBaphp,
        baphp_nomor: nomorBaphp,
        kotor: nominalEfektif,
      }
      let targetId = saved
      if (saved) {
        await api('/transaksi/' + saved, { method: 'PUT', body })
      } else {
        const r = await api('/transaksi', { method: 'POST', body })
        targetId = r.id
        setSaved(r.id)
        nav('/transaksi/' + r.id, { replace: true })
      }
      setF((x) => ({
        ...x,
        mode_pengadaan: curMode,
        tahap: targetTahap,
        hps_no_urut: urutHps,
        hps_nomor: nomorHps,
        bakn_no_urut: urutBakn,
        bakn_nomor: nomorBakn,
        penawaran_total: totalPenawaranEfektif,
        sp_no_urut: urutSp,
        sp_nomor: nomorSp,
        spk_no_urut: urutSpk,
        spk_nomor: nomorSpk,
        bast_no_urut: urutBast,
        bast_nomor: nomorBast,
        baphp_no_urut: urutBaphp,
        baphp_nomor: nomorBaphp,
      }))
      if (rek) {
        const fresh = (await api('/rekening?q=' + encodeURIComponent(rek.kode))).find((x) => x.id === rek.id)
        setRek(fresh); setAwal(nominalEfektif)
      }
      api('/penyedia').then(setPenyediaList)
      setOk(
        targetTahap === 'spektek'
          ? '1. Spesifikasi Teknis / KAK berhasil disimpan!'
          : targetTahap === 'hps' || targetTahap === 'spektek_hps'
          ? '2. Penetapan HPS & Lampiran berhasil disimpan!'
          : targetTahap === 'undangan'
          ? '3. Undangan PL & Jadwal Pengadaan berhasil disimpan!'
          : targetTahap === 'evaluasi'
          ? '4. Pembukaan & Evaluasi Penawaran berhasil disimpan!'
          : targetTahap === 'negosiasi'
          ? (is50750 ? '5. Undangan Klarifikasi & BA Negosiasi berhasil disimpan!' : '3. BA Klarifikasi Teknis & Negosiasi Harga berhasil disimpan!')
          : targetTahap === 'penetapan'
          ? '6. Penetapan, BAHPL & Laporan PPK berhasil disimpan!'
          : targetTahap === 'kontrak'
          ? '7. SPPBJ & Kontrak SPK berhasil disimpan!'
          : targetTahap === 'pesanan'
          ? 'Surat Pesanan (SP) berhasil disimpan!'
          : targetTahap === 'spj_langsung'
          ? 'A2 & Lembar Verifikasi berhasil disimpan!'
          : 'BAST, BAPHP, A2 & Lembar Verifikasi berhasil disimpan!'
      )
      setTimeout(() => setOk(''), 2500)
      if (openPreviewJenis && targetId) {
        setPreview({ id: targetId, jenis: openPreviewJenis, tahap: targetTahap, modePengadaan: is02 ? '0_2' : curMode })
      }
    } catch (er) {
      setErr(er.message)
    } finally {
      setBusy(false)
    }
  }

  const hapusTransaksiIni = async () => {
    if (!saved) return
    try {
      const yakin = await konfirmasiHapus({
        title: 'Hapus Paket Pengadaan Ini?',
        text: `Paket "${f.penyedia || f.uraian || 'Pengadaan'}" beserta seluruh dokumen terkait akan dihapus secara permanen.`,
        confirmText: 'Ya, Hapus Paket!',
      })
      if (!yakin) return
      await api('/transaksi/' + saved, { method: 'DELETE' })
      nav('/transaksi')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Gagal menghapus paket pengadaan')
    }
  }

  const pilPejabat = (peran, key, customLabel) => {
    const opts = pejabat
      .filter((p) => p.peran === peran)
      .map((p) => ({
        value: p.id,
        label: p.nama,
        sub: p.nip ? `NIP. ${p.nip}${p.jabatan ? ' · ' + p.jabatan : ''}` : p.jabatan || '',
      }))
    return (
      <Field label={customLabel || PERAN[peran]} key={key}>
        <SearchableSelect
          value={f[key] || ''}
          options={opts}
          placeholder="— pilih pejabat —"
          searchPlaceholder="Cari nama atau NIP pejabat…"
          allowClear
          onChange={(val) => {
            upd(key, val)
            if (key === 'ppkom_id') {
              const pObj = pejabat.find((p) => String(p.id) === String(val))
              if (pObj) {
                if (pObj.jabatan) upd('ppk_jabatan', pObj.jabatan)
                if (pObj.alamat) upd('ppk_alamat', pObj.alamat)
              }
            }
          }}
        />
      </Field>
    )
  }

  const penyediaOptions = useMemo(
    () =>
      penyediaList.map((v) => ({
        value: v.id,
        label: v.nama,
        sub: [v.pimpinan || v.jabatan, v.npwp ? `NPWP: ${v.npwp}` : '', v.alamat].filter(Boolean).join(' · '),
      })),
    [penyediaList]
  )

  const activeSteps = is50750 ? STEPS_50_750 : (is1050 ? STEPS_10_50 : (isLangsung ? STEPS_LANGSUNG : STEPS_0_10.map((st) => (is02 && st.id === 2 ? { ...st, title: '2. Penerimaan Barang (BAPHP, A2 & Verifikasi)' } : st))))
  const spk = f.spektek || defaultSpektek(rek?.uraian, f.items)

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <button onClick={() => nav('/transaksi')} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#122922]/65 hover:text-[#122922]">
          <ArrowLeft size={15} /> Kembali ke Daftar Pengadaan &amp; SPJ
        </button>

        {/* Pemilih alur: A2 saja, 0–2 jt, atau 2–10 jt. Alur 10–50 jt & 50–750 jt ada di menu Dokumen Pengadaan (wizard) */}
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border-2 border-[#122922] bg-white p-1 shadow-[3px_3px_0_#122922]">
          <button
            type="button"
            onClick={() => ubahKategoriAlur('langsung')}
            className={`rounded-full px-3.5 py-1 text-xs font-extrabold transition cursor-pointer ${
              isLangsung ? 'bg-[#b5e8a5] text-[#122922] border border-[#122922]' : 'text-[#122922]/65 hover:text-[#122922]'
            }`}
          >
            A2 &amp; Verifikasi Saja
          </button>
          <button
            type="button"
            onClick={() => ubahKategoriAlur('0_2')}
            className={`rounded-full px-3.5 py-1 text-xs font-extrabold transition cursor-pointer ${
              is02 ? 'bg-[#d6ee30] text-[#122922] border border-[#122922]' : 'text-[#122922]/65 hover:text-[#122922]'
            }`}
          >
            Alur 0–2 Jt (SP · BAPHP)
          </button>
          <button
            type="button"
            onClick={() => ubahKategoriAlur('2_10')}
            className={`rounded-full px-3.5 py-1 text-xs font-extrabold transition cursor-pointer ${
              !is02 && !isLangsung && !is1050 && !is50750 ? 'bg-[#d6ee30] text-[#122922] border border-[#122922]' : 'text-[#122922]/65 hover:text-[#122922]'
            }`}
          >
            Alur 2–10 Jt (SP · BAST · BAPHP)
          </button>
        </div>
      </div>

      <PageHeader
        kicker={
          isLangsung
            ? 'Mode Langsung Tanpa SP & BAST (0–2 Juta)'
            : is50750
            ? 'Alur Pengadaan Langsung 50–750 Juta (8 Tahap Lengkap)'
            : is1050
            ? 'Alur Pengadaan 10–50 Juta (5 Tahap Terstruktur)'
            : is02 ? 'Alur Pengadaan 0–2 Juta (SP · BAPHP · A2 · Verifikasi)' : 'Alur Pengadaan 2–10 Juta (SP · BAST · BAPHP · A2 · Verifikasi)'
        }
        title={
          step === 10
            ? (is50750 ? 'Tahap 1 (50–750 Jt): 1. Spesifikasi Teknis / KAK' : 'Tahap 1 (10–50 Jt): 1. Spesifikasi Teknis / KAK')
            : step === 12
            ? (is50750 ? 'Tahap 2 (50–750 Jt): 2. Penetapan HPS & Lampiran Rincian HPS' : 'Tahap 2 (10–50 Jt): 2. Penetapan HPS & Lampiran Rincian HPS')
            : step === 20
            ? 'Tahap 3 (50–750 Jt): 3. Undangan Pengadaan Langsung & Jadwal'
            : step === 21
            ? 'Tahap 4 (50–750 Jt): 4. Pembukaan Dokumen & Evaluasi Penawaran'
            : step === 11
            ? (is50750 ? 'Tahap 5 (50–750 Jt): 5. Klarifikasi Teknis & Negosiasi Harga' : 'Tahap 3 (10–50 Jt): 3. BA Klarifikasi Teknis & Negosiasi Harga')
            : step === 22
            ? 'Tahap 6 (50–750 Jt): 6. Penetapan Pemenang, BAHPL & Laporan PPK'
            : step === 23
            ? 'Tahap 7 (50–750 Jt): 7. SPPBJ & Kontrak (SPK)'
            : step === 1
            ? (saved ? 'Kelola & Cetak Surat Pesanan (SP)' : 'Buat Surat Pesanan (SP) Baru')
            : step === 2
            ? (is50750 ? 'Tahap 8 (50–750 Jt): Penerimaan Barang (BAST, BAPHP, A2 & Verifikasi)' : (is02 ? 'Penerimaan Barang (BAPHP, A2 & Verifikasi)' : 'Penerimaan Barang (BAST, BAPHP, A2 & Verifikasi)'))
            : 'SPJ Langsung: Buat Bukti A2 & Lembar Verifikasi Saja'
        }
        desc={
          is50750
            ? 'Alur Pengadaan Langsung 50–750 Juta: 1. Spektek → 2. HPS → 3. Undangan PL & Jadwal → 4. Pembukaan & Evaluasi → 5. BA Klarifikasi & Nego → 6. Penetapan, BAHPL, Pengumuman & Laporan → 7. SPPBJ & SPK → 8. BAST, BAPHP, A2 & Verifikasi'
            : is1050
            ? 'Alur 10–50 Juta: 1. Spesifikasi Teknis/KAK → 2. HPS → 3. BA Klarifikasi & Negosiasi → 4. Surat Pesanan (SP) → 5. BAST, BAPHP, A2 & Lembar Verifikasi'
            : step === 3
            ? 'Khusus transaksi di bawah 2 juta yang hanya membutuhkan Bukti Pengeluaran (A2) dan Lembar Verifikasi tanpa Surat Pesanan & BAST'
            : 'Buat & cetak Surat Pesanan (SP) terlebih dahulu → Setelah barang diterima, lanjutkan pembuatan BAST, BAPHP, A2, dan Lembar Verifikasi'
        }
      >
        {saved && <CetakMenu id={saved} tahap={f.tahap} modePengadaan={is50750 ? '50_750' : (is1050 ? '10_50' : (is02 ? '0_2' : '0_10'))} onPreview={setPreview} />}
      </PageHeader>

      {/* Stepper Kartu Alur */}
      <div className={`mb-6 grid gap-2.5 ${
        is50750
          ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8'
          : is1050
          ? 'grid-cols-2 md:grid-cols-5'
          : isLangsung
          ? 'grid-cols-1'
          : 'grid-cols-1 md:grid-cols-2'
      }`}>
        {activeSteps.map((s) => {
          const Icon = s.icon
          const active = step === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => pilihModeStep(s.id)}
              className={`flex items-center gap-2 rounded-2xl p-2.5 text-left transition duration-150 cursor-pointer ${
                active
                  ? 'border-2 border-[#122922] bg-white shadow-[4px_4px_0_#122922] -translate-y-0.5'
                  : 'border border-[#122922]/20 bg-white/75 hover:border-[#122922]/50 hover:bg-white'
              }`}
            >
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl border-2 border-[#122922] text-[#122922] ${active ? s.color : 'bg-[#f7f5ef]'}`}>
                <Icon size={15} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-extrabold leading-tight text-[#122922]">{s.title}</div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <div className={`space-y-6 ${
          step === 10
            ? (isLebarSpektek ? 'xl:col-span-12' : 'xl:col-span-9 2xl:col-span-9')
            : 'xl:col-span-8'
        }`}>
          {/* Kode Rekening / RBA & Inputan "Yaitu untuk pembayaran / Nama Paket Pekerjaan" */}
          <div className="card space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[#122922] bg-[#d6ee30] px-2 py-0.5 font-mono text-[11px] font-extrabold">RBA</span>
                <h2 className="text-sm font-extrabold tracking-tight text-[#122922]">
                  {step === 2 || step === 3
                    ? 'Kode Rekening & Uraian Pembayaran / Paket Pekerjaan'
                    : 'Pilih Kode Rekening / Nomor RBA yang Diampu'}
                </h2>
              </div>
            </div>

            <Field
              label={
                step === 2 || step === 3
                  ? '1. Kode Rekening / Nomor RBA (Untuk pekerjaan/keperluan di A2 & Kegiatan di Verifikasi)'
                  : 'Kode Rekening / Nomor RBA (Menampilkan rekening sesuai Pejabat Pengadaan / PPK / PPTK)'
              }
              hint={rek ? `Uraian Rekening: ${rek.uraian} (${rek.kode})` : 'Pilih kode rekening anggaran BLUD'}
            >
              <RekeningPicker value={rek} onPick={pilihRek} user={user} tahun={tahunBerjalan} />
            </Field>

            {/* Kolom "Yaitu untuk pembayaran / Rincian Paket Pekerjaan" HANYA muncul pada BAST/A2 (step 2) dan Langsung A2 (step 3) */}
            {(step === 2 || step === 3) && (
              <Field
                label="2. Yaitu untuk pembayaran / Rincian Paket Pekerjaan (Input Manual User)"
                hint={`Teks ini tampil pada baris 'Yaitu untuk pembayaran' di A2 & Verifikasi, serta di dalam kurung setelah Nama Kode Rekening (${rek?.uraian || 'Belanja …'}) pada BAST & BAPHP`}
              >
                <textarea
                  rows={2}
                  className="input"
                  value={f.uraian}
                  onChange={(e) => upd('uraian', e.target.value)}
                  placeholder="Ketik rincian barang / pekerjaan di sini (mis. Pemeliharaan Videotroon / Samsung Galaxy Tab A11)…"
                />
              </Field>
            )}
          </div>

          {/* ==================== TAHAP 1 (step === 10): 1. SPESIFIKASI TEKNIS / KAK (EXPANDED & INTELLIGENT LAYOUT) ==================== */}
          {step === 10 && (
            <div className="space-y-4">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">
                      {is50750 ? 'Tahap 1 (50–750 Juta) · Dokumen Persiapan PPK' : 'Dokumen Pertama (10–50 Juta)'}
                    </span>
                    <h2 className="text-base font-extrabold text-[#122922]">1. SPESIFIKASI TEKNIS / KAK PENGADAAN BARANG</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsLebarSpektek(!isLebarSpektek)}
                      className={`btn-ghost !py-1 !px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        isLebarSpektek ? '!border-[#122922] !bg-[#d6ee30] text-[#122922]' : ''
                      }`}
                      title={isLebarSpektek ? 'Kembalikan ke tampilan standar' : 'Lebarkan tampilan ke 100% lebar layar agar lebih leluasa'}
                    >
                      {isLebarSpektek ? (
                        <>
                          <Minimize2 size={13} /> ◱ Mode Standar
                        </>
                      ) : (
                        <>
                          <Maximize2 size={13} /> ⛶ Mode Lebar Penuh (100%)
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={isiTemplateSpektekOtomatis}
                      className="btn-ghost !py-1 !px-3 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles size={13} className="text-[#3f8f77]" /> Isi Standar Otomatis
                    </button>
                  </div>
                </div>

                {/* Sub-Tab Navigation for Spektek */}
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border-2 border-[#122922] bg-[#f7f5ef] p-1.5 shadow-[2px_2px_0_#122922]">
                  <button
                    type="button"
                    onClick={() => setSpekTab('barang')}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                      spekTab === 'barang'
                        ? 'border border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[1px_1px_0_#122922]'
                        : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                    }`}
                  >
                    <Package size={14} /> 1. Daftar Barang &amp; Volume ({f.items.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpekTab('info')}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                      spekTab === 'info'
                        ? 'border border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[1px_1px_0_#122922]'
                        : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                    }`}
                  >
                    <FileText size={14} /> 2. Info Paket &amp; PPK
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpekTab('standar')}
                    className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                      spekTab === 'standar'
                        ? 'border border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[1px_1px_0_#122922]'
                        : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                    }`}
                  >
                    <FileCheck size={14} /> 3. Standar Mutu, Waktu &amp; Layanan
                  </button>
                </div>

                {/* Sub-Tab 1: DAFTAR BARANG (SPESIFIKASI JUMLAH) */}
                {spekTab === 'barang' && (
                  <div className="space-y-3.5">
                    <div className="overflow-hidden rounded-2xl border border-[#122922]/15">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/12 bg-[#f7f5ef] px-4 py-3">
                        <div>
                          <h3 className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                            Daftar Barang &amp; Volume (Spesifikasi Jumlah)
                          </h3>
                          <p className="text-[11px] text-[#122922]/65">
                            Isi nama barang, satuan, dan volume untuk dokumen Spektek/KAK. Rincian ini otomatis diteruskan ke tahap HPS.
                          </p>
                        </div>
                        <button type="button" onClick={tambahItem} className="btn-lime !py-1.5 !px-3 text-xs">
                          <Plus size={14} strokeWidth={2.5} /> Tambah Item Barang
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/50">
                            <tr>
                              <th className="th w-12 text-center">No</th>
                              <th className="th">Uraian Barang / Spesifikasi</th>
                              <th className="th w-36 text-center">Satuan</th>
                              <th className="th w-32 text-center">Volume</th>
                              <th className="th w-12" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#122922]/10">
                            {f.items.map((it, idx) => (
                              <tr key={idx} className="hover:bg-[#f7f5ef]/40">
                                <td className="td text-center font-mono text-xs font-bold">{idx + 1}.</td>
                                <td className="p-2">
                                  <input
                                    className="input !py-1.5"
                                    value={it.jenis_barang}
                                    onChange={(e) => updItem(idx, 'jenis_barang', e.target.value)}
                                    placeholder="mis. PC SET Build-up, Intel core i3 Gen 13, RAM 8GB DDR5, SSD 512GB"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    className="input !py-1.5 text-center"
                                    value={it.satuan}
                                    onChange={(e) => updItem(idx, 'satuan', e.target.value)}
                                    placeholder="Set / Unit"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="any"
                                    className="input !py-1.5 text-center font-mono"
                                    value={it.kuantitas}
                                    onChange={(e) => updItem(idx, 'kuantitas', e.target.value)}
                                  />
                                </td>
                                <td className="p-2 text-center">
                                  {f.items.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => hapusItem(idx)}
                                      className="rounded-full p-1.5 text-[#122922]/40 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3">
                      <span className="text-xs font-bold text-[#122922]">
                        Total: <span className="font-mono text-[#3f8f77]">{f.items.length}</span> jenis barang siap diproses ke Spektek &amp; HPS
                      </span>
                      <button
                        type="button"
                        onClick={() => setSpekTab('info')}
                        className="btn-ghost !py-1 !px-3 text-xs font-extrabold"
                      >
                        Lanjut ke 2. Info Paket &amp; PPK →
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 2: INFORMASI POKOK PAKET & PPK (EXPANDED & SPACIOUS) */}
                {spekTab === 'info' && (
                  <div className="space-y-5">
                    {/* Kartu 1: Identitas Paket Pengadaan */}
                    <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-2.5">
                        <div>
                          <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Identitas Dokumen</span>
                          <h3 className="text-sm font-extrabold text-[#122922]">A. Nama Resmi Paket Pengadaan (Sesuai SiRUP &amp; KAK)</h3>
                        </div>
                        {rek?.uraian && spk.paket_pengadaan !== rek.uraian && (
                          <button
                            type="button"
                            onClick={() => updSpek('paket_pengadaan', rek.uraian)}
                            className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] px-3 py-1 text-[11px] font-bold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                          >
                            ↺ Samakan dengan Rekening: "{rek.uraian}"
                          </button>
                        )}
                      </div>

                      <Field label="Uraian Nama Paket Pengadaan Barang">
                        <input
                          className="input !py-3 text-sm font-bold text-[#122922]"
                          value={spk.paket_pengadaan || ''}
                          onChange={(e) => updSpek('paket_pengadaan', e.target.value)}
                          placeholder="mis. Belanja Modal Peralatan Komputer / Pengadaan AC Split dan AC Floor Standing Ruang Pelayanan"
                        />
                      </Field>

                      {rek && (
                        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#f7f5ef] px-3.5 py-2 text-xs font-semibold text-[#122922]">
                          <span className="font-mono font-bold text-[#3f8f77]">Kode RBA: {rek.kode}</span>
                          <span className="text-[#122922]/40">·</span>
                          <span>{rek.uraian}</span>
                          <span className="text-[#122922]/40">·</span>
                          <span className="font-mono font-bold text-[#122922]">Pagu: {rp(rek.pagu)}</span>
                        </div>
                      )}
                    </div>

                    {/* Kartu 2: PPK, SiRUP, dan Tanggal Penetapan */}
                    <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-4">
                      <div className="border-b border-[#122922]/10 pb-2.5">
                        <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Penanggung Jawab &amp; Jadwal</span>
                        <h3 className="text-sm font-extrabold text-[#122922]">B. Pejabat Pembuat Komitmen (PPK), SiRUP &amp; Tanggal Dokumen</h3>
                      </div>

                      <div className="grid gap-4 md:grid-cols-12">
                        <div className="md:col-span-5">
                          {pilPejabat('PPKOM', 'ppkom_id', 'Pejabat Pembuat Komitmen (PPK)')}
                        </div>
                        <Field label="ID RUP pada SiRUP LKPP" className="md:col-span-4" hint="Nomor RUP 8 digit dari SiRUP">
                          <input
                            className="input font-mono font-bold"
                            value={spk.id_rup || ''}
                            onChange={(e) => updSpek('id_rup', e.target.value)}
                            placeholder="mis. 62736023"
                          />
                        </Field>
                        <Field label="Tanggal Ditetapkan KAK" className="md:col-span-3">
                          <input
                            type="date"
                            className="input font-mono"
                            value={spk.tanggal || f.hps_tanggal || hariIni()}
                            onChange={(e) => updSpek('tanggal', e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Kartu 3: Spesifikasi Fungsi Umum */}
                    <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-3.5">
                      <div className="border-b border-[#122922]/10 pb-2.5">
                        <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Urgensi &amp; Kemanfaatan</span>
                        <h3 className="text-sm font-extrabold text-[#122922]">C. Spesifikasi Fungsi Umum Barang / Jasa</h3>
                        <p className="text-xs text-[#122922]/60 mt-0.5">
                          Jelaskan fungsi umum dan manfaat pengadaan ini untuk mendukung operasional pelayanan rumah sakit.
                        </p>
                      </div>

                      <Field label="Penjelasan Fungsi Umum">
                        <textarea
                          rows={4}
                          className="input text-xs leading-relaxed"
                          value={spk.fungsi_umum || ''}
                          onChange={(e) => updSpek('fungsi_umum', e.target.value)}
                          placeholder="Penjelasan fungsi umum barang untuk operasional RSUD…"
                        />
                      </Field>

                      {/* Preset Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-[#122922]/60">Sisipkan template cepat:</span>
                        <button
                          type="button"
                          onClick={() => updSpek('fungsi_umum', (spk.fungsi_umum ? spk.fungsi_umum + ' ' : '') + 'Mendukung kelancaran dan kenyamanan pelayanan pasien rawat inap dan rawat jalan di lingkungan RSUD dr. Soeratno Gemolong.')}
                          className="rounded-lg border border-[#122922]/15 bg-[#f7f5ef] px-2.5 py-1 text-[11px] font-semibold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                        >
                          + Kenyamanan Pasien Rawat Inap/Jalan
                        </button>
                        <button
                          type="button"
                          onClick={() => updSpek('fungsi_umum', (spk.fungsi_umum ? spk.fungsi_umum + ' ' : '') + 'Meningkatkan kecepatan dan akurasi pelayanan administrasi dan rekam medis pasien.')}
                          className="rounded-lg border border-[#122922]/15 bg-[#f7f5ef] px-2.5 py-1 text-[11px] font-semibold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                        >
                          + Administrasi &amp; Rekam Medis
                        </button>
                        <button
                          type="button"
                          onClick={() => updSpek('fungsi_umum', (spk.fungsi_umum ? spk.fungsi_umum + ' ' : '') + 'Memenuhi standar sarana dan prasarana keselamatan pasien sesuai ketentuan akreditasi rumah sakit.')}
                          className="rounded-lg border border-[#122922]/15 bg-[#f7f5ef] px-2.5 py-1 text-[11px] font-semibold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                        >
                          + Standar Akreditasi RS
                        </button>
                      </div>
                    </div>

                    {/* Footer Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3">
                      <button
                        type="button"
                        onClick={() => setSpekTab('barang')}
                        className="btn-ghost !py-1 !px-3 text-xs"
                      >
                        ← Kembali ke 1. Daftar Barang ({f.items.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSpekTab('standar')}
                        className="btn-ghost !py-1 !px-3 text-xs font-extrabold"
                      >
                        Lanjut ke 3. Standar Mutu, Waktu &amp; Layanan →
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub-Tab 3: STANDAR MUTU, WAKTU & KETENTUAN LAYANAN (EXPANDED SUB-SECTIONS) */}
                {spekTab === 'standar' && (
                  <div className="space-y-4">
                    {/* Sub-Pills Navigation within Standar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#122922]/20 bg-[#f7f5ef] p-1">
                        <button
                          type="button"
                          onClick={() => setStandarSubTab('mutu')}
                          className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                            standarSubTab === 'mutu'
                              ? 'bg-[#122922] text-[#d6ee30] shadow-sm'
                              : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                          }`}
                        >
                          💎 3.1 Mutu Teknis &amp; TKDN
                        </button>
                        <button
                          type="button"
                          onClick={() => setStandarSubTab('waktu')}
                          className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                            standarSubTab === 'waktu'
                              ? 'bg-[#122922] text-[#d6ee30] shadow-sm'
                              : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                          }`}
                        >
                          ⏱️ 3.2 Waktu Pelaksanaan &amp; Lokasi
                        </button>
                        <button
                          type="button"
                          onClick={() => setStandarSubTab('layanan')}
                          className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                            standarSubTab === 'layanan'
                              ? 'bg-[#122922] text-[#d6ee30] shadow-sm'
                              : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                          }`}
                        >
                          🛠️ 3.3 Standar Layanan &amp; Garansi
                        </button>
                        <button
                          type="button"
                          onClick={() => setStandarSubTab('semua')}
                          className={`rounded-lg px-3 py-1.5 text-xs font-extrabold transition cursor-pointer ${
                            standarSubTab === 'semua'
                              ? 'bg-[#122922] text-[#d6ee30] shadow-sm'
                              : 'text-[#122922]/70 hover:bg-white hover:text-[#122922]'
                          }`}
                        >
                          📑 Tampilkan Semua Sekaligus
                        </button>
                      </div>

                      <span className="text-xs text-[#122922]/60 hidden sm:inline font-mono">
                        Area input luas &amp; bebas mengetik detail
                      </span>
                    </div>

                    {/* SECTION 3.1: MUTU TEKNIS & TKDN */}
                    {(standarSubTab === 'mutu' || standarSubTab === 'semua') && (
                      <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-4">
                        <div className="border-b border-[#122922]/10 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Bagian 3.1</span>
                            <h3 className="text-sm font-extrabold text-[#122922]">Spesifikasi Mutu Teknis &amp; Prioritas TKDN / PDN</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const itemsList = f.items.filter(i => i.jenis_barang).map(i => `• ${i.jenis_barang} (Vol: ${i.kuantitas} ${i.satuan || 'Unit'}): Mutu standar industri / SNI / resmi`).join('\n')
                              updSpek('mutu_teknis', (spk.mutu_teknis ? spk.mutu_teknis + '\n\n' : '') + itemsList)
                            }}
                            className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] px-3 py-1 text-[11px] font-bold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                          >
                            ✨ Salin Daftar Barang ke Rincian Teknis
                          </button>
                        </div>

                        {/* 1. Spesifikasi Teknis Full Width */}
                        <Field
                          label="1. Spesifikasi Teknik (Rincian Komponen / Spesifikasi Fisik Barang)"
                          hint="Tuliskan spesifikasi detail tiap barang secara leluasa (tipe, kapasitas, daya, aksesoris, dll.)"
                        >
                          <textarea
                            rows={5}
                            className="input font-mono text-xs leading-relaxed"
                            value={spk.mutu_teknis || ''}
                            onChange={(e) => updSpek('mutu_teknis', e.target.value)}
                            placeholder="Contoh:&#10;1. PC Desktop: Minimal Core i3 Gen 13, RAM 8GB DDR5, SSD 512GB, Display 21.5 inch FHD&#10;2. InkTank Printer: Resolusi minimal 720x720 dpi, USB 2.0 High Speed, Print Speed 8.5 ipm"
                          />
                        </Field>

                        {/* 2. Spesifikasi Kinerja Full Width */}
                        <Field
                          label="2. Spesifikasi Kinerja (Kapasitas, Beban Kerja &amp; Efisiensi)"
                          hint="Jelaskan daya tahan operasional, kecepatan kerja, atau efisiensi energi barang"
                        >
                          <textarea
                            rows={3}
                            className="input text-xs leading-relaxed"
                            value={spk.mutu_kinerja || ''}
                            onChange={(e) => updSpek('mutu_kinerja', e.target.value)}
                            placeholder="Barang mampu beroperasi prima untuk beban kerja harian rumah sakit (operasional continuous 24/7), hemat energi, serta tingkat kebisingan rendah."
                          />
                        </Field>

                        {/* 3 Columns: Merek, Standarisasi & TKDN */}
                        <div className="grid gap-4 sm:grid-cols-3 pt-1 border-t border-[#122922]/10">
                          <Field label="3. Merek Barang (Jika Ditentukan)" hint="Sebutkan merek atau setara">
                            <input
                              className="input text-xs"
                              value={spk.mutu_merek || ''}
                              onChange={(e) => updSpek('mutu_merek', e.target.value)}
                              placeholder="cth: Daikin / Lenovo / Epson / Setara"
                            />
                          </Field>
                          <Field label="4. Standarisasi Mutu &amp; Garansi" hint="Standar kelayakan teknis">
                            <input
                              className="input text-xs"
                              value={spk.mutu_standarisasi || ''}
                              onChange={(e) => updSpek('mutu_standarisasi', e.target.value)}
                              placeholder="cth: SNI / ISO 9001, Garansi Resmi 1 Tahun"
                            />
                          </Field>
                          <Field label="5. Prioritas PDN / TKDN" hint="Kepatuhan belanja PDN">
                            <input
                              className="input text-xs"
                              value={spk.mutu_pdn || ''}
                              onChange={(e) => updSpek('mutu_pdn', e.target.value)}
                              placeholder="cth: Diutamakan Produk Dalam Negeri (TKDN ≥ 40%)"
                            />
                          </Field>
                        </div>
                      </div>
                    )}

                    {/* SECTION 3.2: WAKTU PELAKSANAAN & LOKASI */}
                    {(standarSubTab === 'waktu' || standarSubTab === 'semua') && (
                      <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-4">
                        <div className="border-b border-[#122922]/10 pb-2.5">
                          <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Bagian 3.2</span>
                          <h3 className="text-sm font-extrabold text-[#122922]">Waktu Pelaksanaan, Lokasi Kedatangan &amp; Pengiriman</h3>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Jangka Waktu dengan Preset Pills */}
                          <div>
                            <Field label="Jangka Waktu Penyelesaian Pekerjaan">
                              <input
                                className="input text-xs font-semibold"
                                value={spk.waktu_jangka || ''}
                                onChange={(e) => updSpek('waktu_jangka', e.target.value)}
                                placeholder="30 (tiga puluh) hari kalender sejak pesanan…"
                              />
                            </Field>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-[#122922]/60">Preset:</span>
                              {[
                                { label: '14 Hari', val: '14 (empat belas) hari kalender sejak penandatanganan Surat Pesanan / SPK.' },
                                { label: '30 Hari', val: '30 (tiga puluh) hari kalender sejak penandatanganan Surat Pesanan / SPK.' },
                                { label: '45 Hari', val: '45 (empat puluh lima) hari kalender sejak penandatanganan Surat Pesanan / SPK.' },
                                { label: '60 Hari', val: '60 (enam puluh) hari kalender sejak penandatanganan Surat Pesanan / SPK.' },
                              ].map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => updSpek('waktu_jangka', p.val)}
                                  className="rounded-md border border-[#122922]/15 bg-[#f7f5ef] px-2 py-0.5 text-[10px] font-bold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Lokasi Kedatangan */}
                          <div>
                            <Field label="Lokasi Kedatangan &amp; Penyerahan Barang">
                              <input
                                className="input text-xs font-semibold"
                                value={spk.waktu_lokasi || ''}
                                onChange={(e) => updSpek('waktu_lokasi', e.target.value)}
                                placeholder="Gudang Farmasi & Logistik Medik RSUD dr. Soeratno Gemolong…"
                              />
                            </Field>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => updSpek('waktu_lokasi', 'Gudang Logistik RSUD dr. Soeratno Gemolong, Jl. Perintis Kemerdekaan No. 3, Gemolong, Sragen')}
                                className="rounded-md border border-[#122922]/15 bg-[#f7f5ef] px-2 py-0.5 text-[10px] font-bold text-[#122922] hover:bg-[#d6ee30] transition cursor-pointer"
                              >
                                + Alamat Gudang RSUD Gemolong
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Metode Transportasi */}
                        <Field label="Metode Transportasi &amp; Pengepakan Pengiriman">
                          <textarea
                            rows={3}
                            className="input text-xs leading-relaxed"
                            value={spk.waktu_transportasi || ''}
                            onChange={(e) => updSpek('waktu_transportasi', e.target.value)}
                            placeholder="Barang dikirim menggunakan armada ekspedisi penyedia dengan pengepakan standar yang aman, tahan benturan dan tahan cuaca sampai ke lokasi penyerahan di RSUD dr. Soeratno Gemolong."
                          />
                        </Field>
                      </div>
                    )}

                    {/* SECTION 3.3: STANDAR LAYANAN & GARANSI */}
                    {(standarSubTab === 'layanan' || standarSubTab === 'semua') && (
                      <div className="rounded-2xl border-2 border-[#122922]/15 bg-white p-5 shadow-xs space-y-4">
                        <div className="border-b border-[#122922]/10 pb-2.5">
                          <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#3f8f77]">Bagian 3.3</span>
                          <h3 className="text-sm font-extrabold text-[#122922]">Ketentuan Layanan Purnajual, Pelatihan &amp; Garansi</h3>
                        </div>

                        {/* SLA Pelayanan */}
                        <Field label="Tingkat Pelayanan Barang / Jasa (SLA)">
                          <textarea
                            rows={3}
                            className="input text-xs leading-relaxed"
                            value={spk.layanan_tingkat || ''}
                            onChange={(e) => updSpek('layanan_tingkat', e.target.value)}
                            placeholder="Penyedia wajib memberikan respon maksimal 1x24 jam apabila ditemukan kerusakan atau ketidaksesuaian barang setelah serah terima."
                          />
                        </Field>

                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="Pelatihan &amp; Bantuan Teknis Penyedia">
                            <textarea
                              rows={3}
                              className="input text-xs leading-relaxed"
                              value={spk.layanan_pelatihan || ''}
                              onChange={(e) => updSpek('layanan_pelatihan', e.target.value)}
                              placeholder="Penyedia memberikan pelatihan teknis pengoperasian dan pemeliharaan dasar kepada teknisi / user unit rumah sakit saat serah terima barang."
                            />
                          </Field>
                          <Field label="Pemeliharaan &amp; Garansi Purnajual">
                            <textarea
                              rows={3}
                              className="input text-xs leading-relaxed"
                              value={spk.layanan_pemeliharaan || ''}
                              onChange={(e) => updSpek('layanan_pemeliharaan', e.target.value)}
                              placeholder="Garansi purnajual berlaku minimal 1 (satu) tahun meliputi jaminan suku cadang asli dan perbaikan teknis tanpa biaya tambahan."
                            />
                          </Field>
                        </div>
                      </div>
                    )}

                    {/* Footer Navigation */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3">
                      <button
                        type="button"
                        onClick={() => setSpekTab('info')}
                        className="btn-ghost !py-1 !px-3 text-xs"
                      >
                        ← Kembali ke 2. Info Paket &amp; PPK
                      </button>
                      <span className="text-xs font-bold text-[#122922]/70">
                        Spesifikasi siap disimpan &amp; dicetak melalui panel sebelah kanan →
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== TAHAP 2 (step === 12): 2. HPS (HARGA PERKIRAAN SENDIRI) TERPISAH ==================== */}
          {step === 12 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#856404]">Dokumen Kedua (10–50 Juta)</span>
                    <h2 className="text-base font-extrabold text-[#122922]">2. BERITA ACARA PENETAPAN HPS &amp; LAMPIRAN RINCIAN HPS</h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#f6db5b] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    No HPS : {f.hps_nomor || `000.3.2/${f.hps_no_urut || nextNomor.nextHps}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Nomor Urut HPS (Otomatis / Manual)" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.hps_no_urut}
                        onChange={(e) => ubahNoUrutHps(e.target.value)}
                        placeholder="1286"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal Penetapan HPS">
                    <input
                      type="date"
                      className="input"
                      value={f.hps_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        setF((x) => ({
                          ...x,
                          hps_tanggal: v,
                          hps_nomor: `000.3.2/${x.hps_no_urut || nextNomor.nextHps}/05.1.2/${th}`,
                        }))
                      }}
                    />
                  </Field>

                  <div>
                    {pilPejabat('PPKOM', 'ppkom_id', 'PPK Penandatangan HPS')}
                  </div>
                </div>

                {/* Tabel Lampiran Rincian HPS */}
                <div className="overflow-hidden rounded-2xl border border-[#122922]/15">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/12 bg-[#f7f5ef] px-4 py-3">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                        Lampiran Rincian Harga Perkiraan Sendiri (HPS)
                      </h3>
                      <p className="text-[11px] text-[#122922]/65">
                        Daftar barang diambil dari <b>1. Spesifikasi Teknis / KAK</b>. Silakan masukkan <b>Harga Satuan HPS</b> untuk setiap barang.
                      </p>
                    </div>
                    <button type="button" onClick={tambahItem} className="btn-lime !py-1.5 !px-3 text-xs">
                      <Plus size={14} strokeWidth={2.5} /> Tambah Item Barang
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/50">
                        <tr>
                          <th className="th w-10 text-center">No</th>
                          <th className="th">Uraian Barang / Spesifikasi</th>
                          <th className="th w-28 text-center">Unit/Satuan</th>
                          <th className="th w-24 text-center">Volume</th>
                          <th className="th w-40 text-right">Harga Satuan HPS (Rp)</th>
                          <th className="th w-40 text-right">Jumlah HPS (Rp)</th>
                          <th className="th w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#122922]/10">
                        {f.items.map((it, idx) => {
                          const hHps = Number(it.harga_hps) || Number(it.harga_satuan) || 0
                          const subHps = Math.round((Number(it.kuantitas) || 0) * hHps)
                          return (
                            <tr key={idx} className="hover:bg-[#f7f5ef]/40">
                              <td className="td text-center font-mono text-xs font-bold">{idx + 1}.</td>
                              <td className="p-2">
                                <input
                                  className="input !py-1.5"
                                  value={it.jenis_barang}
                                  onChange={(e) => updItem(idx, 'jenis_barang', e.target.value)}
                                  placeholder="mis. PC SET Build-up, Intel core i3 Gen 13, RAM 8GB DDR5, SSD 512GB"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  className="input !py-1.5 text-center"
                                  value={it.satuan}
                                  onChange={(e) => updItem(idx, 'satuan', e.target.value)}
                                  placeholder="Unit"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="input !py-1.5 text-center font-mono"
                                  value={it.kuantitas}
                                  onChange={(e) => updItem(idx, 'kuantitas', e.target.value)}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  inputMode="numeric"
                                  className="input !py-1.5 text-right font-mono"
                                  value={hHps ? num(hHps) : ''}
                                  onChange={(e) => updItem(idx, 'harga_hps', e.target.value.replace(/\D/g, ''))}
                                  placeholder="0"
                                />
                              </td>
                              <td className="td text-right font-mono font-bold tabular-nums text-[#122922]">
                                {rp(subHps)}
                              </td>
                              <td className="p-2 text-center">
                                {f.items.length > 1 && (
                                  <button type="button" onClick={() => hapusItem(idx)} className="rounded-full p-1.5 text-[#122922]/40 hover:bg-rose-50 hover:text-rose-600">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-[#122922] bg-[#f7f5ef]/80 text-sm">
                        <tr>
                          <td colSpan={5} className="px-4 py-2 text-right font-bold text-[#122922]">Total HPS (termasuk PPN 11%)</td>
                          <td className="px-4 py-2 text-right font-mono text-base font-extrabold text-[#1d5a42]">{rp(totalHpsItems)}</td>
                          <td />
                        </tr>
                        {totalHpsItems > 0 && (
                          <tr className="border-t border-[#122922]/10 bg-[#f6db5b]/35">
                            <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-[#122922]">
                              Terbilang HPS : <i>{terbilang(totalHpsItems)} rupiah.</i>
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP 3 (step === 20): 3. UNDANGAN PL & JADWAL PENGADAAN (50–750 JT) ==================== */}
          {step === 20 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Dokumen Ketiga (50–750 Juta)</span>
                    <h2 className="text-base font-extrabold text-[#122922]">3. UNDANGAN PENGADAAN LANGSUNG &amp; JADWAL KEGIATAN</h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#a9dcf0] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    No : {f.pl?.undangan_nomor || `000.3.2/${f.pl?.undangan_no_urut || nextNomor.nextPlUndangan || '2436'}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                {/* Nomor & Tanggal Undangan */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Nomor Urut Undangan PL" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.pl?.undangan_no_urut || ''}
                        onChange={(e) => ubahNoUrutUndanganPl(e.target.value)}
                        placeholder="2436"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal Undangan PL">
                    <input
                      type="date"
                      className="input"
                      value={f.pl?.undangan_tanggal || f.hps_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        updPl('undangan_tanggal', v)
                        updPl('undangan_nomor', `000.3.2/${f.pl?.undangan_no_urut || nextNomor.nextPlUndangan || '2436'}/05.1.2/${th}`)
                      }}
                    />
                  </Field>

                  <Field label="Lingkup Pekerjaan (Singkat)" hint="mis. Pengadaan AC Split dan AC Floor Standing">
                    <input
                      className="input"
                      value={f.pl?.lingkup_pekerjaan || f.uraian || ''}
                      onChange={(e) => updPl('lingkup_pekerjaan', e.target.value)}
                      placeholder="mis. Pengadaan AC Split dan AC Floor Standing"
                    />
                  </Field>
                </div>

                {/* Calon Penyedia yang Diundang */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-4 space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2 items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                      Calon Penyedia yang Diundang (1 Penyedia)
                    </span>
                    <SearchableSelect
                      value={f.penyedia_id || ''}
                      options={penyediaOptions}
                      placeholder="— Pilih Perusahaan / CV dari Master Penyedia —"
                      searchPlaceholder="Cari nama CV/PT, direktur, atau NPWP…"
                      allowClear
                      onChange={pilihPenyediaDariDaftar}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Nama Perusahaan">
                      <input
                        className="input"
                        value={f.penyedia}
                        onChange={(e) => upd('penyedia', e.target.value)}
                        placeholder="mis. CV. MULTITON GRAPHINDO"
                      />
                    </Field>
                    <Field label="Direktur / Pimpinan">
                      <input
                        className="input"
                        value={f.penyedia_pimpinan}
                        onChange={(e) => upd('penyedia_pimpinan', e.target.value)}
                        placeholder="mis. Ahmad Sajid, S.E"
                      />
                    </Field>
                    <Field label="Jabatan">
                      <input
                        className="input"
                        value={f.penyedia_jabatan}
                        onChange={(e) => upd('penyedia_jabatan', e.target.value)}
                        placeholder="Direktur"
                      />
                    </Field>
                    <Field label="NPWP">
                      <input
                        className="input font-mono"
                        value={f.penyedia_npwp || ''}
                        onChange={(e) => upd('penyedia_npwp', e.target.value)}
                        placeholder="81.242.576.7-528.000"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Alamat Lengkap Perusahaan">
                      <input
                        className="input"
                        value={f.penyedia_alamat}
                        onChange={(e) => upd('penyedia_alamat', e.target.value)}
                        placeholder="mis. Jl. KH. Agus Salim Gang 5, Mojomulyo, Sragen"
                      />
                    </Field>
                    <div>
                      {pilPejabat('PENGADAAN', 'pengadaan_id', 'Pejabat Pengadaan (Penandatangan Undangan)')}
                    </div>
                  </div>
                </div>

                {/* Jadwal Pelaksanaan Pengadaan Langsung (5 Tahapan) */}
                <div className="rounded-2xl border-2 border-[#122922] bg-white p-4 space-y-3.5 shadow-[4px_4px_0_#122922]">
                  <div className="flex items-center justify-between border-b border-[#122922]/10 pb-2">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                        Jadwal Pelaksanaan Pengadaan Langsung (Lampiran Undangan PL)
                      </h3>
                      <p className="text-[11px] text-[#122922]/65">
                        Tentukan tanggal masing-masing tahapan. Dokumen-dokumen berikutnya akan otomatis tersinkronisasi mengikuti tanggal ini.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                    <Field label="1. Pemasukan Dokumen Penawaran">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.pemasukan_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('pemasukan_tgl', v)
                          if (!f.pl?.penawaran_tanggal) updPl('penawaran_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="2. Pembukaan Dokumen Penawaran">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.pembukaan_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('pembukaan_tgl', v)
                          if (!f.pl?.pembukaan_tanggal) updPl('pembukaan_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="3. Evaluasi Penawaran">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.evaluasi_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('evaluasi_tgl', v)
                          if (!f.pl?.evaluasi_tanggal) updPl('evaluasi_tanggal', v)
                          if (!f.pl?.undangan_klarifikasi_tanggal) updPl('undangan_klarifikasi_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="4a. Tanggal Klarifikasi & Negosiasi">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.klarifikasi_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('klarifikasi_tgl', v)
                          upd('bakn_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="4b. Waktu Pertemuan Klarifikasi">
                      <input
                        className="input text-center font-bold"
                        value={f.pl?.jadwal?.klarifikasi_waktu || '09.00 WIB'}
                        onChange={(e) => updJadwal('klarifikasi_waktu', e.target.value)}
                        placeholder="09.00 WIB"
                      />
                    </Field>

                    <Field label="5. Penetapan Pemenang & BAHPL">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.penetapan_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('penetapan_tgl', v)
                          if (!f.pl?.penetapan_tanggal) updPl('penetapan_tanggal', v)
                          if (!f.pl?.bahpl_tanggal) updPl('bahpl_tanggal', v)
                          if (!f.pl?.pengumuman_tanggal) updPl('pengumuman_tanggal', v)
                          if (!f.pl?.laporan_tanggal) updPl('laporan_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="6. Penandatanganan SPK (Kontrak)">
                      <input
                        type="date"
                        className="input font-semibold"
                        value={f.pl?.jadwal?.spk_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updJadwal('spk_tgl', v)
                          upd('spk_tanggal', v)
                          updPl('spk_tanggal', v)
                        }}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP 4 (step === 21): 4. PEMBUKAAN & EVALUASI PENAWARAN (50–750 JT) ==================== */}
          {step === 21 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#4c3f91]">Dokumen Keempat &amp; Kelima (50–750 Juta)</span>
                    <h2 className="text-base font-extrabold text-[#122922]">4. BA PEMBUKAAN &amp; BA HASIL EVALUASI PENAWARAN</h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#b7aef3] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    Induk : 000.3.2/{f.pl?.evaluasi_no_urut?.replace(/\.[a-z]$/i, '') || '2573'}/05.1.2/{tahunBerjalan}
                  </div>
                </div>

                {/* Nomor Induk & Sufiks Otomatis */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/70 p-4 space-y-3">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nomor Urut Induk (Sufiks Otomatis .b &amp; .c)" hint="Ubah angka induk, sufiks menyesuaikan otomatis">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-white focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                        <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                        <input
                          className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                          value={f.pl?.evaluasi_no_urut?.replace(/\.[a-z]$/i, '') || '2573'}
                          onChange={(e) => ubahBaseNoUrutEvaluasi(e.target.value)}
                          placeholder="2573"
                        />
                        <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                      </div>
                    </Field>

                    <Field label="4. No BA Pembukaan (.b)">
                      <input className="input font-mono font-bold bg-[#f7f5ef]" readOnly value={f.pl?.pembukaan_nomor || `000.3.2/2573.b/05.1.2/${tahunBerjalan}`} />
                    </Field>

                    <Field label="5. No BA Evaluasi (.c)">
                      <input className="input font-mono font-bold bg-[#f7f5ef]" readOnly value={f.pl?.evaluasi_nomor || `000.3.2/2573.c/05.1.2/${tahunBerjalan}`} />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Tanggal BA Pembukaan Penawaran">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.pembukaan_tanggal || f.pl?.jadwal?.pembukaan_tgl || ''}
                        onChange={(e) => updPl('pembukaan_tanggal', e.target.value)}
                      />
                    </Field>
                    <Field label="Tanggal BA Evaluasi Penawaran">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.evaluasi_tanggal || f.pl?.jadwal?.evaluasi_tgl || ''}
                        onChange={(e) => updPl('evaluasi_tanggal', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>

                {/* Surat Penawaran Masuk dari Penyedia */}
                <div className="rounded-2xl border border-[#122922]/15 bg-white p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-[#122922]/10 pb-2">
                    <span className="font-mono text-xs font-extrabold uppercase text-[#122922]">
                      Surat Penawaran dari Penyedia ({f.penyedia || 'CV / Penyedia'})
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Nomor Surat Penawaran Penyedia" hint="Ketik nomor surat penawaran dari CV">
                      <input
                        className="input font-mono font-bold"
                        value={f.pl?.penawaran_nomor || ''}
                        onChange={(e) => updPl('penawaran_nomor', e.target.value)}
                        placeholder={`05/PNWR/${f.penyedia?.split(' ')[1] || 'MG'}/${tahunBerjalan}`}
                      />
                    </Field>

                    <Field label="Tanggal Surat Penawaran">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.penawaran_tanggal || f.pl?.jadwal?.pemasukan_tgl || ''}
                        onChange={(e) => updPl('penawaran_tanggal', e.target.value)}
                      />
                    </Field>

                    <Field label="Total Harga Penawaran (Rp)" hint="Bisa diketik di sini atau di BA Negosiasi">
                      <input
                        inputMode="numeric"
                        className="input font-mono font-bold"
                        value={totalPenawaranEfektif ? num(totalPenawaranEfektif) : ''}
                        onChange={(e) => upd('penawaran_total', Number(e.target.value.replace(/\D/g, '')) || 0)}
                        placeholder="Rp 0"
                      />
                    </Field>
                  </div>

                  <div className="rounded-xl border border-[#122922]/15 bg-[#b5e8a5]/30 p-3 text-xs text-[#122922]">
                    <div className="font-bold flex items-center gap-1.5 text-[#1d5a42]">
                      <Check size={14} /> Hasil Evaluasi Kualifikasi &amp; Teknis : MEMENUHI SYARAT (LULUS)
                    </div>
                    <p className="mt-1 text-[11px] text-[#122922]/75">
                      Penyedia telah melampirkan Dokumen Kualifikasi Izin Berusaha (NIB/NPWP), Surat Penawaran lengkap dengan materai, Spesifikasi Teknis sesuai KAK PPK, dan dinyatakan <b>Lulus Evaluasi Administrasi, Kualifikasi, Teknis, dan Harga</b> untuk dilanjutkan ke tahap Klarifikasi &amp; Negosiasi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP KLARIFIKASI & NEGOSIASI (step === 11) ==================== */}
          {step === 11 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#1d5a42]">
                      {is50750 ? 'Dokumen Keenam & Ketujuh (50–750 Juta)' : 'Dokumen Ketiga (10–50 Juta)'}
                    </span>
                    <h2 className="text-base font-extrabold text-[#122922]">
                      {is50750 ? '5. UNDANGAN & BERITA ACARA KLARIFIKASI TEKNIS & NEGOSIASI HARGA' : '3. BERITA ACARA KLARIFIKASI TEKNIS DAN NEGOSIASI HARGA'}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#a9dcf0] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    Nomor : {f.bakn_nomor || `000.3.2/${f.bakn_no_urut || nextNomor.nextBakn}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                {is50750 && (
                  <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/70 p-4 space-y-3">
                    <div className="font-mono text-xs font-extrabold uppercase text-[#122922]">
                      Undangan Klarifikasi Teknis &amp; Negosiasi Harga (Kepada Penyedia)
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <Field label="Nomor Urut Undangan Klarifikasi" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                        <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-white focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                          <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                          <input
                            className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                            value={f.pl?.undangan_klarifikasi_no_urut || '2578.a'}
                            onChange={(e) => ubahNoUrutUndanganKlarifikasi(e.target.value)}
                            placeholder="2578.a"
                          />
                          <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                        </div>
                      </Field>

                      <Field label="Tanggal Undangan Klarifikasi">
                        <input
                          type="date"
                          className="input"
                          value={f.pl?.undangan_klarifikasi_tanggal || f.pl?.jadwal?.evaluasi_tgl || ''}
                          onChange={(e) => updPl('undangan_klarifikasi_tanggal', e.target.value)}
                        />
                      </Field>

                      <Field label="Waktu Pertemuan">
                        <input
                          className="input text-center font-bold"
                          value={f.pl?.jadwal?.klarifikasi_waktu || '09.00 WIB'}
                          onChange={(e) => updJadwal('klarifikasi_waktu', e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Nomor Urut BA Klarifikasi (Otomatis/Manual)" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-24 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.bakn_no_urut}
                        onChange={(e) => ubahNoUrutBakn(e.target.value)}
                        placeholder="2613.a"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal BA Klarifikasi & Negosiasi">
                    <input
                      type="date"
                      className="input"
                      value={f.bakn_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        setF((x) => ({
                          ...x,
                          bakn_tanggal: v,
                          bakn_nomor: `000.3.2/${x.bakn_no_urut || nextNomor.nextBakn}/05.1.2/${th}`,
                        }))
                      }}
                    />
                  </Field>

                  <Field label="7. Hasil Negosiasi Teknis">
                    <input
                      className="input"
                      value={f.bakn_hasil_teknis || 'Sesuai - Ada Perubahan'}
                      onChange={(e) => upd('bakn_hasil_teknis', e.target.value)}
                      placeholder="Sesuai - Ada Perubahan"
                    />
                  </Field>
                </div>

                {/* Data Peserta Pengadaan (Dari Master Penyedia) */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-4 space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2 items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                      Peserta Pengadaan (Ambil dari Master Data Penyedia)
                    </span>
                    <SearchableSelect
                      value={f.penyedia_id || ''}
                      options={penyediaOptions}
                      placeholder="— Pilih Perusahaan / CV dari Master Penyedia —"
                      searchPlaceholder="Cari nama CV/PT, direktur, atau NPWP…"
                      allowClear
                      onChange={pilihPenyediaDariDaftar}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="1. Nama Perusahaan">
                      <input
                        className="input"
                        value={f.penyedia}
                        onChange={(e) => upd('penyedia', e.target.value)}
                        placeholder="mis. CV. MULTITON GRAPHINDO"
                      />
                    </Field>
                    <Field label="2. Direktur / Kuasa Direktur">
                      <input
                        className="input"
                        value={f.penyedia_pimpinan}
                        onChange={(e) => upd('penyedia_pimpinan', e.target.value)}
                        placeholder="mis. Ahmad Sajid, S.E"
                      />
                    </Field>
                    <Field label="Jabatan Penandatangan">
                      <input
                        className="input"
                        value={f.penyedia_jabatan}
                        onChange={(e) => upd('penyedia_jabatan', e.target.value)}
                        placeholder="Direktur / Kuasa Direktur"
                      />
                    </Field>
                    <Field label="4. NPWP">
                      <input
                        className="input font-mono"
                        value={f.penyedia_npwp || ''}
                        onChange={(e) => upd('penyedia_npwp', e.target.value)}
                        placeholder="81.242.576.7-528.000"
                      />
                    </Field>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="3. Alamat Perusahaan">
                      <input
                        className="input"
                        value={f.penyedia_alamat}
                        onChange={(e) => upd('penyedia_alamat', e.target.value)}
                        placeholder="mis. Jl. KH. Agus Salim Gang 5, Mojomulyo, Sragen"
                      />
                    </Field>
                    <div>
                      {pilPejabat('PENGADAAN', 'pengadaan_id', 'Pejabat Pengadaan (Panitia Pengadaan)')}
                    </div>
                  </div>
                </div>

                {/* Ringkasan & Inputan Harga Penawaran Penyedia (Bukan Sama Persis dengan HPS) */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-[#122922]/20 bg-[#f6db5b]/35 p-3">
                    <div className="font-mono text-[10px] font-bold uppercase text-[#122922]/70">5. Nilai HPS (Dari Tahap 2 HPS)</div>
                    <div className="mt-1 font-mono text-base font-extrabold text-[#122922]">{rp(totalHpsItems)}</div>
                    <div className="mt-0.5 text-[10px] italic text-[#122922]/70">{terbilang(totalHpsItems)} rupiah</div>
                  </div>

                  <div className="rounded-xl border-2 border-[#122922] bg-[#a9dcf0]/40 p-3">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[#122922]">
                      6. Harga Penawaran Penyedia (Inputan)
                    </div>
                    <div className="mt-1">
                      <input
                        inputMode="numeric"
                        className="input !py-1.5 !px-2.5 bg-white font-mono text-sm font-extrabold text-[#122922]"
                        value={totalPenawaranEfektif ? num(totalPenawaranEfektif) : ''}
                        onChange={(e) => {
                          const raw = Number(e.target.value.replace(/\D/g, '')) || 0
                          upd('penawaran_total', raw)
                        }}
                        placeholder="Ketik total harga penawaran (Rp)…"
                      />
                    </div>
                    <div className="mt-1 text-[10px] italic text-[#122922]/75">
                      {totalPenawaranEfektif > 0
                        ? `${terbilang(totalPenawaranEfektif)} rupiah`
                        : 'Ketik nominal di atas atau isi Harga Satuan Penawaran di tabel bawah'}
                    </div>
                  </div>

                  <div className="rounded-xl border-2 border-[#122922] bg-[#d6ee30]/55 p-3">
                    <div className="font-mono text-[10px] font-extrabold uppercase text-[#122922]">8. Hasil Negosiasi Harga (SP &amp; A2)</div>
                    <div className="mt-1 font-mono text-base font-extrabold text-[#1d5a42]">{rp(totalItems)}</div>
                    <div className="mt-0.5 text-[10px] italic text-[#122922]/80">{terbilang(totalItems)} rupiah</div>
                  </div>
                </div>

                {/* Tabel Lampiran BA Klarifikasi & Negosiasi (HPS | Penawaran | Negosiasi | Jumlah) */}
                <div className="overflow-hidden rounded-2xl border border-[#122922]/15">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/12 bg-[#f7f5ef] px-4 py-3">
                    <div>
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                        Lampiran BA Klarifikasi Teknis &amp; Negosiasi Harga (HPS vs Penawaran vs Negosiasi)
                      </h3>
                      <p className="text-[11px] text-[#122922]/65">
                        Harga HPS diambil dari Tahap HPS. Silakan isi <b>Harga Satuan Penawaran</b> penyedia dan <b>Harga Satuan Negosiasi</b>.
                      </p>
                    </div>
                    <button type="button" onClick={tambahItem} className="btn-lime !py-1.5 !px-3 text-xs">
                      <Plus size={14} strokeWidth={2.5} /> Tambah Item
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/50">
                        <tr>
                          <th className="th w-9 text-center">No</th>
                          <th className="th">Uraian Barang / Spesifikasi</th>
                          <th className="th w-20 text-center">Satuan</th>
                          <th className="th w-20 text-center">Vol</th>
                          <th className="th w-32 text-right">HPS (Rp)</th>
                          <th className="th w-36 text-right">Penawaran (Rp)</th>
                          <th className="th w-36 text-right">Negosiasi (Rp)</th>
                          <th className="th w-36 text-right">Jumlah Nego (Rp)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#122922]/10">
                        {f.items.map((it, idx) => {
                          const qty = Number(it.kuantitas) || 1
                          const hHps = Number(it.harga_hps) || Number(it.harga_satuan) || 0
                          const hPen = Number(it.harga_penawaran) || 0
                          const hNego = Number(it.harga_satuan) || hHps
                          const subNego = Math.round(qty * hNego)
                          return (
                            <tr key={idx} className="hover:bg-[#f7f5ef]/40">
                              <td className="td text-center font-mono text-xs font-bold">{idx + 1}.</td>
                              <td className="p-2">
                                <input
                                  className="input !py-1.5 text-xs"
                                  value={it.jenis_barang}
                                  onChange={(e) => updItem(idx, 'jenis_barang', e.target.value)}
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  className="input !py-1.5 text-center text-xs"
                                  value={it.satuan}
                                  onChange={(e) => updItem(idx, 'satuan', e.target.value)}
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  className="input !py-1.5 text-center font-mono text-xs"
                                  value={it.kuantitas}
                                  onChange={(e) => updItem(idx, 'kuantitas', e.target.value)}
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  inputMode="numeric"
                                  className="input !py-1.5 text-right font-mono text-xs bg-[#f7f5ef]"
                                  value={hHps ? num(hHps) : ''}
                                  onChange={(e) => updItem(idx, 'harga_hps', e.target.value.replace(/\D/g, ''))}
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  inputMode="numeric"
                                  className="input !py-1.5 text-right font-mono text-xs border-[#122922] bg-[#a9dcf0]/20"
                                  value={hPen ? num(hPen) : ''}
                                  onChange={(e) => updItem(idx, 'harga_penawaran', e.target.value.replace(/\D/g, ''))}
                                  placeholder="Input penawaran…"
                                />
                              </td>
                              <td className="p-1.5">
                                <input
                                  inputMode="numeric"
                                  className="input !py-1.5 text-right font-mono text-xs font-extrabold border-[#122922] bg-[#d6ee30]/25"
                                  value={hNego ? num(hNego) : ''}
                                  onChange={(e) => updItem(idx, 'harga_satuan', e.target.value.replace(/\D/g, ''))}
                                  placeholder="Input negosiasi…"
                                />
                              </td>
                              <td className="td text-right font-mono text-xs font-extrabold tabular-nums text-[#1d5a42]">
                                {rp(subNego)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="border-t-2 border-[#122922] bg-[#f7f5ef]/80 text-xs">
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-right font-bold text-[#122922]">Total (termasuk PPN 11%)</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-[#122922]/70">{rp(totalHpsItems)}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-[#122922]">{totalPenawaranEfektif > 0 ? rp(totalPenawaranEfektif) : '—'}</td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-[#1d5a42]">Hasil Nego:</td>
                          <td className="px-3 py-2 text-right font-mono text-sm font-extrabold text-[#1d5a42]">{rp(totalItems)}</td>
                        </tr>
                        {totalItems > 0 && (
                          <tr className="border-t border-[#122922]/10 bg-[#d6ee30]/35">
                            <td colSpan={8} className="px-4 py-2 text-xs font-semibold text-[#122922]">
                              Terbilang Hasil Negosiasi : <i>{terbilang(totalItems)} rupiah.</i>
                            </td>
                          </tr>
                        )}
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP 6 (step === 22): 6. PENETAPAN PEMENANG, BAHPL & LAPORAN PPK (50–750 JT) ==================== */}
          {step === 22 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Dokumen Kedelapan, Kesembilan, Kesepuluh &amp; Kesebelas</span>
                    <h2 className="text-base font-extrabold text-[#122922]">6. PENETAPAN PEMENANG, BAHPL, PENGUMUMAN &amp; LAPORAN PPK</h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#d6ee30] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    Induk : 000.3.2/{f.pl?.penetapan_no_urut || '2656'}/05.1.2/{tahunBerjalan}
                  </div>
                </div>

                {/* Nomor Urut Penetapan & Sufiks Otomatis */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/70 p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Nomor Urut Penetapan (Induk)" hint="Penetapan (Polos), BAHPL (.a), Pengumuman (.b)">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-white focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                        <input
                          className="w-16 bg-white px-1 py-2 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                          value={f.pl?.penetapan_no_urut || '2656'}
                          onChange={(e) => ubahBaseNoUrutPenetapan(e.target.value)}
                          placeholder="2656"
                        />
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2</span>
                      </div>
                    </Field>

                    <Field label="8. BA Penetapan Pemenang">
                      <input className="input font-mono text-xs font-bold bg-[#f7f5ef]" readOnly value={f.pl?.penetapan_nomor || `000.3.2/2656/05.1.2/${tahunBerjalan}`} />
                    </Field>

                    <Field label="9. BAHPL (.a)">
                      <input className="input font-mono text-xs font-bold bg-[#f7f5ef]" readOnly value={f.pl?.bahpl_nomor || `000.3.2/2656.a/05.1.2/${tahunBerjalan}`} />
                    </Field>

                    <Field label="10. Pengumuman PL (.b)">
                      <input className="input font-mono text-xs font-bold bg-[#f7f5ef]" readOnly value={f.pl?.pengumuman_nomor || `000.3.2/2656.b/05.1.2/${tahunBerjalan}`} />
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Tanggal Penetapan Pemenang & BAHPL">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.penetapan_tanggal || f.pl?.jadwal?.penetapan_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          updPl('penetapan_tanggal', v)
                          updPl('bahpl_tanggal', v)
                          updPl('pengumuman_tanggal', v)
                          if (!f.pl?.laporan_tanggal) updPl('laporan_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="Nomor Laporan Hasil PL ke PPK" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-white focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                        <input
                          className="w-16 bg-white px-1 py-2 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                          value={f.pl?.laporan_no_urut || nextNomor.nextPlLaporan || '2657'}
                          onChange={(e) => ubahNoUrutLaporanPl(e.target.value)}
                          placeholder="2657"
                        />
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2</span>
                      </div>
                    </Field>

                    <Field label="Tanggal Laporan ke PPK">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.laporan_tanggal || f.pl?.penetapan_tanggal || ''}
                        onChange={(e) => updPl('laporan_tanggal', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>

                {/* Ringkasan Hasil Pengadaan Langsung */}
                <div className="rounded-2xl border border-[#122922]/15 bg-white p-4 space-y-3">
                  <span className="font-mono text-xs font-extrabold uppercase text-[#122922]">
                    Ringkasan Pemenang Pengadaan Langsung
                  </span>
                  <div className="grid gap-3 sm:grid-cols-4 text-xs">
                    <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3">
                      <span className="text-[#122922]/60 block font-medium">Penyedia Terpilih:</span>
                      <b className="text-sm font-extrabold text-[#122922] mt-0.5 block">{f.penyedia || '—'}</b>
                      <span className="text-[11px] text-[#122922]/70">{f.penyedia_pimpinan} ({f.penyedia_jabatan})</span>
                    </div>
                    <div className="rounded-xl border border-[#122922]/15 bg-[#f6db5b]/30 p-3">
                      <span className="text-[#122922]/60 block font-medium">Nilai HPS:</span>
                      <b className="text-sm font-mono font-extrabold text-[#122922] mt-0.5 block">{rp(totalHpsItems)}</b>
                    </div>
                    <div className="rounded-xl border border-[#122922]/15 bg-[#a9dcf0]/40 p-3">
                      <span className="text-[#122922]/60 block font-medium">Harga Penawaran:</span>
                      <b className="text-sm font-mono font-extrabold text-[#122922] mt-0.5 block">{rp(totalPenawaranEfektif)}</b>
                    </div>
                    <div className="rounded-xl border-2 border-[#122922] bg-[#d6ee30]/50 p-3">
                      <span className="text-[#122922]/60 block font-medium">Hasil Negosiasi (Kontrak):</span>
                      <b className="text-sm font-mono font-extrabold text-[#1d5a42] mt-0.5 block">{rp(totalItems)}</b>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP 7 (step === 23): 7. SPPBJ & KONTRAK SPK (50–750 JT) ==================== */}
          {step === 23 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Dokumen Keduabelas &amp; Ketigabelas</span>
                    <h2 className="text-base font-extrabold text-[#122922]">7. SPPBJ &amp; SURAT PERINTAH KERJA (SPK)</h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#d6ee30] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    No SPK : {f.spk_nomor || `000.3.2/${f.spk_no_urut || nextNomor.nextSpk || '2673'}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                {/* SPPBJ (Surat Penunjukan Penyedia Barang/Jasa) */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/70 p-4 space-y-3">
                  <div className="font-mono text-xs font-extrabold uppercase text-[#122922]">
                    A. Surat Penunjukan Penyedia Barang / Jasa (SPPBJ) oleh PPK
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Nomor Urut SPPBJ" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-white focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                        <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                        <input
                          className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                          value={f.pl?.sppbj_no_urut || nextNomor.nextSppbj || '1769'}
                          onChange={(e) => ubahNoUrutSppbj(e.target.value)}
                          placeholder="1769"
                        />
                        <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                      </div>
                    </Field>

                    <Field label="Tanggal Terbit SPPBJ" hint="Diterbitkan PPK sebelum penandatanganan SPK">
                      <input
                        type="date"
                        className="input"
                        value={f.pl?.sppbj_tanggal || ''}
                        onChange={(e) => updPl('sppbj_tanggal', e.target.value)}
                      />
                    </Field>
                  </div>
                </div>

                {/* Kontrak SPK (Surat Perintah Kerja) */}
                <div className="rounded-2xl border-2 border-[#122922] bg-white p-4 space-y-3.5 shadow-[4px_4px_0_#122922]">
                  <div className="flex items-center justify-between border-b border-[#122922]/10 pb-2">
                    <span className="font-mono text-xs font-extrabold uppercase text-[#122922]">
                      B. Surat Perintah Kerja (SPK Kontrak)
                    </span>
                    <span className="rounded-full border border-[#122922] bg-[#a9dcf0] px-2.5 py-0.5 font-mono text-[11px] font-bold">
                      Lampiran Rincian Barang (.a)
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-4">
                    <Field label="Nomor Urut SPK (Kontrak)" hint="000.3.2/[Nomor]/05.1.2/Tahun">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                        <input
                          className="w-16 bg-white px-1 py-2 text-center font-mono text-sm font-extrabold text-[#122922] outline-none"
                          value={f.spk_no_urut || ''}
                          onChange={(e) => ubahNoUrutSpk(e.target.value)}
                          placeholder="2673"
                        />
                        <span className="px-2 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                      </div>
                    </Field>

                    <Field label="Tanggal Penandatanganan SPK">
                      <input
                        type="date"
                        className="input"
                        value={f.spk_tanggal || f.pl?.jadwal?.spk_tgl || ''}
                        onChange={(e) => {
                          const v = e.target.value
                          upd('spk_tanggal', v)
                          updPl('spk_tanggal', v)
                        }}
                      />
                    </Field>

                    <Field label="Jenis Kontrak">
                      <input
                        className="input font-semibold"
                        value={f.pl?.spk_jenis_kontrak || 'Kontrak Harga Satuan'}
                        onChange={(e) => updPl('spk_jenis_kontrak', e.target.value)}
                      />
                    </Field>

                    <Field label="Waktu Pelaksanaan (Hari Kalender)">
                      <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef]">
                        <input
                          type="number"
                          className="w-full bg-white px-3 py-2 text-center font-mono text-sm font-bold"
                          value={f.pl?.spk_waktu_hari || 30}
                          onChange={(e) => updPl('spk_waktu_hari', e.target.value)}
                        />
                        <span className="px-2.5 text-xs font-semibold text-[#122922]/70">Hari</span>
                      </div>
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>{pilPejabat('PPKOM', 'ppkom_id', 'Pejabat Pembuat Komitmen (Pihak Pertama)')}</div>
                    <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs">
                      <span className="text-[#122922]/60 block font-medium">Pihak Kedua (Penyedia):</span>
                      <b className="text-sm font-bold text-[#122922] block mt-0.5">{f.penyedia || '—'}</b>
                      <span className="text-[11px] text-[#122922]/75">Direktur: {f.penyedia_pimpinan || '—'} (Materai Rp 10.000)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP SURAT PESANAN (SP) ==================== */}
          {step === 1 && is50750 && (
            <div className="card space-y-4 p-6 border-2 border-[#122922] bg-[#f7f5ef]">
              <div className="flex items-center gap-2 text-[#3f8f77]">
                <PackageCheck size={20} />
                <h2 className="text-base font-extrabold text-[#122922]">Surat Pesanan (SP) Tidak Digunakan pada Pengadaan Langsung 50–750 Jt</h2>
              </div>
              <p className="text-xs text-[#122922]/80 leading-relaxed">
                Sesuai ketentuan pengadaan barang/jasa dan instruksi alur, untuk paket tier <b>50–750 Juta</b>, Surat Pesanan (SP) <b>digantikan sepenuhnya oleh Surat Perintah Kerja (SPK)</b> pada Tahap 7. Berkas BAST dan BAPHP akan langsung merujuk ke Nomor dan Tanggal SPK.
              </p>
              <div>
                <button
                  type="button"
                  onClick={() => pilihModeStep(23)}
                  className="btn-lime"
                >
                  Buka Tahap 7 (SPPBJ &amp; SPK) →
                </button>
              </div>
            </div>
          )}

          {step === 1 && !is50750 && (
            <div className="space-y-6">
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">
                      {is1050 ? 'Dokumen Keempat (Setelah BA Klarifikasi & Negosiasi)' : 'Dokumen Pertama'}
                    </span>
                    <h2 className="text-base font-extrabold text-[#122922]">
                      {is1050 ? '4. SURAT PESANAN (SP)' : '1. SURAT PESANAN (SP)'}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#d6ee30]/70 px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    No : {f.sp_nomor || `000.3.2/${f.sp_no_urut || '1607'}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                {/* Penomoran SP */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Nomor Urut SP (Otomatis / Manual)" hint="Bagian yang berubah otomatis, bisa diketik manual">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-20 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.sp_no_urut}
                        onChange={(e) => ubahNoUrutSp(e.target.value)}
                        placeholder="1607"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal Surat Pesanan" hint="mis. Sragen, 1 September 2026">
                    <input
                      type="date"
                      className="input"
                      value={f.sp_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        setF((x) => ({
                          ...x,
                          sp_tanggal: v,
                          sp_nomor: `000.3.2/${x.sp_no_urut || '1607'}/05.1.2/${th}`,
                        }))
                      }}
                    />
                  </Field>

                  <Field label="Batas Tanggal Pengiriman" hint="Dikirim selambat-lambatnya tanggal…">
                    <input type="date" className="input" value={f.sp_tgl_kirim} onChange={(e) => upd('sp_tgl_kirim', e.target.value)} />
                  </Field>
                </div>

                {/* Penyedia Barang/Jasa */}
                <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-4 space-y-3.5">
                  <div className="grid gap-3 sm:grid-cols-2 items-center">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">Kepada Yth. Penyedia Barang / Jasa (CV / PT)</span>
                    <SearchableSelect
                      value={f.penyedia_id || ''}
                      options={penyediaOptions}
                      placeholder="— Pilih dari Master Penyedia atau ketik di bawah —"
                      searchPlaceholder="Cari nama CV/PT, direktur, atau NPWP…"
                      allowClear
                      onChange={pilihPenyediaDariDaftar}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Nama CV / Penyedia">
                      <input
                        className="input"
                        value={f.penyedia}
                        onChange={(e) => upd('penyedia', e.target.value)}
                        placeholder="mis. CV. Surya Globe"
                      />
                    </Field>
                    <Field label="Nama Direktur / Pimpinan">
                      <input
                        className="input"
                        value={f.penyedia_pimpinan}
                        onChange={(e) => upd('penyedia_pimpinan', e.target.value)}
                        placeholder="mis. Sigit Gunawan"
                      />
                    </Field>
                    <Field label="Jabatan">
                      <input
                        className="input"
                        value={f.penyedia_jabatan}
                        onChange={(e) => upd('penyedia_jabatan', e.target.value)}
                        placeholder="Direktur"
                      />
                    </Field>
                    <Field label="NPWP">
                      <input
                        className="input font-mono"
                        value={f.penyedia_npwp || ''}
                        onChange={(e) => upd('penyedia_npwp', e.target.value)}
                        placeholder="01.234.567.8-526.000"
                      />
                    </Field>
                  </div>
                  <Field label="Alamat Lengkap Penyedia">
                    <input
                      className="input"
                      value={f.penyedia_alamat}
                      onChange={(e) => upd('penyedia_alamat', e.target.value)}
                      placeholder="mis. Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta"
                    />
                  </Field>
                </div>

              </div>

              {/* Tabel Item Barang */}
              <div className="card overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/12 bg-[#f7f5ef] px-5 py-3.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#122922]">Tabel Rincian Barang yang Dipesan</h3>
                    <p className="text-xs text-[#122922]/60">
                      {is1050
                        ? 'Otomatis menggunakan Harga Negosiasi dari BA Klarifikasi & Negosiasi'
                        : 'Dicetak di Surat Pesanan (SP), lalu otomatis diteruskan ke BAST saat barang diterima'}
                    </p>
                  </div>
                  <button type="button" onClick={tambahItem} className="btn-lime !py-1.5 !px-3 text-xs">
                    <Plus size={14} strokeWidth={2.5} /> Tambah Barang
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/50">
                      <tr>
                        <th className="th w-10 text-center">No</th>
                        <th className="th">Jenis Barang</th>
                        <th className="th w-28">Satuan</th>
                        <th className="th w-24 text-center">Kuantitas</th>
                        <th className="th w-40 text-right">Harga Satuan (Rp)</th>
                        <th className="th w-40 text-right">Harga Total (Rp)</th>
                        <th className="th w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#122922]/10">
                      {f.items.map((it, idx) => {
                        const hs = Number(it.harga_satuan) || Number(it.harga_hps) || 0
                        const sub = Math.round((Number(it.kuantitas) || 0) * hs)
                        return (
                          <tr key={idx} className="hover:bg-[#f7f5ef]/40">
                            <td className="td text-center font-mono text-xs font-bold">{idx + 1}.</td>
                            <td className="p-2">
                              <input
                                className="input !py-1.5"
                                value={it.jenis_barang}
                                onChange={(e) => updItem(idx, 'jenis_barang', e.target.value)}
                                placeholder="Nama / spesifikasi barang…"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                className="input !py-1.5 text-center"
                                value={it.satuan}
                                onChange={(e) => updItem(idx, 'satuan', e.target.value)}
                                placeholder="Unit"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                className="input !py-1.5 text-center font-mono"
                                value={it.kuantitas}
                                onChange={(e) => updItem(idx, 'kuantitas', e.target.value)}
                              />
                            </td>
                            <td className="p-2">
                              <input
                                inputMode="numeric"
                                className="input !py-1.5 text-right font-mono"
                                value={hs ? num(hs) : ''}
                                onChange={(e) => updItem(idx, 'harga_satuan', e.target.value.replace(/\D/g, ''))}
                                placeholder="0"
                              />
                            </td>
                            <td className="td text-right font-mono font-bold tabular-nums text-[#122922]">
                              {num(sub)}
                            </td>
                            <td className="p-2 text-center">
                              {f.items.length > 1 && (
                                <button type="button" onClick={() => hapusItem(idx)} className="rounded-full p-1.5 text-[#122922]/40 hover:bg-rose-50 hover:text-rose-600">
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="border-t-2 border-[#122922] bg-[#f7f5ef]/80 text-sm">
                      <tr>
                        <td colSpan={5} className="px-4 py-2 text-right font-bold text-[#122922]/75">Jumlah</td>
                        <td className="px-4 py-2 text-right font-mono font-extrabold text-[#122922]">{rp(totalItems)}</td>
                        <td />
                      </tr>
                      <tr className="border-t border-[#122922]/10">
                        <td colSpan={5} className="px-4 py-2 text-right font-bold text-[#122922]">Dibulatkan (termasuk PPN 11%)</td>
                        <td className="px-4 py-2 text-right font-mono text-base font-extrabold text-[#1d5a42]">{rp(nominalEfektif)}</td>
                        <td />
                      </tr>
                      {nominalEfektif > 0 && (
                        <tr className="border-t border-[#122922]/10 bg-[#d6ee30]/35">
                          <td colSpan={7} className="px-4 py-2 text-xs font-semibold text-[#122922]">
                            Terbilang : <i>{terbilang(nominalEfektif)}.</i>
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAHAP SERAH TERIMA (BAST + BAPHP + A2 + VERIFIKASI) ==================== */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Bagian A: BAST (Penyedia -> PPK); tidak dipakai pada alur 0–2 jt */}
              {!is02 && (<div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Dokumen Serah Terima (Penyedia → PPK)</span>
                    <h2 className="text-base font-extrabold text-[#122922]">
                      {is50750 ? '14. BERITA ACARA SERAH TERIMA HASIL PEKERJAAN (BAST)' : is1050 ? '5. BERITA ACARA SERAH TERIMA HASIL PEKERJAAN (BAST)' : '2. BERITA ACARA SERAH TERIMA HASIL PEKERJAAN (BAST)'}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#a9dcf0] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    Nomor : {f.bast_nomor || `000.3.2/${f.bast_no_urut || nextNomor.nextBast}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nomor Urut BAST (Otomatis / Manual)" hint="Aturan sama dengan SP/SPK: tengah otomatis/manual, belakang tahun berjalan">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-24 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.bast_no_urut}
                        onChange={(e) => ubahNoUrutBast(e.target.value)}
                        placeholder="1631"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal BAST (Barang Diterima)">
                    <input
                      type="date"
                      className="input"
                      value={f.bast_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        setF((x) => ({
                          ...x,
                          bast_tanggal: v,
                          baphp_tanggal: x.baphp_tanggal || v,
                          tanggal: v,
                          bast_nomor: `000.3.2/${x.bast_no_urut || nextNomor.nextBast}/05.1.2/${th}`,
                        }))
                      }}
                    />
                  </Field>
                </div>

              </div>)}

              {/* Bagian B: BAPHP (PPK -> Kuasa Pengguna Anggaran / Direktur) */}
              <div className="card space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                  <div>
                    <span className="font-mono text-[11px] font-bold uppercase text-[#4c3f91]">Dokumen Penyerahan PPK → Kuasa Pengguna Anggaran</span>
                    <h2 className="text-base font-extrabold text-[#122922]">
                      {is50750 ? '15. BERITA ACARA PENYERAHAN HASIL PEKERJAAN (BAPHP)' : is1050 ? '6. BERITA ACARA PENYERAHAN HASIL PEKERJAAN (BAPHP)' : is02 ? '2. BERITA ACARA PENYERAHAN HASIL PEKERJAAN (BAPHP)' : '3. BERITA ACARA PENYERAHAN HASIL PEKERJAAN (BAPHP)'}
                    </h2>
                  </div>
                  <div className="rounded-full border border-[#122922] bg-[#b7aef3] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                    Nomor : {f.baphp_nomor || `000.3.2/${f.baphp_no_urut || (is02 ? nextNomor.nextBast : `${f.bast_no_urut || nextNomor.nextBast}.a`)}/05.1.2/${tahunBerjalan}`}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nomor Urut BAPHP (Otomatis / Manual)" hint="Default mengikuti nomor BAST + .a (mis. 1351.a), bisa diubah manual">
                    <div className="flex items-center overflow-hidden rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef] focus-within:border-[#122922] focus-within:ring-3 focus-within:ring-[#d6ee30]/60">
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">000.3.2/</span>
                      <input
                        className="w-24 bg-white px-2 py-2.5 text-center font-mono text-sm font-extrabold text-[#122922] outline-none border-x border-[#122922]/15"
                        value={f.baphp_no_urut}
                        onChange={(e) => ubahNoUrutBaphp(e.target.value)}
                        placeholder="1351.a"
                      />
                      <span className="px-2.5 font-mono text-xs font-semibold text-[#122922]/60">/05.1.2/{tahunBerjalan}</span>
                    </div>
                  </Field>

                  <Field label="Tanggal BAPHP (Inputan Sendiri)">
                    <input
                      type="date"
                      className="input"
                      value={f.baphp_tanggal || f.bast_tanggal}
                      onChange={(e) => {
                        const v = e.target.value
                        const th = v.slice(0, 4) || tahunBerjalan
                        setF((x) => ({
                          ...x,
                          baphp_tanggal: v,
                          baphp_nomor: `000.3.2/${x.baphp_no_urut || (is02 ? nextNomor.nextBast : `${x.bast_no_urut || nextNomor.nextBast}.a`)}/05.1.2/${th}`,
                        }))
                      }}
                    />
                  </Field>
                </div>

              </div>

              {/* Bagian C: A2 & Lembar Verifikasi */}
              <div className="card space-y-4 p-5">
                <div className="border-b border-[#122922]/10 pb-3">
                  <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Dokumen Pencairan SPJ</span>
                  <h2 className="text-base font-extrabold text-[#122922]">
                    {is50750
                      ? '16. A2 (SURAT BUKTI PENGELUARAN) & 17. LEMBAR VERIFIKASI'
                      : is1050
                      ? '7. A2 (SURAT BUKTI PENGELUARAN) & 8. LEMBAR VERIFIKASI'
                      : is02 ? '3. A2 (SURAT BUKTI PENGELUARAN) & 4. LEMBAR VERIFIKASI' : '4. A2 (SURAT BUKTI PENGELUARAN) & 5. LEMBAR VERIFIKASI'}
                  </h2>
                </div>

                <div className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
                  <Field label="Jumlah Kotor / Dibulatkan (Rp)" hint="Otomatis dari jumlah item Surat Pesanan / Negosiasi, bisa disesuaikan">
                    <input
                      inputMode="numeric"
                      className="input text-right font-mono text-base font-extrabold tabular-nums"
                      value={nominalEfektif ? num(nominalEfektif) : ''}
                      onChange={(e) => upd('kotor', e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                    />
                  </Field>
                </div>

                {nominalEfektif > 0 && (
                  <div className="rounded-xl border border-[#122922]/15 bg-[#d6ee30]/35 px-3.5 py-2.5 text-xs font-bold text-[#122922]">
                    Terbilang: <i className="font-semibold">{terbilang(nominalEfektif)} Rupiah</i>
                  </div>
                )}

                <div className="grid gap-3 border-t border-[#122922]/10 pt-4 sm:grid-cols-2">
                  <label className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef]/60 px-3.5 py-2.5 text-sm font-bold text-[#122922]">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[#122922]" checked={f.ppn_aktif} onChange={(e) => upd('ppn_aktif', e.target.checked)} />
                      Potong PPN di A2
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#122922]/70">
                      <input type="number" step="0.1" className="w-14 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f.ppn_tarif} onChange={(e) => upd('ppn_tarif', e.target.value)} />%
                    </span>
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef]/60 px-3.5 py-2.5 text-sm font-bold text-[#122922]">
                    <span className="flex items-center gap-2">
                      <input type="checkbox" className="accent-[#122922]" checked={f.pph_aktif} onChange={(e) => upd('pph_aktif', e.target.checked)} />
                      Potong PPh di A2
                    </span>
                    <span className="flex items-center gap-1 text-xs text-[#122922]/70">
                      <input type="number" step="0.1" className="w-14 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f.pph_tarif} onChange={(e) => upd('pph_tarif', e.target.value)} />%
                    </span>
                  </label>
                </div>

              </div>
            </div>
          )}

          {/* ==================== MODE 3: LANGSUNG A2 & LEMBAR VERIFIKASI SAJA (TANPA SP & BAST) ==================== */}
          {step === 3 && (
            <div className="card space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#122922]/10 pb-3">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase text-[#3f8f77]">Mode Cepat (&lt; 2 Jt Tanpa SP &amp; BAST)</span>
                  <h2 className="text-base font-extrabold text-[#122922]">1. BUKTI PENGELUARAN (A2) &amp; 2. LEMBAR VERIFIKASI SAJA</h2>
                </div>
                <span className="rounded-full border border-[#122922] bg-[#b5e8a5] px-3 py-1 font-mono text-xs font-extrabold text-[#122922]">
                  2 Dokumen (1. A2 + 2. Verifikasi)
                </span>
              </div>

              <div className="rounded-2xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-4 space-y-3.5">
                <div className="grid gap-3 sm:grid-cols-2 items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">Dibayarkan Kepada (Penyedia / Penerima)</span>
                  <SearchableSelect
                    value={f.penyedia_id || ''}
                    options={penyediaOptions}
                    placeholder="— Pilih dari Master Penyedia atau ketik manual —"
                    searchPlaceholder="Cari nama CV/PT atau penerima…"
                    allowClear
                    onChange={pilihPenyediaDariDaftar}
                  />
                </div>
                <Field label="Nama Penyedia / Penerima Pembayaran (Tampil di A2 & Verifikasi)">
                  <textarea
                    rows={2}
                    className="input"
                    value={f.penyedia}
                    onChange={(e) => upd('penyedia', e.target.value)}
                    placeholder="mis. CV. Surya Globe / PT. Telkom Indonesia / Nama Penerima…"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,22rem)_1fr] sm:items-end">
                <Field label="Uang Sejumlah / Nominal Kotor (Rp)">
                  <input
                    inputMode="numeric"
                    className="input text-right font-mono text-base font-extrabold tabular-nums"
                    value={f.kotor ? num(f.kotor) : ''}
                    onChange={(e) => upd('kotor', e.target.value.replace(/\D/g, ''))}
                    placeholder="0"
                  />
                </Field>
              </div>

              {nominalEfektif > 0 && (
                <div className="rounded-xl border border-[#122922]/15 bg-[#d6ee30]/35 px-3.5 py-2.5 text-xs font-bold text-[#122922]">
                  Terbilang: <i className="font-semibold">{terbilang(nominalEfektif)} Rupiah</i>
                </div>
              )}

              <div className="grid gap-3 border-t border-[#122922]/10 pt-4 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef]/60 px-3.5 py-2.5 text-sm font-bold text-[#122922]">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#122922]" checked={f.ppn_aktif} onChange={(e) => upd('ppn_aktif', e.target.checked)} />
                    Potong PPN di A2
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#122922]/70">
                    <input type="number" step="0.1" className="w-14 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f.ppn_tarif} onChange={(e) => upd('ppn_tarif', e.target.value)} />%
                  </span>
                </label>
                <label className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-[#122922]/20 bg-[#f7f5ef]/60 px-3.5 py-2.5 text-sm font-bold text-[#122922]">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" className="accent-[#122922]" checked={f.pph_aktif} onChange={(e) => upd('pph_aktif', e.target.checked)} />
                    Potong PPh di A2
                  </span>
                  <span className="flex items-center gap-1 text-xs text-[#122922]/70">
                    <input type="number" step="0.1" className="w-14 rounded-lg border border-[#122922]/20 bg-white px-2 py-1 text-right font-mono" value={f.pph_tarif} onChange={(e) => upd('pph_tarif', e.target.value)} />%
                  </span>
                </label>
              </div>

            </div>
          )}
        </div>

        {/* ==================== SIDEBAR RINGKASAN & TOMBOL CETAK ==================== */}
        <div className={`space-y-4 ${
          step === 10
            ? (isLebarSpektek ? 'xl:col-span-12' : 'xl:col-span-3 2xl:col-span-3')
            : 'xl:col-span-4'
        }`}>
          <div className="card space-y-4 border-2 border-[#122922] p-5 shadow-[5px_5px_0_#122922]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                {step === 10
                  ? 'Ringkasan 1. Spektek / KAK'
                  : step === 12
                  ? 'Ringkasan 2. Penetapan HPS'
                  : step === 20
                  ? 'Ringkasan 3. Undangan PL'
                  : step === 21
                  ? 'Ringkasan 4. Evaluasi PL'
                  : step === 11
                  ? (is50750 ? 'Ringkasan 5. Klarifikasi & Nego' : 'Ringkasan 3. BA Nego')
                  : step === 22
                  ? 'Ringkasan 6. Penetapan & Laporan'
                  : step === 23
                  ? 'Ringkasan 7. SPPBJ & Kontrak SPK'
                  : step === 1
                  ? 'Ringkasan Surat Pesanan (SP)'
                  : step === 2
                  ? (is50750 ? 'Ringkasan BAST & SPJ (SPK)' : 'Ringkasan BAST, BAPHP & SPJ')
                  : 'Ringkasan A2 & Verifikasi'}
              </span>
              <KategoriBadge kode={kat?.kode} />
            </div>

            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="font-medium text-[#122922]/60">Alur Pengadaan</dt>
                <dd className="font-mono font-extrabold text-[#1d5a42]">
                  {step === 3 || f.tahap === 'spj_langsung'
                    ? 'A2 & Verifikasi Saja (2 Dok)'
                    : is50750
                    ? 'PL 50–750 Juta (17 Dok)'
                    : is1050
                    ? 'SPJ 10–50 Juta (8 Dok)'
                    : (is02 ? 'SPJ 0–2 Juta (4 Dok)' : 'SPJ 2–10 Juta (5 Dok)')}
                </dd>
              </div>
              {(is50750 || is1050) && step !== 10 && (
                <div className="flex justify-between">
                  <dt className="font-medium text-[#122922]/60">Nomor HPS</dt>
                  <dd className="font-mono font-bold text-[#856404]">{f.hps_nomor || '—'}</dd>
                </div>
              )}
              {is50750 && ![10, 12].includes(step) && (
                <div className="flex justify-between">
                  <dt className="font-medium text-[#122922]/60">Undangan PL</dt>
                  <dd className="font-mono font-bold text-[#1d5a42]">{f.pl?.undangan_nomor || '—'}</dd>
                </div>
              )}
              {(is50750 || is1050) && ![10, 12, 20, 21].includes(step) && (
                <div className="flex justify-between">
                  <dt className="font-medium text-[#122922]/60">Nomor BA Nego</dt>
                  <dd className="font-mono font-bold text-[#1d5a42]">{f.bakn_nomor || '—'}</dd>
                </div>
              )}
              {is50750 && [23, 2].includes(step) && (
                <div className="flex justify-between">
                  <dt className="font-medium text-[#122922]/60">Nomor SPK</dt>
                  <dd className="font-mono font-bold text-[#3f8f77]">{f.spk_nomor || '—'}</dd>
                </div>
              )}
              {step !== 3 && !is50750 && (
                <>
                  {![10, 12, 11].includes(step) && (
                    <div className="flex justify-between">
                      <dt className="font-medium text-[#122922]/60">Nomor SP</dt>
                      <dd className="font-mono font-bold text-[#122922]">{f.sp_nomor || '—'}</dd>
                    </div>
                  )}
                </>
              )}
              {step === 2 && (
                <>
                  <div className={`flex justify-between ${is02 ? 'hidden' : ''}`}>
                    <dt className="font-medium text-[#122922]/60">Nomor BAST</dt>
                    <dd className="font-mono font-bold text-[#122922]">{f.bast_nomor || `000.3.2/${f.bast_no_urut || nextNomor.nextBast}/05.1.2/${tahunBerjalan}`}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-[#122922]/60">Nomor BAPHP</dt>
                    <dd className="font-mono font-bold text-[#4c3f91]">{f.baphp_nomor || `000.3.2/${f.baphp_no_urut || (is02 ? nextNomor.nextBast : `${f.bast_no_urut || nextNomor.nextBast}.a`)}/05.1.2/${tahunBerjalan}`}</dd>
                  </div>
                </>
              )}
              {step !== 3 && (
                <div className="flex justify-between">
                  <dt className="font-medium text-[#122922]/60">Jumlah Item</dt>
                  <dd className="font-bold text-[#122922]">{f.items.filter((i) => i.jenis_barang).length} jenis barang</dd>
                </div>
              )}
            </dl>

            {step !== 10 && (
              <dl className="space-y-2 border-t border-[#122922]/15 pt-3 text-sm tabular-nums">
                {(is50750 || is1050) && (
                  <>
                    <div className="flex justify-between text-xs">
                      <dt className="font-medium text-[#122922]/60">Total HPS</dt>
                      <dd className="font-mono font-bold text-[#122922]">{rp(totalHpsItems)}</dd>
                    </div>
                    {step !== 12 && (
                      <div className="flex justify-between text-xs">
                        <dt className="font-medium text-[#122922]/60">Harga Penawaran</dt>
                        <dd className="font-mono font-bold text-[#122922]">{totalPenawaranEfektif > 0 ? rp(totalPenawaranEfektif) : '—'}</dd>
                      </div>
                    )}
                  </>
                )}
                {step !== 12 && (
                  <div className="flex justify-between">
                    <dt className="font-medium text-[#122922]/65">{is50750 ? 'Nilai Kontrak (SPK)' : is1050 ? 'Nilai Negosiasi / Kotor' : 'Jumlah Kotor'}</dt>
                    <dd className="font-mono font-bold text-[#122922]">{rp(pajak.kotor)}</dd>
                  </div>
                )}
                {(step === 2 || step === 3) && (
                  <>
                    {f.ppn_aktif && <div className="flex justify-between text-xs"><dt className="text-[#122922]/60">PPN ({f.ppn_tarif}%)</dt><dd className="font-mono">{rp(pajak.ppn)}</dd></div>}
                    {f.pph_aktif && <div className="flex justify-between text-xs"><dt className="text-[#122922]/60">PPh ({f.pph_tarif}%)</dt><dd className="font-mono">{rp(pajak.pph)}</dd></div>}
                    <div className="flex justify-between border-t border-dashed border-[#122922]/20 pt-2 text-base font-extrabold text-[#122922]">
                      <dt>Jumlah Bersih (A2)</dt>
                      <dd className="font-mono text-[#1d5a42]">{rp(pajak.bersih)}</dd>
                    </div>
                  </>
                )}
              </dl>
            )}

            {err && <p className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">{err}</p>}
            {ok && (
              <p className="flex items-center gap-1.5 rounded-xl border border-[#122922] bg-[#b5e8a5] px-3 py-2 text-xs font-bold text-[#122922]">
                <Check size={14} /> {ok}
              </p>
            )}

            {/* Tombol Aksi Sesuai Mode/Tahap */}
            {step === 10 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : (['hps', 'spektek_hps', 'undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan'].includes(f.tahap) ? f.tahap : 'spektek'), 'spektek')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 1. Spektek (KAK)'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : (['hps', 'spektek_hps', 'undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan'].includes(f.tahap) ? f.tahap : 'spektek'), null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Spektek (KAK)
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Lanjut ke Tahap 2 (Penetapan HPS)?</div>
                  <p className="mt-0.5 text-[11px]">Setelah Spesifikasi Teknis/KAK selesai disusun PPK, lanjutkan ke proses Penetapan HPS.</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(12)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Lanjut → 2. Buat HPS &amp; Lampiran
                  </button>
                </div>
              </div>
            ) : step === 12 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan', 'selesai'].includes(f.tahap) ? f.tahap : 'hps', 'hps')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 2. HPS'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'pesanan', 'selesai'].includes(f.tahap) ? f.tahap : 'hps', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft HPS
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">
                    {is50750 ? 'Lanjut ke Tahap 3 (Undangan PL & Jadwal)?' : 'Lanjut ke Tahap 3 (Negosiasi)?'}
                  </div>
                  <p className="mt-0.5 text-[11px]">
                    {is50750
                      ? 'Setelah HPS ditetapkan PPK, terbitkan Undangan Pengadaan Langsung dan Jadwal 5 Tahapan.'
                      : 'Setelah HPS ditetapkan PPK, lanjutkan ke BA Klarifikasi Teknis & Negosiasi Harga.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(is50750 ? 20 : 11)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    {is50750 ? 'Lanjut → 3. Undangan PL & Jadwal' : 'Lanjut → 3. BA Klarifikasi & Negosiasi'}
                  </button>
                </div>
              </div>
            ) : step === 20 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'undangan', 'undangan_pl')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 3. Undangan PL'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'undangan', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Undangan PL
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Lanjut ke Pembukaan &amp; Evaluasi?</div>
                  <p className="mt-0.5 text-[11px]">Setelah undangan dikirim ke penyedia dan dokumen penawaran masuk, lanjutkan ke Pembukaan &amp; Evaluasi Penawaran.</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(21)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Lanjut → 4. Pembukaan &amp; Evaluasi
                  </button>
                </div>
              </div>
            ) : step === 21 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'evaluasi', 'ba_evaluasi')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 4. Evaluasi Penawaran'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['negosiasi', 'penetapan', 'kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'evaluasi', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Evaluasi
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Lanjut ke Klarifikasi &amp; Negosiasi?</div>
                  <p className="mt-0.5 text-[11px]">Penyedia lulus evaluasi penawaran. Lanjutkan untuk mengundang dan menyusun BA Klarifikasi Teknis &amp; Negosiasi Harga.</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(11)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Lanjut → 5. Klarifikasi &amp; Negosiasi
                  </button>
                </div>
              </div>
            ) : step === 11 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['penetapan', 'kontrak', 'pesanan', 'selesai'].includes(f.tahap) ? f.tahap : 'negosiasi', 'bakn')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : `Simpan & Cetak ${is50750 ? '5. ' : '3. '}BA Klarifikasi & Nego`}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['penetapan', 'kontrak', 'pesanan', 'selesai'].includes(f.tahap) ? f.tahap : 'negosiasi', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Negosiasi
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Harga Negosiasi sudah sepakat?</div>
                  <p className="mt-0.5 text-[11px]">
                    {is50750
                      ? 'Lanjutkan ke Penetapan Pemenang, Berita Acara Hasil Pengadaan Langsung (BAHPL), dan Laporan ke PPK.'
                      : 'Lanjutkan ke Tahap 4 untuk menerbitkan Surat Pesanan (SP) kepada penyedia.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(is50750 ? 22 : 1)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    {is50750 ? 'Lanjut → 6. Penetapan & Laporan PPK' : 'Lanjut → 4. Buat Surat Pesanan (SP)'}
                  </button>
                </div>
              </div>
            ) : step === 22 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'penetapan', 'ba_penetapan')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 6. Penetapan & BAHPL'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(['kontrak', 'selesai'].includes(f.tahap) ? f.tahap : 'penetapan', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Penetapan
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Lanjut ke SPPBJ &amp; Kontrak SPK?</div>
                  <p className="mt-0.5 text-[11px]">BAHPL dan Laporan telah disampaikan ke PPK. Lanjutkan untuk menerbitkan SPPBJ dan menandatangani Surat Perintah Kerja (SPK).</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(23)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Lanjut → 7. SPPBJ &amp; Kontrak (SPK)
                  </button>
                </div>
              </div>
            ) : step === 23 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : 'kontrak', 'spk')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak 7. Kontrak SPK'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : 'kontrak', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft SPK
                </button>
                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Barang sudah dikirim &amp; diterima?</div>
                  <p className="mt-0.5 text-[11px]">Setelah SPK ditandatangani dan barang dikirim penyedia, lanjutkan pembuatan BAST, BAPHP, Bukti A2 &amp; Verifikasi.</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(2)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Barang Diterima → Buat BAST, BAPHP &amp; A2
                  </button>
                </div>
              </div>
            ) : step === 1 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : 'pesanan', 'sp')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : `Simpan & Cetak ${is1050 ? '4. ' : '1. '}Surat Pesanan (SP)`}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap(f.tahap === 'selesai' ? 'selesai' : 'pesanan', null)}
                  className="btn-ghost w-full"
                >
                  Simpan Draft Surat Pesanan
                </button>

                <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs text-[#122922]/75">
                  <div className="font-extrabold text-[#122922]">Barang sudah diterima?</div>
                  <p className="mt-0.5 text-[11px]">Setelah SP dicetak dan barang dikirim oleh penyedia, lanjutkan untuk membuat BAST, BAPHP, A2 &amp; Verifikasi.</p>
                  <button
                    type="button"
                    onClick={() => pilihModeStep(2)}
                    className="mt-2 w-full rounded-full border border-[#122922] bg-white py-1.5 text-xs font-extrabold text-[#122922] hover:bg-[#d6ee30]"
                  >
                    Barang Diterima → Buat BAST, BAPHP &amp; A2
                  </button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap('selesai', 'baphp')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak BAPHP / BAST / A2'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap('selesai', null)}
                  className="btn-primary w-full"
                >
                  Simpan Penyelesaian SPJ
                </button>
              </div>
            ) : (
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap('spj_langsung', 'a2')}
                  className="btn-lime w-full py-3"
                >
                  <Printer size={16} />
                  {busy ? 'Menyimpan…' : 'Simpan & Cetak A2 + Verifikasi'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => simpanTahap('spj_langsung', null)}
                  className="btn-primary w-full"
                >
                  Simpan A2 &amp; Verifikasi
                </button>
              </div>
            )}

            {/* Panel Cetak Dokumen Sesuai Mode (Urut Otomatis 1, 2, 3...) */}
            {saved && (
              <div className="space-y-2 border-t border-[#122922]/15 pt-3">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">
                  Dokumen Siap Cetak (Urut Otomatis):
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {filterDokByTahap(f.tahap, is50750 ? '50_750' : (is1050 ? '10_50' : (is02 ? '0_2' : '0_10'))).map((d) => (
                    <div key={d.jenis} className="flex items-center justify-between rounded-xl border border-[#122922]/20 bg-[#f7f5ef] px-3 py-2 text-xs font-bold text-[#122922]">
                      <button
                        type="button"
                        onClick={() => setPreview({ id: saved, jenis: d.jenis, tahap: f.tahap, modePengadaan: is50750 ? '50_750' : (is1050 ? '10_50' : (is02 ? '0_2' : '0_10')) })}
                        className="flex items-center gap-2 text-left hover:underline"
                      >
                        <span className={`h-2.5 w-2.5 rounded-full border border-[#122922] ${d.badge}`} />
                        {d.label}
                      </button>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => setPreview({ id: saved, jenis: d.jenis, tahap: f.tahap, modePengadaan: is50750 ? '50_750' : (is1050 ? '10_50' : (is02 ? '0_2' : '0_10')) })} className="rounded bg-white px-2 py-0.5 text-[10px] border border-[#122922]/20 hover:bg-[#d6ee30]">
                          Lihat
                        </button>
                        <a href={`/api/transaksi/${saved}/dokumen/${d.jenis}.pdf`} className="rounded bg-white px-2 py-0.5 text-[10px] border border-[#122922]/20 hover:bg-[#d6ee30]">
                          PDF
                        </a>
                        <a href={`/api/transaksi/${saved}/dokumen/${d.jenis}.docx`} className="rounded bg-white px-2 py-0.5 text-[10px] border border-[#122922]/20 hover:bg-[#d6ee30]">
                          Word
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tombol Hapus Transaksi jika sudah tersimpan */}
            {saved && (
              <div className="border-t border-[#122922]/15 pt-3">
                <button
                  type="button"
                  onClick={hapusTransaksiIni}
                  className="btn-ghost !text-rose-600 hover:!bg-rose-50 w-full text-xs font-bold"
                >
                  <Trash2 size={13} /> Hapus Paket Pengadaan Ini
                </button>
              </div>
            )}
          </div>

          {rek && (
            <div className="card space-y-3 p-5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-[#122922]">Kontrol Pagu RBA</span>
                <span className="font-mono font-bold text-[#3f8f77]">{persen(rek.pagu ? ((rek.realisasi - awal + nominalEfektif) / rek.pagu) * 100 : 0)}</span>
              </div>
              <Progress value={rek.pagu ? ((rek.realisasi - awal + nominalEfektif) / rek.pagu) * 100 : 0} />
              <dl className="space-y-1 text-xs tabular-nums">
                <div className="flex justify-between"><dt className="text-[#122922]/60">Pagu Anggaran</dt><dd className="font-mono font-bold">{rp(rek.pagu)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#122922]/60">Realisasi s.d. ini</dt><dd className="font-mono">{rp(rek.realisasi - awal)}</dd></div>
                <div className="flex justify-between font-bold">
                  <dt>Sisa setelah paket ini</dt>
                  <dd className={`font-mono ${sisaSetelah < 0 ? 'text-rose-600' : 'text-[#1d5a42]'}`}>{rp(sisaSetelah)}</dd>
                </div>
              </dl>
              {sisaSetelah < 0 && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                  <AlertTriangle size={14} /> Melebihi sisa anggaran!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <PreviewModal preview={preview} onClose={() => setPreview(null)} onSwitch={setPreview} />
    </>
  )
}
