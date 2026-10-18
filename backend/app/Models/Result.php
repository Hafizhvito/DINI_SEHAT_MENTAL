<?php
//  Result.php Model
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Result extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
    'respondent_id',
    'version',
    'score_I', 'score_II', 'score_III', 'score_IV', 'score_V', 
    'score_VI', 'score_VII', 'score_VIII', 'score_IX',
    'problematic_category',
    'score_total',
    'max_score',
    'stress_level',
    'wfc_index',
    'stress_index',
    'score_category',
    'score_details',
    'answers',
];

protected $casts = [
    'score_category' => 'array',
    'score_details' => 'array',
    'answers' => 'array',
    'max_score' => 'integer',
];

    public function respondent()
    {
        return $this->belongsTo(Respondent::class);
    }
}



