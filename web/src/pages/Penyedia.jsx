import { useEffect, useState } from 'react'
import { Building2, Pencil, Plus, Search, Trash2, MapPin, User, FileBadge } from 'lucide-react'
import { api } from '../lib'
import { Empty, Field, Modal, PageHeader, konfirmasiHapus } from '../ui'

const kosong = () => ({ nama: '', pimpinan: '', jabatan: 'Direktur', alamat: '', npwp: '', aktif: 1 })

export default function Penyedia() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')

  const load = () => api('/penyedia?all=1').then(setRows)
  useEffect(() => { load() }, [])

  const simpan = async (e) => {
    e.preventDefault(); setErr('')
    try {
      edit.id
        ? await api('/penyedia/' + edit.id, { method: 'PUT', body: edit })
        : await api('/penyedia', { method: 'POST', body: edit })
      setEdit(null); load()
    } catch (er) { setErr(er.message) }
  }

  const hapus = async (v) => {
    const yakin = await konfirmasiHapus({
      title: 'Hapus Rekanan Penyedia?',
      text: `Penyedia "${v.nama}" (${v.pimpinan || '-'}) akan dihapus dari daftar rekanan.`,
      confirmText: 'Ya, Hapus Penyedia!',
    })
    if (!yakin) return
    try {
      await api('/penyedia/' + v.id, { method: 'DELETE' })
      load()
    } catch (er) {
      alert(er.message || 'Gagal menghapus penyedia')
    }
  }

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase()
    return (
      !s ||
      (r.nama || '').toLowerCase().includes(s) ||
      (r.pimpinan || '').toLowerCase().includes(s) ||
      (r.alamat || '').toLowerCase().includes(s) ||
      (r.npwp || '').toLowerCase().includes(s)
    )
  })

  return (
    <>
      <PageHeader
        kicker="Data Master Rekanan"
        title="Daftar Penyedia (CV / PT)"
        desc="Data penyedia dipakai otomatis untuk isian Surat Pesanan (SP), BAST, A2, dan Lembar Verifikasi"
      >
        <button className="btn-lime" onClick={() => setEdit(kosong())}>
          <Plus size={16} strokeWidth={2.5} /> Tambah Penyedia
        </button>
      </PageHeader>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#122922]/12 bg-[#f7f5ef]/70 p-4">
          <div className="relative min-w-64 flex-1 max-w-md">
            <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
            <input
              className="input !pl-9"
              placeholder="Cari nama CV/PT, direktur, NPWP, atau alamat…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="font-mono text-xs font-bold text-[#122922]/70">
            Total: <span className="rounded-full border border-[#122922] bg-[#d6ee30] px-2 py-0.5 text-[#122922]">{filtered.length}</span> penyedia
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="tabel-kartu w-full">
            <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/40">
              <tr>
                <th className="th">Nama CV / Penyedia</th>
                <th className="th">Nama Direktur / Pimpinan</th>
                <th className="th">NPWP</th>
                <th className="th">Alamat Lengkap</th>
                <th className="th text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#122922]/10">
              {filtered.map((v) => (
                <tr key={v.id} className="transition hover:bg-[#f7f5ef]/60">
                  <td className="td">
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 border-[#122922] bg-[#d6ee30]/60 text-[#122922]">
                        <Building2 size={16} />
                      </div>
                      <div>
                        <div className="font-extrabold text-[#122922]">{v.nama}</div>
                        {!v.aktif && <span className="text-[10px] font-bold text-rose-600 uppercase">Nonaktif</span>}
                      </div>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex items-center gap-1.5 font-bold text-[#122922]">
                      <User size={13} className="text-[#3f8f77]" />
                      {v.pimpinan || <span className="text-[#122922]/40 font-normal">Belum diisi</span>}
                    </div>
                    <div className="text-xs text-[#122922]/60">{v.jabatan || 'Direktur'}</div>
                  </td>
                  <td className="td" data-label="NPWP">
                    {v.npwp ? (
                      <span className="inline-flex items-center gap-1 rounded-lg border border-[#122922]/20 bg-[#f7f5ef] px-2.5 py-1 font-mono text-xs font-bold text-[#122922]">
                        <FileBadge size={12} className="text-[#3f8f77]" />
                        {v.npwp}
                      </span>
                    ) : (
                      <span className="text-xs text-[#122922]/40">—</span>
                    )}
                  </td>
                  <td className="td max-w-md">
                    <div className="flex items-start gap-1.5 text-xs text-[#122922]/80">
                      <MapPin size={13} className="mt-0.5 shrink-0 text-[#3f8f77]" />
                      <span>{v.alamat || '—'}</span>
                    </div>
                  </td>
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEdit(v)}
                        className="rounded-lg border border-[#122922]/20 p-1.5 text-[#122922] hover:bg-[#d6ee30] transition"
                        title="Ubah"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => hapus(v)}
                        className="rounded-lg border border-transparent p-1.5 text-[#122922]/50 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 transition"
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <Empty>Belum ada data penyedia yang cocok.</Empty>
          )}
        </div>
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Ubah Data Penyedia' : 'Tambah Penyedia Baru'}>
          <form onSubmit={simpan} className="space-y-3.5">
            <Field label="Nama CV / PT / Penyedia">
              <input
                className="input"
                placeholder="mis. CV. Surya Globe"
                value={edit.nama}
                onChange={(e) => setEdit({ ...edit, nama: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nama Direktur / Pimpinan">
                <input
                  className="input"
                  placeholder="mis. Sigit Gunawan"
                  value={edit.pimpinan || ''}
                  onChange={(e) => setEdit({ ...edit, pimpinan: e.target.value })}
                />
              </Field>
              <Field label="Jabatan">
                <input
                  className="input"
                  placeholder="Direktur"
                  value={edit.jabatan || ''}
                  onChange={(e) => setEdit({ ...edit, jabatan: e.target.value })}
                />
              </Field>
            </div>
            <Field label="NPWP Penyedia">
              <input
                className="input font-mono"
                placeholder="mis. 01.234.567.8-526.000"
                value={edit.npwp || ''}
                onChange={(e) => setEdit({ ...edit, npwp: e.target.value })}
              />
            </Field>
            <Field label="Alamat Lengkap">
              <textarea
                rows={2}
                className="input"
                placeholder="mis. Jl. Prof. Dr. Soeharso No. 86, Jajar, Kota Surakarta"
                value={edit.alamat || ''}
                onChange={(e) => setEdit({ ...edit, alamat: e.target.value })}
              />
            </Field>
            {edit.id && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  className="accent-[#122922]"
                  checked={!!edit.aktif}
                  onChange={(e) => setEdit({ ...edit, aktif: e.target.checked ? 1 : 0 })}
                />
                Penyedia Aktif
              </label>
            )}
            {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
            <button className="btn-primary w-full">Simpan Penyedia</button>
          </form>
        </Modal>
      )}
    </>
  )
}
