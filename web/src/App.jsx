import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, NavLink, Navigate, Route, Routes, Link, useNavigate } from 'react-router-dom'
import {
  FileText, LayoutDashboard, ListTree, LogOut, Receipt, Settings,
  Users, Building2, KeyRound, Plus, Sparkles, Menu, X, ChevronRight, ShieldCheck,
  UserCog, Calendar, RefreshCw
} from 'lucide-react'
import { api, ROLE_LABEL, PERAN } from './lib'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Transaksi from './pages/Transaksi'
import TransaksiForm from './pages/TransaksiForm'
import Rekening from './pages/Rekening'
import Pejabat from './pages/Pejabat'
import Penyedia from './pages/Penyedia'
import Pengguna from './pages/Pengguna'
import Pengaturan from './pages/Pengaturan'
import { Modal, Field, SearchableSelect, BuatDokumenMenu } from './ui'

const Auth = createContext(null)
export const useAuth = () => useContext(Auth)

const NAV = [
  { to: '/', label: 'Dashboard', desc: 'Ringkasan & analitik anggaran', icon: LayoutDashboard, end: true },
  { to: '/transaksi', label: 'Dokumen Pengadaan', desc: 'Kelola paket & berkas SPJ', icon: Receipt },
  { to: '/rekening', label: 'Kode Rekening', desc: 'Struktur & pagu anggaran RBA', icon: ListTree },
  { to: '/penyedia', label: 'Data Penyedia', desc: 'Direktori rekanan & perusahaan', icon: Building2 },
  { to: '/pejabat', label: 'Pejabat & Tim', desc: 'Pejabat Pengadaan, PPK & PPTK', icon: Users },
  { to: '/pengguna', label: 'Pengguna Sistem', desc: 'Hak akses & akun pengguna', icon: ShieldCheck },
  { to: '/pengaturan', label: 'Pengaturan', desc: 'Profil & konfigurasi instansi', icon: Settings },
]

function PasswordModal({ open, onClose }) {
  const [f, setF] = useState({ lama: '', baru: '' })
  const [msg, setMsg] = useState('')
  const simpan = async (e) => {
    e.preventDefault()
    try { await api('/password', { method: 'POST', body: f }); setMsg('Password diperbarui'); setF({ lama: '', baru: '' }); setTimeout(onClose, 800) }
    catch (er) { setMsg(er.message) }
  }
  return (
    <Modal open={open} onClose={onClose} title="Ganti Password">
      <form onSubmit={simpan} className="space-y-3.5">
        <Field label="Password lama"><input type="password" className="input" value={f.lama} onChange={(e) => setF({ ...f, lama: e.target.value })} /></Field>
        <Field label="Password baru (min. 6 karakter)"><input type="password" className="input" value={f.baru} onChange={(e) => setF({ ...f, baru: e.target.value })} /></Field>
        {msg && <p className="text-sm font-semibold text-[#3f8f77]">{msg}</p>}
        <button className="btn-primary w-full">Simpan Password</button>
      </form>
    </Modal>
  )
}

