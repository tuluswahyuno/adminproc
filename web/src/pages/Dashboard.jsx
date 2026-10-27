import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Wallet, TrendingUp, FileCheck2, ListTree, PackageCheck,
  Clock, CheckCircle2, ArrowRight, Building2, Sparkles, Search, Eye, CalendarRange
} from 'lucide-react'
import { api, rp, rpRingkas, persen, bulanLabel, tgl, kategoriOf, KATEGORI } from '../lib'
import { PageHeader, Progress, Empty, KategoriBadge, BuatDokumenMenu } from '../ui'
import { PreviewModal, modeDokumen } from './Transaksi'
import { useAuth } from '../App'

/* alur dokumen per kategori nilai: urutan langkah (tahap) dan dokumen penutup */
const ALUR = {
  '0_2': { langkah: ['SP', 'BAPHP, A2 & Verifikasi'], tahapSelesai: 1 },
  '0_10': { langkah: ['Surat Pesanan', 'BAST, BAPHP, A2 & Verifikasi'], tahapSelesai: 1 },
  '10_50': { langkah: ['Spesifikasi Teknis / KAK', 'Penetapan HPS', 'BA Klarifikasi & Negosiasi', 'Surat Pesanan', 'BAST, BAPHP, A2 & Verifikasi'], urutTahap: ['spektek', 'hps', 'negosiasi', 'pesanan', 'selesai'] },
  epur: { langkah: ['Spesifikasi Teknis / KAK', 'HPS', 'Surat Penyerahan ke Pejabat Pengadaan', 'BAPHP, A2 & Verifikasi'], urutTahap: ['spektek', 'hps', 'pesanan', 'selesai'] },
  '50_750': { langkah: ['Spesifikasi Teknis / KAK', 'Penetapan HPS', 'Undangan Pengadaan Langsung', 'BA Pembukaan & Evaluasi', 'Klarifikasi & Negosiasi', 'Penetapan Pemenang, BAHPL & Laporan', 'SPPBJ & SPK', 'BAST, BAPHP, A2 & Verifikasi'], urutTahap: ['spektek', 'hps', 'undangan', 'evaluasi', 'negosiasi', 'penetapan', 'kontrak', 'selesai'] },
}
function alurPaket(t) {
  const selesai = t.tahap === 'selesai' || t.tahap === 'spj_langsung' || !!t.bast_nomor || !!t.baphp_nomor
  const wizard = ['10_50', '50_750', 'epur'].includes(t.mode_pengadaan)
  const kunci = wizard ? t.mode_pengadaan : (Number(t.kotor) <= 2000000 ? '0_2' : '0_10')
  const a = ALUR[kunci]
  const total = a.langkah.length
  const idx = wizard ? a.urutTahap.indexOf(t.tahap === 'spektek_hps' ? 'hps' : t.tahap) : 0
  // tahap tersimpan = tahap terakhir yang dikerjakan; langkah berikutnya yang ditawarkan
  const sudah = selesai ? total : Math.min(total - 1, Math.max(1, idx + 1))
  const dokTahap = { spektek: 'spektek', hps: 'hps', spektek_hps: 'hps', undangan: 'undangan_pl', evaluasi: 'ba_evaluasi', negosiasi: 'bakn', penetapan: 'ba_penetapan', kontrak: 'spk', pesanan: 'sp' }
  return {
    selesai, sudah, total, persen: Math.round((sudah / total) * 100),
    berikut: a.langkah[Math.min(sudah, total - 1)],
    dokumen: selesai ? (kunci === '0_2' || kunci === 'epur' ? 'baphp' : 'bast') : (kunci === 'epur' && t.tahap === 'pesanan' ? 'penyerahan_pp' : wizard ? (dokTahap[t.tahap] || 'spektek') : 'sp'),
    href: wizard ? '/pengadaan/' + t.id : '/transaksi/' + t.id + '?mode=terima',
  }
}
const ALUR_RINGKAS = [
  { kode: 'K1', alur: 'Surat Pesanan → BAPHP, A2 & Verifikasi' },
  { kode: 'K2', alur: 'Surat Pesanan → BAST → BAPHP, A2 & Verifikasi' },
  { kode: 'K3', alur: '5 tahap: KAK → HPS → BA Negosiasi → SP → BAST/BAPHP' },
  { kode: 'EP', label: 'E-Purchasing', tone: 'bg-[#a9dcf0] text-[#122922]', alur: 'KAK → HPS (hanya di atas Rp100 jt) → Surat Penyerahan ke PP → BAPHP, A2 & Verifikasi' },
  { kode: 'K4', alur: '8 tahap pengadaan langsung: Undangan → Evaluasi → Negosiasi → Penetapan → SPPBJ/SPK → BAST' },
]

