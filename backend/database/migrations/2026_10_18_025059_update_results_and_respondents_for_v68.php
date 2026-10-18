<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (!Schema::hasColumn('results', 'version')) {
                $table->string('version', 20)->default('v68')->after('respondent_id');
            }
            if (!Schema::hasColumn('results', 'answers')) {
                $table->json('answers')->nullable()->after('score_details');
            }
        });

        // Mark all existing legacy data as 'legacy'
        DB::table('results')->update(['version' => 'legacy']);

        Schema::table('respondents', function (Blueprint $table) {
            if (!Schema::hasColumn('respondents', 'education')) {
                $table->string('education', 50)->nullable()->after('age');
            }
            if (!Schema::hasColumn('respondents', 'marital_status')) {
                $table->string('marital_status', 50)->nullable()->after('status');
            }
            if (!Schema::hasColumn('respondents', 'work_period')) {
                $table->string('work_period', 50)->nullable()->after('marital_status');
            }
            if (!Schema::hasColumn('respondents', 'smoking')) {
                $table->string('smoking', 20)->nullable()->after('work_period');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (Schema::hasColumn('results', 'version')) {
                $table->dropColumn('version');
            }
            if (Schema::hasColumn('results', 'answers')) {
                $table->dropColumn('answers');
            }
        });

        Schema::table('respondents', function (Blueprint $table) {
            $table->dropColumn(['education', 'marital_status', 'work_period', 'smoking']);
        });
    }
};
