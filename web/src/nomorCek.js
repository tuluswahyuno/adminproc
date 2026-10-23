import { useEffect, useState } from 'react'
import { api } from './lib'

/* Memeriksa ke server (tanpa menyimpan) apakah nomor-nomor yang sedang diisi sudah dipakai paket lain,
   dicatat manual, atau dobel dalam paket yang sama. entri: [{ kunci, label, no_urut }] -> { kunci: pesan } */
export function useKonflikNomor(tahun, id, entri, idManual = null) {
  const [konflik, setKonflik] = useState({})
  const [tik, setTik] = useState(0)
  const isi = JSON.stringify(entri)

  // nomor bisa dipakai pengguna lain selagi formulir terbuka: periksa ulang saat tab kembali aktif
  useEffect(() => {
    const aktif = () => { if (!document.hidden) setTik((n) => n + 1) }
    document.addEventListener('visibilitychange', aktif)
    window.addEventListener('focus', aktif)
    return () => { document.removeEventListener('visibilitychange', aktif); window.removeEventListener('focus', aktif) }
  }, [])

  useEffect(() => {
    if (!entri.length) { setKonflik({}); return undefined }
    let batal = false
    const t = setTimeout(() => {
      api('/nomor/cek', { method: 'POST', body: { tahun, id: id || null, manual_id: idManual || null, nomor: entri } })
        .then((r) => { if (!batal) setKonflik(r.konflik || {}) })
        .catch(() => {})
    }, 350)
    return () => { batal = true; clearTimeout(t) }
  }, [tahun, id, idManual, isi, tik]) // eslint-disable-line react-hooks/exhaustive-deps

  return konflik
}
