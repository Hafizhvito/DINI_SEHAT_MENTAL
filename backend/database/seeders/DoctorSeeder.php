<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Doctor;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        Doctor::updateOrCreate(
            ['username' => 'admin'],
            [
                'name' => 'Admin Dokter',
                'password' => Hash::make('dokterhebat123!'),
            ]
        );
    }
}
