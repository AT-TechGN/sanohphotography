<?php

namespace App\Service;

use App\Entity\Invoice;
use Dompdf\Dompdf;
use Dompdf\Options;
use Twig\Environment;

/**
 * Génère des PDFs de factures style ticket boutique
 * Utilise dompdf + template Twig
 */
class PdfGeneratorService
{
    public function __construct(
        private Environment $twig
    ) {}

    /**
     * Générer une facture PDF — format A5 portrait (style ticket boutique)
     */
    public function generateInvoicePdf(Invoice $invoice): string
    {
        $options = new Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false); // sécurité : pas de ressources externes
        $options->set('dpi', 150);
        $options->set('isFontSubsettingEnabled', true);

        $dompdf = new Dompdf($options);

        $html = $this->twig->render('pdf/invoice.html.twig', [
            'invoice' => $invoice,
        ]);

        $dompdf->loadHtml($html, 'UTF-8');

        // Format A5 portrait — idéal pour un ticket facture compact
        $dompdf->setPaper('A5', 'portrait');

        $dompdf->render();

        return $dompdf->output();
    }

    /**
     * Générer un devis PDF
     */
    public function generateQuotePdf(Invoice $invoice): string
    {
        $options = new Options();
        $options->set('defaultFont', 'Arial');
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', false);
        $options->set('dpi', 150);

        $dompdf = new Dompdf($options);

        $html = $this->twig->render('pdf/invoice.html.twig', [
            'invoice' => $invoice,
        ]);

        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A5', 'portrait');
        $dompdf->render();

        return $dompdf->output();
    }
}