function SuperUserModal({ open, onClose, user, onSwitched }) {
  const [data, setData] = useState({ users: [], pejabat: [] })
  const [pejabatId, setPejabatId] = useState(user?.pejabat_id || '')
  const [userId, setUserId] = useState(user?.id || '')
  const [actRole, setActRole] = useState(user?.role || 'superuser')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    api('/superuser/options').then(setData).catch(() => {})
    setPejabatId(user?.pejabat_id || '')
    setUserId(user?.id || '')
    setActRole(user?.role || 'superuser')
  }, [open, user])

  const terapkan = async (payload) => {
    setBusy(true)
    try {
      const nextUser = await api('/superuser/switch', { method: 'POST', body: payload })
      onSwitched(nextUser)
      onClose()
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  const userOpts = data.users.map((u) => ({
    value: u.id,
    badge: u.role.toUpperCase(),
    label: u.nama,
    sub: `@${u.username}${u.pejabat_peran ? ' · ' + (PERAN[u.pejabat_peran] || u.pejabat_peran) : ''}`,
  }))

  const pejabatOpts = data.pejabat.map((p) => ({
    value: p.id,
    badge: p.peran,
    label: p.nama,
    sub: `${PERAN[p.peran] || p.peran}${p.nip ? ' · NIP. ' + p.nip : ''}`,
  }))

  const roleOpts = [
    { value: 'superuser', badge: 'SUPER', label: 'Super User (Akses PenuhSemua Fitur)' },
    { value: 'pejabat_pengadaan', badge: 'PP', label: 'Pejabat Pengadaan (Hanya Rekening yang Diampu)' },
    { value: 'pep', badge: 'PEP', label: 'PEP — Perencanaan & Evaluasi (Atur & Impor Kode Rekening)' },
    { value: 'staf', badge: 'TIM', label: 'Staf / PPK / PPTK (Sesuai Pejabat Terpilih)' },
    { value: 'admin', badge: 'ADMIN', label: 'Administrator Sistem' },
  ]

  return (
    <Modal open={open} onClose={onClose} title="Super User — Simulasi Role & Pindah Pengguna">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#122922]/20 bg-[#d6ee30]/40 p-3 text-xs text-[#122922]">
          <div className="font-extrabold">Mode Pengujian Super User Aktif</div>
          <p className="mt-0.5 text-[#122922]/75">
            Anda dapat berpindah ke akun Pejabat Pengadaan (mis. <b>Tulus Wahyuno</b>), PPK, PPTK, atau mencoba role <b>PEP</b> kapan saja tanpa harus logout.
          </p>
        </div>

        {/* Tombol Pintas Cepat */}
        <div>
          <div className="mb-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#3f8f77]">
            Pintas Cepat Simulasi Role:
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => terapkan({ user_id: user.super_id, act_role: 'superuser' })}
              className="rounded-xl border border-[#122922] bg-[#122922] px-3 py-2 text-left text-xs font-extrabold text-[#d6ee30] hover:opacity-90 cursor-pointer"
            >
              ★ Kembali ke Super User
              <div className="font-mono text-[10px] font-normal text-white/75">Semua Kode Rekening & Menu</div>
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => terapkan({ user_id: user.super_id, act_role: 'pep' })}
              className="rounded-xl border border-[#122922] bg-[#f6db5b] px-3 py-2 text-left text-xs font-extrabold text-[#122922] hover:opacity-90 cursor-pointer"
            >
              Role PEP (Perencanaan)
              <div className="font-mono text-[10px] font-normal text-[#122922]/75">Atur & Impor Kode Rekening</div>
            </button>
          </div>
        </div>

        {/* Pilih langsung dari Daftar Pejabat & Tim */}
        <Field
          label="1. Pindah Sebagai Pejabat / Tim Tertentu (PP, PPK, PPTK, dll)"
          hint="Pilih nama pejabat (contoh: Tulus Wahyuno untuk menguji tampilan Kode Rekening yang diampu PP)"
        >
          <SearchableSelect
            value={pejabatId}
            options={pejabatOpts}
            placeholder="— Cari & pilih Pejabat Pengadaan / PPK / PPTK —"
            searchPlaceholder="Ketik nama pejabat (mis. Tulus, Imas, Bekti)…"
            allowClear
            onChange={(val) => {
              setPejabatId(val)
              const p = data.pejabat.find((x) => String(x.id) === String(val))
              if (p) {
                setUserId('')
                setActRole(p.peran === 'PENGADAAN' ? 'pejabat_pengadaan' : 'staf')
              }
            }}
          />
        </Field>

        {/* Atau pilih dari Akun User yang ada */}
        <Field label="2. Atau Pilih dari Akun Pengguna Terdaftar">
          <SearchableSelect
            value={userId}
            options={userOpts}
            placeholder="— Pilih akun pengguna —"
            searchPlaceholder="Cari username atau nama akun…"
            allowClear
            onChange={(val) => {
              setUserId(val)
              const u = data.users.find((x) => String(x.id) === String(val))
              if (u) {
                setPejabatId(u.pejabat_id || '')
                setActRole(u.role)
              }
            }}
          />
        </Field>

        <Field label="3. Role yang Dijalankan">
          <SearchableSelect
            value={actRole}
            options={roleOpts}
            onChange={setActRole}
            searchPlaceholder="Cari role…"
          />
        </Field>

        <button
          type="button"
          disabled={busy}
          onClick={() => terapkan({ user_id: userId || null, pejabat_id: pejabatId || null, act_role: actRole })}
          className="btn-lime w-full py-2.5"
        >
          <RefreshCw size={15} />
          {busy ? 'Memindahkan Sesi…' : 'Terapkan & Pindah Pengguna / Role'}
        </button>
      </div>
    </Modal>
  )
}

