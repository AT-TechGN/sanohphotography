<?php

namespace App\Controller\Api;

use App\Entity\Invoice;
use App\Enum\InvoiceStatus;
use App\Repository\InvoiceRepository;
use App\Repository\BookingRepository;
use App\Service\PdfGeneratorService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * CORRECTIONS :
 * 1. Ajout GET /api/invoices (getAll) — manquant, invoiceService.getAll() retournait 404
 * 2. Ajout route admin GET /api/admin/bookings (liste admin) — voir BookingController
 * 3. Sérialisation centralisée
 */
#[Route('/api/invoices')]
final class InvoiceController extends AbstractController
{
    public function __construct(
        private InvoiceRepository      $invoiceRepository,
        private BookingRepository      $bookingRepository,
        private PdfGeneratorService    $pdfGenerator,
        private EntityManagerInterface $em,
        private ValidatorInterface     $validator
    ) {}

    /**
     * GET /api/invoices — Liste toutes les factures (admin)
     * CORRECTION 1 : cette route n'existait pas → invoiceService.getAll() retournait 404
     */
    #[Route('', name: 'api_invoices_list', methods: ['GET'])]
    public function getAll(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $status = $request->query->get('status');
        $page   = max(1, (int)$request->query->get('page', 1));
        $limit  = min(100, max(1, (int)$request->query->get('limit', 50)));

        $qb = $this->invoiceRepository->createQueryBuilder('i')
            ->orderBy('i.createdAt', 'DESC');

        if ($status && $status !== 'all') {
            $qb->where('i.status = :status')->setParameter('status', $status);
        }

        $total    = count($qb->getQuery()->getResult());
        $invoices = $qb->setFirstResult(($page - 1) * $limit)->setMaxResults($limit)->getQuery()->getResult();

        return $this->json([
            'data'       => array_map([$this, 'serializeInvoice'], $invoices),
            'pagination' => ['page' => $page, 'limit' => $limit, 'total' => $total],
        ]);
    }

    /**
     * GET /api/invoices/{id}
     */
    #[Route('/{id}', name: 'api_invoice_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function getOne(int $id): JsonResponse
    {
        $invoice = $this->invoiceRepository->find($id);
        if (!$invoice) return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);

        $user    = $this->getUser();
        $isOwner = $invoice->getBooking()->getClient() === $user;
        $isAdmin = $this->isGranted('ROLE_ADMIN');

