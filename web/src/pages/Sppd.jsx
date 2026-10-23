import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownUp, Bus, CalendarDays, ChevronDown, ChevronRight, Copy, Download, FileSpreadsheet, Hotel, Pencil, Plane, Plus, Search, Trash2, Users, X } from 'lucide-react'
import { api, num, persen, rp, tgl } from '../lib'
import { Empty, Field, Modal, PageHeader, Progress, konfirmasiHapus } from '../ui'
import { useAuth } from '../App'

const JENIS = {
  luar: { label: 'Luar Daerah', ikon: Plane, tarif: { 'ASN': [0, 50], 'NON ASN': [0, 100] } },
  dalam: { label: 'Dalam Daerah', ikon: Bus, tarif: { 'ASN': [75000, 50], 'NON ASN': [50000, 40] } },
}

/* ---------- utilitas ---------- */
const BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const tglPanjang = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '')
  return m ? `${m[3]} ${BLN[Number(m[2]) - 1]} ${m[1]}` : ''
}
const selisihHari = (a, b) => {
  const x = Date.parse(a), y = Date.parse(b)
  return Number.isNaN(x) || Number.isNaN(y) ? 1 : Math.max(1, Math.round((y - x) / 86400000) + 1)
}
// angka atau rumus sederhana: "43000+38500", "270000*2", "370000*50%"; titik = pemisah ribuan, koma = desimal
function hitungRumus(teks) {
  const s = String(teks ?? '').trim()
  if (!s) return 0
  if (!/^[0-9+\-*/().,%\s]+$/.test(s)) return null
  const e = s.replace(/\./g, '').replace(/,/g, '.').replace(/(\d+(?:\.\d+)?)%/g, '($1/100)')
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict"; return (${e})`)()
    return Number.isFinite(v) ? Math.round(v) : null
  } catch { return null }
}
const rumusAdaOperator = (s) => /[+\-*/%]/.test(String(s).replace(/^\s*-/, ''))

function InputRupiah({ value, onChange, placeholder = '0', rumus = true, className = '' }) {
  const [teks, setTeks] = useState(value ? num(value) : '')
  const [fokus, setFokus] = useState(false)
  useEffect(() => { if (!fokus) setTeks(value ? num(value) : '') }, [value, fokus])
  const hasil = hitungRumus(teks)
  const tampilHasil = fokus && rumus && rumusAdaOperator(teks) && hasil !== null
  return (
    <div className="relative">
      <input
        inputMode={rumus ? 'text' : 'numeric'}
        className={`input text-right font-mono tabular-nums ${hasil === null ? '!border-rose-400' : ''} ${className}`}
        value={teks}
        placeholder={placeholder}
        onFocus={(e) => { setFokus(true); setTeks(value ? String(value) : ''); e.target.select() }}
        onBlur={() => { setFokus(false); if (hasil !== null) onChange(Math.max(0, hasil)) }}
        onChange={(e) => {
          const v = rumus ? e.target.value : e.target.value.replace(/[^\d]/g, '')
          setTeks(v)
          const h = hitungRumus(v)
          if (h !== null) onChange(Math.max(0, h))
        }}
      />
      {tampilHasil && <div className="pointer-events-none absolute -bottom-5 right-1 z-10 rounded bg-[#122922] px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">= {rp(hasil)}</div>}
    </div>
  )
}

const modaKosong = () => ({ moda: '', maskapai: '', booking: '', tiket: '', penerbangan: '', plat: '', travel: '', tiket_travel: '', harga: 0 })
const hotelKosong = () => ({ nama: '', alamat: '', malam: 0, harga: 0 })
const orangKosong = (jenis, los = 1) => ({
  nama: '', status: 'ASN', los, losManual: false,
  uh_tarif: JENIS[jenis].tarif.ASN[0], uh_persen: JENIS[jenis].tarif.ASN[1], uh_index: 0,
  dk_tarif: 0, dk_persen: 50, dk_hari: 0, dk_total: 0,
  bbm: 0, etol: 0, penginapan: 0, transport_pp: 0, transport_lokal: 0, kontribusi: 0, no_rek: '',
  ber: modaKosong(), pul: modaKosong(), hotel: hotelKosong(),
})
const dariBaris = (r, losKeg) => ({
  ...orangKosong('luar'), ...r, losManual: r.los !== losKeg,
  ber: { ...modaKosong(), ...(r.detail?.ber || {}) }, pul: { ...modaKosong(), ...(r.detail?.pul || {}) }, hotel: { ...hotelKosong(), ...(r.detail?.hotel || {}) },
})

const hitungItem = (f) => {
  const index = f.uh_tarif > 0 ? Math.round((f.uh_tarif * f.uh_persen) / 100) : Math.round(f.uh_index || 0)
  const diklat = f.dk_tarif > 0 ? Math.round((f.dk_tarif * f.dk_persen) / 100) * (f.dk_hari || 0) : Math.round(f.dk_total || 0)
  const uh = index * (f.los || 0)
  const jumlah = uh + diklat + (f.bbm || 0) + (f.etol || 0) + (f.penginapan || 0) + (f.transport_pp || 0) + (f.transport_lokal || 0) + (f.kontribusi || 0)
  return { index, diklat, uh, jumlah }
}

// peserta berurutan dengan tanggal, tujuan, dan acara yang sama = satu kegiatan (sama seperti sel gabungan pada Excel)
const kunciKegiatan = (i) => [i.tgl_berangkat, i.tgl_kembali, i.tujuan, i.acara].join('|')
const kelompokkan = (items) => {
  const out = []
  for (const i of items) {
    const g = out[out.length - 1]
    if (g && g.kunci === kunciKegiatan(i)) g.orang.push(i)
    else out.push({ kunci: kunciKegiatan(i), orang: [i] })
  }
  return out
}

function UnduhMenu({ href, luar, label = 'Excel', kecil }) {
  const [buka, setBuka] = useState(false)
  const sambung = (v) => `${href}${href.includes('?') ? '&' : '?'}versi=${v}`
  if (!luar) {
    return <a href={href} title="Unduh Excel" className={kecil ? 'rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30]' : 'btn-ghost'}>{kecil ? <Download size={15} /> : <><FileSpreadsheet size={16} /> {label}</>}</a>
  }
  return (
    <div className="relative">
      <button type="button" title="Unduh Excel" onClick={() => setBuka((v) => !v)} className={kecil ? 'rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30]' : 'btn-ghost'}>
        {kecil ? <Download size={15} /> : <><FileSpreadsheet size={16} /> {label} <ChevronDown size={14} /></>}
      </button>
      {buka && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setBuka(false)} />
          <div className="absolute right-0 z-30 mt-1.5 w-72 overflow-hidden rounded-xl border-2 border-[#122922] bg-white shadow-[4px_4px_0_#122922]">
            <a href={sambung('ringkas')} onClick={() => setBuka(false)} className="block px-3.5 py-2.5 text-left text-sm hover:bg-[#d6ee30]/60">
              <div className="font-extrabold">Versi ringkas</div><div className="text-xs text-[#122922]/65">Sampai kolom JUMLAH + tanda tangan PPK</div>
            </a>
            <a href={sambung('lengkap')} onClick={() => setBuka(false)} className="block border-t border-[#122922]/15 px-3.5 py-2.5 text-left text-sm hover:bg-[#d6ee30]/60">
              <div className="font-extrabold">Versi lengkap</div><div className="text-xs text-[#122922]/65">Ditambah kode booking, tiket kereta/pesawat, dan hotel</div>
            </a>
          </div>
        </>
      )}
    </div>
  )
}

