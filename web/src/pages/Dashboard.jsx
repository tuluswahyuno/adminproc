import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Wallet, TrendingUp, FileCheck2, ListTree, PackageCheck,
  Clock, CheckCircle2, ArrowRight, Building2, Sparkles, Search, Eye, CalendarRange
} from 'lucide-react'
import { api, rp, persen, bulanLabel, tgl, KATEGORI } from '../lib'
import { PageHeader, Progress, Empty, KategoriBadge, BuatDokumenMenu } from '../ui'
import { PreviewModal } from './Transaksi'
import { useAuth } from '../App'

export default function Dashboard() {
  const { user, tahun, setTahun, tahunList } = useAuth()
  const [d, setD] = useState(null)
  const [selectedInduk, setSelectedInduk] = useState('')
  const [searchTop, setSearchTop] = useState('')
  const [preview, setPreview] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api(`/dashboard?tahun=${encodeURIComponent(tahun || '')}`).then(setD)
  }, [tahun, user?.id, user?.role])
  if (!d) return null

  const maks = Math.max(1, ...d.perBulan.map((b) => Number(b.total) || 0))
  const capaian = d.pagu ? (d.realisasi / d.pagu) * 100 : 0
  const sisa = d.pagu - d.realisasi

  const jmlPesanan = d.perTahap?.find((x) => x.tahap === 'pesanan')?.jumlah || 0
  const jmlSelesai = d.perTahap?.find((x) => x.tahap === 'selesai')?.jumlah || 0

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
            {(tahunList || ['2026', '2025']).map((yr) => (
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
            <span className="rounded-md bg-[#f6db5b] px-2 py-0.5 text-[#122922]">{jmlPesanan} Tahap SP</span>
            <span className="rounded-md bg-[#b5e8a5] px-2 py-0.5 text-[#122922]">{jmlSelesai} Selesai BAST</span>
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

      {/* Middle Row: Paket Pengadaan Terbaru (2-Stage Actionable) + Grafik & Kategori */}
      <div className="mt-5 grid gap-5 xl:grid-cols-12">
        {/* Paket Pengadaan Terbaru — Bisa langsung klik "Buat BAST & A2" atau Lihat Dokumen */}
        <div className="card flex flex-col justify-between p-5 xl:col-span-7">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Monitoring Alur 2 Tahap</span>
                <h2 className="text-base font-extrabold text-[#122922]">Paket Pengadaan & SPJ Terbaru</h2>
              </div>
              <Link to="/transaksi" className="text-xs font-extrabold text-[#122922] underline">
                Semua Paket →
              </Link>
            </div>

            {(!d.recent || d.recent.length === 0) ? (
              <Empty>Belum ada transaksi pengadaan</Empty>
            ) : (
              <div className="divide-y divide-[#122922]/10">
                {d.recent.map((t) => {
                  const isSelesai = t.tahap === 'selesai' || !!t.bast_nomor
                  return (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#122922]">{t.penyedia}</span>
                          <span className="font-mono text-[11px] text-[#4b5e57]">· {tgl(t.sp_tanggal || t.tanggal)}</span>
                        </div>
                        <div className="truncate text-xs text-[#4b5e57]">{t.uraian}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                          <span className="text-[#3f8f77] font-bold">{t.sp_nomor || 'SP Draft'}</span>
                          {isSelesai && t.bast_nomor && <span className="text-[#122922]">→ BAST: {t.bast_nomor}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="font-mono text-sm font-extrabold text-[#122922]">{rp(t.kotor)}</div>
                          {isSelesai ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#b5e8a5] px-2 py-0.5 text-[10px] font-extrabold text-[#122922]">
                              <CheckCircle2 size={10} /> Selesai BAST & A2
                            </span>
                          ) : (
                            <Link
                              to={['10_50', '50_750'].includes(t.mode_pengadaan) ? `/pengadaan/${t.id}` : `/transaksi/${t.id}?mode=terima`}
                              className="inline-flex items-center gap-1 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-0.5 text-[10px] font-extrabold text-[#122922] hover:bg-[#c8e220]"
                            >
                              <Clock size={10} /> Barang Diterima → Buat BAST
                            </Link>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPreview({ id: t.id, jenis: isSelesai ? 'bast' : 'sp', tahap: isSelesai ? 'selesai' : 'pesanan' })}
                          className="rounded-xl border border-[#122922]/20 p-2 text-[#122922] hover:bg-[#d6ee30]"
                          title="Pratinjau Dokumen"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-4 py-2.5 text-xs">
            <span className="font-bold text-[#122922]">Alur Kerja Pengadaan:</span>
            <div className="flex flex-wrap items-center gap-2 font-semibold text-[#122922]/80">
              <span className="rounded-md border border-[#122922] bg-[#d6ee30] px-2 py-0.5 text-[11px] font-extrabold">1. Buat & Cetak SP</span>
              <span>→</span>
              <span className="rounded-md border border-[#122922] bg-[#a9dcf0] px-2 py-0.5 text-[11px] font-extrabold">2. Barang Datang: Buat BAST</span>
              <span>→</span>
              <span className="rounded-md border border-[#122922] bg-[#b5e8a5] px-2 py-0.5 text-[11px] font-extrabold">3. Cetak A2 & Verifikasi</span>
            </div>
          </div>
        </div>

        {/* Grafik Bulanan & Kategori */}
        <div className="space-y-5 xl:col-span-5">
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#122922]">Tren Realisasi Bulanan</h2>
            {d.perBulan.length === 0 ? <Empty>Belum ada transaksi</Empty> : (
              <div className="flex h-36 items-stretch justify-center gap-4 pt-4">
                {d.perBulan.map((b) => (
                  <div key={b.bulan} className="group flex w-14 flex-col items-center gap-1.5">
                    <div className="relative w-full flex-1">
                      <div
                        className="absolute inset-x-0 bottom-0 rounded-t-xl border-2 border-[#122922] bg-[#d6ee30] transition group-hover:bg-[#b5e8a5]"
                        style={{ height: `${Math.max(10, (b.total / maks) * 100)}%` }}
                      />
                      <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#122922] bg-[#122922] px-2.5 py-1 text-[11px] font-bold text-[#d6ee30] group-hover:block">
                        {rp(b.total)} · {b.jumlah} paket
                      </div>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#4b5e57]">{bulanLabel(b.bulan)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#122922]">Distribusi Kategori Nilai</h2>
            <div className="space-y-2.5">
              {KATEGORI.slice(0, 4).map((k) => {
                const r = d.perKategori.find((x) => x.kategori === k.kode)
                return (
                  <div
                    key={k.kode}
                    onClick={() => nav('/transaksi')}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent px-2 py-1 transition hover:border-[#122922]/15 hover:bg-[#f7f5ef]"
                  >
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${k.tone}`}>{k.label}</span>
                    <span className="font-mono text-xs text-[#4b5e57]">
                      <b className="font-extrabold text-[#122922]">{r?.jumlah || 0}</b> paket · {rp(r?.total || 0)}
                    </span>
                  </div>
                )
              })}
            </div>
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
          <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {d.top
              .filter((r) => !searchTop || r.uraian.toLowerCase().includes(searchTop.toLowerCase()) || r.kode.includes(searchTop))
              .map((r) => (
                <div key={r.id} className="rounded-xl border border-[#122922]/10 bg-[#f7f5ef]/50 p-3">
                  <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <span className="mr-2 rounded bg-[#d6ee30]/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#122922]">{r.kode}</span>
                      <span className="truncate font-extrabold text-[#122922]">{r.uraian}</span>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-extrabold text-[#122922]">{persen(r.capaian)}</span>
                  </div>
                  <Progress value={r.capaian} />
                  <div className="mt-1.5 flex justify-between font-mono text-[11px] text-[#4b5e57]">
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
