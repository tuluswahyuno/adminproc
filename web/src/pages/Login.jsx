import { useState } from 'react'
import {
  FileText,
  ArrowRight,
  ShieldCheck,
  Award,
  Cloud,
  CheckCircle2,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react'
import { api } from '../lib'

export default function Login({ onLogin }) {
  const [f, setF] = useState({ username: '', password: '' })
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const submit = async (e) => {
    e?.preventDefault()
    setBusy(true)
    setErr('')
    try {
      const user = await api('/login', { method: 'POST', body: f })
      onLogin(user)
    } catch (er) {
      setErr(er.message)
    } finally {
      setBusy(false)
    }
  }

  const fillQuick = (u, p) => {
    setF({ username: u, password: p })
    setErr('')
  }

  return (
    <div className="min-h-screen bg-[#122922] text-[#122922] selection:bg-[#d6ee30] selection:text-[#122922]">
      <div className="grid min-h-screen lg:grid-cols-12">
        {/* ================= SISI KIRI (HERO / STAGE ALA AILENE) ================= */}
        <section className="relative flex flex-col justify-between overflow-hidden bg-[#122922] p-8 text-white sm:p-12 lg:col-span-7 xl:col-span-7 xl:p-16">
          {/* Subtle Ambient Glow & Geometric Shapes ala Ailene */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#d6ee30]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[#3f8f77]/20 blur-3xl" />
          <div className="pointer-events-none absolute right-12 top-24 h-24 w-24 rotate-12 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm" />
          <div className="pointer-events-none absolute bottom-32 left-16 h-16 w-16 -rotate-12 rounded-xl border border-[#d6ee30]/20 bg-[#d6ee30]/5" />

          {/* Top Brand Identity */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border-2 border-[#122922] bg-[#d6ee30] text-[#122922] shadow-[3px_3px_0_#ffffff]">
                <FileText size={22} strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-black tracking-tight text-white">
                    AdminProc<span className="text-[#d6ee30]">.</span>
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[#d6ee30]">
                    v2.0 e-SPJ
                  </span>
                </div>
                <p className="text-[11px] font-semibold tracking-wide text-white/60">
                  RSUD dr. Soeratno Gemolong · Kab. Sragen
                </p>
              </div>
            </div>
          </div>

          {/* Main Copywriting with Ailene mark highlight */}
          <div className="relative z-10 my-auto py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs font-semibold text-[#d6ee30]">
              <Sparkles size={13} />
              <span>Satu Inputan, Otomatis 17 Dokumen Resmi</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-4xl xl:text-5xl">
              Administrasi SPJ <br className="hidden sm:inline" />
              tetap{' '}
              <mark className="inline-block rounded-xl border-2 border-[#122922] bg-[#d6ee30] px-3 py-0.5 text-[#122922] shadow-[4px_4px_0_#ffffff]">
                punya tempat.
              </mark>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
              Mulai dari Spektek/KAK, penetapan HPS, BA Klarifikasi &amp; Negosiasi, SPPBJ, SPK, BAST hingga Kwitansi A2 dan Lembar Verifikasi tersimpan rapi, urut otomatis, dan siap cetak kapan saja.
            </p>

            {/* Ailene-style vibrant tonal sticker pills */}
            <ul className="mt-8 flex flex-wrap gap-2.5" aria-label="Keunggulan sistem">
              <li className="flex items-center gap-2 rounded-full border border-white/20 bg-[#16382e] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#7fd8ff] text-[#122922]">
                  <Cloud size={12} strokeWidth={2.8} />
                </span>
                <span>Pagu RBA Terpantau</span>
              </li>

              <li className="flex items-center gap-2 rounded-full border border-white/20 bg-[#16382e] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#c9ff5c] text-[#122922]">
                  <ShieldCheck size={12} strokeWidth={2.8} />
                </span>
                <span>Tier 0–2jt s.d. 750jt</span>
              </li>

              <li className="flex items-center gap-2 rounded-full border border-white/20 bg-[#16382e] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ffd23f] text-[#122922]">
                  <Award size={12} strokeWidth={2.8} />
                </span>
                <span>Nomor Urut Register Otomatis</span>
              </li>

              <li className="flex items-center gap-2 rounded-full border border-white/20 bg-[#16382e] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:scale-105">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#ff9d6e] text-[#122922]">
                  <FileText size={12} strokeWidth={2.8} />
                </span>
                <span>Export PDF &amp; Word Dinas</span>
              </li>
            </ul>
          </div>

          {/* Bottom Footer Note */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/50">
            <span>Standar Administrasi Pengadaan Barang/Jasa Pemerintah</span>
            <span>BLUD RSUD dr. Soeratno</span>
          </div>
        </section>

        {/* ================= SISI KANAN (FORM PANEL ALA AILENE) ================= */}
        <section className="flex items-center justify-center bg-[#f7f5ef] p-6 sm:p-12 lg:col-span-5 xl:col-span-5">
          <div className="relative w-full max-w-md">
            {/* Distinctive Ailene Washi Tape Detail on top of card */}
            <div className="absolute -top-3.5 left-1/2 z-20 h-7 w-32 -translate-x-1/2 -rotate-1 rounded-sm border border-[#122922]/20 bg-[#d6ee30]/85 shadow-sm" />

            <div className="card-tactile relative z-10 overflow-hidden bg-white p-7 sm:p-9">
              <div className="mb-6">
                <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[#3f8f77]">
                  Satu Akun Buat Lanjut Kerja
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-[#122922] sm:text-3xl">
                  Masuk ke Sistem.
                </h2>
                <p className="mt-1.5 text-xs font-medium leading-relaxed text-[#122922]/65">
                  Masukkan username dan password akun Anda untuk mengelola pengadaan dan mencetak SPJ.
                </p>
              </div>

              {err && (
                <div className="mb-5 flex items-start gap-2.5 rounded-2xl border-2 border-rose-400 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-rose-600" />
                  <p>{err}</p>
                </div>
              )}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1 block font-mono text-xs font-extrabold uppercase text-[#122922]">
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#122922]/50">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder="mis. admin atau tulus"
                      value={f.username}
                      onChange={(e) => setF({ ...f, username: e.target.value })}
                      className="input !pl-10 text-sm font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block font-mono text-xs font-extrabold uppercase text-[#122922]">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#122922]/50">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={f.password}
                      onChange={(e) => setF({ ...f, password: e.target.value })}
                      className="input !pl-10 !pr-10 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#122922]/50 hover:text-[#122922]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="btn-lime w-full !py-3.5 text-sm font-extrabold shadow-[4px_4px_0_#122922] transition hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>{busy ? 'Memeriksa Kredensial…' : 'Masuk Sekarang'}</span>
                  <ArrowRight size={17} strokeWidth={2.5} />
                </button>
              </form>

              {/* Quick Login Chips ala Ailene demo buttons */}
              <div className="mt-6 border-t border-[#122922]/15 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-[#122922]/55">
                    Pilih Akun Cepat (Testing):
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuick('admin', 'admin123')}
                    className="flex flex-col items-start rounded-xl border border-[#122922]/20 bg-[#f7f5ef] p-2 text-left transition hover:border-[#122922] hover:bg-[#d6ee30]/30"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-[#122922]">
                      <CheckCircle2 size={12} className="text-[#3f8f77]" />
                      <span>Admin</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#122922]/60">admin / admin123</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillQuick('tulus', '123456')}
                    className="flex flex-col items-start rounded-xl border border-[#122922]/20 bg-[#f7f5ef] p-2 text-left transition hover:border-[#122922] hover:bg-[#d6ee30]/30"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-black text-[#122922]">
                      <CheckCircle2 size={12} className="text-[#3f8f77]" />
                      <span>Pej. Pengadaan</span>
                    </div>
                    <span className="font-mono text-[10px] text-[#122922]/60">tulus / 123456</span>
                  </button>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-5 text-center text-[10px] text-[#122922]/50">
                Pemerintah Kabupaten Sragen · RSUD dr. Soeratno Gemolong
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