        if (!$isOwner && !$isAdmin) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        return $this->json($this->serializeInvoice($invoice));
    }

    /**
     * POST /api/invoices — Créer une facture
     */
    #[Route('', name: 'api_invoice_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true) ?? [];

        if (!isset($data['booking_id'])) {
            return $this->json(['error' => 'booking_id est requis'], Response::HTTP_BAD_REQUEST);
        }

        $booking = $this->bookingRepository->find($data['booking_id']);
        if (!$booking) return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);

        if ($this->invoiceRepository->findOneBy(['booking' => $booking])) {
            return $this->json(['error' => 'Une facture existe déjà pour cette réservation'], Response::HTTP_CONFLICT);
        }

        $invoice = new Invoice();
        $invoice->setBooking($booking);
        $invoice->setInvoiceNumber($this->generateInvoiceNumber());
        $totalTtc = (string)($data['amountTtc'] ?? $data['amount'] ?? $booking->getTotalPrice());
        $invoice->setAmountTtc($totalTtc);
        $invoice->setAmountHt((string)round((float)$totalTtc / 1.18, 2));
        $invoice->setTaxRate((string)($data['taxRate'] ?? '18.00'));
        $invoice->setStatus(InvoiceStatus::PENDING->value);
        $invoice->setDueDate(new \DateTime($data['due_date'] ?? '+30 days'));
        $invoice->setCreatedAt(new \DateTime());

        $errors = $this->validator->validate($invoice);
        if (count($errors) > 0) {
            $msgs = [];
            foreach ($errors as $e) { $msgs[$e->getPropertyPath()] = $e->getMessage(); }
            return $this->json(['errors' => $msgs], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($invoice);
        $this->em->flush();

        return $this->json([
            'message' => 'Facture créée',
            'invoice' => $this->serializeInvoice($invoice),
        ], Response::HTTP_CREATED);
    }

    /**
     * GET /api/invoices/{id}/pdf
     */
    #[Route('/{id}/pdf', name: 'api_invoice_pdf', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function downloadPdf(int $id): Response
    {
        $invoice = $this->invoiceRepository->find($id);
        if (!$invoice) return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);

        $user    = $this->getUser();
        $isOwner = $invoice->getBooking()->getClient() === $user;
        $isAdmin = $this->isGranted('ROLE_ADMIN');

        if (!$isOwner && !$isAdmin) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        $pdfContent = $this->pdfGenerator->generateInvoicePdf($invoice);

        $filename = 'facture-' . $invoice->getInvoiceNumber() . '.pdf';

        $response = new Response($pdfContent);
        $response->headers->set('Content-Type', 'application/pdf');
        $response->headers->set('Content-Disposition', 'attachment; filename="' . $filename . '"');
        $response->headers->set('Content-Length', strlen($pdfContent));
        $response->headers->set('Cache-Control', 'private, no-cache, no-store');
        $response->headers->set('Access-Control-Expose-Headers', 'Content-Disposition');

        return $response;
    }

    /**
     * PATCH /api/invoices/{id}/mark-paid
     */
    #[Route('/{id}/mark-paid', name: 'api_invoice_mark_paid', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function markPaid(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $invoice = $this->invoiceRepository->find($id);
        if (!$invoice) return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);

        if ($invoice->getStatus() !== InvoiceStatus::PENDING->value) {
            return $this->json(['error' => 'Seules les factures en attente peuvent être marquées payées'], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        $invoice->setStatus(InvoiceStatus::PAID->value);
        $invoice->setPaidAt(new \DateTime()); // paymentMethod non présent sur l'entité Invoice
        $this->em->flush();

        return $this->json(['message' => 'Facture payée', 'invoice' => $this->serializeInvoice($invoice)]);
    }

    /**
     * PATCH /api/invoices/{id}/cancel
     */
    #[Route('/{id}/cancel', name: 'api_invoice_cancel', methods: ['PATCH'], requirements: ['id' => '\d+'])]
    public function cancel(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $invoice = $this->invoiceRepository->find($id);
        if (!$invoice) return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);

        if (!InvoiceStatus::from($invoice->getStatus())->canBeCancelled()) {
            return $this->json(['error' => 'Cette facture ne peut pas être annulée'], Response::HTTP_BAD_REQUEST);
        }

        $invoice->setStatus(InvoiceStatus::CANCELLED->value);
        $this->em->flush();

        return $this->json(['message' => 'Facture annulée', 'invoice' => $this->serializeInvoice($invoice)]);
    }

    /**
     * GET /api/invoices/my-invoices
     */
    #[Route('/my-invoices', name: 'api_my_invoices', methods: ['GET'])]
    public function getMyInvoices(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $invoices = $this->invoiceRepository->createQueryBuilder('i')
            ->innerJoin('i.booking', 'b')
            ->where('b.client = :client')
            ->setParameter('client', $this->getUser())
            ->orderBy('i.createdAt', 'DESC')
            ->getQuery()->getResult();

        return $this->json(array_map([$this, 'serializeInvoice'], $invoices));
    }

    /**
     * GET /api/invoices/stats
     */
    #[Route('/stats', name: 'api_invoices_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $thisMonth = new \DateTime('first day of this month');

        $monthRevenue = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.amountTtc), 0)')
            ->where('i.status = :paid AND i.paidAt >= :month')
            ->setParameter('paid', InvoiceStatus::PAID->value)
            ->setParameter('month', $thisMonth)
            ->getQuery()->getSingleScalarResult();

        $pendingAmount = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COALESCE(SUM(i.amountTtc), 0)')
            ->where('i.status = :pending')
            ->setParameter('pending', InvoiceStatus::PENDING->value)
            ->getQuery()->getSingleScalarResult();

        $statusCounts = [];
        foreach (InvoiceStatus::cases() as $status) {
            $statusCounts[$status->value] = $this->invoiceRepository->count(['status' => $status->value]);
        }

        $overdueInvoices = (int) $this->invoiceRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.status = :pending AND i.dueDate < :today')
            ->setParameter('pending', InvoiceStatus::PENDING->value)
            ->setParameter('today', new \DateTime('today'))
            ->getQuery()->getSingleScalarResult();

        return $this->json([
            'monthRevenue'   => (float)($monthRevenue ?? 0),
            'pendingAmount'  => (float)($pendingAmount ?? 0),
            'statusCounts'   => $statusCounts,
            'overdueInvoices'=> $overdueInvoices,
        ]);
    }

    /**
     * GET /api/invoices/export
     */
    #[Route('/export', name: 'api_invoices_export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $qb = $this->invoiceRepository->createQueryBuilder('i')->orderBy('i.createdAt', 'DESC');

        $startDate = $request->query->get('start_date');
        $endDate   = $request->query->get('end_date');

        if ($startDate && $endDate) {
            $qb->where('i.createdAt BETWEEN :start AND :end')
               ->setParameter('start', new \DateTime($startDate))
               ->setParameter('end', new \DateTime($endDate));
        }

        $invoices = $qb->getQuery()->getResult();

        $csv = "Numéro,Date d'émission,Client,Service,Montant,Statut,Date de paiement\n";
        foreach ($invoices as $invoice) {
            $booking = $invoice->getBooking();
            $csv .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s"' . "\n",
                $invoice->getInvoiceNumber(),
                $invoice->getCreatedAt()?->format('Y-m-d') ?? 'N/A',
                $booking->getClient()->getEmail(),
                $booking->getService()->getName(),
                $invoice->getAmountTtc() ?? $invoice->getAmountHt(),
                $invoice->getStatus(),
                $invoice->getPaidAt() ? $invoice->getPaidAt()->format('Y-m-d') : 'N/A'
            );
        }

        $response = new Response($csv);
        $response->headers->set('Content-Type', 'text/csv; charset=UTF-8');
        $response->headers->set('Content-Disposition', 'attachment; filename="factures-export-' . date('Y-m-d') . '.csv"');

        return $response;
    }

    // ─────────────────────────────────────────────────────────────────────
    // Privé
    // ─────────────────────────────────────────────────────────────────────

    private function generateInvoiceNumber(): string
    {
        $year     = date('Y');
        $month    = date('m');
        $count    = (int) $this->invoiceRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.invoiceNumber LIKE :prefix')
            ->setParameter('prefix', "INV-{$year}{$month}%")
            ->getQuery()->getSingleScalarResult();

        return 'INV-' . $year . $month . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    }

    private function serializeInvoice(Invoice $i): array
    {
        $booking = $i->getBooking();
        $client  = $booking?->getClient();
        $service = $booking?->getService();

        return [
            'id'            => $i->getId(),
            'invoiceNumber' => $i->getInvoiceNumber(),
            'amountHt'      => $i->getAmountHt(),
            'taxRate'       => $i->getTaxRate(),
            'amountTtc'     => $i->getAmountTtc(),
            'amount'        => $i->getAmountTtc(), // alias rétrocompat
            'status'        => $i->getStatus(),
            'issuedAt'      => $i->getCreatedAt()?->format('c'),  // alias createdAt
            'dueDate'       => $i->getDueDate()?->format('Y-m-d'),
            'paidAt'        => $i->getPaidAt()?->format('c'),
            // paymentMethod non présent sur l'entité Invoice
            'notes'         => $i->getNotes(),
            'booking'       => $booking ? [
                'id'      => $booking->getId(),
                'client'  => $client ? [
                    'id'        => $client->getId(),
                    'firstName' => $client->getFirstName(),
                    'lastName'  => $client->getLastName(),
                    'email'     => $client->getEmail(),
                ] : null,
                'service' => $service ? [
                    'id'   => $service->getId(),
                    'name' => $service->getName(),
                ] : null,
            ] : null,
        ];
    }
}
