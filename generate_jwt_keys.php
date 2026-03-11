<?php
// Set environment for OpenSSL
putenv('OPENSSL_CONF=c:\wamp64\bin\php\php8.3.28\extras\ssl\openssl.cnf');

// Generate JWT key pair using PHP's OpenSSL
$config = array(
    "private_key_bits" => 2048,
    "private_key_type" => OPENSSL_KEYTYPE_RSA,
);

// Generate key pair
$res = openssl_pkey_new($config);

if ($res === false) {
    echo "Failed to generate key pair\n";
    echo "OpenSSL error: " . openssl_error_string() . "\n";
    exit(1);
}

// Check if key was generated
$details = openssl_pkey_get_details($res);
if ($details === false) {
    echo "Failed to get key details\n";
    exit(1);
}

// Export private key
if (!openssl_pkey_export($res, $privateKey, null, $config)) {
    echo "Failed to export private key\n";
    echo "OpenSSL error: " . openssl_error_string() . "\n";
    exit(1);
}

// Save private key
$privateKeyPath = 'c:/wamp64/www/sanohphotography/photobook-api/config/jwt/private.pem';
if (file_put_contents($privateKeyPath, $privateKey) === false) {
    echo "Failed to write private key to: $privateKeyPath\n";
    exit(1);
}

// Save public key
$publicKeyPath = 'c:/wamp64/www/sanohphotography/photobook-api/config/jwt/public.pem';
if (file_put_contents($publicKeyPath, $details['key']) === false) {
    echo "Failed to write public key to: $publicKeyPath\n";
    exit(1);
}

echo "JWT keys generated successfully!\n";
echo "Private key: $privateKeyPath\n";
echo "Public key: $publicKeyPath\n";

// Verify the keys
$verifyPrivate = openssl_pkey_get_private('file://' . $privateKeyPath);
$verifyPublic = openssl_pkey_get_public('file://' . $publicKeyPath);

if ($verifyPrivate && $verifyPublic) {
    echo "Keys verified successfully!\n";
} else {
    echo "Warning: Key verification failed\n";
}