export default function Dashboard() {
  const { user, tahun, setTahun, tahunList } = useAuth()
  const [d, setD] = useState(null)
  const [selectedInduk, setSelectedInduk] = useState('')
  const [searchTop, setSearchTop] = useState('')
  const [preview, setPreview] = useState(null)
  const [bulanPilih, setBulanPilih] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api(`/dashboard?tahun=${encodeURIComponent(tahun || '')}`).then(setD)
  }, [tahun, user?.id, user?.role])
  if (!d) return null

  const totalBulan = (b) => (Number(b.total) || 0) + (Number(b.sppd_total) || 0)
  const maks = Math.max(1, ...d.perBulan.map(totalBulan))
  const totalTren = d.perBulan.reduce((x, b) => x + totalBulan(b), 0)
  const bulanAktif = d.perBulan.filter((b) => totalBulan(b) > 0)
  const bulanTertinggi = bulanAktif.reduce((m, b) => (totalBulan(b) > totalBulan(m || {}) ? b : m), null)
  const baris = KATEGORI.map((k) => {
    const r = d.perKategori.find((x) => x.kategori === k.kode)
    return { ...k, jumlah: Number(r?.jumlah || 0), total: Number(r?.total || 0), warna: k.tone.split(' ')[0] }
  }).filter((x) => x.kode !== 'K5' || x.jumlah > 0)
  const totalKategori = baris.reduce((x, k) => x + k.total, 0)
  const terpilih = d.perBulan.find((b) => b.bulan === bulanPilih) || bulanTertinggi
  const capaian = d.pagu ? (d.realisasi / d.pagu) * 100 : 0
  const sisa = d.pagu - d.realisasi

  const jmlSelesai = Number(d.perTahap?.find((x) => x.tahap === 'selesai')?.jumlah || 0) + Number(d.perTahap?.find((x) => x.tahap === 'spj_langsung')?.jumlah || 0)
  const jmlBerjalan = Math.max(0, Number(d.transaksi || 0) - jmlSelesai)

  return (
    <>
      <PageHeader
        kicker={`Pusat Kendali Pengadaan & Anggaran BLUD · TA ${tahun === 'semua' ? 'Semua Tahun' : tahun}`}
        title={`Dashboard ${tahun === 'semua' ? 'Semua Tahun' : `TA ${tahun}`}`}
        desc="Pantau realisasi anggaran per kode rekening induk, progres Surat Pesanan (SP), BAST, dan pencairan SPJ secara interaktif"
      >
        <div className="flex items-center gap-1.5 rounded-full border-2 border-[#122922] bg-white px-3 py-1.5 text-xs font-extrabold text-[#122922]">
          <CalendarRange size={14} className="text-[#3f8f77]" />
          <span>Tahun:</span>
          <select
            value={tahun}
            onChange={(e) => setTahun(e.target.value)}
            className="bg-transparent font-mono font-extrabold text-[#122922] outline-none cursor-pointer"
          >
            {(tahunList || [String(new Date().getFullYear())]).map((yr) => (
              <option key={yr} value={yr}>
                {yr}{String(yr) === String(new Date().getFullYear()) ? ' (Tahun Berjalan)' : ''}
              </option>
            ))}
            <option value="semua">Semua Tahun</option>
          </select>
        </div>
        <Link to="/rekening" className="btn-ghost">
          <ListTree size={15} /> Kode Rekening ({d.rekening})
        </Link>
        <BuatDokumenMenu label="Buat Dokumen Pengadaan" />
      </PageHeader>

      {/* Top Interactive Hero Banner + KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          onClick={() => nav('/rekening')}
          className="card group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#122922]"
        >
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#122922] bg-[#d6ee30] text-[#122922]">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <span className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#122922]">
              {d.rekening} Rekening
            </span>
          </div>
          <div className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#4b5e57]">Total Pagu Anggaran</div>
          <div className="mt-1 font-mono text-xl font-extrabold tracking-tight text-[#122922]">{rp(d.pagu)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs font-bold text-[#3f8f77] group-hover:underline">
            Lihat rincian kode rekening <ArrowRight size={12} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#122922] bg-[#b5e8a5] text-[#122922]">
              <TrendingUp size={20} strokeWidth={2.2} />
            </div>
            <span className="rounded-full border border-[#122922] bg-[#b5e8a5] px-2.5 py-0.5 font-mono text-xs font-extrabold text-[#122922]">
              {persen(capaian)}
            </span>
          </div>
          <div className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#4b5e57]">Total Realisasi</div>
          <div className="mt-1 font-mono text-xl font-extrabold tracking-tight text-[#122922]">{rp(d.realisasi)}</div>
          <div className="mt-2.5">
            <Progress value={capaian} />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#122922] bg-[#f6db5b] text-[#122922]">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <span className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#122922]">
              {persen(100 - capaian)} Tersedia
            </span>
          </div>
          <div className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#4b5e57]">Sisa Anggaran</div>
          <div className="mt-1 font-mono text-xl font-extrabold tracking-tight text-[#1d5a42]">{rp(sisa)}</div>
          <div className="mt-2 text-xs text-[#4b5e57]">Siap digunakan untuk pengadaan</div>
        </div>

        <div
          onClick={() => nav('/transaksi')}
          className="card group cursor-pointer p-5 transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#122922]"
        >
          <div className="flex items-center justify-between">
            <div className="grid h-11 w-11 place-items-center rounded-xl border-2 border-[#122922] bg-[#a9dcf0] text-[#122922]">
              <FileCheck2 size={20} strokeWidth={2.2} />
            </div>
            <span className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#122922]">
              {d.penyedia || 0} Penyedia CV/PT
            </span>
          </div>
          <div className="mt-3 text-xs font-extrabold uppercase tracking-wider text-[#4b5e57]">Paket Pengadaan & SPJ</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-mono text-2xl font-extrabold text-[#122922]">{d.transaksi}</span>
            <span className="text-xs font-bold text-[#4b5e57]">paket tercatat</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-[11px] font-bold">
            <span className="rounded-md bg-[#f6db5b] px-2 py-0.5 text-[#122922]">{jmlBerjalan} Berjalan</span>
            <span className="rounded-md bg-[#b5e8a5] px-2 py-0.5 text-[#122922]">{jmlSelesai} Selesai</span>
          </div>
        </div>
      </div>

      {/* Interactive Rekening Induk Breakdown (Sesuai Struktur Excel 5.1.02 / 5.2.02 / 5.2.03) */}
      <div className="card mt-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Realisasi per Kelompok Belanja</span>
            <h2 className="text-base font-extrabold text-[#122922]">Ringkasan Kode Rekening Induk BLUD</h2>
          </div>
          <Link to="/rekening" className="text-xs font-extrabold text-[#122922] underline hover:text-[#3f8f77]">
            Buka Struktur Rekening Lengkap →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {d.perInduk?.map((g) => {
            const active = selectedInduk === g.induk_kode
            return (
              <div
                key={g.induk_kode}
                onClick={() => setSelectedInduk(active ? '' : g.induk_kode)}
                className={`cursor-pointer rounded-2xl border-2 p-4 transition ${
                  active
                    ? 'border-[#122922] bg-[#d6ee30]/35 shadow-[4px_4px_0_#122922]'
                    : 'border-[#122922]/20 bg-[#f7f5ef]/70 hover:border-[#122922] hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md border border-[#122922] bg-[#122922] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#d6ee30]">
                    {g.induk_kode}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#122922]">{g.jumlah_rekening} Kode Rekening</span>
                </div>
                <div className="mt-2 font-extrabold text-[#122922]">{g.induk_uraian}</div>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#4b5e57]">Anggaran:</span>
                    <span className="font-mono font-bold text-[#122922]">{rp(g.pagu)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4b5e57]">Realisasi ({persen(g.capaian)}):</span>
                    <span className="font-mono font-bold text-[#3f8f77]">{rp(g.realisasi)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4b5e57]">Sisa:</span>
                    <span className="font-mono font-bold text-[#122922]">{rp(g.sisa)}</span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <Progress value={g.capaian} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monitoring paket: alur dokumen mengikuti kategori nilai */}
      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        <div className="card flex flex-col justify-between p-4 sm:p-5 xl:col-span-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Monitoring Alur per Kategori Nilai</span>
                <h2 className="text-base font-extrabold text-[#122922]">Paket Pengadaan & SPJ Terbaru</h2>
              </div>
              <Link to="/transaksi" className="text-xs font-extrabold text-[#122922] underline">Semua Paket →</Link>
            </div>

            {(!d.recent || d.recent.length === 0) ? (
              <Empty>Belum ada transaksi pengadaan</Empty>
            ) : (
              <div className="divide-y divide-[#122922]/10">
                {d.recent.map((t) => {
                  const a = alurPaket(t)
                  const kat = kategoriOf(t.kotor)
                  const noDok = t.sp_nomor || t.hps_nomor || t.bakn_nomor
                  return (
                    <div key={t.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${kat.tone}`}>{kat.label}</span>
                            {t.mode_pengadaan === 'epur' && <span className="rounded-full border border-[#122922] bg-[#a9dcf0] px-2 py-0.5 text-[10px] font-extrabold">E-Purchasing</span>}
                            <span className="font-extrabold text-[#122922]">{t.penyedia && t.penyedia !== '-' ? t.penyedia : 'Penyedia belum dipilih'}</span>
                            <span className="font-mono text-[11px] text-[#4b5e57]">· {tgl(t.sp_tanggal || t.tanggal)}</span>
                          </div>
                          <div className="truncate text-xs text-[#4b5e57]">{t.uraian || t.rek_uraian}</div>
                          {noDok && <div className="mt-0.5 break-all font-mono text-[11px] font-bold text-[#3f8f77]">{noDok}</div>}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="font-mono text-sm font-extrabold text-[#122922]">{rp(t.kotor)}</div>
                          <button
                            type="button"
                            onClick={() => setPreview({ id: t.id, jenis: a.dokumen, tahap: t.tahap, modePengadaan: modeDokumen(t.mode_pengadaan, t.hps_total || t.kotor) })}
                            className="rounded-xl border border-[#122922]/20 p-2 text-[#122922] hover:bg-[#d6ee30]"
                            title="Pratinjau Dokumen"
                          ><Eye size={15} /></button>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center gap-2.5">
                        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full border border-[#122922]/40 bg-[#f7f5ef]">
                          <div className={`h-full ${a.selesai ? 'bg-[#3f8f77]' : 'bg-[#d6ee30]'}`} style={{ width: `${a.persen}%` }} />
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-bold text-[#4b5e57]">{a.sudah}/{a.total} tahap</span>
                      </div>
                      <div className="mt-1.5">
                        {a.selesai ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#b5e8a5] px-2 py-0.5 text-[10px] font-extrabold text-[#122922]"><CheckCircle2 size={10} /> Selesai · BAST, A2 & Verifikasi</span>
                        ) : (
                          <Link to={a.href} className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] hover:bg-[#c8e220]">
                            <Clock size={10} className="shrink-0" /> <span className="truncate">Lanjutkan: {a.berikut}</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] p-3 text-xs">
            <div className="mb-2 font-bold text-[#122922]">Alur dokumen menurut nilai paket</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {ALUR_RINGKAS.map((x) => (
                <div key={x.kode} className="flex items-start gap-2">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${(x.tone || KATEGORI.find((k) => k.kode === x.kode).tone)}`}>{x.label || KATEGORI.find((k) => k.kode === x.kode).label}</span>
                  <span className="min-w-0 text-[11px] font-semibold leading-snug text-[#122922]/80">{x.alur}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grafik Bulanan & Kategori */}
        <div className="space-y-5 xl:col-span-5">
          <div className="card p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">{tahun === 'semua' ? '12 bulan terakhir' : `Januari – Desember ${tahun}`}</span>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#122922]">Tren Realisasi Bulanan</h2>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-extrabold text-[#122922]">{rpRingkas(totalTren)}</div>
                <div className="text-[10px] font-bold text-[#4b5e57]">total periode</div>
              </div>
            </div>
            {totalTren === 0 ? <Empty>Belum ada realisasi pada periode ini</Empty> : (
              <>
                <div className="flex items-center gap-3 text-[10px] font-bold text-[#4b5e57]">
                  <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-[#122922] bg-[#d6ee30]" /> Paket pengadaan</span>
                  {d.sppd?.tampil && <span className="inline-flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm border border-[#122922] bg-[#a9dcf0]" /> SPPD</span>}
                </div>
                <div className="relative mt-2 h-44">
                  {[0, 50, 100].map((p) => (
                    <div key={p} className="absolute inset-x-0 border-t border-dashed border-[#122922]/15" style={{ bottom: `calc(${p}% * 0.78 + 22px)` }}>
                      {p > 0 && <span className="absolute -top-2.5 right-0 bg-white pl-1 font-mono text-[9px] font-bold text-[#4b5e57]">{rpRingkas((maks * p) / 100)}</span>}
                    </div>
                  ))}
                  <div className="absolute inset-0 flex items-stretch gap-[3px] sm:gap-1.5">
                    {d.perBulan.map((b) => {
                      const tot = totalBulan(b)
                      const aktif = terpilih?.bulan === b.bulan
                      const tinggi = tot ? Math.max(4, (tot / maks) * 78) : 0
                      return (
                        <button
                          type="button" key={b.bulan} onClick={() => setBulanPilih(b.bulan)} title={`${bulanLabel(b.bulan)}: ${rp(tot)}`}
                          className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1 outline-none"
                        >
                          <div className="flex w-full flex-1 flex-col justify-end">
                            <div
                              className={`flex w-full flex-col-reverse overflow-hidden rounded-t-md border-2 transition ${aktif ? 'border-[#122922] shadow-[2px_2px_0_#122922]' : 'border-[#122922]/70 group-hover:border-[#122922]'} ${tot ? '' : 'border-transparent'}`}
                              style={{ height: `${tinggi}%` }}
                            >
                              <div className="bg-[#d6ee30]" style={{ flexGrow: Number(b.total) || 0 }} />
                              <div className="bg-[#a9dcf0]" style={{ flexGrow: Number(b.sppd_total) || 0 }} />
                            </div>
                          </div>
                          <span className={`h-5 font-mono text-[9px] font-bold sm:text-[10px] ${aktif ? 'text-[#122922]' : 'text-[#4b5e57]'}`}>{bulanLabel(b.bulan).slice(0, 3)}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                {terpilih && (
                  <div className="mt-3 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-3.5 py-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <b className="text-[#122922]">{bulanLabel(terpilih.bulan)}{terpilih === bulanTertinggi ? ' · tertinggi' : ''}</b>
                      <b className="font-mono text-sm text-[#122922]">{rp(totalBulan(terpilih))}</b>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[#4b5e57]">
                      <span>Paket: <b className="font-mono text-[#122922]">{rp(terpilih.total)}</b> ({terpilih.jumlah})</span>
                      {d.sppd?.tampil && <span>SPPD: <b className="font-mono text-[#122922]">{rp(terpilih.sppd_total)}</b> ({terpilih.sppd_jumlah} perjalanan)</span>}
                    </div>
                  </div>
                )}
                <div className="mt-2 text-[11px] text-[#4b5e57]">Rata-rata per bulan berdata: <b className="font-mono text-[#122922]">{rp(totalTren / Math.max(1, bulanAktif.length))}</b></div>
              </>
            )}
          </div>

          <div className="card p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">{d.transaksi} paket</span>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#122922]">Distribusi Kategori Nilai</h2>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm font-extrabold text-[#122922]">{rpRingkas(totalKategori)}</div>
                <div className="text-[10px] font-bold text-[#4b5e57]">nilai paket</div>
              </div>
            </div>
            {totalKategori > 0 && (
              <div className="mb-3 flex h-3 overflow-hidden rounded-full border-2 border-[#122922]">
                {baris.filter((x) => x.total > 0).map((x) => <div key={x.kode} className={x.warna} style={{ width: `${(x.total / totalKategori) * 100}%` }} title={`${x.label}: ${persen((x.total / totalKategori) * 100)}`} />)}
              </div>
            )}
            <div className="space-y-1">
              {baris.map((x) => (
                <button
                  type="button" key={x.kode} onClick={() => nav(`/transaksi?kategori=${x.kode}`)} disabled={!x.jumlah}
                  className="block w-full rounded-xl border border-transparent px-2 py-1.5 text-left transition enabled:hover:border-[#122922]/15 enabled:hover:bg-[#f7f5ef] disabled:opacity-60"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${x.tone}`}>{x.label}</span>
                    <span className="font-mono text-xs text-[#4b5e57]"><b className="font-extrabold text-[#122922]">{x.jumlah}</b> paket · {rp(x.total)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#122922]/10">
                    <div className={`h-full ${x.warna}`} style={{ width: `${totalKategori ? (x.total / totalKategori) * 100 : 0}%` }} />
                  </div>
                </button>
              ))}
            </div>
            {d.sppd?.tampil && d.sppd.jumlah > 0 && (
              <Link to="/sppd" className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-3 py-2 text-xs hover:bg-[#d6ee30]/40">
                <span className="font-extrabold text-[#122922]">Perjalanan dinas (SPPD)</span>
                <span className="font-mono text-[#4b5e57]"><b className="font-extrabold text-[#122922]">{d.sppd.jumlah}</b> perjalanan · {rp(d.sppd.total)}</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Serapan Anggaran Tertinggi */}
      <div className="card mt-5 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Prioritas Monitoring</span>
            <h2 className="text-base font-extrabold text-[#122922]">Serapan Anggaran Rincian Belanja Tertinggi</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-2.5 text-[#122922]/45" />
              <input
                className="rounded-full border border-[#122922]/20 bg-[#f7f5ef] py-1.5 pl-8 pr-3 text-xs font-semibold outline-none focus:border-[#122922]"
                placeholder="Filter rincian…"
                value={searchTop}
                onChange={(e) => setSearchTop(e.target.value)}
              />
            </div>
            <Link to="/rekening" className="text-xs font-extrabold text-[#122922] underline">
              Semua Rekening →
            </Link>
          </div>
        </div>

        {d.top.length === 0 ? (
          <Empty><ListTree className="mx-auto mb-2" />Impor file Realisasi Belanja di menu Kode Rekening</Empty>
        ) : (
          <div className="grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
            {d.top
              .filter((r) => !searchTop || r.uraian.toLowerCase().includes(searchTop.toLowerCase()) || r.kode.includes(searchTop))
              .map((r) => (
                <div key={r.id} className="min-w-0 rounded-xl border border-[#122922]/10 bg-[#f7f5ef]/50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="mr-2 rounded bg-[#d6ee30]/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#122922]">{r.kode}</span>
                      <span className="font-extrabold text-[#122922]">{r.uraian}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-extrabold text-[#122922]">{persen(r.capaian)}</span>
                  </div>
                  <Progress value={r.capaian} />
                  <div className="mt-1.5 flex flex-wrap justify-between gap-x-3 font-mono text-[11px] text-[#4b5e57]">
                    <span>Realisasi: {rp(r.realisasi)}</span>
                    <span>Sisa: {rp(r.sisa)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <PreviewModal preview={preview} onClose={() => setPreview(null)} onSwitch={setPreview} />
    </>
  )
}
