<?php

namespace App\Controller\Api;

use App\Entity\Booking;
use App\Enum\BookingStatus;
use App\Repository\BookingRepository;
use App\Repository\ServiceRepository;
use App\Repository\EmployeeRepository;
use App\Service\BookingService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * CORRECTIONS :
 * 1. create() utilisait setScheduledDate/setScheduledTime → l'entité Booking a bookingDate/startTime
 * 2. Ajout des routes admin manquantes : GET /admin/bookings, PATCH status, PATCH assign
 * 3. Ajout route GET /api/bookings/{id} manquante
 */
#[Route('/api/bookings')]
final class BookingController extends AbstractController
{
    public function __construct(
        private BookingRepository  $bookingRepository,
        private ServiceRepository  $serviceRepository,
        private EmployeeRepository $employeeRepository,
        private BookingService     $bookingService,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator
    ) {}

    // ─────────────────────────────────────────────────────────────────────
    // Routes PUBLIQUES / CLIENT
    // ─────────────────────────────────────────────────────────────────────

    /**
     * GET /api/bookings/available-slots?service_id=&date=
     */
    #[Route('/available-slots', name: 'api_bookings_available_slots', methods: ['GET'])]
    public function getAvailableSlots(Request $request): JsonResponse
    {
        $serviceId = $request->query->get('service_id');
        $date      = $request->query->get('date');

        if (!$serviceId || !$date) {
            return $this->json(['error' => 'Les paramètres service_id et date sont requis'], Response::HTTP_BAD_REQUEST);
        }

        $service = $this->serviceRepository->find($serviceId);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        try {
            $dateObj = new \DateTime($date);
        } catch (\Exception) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }

        if ($dateObj < new \DateTime('today')) {
            return $this->json(['error' => 'Impossible de réserver dans le passé'], Response::HTTP_BAD_REQUEST);
        }

        $slots = $this->bookingService->getAvailableSlots($service, $dateObj);

