import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, UserCheck, UserPlus, Users, CheckCircle2, XCircle } from 'lucide-react'
import { api, PERAN, ROLE_LABEL } from '../lib'
import { Empty, Field, Modal, PageHeader, SearchableSelect, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const ROLE_OPTIONS = [
  { value: 'pejabat_pengadaan', badge: 'PENGADAAN', label: 'Pejabat Pengadaan', sub: 'Otomatis penandatangan SP & hanya menampilkan Kode Rekening yang diampu' },
  { value: 'pep', badge: 'PEP', label: 'PEP — Perencanaan & Evaluasi', sub: 'Mengatur Pagu Kode Rekening, Import Template Excel & Penunjukan PP/PPK/PPTK' },
  { value: 'staf', badge: 'STAF', label: 'Staf Administrasi / Pejabat / Tim', sub: 'Mengelola pengadaan, BAST, BAPHP, A2 & Verifikasi' },
  { value: 'admin', badge: 'ADMIN', label: 'Administrator Sistem', sub: 'Akses penuh ke pengaturan, kode rekening, dan manajemen pengguna' },
  { value: 'superuser', badge: 'SUPER', label: 'Super User (Semua Role & Pindah User)', sub: 'Bebas berpindah akun pejabat & mencoba seluruh role di sistem' },
]

const BADGE_ROLE = {
  superuser: 'bg-[#d6ee30] text-[#122922]',
  admin: 'bg-[#f6db5b] text-[#122922]',
  pep: 'bg-[#b7aef3] text-[#122922]',
  pejabat_pengadaan: 'bg-[#b5e8a5] text-[#122922]',
  staf: 'bg-[#a9dcf0] text-[#122922]',
}

function buatUsernameSaran(nama = '') {
  const clean = nama
    .split(',')[0]
    .replace(/^(dr\.|drg\.|ir\.|h\.|hj\.)\s*/i, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
  const parts = clean.split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0]
}

function roleDefaultDariPeran(peran) {
  if (peran === 'PENGADAAN') return 'pejabat_pengadaan'
  if (peran === 'KPA') return 'admin'
  return 'staf'
}

export default function Pengguna() {
  const { user } = useAuth()
  const adm = user?.role === 'admin' || user?.role === 'superuser' || !!user?.is_super
  const [users, setUsers] = useState([])
  const [pejabat, setPejabat] = useState([])
  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const load = () => {
    Promise.all([api('/users'), api('/pejabat')]).then(([u, p]) => {
      setUsers(u)
      setPejabat(p)
    })
  }

  useEffect(() => {
    load()
  }, [])

  // Daftar pejabat yang belum punya akun sistem
  const pejabatBelumPunyaAkun = useMemo(() => {
    const usedIds = new Set(users.map((u) => Number(u.pejabat_id)).filter(Boolean))
    return pejabat.filter((p) => p.aktif && !usedIds.has(Number(p.id)))
  }, [users, pejabat])

  const pejabatOptions = useMemo(
    () =>
      pejabat.map((p) => ({
        value: p.id,
        badge: p.peran,
        label: p.nama,
        sub: `${PERAN[p.peran] || p.peran}${p.nip ? ' · NIP. ' + p.nip : ''}${p.jabatan ? ' · ' + p.jabatan : ''}`,
      })),
    [pejabat]
  )

  const bukaTambahDariPejabat = (p = null) => {
    setErr('')
    if (p) {
      setModal({
        pejabat_id: p.id,
        nama: p.nama,
        username: buatUsernameSaran(p.nama),
        password: '',
        role: roleDefaultDariPeran(p.peran),
        aktif: 1,
      })
    } else {
      setModal({
        pejabat_id: '',
        nama: '',
        username: '',
        password: '',
        role: 'pejabat_pengadaan',
        aktif: 1,
      })
    }
  }

  const pilihPejabatDiModal = (pejabatId) => {
    const p = pejabat.find((x) => String(x.id) === String(pejabatId))
    if (!p) {
      setModal((m) => ({ ...m, pejabat_id: '' }))
      return
    }
    setModal((m) => ({
      ...m,
      pejabat_id: p.id,
      nama: p.nama,
      username: m.id ? m.username : buatUsernameSaran(p.nama),
      role: m.id ? m.role : roleDefaultDariPeran(p.peran),
    }))
  }

  const simpan = async (e) => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (modal.id) {
        await api('/users/' + modal.id, { method: 'PUT', body: modal })
      } else {
        await api('/users', { method: 'POST', body: modal })
      }
      setModal(null)
      load()
    } catch (er) {
      setErr(er.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleAktif = async (u) => {
    await api('/users/' + u.id, { method: 'PUT', body: { ...u, aktif: u.aktif ? 0 : 1 } })
    load()
  }

  const hapus = async (u) => {
    const yakin = await konfirmasiHapus({
      title: 'Hapus Akun Pengguna?',
      text: `Akun "${u.nama}" (@${u.username}) akan dihapus dari sistem.`,
      confirmText: 'Ya, Hapus Akun!',
    })
    if (!yakin) return
    try {
      await api('/users/' + u.id, { method: 'DELETE' })
      load()
    } catch (er) {
      alert(er.message)
    }
  }

  const filtered = useMemo(() => {
    const lq = q.trim().toLowerCase()
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (!lq) return true
      return (
        String(u.nama || '').toLowerCase().includes(lq) ||
        String(u.username || '').toLowerCase().includes(lq) ||
        String(u.pejabat_nip || '').toLowerCase().includes(lq) ||
        String(u.pejabat_jabatan || '').toLowerCase().includes(lq) ||
        String(PERAN[u.pejabat_peran] || '').toLowerCase().includes(lq)
      )
    })
  }, [users, q, roleFilter])

  const roleFilterOptions = [
    { value: '', label: `Semua Hak Akses (${users.length} akun)` },
    ...ROLE_OPTIONS,
  ]

  return (
    <>
      <PageHeader
        kicker="Manajemen Akses & Otorisasi"
        title="Pengguna Sistem (Pejabat & Tim)"
        desc="Kelola akun login pengguna yang terhubung langsung dengan Master Data Pejabat & Tim (Pejabat Pengadaan, PPK, PPTK, KPA, Bendahara, Verifikator, Pengurus Barang)"
      >
        {adm && (
          <button type="button" className="btn-lime" onClick={() => bukaTambahDariPejabat(null)}>
            <Plus size={16} strokeWidth={2.5} /> + Buat Akun dari Pejabat &amp; Tim
          </button>
        )}
      </PageHeader>

      {/* Ringkasan Statistik Pengguna & Pejabat */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Total Akun Sistem</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#122922]">{users.length}</span>
            <span className="rounded-full bg-[#b5e8a5] px-2.5 py-0.5 text-[11px] font-extrabold text-[#122922]">
              {users.filter((u) => u.aktif).length} Aktif
            </span>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Terhubung ke Pejabat &amp; Tim</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#122922]">
              {users.filter((u) => u.pejabat_id).length}
            </span>
            <span className="text-xs font-semibold text-[#122922]/65">dari {pejabat.length} Pejabat</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Akun Pejabat Pengadaan</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#122922]">
              {users.filter((u) => u.role === 'pejabat_pengadaan').length}
            </span>
            <span className="rounded-full bg-[#d6ee30] px-2 py-0.5 font-mono text-[10px] font-extrabold text-[#122922]">Auto-SP</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">Belum Memiliki Akun</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-extrabold text-[#122922]">{pejabatBelumPunyaAkun.length}</span>
            <span className="text-xs font-semibold text-[#122922]/65">Pejabat &amp; Tim</span>
          </div>
        </div>
      </div>

      {/* Daftar Cepat: Pejabat & Tim yang belum punya akun login */}
      {adm && pejabatBelumPunyaAkun.length > 0 && (
        <div className="card mb-6 border-2 border-[#122922] bg-[#f7f5ef] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#122922]">
                <UserPlus size={15} className="text-[#1d5a42]" />
                <span>Aktivasi Cepat dari Data Pejabat &amp; Tim ({pejabatBelumPunyaAkun.length} belum memiliki akun)</span>
              </div>
              <p className="text-xs text-[#122922]/65">Klik tombol <b>+ Buat Akun</b> pada nama pejabat di bawah untuk langsung membuatkan username &amp; password sistem.</p>
            </div>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pejabatBelumPunyaAkun.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#122922]/15 bg-white px-3.5 py-2.5 shadow-2xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded border border-[#122922] bg-[#d6ee30]/70 px-1.5 py-0.2 font-mono text-[9px] font-extrabold text-[#122922]">
                      {p.peran}
                    </span>
                    <span className="truncate text-xs font-extrabold text-[#122922]">{p.nama}</span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-[#122922]/60">
                    {p.nip ? `NIP. ${p.nip}` : PERAN[p.peran] || p.peran}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => bukaTambahDariPejabat(p)}
                  className="shrink-0 rounded-full border border-[#122922] bg-[#d6ee30] px-2.5 py-1 text-[11px] font-extrabold text-[#122922] hover:bg-[#c8e220] cursor-pointer"
                >
                  + Buat Akun
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter & Tabel Pengguna Sistem */}
      <div className="card overflow-visible">
        <div className="grid gap-3 border-b border-[#122922]/12 bg-[#f7f5ef]/70 p-4 rounded-t-2xl md:grid-cols-12">
          <div className="relative md:col-span-7">
            <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
            <input
              className="input !pl-9"
              placeholder="Cari nama pejabat, username, NIP, atau jabatan…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="md:col-span-5">
            <SearchableSelect
              value={roleFilter}
              options={roleFilterOptions}
              placeholder={`Semua Hak Akses (${users.length} akun)`}
              searchPlaceholder="Cari hak akses…"
              allowClear
              onChange={(v) => setRoleFilter(v)}
            />
          </div>
        </div>

        <div className="w-full">
          <table className="tabel-kartu w-full md:table-fixed">
            <thead className="border-b border-[#122922]/15 bg-[#f7f5ef]/50">
              <tr>
                <th className="th w-[26%]">Nama Pengguna &amp; Username</th>
                <th className="th w-[32%]">Data Pejabat &amp; Tim Terhubung</th>
                <th className="th w-[18%]">Role / Hak Akses Sistem</th>
                <th className="th w-[10%] text-center">Status</th>
                <th className="th w-[14%] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#122922]/10">
              {filtered.map((u) => (
                <tr key={u.id} className="transition hover:bg-[#f7f5ef]/60">
                  <td className="td align-middle">
                    <div className={u.aktif ? '' : 'opacity-45'}>
                      <div className="font-extrabold text-[#122922] break-words">{u.nama}</div>
                      <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-[#3f8f77] font-bold">
                        <span>@{u.username}</span>
                        {u.id === user.id && (
                          <span className="rounded bg-[#122922] px-1.5 py-0.2 text-[9px] text-[#d6ee30]">Anda</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="td align-middle">
                    {u.pejabat_id ? (
                      <div className="space-y-0.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded border border-[#122922] bg-[#d6ee30]/70 px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#122922]">
                            {PERAN[u.pejabat_peran] || u.pejabat_peran}
                          </span>
                          <span className="text-xs font-bold text-[#122922]">{u.pejabat_nama || u.nama}</span>
                        </div>
                        <div className="font-mono text-[11px] text-[#122922]/65">
                          {u.pejabat_nip ? `NIP. ${u.pejabat_nip}` : 'NIP belum diisi'}
                          {u.pejabat_jabatan ? ` · ${u.pejabat_jabatan}` : ''}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs italic text-[#122922]/45">Belum ditautkan ke Pejabat &amp; Tim</span>
                    )}
                  </td>

                  <td className="td align-middle">
                    <span className={`inline-flex items-center gap-1 rounded-full border border-[#122922] px-2.5 py-0.5 font-mono text-[11px] font-extrabold ${BADGE_ROLE[u.role] || 'bg-[#f7f5ef]'}`}>
                      <ShieldCheck size={12} />
                      {ROLE_LABEL[u.role] || u.role}
                    </span>
                  </td>

                  <td className="td align-middle text-center">
                    {u.aktif ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#b5e8a5]/70 px-2.5 py-0.5 text-[11px] font-extrabold text-[#122922]">
                        <CheckCircle2 size={12} /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-extrabold text-rose-800">
                        <XCircle size={12} /> Nonaktif
                      </span>
                    )}
                  </td>

                  <td className="td align-middle text-right">
                    {adm && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setErr('')
                            setModal({
                              id: u.id,
                              pejabat_id: u.pejabat_id || '',
                              nama: u.nama,
                              username: u.username,
                              password: '',
                              role: u.role,
                              aktif: u.aktif ? 1 : 0,
                            })
                          }}
                          className="rounded-lg border border-[#122922]/20 p-1.5 text-[#122922] hover:bg-[#d6ee30] cursor-pointer"
                          title="Ubah Pengguna / Reset Password"
                        >
                          <Pencil size={14} />
                        </button>
                        {u.id !== user.id && (
                          <>
                            <button
                              type="button"
                              onClick={() => toggleAktif(u)}
                              className="rounded-lg border border-[#122922]/15 px-2 py-1 text-[10px] font-bold text-[#122922]/70 hover:bg-[#f7f5ef] cursor-pointer"
                            >
                              {u.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                            </button>
                            <button
                              type="button"
                              onClick={() => hapus(u)}
                              className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                              title="Hapus Akun"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <Empty>
              <Users className="mx-auto mb-2 text-[#122922]/40" />
              Tidak ada pengguna sistem yang sesuai pencarian.
            </Empty>
          )}
        </div>
      </div>

      {/* Modal Tambah / Ubah Pengguna (Diambil dari Data Pejabat & Tim) */}
      {modal && (
        <Modal
          open
          onClose={() => setModal(null)}
          title={modal.id ? 'Ubah Akun Pengguna Sistem' : 'Tambah Pengguna Sistem (Dari Data Pejabat & Tim)'}
        >
          <form onSubmit={simpan} className="space-y-3.5">
            <Field
              label="1. Pilih dari Data Pejabat & Tim"
              hint="Memilih pejabat otomatis mengisi Nama Lengkap, saran Username, dan Role"
            >
              <SearchableSelect
                value={modal.pejabat_id || ''}
                options={pejabatOptions}
                placeholder="— Cari & pilih anggota Pejabat / Tim —"
                searchPlaceholder="Ketik nama pejabat, NIP, atau peran (PPK, Pengadaan, PPTK, dll)…"
                allowClear
                onChange={pilihPejabatDiModal}
              />
            </Field>

            <Field label="2. Nama Lengkap Pengguna">
              <input
                className="input"
                value={modal.nama || ''}
                onChange={(e) => setModal({ ...modal, nama: e.target.value })}
                placeholder="mis. Bekti Nugroho, S.Kom., M.Eng"
              />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="3. Username Login">
                <input
                  className="input font-mono"
                  value={modal.username || ''}
                  onChange={(e) => setModal({ ...modal, username: e.target.value })}
                  placeholder="mis. bekti.nugroho"
                />
              </Field>
              <Field
                label={modal.id ? '4. Password Baru (Kosongkan jika tetap)' : '4. Password Login'}
              >
                <input
                  type="password"
                  className="input"
                  value={modal.password || ''}
                  onChange={(e) => setModal({ ...modal, password: e.target.value })}
                  placeholder={modal.id ? '•••••• (opsional)' : 'Minimal 6 karakter'}
                />
              </Field>
            </div>

            <Field label="5. Hak Akses / Role di Sistem">
              <SearchableSelect
                value={modal.role || 'staf'}
                options={ROLE_OPTIONS}
                onChange={(v) => setModal({ ...modal, role: v })}
                searchPlaceholder="Cari hak akses…"
              />
            </Field>

            {modal.id && (
              <label className="flex items-center gap-2 text-sm font-bold text-[#122922]">
                <input
                  type="checkbox"
                  className="accent-[#122922]"
                  checked={!!modal.aktif}
                  onChange={(e) => setModal({ ...modal, aktif: e.target.checked ? 1 : 0 })}
                />
                Akun Pengguna Aktif
              </label>
            )}

            {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
            <button disabled={busy} className="btn-primary w-full">
              <KeyRound size={15} />
              {busy ? 'Menyimpan…' : 'Simpan Akun Pengguna'}
            </button>
          </form>
        </Modal>
      )}
    </>
  )
}