/* ---------- modal: periode ---------- */
function PeriodeModal({ data, jenis, tahun, rekening, wajibRekening, onClose, onSaved, onDihapus }) {
  const [f, setF] = useState(data)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const u = (k, v) => setF((x) => ({ ...x, [k]: v }))
  const simpan = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      const body = { ...f, jenis, tahun }
      const r = f.id ? await api('/sppd/' + f.id, { method: 'PUT', body }) : await api('/sppd', { method: 'POST', body })
      onSaved(f.id || r.id)
      onClose()
    } catch (er) { setErr(er.message) } finally { setBusy(false) }
  }
  const hapus = async () => {
    if (!(await konfirmasiHapus({ title: 'Hapus periode rekap ini?', text: `Seluruh ${data.jml || 0} perjalanan pada periode ini ikut terhapus dan realisasi rekening berkurang.`, confirmText: 'Ya, hapus periode' }))) return
    try { await api('/sppd/' + f.id, { method: 'DELETE' }); onDihapus(); onClose() } catch (er) { setErr(er.message) }
  }
  return (
    <Modal open onClose={onClose} title={f.id ? 'Ubah Periode Rekap' : `Periode Rekap Baru · ${JENIS[jenis].label}`}>
      <form onSubmit={simpan} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Periode mulai"><input type="date" className="input" value={f.tgl_mulai || ''} onChange={(e) => setF((x) => ({ ...x, tgl_mulai: e.target.value }))} required /></Field>
          <Field label="Periode selesai"><input type="date" className="input" value={f.tgl_selesai || ''} onChange={(e) => setF((x) => ({ ...x, tgl_selesai: e.target.value, tgl_ttd: !x.tgl_ttd || x.tgl_ttd === x.tgl_selesai ? e.target.value : x.tgl_ttd }))} required /></Field>
        </div>
        <Field label="Tanggal tanda tangan PPK" hint="Tercetak di bawah rekap: “Sragen, …”. Biasanya sama dengan akhir periode.">
          <input type="date" className="input" value={f.tgl_ttd || ''} onChange={(e) => u('tgl_ttd', e.target.value)} />
        </Field>
        <Field label="Kode rekening" hint="Total rekap ini menjadi realisasi rekening (mengurangi sisa anggaran). PPK pada tanda tangan mengikuti PPK rekening.">
          <select className="input" value={f.rekening_id || ''} onChange={(e) => u('rekening_id', e.target.value ? Number(e.target.value) : null)} required={wajibRekening}>
            <option value="">— belum dihubungkan —</option>
            {rekening.map((r) => <option key={r.id} value={r.id}>{r.kode} · {r.uraian}</option>)}
          </select>
        </Field>
        <Field label="Tulisan “BULAN :” di judul (opsional)" hint="Kosongkan agar otomatis dari periode, mis. 02 Januari sd 28 Februari 2026">
          <input className="input" value={f.label || ''} onChange={(e) => u('label', e.target.value)} placeholder="02 Januari sd 28 Februari 2026" />
        </Field>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <div className="flex gap-2">
          {f.id && <button type="button" className="btn-ghost !text-rose-600" onClick={hapus}><Trash2 size={15} /> Hapus</button>}
          <button className="btn-primary flex-1" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Periode'}</button>
        </div>
      </form>
    </Modal>
  )
}

/* ---------- armada ---------- */
const MODA = [['', '— tidak ada —'], ['pesawat_kereta', 'Pesawat / Kereta'], ['mobil', 'Mobil kantor / dinas'], ['travel_bis', 'Travel / Bis']]
// bersama = hanya isian yang sama untuk satu rombongan (tanpa kode booking, nomor tiket, harga)
function BlokModa({ judul, v, onChange, bersama }) {
  const s = (k) => (e) => onChange({ ...v, [k]: e.target.value })
  return (
    <div className="space-y-2.5 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">{judul}</div>
        <select className="input !w-auto !py-1.5 text-xs" value={v.moda} onChange={s('moda')}>{MODA.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      </div>
      {v.moda === 'pesawat_kereta' && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Maskapai / Kereta"><input className="input" value={v.maskapai} onChange={s('maskapai')} /></Field>
          <Field label="Kode penerbangan / KA"><input className="input" value={v.penerbangan} onChange={s('penerbangan')} /></Field>
          {!bersama && <Field label="Kode booking"><input className="input font-mono" value={v.booking} onChange={s('booking')} /></Field>}
          {!bersama && <Field label="Nomor tiket"><input className="input font-mono" value={v.tiket} onChange={s('tiket')} /></Field>}
        </div>
      )}
      {v.moda === 'mobil' && <Field label="No. plat mobil"><input className="input" value={v.plat} onChange={s('plat')} /></Field>}
      {v.moda === 'travel_bis' && (
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Nama travel / bis"><input className="input" value={v.travel} onChange={s('travel')} /></Field>
          {!bersama && <Field label="Nomor tiket"><input className="input font-mono" value={v.tiket_travel} onChange={s('tiket_travel')} /></Field>}
        </div>
      )}
      {!bersama && v.moda && v.moda !== 'mobil' && (
        <Field label="Harga tiket (Rp)" hint="Keterangan saja — biaya yang dihitung ada di kolom Transport PP."><InputRupiah value={v.harga} onChange={(x) => onChange({ ...v, harga: x })} /></Field>
      )}
    </div>
  )
}
// isian uang harian & diklat yang sama untuk satu rombongan
const FIELD_TARIF = ['uh_tarif', 'uh_persen', 'uh_index', 'dk_tarif', 'dk_persen', 'dk_hari', 'dk_total']
const ambilTarif = (o) => Object.fromEntries(FIELD_TARIF.map((k) => [k, o[k]]))
const samaTarif = (o, t) => FIELD_TARIF.every((k) => Number(o[k]) === Number(t[k]))
const untukStatus = (untuk, status) => untuk === 'semua' || untuk === status
const SALIN_BERSAMA = ['moda', 'maskapai', 'penerbangan', 'plat', 'travel']
const terapkanBersama = (target, sumber) => ({ ...target, ...Object.fromEntries(SALIN_BERSAMA.map((k) => [k, sumber[k]])) })