function Layout({ children }) {
  const { user, setUser, tahun, setTahun, tahunList } = useAuth()
  const [pw, setPw] = useState(false)
  const [suOpen, setSuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const nav = useNavigate()
  const keluar = async () => { await api('/logout', { method: 'POST' }); setUser(null); nav('/') }
  const initials = (user.nama || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const SidebarContent = ({ onNavClick }) => (
    <div className="flex h-full flex-col justify-between bg-[#122922] text-white">
      <div className="overflow-y-auto">
        {/* Brand Header */}
        <div className="border-b border-white/10 px-5 py-4">
          <Link to="/" onClick={onNavClick} className="flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-2 border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[3px_3px_0_rgba(255,255,255,0.2)]">
              <FileText size={19} strokeWidth={2.5} />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
                <span>AdminProc</span>
                <span className="rounded-full bg-[#b5e8a5] px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase text-[#122922]">e-SPJ</span>
              </div>
              <div className="mt-0.5 truncate text-[11px] font-medium text-white/65">RSUD dr. Soeratno Gemolong</div>
            </div>
          </Link>

          {/* Pemilih Tahun Anggaran */}
          <div className="mt-3.5 rounded-xl border border-white/15 bg-white/8 px-3 py-2">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#d6ee30]">
              <span className="flex items-center gap-1"><Calendar size={11} /> Tahun Anggaran</span>
              {tahun !== 'semua' && tahun === String(new Date().getFullYear()) && (
                <span className="rounded bg-[#b5e8a5] px-1.5 py-0.2 text-[9px] text-[#122922]">Berjalan</span>
              )}
            </div>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="mt-1 w-full cursor-pointer rounded-lg border border-white/20 bg-[#19382e] px-2.5 py-1.5 font-mono text-xs font-extrabold text-white outline-none focus:border-[#d6ee30]"
            >
              {tahunList.map((th) => (
                <option key={th} value={th}>
                  Tahun {th}{String(th) === String(new Date().getFullYear()) ? ' (Tahun Berjalan)' : ''}
                </option>
              ))}
              <option value="semua">Semua Tahun</option>
            </select>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="px-3 py-3">
          <div className="mb-1.5 px-3 font-mono text-[10px] font-bold uppercase tracking-widest text-white/45">
            Menu Utama
          </div>
          <nav className="space-y-1">
            {NAV.map(({ to, label, desc, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onNavClick}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-2xl px-3.5 py-2 transition duration-150 ${
                    isActive
                      ? 'bg-[#d6ee30] text-[#122922] shadow-[3px_3px_0_#000] font-extrabold'
                      : 'text-white/80 hover:bg-white/10 hover:text-white font-semibold'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition ${isActive ? 'bg-[#122922] text-[#d6ee30]' : 'bg-white/10 text-[#d6ee30]'}`}>
                        <Icon size={15} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 leading-tight">
                        <div className="truncate text-xs font-extrabold">{label}</div>
                        <div className={`truncate text-[10px] ${isActive ? 'text-[#122922]/75 font-semibold' : 'text-white/50'}`}>{desc}</div>
                      </div>
                    </div>
                    <ChevronRight size={14} className={isActive ? 'text-[#122922]' : 'opacity-0 group-hover:opacity-60'} />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom User Card + Super User Switcher */}
      <div className="border-t border-white/10 p-3.5">
        <div className="rounded-2xl border border-white/15 bg-white/8 p-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-[#122922] bg-[#d6ee30] font-mono text-xs font-extrabold text-[#122922]">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-xs font-extrabold text-white">{user.nama}</div>
              <div className="mt-0.5 truncate font-mono text-[10px] font-bold text-[#b5e8a5]">
                {ROLE_LABEL[user.role] || user.role}
              </div>
            </div>
          </div>

          {user.is_super && (
            <button
              type="button"
              onClick={() => setSuOpen(true)}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#122922] bg-[#d6ee30] py-1.5 text-[11px] font-extrabold text-[#122922] shadow-[2px_2px_0_#000] hover:bg-[#e3f842] cursor-pointer"
            >
              <UserCog size={13} /> Pindah User / Role (Super)
            </button>
          )}

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setPw(true)}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/15 bg-white/10 py-1.5 text-[11px] font-bold text-white/85 hover:bg-white/20 cursor-pointer"
            >
              <KeyRound size={12} /> Password
            </button>
            <button
              onClick={keluar}
              className="flex items-center justify-center gap-1 rounded-xl border border-rose-400/30 bg-rose-500/20 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/35 cursor-pointer"
            >
              <LogOut size={12} /> Keluar
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      {/* Desktop Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r-2 border-[#122922] lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setMobileOpen(false)} />
          <div className="relative z-10 w-68 max-w-[82vw]">
            <SidebarContent onNavClick={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/15 p-1.5 text-white"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        {/* Top Banner when impersonating another user in Super User mode */}
        {user.is_super && (user.id !== user.super_id || user.role !== 'superuser') && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#122922] bg-[#d6ee30] px-4 py-2 text-xs font-bold text-[#122922] sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <UserCog size={15} />
              <span>
                Simulasi Super User Aktif: Anda sedang melihat sistem sebagai <b>{user.nama}</b> (Role: <b>{ROLE_LABEL[user.role] || user.role}</b>)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSuOpen(true)}
              className="rounded-full border border-[#122922] bg-white px-3 py-0.5 text-[11px] font-extrabold text-[#122922] hover:bg-[#f7f5ef] cursor-pointer"
            >
              Ganti User / Role →
            </button>
          </div>
        )}

        {/* Mobile Top Bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-[#122922]/15 bg-[#f7f5ef]/95 px-4 backdrop-blur-md lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-xl border border-[#122922] bg-white p-2 text-[#122922]">
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2 font-extrabold text-[#122922]">
            <span>AdminProc</span>
            <span className="rounded-full bg-[#d6ee30] px-2 py-0.5 font-mono text-[10px]">TA {tahun}</span>
          </div>
          <BuatDokumenMenu label="Buat" className="btn-lime !px-3 !py-1.5 text-xs" />
        </header>

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full">{children}</div>
        </main>

        <footer className="mt-auto border-t border-[#122922]/15 bg-[#f7f5ef] px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#122922]/70">
            <div className="flex items-center gap-2 font-bold text-[#122922]">
              <Sparkles size={14} className="text-[#3f8f77]" />
              <span>Sistem Pengadaan &amp; SPJ Terpadu · RSUD dr. Soeratno Gemolong · Tahun Anggaran {tahun === 'semua' ? 'Semua Tahun' : tahun}</span>
            </div>
          </div>
        </footer>
      </div>

      <PasswordModal open={pw} onClose={() => setPw(false)} />
      <SuperUserModal open={suOpen} onClose={() => setSuOpen(false)} user={user} onSwitched={setUser} />
    </div>
  )
}

export default function App() {
  const curYear = String(new Date().getFullYear())
  const [user, setUser] = useState(undefined)
  const [tahun, setTahun] = useState(() => {
    const saved = localStorage.getItem('spj_tahun')
    if (saved && saved !== 'semua' && Number(saved) > Number(curYear)) return curYear
    return saved || curYear
  })
  const [tahunList, setTahunList] = useState(['2026', '2025'])

  useEffect(() => {
    api('/me').then(setUser).catch(() => setUser(null))
  }, [])

  useEffect(() => {
    if (!user) return
    api('/tahun-list').then((r) => {
      if (r.list?.length) {
        const validYears = r.list.filter((y) => Number(y) <= Number(curYear)).sort((a, b) => b.localeCompare(a))
        setTahunList(validYears.length ? validYears : ['2026', '2025'])
      }
      if (!localStorage.getItem('spj_tahun') && r.tahunAktif) {
        setTahun(r.tahunAktif)
      }
    }).catch(() => {})
  }, [user, curYear])

  const ubahTahun = (th) => {
    localStorage.setItem('spj_tahun', th)
    setTahun(th)
  }

  if (user === undefined) return null
  if (!user) return <Login onLogin={setUser} />
  return (
    <Auth.Provider value={{ user, setUser, tahun, setTahun: ubahTahun, tahunList }}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transaksi" element={<Transaksi />} />
            <Route path="/transaksi/baru" element={<TransaksiForm />} />
            <Route path="/transaksi/:id" element={<TransaksiForm />} />
            <Route path="/rekening" element={<Rekening />} />
            <Route path="/penyedia" element={<Penyedia />} />
            <Route path="/pejabat" element={<Pejabat />} />
            <Route path="/pengguna" element={<Pengguna />} />
            <Route path="/pengaturan" element={<Pengaturan />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </Auth.Provider>
  )
}
