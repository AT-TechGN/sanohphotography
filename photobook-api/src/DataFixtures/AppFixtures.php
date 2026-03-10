<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Service;
use App\Entity\Employee;
use App\Entity\Availability;
use App\Entity\Review;
use App\Enum\ReviewStatus;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // Créer les utilisateurs de test
        $this->createUsers($manager);
        
        // Créer les services
        $this->createServices($manager);
        
        // Créer les employés
        $this->createEmployees($manager);
        
        // Créer des avis de test
        $this->createReviews($manager);

        $manager->flush();
    }

    private function createUsers(ObjectManager $manager): void
    {
        // Admin
        $admin = new User();
        $admin->setEmail('admin@photobook.com');
        $admin->setFirstName('Admin');
        $admin->setLastName('PhotoBook');
        $admin->setPhone('+224620000001');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setIsActive(true);
        $admin->setCreatedAt(new \DateTime());
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin123'));
        $manager->persist($admin);

        // Photographe
        $photographe = new User();
        $photographe->setEmail('photographe@photobook.com');
        $photographe->setFirstName('Marie');
        $photographe->setLastName('Camara');
        $photographe->setPhone('+224620000002');
        $photographe->setRoles(['ROLE_PHOTOGRAPHE']);
        $photographe->setIsActive(true);
        $photographe->setCreatedAt(new \DateTime());
        $photographe->setPassword($this->passwordHasher->hashPassword($photographe, 'photo123'));
        $manager->persist($photographe);

        // Clients de test
        $clients = [
            ['Mamadou', 'Diallo', 'mamadou.diallo@example.com', '+224620111111'],
            ['Fatoumata', 'Bah', 'fatoumata.bah@example.com', '+224620222222'],
            ['Ibrahima', 'Sow', 'ibrahima.sow@example.com', '+224620333333'],
            ['Aissatou', 'Diaby', 'aissatou.diaby@example.com', '+224620444444'],
            ['Mohamed', 'Konate', 'mohamed.konate@example.com', '+224620555555'],
        ];

        foreach ($clients as $clientData) {
            $client = new User();
            $client->setEmail($clientData[2]);
            $client->setFirstName($clientData[0]);
            $client->setLastName($clientData[1]);
            $client->setPhone($clientData[3]);
            $client->setRoles(['ROLE_CLIENT']);
            $client->setIsActive(true);
            $client->setCreatedAt(new \DateTime('-' . rand(1, 90) . ' days'));
            $client->setPassword($this->passwordHasher->hashPassword($client, 'client123'));
            $manager->persist($client);
        }
    }

    private function createServices(ObjectManager $manager): void
    {
        $services = [
            // Catégorie Événementielle
            [
                'name' => 'Mariage Complet',
                'category' => 'mariage',
                'description' => 'Couverture complète de votre mariage, de la préparation à la soirée. Inclut 2 photographes, retouches premium et album photo luxe.',
                'duration' => 480,
                'price' => 3500000,
                'maxParticipants' => 200,
                'sortOrder' => 1
            ],
            [
                'name' => 'Baptême',
                'category' => 'bapteme',
                'description' => 'Immortalisez ce moment unique avec des photos professionnelles de la cérémonie et de la réception.',
                'duration' => 180,
                'price' => 800000,
                'maxParticipants' => 50,
                'sortOrder' => 2
            ],
            [
                'name' => 'Anniversaire',
                'category' => 'anniversaire',
                'description' => 'Photos souvenirs de votre fête d\'anniversaire, décoration et moments forts.',
                'duration' => 120,
                'price' => 500000,
                'maxParticipants' => 100,
                'sortOrder' => 3
            ],
            
            // Catégorie Commerciale
            [
                'name' => 'Shooting Mode',
                'category' => 'mode',
                'description' => 'Séance photo professionnelle pour lookbook, catalogue mode ou portfolio mannequin.',
                'duration' => 180,
                'price' => 1200000,
                'maxParticipants' => 5,
                'sortOrder' => 4
            ],
            [
                'name' => 'Photo Corporate',
                'category' => 'corporate',
                'description' => 'Photos professionnelles pour votre entreprise : portraits, équipe, locaux.',
                'duration' => 120,
                'price' => 900000,
                'maxParticipants' => 20,
                'sortOrder' => 5
            ],
            [
                'name' => 'Catalogue Produits',
                'category' => 'catalogue',
                'description' => 'Mise en valeur de vos produits avec fond blanc ou mise en scène personnalisée.',
                'duration' => 90,
                'price' => 600000,
                'maxParticipants' => null,
                'sortOrder' => 6
            ],
            
            // Catégorie Personnelle
            [
                'name' => 'Portrait Individuel',
                'category' => 'portrait',
                'description' => 'Séance photo portrait en studio ou extérieur. Retouches incluses.',
                'duration' => 60,
                'price' => 350000,
                'maxParticipants' => 1,
                'sortOrder' => 7
            ],
            [
                'name' => 'Grossesse & Maternité',
                'category' => 'grossesse',
                'description' => 'Sublimez votre grossesse avec une séance photo artistique et émouvante.',
                'duration' => 90,
                'price' => 500000,
                'maxParticipants' => 2,
                'sortOrder' => 8
            ],
            [
                'name' => 'Photo de Famille',
                'category' => 'famille',
                'description' => 'Séance photo conviviale pour immortaliser votre famille.',
                'duration' => 90,
                'price' => 450000,
                'maxParticipants' => 10,
                'sortOrder' => 9
            ],
            [
                'name' => 'Book Artistique',
                'category' => 'book_artistique',
                'description' => 'Créez votre book professionnel avec un shooting artistique personnalisé.',
                'duration' => 120,
                'price' => 750000,
                'maxParticipants' => 1,
                'sortOrder' => 10
            ],
        ];

        foreach ($services as $serviceData) {
            $service = new Service();
            $service->setName($serviceData['name']);
            $service->setCategory($serviceData['category']);
            $service->setDescription($serviceData['description']);
            $service->setDurationMin($serviceData['duration']);
            $service->setBasePrice($serviceData['price']);
            $service->setMaxParticipants($serviceData['maxParticipants']);
            $service->setIsActive(true);
            $service->setSortOrder($serviceData['sortOrder']);
            $manager->persist($service);
        }
    }

    private function createEmployees(ObjectManager $manager): void
    {
        $employees = [
            [
                'firstName' => 'Amadou',
                'lastName' => 'Barry',
                'email' => 'amadou.barry@photobook.com',
                'phone' => '+224620777777',
                'position' => 'Photographe Principal',
                'hourlyRate' => 50000
            ],
            [
                'firstName' => 'Kadiatou',
                'lastName' => 'Sylla',
                'email' => 'kadiatou.sylla@photobook.com',
                'phone' => '+224620888888',
                'position' => 'Assistante Photo',
                'hourlyRate' => 30000
            ],
            [
                'firstName' => 'Ousmane',
                'lastName' => 'Toure',
                'email' => 'ousmane.toure@photobook.com',
                'phone' => '+224620999999',
                'position' => 'Retoucheur',
                'hourlyRate' => 35000
            ],
        ];

        foreach ($employees as $empData) {
            $employee = new Employee();
            $employee->setFirstName($empData['firstName']);
            $employee->setLastName($empData['lastName']);
            $employee->setEmail($empData['email']);
            $employee->setPhone($empData['phone']);
            $employee->setPosition($empData['position']);
            $employee->setHourlyRate($empData['hourlyRate']);
            $employee->setIsActive(true);
            $employee->setHiredAt(new \DateTime('-' . rand(180, 730) . ' days'));
            $manager->persist($employee);

            // Ajouter des disponibilités (Lundi à Vendredi, 9h-18h)
            for ($day = 1; $day <= 5; $day++) {
                $availability = new Availability();
                $availability->setEmployee($employee);
                $availability->setDayOfWeek($day);
                $availability->setStartTime(new \DateTime('09:00'));
                $availability->setEndTime(new \DateTime('18:00'));
                $manager->persist($availability);
            }
        }
    }

    private function createReviews(ObjectManager $manager): void
    {
        // Récupérer un client pour les avis
        $clients = $manager->getRepository(User::class)->findAll();
        $clientsWithRole = array_filter($clients, function($user) {
            return in_array('ROLE_CLIENT', $user->getRoles());
        });

        if (empty($clientsWithRole)) {
            return;
        }

        $reviews = [
            [
                'rating' => 5,
                'title' => 'Photographe exceptionnel !',
                'content' => 'Les photos de notre mariage sont absolument magnifiques. Marie a su capturer tous les moments importants avec beaucoup de professionnalisme et de sensibilité. Je recommande vivement !',
                'isFeatured' => true
            ],
            [
                'rating' => 5,
                'title' => 'Très satisfait',
                'content' => 'Excellent service pour notre shooting corporate. Les photos sont de qualité professionnelle et ont été livrées dans les délais. Merci beaucoup !',
                'isFeatured' => true
            ],
            [
                'rating' => 4,
                'title' => 'Bonne expérience',
                'content' => 'Séance photo de famille très agréable. Le photographe a su mettre tout le monde à l\'aise, même les enfants. Quelques retouches auraient pu être meilleures mais dans l\'ensemble très content.',
                'isFeatured' => false
            ],
            [
                'rating' => 5,
                'title' => 'Photos de grossesse magnifiques',
                'content' => 'Un grand merci pour ces magnifiques photos de ma grossesse. C\'est un souvenir que je chérirai toute ma vie. Le studio est également très accueillant.',
                'isFeatured' => true
            ],
            [
                'rating' => 4,
                'title' => 'Bon rapport qualité/prix',
                'content' => 'Service correct, photos de bonne qualité. Le délai de livraison était un peu long mais le résultat final en valait la peine.',
                'isFeatured' => false
            ],
        ];

        $clientIndex = 0;
        foreach ($reviews as $reviewData) {
            $review = new Review();
            $review->setRating($reviewData['rating']);
            $review->setTitle($reviewData['title']);
            $review->setContent($reviewData['content']);
            $review->setStatus(ReviewStatus::APPROVED->value);
            $review->setIsFeatured($reviewData['isFeatured']);
            $review->setCreatedAt(new \DateTime('-' . rand(1, 60) . ' days'));
            $review->setModeratedAt(new \DateTime('-' . rand(1, 30) . ' days'));
            
            // Assigner un client
            $clientsArray = array_values($clientsWithRole);
            $review->setClient($clientsArray[$clientIndex % count($clientsArray)]);
            $clientIndex++;

            $manager->persist($review);
        }
    }
}
