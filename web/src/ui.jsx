import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, FileCheck2, FileText, Info, Layers, Package, Plus, Receipt, Search, Sparkles, X } from 'lucide-react'
import Swal from 'sweetalert2'
import 'sweetalert2/dist/sweetalert2.min.css'
import { kategoriByKode } from './lib'

/**
 * konfirmasiHapus — SweetAlert dialog konfirmasi hapus data yang elegan & selaras dengan tema tactile
 */
export async function konfirmasiHapus({
  title = 'Hapus data ini?',
  text = 'Data yang dihapus tidak dapat dipulihkan kembali.',
  confirmText = 'Ya, Hapus!',
  confirmButtonText,
} = {}) {
  const btnText = confirmButtonText || confirmText || 'Ya, Hapus!'
  const res = await Swal.fire({
    title,
    text,
    icon: 'warning',
    iconColor: '#e11d48',
    showCancelButton: true,
    confirmButtonText: btnText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    background: '#ffffff',
    color: '#122922',
    customClass: {
      popup: 'swal2-tactile-popup rounded-3xl border-2 border-[#122922] shadow-[6px_6px_0_#122922] p-6',
      title: 'text-lg font-black text-[#122922] tracking-tight',
      htmlContainer: 'text-xs font-semibold text-[#122922]/70',
      actions: 'gap-2.5 mt-4',
      confirmButton: 'rounded-xl border border-rose-700 bg-rose-600 px-4 py-2 font-mono text-xs font-extrabold text-white shadow-sm hover:bg-rose-700 transition cursor-pointer',
      cancelButton: 'rounded-xl border border-[#122922]/20 bg-[#f7f5ef] px-4 py-2 font-mono text-xs font-extrabold text-[#122922] hover:bg-white transition cursor-pointer',
    },
    buttonsStyling: false,
  })
  return !!res.isConfirmed
}

/**
 * BuatDokumenMenu — Dropdown/Modal Pemilih Kategori Paket Pengadaan (A2 Saja, 0-2 Jt, 2-10 Jt, 10-50 Jt, 50-750 Jt)
 */
