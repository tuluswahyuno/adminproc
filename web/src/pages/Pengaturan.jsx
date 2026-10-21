import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { api } from '../lib'
import { Field, PageHeader, SearchableSelect } from '../ui'
import { useAuth } from '../App'

export default function Pengaturan() {
  const { user } = useAuth()
  const adm = user.role === 'admin'
  const [s, setS] = useState(null)
  const [pejabat, setPejabat] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api('/pengaturan').then(setS)
    api('/pejabat').then(setPejabat)
  }, [])
  if (!s) return null
  const u = (k, v) => setS((x) => ({ ...x, [k]: v }))
  const simpan = async (e) => {
    e.preventDefault()
    const { kategori, ...body } = s
    await api('/pengaturan', { method: 'PUT', body })
    setMsg('Tersimpan')
    setTimeout(() => setMsg(''), 1800)
  }
  const sel = (peran, key, label, hint) => {
    const opts = pejabat
      .filter((p) => p.peran === peran && p.aktif)
      .map((p) => ({ value: p.id, label: p.nama, sub: p.nip ? `NIP. ${p.nip}` : '' }))
    return (
      <Field label={label} hint={hint}>
        <SearchableSelect
          disabled={!adm}
          value={s[key] || ''}
          options={opts}
          placeholder="— pilih pejabat —"
          searchPlaceholder="Cari nama pejabat…"
          allowClear
          onChange={(v) => u(key, v)}
        />
      </Field>
    )
  }
  const txt = (k, label, cls = '') => (
    <Field label={label} className={cls}>
      <input className="input" disabled={!adm} value={s[k] || ''} onChange={(e) => u(k, e.target.value)} />
    </Field>
  )

  return (
    <>
      <PageHeader title="Pengaturan Instansi" desc="Identitas instansi dan penandatangan default pada dokumen SPJ">
        {msg && <span className="self-center rounded-full border-2 border-[#122922] bg-[#b5e8a5] px-3 py-1 text-xs font-extrabold text-[#122922]">{msg}</span>}
        <Link to="/pengguna" className="btn-ghost">
          <ShieldCheck size={15} /> Kelola Pengguna Sistem →
        </Link>
      </PageHeader>
      <form onSubmit={simpan} className="space-y-5">
        <div className="card space-y-4 p-5">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#122922]">Instansi &amp; Dokumen</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {txt('pemda', 'Pemerintah daerah')}
            {txt('instansi', 'Nama instansi (Kop)')}
            {txt('instansi_a2', 'Nama instansi di A2')}
            {txt('tahun', 'Tahun anggaran')}
            {txt('alamat', 'Alamat', 'sm:col-span-2')}
            {txt('kontak', 'Telp / laman / e-mail', 'sm:col-span-2')}
            {txt('kota', 'Kota (tanggal tanda tangan)')}
          </div>
        </div>
        <div className="card space-y-4 p-5 overflow-visible">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#122922]">Penandatangan Default</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {sel('KPA', 'kpa_id', 'Kuasa Pengguna Anggaran / Direktur')}
            {sel('BENDAHARA', 'bendahara_id', 'Bendahara Pengeluaran Pembantu')}
            {sel('VERIFIKATOR', 'verifikator_id', 'Verifikator', 'Ganti di sini bila verifikator berubah.')}
            {sel('PENGURUS_BARANG', 'pengurus_barang_id', 'Pengurus Barang (untuk BAPHP)', 'Tampil di Berita Acara Penyerahan Hasil Pekerjaan (BAPHP)')}
          </div>
        </div>
        {adm && <button className="btn-primary">Simpan Pengaturan</button>}
      </form>
    </>
  )
}
