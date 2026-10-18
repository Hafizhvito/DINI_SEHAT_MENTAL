<?php

namespace App\Http\Controllers;

use App\Models\Respondent;
use App\Models\Result;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Exception;

class RespondentController extends Controller
{
    const TOTAL_BINARY_INDICATORS = 21;
    const MIN_SAMPLE_SIZE_FOR_NORMS = 30;
    const STRESS_THRESHOLD_HIGH = 40.0;
    const STRESS_THRESHOLD_MEDIUM = 20.0;

    public function store(Request $request)
    {
        // Validasi data diri respondent
        $respondentData = $request->validate([
            'name'           => 'required|string|max:100',
            'age'            => 'required|integer|min:18',
            'status'         => 'required|string|max:50',
            'education'      => 'nullable|string|max:50',
            'marital_status' => 'nullable|string|max:50',
            'work_period'    => 'nullable|string|max:50',
            'smoking'        => 'nullable|string|max:20',
        ]);

        // Validasi data hasil scoring dari frontend (kuesioner 68 item valid)
        $resultData = $request->validate([
            'problematic_category' => 'required|integer|min:0|max:' . self::TOTAL_BINARY_INDICATORS,
            'score_total'          => 'required|integer|min:0|max:' . self::TOTAL_BINARY_INDICATORS,
            'stress_level'         => 'required|string|in:rendah,sedang,tinggi',
            'wfc_index'            => 'nullable|integer|min:1|max:5',
            'stress_index'         => 'nullable|integer|min:0|max:4',
            'score_category'       => 'required',
            'score_details'        => 'required',
            'answers'              => 'nullable',
        ]);

        $resultData['version'] = 'v68';

        // Validasi konsistensi persentase (berdasarkan 21 indikator Kelompok 1-5)
        $binaryPercentage = ($resultData['score_total'] / self::TOTAL_BINARY_INDICATORS) * 100;
        $expectedStressLevel = $this->getExpectedStressLevel($binaryPercentage);

        if ($resultData['stress_level'] !== $expectedStressLevel) {
            Log::warning("INCONSISTENCY: Received stress_level='{$resultData['stress_level']}' but {$binaryPercentage}% suggests '{$expectedStressLevel}'");
        }

        // Konversi JSON string ke array jika diperlukan
        if (is_string($resultData['score_category'])) {
            try {
                $resultData['score_category'] = json_decode($resultData['score_category'], true);
            } catch (Exception $e) {
                Log::error("JSON decode error score_category: " . $e->getMessage());
            }
        }

        if (is_string($resultData['score_details'])) {
            try {
                $resultData['score_details'] = json_decode($resultData['score_details'], true);
            } catch (Exception $e) {
                Log::error("JSON decode error score_details: " . $e->getMessage());
            }
        }

        if (isset($resultData['answers']) && is_string($resultData['answers'])) {
            try {
                $resultData['answers'] = json_decode($resultData['answers'], true);
            } catch (Exception $e) {
                Log::error("JSON decode error answers: " . $e->getMessage());
            }
        }

        // Cari responden aktif (hanya yang belum di-soft-delete)
        $respondent = Respondent::where([
            'name'   => $respondentData['name'],
            'age'    => $respondentData['age'],
            'status' => $respondentData['status'],
        ])->first();

        if ($respondent) {
            $respondent->update(array_filter($respondentData, fn($val) => $val !== null));
        } else {
            // Jika tidak ada responden aktif yang cocok (atau yang lama sudah di-soft-delete),
            // buat record responden baru tanpa me-restore data lama yang sudah terhapus
            $respondent = Respondent::create($respondentData);
        }

        // Simpan hasil kuesioner baru
        $result = $respondent->results()->create($resultData);

        Log::info("Data v68 berhasil disimpan dengan ID respondent: " . $respondent->id);

        return response()->json([
            'id' => $respondent->id,
            'respondent' => $respondent,
            'result' => $result,
            'debug' => [
                'binary_percentage' => round($binaryPercentage, 1),
                'expected_stress_level' => $expectedStressLevel,
                'actual_stress_level' => $resultData['stress_level'],
                'disclaimer' => 'Hasil skrining, bukan diagnosis',
            ]
        ], 201);
    }