        return $this->json([
            'date'    => $date,
            'service' => ['id' => $service->getId(), 'name' => $service->getName(), 'duration' => $service->getDurationMin()],
            'slots'   => $slots,
        ]);
    }

    /**
     * POST /api/bookings — Créer une réservation (client)
     *
     * CORRECTION 1 : setScheduledDate/setScheduledTime n'existent pas sur l'entité Booking.
     * Les vrais setters sont setBookingDate() et setStartTime().
     */
    #[Route('', name: 'api_booking_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['service_id'], $data['scheduled_date'], $data['scheduled_time'])) {
            return $this->json(['error' => 'Les champs service_id, scheduled_date et scheduled_time sont requis'], Response::HTTP_BAD_REQUEST);
        }

        $service = $this->serviceRepository->find($data['service_id']);
        if (!$service) {
            return $this->json(['error' => 'Service non trouvé'], Response::HTTP_NOT_FOUND);
        }

        try {
            $bookingDate = new \DateTime($data['scheduled_date']);
            $startTime   = new \DateTime($data['scheduled_time']);
        } catch (\Exception) {
            return $this->json(['error' => 'Format de date/heure invalide'], Response::HTTP_BAD_REQUEST);
        }

        $booking = new Booking();
        $booking->setService($service);
        $booking->setClient($this->getUser());
        // CORRECTION : utilise les vrais setters de l'entité
        $booking->setBookingDate($bookingDate);
        $booking->setStartTime($startTime);
        $booking->setStatus(BookingStatus::PENDING->value);
        $booking->setTotalPrice((string)($data['total_price'] ?? $service->getBasePrice()));
        $booking->setClientNotes($data['notes'] ?? null);
        $booking->setCreatedAt(new \DateTime());

        // Assigner automatiquement un employé disponible si possible
        // Si aucun employé configuré, la réservation est créée sans assignation
        $employee = $this->bookingService->assignEmployee($booking);
        if ($employee) {
            $booking->setEmployee($employee);
        }
        // Si pas d'employé disponible mais des employés existent → conflit
        elseif ($this->employeeRepository->count(['isActive' => true]) > 0) {
            return $this->json(['error' => 'Aucun employé disponible pour ce créneau. Choisissez un autre horaire.'], Response::HTTP_CONFLICT);
        }
        // Si aucun employé en base → on accepte la réservation sans assignation

        $errors = $this->validator->validate($booking);
        if (count($errors) > 0) {
            $msgs = [];
            foreach ($errors as $e) { $msgs[$e->getPropertyPath()] = $e->getMessage(); }
            return $this->json(['errors' => $msgs], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($booking);
        $this->em->flush();

        return $this->json(
            ['message' => 'Réservation créée avec succès', 'booking' => $this->serializeBooking($booking)],
            Response::HTTP_CREATED
        );
    }

    /**
     * GET /api/bookings/my-bookings
     */
    #[Route('/my-bookings', name: 'api_my_bookings', methods: ['GET'])]
    public function getMyBookings(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $status   = $request->query->get('status');
        $criteria = ['client' => $this->getUser()];
        if ($status) $criteria['status'] = $status;

        // JOIN FETCH pour charger les associations en une requête
        $qb = $this->bookingRepository->createQueryBuilder('b')
            ->addSelect('service', 'employee', 'empUser')
            ->leftJoin('b.service',  'service')
            ->leftJoin('b.employee', 'employee')
            ->leftJoin('employee.user', 'empUser')
            ->where('b.client = :client')
            ->setParameter('client', $this->getUser())
            ->orderBy('b.bookingDate', 'DESC')
            ->addOrderBy('b.startTime', 'DESC');

        if ($status) {
            $qb->andWhere('b.status = :status')->setParameter('status', $status);
        }

        $bookings = $qb->getQuery()->getResult();

        return $this->json(array_map([$this, 'serializeBooking'], $bookings));
    }

    /**
     * GET /api/bookings/{id}
     * CORRECTION 2 : route manquante (le front appelait cette route via bookingService.getById)
     */
    #[Route('/{id}', name: 'api_booking_get', methods: ['GET'])]
    public function getOne(int $id): JsonResponse
    {
        $booking = $this->bookingRepository->find($id);
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $user = $this->getUser();
        $isOwner = $booking->getClient() === $user;
        $isStaff = $this->isGranted('ROLE_PHOTOGRAPHE');

        if (!$isOwner && !$isStaff) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($this->serializeBooking($booking));
    }

    /**
     * PATCH /api/bookings/{id}/confirm
     */
    #[Route('/{id}/confirm', name: 'api_booking_confirm', methods: ['PATCH'])]
    public function confirm(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        if ($booking->getStatus() !== BookingStatus::PENDING->value) {
            return $this->json(['error' => 'Seules les réservations en attente peuvent être confirmées'], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::CONFIRMED->value);
        $this->em->flush();

        return $this->json(['message' => 'Réservation confirmée', 'booking' => $this->serializeBooking($booking)]);
    }

    /**
     * PATCH /api/bookings/{id}/cancel
     */
    #[Route('/{id}/cancel', name: 'api_booking_cancel', methods: ['PATCH'])]
    public function cancel(int $id, Request $request): JsonResponse
    {
        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        $user          = $this->getUser();
        $isOwner       = $booking->getClient() === $user;
        $isPhotographe = $this->isGranted('ROLE_PHOTOGRAPHE');

        if (!$isOwner && !$isPhotographe) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        if (!BookingStatus::from($booking->getStatus())->canBeCancelled()) {
            return $this->json(['error' => 'Cette réservation ne peut plus être annulée'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $booking->setStatus(BookingStatus::CANCELLED->value);
        $this->em->flush();

        return $this->json(['message' => 'Réservation annulée', 'booking' => $this->serializeBooking($booking)]);
    }

    /**
     * PATCH /api/bookings/{id}/start
     */
    #[Route('/{id}/start', name: 'api_booking_start', methods: ['PATCH'])]
    public function start(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_EMPLOYE');

        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        if ($booking->getStatus() !== BookingStatus::CONFIRMED->value) {
            return $this->json(['error' => 'Seules les réservations confirmées peuvent être démarrées'], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::IN_PROGRESS->value);
        $this->em->flush();

        return $this->json(['message' => 'Séance démarrée', 'booking' => $this->serializeBooking($booking)]);
    }

    /**
     * PATCH /api/bookings/{id}/complete
     */
    #[Route('/{id}/complete', name: 'api_booking_complete', methods: ['PATCH'])]
    public function complete(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_EMPLOYE');

        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        if ($booking->getStatus() !== BookingStatus::IN_PROGRESS->value) {
            return $this->json(['error' => 'Seules les réservations en cours peuvent être terminées'], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus(BookingStatus::COMPLETED->value);
        $this->em->flush();

        return $this->json(['message' => 'Séance terminée', 'booking' => $this->serializeBooking($booking)]);
    }

    /**
     * GET /api/bookings/calendar
     */
    #[Route('/calendar', name: 'api_bookings_calendar', methods: ['GET'])]
    public function getCalendar(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $startDate = $request->query->get('start_date');
        $endDate   = $request->query->get('end_date');

        if (!$startDate || !$endDate) {
            return $this->json(['error' => 'Les paramètres start_date et end_date sont requis'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $start = new \DateTime($startDate);
            $end   = new \DateTime($endDate);
        } catch (\Exception) {
            return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
        }

        // CORRECTION : utilise bookingDate (pas scheduledDate)
        $bookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.bookingDate BETWEEN :start AND :end')
            ->andWhere('b.status != :cancelled')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->orderBy('b.bookingDate', 'ASC')
            ->addOrderBy('b.startTime', 'ASC')
            ->getQuery()
            ->getResult();

        return $this->json(array_map([$this, 'serializeBooking'], $bookings));
    }

    /**
     * GET /api/bookings/stats
     */
    #[Route('/stats', name: 'api_bookings_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today     = new \DateTime('today');
        $thisMonth = new \DateTime('first day of this month');

        // CORRECTION : utilise bookingDate (champ réel de l'entité)
        $todayBookings = (int) $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.bookingDate = :today')
            ->andWhere('b.status != :cancelled')
            ->setParameter('today', $today)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()->getSingleScalarResult();

        $monthBookings = (int) $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.bookingDate >= :month')
            ->andWhere('b.status != :cancelled')
            ->setParameter('month', $thisMonth)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()->getSingleScalarResult();

        $pendingBookings = $this->bookingRepository->count(['status' => BookingStatus::PENDING->value]);

        $statusDistribution = [];
        foreach (BookingStatus::cases() as $status) {
            $statusDistribution[$status->value] = $this->bookingRepository->count(['status' => $status->value]);
        }

        return $this->json([
            'todayBookings'      => $todayBookings,
            'monthBookings'      => $monthBookings,
            'pendingBookings'    => $pendingBookings,
            'statusDistribution' => $statusDistribution,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Routes ADMIN (CORRECTION 3 : complètement manquantes)
    // ─────────────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/bookings — Liste toutes les réservations (admin/photographe)
     * CORRECTION : Cette route n'existait pas → bookingService.getAllBookings() retournait 404
     */

    /**
     * GET /api/bookings/debug — Diagnostic (à supprimer après fix)
     */
    #[Route('/debug', name: 'api_bookings_debug', methods: ['GET'])]
    public function debug(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        try {
            $count = $this->bookingRepository->count([]);
            return $this->json(['status' => 'ok', 'total_bookings' => $count]);
        } catch (\Exception $e) {
            return $this->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    #[Route('/admin-list', name: 'api_admin_bookings_list', methods: ['GET'])]
    public function adminList(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $status    = $request->query->get('status');
        $startDate = $request->query->get('start_date');
        $endDate   = $request->query->get('end_date');

        // DQL explicite — charge tout en une requête, zéro lazy loading
        $dql = 'SELECT b, client, service, employee, empUser
                FROM App\Entity\Booking b
                LEFT JOIN b.client      client
                LEFT JOIN b.service     service
                LEFT JOIN b.employee    employee
                LEFT JOIN employee.user empUser';

        $conditions = [];
        $params     = [];

        if ($status && $status !== 'all') {
            $conditions[] = 'b.status = :status';
            $params['status'] = $status;
        }
        if ($startDate) {
            $conditions[] = 'b.bookingDate >= :startDate';
            $params['startDate'] = new \DateTime($startDate);
        }
        if ($endDate) {
            $conditions[] = 'b.bookingDate <= :endDate';
            $params['endDate'] = new \DateTime($endDate);
        }

        if ($conditions) {
            $dql .= ' WHERE ' . implode(' AND ', $conditions);
        }
        $dql .= ' ORDER BY b.bookingDate DESC, b.startTime DESC';

        $query = $this->bookingRepository->getEntityManager()->createQuery($dql);
        foreach ($params as $key => $val) {
            $query->setParameter($key, $val);
        }

        $bookings   = $query->getResult();
        $serialized = array_map([$this, 'serializeBooking'], $bookings);

        return $this->json($serialized);
    }

    /**
     * PATCH /api/bookings/{id}/admin-status — Changer le statut (admin)
     * CORRECTION : bookingService.updateBookingStatus() appelait /admin/bookings/:id/status → 404
     */
    #[Route('/{id}/admin-status', name: 'api_admin_booking_status', methods: ['PATCH'])]
    public function adminUpdateStatus(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        $data   = json_decode($request->getContent(), true) ?? [];
        $status = $data['status'] ?? null;

        if (!$status || !in_array($status, array_column(BookingStatus::cases(), 'value'))) {
            return $this->json(['error' => 'Statut invalide'], Response::HTTP_BAD_REQUEST);
        }

        $booking->setStatus($status);
        $this->em->flush();

        return $this->json(['message' => 'Statut mis à jour', 'booking' => $this->serializeBooking($booking)]);
    }

    /**
     * PATCH /api/bookings/{id}/assign — Assigner un employé (admin)
     * CORRECTION : bookingService.assignEmployee() appelait /admin/bookings/:id/assign → 404
     */
    #[Route('/{id}/assign', name: 'api_admin_booking_assign', methods: ['PATCH'])]
    public function adminAssignEmployee(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $booking = $this->bookingRepository->find($id);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        $data       = json_decode($request->getContent(), true) ?? [];
        $employeeId = $data['employee_id'] ?? null;

        if (!$employeeId) {
            return $this->json(['error' => 'employee_id requis'], Response::HTTP_BAD_REQUEST);
        }

        $employee = $this->employeeRepository->find($employeeId);
        if (!$employee) {
            return $this->json(['error' => 'Employé non trouvé'], Response::HTTP_NOT_FOUND);
        }

        $booking->setEmployee($employee);
        $this->em->flush();

        return $this->json(['message' => 'Employé assigné', 'booking' => $this->serializeBooking($booking)]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Sérialisation centralisée
    // ─────────────────────────────────────────────────────────────────────

    private function serializeBooking(Booking $b): array
    {
        $employee = $b->getEmployee();
        $client   = $b->getClient();
        $service  = $b->getService();

        return [
            'id'            => $b->getId(),
            'status'        => $b->getStatus(),
            // CORRECTION : expose scheduledDate/scheduledTime comme alias des vrais champs
            'scheduledDate' => $b->getBookingDate()?->format('Y-m-d'),
            'scheduledTime' => $b->getStartTime()?->format('H:i'),
            'bookingDate'   => $b->getBookingDate()?->format('Y-m-d'),
            'startTime'     => $b->getStartTime()?->format('H:i'),
            'endTime'       => $b->getEndTime()?->format('H:i'),
            'totalPrice'    => $b->getTotalPrice(),
            'notes'         => $b->getClientNotes(),
            'createdAt'     => $b->getCreatedAt()?->format('c'),
            'service'       => $service ? [
                'id'          => $service->getId(),
                'name'        => $service->getName(),
                'durationMin' => $service->getDurationMin(),
                'basePrice'   => $service->getBasePrice(),
                'category'    => $service->getCategory(),
            ] : null,
            'client' => $client ? [
                'id'        => $client->getId(),
                'firstName' => $client->getFirstName(),
                'lastName'  => $client->getLastName(),
                'email'     => $client->getEmail(),
                'phone'     => $client->getPhone(),
            ] : null,
            // Employee lié à User — protection complète contre les nulls
            'assignedEmployee' => $employee ? [
                'id'        => $employee->getId(),
                'firstName' => $employee->getUser()?->getFirstName() ?? '',
                'lastName'  => $employee->getUser()?->getLastName() ?? '',
                'position'  => $employee->getPosition(),
            ] : null,
        ];
    }
}
