<?php

namespace App\Command;

use App\Entity\User;
use App\Entity\Employee;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[\Symfony\Component\Console\Attribute\AsCommand(
    name: 'app:create-user',
    description: 'Create users with different roles (admin, client, employee)',
)]
class CreateUserCommand extends Command
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('type', InputArgument::REQUIRED, 'User type: admin, client, employee, or demo')
            ->addArgument('email', InputArgument::OPTIONAL, 'Email address')
            ->addArgument('password', InputArgument::OPTIONAL, 'Password')
            ->addArgument('firstName', InputArgument::OPTIONAL, 'First name')
            ->addArgument('lastName', InputArgument::OPTIONAL, 'Last name')
            ->addOption('phone', 'p', InputOption::VALUE_OPTIONAL, 'Phone number')
            ->addOption('position', null, InputOption::VALUE_OPTIONAL, 'Position (for employee)')
            ->addOption('bio', null, InputOption::VALUE_OPTIONAL, 'Bio (for employee)')
            ->addOption('count', 'c', InputOption::VALUE_OPTIONAL, 'Number of demo users to create', 5);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $type = $input->getArgument('type');
        
        // Map user types to roles
        $roleMap = [
            'admin' => ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE'],
            'client' => ['ROLE_CLIENT'],
            'employee' => ['ROLE_PHOTOGRAPHE'],
            'photographe' => ['ROLE_PHOTOGRAPHE'],
            'demo' => ['ROLE_CLIENT'],
        ];

        if (!isset($roleMap[$type]) && $type !== 'demo') {
            $io->error('Invalid user type. Use: admin, client, employee, or demo');
            return Command::FAILURE;
        }

        if ($type === 'demo') {
            return $this->createDemoUsers($input, $output, $io);
        }

        $email = $input->getArgument('email');
        $password = $input->getArgument('password');
        $firstName = $input->getArgument('firstName');
        $lastName = $input->getArgument('lastName');
        $phone = $input->getOption('phone');

        // Default values if not provided
        if (!$email) {
            $email = $io->ask('Email address', 'admin@photobook.com');
        }
        if (!$password) {
            $password = $io->askHidden('Password (hidden)', function ($password) {
                return $password ?: 'password123';
            });
        }
        if (!$firstName) {
            $firstName = $io->ask('First name', 'Admin');
        }
        if (!$lastName) {
            $lastName = $io->ask('Last name', 'User');
        }

        // Check if user already exists
        $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]);
        if ($existingUser) {
            $io->error("User with email $email already exists!");
            return Command::FAILURE;
        }

        // Create user
        $user = new User();
        $user->setEmail($email);
        $user->setFirstName($firstName);
        $user->setLastName($lastName);
        $user->setPhone($phone);
        $user->setIsActive(true);
        $user->setCreatedAt(new \DateTime());
        $user->setRoles($roleMap[$type]);

        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword($user, $password);
        $user->setPassword($hashedPassword);

        // Save user
        $this->entityManager->persist($user);

        // Create employee record if needed
        if (in_array($type, ['employee', 'photographe'])) {
            $employee = new Employee();
            $employee->setUser($user);
            $employee->setPosition($input->getOption('position') ?: 'Photographe');
            $employee->setContractType('CDI');
            $employee->setHourlyRate('50000');
            $employee->setHireDate(new \DateTime());
            $employee->setIsActive(true);
            $employee->setBio($input->getOption('bio') ?: 'Photographe professionnel');
            $employee->setSpecializations(['Mariage', 'Portrait', 'Événementiel']);

            $this->entityManager->persist($employee);
        }

        $this->entityManager->flush();

        $io->success([
            "User created successfully!",
            "Email: $email",
            "Type: $type",
            "Roles: " . implode(', ', $roleMap[$type]),
        ]);

        return Command::SUCCESS;
    }

    private function createDemoUsers(InputInterface $input, OutputInterface $output, SymfonyStyle $io): int
    {
        $io->info("Creating demo users...");

        $demoUsers = [
            [
                'email' => 'admin@photobook.com',
                'password' => 'admin123',
                'firstName' => 'Admin',
                'lastName' => 'System',
                'roles' => ['ROLE_ADMIN', 'ROLE_PHOTOGRAPHE'],
            ],
            [
                'email' => 'photographe@photobook.com',
                'password' => 'photo123',
                'firstName' => 'Mamadou',
                'lastName' => 'Diallo',
                'roles' => ['ROLE_PHOTOGRAPHE'],
            ],
            [
                'email' => 'mamadou.diallo@example.com',
                'password' => 'client123',
                'firstName' => 'Mamadou',
                'lastName' => 'Diallo',
                'roles' => ['ROLE_CLIENT'],
            ],
            [
                'email' => 'fatou.bah@example.com',
                'password' => 'client123',
                'firstName' => 'Fatou',
                'lastName' => 'Bah',
                'roles' => ['ROLE_CLIENT'],
            ],
            [
                'email' => 'alpha.diop@example.com',
                'password' => 'client123',
                'firstName' => 'Alpha',
                'lastName' => 'Diop',
                'roles' => ['ROLE_CLIENT'],
            ],
            [
                'email' => 'mariama.sow@example.com',
                'password' => 'client123',
                'firstName' => 'Mariama',
                'lastName' => 'Sow',
                'roles' => ['ROLE_CLIENT'],
            ],
        ];

        $created = 0;
        foreach ($demoUsers as $userData) {
            // Check if user already exists
            $existingUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => $userData['email']]);
            if ($existingUser) {
                $io->warning("User {$userData['email']} already exists, skipping...");
                continue;
            }

            // Create user
            $user = new User();
            $user->setEmail($userData['email']);
            $user->setFirstName($userData['firstName']);
            $user->setLastName($userData['lastName']);
            $user->setPhone('+224 620 00 00 00');
            $user->setIsActive(true);
            $user->setCreatedAt(new \DateTime());
            $user->setRoles($userData['roles']);

            // Hash password
            $hashedPassword = $this->passwordHasher->hashPassword($user, $userData['password']);
            $user->setPassword($hashedPassword);

            $this->entityManager->persist($user);
            $created++;
            
            $io->info("Created: {$userData['email']} (" . implode(', ', $userData['roles']) . ")");
        }

        // Create employee records for photographers
        $adminUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'admin@photobook.com']);
        if ($adminUser && !$adminUser->getEmployee()) {
            $employee = new Employee();
            $employee->setUser($adminUser);
            $employee->setPosition('Administrateur');
            $employee->setContractType('CDI');
            $employee->setHireDate(new \DateTime());
            $employee->setIsActive(true);
            $employee->setHourlyRate('100000');
            $employee->setBio('Administrateur du système PhotoBook');
            $employee->setSpecializations(['Mariage', 'Portrait', 'Événementiel', 'Studio']);
            $this->entityManager->persist($employee);
        }

        $photoUser = $this->entityManager->getRepository(User::class)->findOneBy(['email' => 'photographe@photobook.com']);
        if ($photoUser && !$photoUser->getEmployee()) {
            $employee = new Employee();
            $employee->setUser($photoUser);
            $employee->setPosition('Photographe');
            $employee->setContractType('CDI');
            $employee->setHireDate(new \DateTime());
            $employee->setIsActive(true);
            $employee->setHourlyRate('75000');
            $employee->setBio('Photographe professionnel spécialisé dans les mariages et portraits');
            $employee->setSpecializations(['Mariage', 'Portrait', 'Événementiel']);
            $this->entityManager->persist($employee);
        }

        $this->entityManager->flush();

        $io->success("Created $created demo users successfully!");
        
        $io->writeln('');
        $io->info('Demo accounts created:');
        $io->table(['Email', 'Password', 'Roles'], [
            ['admin@photobook.com', 'admin123', 'ROLE_ADMIN, ROLE_PHOTOGRAPHE'],
            ['photographe@photobook.com', 'photo123', 'ROLE_PHOTOGRAPHE'],
            ['mamadou.diallo@example.com', 'client123', 'ROLE_CLIENT'],
            ['fatou.bah@example.com', 'client123', 'ROLE_CLIENT'],
            ['alpha.diop@example.com', 'client123', 'ROLE_CLIENT'],
            ['mariama.sow@example.com', 'client123', 'ROLE_CLIENT'],
        ]);

        return Command::SUCCESS;
    }
}

