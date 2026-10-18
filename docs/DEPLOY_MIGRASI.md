# Panduan Backup, Migrasi Database, dan Prosedur Rollback Server
Sistem Skrining Stres Kerja Pekerja Perempuan (DINI Sehat Mental)

> [!CAUTION] PERINGATAN KESELAMATAN:
> **Dilarang keras menjalankan perintah langsung di server produksi tanpa melakukan prosedur backup penuh terlebih dahulu!**
> Seluruh langkah di bawah ini wajib diikuti secara berurutan. Simpan seluruh log dan catatan verifikasi setiap langkah.

---

## 1. Langkah 1: Backup Penuh Database Produksi (`mysqldump`)

Sebelum menyentuh migration atau kode baru di server produksi, lakukan ekspor dump seluruh database MySQL dengan nama file bertanggal dan berjam spesifik.

### Perintah:
```bash
# Format penamaan: backup_<nama_database>_YYYYMMDD_HHMMSS.sql
mysqldump -u <DB_USERNAME> -p<DB_PASSWORD> --single-transaction --quick --routines --triggers <DB_DATABASE> > backup_dini_mental_$(date +%Y%m%d_%H%M%S).sql
```

### Contoh Konkret Eksekusi:
```bash
mysqldump -u dini_user -p dini_sehat_mental --single-transaction --quick --routines --triggers > backup_dini_sehat_mental_20261018_143000.sql
```

---

## 2. Langkah 2: Verifikasi Integritas File Backup & Rekam Baseline Data

Pastikan file backup benar-benar valid dan tidak corrupt atau 0 byte.

### 2.1 Cek Ukuran File Backup:
```bash
ls -lh backup_dini_sehat_mental_*.sql
```
Pastikan ukuran file wajar (biasanya beberapa Megabyte, **bukan 0 KB**).

### 2.2 Cek Baris Akhir File Backup:
```bash
tail -n 10 backup_dini_sehat_mental_*.sql
```
Pastikan baris terakhir mencetak konfirmasi:
```sql
-- Dump completed on 2026-10-18 14:30:05
```

### 2.3 Rekam Jumlah Baris Awal (Baseline Pre-Migration):
Jalankan query verifikasi melalui client MySQL:
```sql
-- Cek jumlah baris di tabel results dan respondents
SELECT COUNT(*) AS total_results_sebelum FROM results;
SELECT COUNT(*) AS total_respondents_sebelum FROM respondents;
```
*Catat angka persisnya (misalnya: `total_results_sebelum = 231`).*

### 2.4 Bandingkan Skema Tabel Nyata di Server (`SHOW CREATE TABLE`)
Sebelum menjalankan migrasi, periksa struktur tabel di server produksi:
```sql
SHOW CREATE TABLE results\G
SHOW CREATE TABLE respondents\G
```
Bandingkan output ini dengan skema pada file migrasi repo. Pastikan kolom yang akan ditambahkan (`version`, `answers`, `deleted_at` pada `results`, serta `education`, `marital_status`, `work_period`, `smoking`, `deleted_at` pada `respondents`) belum ada atau sesuai rencana.

### 2.5 Verifikasi Status Migrasi 2026_10_18_025059
> [!IMPORTANT]
> Migrasi `2026_10_18_025059_update_results_and_respondents_for_v68` harus **belum pernah dijalankan** sebelumnya di server target.
> Cek status migrasi melalui MySQL atau CLI:
> ```bash
> php artisan migrate:status
> ```
> atau via SQL:
> ```sql
> SELECT * FROM migrations WHERE migration LIKE '%2026_10_18_025059%';
> ```
> - **Jika belum ada di tabel `migrations`**: Aman untuk menjalankan `php artisan migrate`.
> - **Jika SUDAH pernah tercatat dijalankan di server**: **JANGAN MENGUBAH / MENGEDIT FILE MIGRASI YANG LAMA!** Buatlah file migrasi baru (misal `php artisan make:migration add_answers_to_results_table`) untuk menambahkan perubahan baru secara terpisah.

---

## 3. Langkah 3: Eksekusi Migrasi Database Laravel

Setelah backup terverifikasi aman:

1. Masuk ke direktori backend aplikasi:
   ```bash
   cd /path/to/DINI-Sehat-Mental/backend
   ```
2. Pastikan mode maintenance aktif bila diperlukan agar tidak ada transaksi masuk saat migrasi:
   ```bash
   php artisan down --message="Pemeliharaan sistem berkala sedang berlangsung"
   ```
3. Jalankan migrasi database:
   ```bash
   php artisan migrate --force
   ```
   *Catatan: Flag `--force` diperlukan bila environment diset ke `production`.*

---

## 4. Langkah 4: Verifikasi Pasca-Migrasi (Post-Migration Verification)

Pastikan migrasi berjalan sukses tanpa mengubah atau menghilangkan satu pun data yang sudah ada sebelumnya.

Jalankan query verifikasi berikut:

```sql
-- 1. Pastikan kolom deleted_at telah terpasang
SHOW COLUMNS FROM results LIKE 'deleted_at';
SHOW COLUMNS FROM respondents LIKE 'deleted_at';

-- 2. Cek total baris HARUS SAMA DENGAN BASELINE SEBELUM MIGRASI
SELECT COUNT(*) AS total_results_setelah FROM results;
SELECT COUNT(*) AS total_respondents_setelah FROM respondents;

-- 3. Cek data legacy (HARUS TEPAT 231 BARIS DAN SEMUANYA BERTANDA 'legacy')
SELECT COUNT(*) AS total_legacy FROM results WHERE version = 'legacy';

-- 4. Pastikan belum ada data yang ter-soft delete secara tidak sengaja
SELECT COUNT(*) AS total_deleted FROM results WHERE deleted_at IS NOT NULL;
```

### Kriteria Kelulusan Verifikasi:
- `total_results_setelah` == `total_results_sebelum`
- `total_respondents_setelah` == `total_respondents_sebelum`
- `total_legacy` == `231` (seluruh data riwayat lama utuh bertanda 'legacy')
- `total_deleted` == `0`

Jika semua kriteria lulus, nonaktifkan mode maintenance:
```bash
php artisan up
```

---

## 5. Langkah 5: Prosedur Rollback Darurat (Emergency Rollback)

Bila terjadi kegagalan atau galat yang tidak dapat ditoleransi saat proses migrasi berlangsung:

### Opsi A: Rollback Batch Migrasi Terakhir via Artisan
```bash
php artisan migrate:rollback --step=1 --force
```

### Opsi B: Restore Penuh Database dari File Backup (Bila Database Inkonsisten)
Jika struktur tabel atau data mengalami gangguan:
```bash
# 1. Bersihkan dan restore dari file backup yang diambil di Langkah 1
mysql -u <DB_USERNAME> -p<DB_PASSWORD> <DB_DATABASE> < backup_dini_sehat_mental_20261018_143000.sql

# 2. Verifikasi ulang jumlah baris setelah restore
mysql -u <DB_USERNAME> -p<DB_PASSWORD> -e "SELECT count(*) FROM results; SELECT count(*) FROM respondents;" <DB_DATABASE>
```
3. Pastikan aplikasi kembali menyala dalam kondisi stabil:
```bash
php artisan up
```
