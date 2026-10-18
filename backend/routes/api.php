<?php
// api.php
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\RespondentController;
use App\Http\Controllers\DoctorAuthController;
use App\Http\Controllers\ResultController;
use Illuminate\Support\Facades\Route;

// Routes untuk respondent (public)
Route::post('/respondent', [RespondentController::class, 'store']);
Route::get('/results/{respondentId}', [RespondentController::class, 'show']);
Route::get('/norms', [RespondentController::class, 'getNorms']);

// Routes untuk doctor authentication  
Route::post('/doctor/login', [DoctorAuthController::class, 'login']);
Route::post('/doctor/register', [DoctorAuthController::class, 'register']);

// Routes yang butuh authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/doctor/logout', [DoctorAuthController::class, 'logout']);
    Route::get('/results', [DashboardController::class, 'index']); // untuk dashboard doctor
    Route::delete('/results/{id}', [DashboardController::class, 'destroy']);
    Route::post('/results/bulk-delete', [DashboardController::class, 'bulkDestroy']);
    Route::get('/doctors', [DoctorAuthController::class, 'index']);
});