    public function show($respondentId)
    {
        $respondent = Respondent::with('results')->find($respondentId);

        if (!$respondent) {
            return response()->json(['error' => 'Respondent not found'], 404);
        }

        $latestResult = $respondent->results()->latest()->first();

        if (!$latestResult) {
            return response()->json(['error' => 'No results found'], 404);
        }

        return response()->json([
            'id'                   => $respondent->id,
            'name'                 => $respondent->name,
            'age'                  => $respondent->age,
            'status'               => $respondent->status,
            'education'            => $respondent->education,
            'marital_status'       => $respondent->marital_status,
            'work_period'          => $respondent->work_period,
            'smoking'              => $respondent->smoking,
            'version'              => $latestResult->version ?? 'legacy',
            'score_total'          => $latestResult->score_total,
            'problematic_category' => $latestResult->problematic_category,
            'stressLevel'          => $latestResult->stress_level,
            'wfc_index'            => $latestResult->wfc_index,
            'stress_index'         => $latestResult->stress_index,
            'score_category'       => $latestResult->score_category,
            'score_details'        => $latestResult->score_details,
            'disclaimer'           => 'Hasil skrining, bukan diagnosis',
        ]);
    }

    public function getResults($respondentId)
    {
        return $this->show($respondentId);
    }

    /**
     * Hitung Mean (mu) dan Standar Deviasi (SD) Kelompok 7 dari seluruh responden versi v68.
     * Hanya berlaku untuk data v68, data legacy tidak dihitung.
     */
    public function getNorms()
    {
        $results = Result::where('version', 'v68')->get();
        $sampleSize = $results->count();

        $subscaleKeys = [
            'challenge',
            'centrality',
            'controllable_by_self',
            'controllable_others',
            'stressfullness',
        ];

        $norms = [];

        foreach ($subscaleKeys as $key) {
            $values = [];
            foreach ($results as $res) {
                $details = $res->score_details;
                if (is_array($details) && isset($details['stressAppraisalSubscales'][$key]['rawAverage'])) {
                    $values[] = (float) $details['stressAppraisalSubscales'][$key]['rawAverage'];
                }
            }

            $count = count($values);
            if ($count >= self::MIN_SAMPLE_SIZE_FOR_NORMS) {
                $mean = array_sum($values) / $count;
                $sumSquares = 0.0;
                foreach ($values as $v) {
                    $sumSquares += pow($v - $mean, 2);
                }
                $sd = $count > 1 ? sqrt($sumSquares / ($count - 1)) : 0.0;

                $norms[$key] = [
                    'mean' => round($mean, 4),
                    'sd' => round($sd, 4),
                    'sampleSize' => $count,
                    'isAvailable' => true,
                ];
            } else {
                $norms[$key] = [
                    'mean' => null,
                    'sd' => null,
                    'sampleSize' => $count,
                    'isAvailable' => false,
                ];
            }
        }

        return response()->json([
            'sampleSize' => $sampleSize,
            'minSampleSizeRequired' => self::MIN_SAMPLE_SIZE_FOR_NORMS,
            'isAvailable' => $sampleSize >= self::MIN_SAMPLE_SIZE_FOR_NORMS,
            'norms' => $norms,
        ]);
    }

    /**
     * Helper persentase: < 20% rendah, 20% - 39% sedang, >= 40% tinggi
     */
    public function getExpectedStressLevel(float $binaryPercentage): string
    {
        $high = config('scoring.stress_level_thresholds.high', self::STRESS_THRESHOLD_HIGH);
        $medium = config('scoring.stress_level_thresholds.medium', self::STRESS_THRESHOLD_MEDIUM);

        if ($binaryPercentage >= $high) {
            return 'tinggi';
        } elseif ($binaryPercentage >= $medium) {
            return 'sedang';
        } else {
            return 'rendah';
        }
    }
}
