import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Download, FolderTree, Pencil, Plus, Search, Trash2, Upload, UserCheck } from 'lucide-react'
import { api, persen, rp } from '../lib'
import { Empty, Field, Modal, PageHeader, Progress, SearchableSelect, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const INDUK_OPTIONS = [
  { kode: '5.1.01.99.99.9999', uraian: 'Belanja Pegawai BLUD' },
  { kode: '5.1.02.99.99.9999', uraian: 'Belanja Barang dan Jasa BLUD' },
  { kode: '5.2.02.99.99.9999', uraian: 'Belanja Modal Peralatan dan Mesin BLUD' },
  { kode: '5.2.03.99.99.9999', uraian: 'Belanja Modal Gedung dan Bangunan BLUD' },
  { kode: '5.2.04.99.99.9999', uraian: 'Belanja Modal Jalan, Jaringan, dan Irigasi ( BLUD )' },
]

function ImportModal({ open, onClose, onDone, tahun }) {
  const [file, setFile] = useState(null)
  const [sheets, setSheets] = useState([])
  const [sheet, setSheet] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [tahunTarget, setTahunTarget] = useState(tahun && tahun !== 'semua' ? tahun : String(new Date().getFullYear() + 1))

  const pick = async (f) => {
    setFile(f); setMsg('')
    if (!f) return
    const fd = new FormData(); fd.append('file', f)
    try { const s = await api('/import/sheets', { method: 'POST', form: fd }); setSheets(s); setSheet('') } catch (e) { setMsg(e.message) }
  }
  const go = async () => {
    setBusy(true); setMsg('')
    const fd = new FormData(); fd.append('file', file); fd.append('sheet', sheet)
    try { const r = await api('/import/realisasi', { method: 'POST', form: fd }); setMsg(`Berhasil: ${r.rekening} kode rekening dari sheet “${r.sheet}”.`); onDone() }
    catch (e) { setMsg(e.message) } finally { setBusy(false) }
  }
  const sheetOptions = [
    { value: '', label: 'Otomatis (sheet utama / bulan terakhir)' },
    ...sheets.map((s) => ({ value: s, label: s })),
  ]
  return (
    <Modal open={open} onClose={onClose} title="Format Template & Impor Kode Rekening (Role PEP)">
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-[#122922] bg-[#d6ee30]/35 p-3.5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">1. Unduh Format Excel Ber-Dropdown (PP, PPK, PPTK)</div>
          <p className="mt-1 text-xs text-[#122922]/80">
            Format Excel ini sudah berisi seluruh <b>Kode Rekening Induk &amp; Rincian</b> beserta <b>Dropdown Otomatis (Data Validation)</b> nama-nama <b>PPKOM (PPK)</b>, <b>PPTK</b>, dan <b>Pejabat Pengadaan (PP)</b>. Untuk tahun anggaran baru (mis. 2027), tim <b>PEP</b> cukup mengganti nominal <b>Anggaran</b> dan memilih pejabat dari dropdown.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <input
              type="number"
              className="input !w-28 !py-1.5 font-mono text-xs font-bold"
              value={tahunTarget}
              onChange={(e) => setTahunTarget(e.target.value)}
              placeholder="2027"
            />
            <a
              href={`/api/import/template?tahun=${encodeURIComponent(tahunTarget || '2027')}`}
              className="btn-lime !py-1.5 text-xs"
            >
              <Download size={14} /> Unduh Template Excel {tahunTarget} (.xlsx)
            </a>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">2. Unggah File Excel Template / Realisasi BLUD</div>
          <input type="file" accept=".xlsx" onChange={(e) => pick(e.target.files[0])} className="input" />
          {sheets.length > 0 && (
            <Field label="Sheet sumber">
              <SearchableSelect value={sheet} options={sheetOptions} onChange={(v) => setSheet(v)} placeholder="Otomatis (sheet utama / bulan terakhir)" />
            </Field>
          )}
          {msg && <p className="rounded-xl border border-[#122922]/20 bg-[#f7f5ef] px-3.5 py-2.5 text-sm font-semibold text-[#122922]">{msg}</p>}
          <button className="btn-primary w-full" disabled={!file || busy} onClick={go}><Upload size={15} />{busy ? 'Mengimpor…' : 'Impor Data Kode Rekening & Pejabat'}</button>
        </div>
      </div>
    </Modal>
  )
}

function RekModal({ rek, pejabat, onClose, onSaved }) {
  const [f, setF] = useState(() => rek || {})
  const [err, setErr] = useState('')
  useEffect(() => {
    if (rek) {
      setF(rek)
      setErr('')
    }
  }, [rek])
  if (!rek) return null
  const d = f || rek
  const u = (k, v) => setF((x) => ({ ...(x || rek), [k]: v }))
  const sel = (peran, key, label) => {
    const opts = pejabat
      .filter((p) => p.peran === peran && p.aktif)
      .map((p) => ({ value: p.id, label: p.nama, sub: p.nip ? `NIP. ${p.nip}` : '' }))
    return (
      <Field label={label}>
        <SearchableSelect
          value={d[key] || ''}
          options={opts}
          placeholder="— pilih —"
          searchPlaceholder="Cari nama pejabat…"
          allowClear
          onChange={(v) => u(key, v)}
        />
      </Field>
    )
  }
  const pilihInduk = (ik) => {
    const found = INDUK_OPTIONS.find((x) => x.kode === ik)
    const nu = String(d.no_urut || 1).padStart(2, '0')
    setF((x) => ({
      ...(x || rek),
      induk_kode: ik,
      induk_uraian: found ? found.uraian : (x || rek).induk_uraian,
      kode: `${ik}.${nu}`,
    }))
  }
  const ubahUrut = (nu) => {
    const ik = d.induk_kode || '5.1.02.99.99.9999'
    setF((x) => ({
      ...(x || rek),
      no_urut: nu,
      kode: `${ik}.${String(nu || 1).padStart(2, '0')}`,
    }))
  }
  const simpan = async (e) => {
    e.preventDefault()
    try {
      d.id ? await api('/rekening/' + d.id, { method: 'PUT', body: d }) : await api('/rekening', { method: 'POST', body: d })
      onSaved()
      onClose()
    } catch (er) {
      setErr(er.message)
    }
  }
  const indukOpts = INDUK_OPTIONS.map((o) => ({ value: o.kode, badge: o.kode, label: o.uraian }))
  return (
    <Modal open={!!rek} onClose={onClose} title={d.id ? 'Ubah Rincian Kode Rekening' : 'Tambah Rincian Kode Rekening'}>
      <form onSubmit={simpan} className="space-y-3.5">
        <Field label="Kode Rekening Induk">
          <SearchableSelect
            value={d.induk_kode || '5.1.02.99.99.9999'}
            options={indukOpts}
            onChange={pilihInduk}
            searchPlaceholder="Cari kode rekening induk…"
          />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="No. Urut Rekening">
            <input type="number" className="input font-mono" value={d.no_urut ?? 1} onChange={(e) => ubahUrut(e.target.value)} />
          </Field>
          <Field label="Kode Lengkap (RBA)" className="col-span-2">
            <input className="input font-mono" value={d.kode || ''} onChange={(e) => u('kode', e.target.value)} />
          </Field>
        </div>
        <Field label="Uraian Kode Rekening">
          <input className="input" value={d.uraian || ''} onChange={(e) => u('uraian', e.target.value)} placeholder="mis. Belanja Alat Tulis Kantor" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Anggaran / Pagu (Rp)">
            <input type="number" className="input font-mono" value={d.pagu ?? 0} onChange={(e) => u('pagu', e.target.value)} />
          </Field>
          <Field label="Realisasi Awal (Rp)">
            <input type="number" className="input font-mono" value={d.realisasi_awal ?? 0} onChange={(e) => u('realisasi_awal', e.target.value)} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {sel('PPKOM', 'ppkom_id', 'PPK')}
          {sel('PPTK', 'pptk_id', 'PPTK')}
          {sel('PENGADAAN', 'pengadaan_id', 'Pej. Pengadaan')}
        </div>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <button className="btn-primary w-full">Simpan Rekening</button>
      </form>
    </Modal>
  )
}

export default function Rekening() {
  const { user, tahun } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'pep' || user?.role === 'superuser' || !!user?.is_super
  const [rows, setRows] = useState(null)
  const [q, setQ] = useState('')
  const [filterInduk, setFilterInduk] = useState('')
  const [hanyaDiampu, setHanyaDiampu] = useState(false)
  const [collapsed, setCollapsed] = useState({})
  const [pejabat, setPejabat] = useState([])
  const [edit, setEdit] = useState(null)
  const [imp, setImp] = useState(false)

  // Jika login sebagai pejabat pengadaan, default tampilkan semua di menu Kode Rekening tapi sediakan tombol filter "Hanya yang Saya Ampu"
  const load = useCallback(() => {
    const p = new URLSearchParams({
      q,
      tahun: tahun || '',
      diampu: hanyaDiampu ? '1' : '',
    })
    return api('/rekening?' + p).then(setRows)
  }, [q, tahun, hanyaDiampu, user?.id])

  useEffect(() => { const t = setTimeout(load, 150); return () => clearTimeout(t) }, [load])
  useEffect(() => { api('/pejabat').then(setPejabat) }, [imp, edit])

  const hapus = async (r) => {
    const yakin = await konfirmasiHapus({
      title: 'Hapus Kode Rekening?',
      text: `Rekening "${r.kode} — ${r.uraian}" akan dihapus dari daftar anggaran belanja.`,
      confirmText: 'Ya, Hapus Rekening!',
    })
    if (!yakin) return
    try { await api('/rekening/' + r.id, { method: 'DELETE' }); load() } catch (e) { alert(e.message) }
  }
  const nm = (id) => pejabat.find((p) => p.id === id)?.nama

  const groups = useMemo(() => {
    if (!rows) return []
    const map = new Map()
    for (const r of rows) {
      const ik = r.induk_kode || r.kode.split('.').slice(0, 6).join('.') || '5.1.02.99.99.9999'
      if (filterInduk && ik !== filterInduk) continue
      if (!map.has(ik)) {
        const defaultInfo = INDUK_OPTIONS.find((x) => x.kode === ik)
        map.set(ik, {
          induk_kode: ik,
          induk_uraian: r.induk_uraian || defaultInfo?.uraian || 'Belanja BLUD',
          pagu: 0,
          realisasi: 0,
          sisa: 0,
          items: [],
        })
      }
      const g = map.get(ik)
      g.pagu += Number(r.pagu) || 0
      g.realisasi += Number(r.realisasi) || 0
      g.sisa += Number(r.sisa) || 0
      g.items.push(r)
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      capaian: g.pagu ? (g.realisasi / g.pagu) * 100 : 0,
      items: g.items.sort((a, b) => (Number(a.no_urut) || 0) - (Number(b.no_urut) || 0)),
    }))
  }, [rows, filterInduk])

  const toggleGroup = (ik) => setCollapsed((c) => ({ ...c, [ik]: !c[ik] }))

  const filterIndukOptions = useMemo(
    () => [
      { value: '', label: `Semua Kode Rekening Induk (${rows?.length || 0} rincian)` },
      ...INDUK_OPTIONS.map((o) => ({ value: o.kode, badge: o.kode, label: o.uraian })),
    ],
    [rows]
  )

  return (
    <>
      <PageHeader
        kicker={`Struktur Anggaran BLUD · TA ${tahun === 'semua' ? 'Semua Tahun' : tahun}`}
        title="Kode Rekening Induk & Rincian Belanja"
        desc="Dikelompokkan per Kode Rekening Induk beserta penunjukan PP, PPK, dan PPTK pengampu (dikelola oleh Role PEP / Admin)"
      >
        {user?.pejabat_id && (
          <button
            type="button"
            onClick={() => setHanyaDiampu((v) => !v)}
            className={`btn-ghost ${hanyaDiampu ? '!bg-[#d6ee30] !border-[#122922]' : ''}`}
          >
            <UserCheck size={15} />
            {hanyaDiampu ? 'Menampilkan yang Saya Ampu' : 'Filter: Hanya yang Saya Ampu'}
          </button>
        )}
        {canManage && (
          <>
            <a
              href={`/api/import/template?tahun=${encodeURIComponent(tahun && tahun !== 'semua' ? tahun : '2026')}`}
              className="btn-ghost"
              title="Unduh Excel Template lengkap dengan Dropdown PP, PPK, dan PPTK"
            >
              <Download size={15} /> Template Excel (Dropdown)
            </a>
            <button className="btn-ghost" onClick={() => setImp(true)}>
              <Upload size={15} /> Impor Excel (PEP)
            </button>
            <button
              className="btn-lime"
              onClick={() => setEdit({ induk_kode: '5.1.02.99.99.9999', induk_uraian: 'Belanja Barang dan Jasa BLUD', no_urut: 1, kode: '5.1.02.99.99.9999.01', uraian: '', pagu: 0, realisasi_awal: 0 })}
            >
              <Plus size={16} strokeWidth={2.5} /> Tambah Rekening
            </button>
          </>
        )}
      </PageHeader>

      <div className="card mb-5 p-4 overflow-visible">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="relative md:col-span-7">
            <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
            <input
              className="input !pl-9"
              placeholder="Cari nomor urut, kode rekening, atau uraian belanja…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="md:col-span-5">
            <SearchableSelect
              value={filterInduk}
              options={filterIndukOptions}
              placeholder={`Semua Kode Rekening Induk (${rows?.length || 0} rincian)`}
              searchPlaceholder="Cari kode rekening induk…"
              allowClear
              onChange={(v) => setFilterInduk(v)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {groups.map((g) => {
          const isClosed = !!collapsed[g.induk_kode]
          const segs = g.induk_kode.split('.')
          return (
            <div key={g.induk_kode} className="card overflow-hidden">
              <div
                onClick={() => toggleGroup(g.induk_kode)}
                className="flex cursor-pointer flex-wrap items-center justify-between gap-4 border-b-2 border-[#122922] bg-[#122922] px-5 py-4 text-white transition hover:bg-[#19382e]"
              >
                <div className="flex items-center gap-3">
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-lg bg-[#d6ee30] text-[#122922]">
                    {isClosed ? <ChevronRight size={16} strokeWidth={2.6} /> : <ChevronDown size={16} strokeWidth={2.6} />}
                  </button>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#d6ee30]">KODE INDUK:</span>
                      {segs.map((s, idx) => (
                        <span key={idx} className="rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-mono text-xs font-extrabold text-[#d6ee30]">
                          {s}
                        </span>
                      ))}
                      <span className="ml-1 rounded-full bg-[#b5e8a5] px-2.5 py-0.5 font-mono text-[11px] font-extrabold text-[#122922]">
                        {g.items.length} Kode Rekening
                      </span>
                    </div>
                    <h2 className="mt-1 text-base font-extrabold tracking-tight text-white">{g.induk_uraian}</h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-right">
                  <div>
                    <div className="text-[10px] font-bold uppercase text-white/60">Total Anggaran Induk</div>
                    <div className="font-mono text-sm font-extrabold text-[#d6ee30]">{rp(g.pagu)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-white/60">Realisasi</div>
                    <div className="font-mono text-sm font-extrabold text-[#b5e8a5]">{rp(g.realisasi)} ({persen(g.capaian)})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-white/60">Sisa Anggaran</div>
                    <div className="font-mono text-sm font-extrabold text-white">{rp(g.sisa)}</div>
                  </div>
                </div>
              </div>

              {!isClosed && (
                <div className="w-full">
                  <table className="w-full table-fixed">
                    <thead className="border-b border-[#122922]/15 bg-[#f7f5ef]">
                      <tr>
                        <th className="th w-[5%] text-center !px-2">No</th>
                        <th className="th w-[23%] !px-3">Uraian Rincian Belanja (Child)</th>
                        <th className="th w-[14%] !px-2.5">Kode RBA Lengkap</th>
                        <th className="th w-[12%] text-right !px-2.5">Anggaran (Pagu)</th>
                        <th className="th w-[11%] text-right !px-2.5">Realisasi</th>
                        <th className="th w-[11%] text-right !px-2.5">Sisa Anggaran</th>
                        <th className="th w-[16%] !px-2.5">Serapan &amp; Pengampu (PP/PPK/PPTK)</th>
                        <th className="th w-[8%] text-right !px-3">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#122922]/10">
                      {g.items.map((r, idx) => {
                        const urut = r.no_urut || parseInt(r.kode.split('.')[6], 10) || idx + 1
                        return (
                          <tr key={r.id} className="transition hover:bg-[#f7f5ef]/70">
                            <td className="td text-center !px-2 align-middle">
                              <span className="inline-grid h-7 w-7 place-items-center rounded-lg border border-[#122922] bg-[#d6ee30]/60 font-mono text-xs font-extrabold text-[#122922]">
                                {urut}
                              </span>
                            </td>
                            <td className="td !px-3 align-middle">
                              <div className="font-extrabold text-[#122922] break-words leading-snug">{r.uraian}</div>
                            </td>
                            <td className="td !px-2.5 align-middle">
                              <span className="inline-block rounded-md border border-[#122922]/15 bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#3f8f77] break-all">
                                {r.kode}
                              </span>
                            </td>
                            <td className="td !px-2.5 text-right font-mono text-xs font-bold tabular-nums text-[#122922] align-middle">{rp(r.pagu)}</td>
                            <td className="td !px-2.5 text-right font-mono text-xs font-semibold tabular-nums text-[#3f8f77] align-middle">{rp(r.realisasi)}</td>
                            <td className="td !px-2.5 text-right font-mono text-xs font-bold tabular-nums text-[#122922] align-middle">{rp(r.sisa)}</td>
                            <td className="td !px-2.5 align-middle">
                              <div className="mb-1 flex justify-between font-mono text-[10px] font-bold text-[#122922]">
                                <span>{persen(r.capaian)}</span>
                              </div>
                              <Progress value={r.capaian} />
                              <div className="mt-1 space-y-0.5 text-[10px] leading-tight">
                                {r.pengadaan_id && (
                                  <div className="truncate font-bold text-[#122922]" title={`PP: ${nm(r.pengadaan_id)}`}>
                                    <span className="rounded bg-[#d6ee30] px-1 py-0.2 font-mono text-[9px]">PP</span> {nm(r.pengadaan_id)}
                                  </div>
                                )}
                                {r.ppkom_id && (
                                  <div className="truncate font-semibold text-[#4b5e57]" title={`PPK: ${nm(r.ppkom_id)}`}>
                                    <span className="rounded bg-[#a9dcf0] px-1 py-0.2 font-mono text-[9px] text-[#122922]">PPK</span> {nm(r.ppkom_id)}
                                  </div>
                                )}
                                {r.pptk_id && (
                                  <div className="truncate font-semibold text-[#4b5e57]" title={`PPTK: ${nm(r.pptk_id)}`}>
                                    <span className="rounded bg-[#b5e8a5] px-1 py-0.2 font-mono text-[9px] text-[#122922]">PPTK</span> {nm(r.pptk_id)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="td !px-3 align-middle">
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEdit({ ...r })}
                                  className="rounded-lg border border-[#122922]/20 p-1.5 text-[#122922] hover:bg-[#d6ee30] cursor-pointer"
                                  title="Ubah Rincian Kode Rekening & Pejabat Pengampu"
                                >
                                  <Pencil size={14} />
                                </button>
                                {canManage && (
                                  <button
                                    type="button"
                                    onClick={() => hapus(r)}
                                    className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                    title="Hapus"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {rows && groups.length === 0 && (
          <div className="card">
            <Empty>
              <FolderTree className="mx-auto mb-2 text-[#122922]/40" />
              Tidak ada kode rekening yang sesuai pencarian.
            </Empty>
          </div>
        )}
      </div>

      <ImportModal open={imp} onClose={() => setImp(false)} onDone={load} tahun={tahun} />
      {edit && <RekModal rek={edit} pejabat={pejabat} onClose={() => setEdit(null)} onSaved={load} />}
    </>
  )
}
