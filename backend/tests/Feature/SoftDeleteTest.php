<?php

namespace Tests\Feature;

use App\Models\Doctor;
use App\Models\Respondent;
use App\Models\Result;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SoftDeleteTest extends TestCase
{
    use RefreshDatabase;

    protected $doctor;
    protected $token;

    protected function setUp(): void
    {
        parent::setUp();
        $this->doctor = Doctor::create([
            'name' => 'Dr. Test',
            'username' => 'testdoc',
            'password' => bcrypt('password123'),
        ]);
        $this->token = $this->doctor->createToken('auth_token')->plainTextToken;
    }

    public function test_result_and_respondent_soft_delete()
    {
        $respondent = Respondent::create([
            'name' => 'Siti Aminah',
            'age' => 28,
            'status' => 'Guru',
        ]);

        $result = $respondent->results()->create([
            'version' => 'v68',
            'score_total' => 5,
            'problematic_category' => 5,
            'stress_level' => 'rendah',
            'wfc_index' => 2,
            'stress_index' => 1,
            'score_category' => ['I' => 'Ringan'],
            'score_details' => ['Kelompok_1' => ['score' => 1]],
        ]);

        $this->assertNull($result->deleted_at);
        $this->assertNull($respondent->deleted_at);

        // Delete via DashboardController destroy route
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->deleteJson("/api/results/{$result->id}");

        $response->assertStatus(200);

        // Result and Respondent must be soft-deleted (not hard deleted)
        $this->assertSoftDeleted('results', ['id' => $result->id]);
        $this->assertSoftDeleted('respondents', ['id' => $respondent->id]);

        // Default query must NOT return soft deleted records
        $this->assertEquals(0, Result::count());
        $this->assertEquals(0, Respondent::count());

        // withTrashed MUST still find them
        $this->assertEquals(1, Result::withTrashed()->count());
        $this->assertEquals(1, Respondent::withTrashed()->count());
    }

    public function test_dashboard_and_norms_exclude_soft_deleted_results()
    {
        $respondent = Respondent::create([
            'name' => 'Budiarti',
            'age' => 30,
            'status' => 'Bidan',
        ]);

        // Create 1 active v68 result and 1 soft-deleted v68 result
        $activeResult = $respondent->results()->create([
            'version' => 'v68',
            'score_total' => 6,
            'problematic_category' => 6,
            'stress_level' => 'sedang',
            'wfc_index' => 3,
            'stress_index' => 2,
            'score_category' => ['I' => 'Sedang'],
            'score_details' => [
                'stressAppraisalSubscales' => [
                    'challenge' => ['rawAverage' => 2.5],
                    'centrality' => ['rawAverage' => 3.0],
                    'controllable_by_self' => ['rawAverage' => 2.0],
                    'controllable_others' => ['rawAverage' => 1.5],
                    'stressfullness' => ['rawAverage' => 2.8],
                ]
            ],
        ]);

        $deletedResult = $respondent->results()->create([
            'version' => 'v68',
            'score_total' => 15,
            'problematic_category' => 15,
            'stress_level' => 'tinggi',
            'wfc_index' => 5,
            'stress_index' => 4,
            'score_category' => ['I' => 'Tinggi'],
            'score_details' => [
                'stressAppraisalSubscales' => [
                    'challenge' => ['rawAverage' => 4.0],
                    'centrality' => ['rawAverage' => 4.0],
                    'controllable_by_self' => ['rawAverage' => 4.0],
                    'controllable_others' => ['rawAverage' => 4.0],
                    'stressfullness' => ['rawAverage' => 4.0],
                ]
            ],
        ]);

        // Soft delete the second result
        $deletedResult->delete();

        // Dashboard index check
        $dashboardResponse = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->getJson('/api/results?version=all');
        $dashboardResponse->assertStatus(200);
        $dashboardData = $dashboardResponse->json();
        $this->assertCount(1, $dashboardData);
        $this->assertEquals($activeResult->id, $dashboardData[0]['id']);

        // Norms check
        $normsResponse = $this->getJson('/api/norms');
        $normsResponse->assertStatus(200);
        $normsData = $normsResponse->json();
        // Sample size must only count active records (1, not 2)
        $this->assertEquals(1, $normsData['sampleSize']);
    }

    public function test_bulk_destroy_soft_deletes_multiple()
    {
        $resp1 = Respondent::create(['name' => 'Resp 1', 'age' => 25, 'status' => 'Staf']);
        $resp2 = Respondent::create(['name' => 'Resp 2', 'age' => 26, 'status' => 'Staf']);

        $res1 = $resp1->results()->create([
            'version' => 'v68',
            'score_total' => 4,
            'problematic_category' => 4,
            'stress_level' => 'rendah',
            'wfc_index' => 2,
            'score_category' => [],
            'score_details' => [],
        ]);

        $res2 = $resp2->results()->create([
            'version' => 'legacy',
            'score_total' => 8,
            'problematic_category' => 8,
            'stress_level' => 'sedang',
            'wfc_index' => 3,
            'score_category' => [],
            'score_details' => [],
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->token)
            ->postJson('/api/results/bulk-delete', [
                'ids' => [$res1->id, $res2->id],
            ]);

        $response->assertStatus(200);
        $this->assertSoftDeleted('results', ['id' => $res1->id]);
        $this->assertSoftDeleted('results', ['id' => $res2->id]);
        $this->assertSoftDeleted('respondents', ['id' => $resp1->id]);
        $this->assertSoftDeleted('respondents', ['id' => $resp2->id]);
    }

    public function test_soft_deleted_respondent_is_not_restored_on_new_store()
    {
        // 1. Buat responden awal dan soft-delete
        $oldResp = Respondent::create([
            'name' => 'Fatimah',
            'age' => 29,
            'status' => 'Akuntan',
        ]);
        $oldRespId = $oldResp->id;
        $oldResp->delete();

        $this->assertSoftDeleted('respondents', ['id' => $oldRespId]);

        // 2. Responden dengan nama, umur, dan status sama mengisi kuesioner baru
        $payload = [
            'name' => 'Fatimah',
            'age' => 29,
            'status' => 'Akuntan',
            'problematic_category' => 2,
            'score_total' => 2,
            'stress_level' => 'rendah',
            'wfc_index' => null,
            'stress_index' => null,
            'score_category' => ['I' => 'Ringan'],
            'score_details' => ['Kelompok_1' => ['score' => 1]],
        ];

        $response = $this->postJson('/api/respondent', $payload);
        $response->assertStatus(201);

        $newRespId = $response->json('id');

        // Pastikan record responden baru dibuat (ID berbeda)
        $this->assertNotEquals($oldRespId, $newRespId);

        // Pastikan responden lama TETAP soft-deleted (TIDAK dipulihkan/restore)
        $this->assertSoftDeleted('respondents', ['id' => $oldRespId]);

        // Pastikan responden baru aktif
        $newResp = Respondent::find($newRespId);
        $this->assertNotNull($newResp);
        $this->assertNull($newResp->deleted_at);
        $this->assertEquals('Fatimah', $newResp->name);
    }
}
