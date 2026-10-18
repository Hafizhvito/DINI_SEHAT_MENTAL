<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (!Schema::hasColumn('results', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        Schema::table('respondents', function (Blueprint $table) {
            if (!Schema::hasColumn('respondents', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (Schema::hasColumn('results', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });

        Schema::table('respondents', function (Blueprint $table) {
            if (Schema::hasColumn('respondents', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
