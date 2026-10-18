<?php

namespace App\Http\Controllers;

use App\Models\Result;
use App\Models\Respondent;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // Secara default hanya menampilkan data v68 sesuai aturan
        $version = $request->query('version', 'v68');

        $query = Result::with('respondent')->latest();

        if ($version !== 'all') {
            $query->where('version', $version);
        }

        $results = $query->get();

        return response()->json($results);
    }

    /**
     * Hapus satu riwayat hasil skrining
     */
    public function destroy($id)
    {
        $result = Result::findOrFail($id);
        $respondentId = $result->respondent_id;

        // Hapus result
        $result->delete();

        // Hapus respondent jika tidak ada result lain yang tersambung
        if ($respondentId) {
            $otherResultsCount = Result::where('respondent_id', $respondentId)->count();
            if ($otherResultsCount === 0) {
                $resp = Respondent::find($respondentId);
                if ($resp) {
                    $resp->delete();
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Data riwayat berhasil dihapus.'
        ]);
    }

    /**
     * Hapus banyak riwayat hasil skrining sekaligus
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        $ids = $request->input('ids');
        $results = Result::whereIn('id', $ids)->get();
        $respondentIds = $results->pluck('respondent_id')->filter()->unique();

        // Hapus results
        Result::whereIn('id', $ids)->delete();

        // Bersihkan respondent yang tidak lagi memiliki result
        foreach ($respondentIds as $respId) {
            $otherCount = Result::where('respondent_id', $respId)->count();
            if ($otherCount === 0) {
                $resp = Respondent::find($respId);
                if ($resp) {
                    $resp->delete();
                }
            }
        }

        return response()->json([
            'success' => true,
            'message' => count($ids) . ' data riwayat berhasil dihapus.'
        ]);
    }
}
