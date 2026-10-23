import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownToLine, ArrowUpToLine, Hash, Pencil, Plus, Search, Trash2, TriangleAlert } from 'lucide-react'
import { api, tgl } from '../lib'
import { Empty, Field, Modal, PageHeader, SearchableSelect, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const angkaDari = (urut) => {
  const n = parseInt(urut, 10)
  return Number.isNaN(n) ? null : n
}
const linkPaket = (i) => (['10_50', '50_750'].includes(i.mode) ? `/pengadaan/${i.transaksi_id}` : `/transaksi/${i.transaksi_id}`)

function NomorModal({ data, tahun, onClose, onSaved }) {
  const [f, setF] = useState(data)
  const [err, setErr] = useState('')
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const simpan = async (e) => {
    e.preventDefault()
    try {
      const body = { ...f, tahun }
      f.id ? await api('/nomor/' + f.id, { method: 'PUT', body }) : await api('/nomor', { method: 'POST', body })
      onSaved()
      onClose()
    } catch (er) { setErr(er.message) }
  }
  return (
    <Modal open onClose={onClose} title={f.id ? 'Ubah Catatan Nomor' : 'Catat Nomor Surat'}>
      <form onSubmit={simpan} className="space-y-3.5">
        <Field label="Nomor urut" hint="Angka, boleh dengan sufiks huruf, mis. 2574 atau 2573.a">
          <input className="input font-mono text-base font-bold" value={f.no_urut || ''} onChange={(e) => u('no_urut', e.target.value)} autoFocus placeholder="2574" />
        </Field>
        <div className="rounded-xl border border-[#122922]/15 bg-[#f7f5ef] px-3.5 py-2 font-mono text-xs font-bold text-[#122922]">
          000.3.2/{f.no_urut || '…'}/05.1.2/{tahun}
        </div>
        <Field label="Untuk keperluan apa">
          <input className="input" value={f.perihal || ''} onChange={(e) => u('perihal', e.target.value)} placeholder="mis. Surat undangan rapat, nomor dicadangkan PPK" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tanggal surat">
            <input type="date" className="input" value={(f.tanggal || '').slice(0, 10)} onChange={(e) => u('tanggal', e.target.value)} />
          </Field>
          <Field label="Keterangan (opsional)">
            <input className="input" value={f.keterangan || ''} onChange={(e) => u('keterangan', e.target.value)} />
          </Field>
        </div>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <button className="btn-primary w-full">Simpan Nomor</button>
      </form>
    </Modal>
  )
}

export default function Nomor() {
  const { user, tahun: tahunGlobal, tahunList } = useAuth()
  const bolehUbah = ['admin', 'superuser', 'pep', 'pejabat_pengadaan'].includes(user?.role)
  const [tahun, setTahun] = useState(tahunGlobal && tahunGlobal !== 'semua' ? tahunGlobal : String(new Date().getFullYear()))
  const [items, setItems] = useState(null)
  const [q, setQ] = useState('')
  const [jenis, setJenis] = useState('')
  const [modal, setModal] = useState(null)
  const [pesan, setPesan] = useState('')
  const [galat, setGalat] = useState('')

  const load = useCallback(() => api('/nomor?tahun=' + tahun)
    .then((r) => { setItems(r.items); setGalat('') })
    .catch((e) => { setItems([]); setGalat(e.status === 404 ? 'Server belum diperbarui. Restart server (npm start) agar Monitoring Nomor aktif.' : e.message) }), [tahun])
  useEffect(() => { load() }, [load])

  const tambahTetangga = async (i, arah) => {
    setPesan('')
    try {
      const r = await api(`/nomor/saran?tahun=${tahun}&acuan=${encodeURIComponent(i.no_urut)}&arah=${arah}`)
      setModal({ no_urut: r.no_urut, perihal: '', tanggal: '', keterangan: '' })
    } catch (e) { setPesan(e.message) }
  }
  const hapus = async (i) => {
    const yakin = await konfirmasiHapus({ title: 'Hapus catatan nomor?', text: `Nomor ${i.no_urut} (${i.jenis}) dihapus dari daftar.`, confirmText: 'Ya, Hapus' })
    if (!yakin) return
    await api('/nomor/' + i.manual_id, { method: 'DELETE' }); load()
  }

  const jenisOpsi = useMemo(() => [{ value: '', label: 'Semua jenis dokumen' }, ...[...new Set((items || []).map((i) => i.jenis))].sort().map((j) => ({ value: j, label: j }))], [items])

  // baris tampil + penanda lompatan nomor (1–30 nomor kosong di antara dua nomor terpakai)
  const baris = useMemo(() => {
    if (!items) return []
    const ql = q.trim().toLowerCase()
    const cocok = items.filter((i) => (!jenis || i.jenis === jenis) && (!ql || `${i.no_urut} ${i.jenis} ${i.paket}`.toLowerCase().includes(ql)))
    const out = []
    cocok.forEach((i, idx) => {
      const prev = cocok[idx - 1]
      const a = angkaDari(prev?.no_urut), b = angkaDari(i.no_urut)
      if (!ql && !jenis && prev && a != null && b != null) {
        const kosong = b - a - 1
        if (kosong >= 1 && kosong <= 30) out.push({ gap: true, dari: a + 1, sampai: b - 1, kunci: `g${a}-${b}` })
      }
      out.push(i)
    })
    return out
  }, [items, q, jenis])

  const kembar = (items || []).filter((i) => i.kembar).length
  const manual = (items || []).filter((i) => i.sumber === 'manual').length

  return (
    <>
      <PageHeader
        kicker={`Buku Register · Tahun ${tahun}`}
        title="Monitoring Nomor Surat"
        desc="Semua nomor 000.3.2/…/05.1.2 yang terpakai dokumen pengadaan, ditambah nomor yang Anda catat sendiri"
      >
        <select className="input !w-auto !py-2 font-mono text-sm font-extrabold" value={tahun} onChange={(e) => setTahun(e.target.value)}>
          {[...new Set([...(tahunList || []), tahun])].sort().reverse().map((t) => <option key={t} value={t}>Tahun {t}</option>)}
        </select>
        {bolehUbah && (
          <button className="btn-lime" onClick={() => setModal({ no_urut: '', perihal: '', tanggal: '', keterangan: '' })}>
            <Plus size={16} strokeWidth={2.5} /> Catat Nomor
          </button>
        )}
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Nomor terpakai', items?.length ?? '…', 'bg-[#b5e8a5]'],
          ['Dicatat manual', manual, 'bg-[#a9dcf0]'],
          ['Nomor kembar', kembar, kembar ? 'bg-[#f4c2cc]' : 'bg-[#f7f5ef]'],
        ].map(([label, nilai, warna]) => (
          <div key={label} className={`card px-4 py-3 ${warna}`}>
            <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#122922]/70">{label}</div>
            <div className="text-2xl font-extrabold text-[#122922]">{nilai}</div>
          </div>
        ))}
      </div>

      {galat && <p className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700">{galat}</p>}
      {pesan && <p className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700">{pesan}</p>}

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#122922]/12 bg-[#f7f5ef]/70 p-4">
          <div className="relative min-w-60 flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
            <input className="input !pl-9" placeholder="Cari nomor, jenis dokumen, atau paket…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="w-64"><SearchableSelect value={jenis} options={jenisOpsi} onChange={setJenis} placeholder="Semua jenis dokumen" /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/40">
              <tr>
                <th className="th">No. urut</th>
                <th className="th">Untuk</th>
                <th className="th">Paket / keterangan</th>
                <th className="th">Tanggal</th>
                <th className="th text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#122922]/10">
              {baris.map((r) => r.gap ? (
                <tr key={r.kunci} className="bg-[#fffbe6]">
                  <td colSpan={5} className="px-4 py-1.5 text-xs font-semibold text-[#122922]/70">
                    <span className="font-mono font-bold">{r.dari === r.sampai ? r.dari : `${r.dari}–${r.sampai}`}</span> belum terpakai
                    {bolehUbah && (
                      <button className="ml-3 font-bold text-[#1d5a42] underline" onClick={() => setModal({ no_urut: String(r.dari), perihal: '', tanggal: '', keterangan: '' })}>
                        catat {r.dari}
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                <tr key={r.kunci} className={`transition hover:bg-[#f7f5ef]/60 ${r.kembar ? 'bg-[#fdecef]' : ''}`}>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <Hash size={13} className="text-[#3f8f77]" />
                      <span className="font-mono text-sm font-extrabold text-[#122922]">{r.no_urut}</span>
                      {r.kembar && <span className="inline-flex items-center gap-1 rounded-full bg-[#f06859] px-2 py-0.5 text-[10px] font-bold text-white"><TriangleAlert size={10} /> kembar</span>}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-[#122922]/50">{r.nomor}</div>
                  </td>
                  <td className="td whitespace-nowrap">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${r.sumber === 'manual' ? 'bg-[#a9dcf0]' : 'bg-[#d6ee30]/60'}`}>{r.jenis}</span>
                  </td>
                  <td className="td max-w-md truncate text-sm text-[#122922]/80">
                    {r.sumber === 'dokumen' ? <Link className="hover:underline" to={linkPaket(r)}>{r.paket || `Paket #${r.transaksi_id}`}</Link> : (r.paket || '—')}
                  </td>
                  <td className="td font-mono text-xs">{tgl(r.tanggal) || '—'}</td>
                  <td className="td">
                    <div className="flex justify-end gap-1">
                      {bolehUbah && (
                        <>
                          <button title="Tambah nomor tepat di atas (lebih kecil)" onClick={() => tambahTetangga(r, 'atas')} className="rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30] transition"><ArrowUpToLine size={14} /></button>
                          <button title="Tambah nomor tepat di bawah (lebih besar)" onClick={() => tambahTetangga(r, 'bawah')} className="rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30] transition"><ArrowDownToLine size={14} /></button>
                        </>
                      )}
                      {bolehUbah && r.sumber === 'manual' && (
                        <>
                          <button title="Ubah" onClick={() => setModal({ id: r.manual_id, no_urut: r.no_urut, perihal: r.jenis, tanggal: r.tanggal || '', keterangan: r.paket })} className="rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30] transition"><Pencil size={14} /></button>
                          <button title="Hapus" onClick={() => hapus(r)} className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600 transition"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items && !baris.length && <Empty>Belum ada nomor di tahun {tahun}.</Empty>}
        </div>
      </div>

      {modal && <NomorModal key={JSON.stringify(modal)} data={modal} tahun={tahun} onClose={() => setModal(null)} onSaved={load} />}
    </>
  )
}