export function BuatDokumenMenu({
  label = 'Buat Dokumen Pengadaan',
  className = 'btn-lime',
  align = 'right',
  fullWidth = false,
  onSelectDone,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const go = (url) => {
    setOpen(false)
    if (onSelectDone) onSelectDone()
    nav(url)
  }

  const tiers = [
    { label: 'A2 + Verifikasi saja', url: '/transaksi/baru?mode=langsung', icon: Receipt },
    { label: '0–2jt dan 2–10jt', url: '/transaksi/baru', icon: Package },
    { label: '10–50jt', url: '/transaksi/baru?mode=10_50', icon: FileText },
    { label: '50–750jt', url: '/transaksi/baru?mode=50_750', icon: Layers },
  ]

  return (
    <div className={`relative ${fullWidth ? 'w-full' : 'inline-block'}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${className} ${fullWidth ? 'w-full justify-between' : ''} cursor-pointer`}
      >
        <span className="inline-flex items-center gap-1.5">
          <Plus size={16} strokeWidth={2.5} />
          <span>{label}</span>
        </span>
        <ChevronDown size={14} className={`transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className={`card absolute z-50 mt-1.5 w-60 overflow-hidden border-2 border-[#122922] bg-white p-1.5 shadow-[5px_5px_0_#122922] ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="space-y-1">
            {tiers.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => go(t.url)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-extrabold text-[#122922] transition hover:bg-[#d6ee30] cursor-pointer"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-[#122922]/20 bg-[#f7f5ef] text-[#122922]">
                    <Icon size={14} />
                  </div>
                  <span className="truncate">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return
    const h = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#062319]/60 p-4 backdrop-blur-sm sm:p-10" onMouseDown={onClose}>
      <div className={`card w-full ${wide ? 'max-w-5xl' : 'max-w-lg'} overflow-visible border-2 border-[#122922] shadow-[8px_8px_0_#122922]`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between rounded-t-2xl border-b border-[#122922]/15 bg-[#f7f5ef] px-5 py-3.5">
          <h3 className="text-base font-extrabold tracking-tight text-[#122922]">{title}</h3>
          <button onClick={onClose} className="rounded-full border border-[#122922]/20 bg-white p-1.5 text-[#122922] transition hover:bg-[#d6ee30]"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export const Field = ({ label, children, className = '', hint }) => (
  <div className={`block ${className}`}>
    {label && <span className="label">{label}</span>}
    {children}
    {hint && <span className="mt-1 block text-[11px] text-[#122922]/55">{hint}</span>}
  </div>
)

/**
 * SearchableSelect — Dropdown modern dengan kotak pencarian di dalamnya
 * options: [{ value, label, sub, badge }]
 */
export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = '— Pilih —',
  searchPlaceholder = 'Ketik untuk mencari…',
  disabled = false,
  className = '',
  allowClear = false,
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const selected = useMemo(
    () => options.find((o) => String(o.value) === String(value ?? '')),
    [options, value]
  )

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return options
    return options.filter(
      (o) =>
        String(o.label || '').toLowerCase().includes(s) ||
        String(o.sub || '').toLowerCase().includes(s) ||
        String(o.badge || '').toLowerCase().includes(s)
    )
  }, [options, q])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((o) => !o)
            setQ('')
          }
        }}
        className={`input flex items-center justify-between gap-2 text-left ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="min-w-0 flex-1 truncate">
          {selected ? (
            <span className="flex items-center gap-2 truncate">
              {selected.badge && (
                <span className="shrink-0 rounded bg-[#d6ee30]/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#122922]">
                  {selected.badge}
                </span>
              )}
              <span className="truncate font-semibold text-[#122922]">{selected.label}</span>
            </span>
          ) : (
            <span className="text-[#122922]/45">{placeholder}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {allowClear && selected && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange('')
              }}
              className="rounded-full p-0.5 text-[#122922]/45 hover:bg-[#122922]/10 hover:text-[#122922]"
              title="Reset"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={15} className={`text-[#122922]/55 transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="card absolute left-0 right-0 z-40 mt-1.5 min-w-60 overflow-hidden border-2 border-[#122922] bg-white shadow-[6px_6px_0_#122922]">
          <div className="relative border-b border-[#122922]/12 bg-[#f7f5ef] p-2">
            <Search size={14} className="absolute left-4.5 top-4.5 text-[#122922]/45" />
            <input
              autoFocus
              type="text"
              className="w-full rounded-lg border border-[#122922]/20 bg-white py-1.5 pl-8 pr-3 text-xs font-semibold text-[#122922] outline-none focus:border-[#122922]"
              placeholder={searchPlaceholder}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-[#122922]/6 py-1">
            {filtered.map((o) => {
              const isSel = String(o.value) === String(value ?? '')
              return (
                <li key={String(o.value)}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value, o)
                      setOpen(false)
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-xs transition ${
                      isSel ? 'bg-[#d6ee30]/55 font-extrabold text-[#122922]' : 'hover:bg-[#f7f5ef] text-[#122922]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {o.badge && (
                          <span className="shrink-0 rounded border border-[#122922]/20 bg-[#f7f5ef] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#3f8f77]">
                            {o.badge}
                          </span>
                        )}
                        <span className="truncate font-bold">{o.label}</span>
                      </div>
                      {o.sub && <div className="mt-0.5 truncate font-mono text-[10px] text-[#122922]/60">{o.sub}</div>}
                    </div>
                    {isSel && <Check size={14} className="shrink-0 text-[#122922]" />}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-5 text-center text-xs text-[#122922]/45">Tidak ditemukan hasil pencarian</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export function PageHeader({ title, desc, kicker, children }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && (
          <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full border border-[#122922]/20 bg-[#d6ee30]/70 px-3 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[#122922]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#122922]" />
            {kicker}
          </div>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-[#122922] sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm font-medium text-[#122922]/65">{desc}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2.5">{children}</div>
    </div>
  )
}

export const KategoriBadge = ({ kode }) => {
  const k = kategoriByKode(kode)
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ring-1 ring-inset ${k.tone}`}>
      {k.label}
    </span>
  )
}

export const Empty = ({ children }) => (
  <div className="px-4 py-14 text-center text-sm font-medium text-[#122922]/50">{children}</div>
)

export function Progress({ value }) {
  const v = Math.min(100, Math.max(0, value))
  const c = value > 100 ? 'bg-[#f06859]' : v > 85 ? 'bg-[#ffd23f]' : 'bg-[#3f8f77]'
  return (
    <div className="h-2 w-full overflow-hidden rounded-full border border-[#122922]/15 bg-[#f7f5ef]">
      <div className={`h-full rounded-full transition-all duration-300 ${c}`} style={{ width: v + '%' }} />
    </div>
  )
}