/* ---------- modal: satu kegiatan (satu atau banyak peserta) ---------- */
function KegiatanModal({ awal, jenis, rekap, pegawai, onClose, onSaved }) {
  const luar = jenis === 'luar'
  const lama = awal.orang
  const k0 = lama[0]
  const [keg, setKeg] = useState(() => ({
    tgl_berangkat: k0?.tgl_berangkat || rekap.tgl_mulai || '', tgl_kembali: k0?.tgl_kembali || k0?.tgl_berangkat || rekap.tgl_mulai || '',
    los: k0 ? Math.max(...lama.map((o) => o.los)) : 1, losManual: !!k0 && k0.los !== selisihHari(k0.tgl_berangkat, k0.tgl_kembali),
    tujuan: k0?.tujuan || '', acara: k0?.acara || '',
  }))
  const [bersama, setBersama] = useState(() => ({ ber: k0 ? { ...modaKosong(), ...k0.detail?.ber } : modaKosong(), pul: k0 ? { ...modaKosong(), ...k0.detail?.pul } : modaKosong(), hotel: k0 ? { ...hotelKosong(), ...k0.detail?.hotel } : hotelKosong() }))
  const [orang, setOrang] = useState(() => {
    if (lama.length) return lama.map((r) => ({ ...dariBaris(r, Math.max(...lama.map((o) => o.los))), buka: awal.fokusId === r.id || (lama.length === 1) }))
    return [{ ...orangKosong(jenis, 1), buka: true }]
  })
  const [hapus, setHapus] = useState([])
  const [tarifB, setTarifB] = useState(() => ({ ...ambilTarif(k0 || orangKosong(jenis)), untuk: 'semua', diklatBuka: !!(k0 && (k0.dk_tarif || k0.dk_total)) }))
  const [infoTarif, setInfoTarif] = useState('')
  const [tempel, setTempel] = useState(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const setK = (p) => setKeg((x) => {
    const n = { ...x, ...p }
    if (!n.losManual && ('tgl_berangkat' in p || 'tgl_kembali' in p)) n.los = selisihHari(n.tgl_berangkat, n.tgl_kembali)
    if (n.los !== x.los) setOrang((os) => os.map((o) => (o.losManual ? o : { ...o, los: n.los })))
    return n
  })
  const setO = (idx, p) => setOrang((os) => os.map((o, i) => (i === idx ? { ...o, ...p } : o)))
  const defaultTarif = (st) => JENIS[jenis].tarif[st]
  const gantiStatus = (idx, st) => {
    const o = orang[idx]
    const [t, p] = defaultTarif(st)
    setO(idx, { status: st, ...(o.uh_tarif === 0 || o.uh_tarif === defaultTarif(o.status)[0] ? { uh_tarif: t, uh_persen: p } : {}) })
  }
  const isiNama = (idx, nama) => {
    const p = pegawai.find((x) => x.nama.toLowerCase() === nama.toLowerCase())
    if (p && p.status !== orang[idx].status) gantiStatus(idx, p.status)
    setO(idx, { nama })
  }
  // mengubah isian rombongan langsung ikut ke peserta yang tarifnya masih sama dengan isian sebelumnya (belum diubah sendiri)
  const setT = (p) => {
    const lama = tarifB
    const baru = { ...lama, ...p }
    setTarifB(baru)
    setInfoTarif('')
    setOrang((os) => os.map((o) => (untukStatus(baru.untuk, o.status) && samaTarif(o, lama) ? { ...o, ...ambilTarif(baru) } : o)))
  }
  const terapkanTarif = () => {
    const kena = orang.filter((o) => untukStatus(tarifB.untuk, o.status)).length
    setOrang((os) => os.map((o) => (untukStatus(tarifB.untuk, o.status) ? { ...o, ...ambilTarif(tarifB), ...(tarifB.dk_tarif > 0 || tarifB.dk_total > 0 ? { diklatBuka: true } : {}) } : o)))
    setInfoTarif(kena ? `Diterapkan ke ${kena} peserta${tarifB.untuk === 'semua' ? '' : ' ' + tarifB.untuk}` : 'Tidak ada peserta dengan status itu')
  }
  const indexB = tarifB.uh_tarif > 0 ? Math.round((tarifB.uh_tarif * tarifB.uh_persen) / 100) : Math.round(tarifB.uh_index || 0)
  const diklatB = tarifB.dk_tarif > 0 ? Math.round((tarifB.dk_tarif * tarifB.dk_persen) / 100) * (tarifB.dk_hari || 0) : Math.round(tarifB.dk_total || 0)
  // peserta baru: salinan peserta terakhir (tarif, armada, hotel) tanpa nama dan nomor yang berbeda tiap orang
  const turunan = (sumber) => ({
    ...sumber, ...(untukStatus(tarifB.untuk, sumber.status) ? ambilTarif(tarifB) : {}), id: undefined, nama: '', losManual: false, los: keg.los, buka: true,
    ber: terapkanBersama({ ...sumber.ber, booking: '', tiket: '', tiket_travel: '' }, bersama.ber),
    pul: terapkanBersama({ ...sumber.pul, booking: '', tiket: '', tiket_travel: '' }, bersama.pul),
    hotel: { ...sumber.hotel, nama: bersama.hotel.nama, alamat: bersama.hotel.alamat, malam: bersama.hotel.malam },
  })
  const tambahOrang = () => setOrang((os) => [...os.map((o) => ({ ...o, buka: false })), turunan(os[os.length - 1] || orangKosong(jenis, keg.los))])
  const tambahBanyak = () => {
    const baris = (tempel || '').split('\n').map((x) => x.trim()).filter(Boolean)
    if (!baris.length) { setTempel(null); return }
    setOrang((os) => {
      let dasar = os[os.length - 1] || orangKosong(jenis, keg.los)
      const kosong = os.length === 1 && !os[0].nama.trim()
      const baru = baris.map((b) => {
        const [nama, st] = b.split(/[;|\t]/).map((x) => x.trim())
        const status = /non/i.test(st || '') ? 'NON ASN' : (pegawai.find((x) => x.nama.toLowerCase() === nama.toLowerCase())?.status || 'ASN')
        const [t, p] = defaultTarif(status)
        const o = { ...turunan(dasar), nama, status, buka: false, ...(dasar.uh_tarif === defaultTarif(dasar.status)[0] || dasar.uh_tarif === 0 ? { uh_tarif: t, uh_persen: p } : {}) }
        dasar = o
        return o
      })
      return [...(kosong ? [] : os.map((o) => ({ ...o, buka: false }))), ...baru]
    })
    setTempel(null)
  }
  const hapusOrang = (idx) => {
    const o = orang[idx]
    if (o.id) setHapus((h) => [...h, o.id])
    setOrang((os) => (os.length === 1 ? [{ ...orangKosong(jenis, keg.los), buka: true }] : os.filter((_, i) => i !== idx)))
  }
  const terapkanSemua = () => setOrang((os) => os.map((o) => ({
    ...o, ber: terapkanBersama(o.ber, bersama.ber), pul: terapkanBersama(o.pul, bersama.pul),
    hotel: { ...o.hotel, nama: bersama.hotel.nama, alamat: bersama.hotel.alamat, malam: bersama.hotel.malam },
  })))
  const total = useMemo(() => orang.reduce((s, o) => s + hitungItem(o).jumlah, 0), [orang])

  const simpan = async (e) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const sisa = orang.filter((o) => o.nama.trim())
      if (!sisa.length && !hapus.length) throw new Error('Isi nama minimal satu peserta')
      const items = sisa.map((o) => {
        const h = hitungItem(o)
        const { buka, losManual, detail, detail_json, ...isi } = o
        return { ...isi, uh_index: h.index, dk_total: h.diklat }
      })
      const hapusLain = orang.filter((o) => o.id && !o.nama.trim()).map((o) => o.id)
      await api(`/sppd/${rekap.id}/kegiatan`, { method: 'POST', body: { kegiatan: { tgl_berangkat: keg.tgl_berangkat, tgl_kembali: keg.tgl_kembali, tujuan: keg.tujuan, acara: keg.acara }, items, hapus: [...hapus, ...hapusLain] } })
      onSaved(); onClose()
    } catch (er) { setErr(er.message) } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} title={lama.length ? `Ubah Kegiatan · ${JENIS[jenis].label}` : `Kegiatan Baru · ${JENIS[jenis].label}`} wide>
      <form onSubmit={simpan} className="space-y-4">
        <div className="space-y-3 rounded-2xl border border-[#122922]/15 p-3.5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">Kegiatan <span className="font-semibold normal-case tracking-normal text-[#122922]/50">(sama untuk seluruh peserta)</span></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Tanggal berangkat"><input type="date" className="input" value={keg.tgl_berangkat} onChange={(e) => setK({ tgl_berangkat: e.target.value, tgl_kembali: !keg.tgl_kembali || keg.tgl_kembali < e.target.value || keg.tgl_kembali === keg.tgl_berangkat ? e.target.value : keg.tgl_kembali })} required /></Field>
            <Field label="Tanggal kembali"><input type="date" className="input" min={keg.tgl_berangkat} value={keg.tgl_kembali} onChange={(e) => setK({ tgl_kembali: e.target.value })} /></Field>
            <Field label="LOS (hari)" hint={keg.losManual ? 'diisi manual' : 'otomatis dari tanggal'}>
              <input type="number" min="1" className="input text-center font-mono font-bold" value={keg.los} onChange={(e) => setK({ los: Number(e.target.value) || 0, losManual: true })} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tujuan"><input className="input" value={keg.tujuan} onChange={(e) => setK({ tujuan: e.target.value })} placeholder="mis. Aula Pemda Terpadu Kabupaten Sragen" /></Field>
            <Field label="Acara"><textarea rows={2} className="input" value={keg.acara} onChange={(e) => setK({ acara: e.target.value })} placeholder="mis. Sosialisasi Aplikasi Srikandi" /></Field>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#122922]/15 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">Uang harian & diklat rombongan <span className="font-semibold normal-case tracking-normal text-[#122922]/50">(sama untuk peserta; berubah otomatis di peserta yang belum diubah sendiri)</span></div>
            <div className="flex items-center gap-2">
              <select className="input !w-auto !py-1.5 text-xs" value={tarifB.untuk} onChange={(e) => setTarifB((t) => ({ ...t, untuk: e.target.value }))} title="Berlaku untuk">
                <option value="semua">Semua peserta</option><option value="ASN">Hanya ASN</option><option value="NON ASN">Hanya NON ASN</option>
              </select>
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={terapkanTarif}><Copy size={13} /> Terapkan ke peserta</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Tarif uang harian / hari (Rp)"><InputRupiah rumus={false} value={tarifB.uh_tarif} onChange={(v) => setT({ uh_tarif: v })} /></Field>
            <Field label="Persentase (%)"><input type="number" min="0" max="100" step="any" className="input text-right font-mono" value={tarifB.uh_persen} onChange={(e) => setT({ uh_persen: Number(e.target.value) || 0 })} /></Field>
            <Field label="Index / hari" hint={tarifB.uh_tarif > 0 ? 'tarif × persen' : 'isi langsung bila tanpa tarif'}>
              {tarifB.uh_tarif > 0 ? <div className="input bg-[#f7f5ef] text-right font-mono font-bold">{num(indexB)}</div> : <InputRupiah rumus={false} value={tarifB.uh_index} onChange={(v) => setT({ uh_index: v })} />}
            </Field>
            <Field label={`Uang harian × ${keg.los} hari`}><div className="input bg-[#f7f5ef] text-right font-mono font-extrabold">{num(indexB * (keg.los || 0))}</div></Field>
          </div>
          {tarifB.diklatBuka || tarifB.dk_tarif > 0 || tarifB.dk_total > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Tarif diklat / hari (Rp)"><InputRupiah rumus={false} value={tarifB.dk_tarif} onChange={(v) => setT({ dk_tarif: v })} /></Field>
              <Field label="Persentase (%)"><input type="number" min="0" max="100" step="any" className="input text-right font-mono" value={tarifB.dk_persen} onChange={(e) => setT({ dk_persen: Number(e.target.value) || 0 })} /></Field>
              <Field label="Jumlah hari"><input type="number" min="0" className="input text-center font-mono" value={tarifB.dk_hari} onChange={(e) => setT({ dk_hari: Number(e.target.value) || 0 })} /></Field>
              <Field label="Total uang harian diklat" hint={tarifB.dk_tarif > 0 ? 'tarif × % × hari' : 'isi langsung bila tanpa tarif'}>
                {tarifB.dk_tarif > 0 ? <div className="input bg-[#f7f5ef] text-right font-mono font-bold">{num(diklatB)}</div> : <InputRupiah rumus={false} value={tarifB.dk_total} onChange={(v) => setT({ dk_total: v })} />}
              </Field>
            </div>
          ) : <button type="button" className="text-xs font-bold text-[#1d5a42] hover:underline" onClick={() => setTarifB((t) => ({ ...t, diklatBuka: true }))}>+ Tambah uang harian diklat</button>}
          {infoTarif && <p className="text-xs font-bold text-[#1d5a42]">✓ {infoTarif}</p>}
        </div>

        {luar && (
          <div className="space-y-3 rounded-2xl border border-[#122922]/15 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">Armada & hotel rombongan <span className="font-semibold normal-case tracking-normal text-[#122922]/50">(isian yang sama; kode booking & nomor tiket per orang)</span></div>
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={terapkanSemua}><Copy size={13} /> Terapkan ke semua peserta</button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <BlokModa judul="Berangkat" v={bersama.ber} bersama onChange={(v) => setBersama((b) => ({ ...b, ber: v }))} />
              <BlokModa judul="Pulang" v={bersama.pul} bersama onChange={(v) => setBersama((b) => ({ ...b, pul: v }))} />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Field label="Nama hotel"><input className="input" value={bersama.hotel.nama} onChange={(e) => setBersama((b) => ({ ...b, hotel: { ...b.hotel, nama: e.target.value } }))} /></Field>
              <Field label="Alamat hotel"><input className="input" value={bersama.hotel.alamat} onChange={(e) => setBersama((b) => ({ ...b, hotel: { ...b.hotel, alamat: e.target.value } }))} /></Field>
              <Field label="Lama menginap (malam)"><input type="number" min="0" className="input text-center font-mono" value={bersama.hotel.malam} onChange={(e) => setBersama((b) => ({ ...b, hotel: { ...b.hotel, malam: Number(e.target.value) || 0 } }))} /></Field>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#122922]/70"><Users size={14} /> Peserta ({orang.length})</div>
            <div className="flex gap-2">
              <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setTempel(tempel === null ? '' : null)}>Tempel banyak nama</button>
              <button type="button" className="btn-lime !py-1.5 !text-xs" onClick={tambahOrang}><Plus size={14} /> Tambah peserta</button>
            </div>
          </div>
          {tempel !== null && (
            <div className="space-y-2 rounded-xl border border-[#122922]/20 bg-[#f7f5ef] p-3">
              <p className="text-xs text-[#122922]/70">Satu nama per baris. Boleh ditambah status: <span className="font-mono">Nama; NON ASN</span>. Tarif dan isian lain disalin dari peserta terakhir.</p>
              <textarea rows={5} className="input font-mono text-xs" value={tempel} onChange={(e) => setTempel(e.target.value)} placeholder={'dr. KINIK DARSONO, M.Pd.Ked\nSri Lestari\nSUMARNO'} autoFocus />
              <div className="flex gap-2"><button type="button" className="btn-primary !py-1.5 !text-xs" onClick={tambahBanyak}>Tambahkan</button><button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setTempel(null)}>Batal</button></div>
            </div>
          )}
          {orang.map((o, idx) => {
            const h = hitungItem(o)
            return (
              <div key={o.id || `b${idx}`} className="overflow-hidden rounded-2xl border-[1.5px] border-[#122922]/25 bg-white">
                <div className="flex flex-wrap items-center gap-2 bg-[#f7f5ef] px-3 py-2">
                  <button type="button" onClick={() => setO(idx, { buka: !o.buka })} className="text-[#122922]/60">{o.buka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>
                  <span className="w-5 text-center font-mono text-xs font-bold text-[#122922]/50">{idx + 1}</span>
                  <input className="input !py-1.5 min-w-48 flex-1" list="daftar-pegawai" value={o.nama} onChange={(e) => isiNama(idx, e.target.value)} placeholder="Nama pegawai" autoFocus={!o.id && idx === orang.length - 1 && !o.nama} />
                  <div className="flex overflow-hidden rounded-lg border border-[#122922]/25">
                    {['ASN', 'NON ASN'].map((s) => <button type="button" key={s} onClick={() => gantiStatus(idx, s)} className={`px-2.5 py-1.5 text-xs font-bold ${o.status === s ? 'bg-[#122922] text-white' : 'bg-white hover:bg-[#d6ee30]/50'}`}>{s}</button>)}
                  </div>
                  <span className="min-w-28 text-right font-mono text-sm font-extrabold tabular-nums">{rp(h.jumlah)}</span>
                  <button type="button" title="Hapus peserta" onClick={() => hapusOrang(idx)} className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600"><X size={15} /></button>
                </div>
                {o.buka && (
                  <div className="space-y-3.5 p-3.5">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      <Field label="Tarif / hari (Rp)"><InputRupiah rumus={false} value={o.uh_tarif} onChange={(v) => setO(idx, { uh_tarif: v })} /></Field>
                      <Field label="Persen (%)"><input type="number" min="0" max="100" step="any" className="input text-right font-mono" value={o.uh_persen} onChange={(e) => setO(idx, { uh_persen: Number(e.target.value) || 0 })} /></Field>
                      <Field label="Index / hari" hint={o.uh_tarif > 0 ? 'tarif × persen' : 'isi langsung'}>
                        {o.uh_tarif > 0 ? <div className="input bg-[#f7f5ef] text-right font-mono font-bold">{num(h.index)}</div> : <InputRupiah rumus={false} value={o.uh_index} onChange={(v) => setO(idx, { uh_index: v })} />}
                      </Field>
                      <Field label="LOS" hint={o.losManual ? 'beda dari kegiatan' : 'ikut kegiatan'}><input type="number" min="1" className="input text-center font-mono font-bold" value={o.los} onChange={(e) => setO(idx, { los: Number(e.target.value) || 0, losManual: Number(e.target.value) !== keg.los })} /></Field>
                      <Field label="Uang harian"><div className="input bg-[#f7f5ef] text-right font-mono font-extrabold">{num(h.uh)}</div></Field>
                    </div>
                    {(o.dk_tarif > 0 || o.dk_total > 0 || o.dk_hari > 0 || o.diklatBuka) ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Field label="Tarif diklat / hari"><InputRupiah rumus={false} value={o.dk_tarif} onChange={(v) => setO(idx, { dk_tarif: v })} /></Field>
                        <Field label="Persen (%)"><input type="number" min="0" max="100" step="any" className="input text-right font-mono" value={o.dk_persen} onChange={(e) => setO(idx, { dk_persen: Number(e.target.value) || 0 })} /></Field>
                        <Field label="Jumlah hari"><input type="number" min="0" className="input text-center font-mono" value={o.dk_hari} onChange={(e) => setO(idx, { dk_hari: Number(e.target.value) || 0 })} /></Field>
                        <Field label="Total uang harian diklat" hint={o.dk_tarif > 0 ? 'tarif × % × hari' : 'isi langsung'}>
                          {o.dk_tarif > 0 ? <div className="input bg-[#f7f5ef] text-right font-mono font-bold">{num(h.diklat)}</div> : <InputRupiah rumus={false} value={o.dk_total} onChange={(v) => setO(idx, { dk_total: v })} />}
                        </Field>
                      </div>
                    ) : <button type="button" className="text-xs font-bold text-[#1d5a42] hover:underline" onClick={() => setO(idx, { diklatBuka: true })}>+ Tambah uang harian diklat</button>}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-2 sm:grid-cols-3">
                      <Field label="BBM"><InputRupiah value={o.bbm} onChange={(v) => setO(idx, { bbm: v })} /></Field>
                      <Field label="e-Toll"><InputRupiah value={o.etol} onChange={(v) => setO(idx, { etol: v })} /></Field>
                      <Field label="Penginapan"><InputRupiah value={o.penginapan} onChange={(v) => setO(idx, { penginapan: v })} /></Field>
                      <Field label="Transport PP"><InputRupiah value={o.transport_pp} onChange={(v) => setO(idx, { transport_pp: v })} /></Field>
                      <Field label="Transport lokal"><InputRupiah value={o.transport_lokal} onChange={(v) => setO(idx, { transport_lokal: v })} /></Field>
                      <Field label="Kontribusi"><InputRupiah value={o.kontribusi} onChange={(v) => setO(idx, { kontribusi: v })} /></Field>
                    </div>
                    <p className="-mt-3 text-[11px] text-[#122922]/50">Kolom biaya boleh berupa rumus, mis. 43000+38500</p>
                    {!luar && <Field label="No. rekening penerima (opsional)"><input className="input font-mono" value={o.no_rek} onChange={(e) => setO(idx, { no_rek: e.target.value })} /></Field>}
                    {luar && (
                      <div className="space-y-3 rounded-xl border border-[#122922]/15 p-3">
                        <div className="text-xs font-extrabold uppercase tracking-wider text-[#122922]/70">Rincian pemeriksaan peserta ini</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <BlokModa judul="Berangkat" v={o.ber} onChange={(v) => setO(idx, { ber: v })} />
                          <BlokModa judul="Pulang" v={o.pul} onChange={(v) => setO(idx, { pul: v })} />
                        </div>
                        {(o.ber.harga || 0) + (o.pul.harga || 0) > 0 && o.transport_pp !== (o.ber.harga || 0) + (o.pul.harga || 0) && (
                          <button type="button" className="text-xs font-bold text-[#1d5a42] hover:underline" onClick={() => setO(idx, { transport_pp: (o.ber.harga || 0) + (o.pul.harga || 0) })}>Isi Transport PP = harga tiket berangkat + pulang ({rp((o.ber.harga || 0) + (o.pul.harga || 0))})</button>
                        )}
                        <div className="space-y-2.5 rounded-xl border border-[#122922]/15 bg-[#f7f5ef]/60 p-3">
                          <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#122922]/70"><Hotel size={13} /> Hotel peserta ini</div>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            <Field label="Nama hotel"><input className="input" value={o.hotel.nama} onChange={(e) => setO(idx, { hotel: { ...o.hotel, nama: e.target.value } })} /></Field>
                            <Field label="Alamat"><input className="input" value={o.hotel.alamat} onChange={(e) => setO(idx, { hotel: { ...o.hotel, alamat: e.target.value } })} /></Field>
                            <Field label="Lama menginap (malam)"><input type="number" min="0" className="input text-center font-mono" value={o.hotel.malam} onChange={(e) => setO(idx, { hotel: { ...o.hotel, malam: Number(e.target.value) || 0 } })} /></Field>
                            <Field label="Harga hotel (Rp)" hint="Keterangan saja — biaya dihitung dari kolom Penginapan."><InputRupiah value={o.hotel.harga} onChange={(v) => setO(idx, { hotel: { ...o.hotel, harga: v } })} /></Field>
                          </div>
                          {o.hotel.harga > 0 && o.penginapan !== o.hotel.harga && <button type="button" className="text-xs font-bold text-[#1d5a42] hover:underline" onClick={() => setO(idx, { penginapan: o.hotel.harga })}>Isi Penginapan = harga hotel ({rp(o.hotel.harga)})</button>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
          <datalist id="daftar-pegawai">{pegawai.map((p) => <option key={p.nama + p.status} value={p.nama} />)}</datalist>
        </div>

        <div className="flex items-center justify-between rounded-xl border-2 border-[#122922] bg-[#d6ee30]/70 px-4 py-3">
          <span className="text-xs font-extrabold uppercase tracking-wider">Jumlah kegiatan · {orang.filter((o) => o.nama.trim()).length} peserta</span>
          <span className="font-mono text-xl font-extrabold tabular-nums">{rp(total)}</span>
        </div>
        {err && <p className="text-sm font-semibold text-rose-600">{err}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan Kegiatan'}</button>
      </form>
    </Modal>
  )
}

/* ---------- satu periode (tabel) ---------- */
function Periode({ ringkas, jenis, terbuka, onToggle, onEdit, onChanged, pegawai, q }) {
  const [data, setData] = useState(null)
  const [modal, setModal] = useState(null)
  const muat = useCallback(() => api('/sppd/' + ringkas.id).then(setData), [ringkas.id])
  useEffect(() => { if (terbuka) muat() }, [terbuka, muat, ringkas.total, ringkas.jml])
  const berubah = () => { muat(); onChanged() }
  const hapusKegiatan = async (g) => {
    if (!(await konfirmasiHapus({ title: 'Hapus kegiatan ini?', text: `${g.orang.length} peserta — ${g.orang[0].acara || g.orang[0].tujuan || tglPanjang(g.orang[0].tgl_berangkat)}`, confirmText: 'Ya, Hapus' }))) return
    await api(`/sppd/${ringkas.id}/kegiatan`, { method: 'POST', body: { kegiatan: {}, items: [], hapus: g.orang.map((o) => o.id) } }); berubah()
  }
  const hapusOrang = async (g, o) => {
    if (!(await konfirmasiHapus({ title: 'Hapus peserta ini?', text: `${o.nama} — ${tglPanjang(o.tgl_berangkat)}`, confirmText: 'Ya, Hapus' }))) return
    await api(`/sppd/${ringkas.id}/kegiatan`, { method: 'POST', body: { kegiatan: {}, items: [], hapus: [o.id] } }); berubah()
  }
  const urutkan = async () => { await api(`/sppd/${ringkas.id}/urutkan`, { method: 'POST' }); berubah() }
  const cari = q.trim().toLowerCase()
  const grup = useMemo(() => kelompokkan(data?.items || [])
    .map((g) => ({ ...g, tampil: cari ? g.orang.filter((o) => `${o.nama} ${o.tujuan} ${o.acara}`.toLowerCase().includes(cari)) : g.orang }))
    .filter((g) => g.tampil.length), [data, cari])
  const label = ringkas.label || (data?.label_otomatis) || `${tglPanjang(ringkas.tgl_mulai)} sd ${tglPanjang(ringkas.tgl_selesai)}`
  let no = 0
  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {terbuka ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-[#122922]">BULAN : {label.replace(/^BULAN\s*:\s*/i, '')}</div>
            <div className="truncate text-xs text-[#122922]/60">
              {ringkas.jml} perjalanan · tanda tangan {tglPanjang(ringkas.tgl_ttd || ringkas.tgl_selesai)}
              {ringkas.rek_kode ? ` · ${ringkas.rek_kode}` : ' · rekening belum dihubungkan'}
            </div>
          </div>
        </button>
        <div className="font-mono text-base font-extrabold tabular-nums">{rp(ringkas.total)}</div>
        <div className="flex items-center gap-1">
          <UnduhMenu href={`/api/sppd/${ringkas.id}/excel`} luar={jenis === 'luar'} kecil />
          <button title="Ubah periode" onClick={onEdit} className="rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30]"><Pencil size={15} /></button>
        </div>
      </div>

      {terbuka && (
        <div className="border-t border-[#122922]/12">
          <div className="flex flex-wrap items-center gap-2 bg-[#f7f5ef]/70 px-4 py-2.5">
            <button className="btn-lime !py-1.5 !text-xs" onClick={() => setModal({ orang: [] })}><Plus size={14} /> Tambah Kegiatan / Perjalanan</button>
            {data?.items?.length > 1 && <button className="btn-ghost !py-1.5 !text-xs" onClick={urutkan}><ArrowDownUp size={13} /> Urutkan menurut tanggal</button>}
            {data && !data.rekening && <span className="text-xs font-bold text-amber-700">Rekening belum dihubungkan — realisasi anggaran belum terpengaruh. Ubah periode untuk memilih rekening.</span>}
            {data?.ppk && <span className="ml-auto text-xs text-[#122922]/60">PPK: <b>{data.ppk.nama}</b></span>}
          </div>
          {/* ponsel: kartu per kegiatan & peserta */}
          <div className="md:hidden">
            {grup.map((g) => {
              const k = g.orang[0]
              return (
                <div key={'m' + k.id} className="border-t-2 border-[#122922]/20 first:border-t-0">
                  <div className="bg-[#eaf3dd] px-3.5 py-2.5">
                    <div className="text-xs font-extrabold text-[#122922]">{tgl(k.tgl_berangkat)}{k.tgl_kembali && k.tgl_kembali !== k.tgl_berangkat ? ` s.d ${tgl(k.tgl_kembali)}` : ''} · {k.tujuan || '—'}</div>
                    {k.acara && <div className="mt-0.5 line-clamp-2 text-xs text-[#122922]/75">{k.acara}</div>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#122922]/70">{g.orang.length} orang · <span className="font-mono text-[#122922]">{rp(g.orang.reduce((x, o) => x + o.jumlah, 0))}</span></span>
                      <div className="flex gap-1.5">
                        <button title="Ubah kegiatan / tambah peserta" onClick={() => setModal({ orang: g.orang })} className="rounded-lg border border-[#122922]/25 bg-white p-2 active:bg-[#d6ee30]"><Pencil size={15} /></button>
                        <button title="Hapus kegiatan" onClick={() => hapusKegiatan(g)} className="rounded-lg border border-[#122922]/25 bg-white p-2 text-rose-600"><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                  {g.tampil.map((o) => (
                    <div key={o.id} className="flex items-start gap-2 border-t border-[#122922]/10 px-3.5 py-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold leading-snug">{o.nama} <span className={`ml-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${o.status === 'ASN' ? 'bg-[#b5e8a5]' : 'bg-[#f6db5b]'}`}>{o.status}</span></div>
                        <div className="mt-0.5 text-[11px] text-[#122922]/60">LOS {o.los} hari · uang harian {num(o.uh_total + o.dk_total)}{o.jumlah - o.uh_total - o.dk_total > 0 ? ` · biaya lain ${num(o.jumlah - o.uh_total - o.dk_total)}` : ''}</div>
                        {jenis === 'luar' && (o.detail.hotel.nama || o.detail.ber.booking || o.detail.ber.tiket) && (
                          <div className="mt-0.5 text-[10px] text-[#122922]/55">{[o.detail.ber.booking && `booking ${o.detail.ber.booking}`, o.detail.hotel.nama && `hotel ${o.detail.hotel.nama}`].filter(Boolean).join(' · ')}</div>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-mono text-sm font-extrabold tabular-nums">{num(o.jumlah)}</div>
                        <div className="mt-1 flex justify-end gap-1.5">
                          <button title="Ubah peserta" onClick={() => setModal({ orang: g.orang, fokusId: o.id })} className="rounded-lg border border-[#122922]/25 p-2 active:bg-[#d6ee30]"><Pencil size={14} /></button>
                          <button title="Hapus peserta" onClick={() => hapusOrang(g, o)} className="rounded-lg p-2 text-[#122922]/50"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
            {data && (
              <div className="flex items-center justify-between border-t-2 border-[#122922] bg-[#f7f5ef] px-3.5 py-3 text-sm font-extrabold">
                <span>JUMLAH{cari ? ' (seluruh periode)' : ''}</span><span className="font-mono tabular-nums">{rp(data.total)}</span>
              </div>
            )}
            {data && !grup.length && <Empty>{cari ? 'Tidak ada baris yang cocok.' : 'Belum ada perjalanan pada periode ini.'}</Empty>}
            {!data && <div className="p-6 text-center text-sm text-[#122922]/50">Memuat…</div>}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-[#122922]/12 bg-[#f7f5ef]/40">
                <tr>
                  <th className="th w-10">No</th><th className="th">Nama</th><th className="th text-center">LOS</th>
                  <th className="th text-right">Uang harian</th><th className="th text-right">Biaya lain</th><th className="th text-right">Jumlah</th><th className="th w-20" />
                </tr>
              </thead>
              <tbody>
                {grup.map((g) => {
                  const k = g.orang[0]
                  const sub = g.orang.reduce((s, o) => s + o.jumlah, 0)
                  return [
                    <tr key={'h' + k.id} className="border-t-2 border-[#122922]/20 bg-[#eaf3dd]">
                      <td className="td" colSpan={4}>
                        <div className="text-xs font-extrabold text-[#122922]">{tgl(k.tgl_berangkat)}{k.tgl_kembali && k.tgl_kembali !== k.tgl_berangkat ? ` s.d ${tgl(k.tgl_kembali)}` : ''} · {k.tujuan || '—'}</div>
                        <div className="line-clamp-2 text-xs text-[#122922]/75" title={k.acara}>{k.acara}</div>
                      </td>
                      <td className="td text-right text-xs font-bold text-[#122922]/70">{g.orang.length} orang</td>
                      <td className="td text-right font-mono font-extrabold tabular-nums">{num(sub)}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button title="Ubah kegiatan / tambah peserta" onClick={() => setModal({ orang: g.orang })} className="rounded-lg border border-[#122922]/20 bg-white p-1.5 hover:bg-[#d6ee30]"><Pencil size={13} /></button>
                          <button title="Hapus kegiatan" onClick={() => hapusKegiatan(g)} className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>,
                    ...g.tampil.map((o) => (
                      <tr key={o.id} className="border-t border-[#122922]/10 align-top hover:bg-[#f7f5ef]/60">
                        <td className="td text-center text-xs text-[#122922]/50">{++no}</td>
                        <td className="td">
                          <div className="font-bold">{o.nama} <span className={`ml-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${o.status === 'ASN' ? 'bg-[#b5e8a5]' : 'bg-[#f6db5b]'}`}>{o.status}</span></div>
                          {jenis === 'luar' && (o.detail.hotel.nama || o.detail.ber.booking || o.detail.ber.tiket) && (
                            <div className="mt-0.5 text-[10px] text-[#122922]/55">{[o.detail.ber.booking && `booking ${o.detail.ber.booking}`, o.detail.hotel.nama && `hotel ${o.detail.hotel.nama}`].filter(Boolean).join(' · ')}</div>
                          )}
                        </td>
                        <td className="td text-center font-mono">{o.los}</td>
                        <td className="td text-right font-mono text-xs tabular-nums">{num(o.uh_total + o.dk_total)}</td>
                        <td className="td text-right font-mono text-xs tabular-nums">{num(o.jumlah - o.uh_total - o.dk_total)}</td>
                        <td className="td text-right font-mono font-extrabold tabular-nums">{num(o.jumlah)}</td>
                        <td className="td">
                          <div className="flex justify-end gap-1">
                            <button title="Ubah peserta" onClick={() => setModal({ orang: g.orang, fokusId: o.id })} className="rounded-lg border border-[#122922]/20 p-1.5 hover:bg-[#d6ee30]"><Pencil size={13} /></button>
                            <button title="Hapus peserta" onClick={() => hapusOrang(g, o)} className="rounded-lg p-1.5 text-[#122922]/45 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    )),
                  ]
                })}
                {data && (
                  <tr className="border-t-2 border-[#122922] bg-[#f7f5ef] font-extrabold">
                    <td className="td" colSpan={5}>JUMLAH{cari ? ' (seluruh periode)' : ''}</td>
                    <td className="td text-right font-mono tabular-nums">{num(data.total)}</td>
                    <td className="td" />
                  </tr>
                )}
              </tbody>
            </table>
            {data && !grup.length && <Empty>{cari ? 'Tidak ada baris yang cocok.' : 'Belum ada perjalanan pada periode ini.'}</Empty>}
            {!data && <div className="p-6 text-center text-sm text-[#122922]/50">Memuat…</div>}
          </div>
        </div>
      )}
      {modal && <KegiatanModal key={modal.orang[0]?.id || 'baru'} awal={modal} jenis={jenis} rekap={ringkas} pegawai={pegawai} onClose={() => setModal(null)} onSaved={berubah} />}
    </div>
  )
}

/* ---------- halaman ---------- */
export default function Sppd() {
  const { user, tahun: tahunGlobal, tahunList } = useAuth()
  const [params, setParams] = useSearchParams()
  const [akses, setAkses] = useState(null)
  const bolehJenis = Object.keys(JENIS).filter((k) => akses?.[k])
  const jenis = bolehJenis.includes(params.get('jenis')) ? params.get('jenis') : (bolehJenis[0] || 'dalam')
  const [tahun, setTahun] = useState(tahunGlobal && tahunGlobal !== 'semua' ? tahunGlobal : String(new Date().getFullYear()))
  const penuh = ['admin', 'superuser'].includes(user?.role)
  const [daftar, setDaftar] = useState(null)
  const [rekening, setRekening] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [buka, setBuka] = useState(null)
  const [modal, setModal] = useState(null)
  const [q, setQ] = useState('')
  const [galat, setGalat] = useState('')

  useEffect(() => { api('/sppd/akses').then(setAkses).catch(() => setAkses({})) }, [user?.id, user?.role, user?.pejabat_id])
  const muat = useCallback(() => {
    if (!bolehJenis.includes(jenis)) return Promise.resolve()
    return Promise.all([api(`/sppd?jenis=${jenis}&tahun=${tahun}`), api(`/sppd/ringkasan?jenis=${jenis}&tahun=${tahun}`)])
      .then(([d, r]) => { setDaftar(d.items); setRekening([...r].sort((a, b) => Number(b.cocok) - Number(a.cocok))); setGalat('') })
      .catch((e) => { setDaftar([]); setGalat(e.status === 404 ? 'Server belum diperbarui. Restart server (npm start) agar menu Rekap SPPD aktif.' : e.message) })
  }, [jenis, tahun, akses]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setDaftar(null); setBuka(null); muat() }, [muat])
  useEffect(() => { if (bolehJenis.length) api('/sppd/pegawai').then(setPegawai).catch(() => {}) }, [akses]) // eslint-disable-line react-hooks/exhaustive-deps

  if (akses && !bolehJenis.length) {
    return (
      <div className="card mx-auto mt-10 max-w-lg p-8 text-center">
        <div className="text-lg font-extrabold">Rekap SPPD tidak tersedia untuk akun ini</div>
        <p className="mt-2 text-sm text-[#122922]/70">Menu ini hanya untuk Administrator dan Pejabat Pengadaan yang mengampu kode rekening Perjalanan Dinas Dalam / Luar Daerah.</p>
      </div>
    )
  }

  const total = (daftar || []).reduce((s, d) => s + d.total, 0)
  const jmlPerjalanan = (daftar || []).reduce((s, d) => s + d.jml, 0)
  const rekUtama = rekening.find((r) => r.cocok) || rekening[0]
  const tahunOpsi = [...new Set([...(tahunList || []), tahun])].sort().reverse()
  const J = JENIS[jenis]

  const periodeBaru = () => {
    const terakhir = (daftar || []).at(-1)
    const mulai = terakhir ? new Date(Date.parse(terakhir.tgl_selesai) + 86400000).toISOString().slice(0, 10) : `${tahun}-01-01`
    setModal({ tgl_mulai: mulai, tgl_selesai: '', tgl_ttd: '', label: '', rekening_id: rekUtama?.id || null })
  }

  return (
    <>
      <PageHeader kicker={`Rekap Periodik · Tahun ${tahun}`} title="Rekap SPPD" desc="Rekap belanja perjalanan dinas per periode — satu orang atau rombongan — terhubung ke kode rekening perjalanan dinas">
        <select className="input !w-auto !py-2 font-mono text-sm font-extrabold" value={tahun} onChange={(e) => setTahun(e.target.value)}>
          {tahunOpsi.map((t) => <option key={t} value={t}>Tahun {t}</option>)}
        </select>
        <UnduhMenu href={`/api/sppd/excel?jenis=${jenis}&tahun=${tahun}`} luar={jenis === 'luar'} label="Excel Setahun" />
        <button className="btn-lime" onClick={periodeBaru}><Plus size={16} strokeWidth={2.5} /> Periode Baru</button>
      </PageHeader>

      <div className="mb-5 inline-flex rounded-xl border-2 border-[#122922] bg-white p-1">
        {bolehJenis.map((k) => {
          const v = JENIS[k]
          return (
            <button key={k} onClick={() => setParams({ jenis: k })} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-extrabold transition ${jenis === k ? 'bg-[#122922] text-white' : 'hover:bg-[#d6ee30]/50'}`}>
              <v.ikon size={16} /> SPPD {v.label}
            </button>
          )
        })}
      </div>

      {galat && <p className="mb-3 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700">{galat}</p>}

      <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
          {[
            ['Periode', daftar?.length ?? '…', 'bg-[#a9dcf0]', ''],
            ['Perjalanan', jmlPerjalanan, 'bg-[#b5e8a5]', ''],
            [`Total SPPD ${J.label}`, rp(total), 'bg-[#d6ee30]/70', 'col-span-2 sm:col-span-1'],
          ].map(([label, nilai, warna, kolom]) => (
            <div key={label} className={`card px-3.5 py-2.5 sm:px-4 sm:py-3 ${warna} ${kolom}`}>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#122922]/70 sm:text-[11px]">{label}</div>
              <div className="truncate text-xl font-extrabold text-[#122922] sm:text-2xl">{nilai}</div>
            </div>
          ))}
        </div>
        <div className="card space-y-2 p-4">
          {rekUtama ? (
            <>
              <div className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0"><div className="font-extrabold uppercase tracking-wider text-[#122922]">Kontrol Pagu RBA</div><div className="truncate text-[#122922]/60" title={rekUtama.uraian}>{rekUtama.kode} · {rekUtama.uraian}</div></div>
                <span className="font-mono font-bold text-[#3f8f77]">{persen(rekUtama.pagu ? (rekUtama.realisasi / rekUtama.pagu) * 100 : 0)}</span>
              </div>
              <Progress value={rekUtama.pagu ? (rekUtama.realisasi / rekUtama.pagu) * 100 : 0} />
              <dl className="space-y-0.5 text-xs tabular-nums">
                <div className="flex justify-between"><dt className="text-[#122922]/60">Pagu</dt><dd className="font-mono font-bold">{rp(rekUtama.pagu)}</dd></div>
                <div className="flex justify-between"><dt className="text-[#122922]/60">Realisasi (rekap SPPD{rekUtama.realisasi > rekUtama.realisasi_sppd_semua ? ' + lainnya' : ''})</dt><dd className="font-mono">{rp(rekUtama.realisasi)}</dd></div>
                <div className="flex justify-between font-bold"><dt>Sisa anggaran</dt><dd className={`font-mono ${rekUtama.sisa < 0 ? 'text-rose-600' : 'text-[#1d5a42]'}`}>{rp(rekUtama.sisa)}</dd></div>
              </dl>
              {rekUtama.pakai_sppd && rekUtama.realisasi_awal > 0 && (
                <p className="rounded-lg bg-[#eaf3dd] px-2.5 py-1.5 text-[11px] font-semibold text-[#1d5a42]">Realisasi rekening ini dihitung dari rekap SPPD saja. Realisasi awal {rp(rekUtama.realisasi_awal)} (impor RBA) tidak ikut dihitung, supaya belanja tidak terhitung dua kali.</p>
              )}
              {!rekUtama.pakai_sppd && rekUtama.realisasi_awal > 0 && (
                <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">Realisasi awal {rp(rekUtama.realisasi_awal)} (impor RBA) dipakai sampai rekap SPPD pertama dihubungkan ke rekening ini; setelah itu realisasi dihitung dari rekap.</p>
              )}
            </>
          ) : (
            <p className="text-xs font-semibold text-[#122922]/70">{penuh ? `Belum ada kode rekening “Perjalanan Dinas” pada RAB tahun ${tahun}. Tambahkan di menu Kode Rekening.` : `Anda belum mengampu kode rekening Perjalanan Dinas ${J.label} pada RAB tahun ${tahun}.`}</p>
          )}
        </div>
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3.5 top-3 text-[#122922]/45" />
        <input className="input !pl-9" placeholder="Cari nama pegawai, tujuan, atau acara (pada periode yang dibuka)…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="space-y-3">
        {(daftar || []).map((d) => (
          <Periode
            key={d.id} ringkas={d} jenis={jenis} pegawai={pegawai} q={q}
            terbuka={buka === d.id} onToggle={() => setBuka(buka === d.id ? null : d.id)}
            onEdit={() => setModal({ ...d })} onChanged={muat}
          />
        ))}
        {daftar && !daftar.length && (
          <div className="card p-2"><Empty>Belum ada rekap SPPD {J.label} tahun {tahun}. Klik “Periode Baru”, lalu tambahkan kegiatan dan pesertanya.</Empty></div>
        )}
      </div>

      {daftar?.length > 0 && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-[#122922]/55"><CalendarDays size={13} /> Setiap periode menjadi satu sheet pada “Excel Setahun” (FULL REKAP SPPD - {J.label.toUpperCase()} {tahun}).</p>
      )}

      {modal && <PeriodeModal key={modal.id || 'baru'} data={modal} jenis={jenis} tahun={tahun} rekening={rekening} wajibRekening={!penuh} onClose={() => setModal(null)} onSaved={(id) => { setBuka(id); muat() }} onDihapus={() => { setBuka(null); muat() }} />}
    </>
  )
}
