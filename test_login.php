<?php
// Test login with different user roles
$baseUrl = 'http://localhost';
$loginUrl = $baseUrl . '/sanohphotography/photobook-api/public/index.php/api/login';

$testUsers = [
    ['email' => 'admin@photobook.com', 'password' => 'admin123', 'role' => 'Admin'],
    ['email' => 'photographe@photobook.com', 'password' => 'photo123', 'role' => 'Photographe'],
    ['email' => 'mamadou.diallo@example.com', 'password' => 'client123', 'role' => 'Client'],
];

echo "=== Testing login with different roles ===\n\n";

foreach ($testUsers as $user) {
    echo "Testing {$user['role']}: {$user['email']}\n";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $loginUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'email' => $user['email'],
        'password' => $user['password']
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Accept: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    
    $response = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($statusCode === 200 && isset($data['token'])) {
        echo "  ✓ Status: $statusCode - Token received!\n";
    } else {
        echo "  ✗ Status: $statusCode - Error: " . ($data['error'] ?? 'Unknown') . "\n";
    }
    echo "\n";
}

