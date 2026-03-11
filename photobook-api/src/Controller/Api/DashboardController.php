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

#[Route('/api/dashboard')]
final class DashboardController extends AbstractController
{
    public function __construct(
        private BookingRepository $bookingRepository,
        private InvoiceRepository $invoiceRepository,
        private PhotoRepository $photoRepository,
        private ReviewRepository $reviewRepository,
        private UserRepository $userRepository
    ) {}

    /**
     * KPIs temps réel pour le dashboard admin (cahier des charges)
     */
    #[Route('/kpis', name: 'api_dashboard_kpis', methods: ['GET'])]
    public function getKpis(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today = new \DateTime('today');
        $thisMonth = new \DateTime('first day of this month');

        // Réservations du jour
        $todayBookings = $this->bookingRepository->createQueryBuilder('b')
            ->select('COUNT(b.id)')
            ->where('b.bookingDate = :today')
            ->andWhere('b.status != :cancelled')
            ->setParameter('today', $today)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->getQuery()
            ->getSingleScalarResult();

        // Revenus du mois
        $monthRevenue = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.amountTtc), 0)')
            ->where('i.status = :paid')
            ->andWhere('i.paidAt >= :month')
            ->setParameter('paid', InvoiceStatus::PAID->value)
            ->setParameter('month', $thisMonth)
            ->getQuery()
            ->getSingleScalarResult();

        // Avis en attente de modération
        $pendingReviews = $this->reviewRepository->count([
            'status' => ReviewStatus::PENDING->value
        ]);

        // Photos uploadées ce mois
        $monthPhotos = $this->photoRepository->createQueryBuilder('p')
            ->select('COUNT(p.id)')
            ->innerJoin('p.album', 'a')
            ->where('a.createdAt >= :month')
            ->setParameter('month', $thisMonth)
            ->getQuery()
            ->getSingleScalarResult();

        // Nouveaux clients ce mois
        $newClients = $this->userRepository->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->where('u.createdAt >= :month')
            ->andWhere('u.roles LIKE :role')
            ->setParameter('month', $thisMonth)
            ->setParameter('role', '%ROLE_CLIENT%')
            ->getQuery()
            ->getSingleScalarResult();

        // Taux de confirmation des réservations
        $totalPending = $this->bookingRepository->count(['status' => BookingStatus::PENDING->value]);
        $totalConfirmed = $this->bookingRepository->count(['status' => BookingStatus::CONFIRMED->value]);
        $totalCompleted = $this->bookingRepository->count(['status' => BookingStatus::COMPLETED->value]);
        $confirmationRate = ($totalPending + $totalConfirmed + $totalCompleted) > 0
            ? round(($totalConfirmed + $totalCompleted) / ($totalPending + $totalConfirmed + $totalCompleted) * 100, 2)
            : 0;

        return $this->json([
            'todayBookings' => (int) $todayBookings,
            'monthRevenue' => (float) $monthRevenue,
            'pendingReviews' => $pendingReviews,
            'monthPhotos' => (int) $monthPhotos,
            'newClients' => (int) $newClients,
            'confirmationRate' => $confirmationRate
        ]);
    }

    /**
     * Graphiques statistiques sur 30 jours (cahier des charges)
     */
    #[Route('/charts', name: 'api_dashboard_charts', methods: ['GET'])]
    public function getCharts(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $days = min(90, max(7, (int) $request->query->get('days', 30)));
        $startDate = new \DateTime("-{$days} days");

        // Évolution des réservations
        $bookingsData = [];
        for ($i = 0; $i < $days; $i++) {
            $date = clone $startDate;
            $date->modify("+{$i} days");
            
            $count = $this->bookingRepository->createQueryBuilder('b')
                ->select('COUNT(b.id)')
                ->where('b.bookingDate = :date')
                ->andWhere('b.status != :cancelled')
                ->setParameter('date', $date)
                ->setParameter('cancelled', BookingStatus::CANCELLED->value)
                ->getQuery()
                ->getSingleScalarResult();

            $bookingsData[] = [
                'date' => $date->format('Y-m-d'),
                'count' => (int) $count
            ];
        }

        // Évolution des revenus
        $revenueData = [];
        for ($i = 0; $i < $days; $i++) {
            $date = clone $startDate;
            $date->modify("+{$i} days");
            $nextDate = clone $date;
            $nextDate->modify('+1 day');

            $amount = $this->invoiceRepository->createQueryBuilder('i')
                ->select('COALESCE(SUM(i.amountTtc), 0)')
                ->where('i.paidAt >= :date')
                ->andWhere('i.paidAt < :nextDate')
                ->andWhere('i.status = :paid')
                ->setParameter('date', $date)
                ->setParameter('nextDate', $nextDate)
                ->setParameter('paid', InvoiceStatus::PAID->value)
                ->getQuery()
                ->getSingleScalarResult();

            $revenueData[] = [
                'date' => $date->format('Y-m-d'),
                'amount' => (float) $amount
            ];
        }

        // Répartition par type de service
        $serviceDistribution = $this->bookingRepository->createQueryBuilder('b')
            ->select('s.name as service, COUNT(b.id) as total')
            ->innerJoin('b.service', 's')
            ->where('b.bookingDate >= :start')
            ->andWhere('b.status != :cancelled')
            ->setParameter('start', $startDate)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->groupBy('s.id')
            ->orderBy('total', 'DESC')
            ->setMaxResults(10)
            ->getQuery()
            ->getResult();

        $servicesChart = array_map(function($item) {
            return [
                'service' => $item['service'],
                'count' => (int) $item['total']
            ];
        }, $serviceDistribution);

        // Taux de satisfaction (avis)
        $reviewsDistribution = [];
        for ($i = 1; $i <= 5; $i++) {
            $count = $this->reviewRepository->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.rating = :rating')
                ->andWhere('r.status = :approved')
                ->andWhere('r.createdAt >= :start')
                ->setParameter('rating', $i)
                ->setParameter('approved', ReviewStatus::APPROVED->value)
                ->setParameter('start', $startDate)
                ->getQuery()
                ->getSingleScalarResult();

            $reviewsDistribution[] = [
                'rating' => $i,
                'count' => (int) $count
            ];
        }

        return $this->json([
            'bookings' => $bookingsData,
            'revenue' => $revenueData,
            'serviceDistribution' => $servicesChart,
            'reviewsDistribution' => $reviewsDistribution
        ]);
    }

    /**
     * Flux d'activité récente
     */
    #[Route('/activity-feed', name: 'api_dashboard_activity', methods: ['GET'])]
    public function getActivityFeed(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $limit = min(50, max(10, (int) $request->query->get('limit', 20)));
        $activities = [];

        // Réservations récentes
        $recentBookings = $this->bookingRepository->findBy(
            [],
            ['createdAt' => 'DESC'],
            $limit / 2
        );

        foreach ($recentBookings as $booking) {
            $activities[] = [
                'type' => 'booking',
                'action' => 'created',
                'message' => sprintf(
                    'Nouvelle réservation : %s pour le %s',
                    $booking->getService()->getName(),
                    $booking->getBookingDate()->format('d/m/Y')
                ),
                'timestamp' => $booking->getCreatedAt()->format('c'),
                'data' => [
                    'id' => $booking->getId(),
                    'client' => $booking->getClient()->getFirstName() . ' ' . $booking->getClient()->getLastName(),
                    'status' => $booking->getStatus()
                ]
            ];
        }

        // Avis récents
        $recentReviews = $this->reviewRepository->findBy(
            [],
            ['createdAt' => 'DESC'],
            $limit / 4
        );

        foreach ($recentReviews as $review) {
            $activities[] = [
                'type' => 'review',
                'action' => $review->getStatus(),
                'message' => sprintf(
                    'Nouvel avis %s étoiles : %s',
                    $review->getRating(),
                    $review->getTitle()
                ),
                'timestamp' => $review->getCreatedAt()->format('c'),
                'data' => [
                    'id' => $review->getId(),
                    'rating' => $review->getRating(),
                    'status' => $review->getStatus()
                ]
            ];
        }

        // Factures récentes
        $recentInvoices = $this->invoiceRepository->findBy(
            [],
            ['createdAt' => 'DESC'],
            $limit / 4
        );

        foreach ($recentInvoices as $invoice) {
            $activities[] = [
                'type' => 'invoice',
                'action' => $invoice->getStatus(),
                'message' => sprintf(
                    'Facture %s : %s GNF (%s)',
                    $invoice->getInvoiceNumber(),
                    $invoice->getAmountTtc(),
                    $invoice->getStatus()
                ),
                'timestamp' => $invoice->getCreatedAt()->format('c'),
                'data' => [
                    'id' => $invoice->getId(),
                    'number' => $invoice->getInvoiceNumber(),
                    'amount' => $invoice->getAmountTtc(),
                    'status' => $invoice->getStatus()
                ]
            ];
        }

        // Trier par date décroissante
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });

        return $this->json(array_slice($activities, 0, $limit));
    }

    /**
     * Performance des employés
     */
    #[Route('/employee-performance', name: 'api_dashboard_employee_performance', methods: ['GET'])]
    public function getEmployeePerformance(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $thisMonth = new \DateTime('first day of this month');

        // Statistiques par employé
        $performance = $this->bookingRepository->createQueryBuilder('b')
            ->select('
                e.id as employeeId,
                e.firstName,
                e.lastName,
                COUNT(b.id) as totalBookings,
                SUM(CASE WHEN b.status = :completed THEN 1 ELSE 0 END) as completedBookings
            ')
            ->innerJoin('b.employee', 'e')
            ->where('b.bookingDate >= :month')
            ->andWhere('b.status != :cancelled')
            ->setParameter('month', $thisMonth)
            ->setParameter('completed', BookingStatus::COMPLETED->value)
            ->setParameter('cancelled', BookingStatus::CANCELLED->value)
            ->groupBy('e.id')
            ->orderBy('totalBookings', 'DESC')
            ->getQuery()
            ->getResult();

        $employeeStats = array_map(function($item) {
            $completionRate = $item['totalBookings'] > 0
                ? round(($item['completedBookings'] / $item['totalBookings']) * 100, 2)
                : 0;

            return [
                'employeeId' => $item['employeeId'],
                'name' => $item['firstName'] . ' ' . $item['lastName'],
                'totalBookings' => (int) $item['totalBookings'],
                'completedBookings' => (int) $item['completedBookings'],
                'completionRate' => $completionRate
            ];
        }, $performance);

        return $this->json($employeeStats);
    }

    /**
     * Statistiques globales de la plateforme
     */
    #[Route('/platform-stats', name: 'api_dashboard_platform_stats', methods: ['GET'])]
    public function getPlatformStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        // Totaux globaux
        $stats = [
            'totalClients' => $this->userRepository->createQueryBuilder('u')
                ->select('COUNT(u.id)')
                ->where('u.roles LIKE :role')
                ->setParameter('role', '%ROLE_CLIENT%')
                ->getQuery()
                ->getSingleScalarResult(),

            'totalBookings' => $this->bookingRepository->createQueryBuilder('b')
                ->select('COUNT(b.id)')
                ->getQuery()
                ->getSingleScalarResult(),

            'totalRevenue' => $this->invoiceRepository->createQueryBuilder('i')
                ->select('COALESCE(SUM(i.amountTtc), 0)')
                ->where('i.status = :paid')
                ->setParameter('paid', InvoiceStatus::PAID->value)
                ->getQuery()
                ->getSingleScalarResult(),

            'totalPhotos' => $this->photoRepository->createQueryBuilder('p')
                ->select('COUNT(p.id)')
                ->getQuery()
                ->getSingleScalarResult(),

            'totalReviews' => $this->reviewRepository->createQueryBuilder('r')
                ->select('COUNT(r.id)')
                ->where('r.status = :approved')
                ->setParameter('approved', ReviewStatus::APPROVED->value)
                ->getQuery()
                ->getSingleScalarResult(),

            'averageRating' => $this->reviewRepository->createQueryBuilder('r')
                ->select('COALESCE(AVG(r.rating), 0)')
                ->where('r.status = :approved')
                ->setParameter('approved', ReviewStatus::APPROVED->value)
                ->getQuery()
                ->getSingleScalarResult(),
        ];

        // Conversion en types appropriés
        $stats['totalClients'] = (int) $stats['totalClients'];
        $stats['totalBookings'] = (int) $stats['totalBookings'];
        $stats['totalRevenue'] = (float) $stats['totalRevenue'];
        $stats['totalPhotos'] = (int) $stats['totalPhotos'];
        $stats['totalReviews'] = (int) $stats['totalReviews'];
        $stats['averageRating'] = round((float) $stats['averageRating'], 2);

        return $this->json($stats);
    }

    /**
     * Prochains événements/rappels
     */
    #[Route('/upcoming-events', name: 'api_dashboard_upcoming_events', methods: ['GET'])]
    public function getUpcomingEvents(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_PHOTOGRAPHE');

        $today = new \DateTime('today');
        $nextWeek = new \DateTime('+7 days');

        // Réservations à venir
        $upcomingBookings = $this->bookingRepository->createQueryBuilder('b')
            ->where('b.bookingDate BETWEEN :today AND :nextWeek')
            ->andWhere('b.status IN (:statuses)')
            ->setParameter('today', $today)
            ->setParameter('nextWeek', $nextWeek)
            ->setParameter('statuses', [BookingStatus::CONFIRMED->value, BookingStatus::PENDING->value])
            ->orderBy('b.bookingDate', 'ASC')
            ->addOrderBy('b.startTime', 'ASC')
            ->getQuery()
            ->getResult();

        $events = array_map(function($booking) {
            return [
                'type' => 'booking',
                'id' => $booking->getId(),
                'title' => $booking->getService()->getName(),
                'client' => $booking->getClient()->getFirstName() . ' ' . $booking->getClient()->getLastName(),
                'date' => $booking->getBookingDate()->format('Y-m-d'),
                'time' => $booking->getStartTime()->format('H:i'),
                'status' => $booking->getStatus(),
                'employee' => $booking->getEmployee() 
                    ? $booking->getEmployee()->getFirstName() . ' ' . $booking->getEmployee()->getLastName()
                    : null
            ];
        }, $upcomingBookings);

        return $this->json($events);
    }
}
