<?php

namespace App\Controller\Api;

use App\Enum\BookingStatus;
use App\Enum\InvoiceStatus;
use App\Enum\ReviewStatus;
use App\Repository\BookingRepository;
use App\Repository\InvoiceRepository;
use App\Repository\PhotoRepository;
use App\Repository\ReviewRepository;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

/**
 * CORRECTIONS :
 * 1. Toutes les requêtes DQL utilisaient b.bookingDate — champ correct ✓
 *    mais getKpis() utilisait b.bookingDate dans certains endroits et
 *    $booking->getBookingDate() dans d'autres — harmonisé
 * 2. getUpcomingEvents() utilisait b.bookingDate, b.startTime → correct
 *    mais $booking->getEmployee() renvoie un Employee (pas firstName directement)
 *    → Employee.user.firstName
 * 3. getActivityFeed() utilisait $booking->getBookingDate() → correct
 */
#[Route('/api/dashboard')]
final class DashboardController extends AbstractController
{
    public function __construct(
        private BookingRepository $bookingRepository,
        private InvoiceRepository $invoiceRepository,
        private PhotoRepository   $photoRepository,
        private ReviewRepository  $reviewRepository,
        private UserRepository    $userRepository
    ) {}

    /**
     * GET /api/dashboard/kpis
     */
    #[Route('/kpis', name: 'api_dashboard_kpis', methods: ['GET'])]
    public function getKpis(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today     = new \DateTime('today');
        $thisMonth = new \DateTime('first day of this month');

        // CORRECTION : utilise b.bookingDate (champ réel)
        $todayBookings = (int) $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.bookingDate = :today AND b.status != :cancelled')
            ->setParameter('today', $today)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()->getSingleScalarResult();

        $monthRevenue = (float) $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.amount), 0)')
            ->where('i.status = :paid AND i.paidAt >= :month')
            ->setParameter('paid', InvoiceStatus::PAID->value)
            ->setParameter('month', $thisMonth)
            ->getQuery()->getSingleScalarResult();

        $pendingReviews = $this->reviewRepository->count(['status' => ReviewStatus::PENDING->value]);

        $monthPhotos = (int) $this->photoRepository->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->innerJoin('p.album', 'a')
            ->where('a.createdAt >= :month')
            ->setParameter('month', $thisMonth)
            ->getQuery()->getSingleScalarResult();

        $newClients = (int) $this->userRepository->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->where('u.createdAt >= :month AND u.roles LIKE :role')
            ->setParameter('month', $thisMonth)
            ->setParameter('role', '%ROLE_CLIENT%')
            ->getQuery()->getSingleScalarResult();

        $totalPending   = $this->bookingRepository->count(['status' => BookingStatus::PENDING->value]);
        $totalConfirmed = $this->bookingRepository->count(['status' => BookingStatus::CONFIRMED->value]);
        $totalCompleted = $this->bookingRepository->count(['status' => BookingStatus::COMPLETED->value]);
        $denominator    = $totalPending + $totalConfirmed + $totalCompleted;
        $confirmationRate = $denominator > 0
            ? round(($totalConfirmed + $totalCompleted) / $denominator * 100, 2)
            : 0;

        return $this->json([
            'todayBookings'    => $todayBookings,
            'monthRevenue'     => $monthRevenue,
            'pendingReviews'   => $pendingReviews,
            'monthPhotos'      => $monthPhotos,
            'newClients'       => $newClients,
            'confirmationRate' => $confirmationRate,
        ]);
    }

    /**
     * GET /api/dashboard/charts?days=30
     */
    #[Route('/charts', name: 'api_dashboard_charts', methods: ['GET'])]
    public function getCharts(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $days      = min(90, max(7, (int)$request->query->get('days', 30)));
        $startDate = new \DateTime("-{$days} days");

        // Réservations par jour
        $bookingsData = [];
        for ($i = 0; $i < $days; $i++) {
            $date = (clone $startDate)->modify("+{$i} days");
            $count = (int) $this->bookingRepository->createQueryBuilder('b')
                ->select('COUNT(b.id)')
                ->where('b.bookingDate = :date AND b.status != :cancelled')
                ->setParameter('date', $date)
                ->setParameter('cancelled', BookingStatus::CANCELLED->value)
                ->getQuery()->getSingleScalarResult();

            $bookingsData[] = ['date' => $date->format('Y-m-d'), 'count' => $count];
        }

        // Revenus par jour
        $revenueData = [];
        for ($i = 0; $i < $days; $i++) {
            $date     = (clone $startDate)->modify("+{$i} days");
            $nextDate = (clone $date)->modify('+1 day');
            $amount = (float) $this->invoiceRepository->createQueryBuilder('i')
                ->select('COALESCE(SUM(i.amount), 0)')
                ->where('i.paidAt >= :date AND i.paidAt < :nextDate AND i.status = :paid')
                ->setParameter('date', $date)
                ->setParameter('nextDate', $nextDate)
                ->setParameter('paid', InvoiceStatus::PAID->value)
                ->getQuery()->getSingleScalarResult();

            $revenueData[] = ['date' => $date->format('Y-m-d'), 'amount' => $amount];
        }

        // Répartition par service
        $serviceDistribution = $this->bookingRepository->createQueryBuilder('b')
            ->select('s.name as service, COUNT(b.id) as total')
            ->innerJoin('b.service', 's')
            ->where('b.bookingDate >= :start AND b.status != :cancelled')
            ->setParameter('start', $startDate)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->groupBy('s.id')
            ->orderBy('total', 'DESC')
            ->setMaxResults(10)
            ->getQuery()->getResult();

        $servicesChart = array_map(fn($item) => [
            'service' => $item['service'],
            'count'   => (int)$item['total'],
        ], $serviceDistribution);

        // Distribution des avis
        $reviewsDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = (int) $this->reviewRepository->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.rating = :rating AND r.status = :approved AND r.createdAt >= :start')
                ->setParameter('rating', $i)
                ->setParameter('approved', ReviewStatus::APPROVED->value)
                ->setParameter('start', $startDate)
                ->getQuery()->getSingleScalarResult();

            $reviewsDistribution[] = ['rating' => $i, 'count' => $count];
        }

        return $this->json([
            'bookings'             => $bookingsData,
            'revenue'              => $revenueData,
            'serviceDistribution'  => $servicesChart,
            'reviewsDistribution'  => $reviewsDistribution,
        ]);
    }

    /**
     * GET /api/dashboard/activity-feed
     */
    #[Route('/activity-feed', name: 'api_dashboard_activity', methods: ['GET'])]
    public function getActivityFeed(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $limit      = min(50, max(10, (int)$request->query->get('limit', 20)));
        $activities = [];

        $recentBookings = $this->bookingRepository->findBy([], ['createdAt' => 'DESC'], (int)($limit / 2));
        foreach ($recentBookings as $booking) {
            $activities[] = [
                'type'      => 'booking',
                'message'   => sprintf('Réservation : %s pour le %s',
                    $booking->getService()->getName(),
                    $booking->getBookingDate()->format('d/m/Y')
                ),
                'timestamp' => $booking->getCreatedAt()->format('c'),
                'data'      => [
                    'id'     => $booking->getId(),
                    'client' => $booking->getClient()->getFirstName() . ' ' . $booking->getClient()->getLastName(),
                    'status' => $booking->getStatus(),
                ],
            ];
        }

        $recentReviews = $this->reviewRepository->findBy([], ['createdAt' => 'DESC'], (int)($limit / 4));
        foreach ($recentReviews as $review) {
            $activities[] = [
                'type'      => 'review',
                'message'   => sprintf('Avis %d★ de %s %s',
                    $review->getRating(),
                    $review->getClient()->getFirstName(),
                    $review->getClient()->getLastName()
                ),
                'timestamp' => $review->getCreatedAt()->format('c'),
                'data'      => ['id' => $review->getId(), 'rating' => $review->getRating(), 'status' => $review->getStatus()],
            ];
        }

        $recentInvoices = $this->invoiceRepository->findBy([], ['issuedAt' => 'DESC'], (int)($limit / 4));
        foreach ($recentInvoices as $invoice) {
            $activities[] = [
                'type'      => 'invoice',
                'message'   => sprintf('Facture %s : %s GNF (%s)',
                    $invoice->getInvoiceNumber(),
                    number_format((float)$invoice->getAmount(), 0, ',', ' '),
                    $invoice->getStatus()
                ),
                'timestamp' => $invoice->getIssuedAt()?->format('c') ?? (new \DateTime())->format('c'),
                'data'      => ['id' => $invoice->getId(), 'number' => $invoice->getInvoiceNumber(), 'status' => $invoice->getStatus()],
            ];
        }

        usort($activities, fn($a, $b) => strtotime($b['timestamp']) - strtotime($a['timestamp']));

        return $this->json(array_slice($activities, 0, $limit));
    }

    /**
     * GET /api/dashboard/upcoming-events
     *
     * CORRECTION 2 : Employee→User pour firstName/lastName
     */
    #[Route('/upcoming-events', name: 'api_dashboard_upcoming_events', methods: ['GET'])]
    public function getUpcomingEvents(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today    = new \DateTime('today');
        $nextWeek = new \DateTime('+7 days');

        // CORRECTION : utilise b.bookingDate et b.startTime (champs réels de l'entité)
        $upcomingBookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.bookingDate BETWEEN :today AND :nextWeek')
            ->andWhere('b.status IN (:statuses)')
            ->setParameter('today', $today)
            ->setParameter('nextWeek', $nextWeek)
            ->setParameter('statuses', [BookingStatus::CONFIRMED->value, BookingStatus::PENDING->value])
            ->orderBy('b.bookingDate', 'ASC')
            ->addOrderBy('b.startTime', 'ASC')
            ->getQuery()->getResult();

        $events = array_map(function ($booking) {
            $employee = $booking->getEmployee();
            return [
                'type'     => 'booking',
                'id'       => $booking->getId(),
                'title'    => $booking->getService()->getName(),
                'client'   => $booking->getClient()->getFirstName() . ' ' . $booking->getClient()->getLastName(),
                'date'     => $booking->getBookingDate()->format('Y-m-d'),
                'time'     => $booking->getStartTime()->format('H:i'),
                'status'   => $booking->getStatus(),
                // CORRECTION : Employee n'a pas firstName directement → passe par User
                'employee' => $employee
                    ? $employee->getUser()->getFirstName() . ' ' . $employee->getUser()->getLastName()
                    : null,
            ];
        }, $upcomingBookings);

        return $this->json($events);
    }

    /**
     * GET /api/dashboard/employee-performance
     */
    #[Route('/employee-performance', name: 'api_dashboard_employee_performance', methods: ['GET'])]
    public function getEmployeePerformance(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $thisMonth = new \DateTime('first day of this month');

        // CORRECTION : JOIN b.employee (champ correct) — utilise bookingDate
        $performance = $this->bookingRepository->createQueryBuilder('b')
            ->select('
                e.id as employeeId,
                COUNT(b.id) as totalBookings,
                SUM(CASE WHEN b.status = :completed THEN 1 ELSE 0 END) as completedBookings
            ')
            ->innerJoin('b.employee', 'e')
            ->where('b.bookingDate >= :month AND b.status != :cancelled')
            ->setParameter('month', $thisMonth)
            ->setParameter('completed', BookingStatus::COMPLETED->value)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->groupBy('e.id')
            ->orderBy('totalBookings', 'DESC')
            ->getQuery()->getResult();

        $employeeStats = [];
        foreach ($performance as $item) {
            $employee = $this->em ?? null;
            $emp = $this->bookingRepository->getEntityManager()
                ->getRepository(\App\Entity\Employee::class)
                ->find($item['employeeId']);

            $completionRate = $item['totalBookings'] > 0
                ? round(($item['completedBookings'] / $item['totalBookings']) * 100, 2)
                : 0;

            $employeeStats[] = [
                'employeeId'        => $item['employeeId'],
                // CORRECTION : firstName/lastName depuis Employee->User
                'name'              => $emp
                    ? $emp->getUser()->getFirstName() . ' ' . $emp->getUser()->getLastName()
                    : 'Inconnu',
                'totalBookings'     => (int)$item['totalBookings'],
                'completedBookings' => (int)$item['completedBookings'],
                'completionRate'    => $completionRate,
            ];
        }

        return $this->json($employeeStats);
    }

    /**
     * GET /api/dashboard/platform-stats
     */
    #[Route('/platform-stats', name: 'api_dashboard_platform_stats', methods: ['GET'])]
    public function getPlatformStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        return $this->json([
            'totalClients' => (int) $this->userRepository->createQueryBuilder('u')
                ->select('COUNT(u.id)')->where('u.roles LIKE :role')->setParameter('role', '%ROLE_CLIENT%')
                ->getQuery()->getSingleScalarResult(),

            'totalBookings' => (int) $this->bookingRepository->createQueryBuilder('b')
                ->select('COUNT(b.id)')->getQuery()->getSingleScalarResult(),

            'totalRevenue' => (float) $this->invoiceRepository->createQueryBuilder('i')
                ->select('COALESCE(SUM(i.amount), 0)')->where('i.status = :paid')
                ->setParameter('paid', InvoiceStatus::PAID->value)->getQuery()->getSingleScalarResult(),

            'totalPhotos' => (int) $this->photoRepository->createQueryBuilder('p')
                ->select('COUNT(p.id)')->getQuery()->getSingleScalarResult(),

            'totalReviews' => (int) $this->reviewRepository->createQueryBuilder('r')
                ->select('COUNT(r.id)')->where('r.status = :approved')
                ->setParameter('approved', ReviewStatus::APPROVED->value)->getQuery()->getSingleScalarResult(),

            'averageRating' => round((float) $this->reviewRepository->createQueryBuilder('r')
                ->select('COALESCE(AVG(r.rating), 0)')->where('r.status = :approved')
                ->setParameter('approved', ReviewStatus::APPROVED->value)->getQuery()->getSingleScalarResult(), 2),
        ]);
    }
}
