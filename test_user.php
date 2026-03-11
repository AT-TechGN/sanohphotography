<?php
require __DIR__ . '/photobook-api/vendor/autoload.php';

use App\Kernel;
use Symfony\Component\HttpFoundation\Request;

$kernel = new Kernel('dev', true);
$kernel->boot();

$container = $kernel->getContainer();
$em = $container->get('doctrine')->getManager();

$user = $em->getRepository('App\Entity\User')->findOneBy(['email' => 'mamadou.diallo@example.com']);

if ($user) {
    echo "User found: " . $user->getEmail() . PHP_EOL;
    echo "Is Active: " . ($user->isActive() ? 'Yes' : 'No') . PHP_EOL;
    echo "Roles: " . implode(', ', $user->getRoles()) . PHP_EOL;
    echo "Password length: " . strlen($user->getPassword()) . PHP_EOL;
    
    // Test password verification
    $hasher = $container->get('security.user_password_hasher');
    if ($hasher->isPasswordValid($user, 'client123')) {
        echo "Password valid: YES" . PHP_EOL;
    } else {
        echo "Password valid: NO" . PHP_EOL;
    }
} else {
    echo "User not found!" . PHP_EOL;
}

