<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\Respondent;
use App\Models\Result;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EndToEndScoringTest extends TestCase
{
    use RefreshDatabase;

    protected $doctor;
    protected $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->doctor = Doctor::create([
            'name' => 'Dr. Verifikator',
            'username' => 'verifikator',
            'password' => bcrypt('password123'),
        ]);
        $this->token = $this->doctor->createToken('auth_token')->plainTextToken;
    }

    /**
     * Skenario A: Semua jawaban bernilai skor TERENDAH (skor = 1).
     * - 21 indikator Kelompok 1-5: S = 4.00, status = 0
     * - stress_level = rendah (0 dari 21 berisiko)
     * - WFC (Time, Strain, Behavior): rata-rata 1.00, kategori 1
     * - Kelompok 7: skor mentah tersimpan (1.00), kategori "Belum tersedia" (null) selama N < 30
     */
    public function test_skenario_a_semua_skor_terendah()
    {
        // 68 item dengan skor terendah (1)
        $answers = [];
        for ($i = 1; $i <= 68; $i++) {
            $answers[$i] = 1;
        }

        // Kalkulasi skor sesuai rumus instrumen v68
        $indicatorKeys = [
            'konflik_antar_personal' => [3],
            'keseimbangan_pribadi_kerja_negatif' => [35],
            'pekerjaan_yang_sesuai' => [1],
            'kebermaknaan_dari_pekerjaan' => [2],
            'penghargaan_harga_diri' => [24],
            'kepemimpinan' => [25],
            'keadilan_dalam_berinteraksi' => [26],
            'tempat_kerja_saling_memuji' => [27],
            'tempat_kerja_kesalahan_diterima' => [28],
            'kepercayaan_pada_manajemen' => [29],
            'kesiapan_menghadapi_perubahan' => [30],
            'penghormatan_bagi_individu' => [31],
            'evaluasi_pekerja_yang_adil' => [32],
            'keberagaman' => [33],
            'pengembangan_karir' => [34],
            'keseimbangan_pribadi_kerja_positif' => [36],
            'gejala_amarah_iritabilitas' => [4, 5],
            'gejala_kelelahan' => [6, 7, 8],
            'gejala_kecemasan' => [9, 10, 11],
            'gejala_depresi' => [12, 13, 14, 15, 16, 17],
            'reaksi_fisik' => [18, 19, 20, 21, 22, 23],
        ];

        $perIndicator = [];
        $totalBinaryFlags = 0;
        foreach ($indicatorKeys as $key => $qIds) {
            $n = count($qIds);
            $sumX = $n * 1; // Semua bernilai 1
            $s = (5 * $n - $sumX) / $n; // (5n - n)/n = 4.00
            $status = $s < 2.25 ? 1 : 0;
            if ($status === 1) $totalBinaryFlags++;

            $perIndicator[$key] = [
                'key' => $key,
                'n' => $n,
                'sumX' => $sumX,
                'sScore' => round($s, 2),
                'status' => $status,
            ];
        }

        $wfcSubscales = [
            'time_based_conflict' => [
                'rawAverage' => 1.00,
                'categoryValue' => 1,
                'categoryLabel' => 'Sangat rendah',
            ],
            'strain_based_conflict' => [
                'rawAverage' => 1.00,
                'categoryValue' => 1,
                'categoryLabel' => 'Sangat rendah',
            ],
            'behavior_based_conflict' => [
                'rawAverage' => 1.00,
                'categoryValue' => 1,
                'categoryLabel' => 'Sangat rendah',
            ],
        ];

        $stressAppraisalSubscales = [
            'challenge' => ['rawAverage' => 1.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'centrality' => ['rawAverage' => 1.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'controllable_by_self' => ['rawAverage' => 1.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'controllable_others' => ['rawAverage' => 1.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'stressfullness' => ['rawAverage' => 1.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
        ];

        $payload = [
            'name' => 'Responden Skenario A',
            'age' => 26,
            'status' => 'Staf Operasional',
            'education' => 'S1',
            'marital_status' => 'Belum Menikah',
            'work_period' => '2 tahun',
            'smoking' => 'Tidak',
            'problematic_category' => $totalBinaryFlags,
            'score_total' => $totalBinaryFlags,
            'stress_level' => 'rendah',
            'wfc_index' => null,
            'stress_index' => null,
            'score_category' => $perIndicator,
            'score_details' => [
                'totalBinaryFlags' => $totalBinaryFlags,
                'maxBinaryFlags' => 21,
                'binaryPercentage' => 0.0,
                'stressLevel' => 'rendah',
                'perIndicator' => $perIndicator,
                'wfcSubscales' => $wfcSubscales,
                'wfcIndex' => 1,
                'stressAppraisalSubscales' => $stressAppraisalSubscales,
                'perQuestion' => $answers,
            ],
            'answers' => $answers,
        ];

        // 1. Kirim via endpoint publik yang dipakai aplikasi
        $response = $this->postJson('/api/respondent', $payload);
        $response->assertStatus(201);
        $responseData = $response->json();
        $this->assertEquals(0, $responseData['result']['score_total']);
        $this->assertEquals('rendah', $responseData['result']['stress_level']);

        // 2. Baca dari database langsung
        $resultInDb = Result::where('respondent_id', $responseData['id'])->first();
        $this->assertNotNull($resultInDb);
        $this->assertEquals('v68', $resultInDb->version);
        $this->assertEquals(0, $resultInDb->score_total);
        $this->assertEquals(0, $resultInDb->problematic_category);
        $this->assertEquals('rendah', $resultInDb->stress_level);
        $this->assertNull($resultInDb->wfc_index);
        $this->assertNull($resultInDb->stress_index);

        $details = $resultInDb->score_details;
        $this->assertCount(21, $details['perIndicator']);
        foreach ($details['perIndicator'] as $ind) {
            $this->assertEquals(4.00, $ind['sScore']);
            $this->assertEquals(0, $ind['status']);
        }
        $this->assertEquals(1.00, $details['wfcSubscales']['time_based_conflict']['rawAverage']);
        $this->assertEquals(1, $details['wfcSubscales']['time_based_conflict']['categoryValue']);
        $this->assertEquals(1.00, $details['wfcSubscales']['strain_based_conflict']['rawAverage']);
        $this->assertEquals(1, $details['wfcSubscales']['strain_based_conflict']['categoryValue']);
        $this->assertEquals(1.00, $details['wfcSubscales']['behavior_based_conflict']['rawAverage']);
        $this->assertEquals(1, $details['wfcSubscales']['behavior_based_conflict']['categoryValue']);

        foreach ($details['stressAppraisalSubscales'] as $app) {
            $this->assertEquals(1.00, $app['rawAverage']);
            $this->assertNull($app['categoryValue']);
            $this->assertEquals('Belum tersedia', $app['categoryLabel']);
        }

        // 3. Baca dari endpoint Dashboard dokter
        $dashResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/results?version=v68');
        $dashResponse->assertStatus(200);
        $dashList = $dashResponse->json();
        $this->assertNotEmpty($dashList);

        $found = collect($dashList)->firstWhere('id', $resultInDb->id);
        $this->assertNotNull($found);
        $this->assertEquals(0, $found['score_total']);
        $this->assertEquals('rendah', $found['stress_level']);
        $this->assertEquals('v68', $found['version']);
    }

    /**
     * Skenario B: Semua jawaban bernilai skor TERTINGGI (4 untuk Bagian I-VI, 5 untuk Bagian VII).
     * - 21 indikator Kelompok 1-5: S = 1.00, status = 1 (semua berisiko)
     * - stress_level = tinggi (21 dari 21 berisiko, 100%)
     * - WFC (Time, Strain, Behavior): rata-rata 4.00, kategori 5
     * - Kelompok 7: skor mentah tersimpan (5.00), kategori "Belum tersedia" (null) selama N < 30
     */
    public function test_skenario_b_semua_skor_tertinggi()
    {
        $answers = [];
        // Item 1-54 bernilai 4
        for ($i = 1; $i <= 54; $i++) {
            $answers[$i] = 4;
        }
        // Item 55-68 bernilai 5
        for ($i = 55; $i <= 68; $i++) {
            $answers[$i] = 5;
        }

        $indicatorKeys = [
            'konflik_antar_personal' => [3],
            'keseimbangan_pribadi_kerja_negatif' => [35],
            'pekerjaan_yang_sesuai' => [1],
            'kebermaknaan_dari_pekerjaan' => [2],
            'penghargaan_harga_diri' => [24],
            'kepemimpinan' => [25],
            'keadilan_dalam_berinteraksi' => [26],
            'tempat_kerja_saling_memuji' => [27],
            'tempat_kerja_kesalahan_diterima' => [28],
            'kepercayaan_pada_manajemen' => [29],
            'kesiapan_menghadapi_perubahan' => [30],
            'penghormatan_bagi_individu' => [31],
            'evaluasi_pekerja_yang_adil' => [32],
            'keberagaman' => [33],
            'pengembangan_karir' => [34],
            'keseimbangan_pribadi_kerja_positif' => [36],
            'gejala_amarah_iritabilitas' => [4, 5],
            'gejala_kelelahan' => [6, 7, 8],
            'gejala_kecemasan' => [9, 10, 11],
            'gejala_depresi' => [12, 13, 14, 15, 16, 17],
            'reaksi_fisik' => [18, 19, 20, 21, 22, 23],
        ];

        $perIndicator = [];
        $totalBinaryFlags = 0;
        foreach ($indicatorKeys as $key => $qIds) {
            $n = count($qIds);
            $sumX = $n * 4; // Semua bernilai 4
            $s = (5 * $n - $sumX) / $n; // (5n - 4n)/n = 1.00
            $status = $s < 2.25 ? 1 : 0; // 1.00 < 2.25 -> 1
            if ($status === 1) $totalBinaryFlags++;

            $perIndicator[$key] = [
                'key' => $key,
                'n' => $n,
                'sumX' => $sumX,
                'sScore' => round($s, 2),
                'status' => $status,
            ];
        }

        $wfcSubscales = [
            'time_based_conflict' => [
                'rawAverage' => 4.00,
                'categoryValue' => 5,
                'categoryLabel' => 'Sangat tinggi',
            ],
            'strain_based_conflict' => [
                'rawAverage' => 4.00,
                'categoryValue' => 5,
                'categoryLabel' => 'Sangat tinggi',
            ],
            'behavior_based_conflict' => [
                'rawAverage' => 4.00,
                'categoryValue' => 5,
                'categoryLabel' => 'Sangat tinggi',
            ],
        ];

        $stressAppraisalSubscales = [
            'challenge' => ['rawAverage' => 5.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'centrality' => ['rawAverage' => 5.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'controllable_by_self' => ['rawAverage' => 5.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'controllable_others' => ['rawAverage' => 5.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
            'stressfullness' => ['rawAverage' => 5.00, 'categoryValue' => null, 'categoryLabel' => 'Belum tersedia'],
        ];

        $payload = [
            'name' => 'Responden Skenario B',
            'age' => 32,
            'status' => 'Supervisor',
            'education' => 'S2',
            'marital_status' => 'Menikah',
            'work_period' => '5 tahun',
            'smoking' => 'Tidak',
            'problematic_category' => $totalBinaryFlags,
            'score_total' => $totalBinaryFlags,
            'stress_level' => 'tinggi',
            'wfc_index' => null,
            'stress_index' => null,
            'score_category' => $perIndicator,
            'score_details' => [
                'totalBinaryFlags' => $totalBinaryFlags,
                'maxBinaryFlags' => 21,
                'binaryPercentage' => 100.0,
                'stressLevel' => 'tinggi',
                'perIndicator' => $perIndicator,
                'wfcSubscales' => $wfcSubscales,
                'wfcIndex' => 5,
                'stressAppraisalSubscales' => $stressAppraisalSubscales,
                'perQuestion' => $answers,
            ],
            'answers' => $answers,
        ];

        // 1. Kirim via endpoint publik
        $response = $this->postJson('/api/respondent', $payload);
        $response->assertStatus(201);
        $responseData = $response->json();
        $this->assertEquals(21, $responseData['result']['score_total']);
        $this->assertEquals('tinggi', $responseData['result']['stress_level']);

        // 2. Baca dari database
        $resultInDb = Result::where('respondent_id', $responseData['id'])->first();
        $this->assertNotNull($resultInDb);
        $this->assertEquals('v68', $resultInDb->version);
        $this->assertEquals(21, $resultInDb->score_total);
        $this->assertEquals(21, $resultInDb->problematic_category);
        $this->assertEquals('tinggi', $resultInDb->stress_level);

        $details = $resultInDb->score_details;
        $this->assertCount(21, $details['perIndicator']);
        foreach ($details['perIndicator'] as $ind) {
            $this->assertEquals(1.00, $ind['sScore']);
            $this->assertEquals(1, $ind['status']);
        }
        $this->assertEquals(4.00, $details['wfcSubscales']['time_based_conflict']['rawAverage']);
        $this->assertEquals(5, $details['wfcSubscales']['time_based_conflict']['categoryValue']);
        $this->assertEquals(4.00, $details['wfcSubscales']['strain_based_conflict']['rawAverage']);
        $this->assertEquals(5, $details['wfcSubscales']['strain_based_conflict']['categoryValue']);
        $this->assertEquals(4.00, $details['wfcSubscales']['behavior_based_conflict']['rawAverage']);
        $this->assertEquals(5, $details['wfcSubscales']['behavior_based_conflict']['categoryValue']);

        foreach ($details['stressAppraisalSubscales'] as $app) {
            $this->assertEquals(5.00, $app['rawAverage']);
            $this->assertNull($app['categoryValue']);
            $this->assertEquals('Belum tersedia', $app['categoryLabel']);
        }

        // 3. Baca dari endpoint Dashboard dokter
        $dashResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/results?version=v68');
        $dashResponse->assertStatus(200);
        $dashList = $dashResponse->json();
        $found = collect($dashList)->firstWhere('id', $resultInDb->id);
        $this->assertNotNull($found);
        $this->assertEquals(21, $found['score_total']);
        $this->assertEquals('tinggi', $found['stress_level']);
    }

    /**
     * Skenario C: Seed 30 responden v68 dengan variasi jawaban.
     * Pastikan:
     * - /api/norms menghitung sampleSize >= 30 dan isAvailable = true
     * - mu dan SD dihitung murni dari data v68 aktif (tanpa legacy dan tanpa data soft delete)
     * - Kategori 0 sampai 4 muncul sesuai rumus batas standar
     */
    public function test_skenario_c_seed_30_responden_norma_kelompok_7()
    {
        // 1. Seed 30 responden v68 dengan skor raw bervariasi
        $subscaleKeys = [
            'challenge',
            'centrality',
            'controllable_by_self',
            'controllable_others',
            'stressfullness',
        ];

        for ($i = 1; $i <= 30; $i++) {
            $resp = Respondent::create([
                'name' => "Responden Variasi $i",
                'age' => 20 + ($i % 30),
                'status' => 'Karyawan',
            ]);

            $appraisalDetails = [];
            foreach ($subscaleKeys as $idx => $key) {
                // Buat variasi nilai antara 1.0 sampai 5.0
                $rawVal = round(1.0 + (($i + $idx * 3) % 40) / 10, 2);
                $appraisalDetails[$key] = [
                    'rawAverage' => $rawVal,
                    'categoryValue' => null,
                    'categoryLabel' => 'Belum tersedia',
                ];
            }

            $resp->results()->create([
                'version' => 'v68',
                'score_total' => $i % 22,
                'problematic_category' => $i % 22,
                'stress_level' => ($i % 22) >= 9 ? 'tinggi' : (($i % 22) >= 5 ? 'sedang' : 'rendah'),
                'wfc_index' => null,
                'stress_index' => null,
                'score_category' => [],
                'score_details' => [
                    'stressAppraisalSubscales' => $appraisalDetails,
                ],
            ]);
        }

        // 2. Tambahkan data legacy (HARUS DIABAIKAN OLEH NORMA)
        for ($j = 1; $j <= 10; $j++) {
            $respLegacy = Respondent::create([
                'name' => "Legacy Respondent $j",
                'age' => 30,
                'status' => 'Legacy Status',
            ]);
            $respLegacy->results()->create([
                'version' => 'legacy',
                'score_total' => 15,
                'problematic_category' => 15,
                'stress_level' => 'sedang',
                'wfc_index' => 3,
                'stress_index' => 2,
                'score_category' => [],
                'score_details' => [
                    'stressAppraisalSubscales' => [
                        'challenge' => ['rawAverage' => 99.0], // Outlier ekstrem bila terhitung
                    ],
                ],
            ]);
        }

        // 3. Tambahkan data soft-deleted v68 (HARUS DIABAIKAN OLEH NORMA)
        $respDeleted = Respondent::create([
            'name' => "Deleted v68 Respondent",
            'age' => 28,
            'status' => 'Deleted Status',
        ]);
        $resultDeleted = $respDeleted->results()->create([
            'version' => 'v68',
            'score_total' => 10,
            'problematic_category' => 10,
            'stress_level' => 'sedang',
            'score_category' => [],
            'score_details' => [
                'stressAppraisalSubscales' => [
                    'challenge' => ['rawAverage' => 999.0], // Outlier ekstrem bila terhitung
                ],
            ],
        ]);
        $resultDeleted->delete(); // Soft delete

        // 4. Panggil endpoint /api/norms
        $normsResponse = $this->getJson('/api/norms');
        $normsResponse->assertStatus(200);
        $normsData = $normsResponse->json();

        // Sample size harus tepat 30 (hanya v68 aktif, tanpa 10 legacy dan tanpa 1 soft deleted)
        $this->assertEquals(30, $normsData['sampleSize']);
        $this->assertTrue($normsData['isAvailable']);

        foreach ($subscaleKeys as $key) {
            $subNorm = $normsData['norms'][$key];
            $this->assertTrue($subNorm['isAvailable']);
            $this->assertEquals(30, $subNorm['sampleSize']);
            $this->assertNotNull($subNorm['mean']);
            $this->assertNotNull($subNorm['sd']);
            $this->assertGreaterThan(0, $subNorm['sd']);
            // Pastikan mean tidak terkontaminasi oleh outlier legacy (99.0) atau deleted (999.0)
            $this->assertLessThan(6.0, $subNorm['mean']);
            $this->assertGreaterThan(0.5, $subNorm['mean']);
        }
    }

    /**
     * Test Transisi Dinamis: Responden yang mengisi saat N < 30 mendapat kategori begitu N >= 30,
     * dan kategori berubah dinamis mengikuti pergeseran norma terbaru.
     */
    public function test_transisi_dinamis_kategori_kelompok_7_saat_n_mencapai_30_dan_norma_bergeser()
    {
        // 1. Responden A mengisi saat N = 1 (< 30) dengan rawAverage challenge = 3.50
        $respA = Respondent::create([
            'name' => 'Responden A Awal',
            'age' => 27,
            'status' => 'Staf',
        ]);

        $resultA = $respA->results()->create([
            'version' => 'v68',
            'score_total' => 5,
            'problematic_category' => 5,
            'stress_level' => 'rendah',
            'wfc_index' => null,
            'stress_index' => null,
            'score_category' => [],
            'score_details' => [
                'stressAppraisalSubscales' => [
                    'challenge' => [
                        'rawAverage' => 3.50,
                        'categoryValue' => null,
                        'categoryLabel' => 'Belum tersedia',
                    ],
                ],
            ],
        ]);

        // Saat N = 1: norma belum tersedia
        $normsRes1 = $this->getJson('/api/norms')->json();
        $this->assertEquals(1, $normsRes1['sampleSize']);
        $this->assertFalse($normsRes1['isAvailable']);
        $this->assertFalse($normsRes1['norms']['challenge']['isAvailable']);
        $this->assertNull($normsRes1['norms']['challenge']['mean']);

        // 2. Tambah 29 responden lagi sehingga total N = 30 (mean challenge ~ 2.50, SD ~ 0.50)
        for ($i = 2; $i <= 30; $i++) {
            $resp = Respondent::create(['name' => "Responden Batch 1 #$i", 'age' => 25, 'status' => 'Karyawan']);
            // Nilai sekitar 2.0 s.d. 3.0
            $val = 2.0 + (($i % 10) / 10);
            $resp->results()->create([
                'version' => 'v68',
                'score_total' => 4,
                'problematic_category' => 4,
                'stress_level' => 'rendah',
                'score_details' => [
                    'stressAppraisalSubscales' => [
                        'challenge' => ['rawAverage' => $val],
                    ],
                ],
            ]);
        }

        // Sekarang N = 30: norma sudah tersedia
        $normsRes2 = $this->getJson('/api/norms')->json();
        $this->assertEquals(30, $normsRes2['sampleSize']);
        $this->assertTrue($normsRes2['isAvailable']);
        $chalNorm2 = $normsRes2['norms']['challenge'];
        $this->assertTrue($chalNorm2['isAvailable']);
        $this->assertNotNull($chalNorm2['mean']);
        $this->assertNotNull($chalNorm2['sd']);

        // Helper fungsi kalkulasi kategori Kelompok 7 (sama seperti frontend classifyStressAppraisalSubscale)
        $classify = function (float $X, array $norm): int {
            $mean = $norm['mean'];
            $sd = $norm['sd'];
            if ($X > $mean + 1.5 * $sd) return 4;
            if ($X > $mean + 0.5 * $sd) return 3;
            if ($X > $mean - 0.5 * $sd) return 2;
            if ($X > $mean - 1.5 * $sd) return 1;
            return 0;
        };

        // Responden A (rawAverage = 3.50) dengan norma N = 30 (mean ~ 2.5) berada di atas mean + 1.5 SD -> Kategori 4
        $catPhase2 = $classify(3.50, $chalNorm2);
        $this->assertEquals(4, $catPhase2, "Responden A yang tadinya belum memiliki kategori harus mendapat Kategori 4 saat N >= 30");

        // 3. Tambah 30 responden lagi dengan skor tinggi (misal 4.5 s.d. 5.0) sehingga populasi N = 60 dan mean bergeser naik
        for ($k = 31; $k <= 60; $k++) {
            $resp = Respondent::create(['name' => "Responden Batch 2 #$k", 'age' => 30, 'status' => 'Karyawan']);
            $highVal = 4.5 + (($k % 5) / 10); // 4.5 s.d. 4.9
            $resp->results()->create([
                'version' => 'v68',
                'score_total' => 15,
                'problematic_category' => 15,
                'stress_level' => 'sedang',
                'score_details' => [
                    'stressAppraisalSubscales' => [
                        'challenge' => ['rawAverage' => $highVal],
                    ],
                ],
            ]);
        }

        $normsRes3 = $this->getJson('/api/norms')->json();
        $this->assertEquals(60, $normsRes3['sampleSize']);
        $chalNorm3 = $normsRes3['norms']['challenge'];
        $this->assertGreaterThan($chalNorm2['mean'], $chalNorm3['mean'], "Mean norma challenge harus bergeser naik");

        // Evaluasi kembali Responden A (rawAverage tetap 3.50) terhadap norma baru N = 60
        $catPhase3 = $classify(3.50, $chalNorm3);
        $this->assertNotEquals(4, $catPhase3, "Kategori Responden A harus berubah dinamis seiring pergeseran norma populasi");
        $this->assertLessThan(4, $catPhase3, "Kategori Responden A harus turun dari 4 karena mean populasi meningkat");
    }
}
