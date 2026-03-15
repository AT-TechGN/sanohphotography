<?php

namespace App\Controller\Api;

use App\Entity\Booking;
use App\Enum\BookingStatus;
use App\Repository\BookingRepository;
use App\Repository\ServiceRepository;
use App\Service\BookingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/bookings')]
final class BookingController extends AbstractController
{
    public function __construct(
        private BookingRepository $bookingRepository,
        private ServiceRepository $serviceRepository,
        private BookingService $bookingService,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator
    ) {}

    /**
     * Obtenir les créneaux disponibles pour un service
     * Endpoint clé du tunnel de réservation (étape 2)
     */
    #[Route('/available-slots', name: 'api_bookings_available_slots', methods: ['GET'])]
    public function getAvailableSlots(Request $request): JsonResponse
    {
        $serviceId = $request->query->get('service_id');
        $date = $request->query->get('date'); // Format: Y-m-d

        if (!$serviceId || !$date) {
            return $this->json([
                'error' => 'Les paramètres service_id et date sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        $service = $this->serviceRepository->find($serviceId);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        try {
            $dateObj = new \DateTime($date);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Ne pas permettre de réserver dans le passé
        $today = new \DateTime('today');
        if ($dateObj < $today) {
            return $this->json([
                'error' => 'Impossible de réserver dans le passé'
            ], Response::HTTP_BAD_REQUEST);
        }

        $slots = $this->bookingService->getAvailableSlots($service, $dateObj);

        return $this->json([
            'date' => $date,
            'service' => [
                'id' => $service->getId(),
                'name' => $service->getName(),
                'duration' => $service->getDurationMin(),
            ],
            'slots' => $slots
        ]);
    }

    /**
     * Créer une nouvelle réservation (tunnel étape 5)
     */
    #[Route('', name: 'api_booking_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $data = json_decode($request->getContent(), true);

        // Validation des données
        if (!isset($data['service_id'], $data['scheduled_date'], $data['scheduled_time'])) {
            return $this->json([
                'error' => 'Les champs service_id, scheduled_date et scheduled_time sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        $service = $this->serviceRepository->find($data['service_id']);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        try {
            $scheduledDate = new \DateTime($data['scheduled_date']);
            $scheduledTime = new \DateTime($data['scheduled_time']);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date/heure invalide'], Response::HTTP_BAD_REQUEST);
        }

        // Créer la réservation - CORRIGÉ pour matcher entité Booking
        $booking = new Booking();
        $booking->setService($service);
        $booking->setClient($this->getUser());
        $booking->setBookingDate($scheduledDate);
        $booking->setStartTime($scheduledTime);
        $booking->setStatus(BookingStatus::PENDING->value);
        // participants → converti en clientNotes (intangible pour l'instant)
        $clientNotes = ($data['participants'] ?? 1) . ' participant(s)';
        if (!empty($data['notes'])) {
            $clientNotes .= ' - Notes: ' . $data['notes'];
        }
        $booking->setClientNotes($clientNotes ?: null);
        $booking->setTotalPrice($data['total_price'] ?? $service->getBasePrice());
        $booking->setCreatedAt(new \DateTime());
        
        // Calcul endTime = startTime + durée service
        $endTime = clone $scheduledTime;
        $endTime->add(new \DateInterval('PT' . $service->getDurationMin() . 'M'));
        $booking->setEndTime($endTime);

        // Assigner automatiquement un employé disponible
        $employee = $this->bookingService->assignEmployee($booking);
        if (!$employee) {
            return $this->json([
                'error' => 'Aucun employé disponible pour ce créneau'
            ], Response::HTTP_CONFLICT);
        }
        $booking->setEmployee($employee);

        // Validation
        $errors = $this->validator->validate($booking);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($booking);
        $this->em->flush();

        // TODO: Envoyer email de confirmation

        return $this->json([
            'message' => 'Réservation créée avec succès',
            'booking' => $booking
        ], Response::HTTP_CREATED, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Obtenir les réservations du client connecté
     */
    #[Route('/my-bookings', name: 'api_my_bookings', methods: ['GET'])]
    public function getMyBookings(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $status = $request->query->get('status');
        $criteria = ['client' => $this->getUser()];
        
        if ($status) {
            $criteria['status'] = $status;
        }

        $bookings = $this->bookingRepository->findBy(
            $criteria,
            ['scheduledDate' => 'DESC', 'scheduledTime' => 'DESC']
        );

        return $this->json($bookings, Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Confirmer une réservation (photographe)
     */
    #[Route('/{id}/confirm', name: 'api_booking_confirm', methods: ['PATCH'])]
    public function confirm(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $booking = $this->bookingRepository->find($id);
        
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($booking->getStatus() !== BookingStatus::PENDING->value) {
            return $this->json([
                'error' => 'Seules les réservations en attente peuvent être confirmées'
            ], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::CONFIRMED->value);
        $booking->setConfirmedAt(new \DateTime());
        $this->em->flush();

        // TODO: Envoyer email de confirmation au client

        return $this->json([
            'message' => 'Réservation confirmée',
            'booking' => $booking
        ], Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Annuler une réservation
     */
    #[Route('/{id}/cancel', name: 'api_booking_cancel', methods: ['PATCH'])]
    public function cancel(int $id, Request $request): JsonResponse
    {
        $booking = $this->bookingRepository->find($id);
        
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions
        $user = $this->getUser();
        $isOwner = $booking->getClient() === $user;
        $isPhotographe = $this->isGranted('ROLE_PHOTOGRAPHE');

        if (!$isOwner && !$isPhotographe) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        $statusEnum = BookingStatus::from($booking->getStatus());
        if (!$statusEnum->canBeCancelled()) {
            return $this->json([
                'error' => 'Cette réservation ne peut plus être annulée'
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);
        $booking->setStatus(BookingStatus::CANCELLED->value);
        $booking->setCancellationReason($data['reason'] ?? null);
        $booking->setCancelledAt(new \DateTime());
        $this->em->flush();

        // TODO: Envoyer email d'annulation

        return $this->json([
            'message' => 'Réservation annulée',
            'booking' => $booking
        ], Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Passer une réservation en cours
     */
    #[Route('/{id}/start', name: 'api_booking_start', methods: ['PATCH'])]
    public function start(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_EMPLOYE');

        $booking = $this->bookingRepository->find($id);
        
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($booking->getStatus() !== BookingStatus::CONFIRMED->value) {
            return $this->json([
                'error' => 'Seules les réservations confirmées peuvent être démarrées'
            ], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::IN_PROGRESS->value);
        $this->em->flush();

        return $this->json([
            'message' => 'Séance démarrée',
            'booking' => $booking
        ], Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Terminer une réservation
     */
    #[Route('/{id}/complete', name: 'api_booking_complete', methods: ['PATCH'])]
    public function complete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_EMPLOYE');

        $booking = $this->bookingRepository->find($id);
        
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($booking->getStatus() !== BookingStatus::IN_PROGRESS->value) {
            return $this->json([
                'error' => 'Seules les réservations en cours peuvent être terminées'
            ], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::COMPLETED->value);
        $booking->setCompletedAt(new \DateTime());
        $this->em->flush();

        return $this->json([
            'message' => 'Séance terminée',
            'booking' => $booking
        ], Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Vue calendrier des réservations (admin)
     */
    #[Route('/calendar', name: 'api_bookings_calendar', methods: ['GET'])]
    public function getCalendar(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $startDate = $request->query->get('start_date');
        $endDate = $request->query->get('end_date');

        if (!$startDate || !$endDate) {
            return $this->json([
                'error' => 'Les paramètres start_date et end_date sont requis'
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $start = new \DateTime($startDate);
            $end = new \DateTime($endDate);
        } catch (\Exception $e) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }

        $bookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.scheduledDate BETWEEN :start AND :end')
            ->andWhere('b.status != :cancelled')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->orderBy('b.scheduledDate', 'ASC')
            ->addOrderBy('b.scheduledTime', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->json($bookings, Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }

    /**
     * Statistiques des réservations
     */
    #[Route('/stats', name: 'api_bookings_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today = new \DateTime('today');
        $thisMonth = new \DateTime('first day of this month');

        // Réservations du jour
        $todayBookings = $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.scheduledDate = :today')
            ->andWhere('b.status != :cancelled')
            ->setParameter('today', $today)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()
            ->getSingleScalarResult();

        // Réservations du mois
        $monthBookings = $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.scheduledDate >= :month')
            ->andWhere('b.status != :cancelled')
            ->setParameter('month', $thisMonth)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()
            ->getSingleScalarResult();

        // En attente de confirmation
        $pendingBookings = $this->bookingRepository->count([
            'status' => BookingStatus::PENDING->value
        ]);

        // Répartition par statut
        $statusDistribution = [];
        foreach (BookingStatus::cases() as $status) {
            $count = $this->bookingRepository->count(['status' => $status->value]);
            $statusDistribution[$status->value] = $count;
        }

        return $this->json([
            'todayBookings' => (int) $todayBookings,
            'monthBookings' => (int) $monthBookings,
            'pendingBookings' => $pendingBookings,
            'statusDistribution' => $statusDistribution
        ]);
    }

    /**
     * Lister toutes les réservations (Admin)
     * Supporte filtres: status, start_date, end_date
     */
    #[Route('/admin/bookings', name: 'api_admin_bookings_list', methods: ['GET'])]
    public function getAllBookingsAdmin(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $status = $request->query->get('status');
        $startDate = $request->query->get('start_date');
        $endDate = $request->query->get('end_date');

        $qb = $this->bookingRepository->createQueryBuilder('b')
            ->orderBy('b.bookingDate', 'DESC')
            ->addOrderBy('b.startTime', 'DESC');

        if ($status && $status !== 'all') {
            $qb->andWhere('b.status = :status')
               ->setParameter('status', $status);
        }

        if ($startDate) {
            $qb->andWhere('b.bookingDate >= :start_date')
               ->setParameter('start_date', $startDate);
        }

        if ($endDate) {
            $qb->andWhere('b.bookingDate <= :end_date')
               ->setParameter('end_date', $endDate);
        }

        $bookings = $qb->getQuery()->getResult();

        return $this->json($bookings, Response::HTTP_OK, [], [
            'groups' => ['booking:read']
        ]);
    }
}
