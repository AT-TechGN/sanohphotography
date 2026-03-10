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

#[Route('/api/invoices')]
final class InvoiceController extends AbstractController
{
    public function __construct(
        private InvoiceRepository $invoiceRepository,
        private BookingRepository $bookingRepository,
        private PdfGeneratorService $pdfGenerator,
        private EntityManagerInterface $em,
        private ValidatorInterface $validator
    ) {}

    /**
     * Créer une facture pour une réservation
     */
    #[Route('', name: 'api_invoice_create', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $data = json_decode($request->getContent(), true);

        if (!isset($data['booking_id'])) {
            return $this->json(['error' => 'Le champ booking_id est requis'], Response::HTTP_BAD_REQUEST);
        }

        $booking = $this->bookingRepository->find($data['booking_id']);
        if (!$booking) {
            return $this->json(['error' => 'Réservation non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier si une facture existe déjà
        $existingInvoice = $this->invoiceRepository->findOneBy(['booking' => $booking]);
        if ($existingInvoice) {
            return $this->json(['error' => 'Une facture existe déjà pour cette réservation'], Response::HTTP_CONFLICT);
        }

        // Générer le numéro de facture
        $invoiceNumber = $this->generateInvoiceNumber();

        $invoice = new Invoice();
        $invoice->setBooking($booking);
        $invoice->setInvoiceNumber($invoiceNumber);
        $invoice->setAmount($data['amount'] ?? $booking->getTotalPrice());
        $invoice->setStatus(InvoiceStatus::PENDING->value);
        $invoice->setDueDate(new \DateTime($data['due_date'] ?? '+30 days'));
        $invoice->setNotes($data['notes'] ?? null);
        $invoice->setIssuedAt(new \DateTime());

        // Validation
        $errors = $this->validator->validate($invoice);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($invoice);
        $this->em->flush();

        return $this->json([
            'message' => 'Facture créée avec succès',
            'invoice' => $invoice
        ], Response::HTTP_CREATED, [], [
            'groups' => ['invoice:read']
        ]);
    }

    /**
     * Télécharger une facture en PDF
     */
    #[Route('/{id}/pdf', name: 'api_invoice_download_pdf', methods: ['GET'])]
    public function downloadPdf(int $id): Response
    {
        $invoice = $this->invoiceRepository->find($id);
        
        if (!$invoice) {
            return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier les permissions
        $user = $this->getUser();
        $isOwner = $invoice->getBooking()->getClient() === $user;
        $isAdmin = $this->isGranted('ROLE_ADMIN');

        if (!$isOwner && !$isAdmin) {
            return $this->json(['error' => 'Accès refusé'], Response::HTTP_FORBIDDEN);
        }

        // Générer le PDF
        $pdfContent = $this->pdfGenerator->generateInvoicePdf($invoice);

        // Retourner le PDF en téléchargement
        $response = new Response($pdfContent);
        $response->headers->set('Content-Type', 'application/pdf');
        $response->headers->set('Content-Disposition', 'attachment; filename="facture-' . $invoice->getInvoiceNumber() . '.pdf"');

        return $response;
    }

    /**
     * Marquer une facture comme payée
     */
    #[Route('/{id}/mark-paid', name: 'api_invoice_mark_paid', methods: ['PATCH'])]
    public function markPaid(int $id, Request $request): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $invoice = $this->invoiceRepository->find($id);
        
        if (!$invoice) {
            return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);
        }

        if ($invoice->getStatus() !== InvoiceStatus::PENDING->value) {
            return $this->json([
                'error' => 'Seules les factures en attente peuvent être marquées comme payées'
            ], Response::HTTP_BAD_REQUEST);
        }

        $data = json_decode($request->getContent(), true);

        $invoice->setStatus(InvoiceStatus::PAID->value);
        $invoice->setPaidAt(new \DateTime());
        $invoice->setPaymentMethod($data['payment_method'] ?? null);
        $this->em->flush();

        return $this->json([
            'message' => 'Facture marquée comme payée',
            'invoice' => $invoice
        ], Response::HTTP_OK, [], [
            'groups' => ['invoice:read']
        ]);
    }

    /**
     * Annuler une facture
     */
    #[Route('/{id}/cancel', name: 'api_invoice_cancel', methods: ['PATCH'])]
    public function cancel(int $id): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $invoice = $this->invoiceRepository->find($id);
        
        if (!$invoice) {
            return $this->json(['error' => 'Facture non trouvée'], Response::HTTP_NOT_FOUND);
        }

        $statusEnum = InvoiceStatus::from($invoice->getStatus());
        if (!$statusEnum->canBeCancelled()) {
            return $this->json([
                'error' => 'Cette facture ne peut pas être annulée'
            ], Response::HTTP_BAD_REQUEST);
        }

        $invoice->setStatus(InvoiceStatus::CANCELLED->value);
        $this->em->flush();

        return $this->json([
            'message' => 'Facture annulée',
            'invoice' => $invoice
        ], Response::HTTP_OK, [], [
            'groups' => ['invoice:read']
        ]);
    }

