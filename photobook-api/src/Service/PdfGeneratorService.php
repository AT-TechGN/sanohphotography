<?php

namespace App\Service;

use App\Entity\Invoice;
use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;

/**
 * Service de génération de PDF pour les factures
 */
class PdfGeneratorService
{
    public function __construct(
        private Environment $twig
    ) {}

    /**
     * Générer une facture en PDF
     */
    public function generateInvoicePdf(Invoice $invoice): string
    {
        // Configuration de dompdf
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        $pdfOptions->setIsRemoteEnabled(true);

        $dompdf = new Dompdf($pdfOptions);

        // Générer le HTML depuis le template Twig
        $html = $this->twig->render('pdf/invoice.html.twig', [
            'invoice' => $invoice,
        ]);

        // Charger le HTML
        $dompdf->loadHtml($html);

        // Format A4, portrait
        $dompdf->setPaper('A4', 'portrait');

        // Rendre le PDF
        $dompdf->render();

        // Retourner le contenu du PDF
        return $dompdf->output();
    }

    /**
     * Générer un devis en PDF
     */
    public function generateQuotePdf(Invoice $invoice): string
    {
        $pdfOptions = new Options();
        $pdfOptions->set('defaultFont', 'Arial');
        $pdfOptions->setIsRemoteEnabled(true);

        $dompdf = new Dompdf($pdfOptions);

        $html = $this->twig->render('pdf/quote.html.twig', [
            'invoice' => $invoice,
        ]);

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
