<?php
// Respondent.php Model
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Respondent extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'age',
        'education',
        'status',
        'marital_status',
        'work_period',
        'smoking',
    ];

    public function results()
    {
        return $this->hasMany(Result::class);
    }

}