    /**
     * Obtenir les factures d'un client
     */
    #[Route('/my-invoices', name: 'api_my_invoices', methods: ['GET'])]
    public function getMyInvoices(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_CLIENT');

        $invoices = $this->invoiceRepository->createQueryBuilder('i')
            ->innerJoin('i.booking', 'b')
            ->where('b.client = :client')
            ->setParameter('client', $this->getUser())
            ->orderBy('i.issuedAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->json($invoices, Response::HTTP_OK, [], [
            'groups' => ['invoice:read']
        ]);
    }

    /**
     * Statistiques des factures
     */
    #[Route('/stats', name: 'api_invoices_stats', methods: ['GET'])]
    public function getStats(): JsonResponse
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        // Total facturé ce mois
        $thisMonth = new \DateTime('first day of this month');
        $monthRevenue = $this->invoiceRepository->createQueryBuilder('i')
            ->select('SUM(i.amount)')
            ->where('i.status = :paid')
            ->andWhere('i.paidAt >= :month')
            ->setParameter('paid', InvoiceStatus::PAID->value)
            ->setParameter('month', $thisMonth)
            ->getQuery()
            ->getSingleScalarResult();

        // Total en attente
        $pendingAmount = $this->invoiceRepository->createQueryBuilder('i')
            ->select('SUM(i.amount)')
            ->where('i.status = :pending')
            ->setParameter('pending', InvoiceStatus::PENDING->value)
            ->getQuery()
            ->getSingleScalarResult();

        // Nombre de factures par statut
        $statusCounts = [];
        foreach (InvoiceStatus::cases() as $status) {
            $count = $this->invoiceRepository->count(['status' => $status->value]);
            $statusCounts[$status->value] = $count;
        }

        // Factures en retard
        $overdueInvoices = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.status = :pending')
            ->andWhere('i.dueDate < :today')
            ->setParameter('pending', InvoiceStatus::PENDING->value)
            ->setParameter('today', new \DateTime('today'))
            ->getQuery()
            ->getSingleScalarResult();

        return $this->json([
            'monthRevenue' => (float) ($monthRevenue ?? 0),
            'pendingAmount' => (float) ($pendingAmount ?? 0),
            'statusCounts' => $statusCounts,
            'overdueInvoices' => (int) $overdueInvoices
        ]);
    }

    /**
     * Exporter les factures en CSV
     */
    #[Route('/export', name: 'api_invoices_export', methods: ['GET'])]
    public function export(Request $request): Response
    {
        $this->denyAccessUnlessGranted('ROLE_ADMIN');

        $startDate = $request->query->get('start_date');
        $endDate = $request->query->get('end_date');

        $qb = $this->invoiceRepository->createQueryBuilder('i')
            ->orderBy('i.issuedAt', 'DESC');

        if ($startDate && $endDate) {
            try {
                $start = new \DateTime($startDate);
                $end = new \DateTime($endDate);
                
                $qb->where('i.issuedAt BETWEEN :start AND :end')
                   ->setParameter('start', $start)
                   ->setParameter('end', $end);
            } catch (\Exception $e) {
                return $this->json(['error' => 'Format de date invalide'], Response::HTTP_BAD_REQUEST);
            }
        }

        $invoices = $qb->getQuery()->getResult();

        // Générer le CSV
        $csv = "Numéro,Date d'émission,Client,Service,Montant,Statut,Date de paiement\n";
        
        foreach ($invoices as $invoice) {
            $booking = $invoice->getBooking();
            $csv .= sprintf(
                '"%s","%s","%s","%s","%s","%s","%s"' . "\n",
                $invoice->getInvoiceNumber(),
                $invoice->getIssuedAt()->format('Y-m-d'),
                $booking->getClient()->getEmail(),
                $booking->getService()->getName(),
                $invoice->getAmount(),
                $invoice->getStatus(),
                $invoice->getPaidAt() ? $invoice->getPaidAt()->format('Y-m-d') : 'N/A'
            );
        }

        $response = new Response($csv);
        $response->headers->set('Content-Type', 'text/csv');
        $response->headers->set('Content-Disposition', 'attachment; filename="factures-export-' . date('Y-m-d') . '.csv"');

        return $response;
    }

    /**
     * Générer un numéro de facture unique
     */
    private function generateInvoiceNumber(): string
    {
        $year = date('Y');
        $month = date('m');
        
        // Compter les factures du mois
        $count = $this->invoiceRepository->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.invoiceNumber LIKE :prefix')
            ->setParameter('prefix', "INV-{$year}{$month}%")
            ->getQuery()
            ->getSingleScalarResult();

        $sequence = str_pad($count + 1, 4, '0', STR_PAD_LEFT);
        
        return "INV-{$year}{$month}{$sequence}";
    }
}
