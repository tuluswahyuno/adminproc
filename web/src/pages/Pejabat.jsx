import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, UserCheck } from 'lucide-react'
import { api, PERAN } from '../lib'
import { Field, Modal, PageHeader, SearchableSelect, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const ORDER_PERAN = ['PENGADAAN', 'PPKOM', 'PPTK', 'KPA', 'BENDAHARA', 'VERIFIKATOR', 'PENGURUS_BARANG']
const BADGE_PERAN = {
  PENGADAAN: 'bg-[#d6ee30]',
  PPKOM: 'bg-[#a9dcf0]',
  PPTK: 'bg-[#b5e8a5]',
  KPA: 'bg-[#f6db5b]',
  BENDAHARA: 'bg-[#b7aef3]',
  VERIFIKATOR: 'bg-[#f3b6c0]',
  PENGURUS_BARANG: 'bg-[#fbd38d]',
}

export default function Pejabat() {
  const { user } = useAuth()
  const [rows, setRows] = useState([])
  const [filterPeran, setFilterPeran] = useState('')
  const [edit, setEdit] = useState(null)
  const [err, setErr] = useState('')

  const load = () => api('/pejabat').then(setRows)
  useEffect(() => { load() }, [])

  const simpan = async (e) => {
    e.preventDefault(); setErr('')
    try {
      edit.id ? await api('/pejabat/' + edit.id, { method: 'PUT', body: edit }) : await api('/pejabat', { method: 'POST', body: edit })
      setEdit(null); load()
    } catch (er) { setErr(er.message) }
  }

  const hapus = async (p) => {
    const yakin = await konfirmasiHapus({
      title: 'Hapus Pejabat?',
      text: `Pejabat "${p.nama}" (${PERAN[p.peran] || p.peran}) akan dihapus.`,
      confirmText: 'Ya, Hapus Pejabat!',
    })
    if (!yakin) return
    try { await api('/pejabat/' + p.id, { method: 'DELETE' }); load() } catch (er) { alert(er.message) }
  }

  const groups = filterPeran ? [filterPeran] : ORDER_PERAN
  const peranOptions = ORDER_PERAN.map((g) => ({ value: g, badge: g, label: PERAN[g] }))

  return (
    <>
      <PageHeader
        kicker="Manajemen Penandatangan"
        title="Pejabat Pengadaan, PPK, Bendahara & Tim"
        desc="Kelola Pejabat Pengadaan, PPK (Pejabat Pembuat Komitmen), PPTK, KPA, Bendahara, dan Verifikator"
      >
        <button
          className="btn-lime"
          onClick={() => setEdit({ nama: '', nip: '', jabatan: '', alamat: 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', peran: filterPeran || 'PENGADAAN', aktif: 1 })}
        >
          <Plus size={16} strokeWidth={2.5} /> Tambah Pejabat
        </button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilterPeran('')}
          className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
            !filterPeran
              ? 'border-2 border-[#122922] bg-[#122922] text-[#d6ee30] shadow-[2px_2px_0_#122922]'
              : 'border border-[#122922]/20 bg-white text-[#122922] hover:bg-[#f7f5ef]'
          }`}
        >
          Semua Peran ({rows.length})
        </button>
        {ORDER_PERAN.map((g) => {
          const cnt = rows.filter((r) => r.peran === g).length
          return (
            <button
              key={g}
              type="button"
              onClick={() => setFilterPeran(g)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                filterPeran === g
                  ? 'border-2 border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[2px_2px_0_#122922]'
                  : 'border border-[#122922]/20 bg-white text-[#122922]/80 hover:bg-[#f7f5ef]'
              }`}
            >
              {PERAN[g]} ({cnt})
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map((g) => {
          const list = rows.filter((r) => r.peran === g)
          if (!list.length) return null
          return (
            <div key={g} className="card overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#122922]/15 bg-[#f7f5ef] px-5 py-3">
                <div className="flex items-center gap-2.5">
                  <span className={`rounded-lg border border-[#122922] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#122922] ${BADGE_PERAN[g] || 'bg-[#d6ee30]'}`}>
                    {g}
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#122922]">{PERAN[g]}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEdit({ nama: '', nip: '', jabatan: '', alamat: 'Jl. R Ngt Tjitrosantjoko No. 10 Gemolong', peran: g, aktif: 1 })}
                  className="text-xs font-bold text-[#1d5a42] hover:underline"
                >
                  + Tambah
                </button>
              </div>
              <ul className="divide-y divide-[#122922]/10">
                {list.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#f7f5ef]/60 transition">
                    <div className={p.aktif ? 'min-w-0 flex-1' : 'min-w-0 flex-1 opacity-40'}>
                      <div className="flex items-center gap-2">
                        <UserCheck size={14} className="shrink-0 text-[#3f8f77]" />
                        <span className="truncate text-sm font-extrabold text-[#122922]">{p.nama}{!p.aktif && ' (nonaktif)'}</span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[#4b5e57]">
                        <span className="font-mono">{p.nip ? 'NIP. ' + p.nip : <span className="text-amber-600 font-semibold">NIP belum diisi</span>}</span>
                        {p.jabatan && <span>· {p.jabatan}</span>}
                      </div>
                      {p.alamat && <div className="mt-0.5 truncate text-[11px] text-[#122922]/55">{p.alamat}</div>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => setEdit(p)} className="rounded-lg border border-[#122922]/20 p-1.5 text-[#122922] hover:bg-[#d6ee30] transition" title="Ubah">
                        <Pencil size={14} />
                      </button>
                      {user?.role === 'admin' && (
                        <button onClick={() => hapus(p)} className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600 transition" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {edit && (
        <Modal open onClose={() => setEdit(null)} title={edit.id ? 'Ubah Data Pejabat' : 'Tambah Pejabat'}>
          <form onSubmit={simpan} className="space-y-3.5">
            <Field label="Peran Pejabat">
              <SearchableSelect
                value={edit.peran}
                options={peranOptions}
                onChange={(v) => setEdit({ ...edit, peran: v })}
                searchPlaceholder="Cari peran pejabat…"
              />
            </Field>
            <Field label="Nama Lengkap (beserta gelar)">
              <input className="input" placeholder="mis. Bekti Nugroho, S.Kom., M.Eng" value={edit.nama} onChange={(e) => setEdit({ ...edit, nama: e.target.value })} />
            </Field>
            <Field label="NIP">
              <input className="input font-mono" placeholder="mis. 19800402 200804 1 001" value={edit.nip || ''} onChange={(e) => setEdit({ ...edit, nip: e.target.value })} />
            </Field>
            <Field label="Jabatan Struktural / Fungsional (untuk BAST & Dokumen)">
              <input className="input" placeholder="mis. Kepala Seksi Informasi dan Pemasaran" value={edit.jabatan || ''} onChange={(e) => setEdit({ ...edit, jabatan: e.target.value })} />
            </Field>
            <Field label="Alamat Instansi / Kantor">
              <input className="input" placeholder="Jl. R Ngt Tjitrosantjoko No. 10 Gemolong" value={edit.alamat || ''} onChange={(e) => setEdit({ ...edit, alamat: e.target.value })} />
            </Field>
            {edit.id && (
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" className="accent-[#122922]" checked={!!edit.aktif} onChange={(e) => setEdit({ ...edit, aktif: e.target.checked ? 1 : 0 })} />
                Aktif
              </label>
            )}
            {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
            <button className="btn-primary w-full">Simpan Pejabat</button>
          </form>
        </Modal>
      )}
    </>
  )
}
