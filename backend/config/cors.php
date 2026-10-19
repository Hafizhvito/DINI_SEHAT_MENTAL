<?php
// config/cors.php
// Buat file baru ini di folder config/

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => [
        'api/*',
        'sanctum/csrf-cookie'
    ],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://streskerjaperempuan.com',
        'https://www.streskerjaperempuan.com',
        'https://api.streskerjaperempuan.com',
        'http://streskerjaperempuan.com',
        'https://skriningstreskerjaperempuan.com',
        'https://www.skriningstreskerjaperempuan.com',
        'http://skriningstreskerjaperempuan.com',
        'http://localhost',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];