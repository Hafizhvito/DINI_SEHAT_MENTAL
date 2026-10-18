# Dokumen Asumsi Skoring dan Parameter Baku
Sistem Skrining Stres Kerja Pekerja Perempuan (DINI Sehat Mental)
Versi Instrumen: 68 Pertanyaan Valid (17-04-2026)

---

## 1. Tabel Parameter & Asumsi Skoring

Berikut adalah seluruh konstanta, batas nilai, dan parameter statistik yang digunakan dalam perhitungan hasil skrining:

| Nama Konstanta | Nilai / Batasan | Lokasi di Kode | Sumber / Acuan | Status Konfirmasi |
| :--- | :--- | :--- | :--- | :--- |
| `TOTAL_QUESTIONS` | `68` | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php` | Dokumen resmi kuesioner (17-04-2026) Bagian I s.d. VII | **Sudah Dikonfirmasi** (Dokumen Resmi) |
| `TOTAL_BINARY_INDICATORS` | `21` | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php`<br>`backend/app/Http/Controllers/RespondentController.php` | Dokumen resmi Bagian 6: 21 indikator baku Kelompok 1 s.d. Kelompok 5 | **Sudah Dikonfirmasi** (Dokumen Resmi) |
| `CUTOFF_S` | `2.25` | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php` | Dokumen resmi Bagian 6 ("Rumus Skoring"): Status 1 jika $S < 2.25$, Status 0 jika $S \ge 2.25$ | **Sudah Dikonfirmasi** (Dokumen Resmi) |
| `WFC_CATEGORY_THRESHOLDS` | - Sangat tinggi: $X > 3.4$ (Kat. 5)<br>- Tinggi: $2.8 \le X \le 3.4$ (Kat. 4)<br>- Sedang: $2.2 \le X < 2.8$ (Kat. 3)<br>- Rendah: $1.6 \le X < 2.2$ (Kat. 2)<br>- Sangat rendah: $X < 1.6$ (Kat. 1) | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php` | Dokumen resmi Bagian 4 & Bagian 7. Catatan khusus: nilai batas tepat 3.4 diklasifikasikan ke Kategori 4 (Tinggi) | **Sudah Dikonfirmasi** (Dokumen Resmi) |
| `MIN_SAMPLE_SIZE_FOR_NORMS` | `30` | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php`<br>`backend/app/Http/Controllers/RespondentController.php` | Prinsip Central Limit Theorem (CLT) untuk estimasi norma populasi mean ($\mu$) & deviasi standar ($\text{SD}$) | **Belum Dikonfirmasi Klien** (Rekomendasi Statistik) |
| `STRESS_LEVEL_THRESHOLDS` | - Tinggi: $\ge 40\%$ risiko<br>- Sedang: $20\% \le \text{risiko} < 40\%$<br>- Rendah: $< 20\%$ risiko | `frontend/src/utils/Scoring.ts`<br>`backend/config/scoring.php`<br>`backend/app/Http/Controllers/RespondentController.php` | Git Commit legacy `f065cd7` (4 September 2025) | **Belum Dikonfirmasi Klien** (Warisan Instrumen Lama) |

---

## 2. Catatan Khusus Mengenai Ambang Batas 20% dan 40%

> [!WARNING] Catatan Penting untuk Tim Pengembang dan Tim Medis:
> Ambang batas persentase `20%` dan `40%` untuk klasifikasi `stress_level` ("rendah", "sedang", "tinggi") berasal dari kode commit lama `f065cd7` (tanggal 4 September 2025). Pada saat commit tersebut dibuat, instrumen skrining masih menggunakan instrumen legacy dengan total 63 indikator biner.
> 
> Saat ini, sistem telah bermigrasi ke instrumen resmi 68 pertanyaan dengan **21 indikator biner** (Kelompok 1 sampai 5).
> Implikasi matematika pada 21 indikator biner:
> - **Rendah** ($< 20\%$): $0$ sampai $4$ indikator berisiko ($0\% \text{ s.d. } 19.0\%$).
> - **Sedang** ($20\% \text{ s.d. } 39.9\%$): $5$ sampai $8$ indikator berisiko ($23.8\% \text{ s.d. } 38.1\%$).
> - **Tinggi** ($\ge 40\%$): $9$ sampai $21$ indikator berisiko ($42.9\% \text{ s.d. } 100\%$).
> 
> Nilai ambang batas ini **belum pernah dikalibrasi secara psikometrik / klinis khusus untuk 21 indikator**. Oleh karena itu, statusnya tetap ditandai sebagai **Belum Dikonfirmasi Klien** hingga dokter spesialis kedokteran jiwa / psikolog penanggung jawab memberikan cut-off skor absolut resmi.

---

## 3. Catatan Norma Penilaian Transaksional (Kelompok 7)

1. **Syarat Minimal Responden ($N \ge 30$)**:
   - Norma mean ($\mu$) dan simpangan baku ($\text{SD}$) untuk 5 subskala Kelompok 7 (Challenge, Centrality, Controllable by Self, Controllable Others, Stressfullness) **hanya dihitung dari responden aktif versi v68**.
   - Seluruh data legacy (versi lama 89 pertanyaan) dan data yang berstatus *soft-deleted* (`deleted_at IS NOT NULL`) secara tegas dikeluarkan dari perhitungan norma.
   - Bila jumlah sampel v68 masih kurang dari 30, kategori skor tidak boleh ditebak atau diasumsikan default (misalnya tidak boleh default "Sedang"), melainkan ditampilkan sebagai status netral **"Belum tersedia"** (pada PDF: `"N/A (<30)"`, pada Excel: `"Belum Tersedia (<30)"`).

2. **Rumus 5 Interval Kategori Transaksional (bila $N \ge 30$)**:
   - **Kategori 4 (Stres sangat tinggi)**: $X > \mu + 1.5\,\text{SD}$
   - **Kategori 3 (Stres tinggi)**: $\mu + 0.5\,\text{SD} < X \le \mu + 1.5\,\text{SD}$
   - **Kategori 2 (Stres sedang)**: $\mu - 0.5\,\text{SD} < X \le \mu + 0.5\,\text{SD}$
   - **Kategori 1 (Stres rendah)**: $\mu - 1.5\,\text{SD} < X \le \mu - 0.5\,\text{SD}$
   - **Kategori 0 (Stres sangat rendah)**: $X \le \mu - 1.5\,\text{SD}$

---

## 4. Sinkronisasi Dua Lokasi Konstanta (Backend & Frontend)

> [!IMPORTANT] PENTING: Pengubahan Konstanta Wajib Dilakukan Bersamaan di Dua Tempat!
> Seluruh konstanta dan batas nilai skoring didefinisikan secara paralel di dua tempat:
> 1. **Backend**: `backend/config/scoring.php` (digunakan oleh API Laravel, controller, dan kalkulasi norma server).
> 2. **Frontend**: `frontend/src/utils/Scoring.ts` (digunakan oleh form interaktif responden, kalkulasi visual hasil instan, Dashboard dokter, serta ekspor Excel dan PDF).
> 
> Bila di masa mendatang terdapat penyesuaian nilai parameter (seperti perubahan nilai ambang `CUTOFF_S`, pergeseran batas `WFC_CATEGORY_THRESHOLDS`, kalibrasi persentase `STRESS_LEVEL_THRESHOLDS`, atau perubahan minimum sampel `MIN_SAMPLE_SIZE_FOR_NORMS`), **kedua file ini wajib diubah bersamaan** untuk mencegah diskrepansi antara data yang tersimpan di server dan tampilan di antarmuka pengguna.

